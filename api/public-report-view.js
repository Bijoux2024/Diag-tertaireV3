'use strict';

/**
 * api/public-report-view.js — Lecture sécurisée d'un rapport public
 *
 * Vérifie le token temporaire stocké sous forme de hash SHA-256
 * dans public_reports.access_token_hash / access_expires_at.
 * Retourne le report_payload si valide.
 *
 * GET /api/public-report-view?public_report_id=...&token=...
 */

const crypto = require('crypto');
const {
  assertHexToken,
  assertUuidLike,
  enforceRateLimit
} = require('./_lib/request-guard');
const { getRequiredServerSupabaseConfig } = require('./_lib/supabase-server');

const encodeQ = (v) => encodeURIComponent(String(v ?? ''));
const toBoolean = (value) => {
  if (value === true || value === false) return value;
  const normalized = String(value ?? '').trim().toLowerCase();
  return normalized === 'true' || normalized === '1' || normalized === 'yes';
};
const isDirectCoverUrl = (value) => {
  const path = String(value || '').trim();
  return /^https?:\/\//i.test(path)
    || path.startsWith('/')
    || /^api\//i.test(path);
};
const normalizeDirectCoverUrl = (value) => {
  const path = String(value || '').trim();
  if (!path) return '';
  if (/^https?:\/\//i.test(path)) return path;
  return path.startsWith('/') ? path : '/' + path.replace(/^\/+/, '');
};

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const rawPublicReportId = String(req.query.public_report_id || '').trim();
  const rawToken = String(req.query.token || '').trim();

  if (!rawPublicReportId || !rawToken) {
    return res.status(400).json({ error: 'Missing public_report_id or token' });
  }

  let publicReportId;
  let token;
  try {
    enforceRateLimit(req, {
      scope: 'public-report-view',
      windowMs: 10 * 60 * 1000,
      maxHits: 120,
      message: 'Too many report access attempts. Please retry later.'
    });
    publicReportId = assertUuidLike(rawPublicReportId, 'public_report_id');
    token = assertHexToken(rawToken, {
      fieldName: 'token',
      statusCode: 401,
      message: 'Invalid token'
    });
  } catch (error) {
    if (Number.isInteger(error?.rateLimit?.retryAfterSeconds)) {
      res.setHeader('Retry-After', String(error.rateLimit.retryAfterSeconds));
    }
    const statusCode = Number.isInteger(error?.statusCode) ? error.statusCode : 400;
    return res.status(statusCode).json({ error: error.message || 'Invalid request' });
  }

  let supabaseCtx;
  try {
    supabaseCtx = getRequiredServerSupabaseConfig();
  } catch (err) {
    console.error('[public-report-view] Config error:', err.message);
    return res.status(500).json({ error: 'Server configuration error' });
  }

  try {
    const { supabaseUrl, serviceKey } = supabaseCtx;

    const dbRes = await fetch(
      `${supabaseUrl}/rest/v1/public_reports?id=eq.${encodeQ(publicReportId)}&select=id,report_payload,access_token_hash,access_expires_at,cover_image_url,cover_image_source&limit=1`,
      {
        headers: {
          apikey: serviceKey,
          Authorization: `Bearer ${serviceKey}`
        }
      }
    );

    if (!dbRes.ok) {
      const text = await dbRes.text();
      console.error('[public-report-view] DB error:', dbRes.status, text.slice(0, 200));
      return res.status(500).json({ error: 'Database error' });
    }

    const rows = await dbRes.json();
    const row = Array.isArray(rows) ? rows[0] : null;

    if (!row) {
      console.warn('[public-report-view] Not found:', publicReportId);
      return res.status(404).json({ error: 'Report not found' });
    }

    if (!row.access_token_hash) {
      console.warn('[public-report-view] No token hash stored for:', publicReportId);
      return res.status(401).json({ error: 'Token not available' });
    }

    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    if (row.access_token_hash !== tokenHash) {
      console.warn('[public-report-view] Invalid token for:', publicReportId);
      return res.status(401).json({ error: 'Invalid token' });
    }

    if (row.access_expires_at && new Date(row.access_expires_at) < new Date()) {
      console.warn('[public-report-view] Expired token for:', publicReportId);
      return res.status(401).json({ error: 'Token expired' });
    }

    // Cover asset for print page.
    // Priority: inputs_summary.cover_* metadata from the public form.
    let printAssets = {};
    try {
      const inputs = (row.report_payload && row.report_payload.inputs_summary) || {};
      const coverSelected = toBoolean(inputs.cover_image_selected);
      const coverPath = String(inputs.cover_image_path || row.cover_image_url || '').trim();
      const coverSourceHint = String(inputs.cover_image_source || row.cover_image_source || '').trim();
      printAssets = {
        cover_image_selected: coverSelected,
        cover_image_source: coverSourceHint || null,
        cover_image_path: coverPath || null,
        cover_image_url: null
      };

      if (coverSelected && coverPath && isDirectCoverUrl(coverPath)) {
        // Direct URL or first-party route (e.g. /api/public-report-google-streetview).
        printAssets.cover_image_url = normalizeDirectCoverUrl(coverPath);
        printAssets.cover_image_source = coverSourceHint || 'url';
      } else if (coverSelected && coverPath) {
        // Storage path → generate fresh signed URL (1 hour TTL sufficient for print session)
        const coverBucket = String(process.env.REPORT_COVER_BUCKET || 'report-cover-assets');
        const encodedPath = coverPath.split('/').map(function(s) { return encodeURIComponent(s); }).join('/');
        const signRes = await fetch(
          supabaseUrl + '/storage/v1/object/sign/' + coverBucket + '/' + encodedPath,
          {
            method: 'POST',
            headers: {
              apikey: serviceKey,
              Authorization: 'Bearer ' + serviceKey,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ expiresIn: 3600 })
          }
        );
        if (signRes.ok) {
          const signData = await signRes.json();
          const sp = String(signData && (signData.signedURL || signData.signedUrl || signData.path) || '').trim();
          if (sp) {
            const coverUrl = /^https?:\/\//i.test(sp) ? sp
              : supabaseUrl + (sp.startsWith('/storage/v1/') ? sp : '/storage/v1/' + sp.replace(/^\/+/, ''));
            printAssets.cover_image_url = coverUrl;
            printAssets.cover_image_source = coverSourceHint || 'storage';
          }
        } else {
          const signBody = await signRes.text();
          console.error('[public-report-view] Cover sign failed:', {
            publicReportId,
            bucket: coverBucket,
            status: signRes.status,
            body: signBody.slice(0, 400),
            source: coverSourceHint || null,
            path: coverPath
          });
        }
      }

      if (coverSelected && !printAssets.cover_image_url) {
        const coverError = 'Selected cover image has no printable URL';
        printAssets.cover_image_error = coverError;
        console.error('[public-report-view] ' + coverError + ':', {
          publicReportId,
          source: coverSourceHint || null,
          path: coverPath || null
        });
      }
    } catch (coverErr) {
      console.error('[public-report-view] Cover resolution failed:', {
        publicReportId,
        message: coverErr.message
      });
      printAssets.cover_image_error = coverErr.message || 'Cover resolution failed';
    }

    return res.status(200).json({
      ok: true,
      public_report_id: row.id,
      report_payload: row.report_payload || {},
      print_assets: printAssets
    });

  } catch (error) {
    if (Number.isInteger(error?.rateLimit?.retryAfterSeconds)) {
      res.setHeader('Retry-After', String(error.rateLimit.retryAfterSeconds));
    }
    console.error('[public-report-view] Unexpected error:', error.message);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
