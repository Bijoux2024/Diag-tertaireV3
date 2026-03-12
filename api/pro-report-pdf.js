const { DEFAULT_MAX_HTML_LENGTH, renderPdfFromHtml } = require('./_lib/pdf-renderer');
const ORGANIZATION_ASSETS_BUCKET = 'organization-assets';
const REPORT_PDF_FILE_KIND = 'report_pdf';
const MAX_HTML_LENGTH = DEFAULT_MAX_HTML_LENGTH;
const DEFAULT_ACCENT = '#1D4ED8';

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

const encodeQueryValue = (value) => encodeURIComponent(String(value ?? ''));

const encodeStoragePath = (path) => String(path || '')
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
  const safeStem = sanitizeFileSegment(value, 'rapport-officiel');
  return safeStem.endsWith('.pdf') ? safeStem : `${safeStem}.pdf`;
};

const createHttpError = (statusCode, message) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const assertStoragePathPrefix = (storagePath, expectedPrefix, label) => {
  const normalizedPath = String(storagePath || '').trim();
  if (!normalizedPath.startsWith(expectedPrefix)) {
    throw createHttpError(403, `${label} path is outside the authenticated organization scope`);
  }

  return normalizedPath;
};

const formatCurrency = (value) => {
  const numeric = Number(value || 0);
  return Number.isFinite(numeric)
    ? `${numeric.toLocaleString('fr-FR')} EUR`
    : '0 EUR';
};

const formatInteger = (value, suffix = '') => {
  const numeric = Number(value || 0);
  const formatted = Number.isFinite(numeric) ? numeric.toLocaleString('fr-FR') : '0';
  return suffix ? `${formatted} ${suffix}` : formatted;
};

const formatDateTime = (value) => {
  const date = value ? new Date(value) : new Date();
  if (Number.isNaN(date.getTime())) {
    return escapeHtml(String(value || ''));
  }

  return date.toLocaleString('fr-FR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const getScoreTone = (score) => {
  if (score === 'A' || score === 'B') {
    return { color: '#15803D', background: '#DCFCE7' };
  }

  if (score === 'C') {
    return { color: '#A16207', background: '#FEF3C7' };
  }

  return { color: '#B91C1C', background: '#FEE2E2' };
};

const normalizeRecommendedActions = (payload, engineResult) => {
  const topActions = asArray(engineResult?.topActions);
  if (topActions.length) {
    return topActions.slice(0, 6).map((action) => ({
      title: action.title || action.name || 'Action recommandee',
      description: action.description || action.sourceWarning || '',
      savings: action.gainEur || action.savingsEuro || 0,
      capex: action.capex || 0,
      roi: action.roi || 0
    }));
  }

  const rawActions = asArray(payload.actions).length
    ? asArray(payload.actions)
    : asArray(payload.actionPlan);

  return rawActions.slice(0, 6).map((action) => ({
    title: action.title || action.name || 'Action recommandee',
    description: action.description || '',
    savings: action.gainEur || action.savingsEuro || 0,
    capex: action.capex || action.cost || 0,
    roi: action.roi || action.timeline || 0
  }));
};

const buildReportPdfPayload = ({
  reportRecord,
  caseRecord,
  organizationRecord,
  settingsRecord,
  brandingRecord,
  logoDataUrl
}) => {
  const reportPayload = asPlainObject(reportRecord?.report_payload);
  const casePayload = asPlainObject(caseRecord?.case_data);
  const source = { ...casePayload, ...reportPayload };
  const engineResult = asPlainObject(source.engineResult);
  const reportSummary = asPlainObject(reportRecord?.report_summary);

  const brandName = String(
    settingsRecord?.brand_name
      || organizationRecord?.name
      || source.brandName
      || 'DiagTertiaire Pro'
  ).trim();

  const accent = String(settingsRecord?.accent || DEFAULT_ACCENT).trim() || DEFAULT_ACCENT;
  const clientName = source.clientName || source.company || source.projectName || reportRecord?.report_name || 'Rapport';
  const projectName = source.projectName || clientName;
  const activity = source.activity || source.formData?.activity || caseRecord?.activity_type || '-';
  const surface = source.surfaceLabel || (source.buildingArea ? `${formatInteger(source.buildingArea, 'm2')}` : '-');
  const address = source.address || source.postalCode || '-';
  const reportName = reportRecord?.report_name || projectName || clientName || 'Rapport';
  const score = engineResult.score || source.score || reportSummary.score || '-';
  const scoreTone = getScoreTone(score);

  return {
    brandName,
    accent,
    logoDataUrl: logoDataUrl || '',
    reportId: reportRecord?.id,
    reportName,
    clientName,
    projectName,
    activity,
    surface,
    address,
    summary: source.summary || '',
    generatedAtLabel: formatDateTime(new Date().toISOString()),
    score,
    scoreTone,
    positioning: engineResult.positioning || source.positioning || '',
    confidence: engineResult.badgeConfiance || source.scoreConfidence || '',
    metrics: [
      {
        label: 'Consommation',
        value: formatInteger(engineResult.kwhTotal || source.annualConsumption || 0, 'kWh/an'),
        sub: formatInteger(engineResult.intensity || source.intensityPerSqm || reportSummary.intensity_per_sqm || 0, 'kWh/m2/an')
      },
      {
        label: 'Facture annuelle',
        value: formatCurrency(engineResult.totalBill || source.annualCost || 0),
        sub: 'Donnees sauvegardees'
      },
      {
        label: 'Economies potentielles',
        value: formatCurrency(engineResult.totalSavingsEur || source.estimatedSavingsPerYear || reportSummary.estimated_savings_per_year || 0),
        sub: formatInteger(engineResult.totalSavingsKwh || 0, 'kWh')
      },
      {
        label: 'ROI global',
        value: source.roiGlobal ? `${String(source.roiGlobal).replace('.', ',')} ans` : '-',
        sub: formatCurrency(source.totalCapexNet || source.totalCapex || 0)
      }
    ],
    resultBasis: asArray(source.resultBasis).slice(0, 6),
    providerQuestions: asArray(source.providerQuestions).slice(0, 6),
    recommendedActions: normalizeRecommendedActions(source, engineResult)
  };
};

const buildReportPdfHtml = (viewModel) => {
  const metricsHtml = viewModel.metrics.map((metric) => `
    <div class="metric-card">
      <div class="metric-label">${escapeHtml(metric.label)}</div>
      <div class="metric-value">${escapeHtml(metric.value)}</div>
      <div class="metric-sub">${escapeHtml(metric.sub)}</div>
    </div>
  `).join('');

  const actionsHtml = viewModel.recommendedActions.length
    ? viewModel.recommendedActions.map((action) => `
      <div class="action-card">
        <div class="action-header">
          <h3>${escapeHtml(action.title)}</h3>
          <span>${escapeHtml(typeof action.roi === 'number' && action.roi > 0 ? `${String(action.roi).replace('.', ',')} ans` : String(action.roi || 'Prioritaire'))}</span>
        </div>
        ${action.description ? `<p class="action-description">${escapeHtml(action.description)}</p>` : ''}
        <div class="action-metrics">
          <div><strong>Investissement</strong><span>${escapeHtml(formatCurrency(action.capex || 0))}</span></div>
          <div><strong>Economies / an</strong><span>${escapeHtml(formatCurrency(action.savings || 0))}</span></div>
        </div>
      </div>
    `).join('')
    : '<p class="empty-state">Aucune action detaillee n\'est disponible dans le rapport sauvegarde.</p>';

  const resultBasisHtml = viewModel.resultBasis.length
    ? `<ul>${viewModel.resultBasis.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul>`
    : '<p class="empty-state">Base de calcul non detaillee dans ce rapport.</p>';

  const providerQuestionsHtml = viewModel.providerQuestions.length
    ? `<ul>${viewModel.providerQuestions.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul>`
    : '<p class="empty-state">Aucune question complementaire en attente.</p>';

  return `<!DOCTYPE html>
  <html lang="fr">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>${escapeHtml(viewModel.reportName)}</title>
      <style>
        :root {
          --accent: ${escapeHtml(viewModel.accent)};
          --accent-soft: rgba(29, 78, 216, 0.08);
          --text: #0f172a;
          --muted: #475569;
          --border: #e2e8f0;
          --surface: #ffffff;
          --surface-soft: #f8fafc;
        }
        * { box-sizing: border-box; }
        body {
          margin: 0;
          font-family: Arial, Helvetica, sans-serif;
          color: var(--text);
          background: #eef2f7;
          padding: 32px;
        }
        .page {
          max-width: 920px;
          margin: 0 auto;
          background: var(--surface);
          border-radius: 24px;
          overflow: hidden;
          box-shadow: 0 18px 45px rgba(15, 23, 42, 0.12);
        }
        .hero {
          background: linear-gradient(135deg, #0f172a 0%, #102a43 55%, var(--accent) 100%);
          color: #fff;
          padding: 36px 40px;
        }
        .hero-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 24px;
          padding-bottom: 20px;
          margin-bottom: 20px;
          border-bottom: 1px solid rgba(255,255,255,0.14);
        }
        .brand-block {
          display: flex;
          align-items: center;
          gap: 14px;
          min-width: 0;
        }
        .brand-logo {
          max-height: 46px;
          max-width: 180px;
          object-fit: contain;
          display: block;
        }
        .brand-name {
          font-size: 24px;
          font-weight: 700;
          line-height: 1.2;
        }
        .hero-kicker {
          font-size: 12px;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: rgba(191, 219, 254, 0.95);
          font-weight: 700;
        }
        .hero-main {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 24px;
        }
        .hero-main h1 {
          margin: 6px 0 8px;
          font-size: 34px;
          line-height: 1.08;
        }
        .hero-meta {
          font-size: 14px;
          color: rgba(226, 232, 240, 0.9);
          line-height: 1.7;
        }
        .score-card {
          min-width: 180px;
          background: rgba(255,255,255,0.12);
          border: 1px solid rgba(255,255,255,0.16);
          border-radius: 20px;
          padding: 18px 20px;
          text-align: center;
        }
        .score-card-label {
          font-size: 12px;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: rgba(226, 232, 240, 0.86);
          font-weight: 700;
        }
        .score-card-value {
          width: 72px;
          height: 72px;
          border-radius: 20px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          margin: 14px auto 10px;
          font-size: 40px;
          font-weight: 800;
          color: ${escapeHtml(viewModel.scoreTone.color)};
          background: ${escapeHtml(viewModel.scoreTone.background)};
        }
        .score-card-sub {
          font-size: 13px;
          color: rgba(226, 232, 240, 0.94);
        }
        .content {
          padding: 32px 40px 40px;
        }
        .metrics-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 14px;
          margin-bottom: 26px;
        }
        .metric-card {
          background: var(--surface-soft);
          border: 1px solid var(--border);
          border-radius: 18px;
          padding: 18px;
        }
        .metric-label {
          font-size: 11px;
          line-height: 1.4;
          text-transform: uppercase;
          letter-spacing: 0.12em;
          font-weight: 700;
          color: var(--accent);
          margin-bottom: 8px;
        }
        .metric-value {
          font-size: 20px;
          font-weight: 800;
          line-height: 1.2;
        }
        .metric-sub {
          font-size: 12px;
          color: var(--muted);
          margin-top: 6px;
        }
        .section {
          margin-top: 22px;
          border: 1px solid var(--border);
          border-radius: 20px;
          padding: 22px;
          background: var(--surface);
        }
        .section h2 {
          margin: 0 0 12px;
          font-size: 20px;
          line-height: 1.25;
        }
        .section p,
        .section li {
          font-size: 14px;
          line-height: 1.7;
          color: var(--muted);
        }
        .section ul {
          margin: 0;
          padding-left: 18px;
        }
        .section-grid {
          display: grid;
          grid-template-columns: 1.1fr 0.9fr;
          gap: 20px;
        }
        .action-card {
          background: var(--surface-soft);
          border: 1px solid var(--border);
          border-radius: 16px;
          padding: 16px;
          margin-bottom: 12px;
        }
        .action-card:last-child {
          margin-bottom: 0;
        }
        .action-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 16px;
        }
        .action-header h3 {
          margin: 0;
          font-size: 15px;
          line-height: 1.45;
          color: var(--text);
        }
        .action-header span {
          white-space: nowrap;
          font-size: 12px;
          font-weight: 700;
          color: var(--accent);
          background: var(--accent-soft);
          border-radius: 999px;
          padding: 6px 10px;
        }
        .action-description {
          margin: 10px 0 14px;
        }
        .action-metrics {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
        }
        .action-metrics div {
          background: #fff;
          border: 1px solid var(--border);
          border-radius: 14px;
          padding: 12px;
        }
        .action-metrics strong {
          display: block;
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: var(--muted);
          margin-bottom: 4px;
        }
        .action-metrics span {
          font-size: 14px;
          font-weight: 700;
          color: var(--text);
        }
        .empty-state {
          margin: 0;
          color: var(--muted);
        }
        .footer-note {
          margin-top: 24px;
          font-size: 11px;
          text-align: center;
          color: #64748b;
        }
      </style>
    </head>
    <body>
      <div class="page">
        <div class="hero">
          <div class="hero-top">
            <div class="brand-block">
              ${viewModel.logoDataUrl ? `<img class="brand-logo" src="${viewModel.logoDataUrl}" alt="Logo organisation" />` : ''}
              <div class="brand-name">${escapeHtml(viewModel.brandName)}</div>
            </div>
            <div class="hero-kicker">PDF officiel sauvegarde</div>
          </div>
          <div class="hero-main">
            <div>
              <div class="hero-kicker">Pre-diagnostic energetique</div>
              <h1>${escapeHtml(viewModel.clientName)}</h1>
              <div class="hero-meta">
                ${escapeHtml(viewModel.activity)} | ${escapeHtml(viewModel.surface)} | ${escapeHtml(viewModel.address)}<br />
                Rapport ${escapeHtml(viewModel.reportId)} | Genere le ${escapeHtml(viewModel.generatedAtLabel)}
              </div>
            </div>
            <div class="score-card">
              <div class="score-card-label">Score energetique</div>
              <div class="score-card-value">${escapeHtml(viewModel.score)}</div>
              <div class="score-card-sub">${escapeHtml(viewModel.positioning || viewModel.confidence || 'Rapport sauvegarde')}</div>
            </div>
          </div>
        </div>
        <div class="content">
          <div class="metrics-grid">${metricsHtml}</div>
          <div class="section">
            <h2>Synthese</h2>
            <p>${escapeHtml(viewModel.summary || 'Le rapport officiel a ete genere a partir des donnees sauvegardees du dossier. Le detail complet reste disponible dans l espace pro.')}</p>
          </div>
          <div class="section-grid">
            <div class="section">
              <h2>Actions recommandees</h2>
              ${actionsHtml}
            </div>
            <div>
              <div class="section">
                <h2>Base de calcul</h2>
                ${resultBasisHtml}
              </div>
              <div class="section">
                <h2>Points a confirmer</h2>
                ${providerQuestionsHtml}
              </div>
            </div>
          </div>
          <div class="footer-note">
            DiagTertiaire Pro | Document genere cote serveur et archive dans l'espace prive de l'organisation.
          </div>
        </div>
      </div>
    </body>
  </html>`;
};

const getRequiredEnv = (key) => {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing ${key}`);
  }

  return value;
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
    throw new Error(message);
  }

  return data;
};

const fetchAuthUser = async (supabaseUrl, publishableKey, accessToken) => {
  const response = await fetch(`${supabaseUrl}/auth/v1/user`, {
    method: 'GET',
    headers: {
      apikey: publishableKey,
      Authorization: `Bearer ${accessToken}`
    }
  });

  const rawText = await response.text();
  const data = rawText ? safeJsonParse(rawText) : null;

  if (!response.ok || !data?.id) {
    const message = data?.message || data?.error_description || rawText || 'Unauthorized';
    throw createHttpError(401, message);
  }

  return data;
};

const uploadPdfToStorage = async ({
  supabaseUrl,
  serviceKey,
  storagePath,
  pdfBuffer
}) => {
  const response = await fetch(
    `${supabaseUrl}/storage/v1/object/${ORGANIZATION_ASSETS_BUCKET}/${encodeStoragePath(storagePath)}`,
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
    throw new Error(message);
  }

  return data;
};

const downloadStorageObject = async ({
  supabaseUrl,
  serviceKey,
  bucketName,
  storagePath
}) => {
  const response = await fetch(
    `${supabaseUrl}/storage/v1/object/authenticated/${bucketName}/${encodeStoragePath(storagePath)}`,
    {
      method: 'GET',
      headers: createRestHeaders(serviceKey)
    }
  );

  if (!response.ok) {
    const details = await response.text();
    throw new Error(details || `Storage download failed (${response.status})`);
  }

  return {
    buffer: Buffer.from(await response.arrayBuffer()),
    contentType: response.headers.get('content-type') || 'application/octet-stream'
  };
};

const buildStoragePathForReportPdf = (organizationId, reportId) => {
  return `org/${organizationId}/reports/${reportId}/rapport-officiel.pdf`;
};

const buildOrganizationFileMetadata = (reportRecord) => ({
  report_id: reportRecord?.id || null,
  case_id: reportRecord?.case_id || null,
  source: 'official_server_pdf'
});

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  let reportRecord = null;
  let supabaseUrl = '';
  let serviceKey = '';

  try {
    supabaseUrl = getRequiredEnv('SUPABASE_URL');
    const publishableKey = getRequiredEnv('SUPABASE_PUBLISHABLE_KEY');
    serviceKey = getRequiredEnv('SUPABASE_SERVICE_KEY');

    const authorizationHeader = req.headers.authorization || req.headers.Authorization || '';
    const accessToken = authorizationHeader.startsWith('Bearer ')
      ? authorizationHeader.slice('Bearer '.length).trim()
      : '';

    if (!accessToken) {
      return res.status(401).json({ error: 'Missing bearer token' });
    }

    const body = safeJsonParse(req.body);
    const reportId = String(body?.report_id || '').trim();
    if (!reportId) {
      return res.status(400).json({ error: 'Missing report_id' });
    }

    const authUser = await fetchAuthUser(supabaseUrl, publishableKey, accessToken);

    const profileRows = await supabaseRestFetch(
      supabaseUrl,
      serviceKey,
      `profiles?id=eq.${encodeQueryValue(authUser.id)}&select=id,organization_id`
    );
    const profile = asArray(profileRows)[0] || null;

    if (!profile?.organization_id) {
      return res.status(403).json({ error: 'Profile organization not found' });
    }

    const organizationRows = await supabaseRestFetch(
      supabaseUrl,
      serviceKey,
      `organizations?id=eq.${encodeQueryValue(profile.organization_id)}&select=id,name`
    );
    const organizationRecord = asArray(organizationRows)[0] || null;

    const reportRows = await supabaseRestFetch(
      supabaseUrl,
      serviceKey,
      `pro_reports?id=eq.${encodeQueryValue(reportId)}&organization_id=eq.${encodeQueryValue(profile.organization_id)}&select=id,organization_id,case_id,created_by,report_name,report_payload,report_summary,latest_pdf_file_id,latest_pdf_generated_at,pdf_status,pdf_error,created_at,updated_at`
    );
    reportRecord = asArray(reportRows)[0] || null;

    if (!reportRecord) {
      return res.status(404).json({ error: 'Report not found' });
    }

    if (reportRecord.organization_id !== profile.organization_id) {
      return res.status(403).json({ error: 'Forbidden for this organization' });
    }

    const updateReportStatus = async (patch) => {
      const updatedRows = await supabaseRestFetch(
        supabaseUrl,
        serviceKey,
        `pro_reports?id=eq.${encodeQueryValue(reportRecord.id)}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Prefer: 'return=representation'
          },
          body: JSON.stringify(patch)
        }
      );

      reportRecord = asArray(updatedRows)[0] || reportRecord;
      return reportRecord;
    };

    await updateReportStatus({
      pdf_status: 'generating',
      pdf_error: null
    });

    const [settingsRows, brandingRows, caseRows] = await Promise.all([
      supabaseRestFetch(
        supabaseUrl,
        serviceKey,
        `organization_settings?organization_id=eq.${encodeQueryValue(profile.organization_id)}&select=organization_id,accent,brand_name`
      ),
      supabaseRestFetch(
        supabaseUrl,
        serviceKey,
        `organization_branding?organization_id=eq.${encodeQueryValue(profile.organization_id)}&select=organization_id,logo_storage_path,logo_file_name`
      ),
      reportRecord.case_id
        ? supabaseRestFetch(
          supabaseUrl,
          serviceKey,
          `pro_cases?id=eq.${encodeQueryValue(reportRecord.case_id)}&organization_id=eq.${encodeQueryValue(profile.organization_id)}&select=id,organization_id,title,status,site_name,activity_type,case_data,created_at,updated_at`
        )
        : Promise.resolve([])
    ]);

    const settingsRecord = asArray(settingsRows)[0] || null;
    const brandingRecord = asArray(brandingRows)[0] || null;
    const caseRecord = asArray(caseRows)[0] || null;

    let logoDataUrl = '';
    if (brandingRecord?.logo_storage_path) {
      try {
        const logoStoragePath = assertStoragePathPrefix(
          brandingRecord.logo_storage_path,
          `org/${profile.organization_id}/branding/logo/`,
          'Organization logo'
        );
        const logoFileRows = await supabaseRestFetch(
          supabaseUrl,
          serviceKey,
          `organization_files?organization_id=eq.${encodeQueryValue(profile.organization_id)}&bucket_name=eq.${encodeQueryValue(ORGANIZATION_ASSETS_BUCKET)}&storage_path=eq.${encodeQueryValue(logoStoragePath)}&select=id,mime_type,file_name&limit=1`
        );
        const logoFileRecord = asArray(logoFileRows)[0] || null;
        const logoDownload = await downloadStorageObject({
          supabaseUrl,
          serviceKey,
          bucketName: ORGANIZATION_ASSETS_BUCKET,
          storagePath: logoStoragePath
        });
        const logoMimeType = logoFileRecord?.mime_type || logoDownload.contentType || 'image/png';
        logoDataUrl = `data:${logoMimeType};base64,${logoDownload.buffer.toString('base64')}`;
      } catch (logoError) {
        console.warn('Unable to embed organization logo in official PDF:', logoError);
      }
    }

    const pdfPayload = buildReportPdfPayload({
      reportRecord,
      caseRecord,
      organizationRecord,
      settingsRecord,
      brandingRecord,
      logoDataUrl
    });
    const html = buildReportPdfHtml(pdfPayload);
    const pdfBuffer = await renderPdfFromHtml(html, {
      maxHtmlLength: MAX_HTML_LENGTH,
      timeoutMs: 45_000
    });

    const storagePath = assertStoragePathPrefix(
      buildStoragePathForReportPdf(profile.organization_id, reportRecord.id),
      `org/${profile.organization_id}/reports/${reportRecord.id}/`,
      'Official PDF'
    );
    const downloadFilename = sanitizeDownloadFilename(`rapport-${pdfPayload.reportName}`);

    await uploadPdfToStorage({
      supabaseUrl,
      serviceKey,
      storagePath,
      pdfBuffer
    });

    const organizationFileRows = await supabaseRestFetch(
      supabaseUrl,
      serviceKey,
      'organization_files?on_conflict=storage_path',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Prefer: 'resolution=merge-duplicates,return=representation'
        },
        body: JSON.stringify({
          organization_id: profile.organization_id,
          created_by: authUser.id,
          kind: REPORT_PDF_FILE_KIND,
          bucket_name: ORGANIZATION_ASSETS_BUCKET,
          storage_path: storagePath,
          file_name: downloadFilename,
          mime_type: 'application/pdf',
          size_bytes: pdfBuffer.length,
          metadata: buildOrganizationFileMetadata(reportRecord)
        })
      }
    );
    const organizationFileRecord = asArray(organizationFileRows)[0] || null;

    const generatedAtIso = new Date().toISOString();
    const updatedReport = await updateReportStatus({
      latest_pdf_file_id: organizationFileRecord?.id || null,
      latest_pdf_generated_at: generatedAtIso,
      pdf_status: 'ready',
      pdf_error: null
    });

    return res.status(200).json({
      ok: true,
      report_id: updatedReport.id,
      pdf_status: updatedReport.pdf_status,
      latest_pdf_generated_at: updatedReport.latest_pdf_generated_at,
      latest_pdf_file_id: updatedReport.latest_pdf_file_id,
      report: updatedReport,
      pdf_file: organizationFileRecord
    });
  } catch (error) {
    if (reportRecord?.id && supabaseUrl && serviceKey) {
      try {
        await supabaseRestFetch(
          supabaseUrl,
          serviceKey,
          `pro_reports?id=eq.${encodeQueryValue(reportRecord.id)}`,
          {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              pdf_status: 'error',
              pdf_error: (error && error.message ? String(error.message) : 'Unknown error').slice(0, 1000)
            })
          }
        );
      } catch (statusError) {
        console.warn('Unable to persist PDF error status:', statusError);
      }
    }

    const message = error && error.message ? error.message : 'Unknown error';
    const statusCode = Number.isInteger(error?.statusCode)
      ? error.statusCode
      : message === 'Missing bearer token'
        ? 401
        : message.includes('Forbidden')
        ? 403
        : message.includes('not found')
          ? 404
          : 500;

    return res.status(statusCode).json({
      error: 'Official PDF generation failed',
      details: message
    });
  }
};
