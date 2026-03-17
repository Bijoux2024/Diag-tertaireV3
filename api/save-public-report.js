'use strict';

/**
 * api/save-public-report.js
 *
 * Génère un PDF du rapport public à partir du HTML envoyé par le front,
 * l'uploade dans le bucket Supabase Storage "public-reports",
 * génère une URL signée valide 15 jours, stocke les metadata en base,
 * met à jour lead_submissions.pdf_url, et envoie l'email de notification via Resend.
 *
 * Variables d'environnement requises :
 *   SUPABASE_URL, SUPABASE_SERVICE_KEY
 *   RESEND_API_KEY, RESEND_FROM
 *   ADMIN_EMAIL (optionnel)
 *
 * POST body : { html, filename, email, reportMeta }
 *   reportMeta : { reportId, siteName, activity, surface, scoreLettre,
 *                  economiesTotalesAnnuelles, leadSubmissionId }
 */

const { DEFAULT_MAX_HTML_LENGTH, renderPdfFromHtml } = require('./_lib/pdf-renderer');
const { getRequiredServerSupabaseConfig } = require('./_lib/supabase-server');

const PUBLIC_REPORTS_BUCKET = 'public-reports';
const SIGNED_URL_EXPIRY_SECONDS = 15 * 24 * 60 * 60; // 1 296 000 s
const MAX_HTML_LENGTH = DEFAULT_MAX_HTML_LENGTH;

// ─── Utilitaires ──────────────────────────────────────────────────────────────

const safeJsonParse = (value) => {
  if (typeof value !== 'string') return value;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
};

const asPlainObject = (value) =>
  value && typeof value === 'object' && !Array.isArray(value) ? value : {};

const readEnv = (key) => String(process.env[key] || '').trim();

const encodeStoragePath = (path) =>
  String(path || '')
    .split('/')
    .map((segment) => encodeURIComponent(segment))
    .join('/');

const sanitizeSegment = (value, fallback = 'rapport') => {
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

const createRestHeaders = (serviceKey, extra = {}) => ({
  apikey: serviceKey,
  Authorization: `Bearer ${serviceKey}`,
  ...extra
});

const escapeHtml = (value) =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const formatCurrency = (value) => {
  const n = Number(value || 0);
  return Number.isFinite(n) ? `${n.toLocaleString('fr-FR')} EUR` : '0 EUR';
};

// ─── Storage ──────────────────────────────────────────────────────────────────

const uploadToPublicBucket = async ({ supabaseUrl, serviceKey, storagePath, pdfBuffer }) => {
  const url = `${supabaseUrl}/storage/v1/object/${PUBLIC_REPORTS_BUCKET}/${encodeStoragePath(storagePath)}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: createRestHeaders(serviceKey, {
      'Content-Type': 'application/pdf',
      'x-upsert': 'true'
    }),
    body: pdfBuffer
  });

  const rawText = await response.text();
  const data = rawText ? safeJsonParse(rawText) : null;

  if (!response.ok) {
    const message = data?.message || data?.error || rawText || 'Storage upload failed';
    throw createHttpError(response.status, message);
  }

  return data;
};

const generateSignedUrl = async ({ supabaseUrl, serviceKey, storagePath }) => {
  const url = `${supabaseUrl}/storage/v1/object/sign/${PUBLIC_REPORTS_BUCKET}/${encodeStoragePath(storagePath)}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: createRestHeaders(serviceKey, { 'Content-Type': 'application/json' }),
    body: JSON.stringify({ expiresIn: SIGNED_URL_EXPIRY_SECONDS })
  });

  const rawText = await response.text();
  const data = rawText ? safeJsonParse(rawText) : null;

  if (!response.ok) {
    const message = data?.message || data?.error || rawText || 'Signed URL creation failed';
    throw createHttpError(response.status, message);
  }

  const signedPath = data?.signedURL || data?.signedUrl || data?.signed_url || data?.path || '';
  if (!signedPath) {
    throw createHttpError(500, 'Signed URL response missing path');
  }

  const signedUrl = /^https?:\/\//i.test(signedPath)
    ? signedPath
    : `${supabaseUrl}${signedPath.startsWith('/') ? '' : '/'}${signedPath}`;

  return signedUrl;
};

// ─── Base de données ───────────────────────────────────────────────────────────

const insertPublicReportRecord = async ({ supabaseUrl, serviceKey, payload }) => {
  const response = await fetch(`${supabaseUrl}/rest/v1/public_report_pdfs`, {
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
    const message = data?.message || data?.error || rawText || 'Insert public_report_pdfs failed';
    throw createHttpError(response.status, message);
  }

  return Array.isArray(data) ? data[0] : data;
};

const updateLeadSubmissionPdfUrl = async ({
  supabaseUrl,
  serviceKey,
  leadSubmissionId,
  pdfUrl,
  expiresAt
}) => {
  if (!leadSubmissionId) return;

  const response = await fetch(
    `${supabaseUrl}/rest/v1/lead_submissions?id=eq.${encodeURIComponent(leadSubmissionId)}`,
    {
      method: 'PATCH',
      headers: createRestHeaders(serviceKey, {
        'Content-Type': 'application/json',
        Prefer: 'return=minimal'
      }),
      body: JSON.stringify({ pdf_url: pdfUrl, pdf_expires_at: expiresAt })
    }
  );

  if (!response.ok) {
    const rawText = await response.text();
    console.warn('[save-public-report] updateLeadSubmissionPdfUrl failed:', response.status, rawText);
  }
};

// ─── Email ────────────────────────────────────────────────────────────────────

const sendEmailViaResend = async ({ resendApiKey, resendFrom, emailPayload }) => {
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from: resendFrom,
      to: [emailPayload.to],
      subject: emailPayload.subject,
      html: emailPayload.html,
      text: emailPayload.text
    })
  });

  const rawText = await response.text();
  const parsed = rawText ? safeJsonParse(rawText) : null;

  if (!response.ok) {
    const message = parsed?.message || parsed?.error || rawText || `Resend HTTP ${response.status}`;
    throw createHttpError(response.status, message);
  }

  return parsed;
};

const buildPdfReadyEmail = ({ email, siteName, activity, surface, scoreLettre, economiesTotalesAnnuelles, pdfUrl }) => {
  const buildingName = siteName || 'Votre bâtiment';
  const scoreLabel = scoreLettre ? `Indice ${scoreLettre}` : 'Indice en cours de calcul';
  const activityLabel = activity || 'Activité à confirmer';
  const surfaceLabel = surface ? `${surface} m²` : 'Surface non renseignée';
  const savingsLabel = formatCurrency(economiesTotalesAnnuelles || 0);
  const safePdfUrl = escapeHtml(pdfUrl || '#');

  return {
    to: email,
    subject: 'Votre rapport DiagTertiaire est disponible',
    text: [
      'Bonjour,',
      '',
      'Votre rapport DiagTertiaire est disponible en téléchargement.',
      `Bâtiment : ${buildingName}`,
      `Activité : ${activityLabel}`,
      `Surface : ${surfaceLabel}`,
      `Indice : ${scoreLabel}`,
      `Économies annuelles estimées : ${savingsLabel}`,
      '',
      '📄 Votre rapport PDF est prêt.',
      `Télécharger : ${pdfUrl || ''}`,
      '',
      'Ce lien est valable 15 jours à compter de la réception de cet email.'
    ].join('\n'),
    html: `
      <div style="font-family:Arial,sans-serif;background:#F8FAFC;padding:24px;color:#0F172A;">
        <div style="max-width:640px;margin:0 auto;background:#FFFFFF;border:1px solid #E2E8F0;border-radius:20px;overflow:hidden;">
          <div style="padding:24px 28px;background:linear-gradient(135deg,#102A43 0%,#1D4ED8 100%);color:#FFFFFF;">
            <div style="font-size:12px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;opacity:0.8;">DiagTertiaire</div>
            <h1 style="margin:10px 0 0;font-size:28px;line-height:1.1;">Votre rapport est disponible</h1>
          </div>
          <div style="padding:28px;">
            <p style="margin:0 0 18px;font-size:16px;line-height:1.6;">Bonjour,</p>
            <p style="margin:0 0 8px;font-size:15px;line-height:1.7;">📄 Votre rapport PDF est prêt — cliquez sur le bouton ci-dessous pour le télécharger.</p>
            <p style="margin:0 0 22px;font-size:14px;line-height:1.6;color:#64748B;">Votre rapport DiagTertiaire est maintenant disponible en téléchargement.</p>
            <div style="display:grid;gap:12px;margin-bottom:24px;">
              <div style="padding:14px 16px;border:1px solid #E2E8F0;border-radius:14px;background:#F8FAFC;"><strong>Bâtiment</strong><br>${escapeHtml(buildingName)}</div>
              <div style="padding:14px 16px;border:1px solid #E2E8F0;border-radius:14px;background:#F8FAFC;"><strong>Activité</strong><br>${escapeHtml(activityLabel)}</div>
              <div style="padding:14px 16px;border:1px solid #E2E8F0;border-radius:14px;background:#F8FAFC;"><strong>Surface</strong><br>${escapeHtml(surfaceLabel)}</div>
              <div style="padding:14px 16px;border:1px solid #E2E8F0;border-radius:14px;background:#F8FAFC;"><strong>Indice DiagTertiaire</strong><br>${escapeHtml(scoreLabel)}</div>
              <div style="padding:14px 16px;border:1px solid #E2E8F0;border-radius:14px;background:#F8FAFC;"><strong>Économies annuelles estimées</strong><br>${escapeHtml(savingsLabel)}</div>
            </div>
            <a href="${safePdfUrl}" style="display:inline-block;padding:14px 20px;border-radius:12px;background:#1D4ED8;color:#FFFFFF;text-decoration:none;font-weight:700;">
              Télécharger mon rapport PDF
            </a>
            <p style="margin:16px 0 0;font-size:12px;line-height:1.6;color:#94A3B8;">
              Ce lien est valable 15 jours à compter de la réception de cet email.
            </p>
          </div>
        </div>
      </div>
    `
  };
};

// ─── Handler ──────────────────────────────────────────────────────────────────

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  try {
    const body = safeJsonParse(req.body);
    const payload = asPlainObject(body);

    const html = typeof payload.html === 'string' ? payload.html.trim() : '';
    const filename = sanitizeSegment(payload.filename, 'rapport-public') + (String(payload.filename || '').endsWith('.pdf') ? '' : '');
    const email = String(payload.email || '').trim();
    const reportMeta = asPlainObject(payload.reportMeta);

    const reportId = String(reportMeta.reportId || `DIAG-${Date.now()}`).trim();
    const siteName = String(reportMeta.siteName || 'Bâtiment diagnostiqué').trim();
    const activity = String(reportMeta.activity || '').trim();
    const surface = Number(reportMeta.surface || 0);
    const scoreLettre = String(reportMeta.scoreLettre || '').trim();
    const economiesTotalesAnnuelles = Number(reportMeta.economiesTotalesAnnuelles || 0);
    const leadSubmissionId = String(reportMeta.leadSubmissionId || '').trim() || null;

    // Validation
    if (!html) {
      throw createHttpError(400, 'Missing html payload');
    }
    if (html.length > MAX_HTML_LENGTH) {
      throw createHttpError(413, 'HTML payload too large');
    }
    if (!email) {
      throw createHttpError(400, 'Missing email');
    }

    // Config serveur
    const { supabaseUrl, serviceKey } = getRequiredServerSupabaseConfig();

    const resendApiKey = readEnv('RESEND_API_KEY');
    const resendFrom = readEnv('RESEND_FROM');
    if (!resendApiKey || !resendFrom) {
      throw createHttpError(500, 'Missing RESEND_API_KEY or RESEND_FROM');
    }

    // 1. Générer le PDF
    const pdfBuffer = await renderPdfFromHtml(html, {
      maxHtmlLength: MAX_HTML_LENGTH,
      timeoutMs: 55_000
    });

    // 2. Upload dans le bucket public-reports
    const safeReportId = sanitizeSegment(reportId, 'rapport');
    const safeFilename = sanitizeSegment(filename || siteName, 'rapport-public') + '.pdf';
    const storagePath = `public/${safeReportId}/${safeFilename}`;

    await uploadToPublicBucket({ supabaseUrl, serviceKey, storagePath, pdfBuffer });

    // 3. URL signée 15 jours
    const signedUrl = await generateSignedUrl({ supabaseUrl, serviceKey, storagePath });
    const expiresAt = new Date(Date.now() + SIGNED_URL_EXPIRY_SECONDS * 1000).toISOString();

    // 4. Insérer le record public_report_pdfs
    try {
      await insertPublicReportRecord({
        supabaseUrl,
        serviceKey,
        payload: {
          report_id: reportId,
          lead_submission_id: leadSubmissionId || null,
          storage_path: storagePath,
          signed_url: signedUrl,
          signed_url_expires_at: expiresAt,
          email: email || null,
          activity: activity || null,
          surface: surface > 0 ? surface : null,
          score_letter: scoreLettre || null,
          site_name: siteName || null,
          pdf_size_bytes: pdfBuffer.length
        }
      });
    } catch (dbError) {
      console.warn('[save-public-report] insertPublicReportRecord failed:', dbError.message);
    }

    // 5. Mettre à jour lead_submissions
    if (leadSubmissionId) {
      await updateLeadSubmissionPdfUrl({
        supabaseUrl,
        serviceKey,
        leadSubmissionId,
        pdfUrl: signedUrl,
        expiresAt
      });
    }

    // 6. Envoyer l'email
    try {
      const emailPayload = buildPdfReadyEmail({
        email,
        siteName,
        activity,
        surface: surface > 0 ? Math.round(surface) : null,
        scoreLettre,
        economiesTotalesAnnuelles,
        pdfUrl: signedUrl
      });

      await sendEmailViaResend({ resendApiKey, resendFrom, emailPayload });
    } catch (emailError) {
      console.warn('[save-public-report] Email delivery failed:', emailError.message);
    }

    return res.status(200).json({
      ok: true,
      pdf_url: signedUrl,
      expires_at: expiresAt,
      report_id: reportId
    });
  } catch (error) {
    const statusCode = Number.isInteger(error?.statusCode) ? error.statusCode : 500;
    console.error('[save-public-report] Error:', error?.message || error);
    return res.status(statusCode).json({
      ok: false,
      error: error?.message || 'PDF generation failed',
      fallback: true
    });
  }
};
