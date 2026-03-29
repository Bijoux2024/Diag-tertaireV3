'use strict';

/**
 * api/public-report-cover-upload.js
 *
 * Route pour uploader une photo manuelle (premium) pour la couverture du rapport.
 * Accepte le fichier sous format Json Base64 ou Binaire, au choix.
 * 
 * Headers si binaire :
 * - content-type: application/octet-stream
 * - x-file-name: (encodé URI)
 * - x-file-type: image/jpeg, image/png, etc.
 * - x-public-report-id: (optionnel) UUID du rapport existant
 */

const {
  assertStorageBucketExists,
  describeServerSupabaseConfig,
  fetchStorageJson,
  getRequiredServerSupabaseConfig
} = require('./_lib/supabase-server');
const {
  assertAllowedContentType,
  assertMaxBodyBytes,
  assertMaxContentLength,
  assertUuidLike,
  createHttpError,
  enforceRateLimit,
  normalizeContentType
} = require('./_lib/request-guard');

const MAX_FILE_BYTES = Math.floor(3.5 * 1024 * 1024);
const MAX_REQUEST_BYTES = 5 * 1024 * 1024;
const ALLOWED_IMAGE_CONTENT_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const EXT_BY_CONTENT_TYPE = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp'
};

const safeJsonParse = (value) => {
  if (typeof value !== 'string') return value;
  try { return JSON.parse(value); } catch { return null; }
};

const asPlainObject = (value) => value && typeof value === 'object' && !Array.isArray(value) ? value : {};

const readEnv = (key) => String(process.env[key] || '').trim();

const encodeStoragePath = (path) =>
  String(path || '')
    .split('/')
    .map(segment => encodeURIComponent(segment))
    .join('/');

const buildStorageErrorMessage = (fallbackMessage, result) => {
  const parts = [fallbackMessage];
  if (Number.isInteger(result?.status)) parts.push(`HTTP ${result.status}`);
  if (result?.bodySummary) parts.push(result.bodySummary);
  return parts.join(' - ');
};

const logStorageDebug = (label, payload) => {
  console.log(`[public-report-cover-upload] storage-debug ${label}`, payload);
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

const createRestHeaders = (serviceKey, extra = {}) => ({
  apikey: serviceKey,
  Authorization: `Bearer ${serviceKey}`,
  ...extra
});

const getRawBody = (req) => {
  return new Promise((resolve, reject) => {
    let chunks = [];
    req.on('data', chunk => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
};

const uploadBufferToStorage = async ({ supabaseUrl, serviceKey, bucket, storagePath, buffer, contentType }) => {
  const result = await fetchStorageJson({
    supabaseUrl,
    serviceKey,
    path: `object/${bucket}/${encodeStoragePath(storagePath)}`,
    method: 'POST',
    headers: {
      'Content-Type': contentType,
      'x-upsert': 'true'
    },
    body: buffer
  });
  if (!result.ok) {
    console.error('[public-report-cover-upload] storage-debug upload-error', {
      bucket,
      storagePath,
      status: result.status,
      body: result.bodySummary || null,
      url: result.url
    });
    throw createHttpError(result.status, buildStorageErrorMessage('Storage upload failed', result));
  }
  return result.data;
};

const createSignedUrl = async ({ supabaseUrl, serviceKey, bucket, storagePath, expiresIn = 3600 * 24 * 30 }) => {
  const result = await fetchStorageJson({
    supabaseUrl,
    serviceKey,
    path: `object/sign/${bucket}/${encodeStoragePath(storagePath)}`,
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ expiresIn })
  });
  if (!result.ok) {
    console.error('[public-report-cover-upload] storage-debug signed-url-error', {
      bucket,
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
  if (!signedPath) throw createHttpError(500, 'Signed URL response missing path');

  const reportUrl = /^https?:\/\//i.test(signedPath)
    ? signedPath
    : `${supabaseUrl}${signedPath.startsWith('/storage/v1/') ? signedPath : signedPath.startsWith('/object/') ? `/storage/v1${signedPath}` : `/storage/v1/${signedPath.replace(/^\/+/, '')}`}`;

  return reportUrl;
};

async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    enforceRateLimit(req, {
      scope: 'public-report-cover-upload',
      windowMs: 10 * 60 * 1000,
      maxHits: 8,
      message: 'Too many cover upload requests. Please retry later.'
    });
    assertMaxContentLength(req, MAX_REQUEST_BYTES, 'File too large (max 3.5 MB)');

    let buffer;
    let fileName = 'upload.jpg';
    let contentType = 'image/jpeg';
    let reportIdStr = `anon_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const requestContentType = normalizeContentType(req.headers['content-type']);

    // Si le client choisit de confier la lecture complète au req.body JSON (base64)
    if (requestContentType === 'application/json') {
      const rawBody = Buffer.isBuffer(req.body) ? req.body : await getRawBody(req);
      assertMaxBodyBytes(rawBody, MAX_REQUEST_BYTES, 'File too large (max 3.5 MB)');
      const parsedBody = asPlainObject(safeJsonParse(rawBody.toString('utf8')));
      const payload = parsedBody;
      if (!payload.file_base64) throw createHttpError(400, 'Missing file_base64 in JSON payload');
      
      const match = payload.file_base64.match(/^data:(image\/[^;]+);base64,(.+)$/);
      if (!match) throw createHttpError(400, 'Invalid base64 Data URL format');
      
      contentType = assertAllowedContentType(match[1], ALLOWED_IMAGE_CONTENT_TYPES, {
        fieldName: 'file image type'
      });
      buffer = Buffer.from(match[2], 'base64');
      fileName = payload.file_name || 'upload.jpg';
      if (payload.report_id) reportIdStr = assertUuidLike(payload.report_id, 'report_id');
    } else {
      // Sinon on traite le stream binaire raw !
      contentType = assertAllowedContentType(req.headers['x-file-type'] || 'image/jpeg', ALLOWED_IMAGE_CONTENT_TYPES, {
        fieldName: 'file image type'
      });
      buffer = Buffer.isBuffer(req.body) ? req.body : await getRawBody(req);
      const rawFileName = req.headers['x-file-name'] || 'upload.jpg';
      fileName = decodeURIComponent(rawFileName).replace(/[^a-zA-Z0-9.\-_]/g, '');
      if (req.headers['x-public-report-id']) {
        reportIdStr = assertUuidLike(req.headers['x-public-report-id'], 'x-public-report-id');
      }
    }

    if (!buffer || buffer.length === 0) {
      throw createHttpError(400, 'Empty file buffer');
    }

    // 3.5 Mo maximum (pour rester sous 4.5 Mo de Vercel Request Limit une fois en Base64)
    if (buffer.length > MAX_FILE_BYTES) {
      throw createHttpError(413, 'File too large (max 3.5 MB)');
    }

    const { supabaseUrl, serviceKey, serviceKeySource } = getRequiredServerSupabaseConfig();
    const configuredBucketName = readEnv('REPORT_COVER_BUCKET');
    const bucketName = configuredBucketName || 'report-cover-assets';

    const ext = EXT_BY_CONTENT_TYPE[contentType] || 'jpg';

    // Chemin propre et déterministe
    const storagePath = `covers/manual/${reportIdStr}/${Date.now()}_cover.${ext}`;

    await checkStorageBucket({
      supabaseUrl,
      serviceKey,
      serviceKeySource,
      bucketName,
      bucketEnvName: 'REPORT_COVER_BUCKET',
      bucketEnvValue: configuredBucketName || null
    });
    logStorageDebug('upload-target', {
      supabaseUrl,
      bucket: bucketName,
      storagePath,
      bufferBytes: buffer.length,
      contentType
    });
    await uploadBufferToStorage({
      supabaseUrl, serviceKey, bucket: bucketName,
      storagePath, buffer, contentType
    });

    await checkStorageBucket({
      supabaseUrl,
      serviceKey,
      serviceKeySource,
      bucketName,
      bucketEnvName: 'REPORT_COVER_BUCKET',
      bucketEnvValue: configuredBucketName || null
    });
    logStorageDebug('signed-url-target', {
      supabaseUrl,
      bucket: bucketName,
      storagePath,
      expiresIn: 3600 * 24 * 30
    });
    const signedUrl = await createSignedUrl({
      supabaseUrl, serviceKey, bucket: bucketName,
      storagePath, expiresIn: 3600 * 24 * 30 // URL valable 30 jours
    });

    return res.status(200).json({
      ok: true,
      cover_image_status: 'ready',
      cover_image_source: 'upload',
      cover_image_path: storagePath,
      cover_image_signed_url: signedUrl,
      cover_original_filename: fileName,
      cover_mime_type: contentType,
      cover_file_size: buffer.length,
      cover_is_manual: true,
      cover_generated_at: new Date().toISOString()
    });

  } catch (error) {
    if (Number.isInteger(error?.rateLimit?.retryAfterSeconds)) {
      res.setHeader('Retry-After', String(error.rateLimit.retryAfterSeconds));
    }
    console.error('[public-report-cover-upload] status: failed', {
      statusCode: Number.isInteger(error?.statusCode) ? error.statusCode : 500,
      message: error?.message || String(error),
      storageDebug: error?.storageDebug || null
    });
    console.error('[public-report-cover-upload] Unhandled error:', error);
    const statusCode = Number.isInteger(error?.statusCode) ? error.statusCode : 500;
    res.status(statusCode).json({ 
      ok: false,
      error: error.message || 'Internal server error'
    });
  }
}

// Config Vercel : ne pas parser par défaut si on envoie un blob
handler.config = {
  api: {
    bodyParser: false,
    sizeLimit: '8mb',
  },
};

module.exports = handler;
