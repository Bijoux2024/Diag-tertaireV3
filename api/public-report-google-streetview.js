'use strict';

/**
 * api/public-report-google-streetview.js
 *
 * Route proxy pour Google Street View, protégeant la clé API côté serveur.
 * 
 * Usages :
 * 1. GET /api/public-report-google-streetview?action=meta&lat=...&lon=...
 *    -> Renvoie les métadonnées de disponibilité (Street View Metadata API).
 * 
 * 2. GET /api/public-report-google-streetview?action=image&lat=...&lon=...&heading=...&pitch=...&fov=...
 *    -> Renvoie le binaire de l'image au format JPEG par proxy (Street View Static API).
 */

const readEnv = (key) => String(process.env[key] || '').trim();
const {
  assertNumberInRange,
  createHttpError,
  enforceRateLimit
} = require('./_lib/request-guard');

// Limiteur rudimentaire "Soft Cap" Vercel : 
// En serverless, ce compteur est global au "container" Vercel. Dès que le container meurt (Cold Start), 
// le compteur retombe à zéro. Cela offre une protection empirique mais pas absolue si l'app tourne sur 50 containers.
// Une protection 100% stricte exigerait un appel Redis/Supabase.
let svDailyCounter = 0;
let svLastResetDay = new Date().getDate();

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  try {
    const action = String(req.query.action || '').trim().toLowerCase();
    const lat = assertNumberInRange(req.query.lat, { fieldName: 'lat', min: -90, max: 90 });
    const lon = assertNumberInRange(req.query.lon, { fieldName: 'lon', min: -180, max: 180 });

    if (action !== 'meta' && action !== 'image') {
      throw createHttpError(400, 'Invalid action parameter. Must be "meta" or "image".');
    }

    enforceRateLimit(req, {
      scope: `public-report-google-streetview:${action}`,
      windowMs: 10 * 60 * 1000,
      maxHits: action === 'image' ? 20 : 60,
      message: 'Too many Street View requests. Please retry later.'
    });

    const currentDay = new Date().getDate();
    if (currentDay !== svLastResetDay) {
      svDailyCounter = 0;
      svLastResetDay = currentDay;
    }

    if (svDailyCounter >= 300) {
      return res.status(429).json({
        ok: false,
        error: "Quota journalier interne Street View atteint (300 requêtes/jour).",
        fallback_recommended: true
      });
    }
    
    // On incrémente pour chaque appel (meta ou proxy)
    svDailyCounter++;
    const apiKey = readEnv('GOOGLE_STREETVIEW_SERVER_KEY');
    if (!apiKey) {
      throw createHttpError(500, 'GOOGLE_STREETVIEW_SERVER_KEY is not configured on server.');
    }

    if (action === 'meta') {
      // 1. Metadata check pour voir si la vue existe (facturé différemment ou pas)
      const metaUrl = `https://maps.googleapis.com/maps/api/streetview/metadata?location=${lat},${lon}&key=${apiKey}`;
      const metaRes = await fetch(metaUrl);
      
      if (!metaRes.ok) {
        throw createHttpError(metaRes.status, 'Google Street View Metadata API call failed');
      }

      const metaData = await metaRes.json();
      
      if (metaData.status === 'OK') {
        return res.status(200).json({
          ok: true,
          streetview_available: true,
          location_used: metaData.location,
          pano_id: metaData.pano_id,
          date: metaData.date,
          source: 'google_streetview',
          heading: 0,
          pitch: 0,
          fov: 90
        });
      } else {
        return res.status(200).json({
          ok: true,
          streetview_available: false,
          status: metaData.status
        });
      }

    } else if (action === 'image') {
      // 2. Fetch du binaire d'image final sans dévoiler la clé Google au frontend
      const h = assertNumberInRange(req.query.heading, { fieldName: 'heading', min: -360, max: 360, optional: true }) ?? 0;
      const p = assertNumberInRange(req.query.pitch, { fieldName: 'pitch', min: -90, max: 90, optional: true }) ?? 0;
      const f = assertNumberInRange(req.query.fov, { fieldName: 'fov', min: 10, max: 120, optional: true }) ?? 90;
      const size = '600x400';

      const imageUrl = `https://maps.googleapis.com/maps/api/streetview?size=${size}&location=${lat},${lon}&heading=${h}&pitch=${p}&fov=${f}&return_error_code=true&key=${apiKey}`;
      
      const imageRes = await fetch(imageUrl);

      if (!imageRes.ok) {
        const text = await imageRes.text();
        throw createHttpError(imageRes.status, `Google Street View Static API failed: ${text}`);
      }

      const arrayBuffer = await imageRes.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      res.setHeader('Content-Type', 'image/jpeg');
      res.setHeader('Cache-Control', 'public, max-age=86400');
      
      return res.send(buffer);

    } else {
      throw createHttpError(400, 'Invalid action parameter. Must be "meta" or "image".');
    }

  } catch (error) {
    if (Number.isInteger(error?.rateLimit?.retryAfterSeconds)) {
      res.setHeader('Retry-After', String(error.rateLimit.retryAfterSeconds));
    }
    console.error('[public-report-google-streetview] Error:', error);
    const statusCode = Number.isInteger(error?.statusCode) ? error.statusCode : 500;
    return res.status(statusCode).json({
      ok: false,
      error: error?.message || 'Street View Proxy error'
    });
  }
};
