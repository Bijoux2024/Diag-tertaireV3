'use strict';

/**
 * api/public-report-cover.js — Génération de couverture (Façade Panoramax ou Fallback IGN)
 */

const { getRequiredServerSupabaseConfig } = require('./_lib/supabase-server');

/* ─── Helpers ────────────────────────────────────────────────────────────── */

const safeJsonParse = (value) => {
  if (typeof value !== 'string') return value;
  try { return JSON.parse(value); } catch { return null; }
};

const asPlainObject = (value) =>
  value && typeof value === 'object' && !Array.isArray(value) ? value : {};

const asArray = (value) => Array.isArray(value) ? value : [];

const readEnv = (key) => String(process.env[key] || '').trim();

const encodeQ = (v) => encodeURIComponent(String(v ?? ''));

const encodeStoragePath = (value) =>
  String(value || '').split('/').map(s => encodeURIComponent(s)).join('/');

const createHttpError = (statusCode, message) => {
  const e = new Error(message);
  e.statusCode = statusCode;
  return e;
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
    throw createHttpError(res.status, data?.message || data?.error_description || raw || `HTTP ${res.status}`);
  }
  return data;
};

const updatePublicReport = async ({ supabaseUrl, serviceKey, publicReportId, patch }) => {
  if (!publicReportId) return;
  await supabaseRest(
    supabaseUrl, serviceKey,
    `public_reports?id=eq.${encodeQ(publicReportId)}`,
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Prefer: 'return=minimal' },
      body: JSON.stringify(patch)
    }
  );
};

/* ─── Storage operations ─────────────────────────────────────────────────── */

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

const createSignedUrl = async ({ supabaseUrl, serviceKey, bucket, storagePath, expiresIn = 3600 }) => {
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
    : `${supabaseUrl}${signedPath.startsWith('/storage/v1/')
      ? signedPath
      : signedPath.startsWith('/object/')
        ? `/storage/v1${signedPath}`
        : `/storage/v1/${signedPath.replace(/^\/+/, '')}`
    }`;

  return reportUrl;
};

/* ─── Geocoding & Image Providers ────────────────────────────────────────── */

const fetchGeocode = async (address) => {
  const rootUrl = readEnv('GEOPLATEFORME_GEOCODE_URL') || 'https://data.geopf.fr/geocodage/search';
  const res = await fetch(`${rootUrl}?q=${encodeURIComponent(address)}&limit=1`);
  if (!res.ok) throw new Error(`Geocoding failed HTTP ${res.status}`);
  const data = await res.json();
  if (!data.features || data.features.length === 0) return null;

  const coords = data.features[0].geometry.coordinates; // [lon, lat]
  return {
    lon: coords[0],
    lat: coords[1]
  };
};

const fetchParcelRef = async (lon, lat) => {
  // Optionnel : ne doit pas bloquer le flux
  try {
    const wfs = readEnv('GEOPLATEFORME_WFS_URL') || 'https://data.geopf.fr/wfs/ows';
    const o = 0.00001;
    const bbox = `${lon - o},${lat - o},${lon + o},${lat + o},EPSG:4326`;
    const url = `${wfs}?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAMES=CADASTRALPARCELS.PARCELLAIRE_EXPRESS:parcelle&BBOX=${bbox}&OUTPUTFORMAT=application/json`;

    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    if (data.features && data.features.length > 0) {
      return data.features[0].properties.idu || data.features[0].properties.numero || null;
    }
  } catch (err) {
    console.warn('[public-report-cover] WFS Parcel error:', err.message);
  }
  return null;
};

const fetchPanoramax = async (lon, lat) => {
  const rootUrl = readEnv('PANORAMAX_API_BASE_URL') || 'https://panoramax.ign.fr/api';
  const offset = 0.0005; // ~50m
  const bboxCoords = [lon - offset, lat - offset, lon + offset, lat + offset];
  const bbox = bboxCoords.join(',');

  try {
    const res = await fetch(`${rootUrl}/search?bbox=${bbox}&limit=5`);
    if (!res.ok) return null;
    const data = await res.json();
    if (!data.features || data.features.length === 0) return null;

    const feature = data.features[0];
    const imgUrl = feature.assets?.hd?.href || feature.assets?.sd?.href || feature.links?.find(l => l.rel === 'data')?.href;
    if (!imgUrl) return null;

    const imgRes = await fetch(imgUrl);
    if (!imgRes.ok) return null;
    const arrayBuffer = await imgRes.arrayBuffer();

    const candidates = data.features.map(f => {
      const url = f.assets?.hd?.href || f.assets?.sd?.href || f.links?.find(l => l.rel === 'data')?.href;
      return { id: f.id, url, provider: f.properties?.provider || 'panoramax' };
    }).filter(c => c.url);

    return {
      buffer: Buffer.from(arrayBuffer),
      source: 'panoramax',
      provider: feature.properties?.provider || 'panoramax',
      contentType: imgRes.headers.get('content-type') || 'image/jpeg',
      bbox: bboxCoords,
      candidates
    };
  } catch (err) {
    console.warn('[public-report-cover] Panoramax error:', err.message);
    return null;
  }
};

const fetchIgnOrtho = async (lon, lat) => {
  const wms = readEnv('GEOPLATEFORME_WMS_RASTER_URL') || 'https://data.geopf.fr/wms-r/wms';
  const offsetLat = 0.0004; // ~40m
  const offsetLon = 0.0006;
  const bboxCoords = [lon - offsetLon, lat - offsetLat, lon + offsetLon, lat + offsetLat];
  const bbox = `${lat - offsetLat},${lon - offsetLon},${lat + offsetLat},${lon + offsetLon}`; // WMS EPSG:4326 format

  const url = `${wms}?SERVICE=WMS&VERSION=1.3.0&REQUEST=GetMap&LAYERS=ORTHOIMAGERY.ORTHOPHOTOS&STYLES=&CRS=EPSG:4326&BBOX=${bbox}&WIDTH=800&HEIGHT=600&FORMAT=image/jpeg`;

  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`IGN Ortho WMS failed HTTP ${res.status}`);
    const arrayBuffer = await res.arrayBuffer();

    return {
      buffer: Buffer.from(arrayBuffer),
      source: 'ign_ortho',
      provider: 'ign',
      contentType: 'image/jpeg',
      bbox: bboxCoords
    };
  } catch (err) {
    console.warn('[public-report-cover] IGN Ortho error:', err.message);
    return null;
  }
};

const fetchIgnPlan = async (lon, lat) => {
  const wms = readEnv('GEOPLATEFORME_WMS_RASTER_URL') || 'https://data.geopf.fr/wms-r/wms';
  const offsetLat = 0.0004;
  const offsetLon = 0.0006;
  const bboxCoords = [lon - offsetLon, lat - offsetLat, lon + offsetLon, lat + offsetLat];
  const bbox = `${lat - offsetLat},${lon - offsetLon},${lat + offsetLat},${lon + offsetLon}`;

  const url = `${wms}?SERVICE=WMS&VERSION=1.3.0&REQUEST=GetMap&LAYERS=GEOGRAPHICALGRIDSYSTEMS.PLANIGNV2&STYLES=&CRS=EPSG:4326&BBOX=${bbox}&WIDTH=800&HEIGHT=600&FORMAT=image/png`;

  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`IGN Plan WMS failed HTTP ${res.status}`);
    const arrayBuffer = await res.arrayBuffer();

    return {
      buffer: Buffer.from(arrayBuffer),
      source: 'ign_plan',
      provider: 'ign',
      contentType: 'image/png',
      bbox: bboxCoords
    };
  } catch (err) {
    console.warn('[public-report-cover] IGN Plan error:', err.message);
    return null;
  }
};

/* ─── Handler ────────────────────────────────────────────────────────────── */

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const logs = [];
  const log = (msg) => {
    console.log(`[public-report-cover] ${msg}`);
    logs.push(msg);
  };

  try {
    const payload = asPlainObject(safeJsonParse(req.body) || req.body);
    let address = String(payload.address || '').trim();
    const publicReportId = String(payload.public_report_id || '').trim() || null;

    const supabaseCtx = getRequiredServerSupabaseConfig();
    const { supabaseUrl, serviceKey } = supabaseCtx;
    const bucketName = readEnv('REPORT_COVER_BUCKET') || 'report-cover-assets';

    // 1. Gérer l'adresse et le statut initial
    if (publicReportId) {
      await updatePublicReport({
        supabaseUrl, serviceKey, publicReportId,
        patch: { cover_image_status: 'pending' }
      });
      log(`Set status 'pending' for report ${publicReportId}`);

      if (!address) {
        log('Address missing, attempting to fetch from public_reports...');
        const rows = await supabaseRest(supabaseUrl, serviceKey, `public_reports?id=eq.${encodeQ(publicReportId)}&select=input_payload,report_payload&limit=1`);
        const row = asArray(rows)[0];
        if (row) {
          const inPayload = asPlainObject(row.input_payload);
          address = inPayload.address || '';
          if (!address && row.report_payload) {
            const rp = asPlainObject(row.report_payload);
            address = rp.inputs_summary?.address || '';
          }
        }
      }
    }

    if (!address) {
      throw createHttpError(400, 'Could not determine "address" from payload or database');
    }

    // 2. Geocode via Géoplateforme
    log(`Geocoding address: ${address}`);
    const geo = await fetchGeocode(address);
    if (!geo) throw createHttpError(404, 'Address not found via IGN geocoding');
    log(`Geocoding success: [${geo.lon}, ${geo.lat}]`);

    // 3. Tenter de trouver la parcelle cadastrale (non bloquant)
    const parcelRef = await fetchParcelRef(geo.lon, geo.lat);
    if (parcelRef) log(`Parcel found: ${parcelRef}`);

    // 4. Sélection du provider d'image via preferred_source
    const preferredSource = String(payload.preferred_source || '').trim();
    let coverImage = null;

    if (preferredSource === 'ign_ortho') {
      log('Preferred source: ign_ortho. Bypassing others.');
      coverImage = await fetchIgnOrtho(geo.lon, geo.lat);
      if (!coverImage) throw createHttpError(500, 'IGN Ortho provider failed');
    } else if (preferredSource === 'ign_plan') {
      log('Preferred source: ign_plan. Bypassing others.');
      coverImage = await fetchIgnPlan(geo.lon, geo.lat);
      if (!coverImage) throw createHttpError(500, 'IGN Plan provider failed');
    } else {
      // 'panoramax' ou fallback
      log(`Preferred source: ${preferredSource || 'none'}. Attempting Panoramax cascade...`);
      coverImage = await fetchPanoramax(geo.lon, geo.lat);
      if (coverImage) {
        log('Panoramax image found');
      } else {
        log('Panoramax unavailable. Fallback to IGN Ortho...');
        coverImage = await fetchIgnOrtho(geo.lon, geo.lat);

        if (coverImage) {
          log('IGN Ortho fallback generated');
        } else {
          log('IGN Ortho failed. Fallback to IGN Plan...');
          coverImage = await fetchIgnPlan(geo.lon, geo.lat);
          if (!coverImage) {
            throw createHttpError(500, 'All image providers failed (Panoramax, IGN Ortho, IGN Plan)');
          }
          log('IGN Plan fallback generated');
        }
      }
    }


    // 5. Upload Supabase Storage
    const ext = coverImage.contentType.includes('png') ? 'png' : 'jpg';
    const storagePath = `covers/${publicReportId || 'anon'}/${Date.now()}_cover.${ext}`;

    await uploadBufferToStorage({
      supabaseUrl, serviceKey, bucket: bucketName,
      storagePath, buffer: coverImage.buffer, contentType: coverImage.contentType
    });
    log(`Upload to Supabase Storage OK: ${storagePath}`);

    // 6. Mettre à jour public_reports
    if (publicReportId) {
      await updatePublicReport({
        supabaseUrl, serviceKey, publicReportId,
        patch: {
          cover_image_url: storagePath,
          cover_image_source: coverImage.source,
          cover_image_status: 'ready',
          cover_lat: geo.lat,
          cover_lon: geo.lon,
          cover_bbox: coverImage.bbox || null,
          cover_parcel_ref: parcelRef || null,
          cover_photo_provider: coverImage.provider,
          cover_generated_at: new Date().toISOString()
        }
      });
      log(`DB public_reports updated successfully`);
    }

    // 7. Signed URL pour test immédiat
    const signedUrl = await createSignedUrl({
      supabaseUrl, serviceKey, bucket: bucketName,
      storagePath, expiresIn: 3600
    });

    return res.status(200).json({
      ok: true,
      public_report_id: publicReportId,
      cover_image_status: 'ready',
      cover_image_source: coverImage.source,
      cover_image_path: storagePath,
      cover_image_signed_url: signedUrl,
      cover_parcel_ref: parcelRef,
      coordinates: { lon: geo.lon, lat: geo.lat },
      bbox: coverImage.bbox || null,
      cover_generated_at: new Date().toISOString(),
      cover_candidates: coverImage.candidates || [],
      logs
    });

  } catch (error) {
    const statusCode = Number.isInteger(error?.statusCode) ? error.statusCode : 500;
    console.error('[public-report-cover] status: failed —', error?.message || error);

    const payload = asPlainObject(safeJsonParse(req.body) || req.body);
    const pId = payload.public_report_id;
    if (pId) {
      try {
        const { supabaseUrl, serviceKey } = getRequiredServerSupabaseConfig();
        await updatePublicReport({
          supabaseUrl, serviceKey,
          publicReportId: pId,
          patch: { cover_image_status: 'failed' }
        });
      } catch (_) { }
    }

    return res.status(statusCode).json({
      ok: false,
      error: error?.message || 'Cover generation failed',
      logs
    });
  }
};
