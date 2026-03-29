'use strict';

/**
 * api/public-report-pdf.js — Route canonique PDF public
 *
 * Pipeline :
 *   1. Parse { lead_submission_id, report_payload }
 *   2. Génère un token temporaire (crypto) + hash SHA-256
 *   3. INSERT public_reports avec pdf_status='generating' + token hash
 *   4. Construit l'URL de la page print dédiée
 *   5. Puppeteer ouvre la page, attend window.__REPORT_READY__
 *   6. Exporte en PDF A4
 *   7. Upload vers bucket public-report-assets
 *   8. Signed URL 30 jours
 *   9. UPDATE public_reports : pdf_status='ready', efface le token
 *  10. UPDATE lead_submissions.pdf_url (best-effort)
 *  11. Email Resend (fire-and-forget)
 *  12. Retourne { ok, public_report_id, report_url, pdf_url, ... }
 *
 *  Erreur → pdf_status='failed', pdf_error=message
 *
 * Table   : public.public_reports
 * Bucket  : public-report-assets (private)
 * Path    : reports/{year}/{month}/{public_report_id}/official.pdf
 */

const crypto = require('crypto');
const { renderPdfFromUrl } = require('./_lib/pdf-renderer');
const {
  assertMaxBodyBytes,
  assertMaxContentLength,
  assertUuidLike,
  createHttpError,
  enforceRateLimit
} = require('./_lib/request-guard');
const {
  assertStorageBucketExists,
  describeServerSupabaseConfig,
  fetchStorageJson,
  getRequiredServerSupabaseConfig
} = require('./_lib/supabase-server');

const PUBLIC_REPORT_ASSETS_BUCKET = 'public-report-assets';
const SIGNED_URL_TTL_SECONDS = 60 * 60 * 24 * 30; // 30 days
const TOKEN_TTL_SECONDS = 60 * 60 * 2;        // 2 h (print session)
const MAX_PUBLIC_REPORT_PAYLOAD_BYTES = 2_000_000;

/* ─── Helpers ────────────────────────────────────────────────────────────── */

const safeJsonParse = (value) => {
  if (typeof value !== 'string') return value;
  try { return JSON.parse(value); } catch { return null; }
};

const asPlainObject = (value) =>
  value && typeof value === 'object' && !Array.isArray(value) ? value : {};

const asArray = (value) => Array.isArray(value) ? value : [];

const toNumber = (value, fallback = 0) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
};

const readEnv = (key) => String(process.env[key] || '').trim();

const encodeQ = (v) => encodeURIComponent(String(v ?? ''));

const encodeStoragePath = (value) =>
  String(value || '').split('/').map(s => encodeURIComponent(s)).join('/');

const escapeHtml = (v) =>
  String(v ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const sanitizeFileSegment = (value, fallback = 'rapport') => {
  const n = String(value || '').trim().toLowerCase()
    .replace(/[^\w.-]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
  return n || fallback;
};

const buildStorageErrorMessage = (fallbackMessage, result) => {
  const parts = [fallbackMessage];
  if (Number.isInteger(result?.status)) parts.push(`HTTP ${result.status}`);
  if (result?.bodySummary) parts.push(result.bodySummary);
  return parts.join(' - ');
};

const logStorageDebug = (label, payload) => {
  console.log(`[public-report-pdf] storage-debug ${label}`, payload);
};

const checkStorageBucket = async ({
  supabaseUrl,
  serviceKey,
  serviceKeySource,
  bucketName,
  bucketEnvName = null,
  bucketEnvValue = null
}) => {
  const configDebug = describeServerSupabaseConfig({ supabaseUrl, serviceKey, serviceKeySource });
  logStorageDebug('config', {
    ...configDebug,
    bucket: bucketName,
    bucketSource: bucketEnvName ? 'env-or-fallback' : 'constant',
    bucketEnvName,
    bucketEnvValue: bucketEnvValue || null
  });

  try {
    const bucketCheck = await assertStorageBucketExists({ supabaseUrl, serviceKey, bucketName });
    logStorageDebug('buckets', {
      listStatus: bucketCheck.listStatus,
      visibleBuckets: bucketCheck.visibleBucketNames,
      listBody: bucketCheck.listBodySummary || null
    });
    logStorageDebug('target-bucket', {
      bucket: bucketName,
      exists: true,
      targetStatus: bucketCheck.targetStatus,
      targetBody: bucketCheck.targetBodySummary || null
    });
    return bucketCheck;
  } catch (error) {
    const debug = error?.storageDebug || {};
    logStorageDebug('buckets', {
      listStatus: debug.listStatus ?? null,
      visibleBuckets: debug.visibleBucketNames || [],
      listBody: debug.listBodySummary || null
    });
    logStorageDebug('target-bucket', {
      bucket: bucketName,
      exists: false,
      targetStatus: debug.targetStatus ?? null,
      targetBody: debug.targetBodySummary || null
    });
    throw error;
  }
};

const formatCurrency = (v) =>
  `${Math.round(toNumber(v, 0)).toLocaleString('fr-FR')} €`;

/* ─── Base URL ───────────────────────────────────────────────────────────── */

const getBaseUrl = (req) => {
  const explicit = readEnv('APP_BASE_URL');
  if (explicit) return explicit.replace(/\/$/, '');
  
  if (req && req.headers && req.headers.host) {
    const protocol = req.headers['x-forwarded-proto'] || 'https';
    return `${protocol}://${req.headers.host}`;
  }
  
  const vercelUrl = readEnv('VERCEL_URL');
  if (vercelUrl) return `https://${vercelUrl}`;
  
  return 'http://localhost:3000';
};

/* ─── Token ──────────────────────────────────────────────────────────────── */

const generateToken = () => {
  const raw = crypto.randomBytes(32).toString('hex');
  const hash = crypto.createHash('sha256').update(raw).digest('hex');
  const expiresAt = new Date(Date.now() + TOKEN_TTL_SECONDS * 1000).toISOString();
  return { raw, hash, expiresAt };
};

/* ─── Storage path ───────────────────────────────────────────────────────── */

const buildStoragePath = (publicReportId) => {
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, '0');
  const safeId = sanitizeFileSegment(String(publicReportId || 'report'), 'report');
  return `reports/${year}/${month}/${safeId}/official.pdf`;
};

/* ─── Supabase REST helpers ──────────────────────────────────────────────── */

const createRestHeaders = (serviceKey, extra = {}) => ({
  apikey: serviceKey,
  Authorization: `Bearer ${serviceKey}`,
  ...extra
});

const supabaseRest = async (supabaseUrl, serviceKey, path, options = {}) => {
  const res = await fetch(`${supabaseUrl}/rest/v1/${path}`, {
    method: options.method || 'GET',
    headers: createRestHeaders(serviceKey, options.headers || {}),
    body: options.body
  });
  const raw = await res.text();
  const data = raw ? safeJsonParse(raw) : null;
  if (!res.ok) {
    const msg = data?.message || data?.error_description || raw || `HTTP ${res.status}`;
    throw createHttpError(res.status, msg);
  }
  return data;
};

/* ─── Database operations ────────────────────────────────────────────────── */

const insertPublicReport = async ({ supabaseUrl, serviceKey, payload }) => {
  const res = await fetch(`${supabaseUrl}/rest/v1/public_reports`, {
    method: 'POST',
    headers: createRestHeaders(serviceKey, {
      'Content-Type': 'application/json',
      Prefer: 'return=representation'
    }),
    body: JSON.stringify(payload)
  });
  const raw = await res.text();
  const data = raw ? safeJsonParse(raw) : null;
  if (!res.ok) {
    throw createHttpError(res.status, data?.message || data?.error || raw || 'Insert public_reports failed');
  }
  return Array.isArray(data) ? data[0] : data;
};

const updatePublicReport = async ({ supabaseUrl, serviceKey, publicReportId, patch }) => {
  try {
    await supabaseRest(
      supabaseUrl, serviceKey,
      `public_reports?id=eq.${encodeQ(publicReportId)}`,
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
    await supabaseRest(
      supabaseUrl, serviceKey,
      `lead_submissions?id=eq.${encodeQ(leadSubmissionId)}`,
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

/* ─── Storage operations ─────────────────────────────────────────────────── */

const uploadPdfToStorage = async ({ supabaseUrl, serviceKey, storagePath, pdfBuffer }) => {
  const result = await fetchStorageJson({
    supabaseUrl,
    serviceKey,
    path: `object/${PUBLIC_REPORT_ASSETS_BUCKET}/${encodeStoragePath(storagePath)}`,
    method: 'POST',
    headers: {
      'Content-Type': 'application/pdf',
      'x-upsert': 'true'
    },
    body: pdfBuffer
  });
  if (!result.ok) {
    console.error('[public-report-pdf] storage-debug upload-error', {
      bucket: PUBLIC_REPORT_ASSETS_BUCKET,
      storagePath,
      status: result.status,
      body: result.bodySummary || null,
      url: result.url
    });
    throw createHttpError(result.status, buildStorageErrorMessage('Storage upload failed', result));
  }
  return result.data;
};

const createSignedUrl = async ({ supabaseUrl, serviceKey, storagePath, expiresIn = SIGNED_URL_TTL_SECONDS }) => {
  const result = await fetchStorageJson({
    supabaseUrl,
    serviceKey,
    path: `object/sign/${PUBLIC_REPORT_ASSETS_BUCKET}/${encodeStoragePath(storagePath)}`,
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ expiresIn })
  });

  if (!result.ok) {
    console.error('[public-report-pdf] storage-debug signed-url-error', {
      bucket: PUBLIC_REPORT_ASSETS_BUCKET,
      storagePath,
      status: result.status,
      body: result.bodySummary || null,
      url: result.url
    });
    throw createHttpError(result.status, buildStorageErrorMessage('Signed URL creation failed', result));
  }

  const signedPath = String(
    result.data?.signedURL || result.data?.signedUrl || result.data?.signed_url || result.data?.path || ''
  ).trim();

  if (!signedPath) {
    throw createHttpError(500, 'Signed URL response missing path');
  }

  const reportUrl = /^https?:\/\//i.test(signedPath)
    ? signedPath
    : `${supabaseUrl}${signedPath.startsWith('/storage/v1/')
      ? signedPath
      : signedPath.startsWith('/object/')
        ? `/storage/v1${signedPath}`
        : `/storage/v1/${signedPath.replace(/^\/+/, '')}`
    }`;
  return {
    reportUrl,
    expiresAt: new Date(Date.now() + expiresIn * 1000).toISOString()
  };

};

/* ─── Email ──────────────────────────────────────────────────────────────── */

const sendPdfReadyEmail = async ({ email, siteName, scoreLettre, annualEuro, pdfUrl }) => {
  const resendApiKey = readEnv('RESEND_API_KEY');
  const resendFrom = readEnv('RESEND_FROM');
  if (!resendApiKey || !resendFrom) {
    console.warn('[public-report-pdf] Missing Resend config — email skipped');
    return;
  }

  const safe = (v) => escapeHtml(String(v ?? ''));
  const name = siteName || 'Votre bâtiment';
  const score = scoreLettre ? `Indice ${scoreLettre}` : 'Indice calculé';
  const savings = formatCurrency(annualEuro || 0);
  const safeUrl = safe(pdfUrl || '#');

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${resendApiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: resendFrom,
      to: [email],
      subject: 'Votre rapport DiagTertiaire est prêt',
      html: `
<div style="font-family:Arial,sans-serif;background:#F8FAFC;padding:20px;">
  <div style="max-width:560px;margin:0 auto;background:#fff;border:1px solid #E2E8F0;border-radius:16px;overflow:hidden;">
    <div style="padding:20px 24px;background:linear-gradient(135deg,#102A43 0%,#1D4ED8 100%);color:#fff;">
      <div style="font-size:11px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;opacity:0.7;">DiagTertiaire</div>
      <h1 style="margin:8px 0 0;font-size:22px;line-height:1.2;">Votre rapport est disponible</h1>
    </div>
    <div style="padding:24px;">
      <p style="margin:0 0 16px;font-size:14px;color:#0F172A;">Pré-diagnostic pour <strong>${safe(name)}</strong> — ${safe(score)}, économies estimées <strong>${safe(savings)}/an</strong>.</p>
      <a href="${safeUrl}" style="display:inline-block;padding:13px 22px;border-radius:10px;background:#1D4ED8;color:#fff;text-decoration:none;font-weight:700;font-size:14px;">
        Télécharger mon rapport PDF
      </a>
      <p style="margin:14px 0 0;font-size:11px;color:#94A3B8;">Ce lien est valable 30 jours.</p>
    </div>
  </div>
</div>`,
      text: `Rapport DiagTertiaire prêt — ${name} · ${score} · ${savings}/an\n\nTélécharger : ${pdfUrl || ''}\n\nLien valable 30 jours.`
    })
  });

  if (!res.ok) {
    const t = await res.text();
    console.warn('[public-report-pdf] Email delivery failed:', res.status, t.slice(0, 200));
  }
};

/* ─── Email meta helper ──────────────────────────────────────────────────── */

const extractEmailMeta = (reportPayload) => {
  const inputs = asPlainObject(reportPayload.inputs_summary);
  const bench = asPlainObject(reportPayload.benchmark_result);
  const composite = asPlainObject(reportPayload.composite_savings);
  const siteI = toNumber(bench.site_intensity?.value, 0);
  const benchMed = toNumber(bench.benchmark_median?.value, 1);
  const ratio = siteI / Math.max(1, benchMed);
  const score = ratio < 0.6 ? 'A' : ratio < 0.9 ? 'B' : ratio < 1.2 ? 'C' : ratio < 1.7 ? 'D' : 'E';
  return {
    email: String(inputs.email || '').trim(),
    siteName: String(inputs.site_name || '').trim(),
    scoreLettre: score,
    annualEuro: toNumber(composite.annual_euro?.value, 0)
  };
};

/* ─── Handler ────────────────────────────────────────────────────────────── */

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  let publicReportId = null;
  let supabaseCtx = null;

  try {
    enforceRateLimit(req, {
      scope: 'public-report-pdf',
      windowMs: 10 * 60 * 1000,
      maxHits: 5,
      message: 'Too many PDF generation requests. Please retry in a few minutes.'
    });
    assertMaxContentLength(req, MAX_PUBLIC_REPORT_PAYLOAD_BYTES, 'Payload too large');

    const body = safeJsonParse(req.body);
    assertMaxBodyBytes(body ?? req.body, MAX_PUBLIC_REPORT_PAYLOAD_BYTES, 'Payload too large');
    const payload = asPlainObject(body);
    const leadSubmissionId = assertUuidLike(payload.lead_submission_id, 'lead_submission_id', { optional: true });
    const reportPayload = asPlainObject(payload.report_payload);
    const reportId = String(reportPayload.report_id || '').trim();

    if (!reportId) {
      throw createHttpError(400, 'Missing report_payload.report_id');
    }
    if (reportId.length > 160) {
      throw createHttpError(400, 'Invalid report_payload.report_id');
    }

    supabaseCtx = getRequiredServerSupabaseConfig();
    const { supabaseUrl, serviceKey, serviceKeySource } = supabaseCtx;

    // 1. Fetch lead record email as fallback
    let leadEmail = null;
    if (leadSubmissionId) {
      try {
        const rows = await supabaseRest(
          supabaseUrl, serviceKey,
          `lead_submissions?id=eq.${encodeQ(leadSubmissionId)}&select=id,email&limit=1`
        );
        leadEmail = asArray(rows)[0]?.email || null;
      } catch (err) {
        console.warn('[public-report-pdf] Lead fetch failed (non-fatal):', err.message);
      }
    }

    const emailMeta = extractEmailMeta(reportPayload);
    const inputPayload = asPlainObject(reportPayload.inputs_summary);
    const finalEmail = emailMeta.email || String(leadEmail || '').trim() || null;

    // 2. Generate short-lived print token
    const token = generateToken();

    // 3. INSERT public_reports — get id for storage path
    const publicReportRow = await insertPublicReport({
      supabaseUrl,
      serviceKey,
      payload: {
        lead_submission_id: leadSubmissionId || null,
        email: finalEmail || null,
        site_name: emailMeta.siteName || null,
        // Keep cover metadata in JSON payloads only: the deployed public_reports
        // schema cannot be assumed to expose optional cover_* columns.
        input_payload: inputPayload,
        report_payload: reportPayload,
        pdf_status: 'generating',
        access_token_hash: token.hash,
        access_expires_at: token.expiresAt,
        updated_at: new Date().toISOString()
      }
    });
    publicReportId = publicReportRow?.id || null;

    if (!publicReportId) {
      throw createHttpError(500, 'INSERT public_reports returned no id');
    }

    // 4. Build print URL and storage path
    const baseUrl = getBaseUrl(req);
    const printUrl = `${baseUrl}/public-report-print.html?public_report_id=${encodeQ(publicReportId)}&token=${encodeQ(token.raw)}`;
    const storagePath = buildStoragePath(publicReportId);
    console.log('[public-report-pdf] Print URL:', printUrl);

    // 5. Render PDF via Puppeteer + dedicated print page
    const pdfBuffer = await renderPdfFromUrl(printUrl, {
      timeoutMs: 45_000,
      readySignal: 'window.__REPORT_READY__ === true',
      errorSignal: 'window.__REPORT_ERROR__',
      mediaType: 'print',
      pdfOptions: {
        format: 'A4',
        printBackground: true,
        preferCSSPageSize: true,
        margin: { top: '16mm', right: '14mm', bottom: '14mm', left: '14mm' }
      }
    });

    await checkStorageBucket({
      supabaseUrl,
      serviceKey,
      serviceKeySource,
      bucketName: PUBLIC_REPORT_ASSETS_BUCKET
    });
    logStorageDebug('upload-target', {
      supabaseUrl,
      bucket: PUBLIC_REPORT_ASSETS_BUCKET,
      storagePath,
      bufferBytes: pdfBuffer.length
    });

    // 6. Upload to public-report-assets
    await uploadPdfToStorage({ supabaseUrl, serviceKey, storagePath, pdfBuffer });
    console.log('[public-report-pdf] Uploaded:', storagePath);

    await checkStorageBucket({
      supabaseUrl,
      serviceKey,
      serviceKeySource,
      bucketName: PUBLIC_REPORT_ASSETS_BUCKET
    });
    logStorageDebug('signed-url-target', {
      supabaseUrl,
      bucket: PUBLIC_REPORT_ASSETS_BUCKET,
      storagePath,
      expiresIn: SIGNED_URL_TTL_SECONDS
    });

    // 7. Create signed URL (30 days)
    const { reportUrl, expiresAt } = await createSignedUrl({ supabaseUrl, serviceKey, storagePath });
    console.log('[public-report-pdf] Signed URL expires:', expiresAt);

    // 8. Update public_reports: ready + clear print token
    await updatePublicReport({
      supabaseUrl, serviceKey, publicReportId,
      patch: {
        pdf_status: 'ready',
        pdf_error: null,
        latest_pdf_bucket: PUBLIC_REPORT_ASSETS_BUCKET,
        latest_pdf_path: storagePath,
        latest_pdf_generated_at: new Date().toISOString(),
        access_token_hash: null,
        access_expires_at: null
      }
    });

    // 9. Update lead_submissions.pdf_url (best-effort)
    await updateLeadSubmissionPdfUrl({
      supabaseUrl, serviceKey, leadSubmissionId, pdfUrl: reportUrl, expiresAt
    });

    // 10. Send email (fire-and-forget)
    if (finalEmail) {
      sendPdfReadyEmail({
        email: finalEmail,
        siteName: emailMeta.siteName,
        scoreLettre: emailMeta.scoreLettre,
        annualEuro: emailMeta.annualEuro,
        pdfUrl: reportUrl
      }).catch(err => console.warn('[public-report-pdf] Email error:', err.message));
    }

    console.log('[public-report-pdf] status: ready —', publicReportId);

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
    if (Number.isInteger(error?.rateLimit?.retryAfterSeconds)) {
      res.setHeader('Retry-After', String(error.rateLimit.retryAfterSeconds));
    }
    if (publicReportId && supabaseCtx) {
      updatePublicReport({
        supabaseUrl: supabaseCtx.supabaseUrl,
        serviceKey: supabaseCtx.serviceKey,
        publicReportId,
        patch: {
          pdf_status: 'failed',
          pdf_error: String(error?.message || 'Unknown error').slice(0, 500),
          access_token_hash: null,
          access_expires_at: null
        }
      }).catch(() => { });
    }

    console.error('[public-report-pdf] status: failed —', error?.message || error);
    const statusCode = Number.isInteger(error?.statusCode) ? error.statusCode : 500;
    console.error('[public-report-pdf] status: failed', {
      statusCode,
      message: error?.message || String(error),
      publicReportId,
      storageDebug: error?.storageDebug || null
    });
    return res.status(statusCode).json({
      ok: false,
      error: error?.message || 'Public report PDF generation failed'
    });
  }
};
