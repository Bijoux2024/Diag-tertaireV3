const { DEFAULT_MAX_HTML_LENGTH, renderPdfFromHtml } = require('./_lib/pdf-renderer');
const { getRequiredServerSupabaseConfig } = require('./_lib/supabase-server');

const PUBLIC_DIAGNOSTIC_ASSETS_BUCKET = 'public-diagnostic-assets';
const SIGNED_URL_TTL_SECONDS = 60 * 60 * 24 * 30;

const safeJsonParse = (value) => {
  if (typeof value !== 'string') return value;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
};

const asPlainObject = (value) => {
  return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
};

const asArray = (value) => Array.isArray(value) ? value : [];

const toNumber = (value, fallback = 0) => {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
};

const encodeQueryValue = (value) => encodeURIComponent(String(value ?? ''));

const encodeStoragePath = (value) => String(value || '')
  .split('/')
  .map((segment) => encodeURIComponent(segment))
  .join('/');

const escapeHtml = (value) => String(value ?? '')
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

const sanitizeDownloadFilename = (value) => {
  const safeStem = sanitizeFileSegment(value, 'rapport-diagnostic');
  return safeStem.endsWith('.pdf') ? safeStem : `${safeStem}.pdf`;
};

const createHttpError = (statusCode, message) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const formatCurrency = (value) => {
  return `${Math.round(toNumber(value, 0)).toLocaleString('fr-FR')} EUR`;
};

const formatInteger = (value, suffix = '') => {
  const formatted = Math.round(toNumber(value, 0)).toLocaleString('fr-FR');
  return suffix ? `${formatted} ${suffix}` : formatted;
};

const formatDateLabel = (value) => {
  const date = value ? new Date(value) : new Date();
  if (Number.isNaN(date.getTime())) {
    return String(value || '');
  }

  return date.toLocaleString('fr-FR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const getScoreConfig = (score) => {
  const normalized = String(score || 'C').trim().toUpperCase();
  const map = {
    A: { score: 'A', label: 'Tres performant', color: '#16A34A', background: '#DCFCE7' },
    B: { score: 'B', label: 'Performant', color: '#22C55E', background: '#E8F5E9' },
    C: { score: 'C', label: 'Dans la mediane', color: '#F59E0B', background: '#FEF3C7' },
    D: { score: 'D', label: 'Surconsommation', color: '#F97316', background: '#FFF7ED' },
    E: { score: 'E', label: 'Tres energivore', color: '#EF4444', background: '#FEE2E2' }
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

const createRestHeaders = (serviceKey, extraHeaders = {}) => ({
  apikey: serviceKey,
  Authorization: `Bearer ${serviceKey}`,
  ...extraHeaders
});

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

const uploadPdfToStorage = async ({ supabaseUrl, serviceKey, storagePath, pdfBuffer }) => {
  const response = await fetch(
    `${supabaseUrl}/storage/v1/object/${PUBLIC_DIAGNOSTIC_ASSETS_BUCKET}/${encodeStoragePath(storagePath)}`,
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
    const message = data?.message || data?.error || rawText || 'Storage upload failed';
    throw createHttpError(response.status, message);
  }

  return data;
};

const createSignedStorageUrl = async ({
  supabaseUrl,
  serviceKey,
  storagePath,
  expiresIn = SIGNED_URL_TTL_SECONDS
}) => {
  const response = await fetch(
    `${supabaseUrl}/storage/v1/object/sign/${PUBLIC_DIAGNOSTIC_ASSETS_BUCKET}/${encodeStoragePath(storagePath)}`,
    {
      method: 'POST',
      headers: createRestHeaders(serviceKey, {
        'Content-Type': 'application/json'
      }),
      body: JSON.stringify({ expiresIn })
    }
  );

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

  const reportUrl = /^https?:\/\//i.test(signedPath)
    ? signedPath
    : `${supabaseUrl}${signedPath.startsWith('/') ? '' : '/'}${signedPath}`;

  return {
    reportUrl,
    expiresAt: new Date(Date.now() + (expiresIn * 1000)).toISOString()
  };
};

const buildPublicReportStoragePath = (leadSubmissionId, reportId) => {
  const safeLeadId = sanitizeFileSegment(leadSubmissionId, 'lead');
  const safeReportId = sanitizeFileSegment(reportId, 'rapport');
  return `lead-submissions/${safeLeadId}/reports/${safeReportId}/rapport-diagnostic-public.pdf`;
};

const buildBudgetSummary = (actions = [], annualSavingsEuro = 0) => {
  const capexBrut = asArray(actions).reduce((sum, action) => sum + toNumber(action?.capex?.value, 0), 0);
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
  const targetIntensity = Math.max(0, Math.round(siteIntensity - (surface > 0 ? (annualSavingsKwh / surface) : 0)));
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
    budget,
    emailData: {
      email,
      nomBatiment: siteName,
      activite: activity,
      surface: surface > 0 ? Math.round(surface) : null,
      scoreLettre: score,
      economiesTotalesAnnuelles: annualSavingsEuro
    }
  };
};

const buildActionsRowsHtml = (actions) => {
  if (!actions.length) {
    return '<p class="empty-state">Aucune action prioritaire exploitable avec ce niveau de donnees.</p>';
  }

  return `
    <table class="actions-table">
      <thead>
        <tr>
          <th>Action</th>
          <th>Gain annuel</th>
          <th>Budget</th>
          <th>ROI</th>
        </tr>
      </thead>
      <tbody>
        ${actions.map((action) => `
          <tr>
            <td>
              <strong>${escapeHtml(action.name || 'Action recommandee')}</strong>
              <div class="muted">${escapeHtml(action.category || 'Usage principal')}</div>
            </td>
            <td>${escapeHtml(formatCurrency(action.gain_euro_an?.value || 0))}</td>
            <td>${escapeHtml(formatCurrency(action.capex?.value || 0))}</td>
            <td>${action.roi_years?.value !== null && action.roi_years?.value !== undefined ? escapeHtml(`${String(action.roi_years.value).replace('.', ',')} ans`) : 'A confirmer'}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
};

const renderBulletList = (items, fallbackText) => {
  const safeItems = asArray(items).filter((item) => typeof item === 'string' && item.trim());
  if (!safeItems.length) {
    return `<p class="empty-state">${escapeHtml(fallbackText)}</p>`;
  }

  return `<ul class="bullet-list">${safeItems.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul>`;
};

const buildPublicReportPdfHtml = (viewModel) => {
  return `<!DOCTYPE html>
  <html lang="fr">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>${escapeHtml(`DiagTertiaire - ${viewModel.siteName}`)}</title>
      <style>
        :root {
          --bg: #f8fafc;
          --card: #ffffff;
          --text: #0f172a;
          --muted: #64748b;
          --border: #e2e8f0;
          --accent: #1d4ed8;
        }
        * { box-sizing: border-box; }
        body { margin: 0; font-family: Arial, sans-serif; background: var(--bg); color: var(--text); }
        .page { padding: 28px; }
        .hero {
          background: linear-gradient(135deg, #102a43 0%, #1d4ed8 100%);
          color: #ffffff;
          border-radius: 24px;
          padding: 28px;
        }
        .hero-kicker {
          font-size: 12px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          opacity: 0.82;
        }
        .hero-title {
          margin: 10px 0 8px;
          font-size: 30px;
          line-height: 1.1;
          font-weight: 800;
        }
        .hero-meta {
          font-size: 13px;
          line-height: 1.6;
          color: rgba(255, 255, 255, 0.86);
        }
        .hero-grid, .stats-grid, .detail-grid {
          display: grid;
          gap: 16px;
        }
        .hero-grid {
          margin-top: 22px;
          grid-template-columns: 1.5fr 0.9fr;
          align-items: stretch;
        }
        .hero-card, .section {
          background: var(--card);
          border: 1px solid var(--border);
          border-radius: 20px;
          padding: 22px;
          page-break-inside: avoid;
        }
        .hero-score {
          text-align: center;
          background: ${viewModel.score.background};
          color: ${viewModel.score.color};
          border: 1px solid rgba(15, 23, 42, 0.06);
        }
        .hero-score-value {
          font-size: 54px;
          line-height: 1;
          font-weight: 900;
          margin: 8px 0;
        }
        .hero-score-label {
          font-size: 15px;
          font-weight: 700;
          color: #0f172a;
        }
        .stats-grid {
          margin-top: 18px;
          grid-template-columns: repeat(4, minmax(0, 1fr));
        }
        .stat-card {
          background: var(--card);
          border: 1px solid var(--border);
          border-radius: 18px;
          padding: 18px;
        }
        .stat-label {
          font-size: 11px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: var(--muted);
        }
        .stat-value {
          margin-top: 10px;
          font-size: 26px;
          line-height: 1.1;
          font-weight: 900;
        }
        .stat-sub {
          margin-top: 8px;
          font-size: 12px;
          line-height: 1.5;
          color: var(--muted);
        }
        .section {
          margin-top: 18px;
        }
        .section h2 {
          margin: 0 0 12px;
          font-size: 18px;
          line-height: 1.2;
        }
        .section p {
          margin: 0;
          font-size: 14px;
          line-height: 1.7;
          color: var(--muted);
        }
        .detail-grid {
          grid-template-columns: 1fr 1fr;
          margin-top: 16px;
        }
        .detail-card {
          border: 1px solid var(--border);
          border-radius: 18px;
          padding: 16px;
          background: #f8fafc;
        }
        .detail-card strong {
          display: block;
          font-size: 12px;
          color: var(--muted);
          text-transform: uppercase;
          letter-spacing: 0.08em;
          margin-bottom: 8px;
        }
        .detail-card span {
          font-size: 22px;
          font-weight: 800;
          color: var(--text);
        }
        .actions-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 13px;
        }
        .actions-table th,
        .actions-table td {
          text-align: left;
          padding: 12px 10px;
          border-bottom: 1px solid var(--border);
          vertical-align: top;
        }
        .actions-table th {
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: var(--muted);
        }
        .muted {
          margin-top: 4px;
          font-size: 12px;
          color: var(--muted);
        }
        .bullet-list {
          margin: 0;
          padding-left: 18px;
        }
        .bullet-list li {
          margin: 0 0 8px;
          font-size: 13px;
          line-height: 1.6;
          color: var(--muted);
        }
        .empty-state {
          font-size: 13px;
          line-height: 1.6;
          color: var(--muted);
        }
        .footer-note {
          margin-top: 20px;
          font-size: 11px;
          line-height: 1.6;
          color: #94a3b8;
          text-align: center;
        }
      </style>
    </head>
    <body>
      <div class="page">
        <div class="hero">
          <div class="hero-kicker">DiagTertiaire - rapport public archive</div>
          <div class="hero-title">${escapeHtml(viewModel.siteName)}</div>
          <div class="hero-meta">
            ${escapeHtml(viewModel.activity)} | ${escapeHtml(formatInteger(viewModel.surface, 'm2'))} | ${escapeHtml(viewModel.role)}<br />
            ${escapeHtml(viewModel.address || 'Adresse a confirmer')}<br />
            Rapport ${escapeHtml(viewModel.reportId || 'N/A')} | Lead ${escapeHtml(viewModel.leadSubmissionId || 'N/A')} | Genere le ${escapeHtml(formatDateLabel(viewModel.generatedAt))}
          </div>
          <div class="hero-grid">
            <div class="hero-card">
              <strong style="display:block;font-size:12px;color:#64748b;text-transform:uppercase;letter-spacing:0.08em;">Lecture rapide</strong>
              <p style="margin:10px 0 0;font-size:16px;line-height:1.7;color:#0f172a;">
                Le site se positionne en <strong>${escapeHtml(viewModel.score.label)}</strong>, avec un potentiel estime a
                <strong>${escapeHtml(formatCurrency(viewModel.annualSavingsEuro))}</strong> d'economies par an et
                <strong>${escapeHtml(String(viewModel.totalSavingsPct))}%</strong> de reduction ciblee.
              </p>
              <div class="detail-grid">
                <div class="detail-card">
                  <strong>Intensite actuelle</strong>
                  <span>${escapeHtml(formatInteger(viewModel.siteIntensity, 'kWh/m2/an'))}</span>
                </div>
                <div class="detail-card">
                  <strong>Mediane secteur</strong>
                  <span>${escapeHtml(formatInteger(viewModel.benchmarkMedian, 'kWh/m2/an'))}</span>
                </div>
                <div class="detail-card">
                  <strong>Cible estimee</strong>
                  <span>${escapeHtml(formatInteger(viewModel.targetIntensity, 'kWh/m2/an'))}</span>
                </div>
                <div class="detail-card">
                  <strong>Confiance</strong>
                  <span>${escapeHtml(viewModel.confidenceLabel)}</span>
                </div>
              </div>
            </div>
            <div class="hero-card hero-score">
              <div class="hero-kicker" style="color:${viewModel.score.color};opacity:1;">Score energie</div>
              <div class="hero-score-value">${escapeHtml(viewModel.score.score)}</div>
              <div class="hero-score-label">${escapeHtml(viewModel.score.label)}</div>
              <div class="muted" style="color:#334155;">Apres travaux estimes : ${escapeHtml(viewModel.targetScore.score)}</div>
            </div>
          </div>
        </div>

        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-label">Cout annuel</div>
            <div class="stat-value">${escapeHtml(formatCurrency(viewModel.totalCostEuro))}</div>
            <div class="stat-sub">Charges energie estimees</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">Economie annuelle</div>
            <div class="stat-value">${escapeHtml(formatCurrency(viewModel.annualSavingsEuro))}</div>
            <div class="stat-sub">${escapeHtml(formatInteger(viewModel.annualSavingsKwh, 'kWh/an'))}</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">Budget net indicatif</div>
            <div class="stat-value">${escapeHtml(formatCurrency(viewModel.budget.capexNet))}</div>
            <div class="stat-sub">Aides deduites : ${escapeHtml(formatCurrency(viewModel.budget.aides))}</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">ROI indicatif</div>
            <div class="stat-value">${viewModel.budget.roiYears !== null ? escapeHtml(`${String(viewModel.budget.roiYears).replace('.', ',')} ans`) : 'A confirmer'}</div>
            <div class="stat-sub">Perimetre : ${escapeHtml(String(viewModel.actions.length))} action(s)</div>
          </div>
        </div>

        <div class="section">
          <h2>Actions prioritaires</h2>
          <p style="margin-bottom:14px;">Ordre de grandeur pour engager une discussion technique et prioriser les premiers leviers sans attendre un audit complet.</p>
          ${buildActionsRowsHtml(viewModel.actions)}
        </div>

        <div class="detail-grid">
          <div class="section">
            <h2>Hypotheses de calcul</h2>
            ${renderBulletList(viewModel.assumptions, 'Hypotheses a confirmer sur site.')}
          </div>
          <div class="section">
            <h2>Limites de lecture</h2>
            ${renderBulletList(viewModel.limits, 'Limites a confirmer avec un expert.')}
          </div>
        </div>

        <p class="footer-note">
          PDF public genere cote serveur via Chromium, archive dans un bucket prive puis diffuse par URL signee.
        </p>
      </div>
    </body>
  </html>`;
};

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const body = safeJsonParse(req.body);
    const payload = asPlainObject(body);
    const leadSubmissionId = String(payload.lead_submission_id || '').trim();
    const reportPayload = asPlainObject(payload.report_payload);

    if (!leadSubmissionId) {
      throw createHttpError(400, 'Missing lead_submission_id');
    }

    if (!reportPayload.report_id) {
      throw createHttpError(400, 'Missing report_payload.report_id');
    }

    const serverSupabaseConfig = getRequiredServerSupabaseConfig();
    const supabaseUrl = serverSupabaseConfig.supabaseUrl;
    const serviceKey = serverSupabaseConfig.serviceKey;

    const leadRows = await supabaseRestFetch(
      supabaseUrl,
      serviceKey,
      `lead_submissions?id=eq.${encodeQueryValue(leadSubmissionId)}&select=id,email,raw_payload,report_id&limit=1`
    );
    const leadRecord = asArray(leadRows)[0] || null;

    if (!leadRecord?.id) {
      throw createHttpError(404, 'Lead submission not found');
    }

    const viewModel = buildPublicReportViewModel(reportPayload, leadSubmissionId);
    if (!viewModel.email) {
      const fallbackEmail = String(leadRecord.email || '').trim();
      if (!fallbackEmail) {
        throw createHttpError(400, 'Missing report email');
      }
      viewModel.emailData.email = fallbackEmail;
      viewModel.email = fallbackEmail;
    }

    const html = buildPublicReportPdfHtml(viewModel);
    const pdfBuffer = await renderPdfFromHtml(html, {
      maxHtmlLength: DEFAULT_MAX_HTML_LENGTH,
      timeoutMs: 45_000
    });

    const storagePath = buildPublicReportStoragePath(leadSubmissionId, viewModel.reportId);
    const downloadFilename = sanitizeDownloadFilename(`rapport-${viewModel.siteName}`);

    await uploadPdfToStorage({
      supabaseUrl,
      serviceKey,
      storagePath,
      pdfBuffer
    });

    const signedUrlData = await createSignedStorageUrl({
      supabaseUrl,
      serviceKey,
      storagePath
    });

    const existingRawPayload = asPlainObject(leadRecord.raw_payload);
    const mergedRawPayload = {
      ...existingRawPayload,
      public_report_pdf: {
        bucket_name: PUBLIC_DIAGNOSTIC_ASSETS_BUCKET,
        storage_path: storagePath,
        file_name: downloadFilename,
        generated_at: new Date().toISOString(),
        expires_at: signedUrlData.expiresAt,
        report_id: viewModel.reportId
      }
    };

    try {
      await supabaseRestFetch(
        supabaseUrl,
        serviceKey,
        `lead_submissions?id=eq.${encodeQueryValue(leadSubmissionId)}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Prefer: 'return=minimal'
          },
          body: JSON.stringify({
            raw_payload: mergedRawPayload,
            report_id: leadRecord.report_id || viewModel.reportId
          })
        }
      );
    } catch (metadataError) {
      console.warn('[public-report-pdf] Unable to persist PDF metadata on lead_submissions:', metadataError);
    }

    return res.status(200).json({
      ok: true,
      lead_submission_id: leadSubmissionId,
      report_id: viewModel.reportId,
      bucket_name: PUBLIC_DIAGNOSTIC_ASSETS_BUCKET,
      storage_path: storagePath,
      file_name: downloadFilename,
      report_url: signedUrlData.reportUrl,
      expires_at: signedUrlData.expiresAt,
      email_data: {
        ...viewModel.emailData,
        reportUrl: signedUrlData.reportUrl
      }
    });
  } catch (error) {
    const statusCode = Number.isInteger(error?.statusCode) ? error.statusCode : 500;
    return res.status(statusCode).json({
      ok: false,
      error: error?.message || 'Public report PDF generation failed'
    });
  }
};
