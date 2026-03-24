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
const { getRequiredServerSupabaseConfig } = require('./_lib/supabase-server');

const encodeQ = (v) => encodeURIComponent(String(v ?? ''));

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const publicReportId = String(req.query.public_report_id || '').trim();
  const token = String(req.query.token || '').trim();

  if (!publicReportId || !token) {
    return res.status(400).json({ error: 'Missing public_report_id or token' });
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
      `${supabaseUrl}/rest/v1/public_reports?id=eq.${encodeQ(publicReportId)}&select=id,report_payload,access_token_hash,access_expires_at&limit=1`,
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

    // Optional: generate fresh signed URL for cover image (non-blocking)
    let printAssets = {};
    try {
      const inputs = (row.report_payload && row.report_payload.inputs_summary) || {};
      const coverPath = String(inputs.cover_image_path || '').trim();
      if (coverPath && !/^https?:\/\//i.test(coverPath)) {
        // Storage path → generate signed URL
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
          }
        }
      }
    } catch (coverErr) {
      console.warn('[public-report-view] Cover signed URL failed (non-fatal):', coverErr.message);
    }

    return res.status(200).json({
      ok: true,
      public_report_id: row.id,
      report_payload: row.report_payload || {},
      print_assets: printAssets
    });

  } catch (error) {
    console.error('[public-report-view] Unexpected error:', error.message);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
