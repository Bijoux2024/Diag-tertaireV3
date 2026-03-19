'use strict';

/**
 * api/public-report-pdf.js — Route canonique du rapport public PDF
 *
 * Reçoit { lead_submission_id, report_payload } depuis le front.
 * Génère le HTML server-side, produit le PDF via Puppeteer,
 * stocke dans public-report-assets, trace le statut dans public_reports,
 * met à jour lead_submissions.pdf_url, envoie l'email Resend.
 *
 * pdf_status : pending → generating → ready | failed
 * Bucket     : public-report-assets (privé)
 * Path       : reports/{year}/{month}/{public_report_id}/official.pdf
 * Table      : public.public_reports
 */

const { DEFAULT_MAX_HTML_LENGTH, renderPdfFromHtml } = require('./_lib/pdf-renderer');
const { getRequiredServerSupabaseConfig } = require('./_lib/supabase-server');

const PUBLIC_REPORT_ASSETS_BUCKET = 'public-report-assets';
const SIGNED_URL_TTL_SECONDS = 60 * 60 * 24 * 30; // 30 days

// ─── Helpers ──────────────────────────────────────────────────────────────────

const safeJsonParse = (value) => {
  if (typeof value !== 'string') return value;
  try { return JSON.parse(value); } catch { return null; }
};

const asPlainObject = (value) =>
  value && typeof value === 'object' && !Array.isArray(value) ? value : {};

const asArray = (value) => Array.isArray(value) ? value : [];

const toNumber = (value, fallback = 0) => {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
};

const readEnv = (key) => String(process.env[key] || '').trim();

const encodeQueryValue = (value) => encodeURIComponent(String(value ?? ''));

const encodeStoragePath = (value) =>
  String(value || '').split('/').map((s) => encodeURIComponent(s)).join('/');

const escapeHtml = (value) =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const sanitizeFileSegment = (value, fallback = 'rapport') => {
  const normalized = String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^\w.-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  return normalized || fallback;
};

const createHttpError = (statusCode, message) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const formatCurrency = (value) =>
  `${Math.round(toNumber(value, 0)).toLocaleString('fr-FR')} EUR`;

const formatInteger = (value, suffix = '') => {
  const formatted = Math.round(toNumber(value, 0)).toLocaleString('fr-FR');
  return suffix ? `${formatted} ${suffix}` : formatted;
};

const formatDateLabel = (value) => {
  const date = value ? new Date(value) : new Date();
  if (Number.isNaN(date.getTime())) return String(value || '');
  return date.toLocaleString('fr-FR', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit'
  });
};

const createRestHeaders = (serviceKey, extraHeaders = {}) => ({
  apikey: serviceKey,
  Authorization: `Bearer ${serviceKey}`,
  ...extraHeaders
});

// ─── Score helpers ─────────────────────────────────────────────────────────────

const getScoreConfig = (score) => {
  const normalized = String(score || 'C').trim().toUpperCase();
  const map = {
    A: { score: 'A', label: 'Tres performant',  color: '#16A34A', background: '#DCFCE7' },
    B: { score: 'B', label: 'Performant',        color: '#22C55E', background: '#E8F5E9' },
    C: { score: 'C', label: 'Dans la mediane',   color: '#F59E0B', background: '#FEF3C7' },
    D: { score: 'D', label: 'Surconsommation',   color: '#F97316', background: '#FFF7ED' },
    E: { score: 'E', label: 'Tres energivore',   color: '#EF4444', background: '#FEE2E2' }
  };
  return map[normalized] || map.C;
};

const computeScoreFromIntensity = (siteIntensity, benchmarkMedian) => {
  const intensity = toNumber(siteIntensity, 0);
  const median = Math.max(1, toNumber(benchmarkMedian, 0));
  const ratio = intensity / median;
  if (ratio < 0.6) return 'A';
  if (ratio < 0.9) return 'B';
  if (ratio < 1.2) return 'C';
  if (ratio < 1.7) return 'D';
  return 'E';
};

// ─── Storage path ──────────────────────────────────────────────────────────────

const buildStoragePath = (publicReportId) => {
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, '0');
  const safeId = sanitizeFileSegment(String(publicReportId || 'report'), 'report');
  return `reports/${year}/${month}/${safeId}/official.pdf`;
};

// ─── Storage operations ────────────────────────────────────────────────────────

const uploadPdfToStorage = async ({ supabaseUrl, serviceKey, storagePath, pdfBuffer }) => {
  const response = await fetch(
    `${supabaseUrl}/storage/v1/object/${PUBLIC_REPORT_ASSETS_BUCKET}/${encodeStoragePath(storagePath)}`,
    {
      method: 'POST',
      headers: createRestHeaders(serviceKey, {
        'Content-Type': 'application/pdf',
        'x-upsert': 'true'
      }),
      body: pdfBuffer
    }
  );
  const rawText = await response.text();
  const data = rawText ? safeJsonParse(rawText) : null;
  if (!response.ok) {
    throw createHttpError(response.status, data?.message || data?.error || rawText || 'Storage upload failed');
  }
  return data;
};

const createSignedUrl = async ({ supabaseUrl, serviceKey, storagePath, expiresIn = SIGNED_URL_TTL_SECONDS }) => {
  const response = await fetch(
    `${supabaseUrl}/storage/v1/object/sign/${PUBLIC_REPORT_ASSETS_BUCKET}/${encodeStoragePath(storagePath)}`,
    {
      method: 'POST',
      headers: createRestHeaders(serviceKey, { 'Content-Type': 'application/json' }),
      body: JSON.stringify({ expiresIn })
    }
  );
  const rawText = await response.text();
  const data = rawText ? safeJsonParse(rawText) : null;
  if (!response.ok) {
    throw createHttpError(response.status, data?.message || data?.error || rawText || 'Signed URL creation failed');
  }
  const signedPath = data?.signedURL || data?.signedUrl || data?.signed_url || data?.path || '';
  if (!signedPath) throw createHttpError(500, 'Signed URL response missing path');
  const reportUrl = /^https?:\/\//i.test(signedPath)
    ? signedPath
    : `${supabaseUrl}${signedPath.startsWith('/') ? '' : '/'}${signedPath}`;
  return {
    reportUrl,
    expiresAt: new Date(Date.now() + expiresIn * 1000).toISOString()
  };
};

// ─── Database ──────────────────────────────────────────────────────────────────

const supabaseRestFetch = async (supabaseUrl, serviceKey, path, options = {}) => {
  const response = await fetch(`${supabaseUrl}/rest/v1/${path}`, {
    method: options.method || 'GET',
    headers: createRestHeaders(serviceKey, options.headers || {}),
    body: options.body
  });
  const rawText = await response.text();
  const data = rawText ? safeJsonParse(rawText) : null;
  if (!response.ok) {
    const message = data?.message || data?.error_description || rawText || `HTTP ${response.status}`;
    throw createHttpError(response.status, message);
  }
  return data;
};

const insertPublicReport = async ({ supabaseUrl, serviceKey, payload }) => {
  const response = await fetch(`${supabaseUrl}/rest/v1/public_reports`, {
    method: 'POST',
    headers: createRestHeaders(serviceKey, {
      'Content-Type': 'application/json',
      Prefer: 'return=representation'
    }),
    body: JSON.stringify(payload)
  });
  const rawText = await response.text();
  const data = rawText ? safeJsonParse(rawText) : null;
  if (!response.ok) {
    throw createHttpError(response.status, data?.message || data?.error || rawText || 'Insert public_reports failed');
  }
  return Array.isArray(data) ? data[0] : data;
};

const updatePublicReport = async ({ supabaseUrl, serviceKey, publicReportId, patch }) => {
  try {
    await supabaseRestFetch(
      supabaseUrl, serviceKey,
      `public_reports?id=eq.${encodeQueryValue(publicReportId)}`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Prefer: 'return=minimal' },
        body: JSON.stringify({ ...patch, updated_at: new Date().toISOString() })
      }
    );
  } catch (err) {
    console.warn('[public-report-pdf] updatePublicReport failed:', err.message);
  }
};

const updateLeadSubmissionPdfUrl = async ({ supabaseUrl, serviceKey, leadSubmissionId, pdfUrl, expiresAt }) => {
  if (!leadSubmissionId) return;
  try {
    await supabaseRestFetch(
      supabaseUrl, serviceKey,
      `lead_submissions?id=eq.${encodeQueryValue(leadSubmissionId)}`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Prefer: 'return=minimal' },
        body: JSON.stringify({ pdf_url: pdfUrl, pdf_expires_at: expiresAt })
      }
    );
  } catch (err) {
    console.warn('[public-report-pdf] updateLeadSubmissionPdfUrl failed:', err.message);
  }
};

// ─── Email ────────────────────────────────────────────────────────────────────

const sendPdfReadyEmail = async ({
  email, siteName, activity, surface, scoreLettre, economiesTotalesAnnuelles, pdfUrl
}) => {
  const resendApiKey = readEnv('RESEND_API_KEY');
  const resendFrom = readEnv('RESEND_FROM');
  if (!resendApiKey || !resendFrom) {
    console.warn('[public-report-pdf] Missing Resend config — email skipped');
    return;
  }

  const buildingName = siteName || 'Votre bâtiment';
  const scoreLabel = scoreLettre ? `Indice ${scoreLettre}` : 'Indice en cours de calcul';
  const activityLabel = activity || 'Activité à confirmer';
  const surfaceLabel = surface ? `${surface} m²` : 'Surface non renseignée';
  const savingsLabel = formatCurrency(economiesTotalesAnnuelles || 0);
  const safePdfUrl = escapeHtml(pdfUrl || '#');

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${resendApiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: resendFrom,
      to: [email],
      subject: 'Votre rapport DiagTertiaire est disponible',
      html: `
        <div style="font-family:Arial,sans-serif;background:#F8FAFC;padding:24px;color:#0F172A;">
          <div style="max-width:640px;margin:0 auto;background:#FFFFFF;border:1px solid #E2E8F0;border-radius:20px;overflow:hidden;">
            <div style="padding:24px 28px;background:linear-gradient(135deg,#102A43 0%,#1D4ED8 100%);color:#FFFFFF;">
              <div style="font-size:12px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;opacity:0.8;">DiagTertiaire</div>
              <h1 style="margin:10px 0 0;font-size:28px;line-height:1.1;">Votre rapport est disponible</h1>
            </div>
            <div style="padding:28px;">
              <p style="margin:0 0 8px;font-size:15px;line-height:1.7;">📄 Votre rapport PDF est prêt.</p>
              <div style="display:grid;gap:12px;margin-bottom:24px;">
                <div style="padding:14px 16px;border:1px solid #E2E8F0;border-radius:14px;background:#F8FAFC;"><strong>Bâtiment</strong><br>${escapeHtml(buildingName)}</div>
                <div style="padding:14px 16px;border:1px solid #E2E8F0;border-radius:14px;background:#F8FAFC;"><strong>Activité</strong><br>${escapeHtml(activityLabel)}</div>
                <div style="padding:14px 16px;border:1px solid #E2E8F0;border-radius:14px;background:#F8FAFC;"><strong>Surface</strong><br>${escapeHtml(surfaceLabel)}</div>
                <div style="padding:14px 16px;border:1px solid #E2E8F0;border-radius:14px;background:#F8FAFC;"><strong>Indice DiagTertiaire</strong><br>${escapeHtml(scoreLabel)}</div>
                <div style="padding:14px 16px;border:1px solid #E2E8F0;border-radius:14px;background:#F8FAFC;"><strong>Économies annuelles estimées</strong><br>${escapeHtml(savingsLabel)}</div>
              </div>
              <a href="${safePdfUrl}" style="display:inline-block;padding:14px 20px;border-radius:12px;background:#1D4ED8;color:#FFFFFF;text-decoration:none;font-weight:700;">Télécharger mon rapport PDF</a>
              <p style="margin:16px 0 0;font-size:12px;color:#94A3B8;">Ce lien est valable 30 jours.</p>
            </div>
          </div>
        </div>`,
      text: `Bonjour,\n\nVotre rapport DiagTertiaire est disponible.\nBâtiment : ${buildingName}\nActivité : ${activityLabel}\nSurface : ${surfaceLabel}\nIndice : ${scoreLabel}\nÉconomies : ${savingsLabel}\n\nTélécharger : ${pdfUrl || ''}\n\nCe lien est valable 30 jours.`
    })
  });

  if (!response.ok) {
    const rawText = await response.text();
    console.warn('[public-report-pdf] Email delivery failed:', response.status, rawText.slice(0, 300));
  }
};

// ─── View model ────────────────────────────────────────────────────────────────

const buildBudgetSummary = (actions = [], annualSavingsEuro = 0) => {
  const capexBrut = asArray(actions).reduce((sum, a) => sum + toNumber(a?.capex?.value, 0), 0);
  const annualSavings = Math.max(0, Math.round(toNumber(annualSavingsEuro, 0)));
  const aides = Math.round(capexBrut * 0.12);
  const capexNet = Math.max(0, Math.round(capexBrut - aides));
  const roi = annualSavings > 0 ? capexNet / annualSavings : null;
  return {
    capexBrut: Math.round(capexBrut),
    aides,
    capexNet,
    annualSavings,
    roiYears: roi !== null ? Math.round(roi * 10) / 10 : null
  };
};

const buildPublicReportViewModel = (reportPayload, leadSubmissionId) => {
  const payload = asPlainObject(reportPayload);
  const inputsSummary = asPlainObject(payload.inputs_summary);
  const calc = asPlainObject(payload.calculation_results);
  const benchmark = asPlainObject(payload.benchmark_result);
  const composite = asPlainObject(payload.composite_savings);
  const confidence = asPlainObject(payload.confidence);
  const actions = asArray(payload.top_actions).slice(0, 6);
  const assumptions = asArray(payload.assumptions).slice(0, 6);
  const limits = asArray(payload.limits).slice(0, 6);

  const siteName = String(inputsSummary.site_name || 'Batiment diagnostique').trim() || 'Batiment diagnostique';
  const activity = String(inputsSummary.activity || 'Activite a confirmer').trim() || 'Activite a confirmer';
  const address = String(inputsSummary.address || '').trim();
  const role = String(inputsSummary.role || inputsSummary.decision_role || '').trim() || 'Partie prenante';
  const email = String(inputsSummary.email || '').trim();
  const surface = toNumber(inputsSummary.surface?.value || inputsSummary.surface, 0);
  const siteIntensity = toNumber(benchmark.site_intensity?.value, 0);
  const benchmarkMedian = toNumber(benchmark.benchmark_median?.value, 0);
  const annualSavingsKwh = toNumber(composite.annual_kwh?.value, 0);
  const annualSavingsEuro = toNumber(composite.annual_euro?.value, 0);
  const totalCostEuro = toNumber(calc.total_cost_euro_an?.value, 0);
  const score = computeScoreFromIntensity(siteIntensity, benchmarkMedian);
  const targetIntensity = Math.max(0, Math.round(siteIntensity - (surface > 0 ? annualSavingsKwh / surface : 0)));
  const targetScore = computeScoreFromIntensity(targetIntensity, benchmarkMedian);
  const budget = buildBudgetSummary(actions, annualSavingsEuro);

  return {
    leadSubmissionId,
    reportId: String(payload.report_id || '').trim(),
    generatedAt: payload.generated_at || new Date().toISOString(),
    siteName,
    activity,
    address,
    email,
    role,
    surface,
    score: getScoreConfig(score),
    targetScore: getScoreConfig(targetScore),
    confidenceLabel: String(confidence.label || 'Moyen').trim() || 'Moyen',
    confidenceLevel: String(confidence.level || 'medium').trim() || 'medium',
    siteIntensity,
    benchmarkMedian,
    targetIntensity,
    annualSavingsEuro,
    annualSavingsKwh,
    totalSavingsPct: toNumber(composite.total_pct?.value, 0),
    totalCostEuro,
    actions,
    assumptions,
    limits,
    budget
  };
};

// ─── HTML builder ─────────────────────────────────────────────────────────────

const buildActionTierBadge = (tier) => {
  const map = {
    quick_win:  { label: 'Action rapide', bg: '#F0FDF4', color: '#16A34A', border: '#BBF7D0' },
    equipment:  { label: 'Equipement',    bg: '#EFF6FF', color: '#1D4ED8', border: '#BFDBFE' },
    structural: { label: 'Structurel',    bg: '#FEF3C7', color: '#B45309', border: '#FDE68A' }
  };
  const style = map[tier] || map.equipment;
  return `<span style="display:inline-block;padding:2px 8px;border-radius:20px;font-size:10px;font-weight:700;letter-spacing:0.04em;text-transform:uppercase;background:${style.bg};color:${style.color};border:1px solid ${style.border}">${escapeHtml(style.label)}</span>`;
};

const buildPublicReportPdfHtml = (viewModel) => {
  const scoreColor = viewModel.score.color;
  const targetScoreColor = viewModel.targetScore.color;
  const generatedDate = formatDateLabel(viewModel.generatedAt);

  return `<!DOCTYPE html>
<html lang="fr">
  <head>
    <meta charset="UTF-8" />
    <title>${escapeHtml(`Pre-diagnostic - ${viewModel.siteName}`)}</title>
    <style>
      @page { size: A4; margin: 18mm 16mm 16mm 16mm; }
      * { box-sizing: border-box; }
      body { margin: 0; font-family: 'Helvetica Neue', Arial, sans-serif; background: #F8FAFC; color: #0F172A; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .report-wrap { max-width: 780px; margin: 0 auto; padding: 0 0 32px; }

      .hero { background: linear-gradient(135deg, #0A1928 0%, #1D4ED8 55%, #0F2236 100%); color: #fff; border-radius: 20px; padding: 28px 32px; break-inside: avoid; margin-bottom: 20px; }
      .hero-kicker { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.14em; opacity: 0.6; margin-bottom: 6px; }
      .hero-title { font-size: 26px; font-weight: 900; line-height: 1.1; letter-spacing: -0.5px; margin-bottom: 4px; }
      .hero-meta { font-size: 12px; color: rgba(255,255,255,0.7); line-height: 1.6; margin-bottom: 18px; }
      .hero-body { display: flex; gap: 18px; align-items: stretch; }
      .hero-left { flex: 1; background: rgba(255,255,255,0.09); border-radius: 14px; padding: 18px 20px; border: 1px solid rgba(255,255,255,0.12); }
      .hero-right { width: 140px; flex-shrink: 0; background: ${viewModel.score.background}; border-radius: 14px; padding: 18px 14px; text-align: center; display: flex; flex-direction: column; align-items: center; justify-content: center; }
      .hero-intensity-row { display: flex; gap: 12px; margin-top: 14px; }
      .hero-intensity-card { flex: 1; background: rgba(255,255,255,0.08); border-radius: 10px; padding: 10px 12px; border: 1px solid rgba(255,255,255,0.1); }
      .hi-label { font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: rgba(255,255,255,0.55); margin-bottom: 4px; }
      .hi-val { font-size: 16px; font-weight: 800; color: #fff; line-height: 1; }
      .hi-unit { font-size: 10px; color: rgba(255,255,255,0.6); }
      .score-letter { font-size: 60px; font-weight: 900; color: ${scoreColor}; line-height: 1; margin: 4px 0; }
      .score-label { font-size: 12px; font-weight: 700; color: #0F172A; }
      .score-after { font-size: 10px; color: #64748B; margin-top: 6px; }
      .score-after strong { color: ${targetScoreColor}; font-weight: 800; }

      .kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 20px; break-inside: avoid; }
      .kpi-card { background: #fff; border: 1px solid #E2E8F0; border-radius: 14px; padding: 16px; }
      .kpi-label { font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.08em; color: #64748B; margin-bottom: 8px; }
      .kpi-val { font-size: 20px; font-weight: 900; color: #0F172A; line-height: 1.1; }
      .kpi-sub { font-size: 11px; color: #94A3B8; margin-top: 4px; }
      .kpi-card.kpi-cost .kpi-label { color: #2563EB; }
      .kpi-card.kpi-savings .kpi-label { color: #16A34A; }

      .section { background: #fff; border: 1px solid #E2E8F0; border-radius: 16px; padding: 22px 24px; margin-bottom: 16px; break-inside: avoid; }
      .section-title { font-size: 15px; font-weight: 800; color: #0F172A; margin: 0 0 4px; letter-spacing: -0.2px; }
      .section-sub { font-size: 12px; color: #64748B; margin: 0 0 16px; line-height: 1.5; }

      .actions-grid { display: flex; flex-direction: column; gap: 10px; }
      .action-row { display: flex; align-items: flex-start; gap: 14px; padding: 12px 14px; background: #F8FAFC; border-radius: 12px; border: 1px solid #E2E8F0; break-inside: avoid; }
      .action-num { width: 24px; height: 24px; border-radius: 50%; background: #1D4ED8; color: #fff; font-size: 11px; font-weight: 800; display: flex; align-items: center; justify-content: center; flex-shrink: 0; margin-top: 1px; }
      .action-main { flex: 1; min-width: 0; }
      .action-name { font-size: 13px; font-weight: 700; color: #0F172A; margin-bottom: 4px; }
      .action-stats { display: flex; gap: 16px; font-size: 11px; color: #64748B; flex-wrap: wrap; }
      .action-stat strong { color: #0F172A; font-weight: 700; }

      .budget-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-top: 14px; }
      .budget-card { border-radius: 10px; padding: 12px 14px; border: 1px solid; }
      .budget-label { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 6px; }
      .budget-val { font-size: 18px; font-weight: 900; }

      .bullet-list { margin: 0; padding: 0; list-style: none; display: flex; flex-direction: column; gap: 6px; }
      .bullet-list li { display: flex; align-items: flex-start; gap: 8px; font-size: 12px; color: #475569; line-height: 1.5; }
      .bullet-dot { width: 6px; height: 6px; border-radius: 50%; background: #93C5FD; flex-shrink: 0; margin-top: 5px; }
      .bullet-dot.warn { background: #FCA5A5; }

      .grid-2col { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }

      .footer { text-align: center; font-size: 10px; color: #94A3B8; margin-top: 24px; padding-top: 16px; border-top: 1px solid #E2E8F0; }

      @media print {
        body { background: white; }
        .section, .kpi-card, .action-row { break-inside: avoid; }
        .hero { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      }
    </style>
  </head>
  <body>
    <div class="report-wrap">

      <div class="hero">
        <div class="hero-kicker">Pre-diagnostic energetique tertiaire · DiagTertiaire</div>
        <div class="hero-title">${escapeHtml(viewModel.siteName)}</div>
        <div class="hero-meta">
          ${escapeHtml(viewModel.activity)}${viewModel.surface > 0 ? ` · ${escapeHtml(formatInteger(viewModel.surface, 'm²'))}` : ''} · ${escapeHtml(viewModel.address || 'Adresse non renseignee')} · Genere le ${escapeHtml(generatedDate)}
        </div>
        <div class="hero-body">
          <div class="hero-left">
            <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:rgba(255,255,255,0.55);margin-bottom:6px">Positionnement</div>
            <div style="font-size:14px;color:rgba(255,255,255,0.9);line-height:1.6">
              Intensite energetique <strong style="color:#fff">${escapeHtml(formatInteger(viewModel.siteIntensity))} kWh/m²/an</strong> pour une mediane sectorielle de <strong style="color:#fff">${escapeHtml(formatInteger(viewModel.benchmarkMedian))} kWh/m²/an</strong>.
              Potentiel d'economie estime a <strong style="color:#6EE7B7">${escapeHtml(formatCurrency(viewModel.annualSavingsEuro))}/an</strong>.
            </div>
            <div class="hero-intensity-row">
              <div class="hero-intensity-card">
                <div class="hi-label">Conso actuelle</div>
                <div class="hi-val">${escapeHtml(formatInteger(viewModel.siteIntensity))}</div>
                <div class="hi-unit">kWh/m²/an</div>
              </div>
              <div class="hero-intensity-card">
                <div class="hi-label">Mediane secteur</div>
                <div class="hi-val">${escapeHtml(formatInteger(viewModel.benchmarkMedian))}</div>
                <div class="hi-unit">kWh/m²/an</div>
              </div>
              <div class="hero-intensity-card">
                <div class="hi-label">Cible estimee</div>
                <div class="hi-val">${escapeHtml(formatInteger(viewModel.targetIntensity))}</div>
                <div class="hi-unit">kWh/m²/an</div>
              </div>
              <div class="hero-intensity-card">
                <div class="hi-label">Precision</div>
                <div class="hi-val" style="font-size:13px">${escapeHtml(viewModel.confidenceLabel)}</div>
                <div class="hi-unit">&nbsp;</div>
              </div>
            </div>
          </div>
          <div class="hero-right">
            <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:${scoreColor};margin-bottom:2px">Indice</div>
            <div class="score-letter">${escapeHtml(viewModel.score.score)}</div>
            <div class="score-label">${escapeHtml(viewModel.score.label)}</div>
            <div class="score-after">Apres travaux : <strong>${escapeHtml(viewModel.targetScore.score)}</strong></div>
          </div>
        </div>
      </div>

      <div class="kpi-grid">
        <div class="kpi-card kpi-cost">
          <div class="kpi-label">Facture estimee</div>
          <div class="kpi-val">${escapeHtml(formatCurrency(viewModel.totalCostEuro))}</div>
          <div class="kpi-sub">Charges energie / an</div>
        </div>
        <div class="kpi-card kpi-savings">
          <div class="kpi-label">Economies potentielles</div>
          <div class="kpi-val">${escapeHtml(formatCurrency(viewModel.annualSavingsEuro))}</div>
          <div class="kpi-sub">${escapeHtml(formatInteger(viewModel.annualSavingsKwh, 'kWh'))} evites/an</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-label">Budget net indicatif</div>
          <div class="kpi-val">${escapeHtml(formatCurrency(viewModel.budget.capexNet))}</div>
          <div class="kpi-sub">Aides deduites : ${escapeHtml(formatCurrency(viewModel.budget.aides))}</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-label">Retour sur invest.</div>
          <div class="kpi-val">${viewModel.budget.roiYears !== null ? escapeHtml(`${String(viewModel.budget.roiYears).replace('.', ',')} ans`) : 'A confirmer'}</div>
          <div class="kpi-sub">${escapeHtml(String(viewModel.actions.length))} action(s) consideree(s)</div>
        </div>
      </div>

      <div class="section">
        <div class="section-title">Actions prioritaires recommandees</div>
        <div class="section-sub">Classement par gain economique rapporte au cout. Ordre de grandeur avant audit approfondi.</div>
        <div class="actions-grid">
          ${viewModel.actions.length === 0
            ? '<p style="font-size:13px;color:#64748B">Aucune action prioritaire exploitable avec ce niveau de donnees.</p>'
            : viewModel.actions.map((action, i) => `
            <div class="action-row">
              <div class="action-num">${i + 1}</div>
              <div class="action-main">
                <div class="action-name">${escapeHtml(action.name || 'Action recommandee')}</div>
                <div style="margin-bottom:6px">${buildActionTierBadge(action.tier)}</div>
                <div class="action-stats">
                  <span>Gain : <strong>${escapeHtml(formatCurrency(action.gain_euro_an?.value || 0))}/an</strong></span>
                  <span>Budget : <strong>${escapeHtml(formatCurrency(action.capex?.value || 0))}</strong></span>
                  <span>ROI : <strong>${action.roi_years?.value != null ? escapeHtml(`${String(action.roi_years.value).replace('.', ',')} ans`) : 'A confirmer'}</strong></span>
                </div>
              </div>
            </div>
          `).join('')}
        </div>

        <div class="budget-grid" style="margin-top:18px">
          <div class="budget-card" style="background:#F8FAFC;border-color:#E2E8F0">
            <div class="budget-label" style="color:#64748B">Travaux bruts</div>
            <div class="budget-val" style="color:#0F172A">${escapeHtml(formatCurrency(viewModel.budget.capexBrut))}</div>
          </div>
          <div class="budget-card" style="background:#EFF6FF;border-color:#BFDBFE">
            <div class="budget-label" style="color:#1D4ED8">Aides CEE/MaPrimeRenov</div>
            <div class="budget-val" style="color:#1D4ED8">- ${escapeHtml(formatCurrency(viewModel.budget.aides))}</div>
          </div>
          <div class="budget-card" style="background:#EEF2FF;border-color:#C7D2FE">
            <div class="budget-label" style="color:#4338CA">Reste a charge</div>
            <div class="budget-val" style="color:#4338CA">${escapeHtml(formatCurrency(viewModel.budget.capexNet))}</div>
          </div>
          <div class="budget-card" style="background:#F0FDF4;border-color:#BBF7D0">
            <div class="budget-label" style="color:#16A34A">Economies / an</div>
            <div class="budget-val" style="color:#16A34A">${escapeHtml(formatCurrency(viewModel.budget.annualSavings))}</div>
          </div>
        </div>
      </div>

      <div class="grid-2col">
        <div class="section">
          <div class="section-title">Hypotheses de calcul</div>
          <div class="section-sub" style="margin-bottom:12px">Ces hypotheses peuvent etre ajustees lors d'un audit sur site.</div>
          <ul class="bullet-list">
            ${asArray(viewModel.assumptions).filter((s) => typeof s === 'string' && s.trim()).slice(0, 8).map((item) => `
            <li><span class="bullet-dot"></span><span>${escapeHtml(item)}</span></li>
            `).join('') || '<li><span class="bullet-dot"></span><span>Hypotheses a confirmer sur site.</span></li>'}
          </ul>
        </div>
        <div class="section">
          <div class="section-title">Limites de lecture</div>
          <div class="section-sub" style="margin-bottom:12px">Ce pre-diagnostic est indicatif et non opposable.</div>
          <ul class="bullet-list">
            ${asArray(viewModel.limits).filter((s) => typeof s === 'string' && s.trim()).slice(0, 8).map((item) => `
            <li><span class="bullet-dot warn"></span><span>${escapeHtml(item)}</span></li>
            `).join('') || '<li><span class="bullet-dot warn"></span><span>Limites a confirmer avec un expert.</span></li>'}
          </ul>
        </div>
      </div>

      <div class="footer">
        DiagTertiaire — Pre-diagnostic energetique indicatif non opposable | Rapport ${escapeHtml(viewModel.reportId || 'N/A')} | ${escapeHtml(generatedDate)}<br />
        Ce document est a usage informatif uniquement. Pour un audit certifie, contactez un bureau d'etudes RGE agree.
      </div>

    </div>
  </body>
</html>`;
};

// ─── Handler ───────────────────────────────────────────────────────────────────

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  let publicReportId = null;
  let supabaseCtx = null;

  try {
    const body = safeJsonParse(req.body);
    const payload = asPlainObject(body);
    const leadSubmissionId = String(payload.lead_submission_id || '').trim() || null;
    const reportPayload = asPlainObject(payload.report_payload);

    if (!reportPayload.report_id) {
      throw createHttpError(400, 'Missing report_payload.report_id');
    }

    supabaseCtx = getRequiredServerSupabaseConfig();
    const { supabaseUrl, serviceKey } = supabaseCtx;

    // 1. Fetch lead record for email fallback
    let leadRecord = null;
    if (leadSubmissionId) {
      try {
        const leadRows = await supabaseRestFetch(
          supabaseUrl, serviceKey,
          `lead_submissions?id=eq.${encodeQueryValue(leadSubmissionId)}&select=id,email&limit=1`
        );
        leadRecord = asArray(leadRows)[0] || null;
      } catch (err) {
        console.warn('[public-report-pdf] Lead fetch failed (non-fatal):', err.message);
      }
    }

    const viewModel = buildPublicReportViewModel(reportPayload, leadSubmissionId);
    // Fallback to lead record email if not in report payload
    if (!viewModel.email && leadRecord?.email) {
      viewModel.email = String(leadRecord.email).trim();
    }

    // 2. Insert public_reports row — get id for storage path
    const publicReportRow = await insertPublicReport({
      supabaseUrl,
      serviceKey,
      payload: {
        lead_submission_id: leadSubmissionId || null,
        email: viewModel.email || null,
        site_name: viewModel.siteName || null,
        input_payload: asPlainObject(reportPayload.inputs_summary),
        report_payload: reportPayload,
        pdf_status: 'generating',
        updated_at: new Date().toISOString()
      }
    });
    publicReportId = publicReportRow?.id || null;

    // 3. Determine storage path
    const storagePath = buildStoragePath(publicReportId || viewModel.reportId);

    // 4. Generate HTML then PDF
    const html = buildPublicReportPdfHtml(viewModel);
    const pdfBuffer = await renderPdfFromHtml(html, {
      maxHtmlLength: DEFAULT_MAX_HTML_LENGTH,
      timeoutMs: 45_000
    });

    // 5. Upload to public-report-assets
    await uploadPdfToStorage({ supabaseUrl, serviceKey, storagePath, pdfBuffer });

    // 6. Create signed URL (30 days)
    const { reportUrl, expiresAt } = await createSignedUrl({ supabaseUrl, serviceKey, storagePath });

    // 7. Update public_reports: pdf_status = ready
    if (publicReportId) {
      await updatePublicReport({
        supabaseUrl, serviceKey, publicReportId,
        patch: {
          pdf_status: 'ready',
          pdf_error: null,
          latest_pdf_bucket: PUBLIC_REPORT_ASSETS_BUCKET,
          latest_pdf_path: storagePath,
          latest_pdf_generated_at: new Date().toISOString()
        }
      });
    }

    // 8. Update lead_submissions.pdf_url (best-effort)
    await updateLeadSubmissionPdfUrl({
      supabaseUrl, serviceKey, leadSubmissionId, pdfUrl: reportUrl, expiresAt
    });

    // 9. Send email (fire and forget)
    if (viewModel.email) {
      sendPdfReadyEmail({
        email: viewModel.email,
        siteName: viewModel.siteName,
        activity: viewModel.activity,
        surface: viewModel.surface > 0 ? Math.round(viewModel.surface) : null,
        scoreLettre: viewModel.score.score,
        economiesTotalesAnnuelles: viewModel.annualSavingsEuro,
        pdfUrl: reportUrl
      }).catch((err) => console.warn('[public-report-pdf] Email error:', err.message));
    }

    return res.status(200).json({
      ok: true,
      public_report_id: publicReportId,
      lead_submission_id: leadSubmissionId || null,
      report_url: reportUrl,
      pdf_url: reportUrl, // backwards-compat alias
      expires_at: expiresAt,
      storage_path: storagePath,
      bucket: PUBLIC_REPORT_ASSETS_BUCKET
    });

  } catch (error) {
    // Mark public_reports row as failed if it was created
    if (publicReportId && supabaseCtx) {
      updatePublicReport({
        supabaseUrl: supabaseCtx.supabaseUrl,
        serviceKey: supabaseCtx.serviceKey,
        publicReportId,
        patch: {
          pdf_status: 'failed',
          pdf_error: String(error?.message || 'Unknown error').slice(0, 500)
        }
      }).catch(() => {});
    }

    const statusCode = Number.isInteger(error?.statusCode) ? error.statusCode : 500;
    console.error('[public-report-pdf] Error:', error?.message || error);
    return res.status(statusCode).json({
      ok: false,
      error: error?.message || 'Public report PDF generation failed'
    });
  }
};
