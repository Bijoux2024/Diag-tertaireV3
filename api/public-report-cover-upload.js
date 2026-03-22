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

const { getRequiredServerSupabaseConfig } = require('./_lib/supabase-server');

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

const getRawBody = (req) => {
  return new Promise((resolve, reject) => {
    let chunks = [];
    req.on('data', chunk => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
};

const uploadBufferToStorage = async ({ supabaseUrl, serviceKey, bucket, storagePath, buffer, contentType }) => {
  const res = await fetch(
    `${supabaseUrl}/storage/v1/object/${bucket}/${encodeStoragePath(storagePath)}`,
    {
      method: 'POST',
      headers: createRestHeaders(serviceKey, {
        'Content-Type': contentType,
        'x-upsert': 'true'
      }),
      body: buffer
    }
  );
  const raw = await res.text();
  const data = raw ? safeJsonParse(raw) : null;
  if (!res.ok) {
    throw createHttpError(res.status, data?.message || data?.error || raw || 'Storage upload failed');
  }
  return data;
};

const createSignedUrl = async ({ supabaseUrl, serviceKey, bucket, storagePath, expiresIn = 3600 * 24 * 30 }) => {
  const res = await fetch(
    `${supabaseUrl}/storage/v1/object/sign/${bucket}/${encodeStoragePath(storagePath)}`,
    {
      method: 'POST',
      headers: createRestHeaders(serviceKey, { 'Content-Type': 'application/json' }),
      body: JSON.stringify({ expiresIn })
    }
  );
  const raw = await res.text();
  const data = raw ? safeJsonParse(raw) : null;
  if (!res.ok) {
    throw createHttpError(res.status, data?.message || data?.error || raw || 'Signed URL creation failed');
  }

  const signedPath = String(data?.signedURL || data?.signedUrl || data?.signed_url || data?.path || '').trim();
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
    let buffer;
    let fileName = 'upload.jpg';
    let contentType = 'image/jpeg';
    let reportIdStr = `anon_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;

    // Si le client choisit de confier la lecture complète au req.body JSON (base64)
    if (req.headers['content-type'] && req.headers['content-type'].includes('application/json')) {
      const payload = asPlainObject(req.body) || safeJsonParse(req.body);
      if (!payload.file_base64) throw createHttpError(400, 'Missing file_base64 in JSON payload');
      
      const match = payload.file_base64.match(/^data:(image\/[^;]+);base64,(.+)$/);
      if (!match) throw createHttpError(400, 'Invalid base64 Data URL format');
      
      contentType = match[1];
      buffer = Buffer.from(match[2], 'base64');
      fileName = payload.file_name || 'upload.jpg';
      if (payload.report_id) reportIdStr = payload.report_id;
    } else {
      // Sinon on traite le stream binaire raw !
      buffer = Buffer.isBuffer(req.body) ? req.body : await getRawBody(req);
      const rawFileName = req.headers['x-file-name'] || 'upload.jpg';
      fileName = decodeURIComponent(rawFileName).replace(/[^a-zA-Z0-9.\-_]/g, '');
      contentType = req.headers['x-file-type'] || 'image/jpeg';
      reportIdStr = req.headers['x-public-report-id'] || reportIdStr;
    }

    if (!buffer || buffer.length === 0) {
      throw createHttpError(400, 'Empty file buffer');
    }

    // 5 Mo maximum environ (5242880)
    if (buffer.length > 5.5 * 1024 * 1024) {
      throw createHttpError(413, 'File too large (max 5 MB)');
    }

    const { supabaseUrl, serviceKey } = getRequiredServerSupabaseConfig();
    const bucketName = readEnv('REPORT_COVER_BUCKET') || 'report-cover-assets';

    const extMatch = fileName.match(/\.([^.]+)$/);
    const ext = extMatch ? extMatch[1].toLowerCase() : 'jpg';

    // Chemin propre et déterministe
    const storagePath = `covers/manual/${reportIdStr}/${Date.now()}_cover.${ext}`;

    await uploadBufferToStorage({
      supabaseUrl, serviceKey, bucket: bucketName,
      storagePath, buffer, contentType
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
