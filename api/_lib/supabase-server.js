/**
 * ═══════════════════════════════════════════════════════════════════════════
 * api/_lib/supabase-server.js — Helpers de configuration Supabase côté serveur
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * RÔLE :
 *   Centralise la lecture et la validation des variables d'environnement
 *   nécessaires aux connexions Supabase depuis les Serverless Functions.
 *
 * ARCHITECTURE :
 *   Ce module distingue deux types de clés Supabase :
 *   1. Clé publique (publishable / anon) :
 *      - Safe à exposer au navigateur via /api/public-config
 *      - Soumise aux Row Level Security (RLS) de Supabase
 *      - Variable : SUPABASE_PUBLISHABLE_KEY
 *   2. Clé de service (service_role) :
 *      - JAMAIS exposée au front-end
 *      - Bypassse les RLS — utilisée uniquement côté serveur
 *      - Variable canonique : SUPABASE_SERVICE_KEY
 *      - Un fallback legacy transitoire reste géré en interne pendant la migration.
 *
 * VARIABLES D'ENVIRONNEMENT REQUISES (Vercel) :
 *   - SUPABASE_URL               → URL du projet Supabase
 *   - SUPABASE_PUBLISHABLE_KEY   → Clé anon (publique)
 *   - SUPABASE_SERVICE_KEY       → Clé service_role (secrète, côté serveur uniquement)
 *
 * EXPORTS :
 *   - createSupabaseServerConfigError(message) → Crée une erreur avec statusCode
 *   - getPublicSupabaseConfig()                → {supabaseUrl, supabasePublishableKey}
 *   - getRequiredPublicSupabaseConfig()        → Idem mais lève une erreur si absent
 *   - getRequiredServerSupabaseConfig()        → Inclut serviceKey (pour les routes serveur)
 *   - getSupabaseServiceKey()                  → Retourne la clé service avec fallback
 * ═══════════════════════════════════════════════════════════════════════════
 */

const createSupabaseServerConfigError = (message) => {
  const error = new Error(message);
  error.statusCode = 500;
  return error;
};

const readEnv = (key) => String(process.env[key] || '').trim();

const asPlainObject = (value) =>
  value && typeof value === 'object' && !Array.isArray(value) ? value : {};

const safeParseJson = (value) => {
  if (typeof value !== 'string') return value;
  try { return JSON.parse(value); } catch { return null; }
};

const summarizeText = (value, maxLength = 280) => {
  const text = String(value || '').replace(/\s+/g, ' ').trim();
  if (!text) return '';
  return text.length > maxLength ? `${text.slice(0, maxLength)}…` : text;
};

const maskValue = (value, { start = 6, end = 4 } = {}) => {
  const text = String(value || '');
  if (!text) return '';
  if (text.length <= start + end) {
    const prefix = text.slice(0, Math.min(2, text.length));
    return `${prefix}*** (${text.length})`;
  }
  return `${text.slice(0, start)}...${text.slice(-end)} (${text.length})`;
};

const getSupabaseHost = (supabaseUrl) => {
  try {
    return new URL(String(supabaseUrl || '')).host;
  } catch {
    return '';
  }
};

const getRequiredEnv = (key, message) => {
  const value = readEnv(key);
  if (!value) {
    throw createSupabaseServerConfigError(message || `Missing ${key}`);
  }

  return value;
};

const getPublicSupabaseConfig = () => ({
  supabaseUrl: readEnv('SUPABASE_URL'),
  supabasePublishableKey: readEnv('SUPABASE_PUBLISHABLE_KEY')
});

const getRequiredPublicSupabaseConfig = () => ({
  supabaseUrl: getRequiredEnv(
    'SUPABASE_URL',
    'Missing SUPABASE_URL. Configure the server environment before using Supabase-backed routes.'
  ),
  supabasePublishableKey: getRequiredEnv(
    'SUPABASE_PUBLISHABLE_KEY',
    'Missing SUPABASE_PUBLISHABLE_KEY. Configure the server environment before using Supabase-backed routes.'
  )
});

const resolveSupabaseServiceKey = () => {
  const canonicalServiceKey = readEnv('SUPABASE_SERVICE_KEY');
  if (canonicalServiceKey) {
    return {
      serviceKey: canonicalServiceKey,
      serviceKeySource: 'SUPABASE_SERVICE_KEY'
    };
  }

  const fallbackSecretKey = readEnv('SUPABASE_SECRET_KEY');
  if (fallbackSecretKey) {
    // Temporary compatibility for environments not yet migrated to SUPABASE_SERVICE_KEY.
    console.warn('[supabase-server] Using SUPABASE_SECRET_KEY fallback. SUPABASE_SERVICE_KEY remains the canonical variable.');
    return {
      serviceKey: fallbackSecretKey,
      serviceKeySource: 'SUPABASE_SECRET_KEY (legacy fallback)'
    };
  }

  throw createSupabaseServerConfigError(
    'Missing Supabase server key. Set SUPABASE_SERVICE_KEY in the server environment.'
  );
};

const getSupabaseServiceKey = () => resolveSupabaseServiceKey().serviceKey;

const getRequiredServerSupabaseConfig = () => {
  const publicConfig = getRequiredPublicSupabaseConfig();
  const { serviceKey, serviceKeySource } = resolveSupabaseServiceKey();
  return {
    ...publicConfig,
    serviceKey,
    serviceKeySource
  };
};

const describeServerSupabaseConfig = ({ supabaseUrl, serviceKey, serviceKeySource } = {}) => ({
  supabaseUrl: String(supabaseUrl || ''),
  supabaseHost: getSupabaseHost(supabaseUrl),
  serviceKeySource: String(serviceKeySource || '').trim() || 'unknown',
  serviceKeyMasked: maskValue(serviceKey, { start: 10, end: 6 }),
  serviceKeyLength: String(serviceKey || '').length
});

const getStorageHeaders = (serviceKey, extra = {}) => ({
  apikey: serviceKey,
  Authorization: `Bearer ${serviceKey}`,
  ...extra
});

const fetchStorageJson = async ({ supabaseUrl, serviceKey, path, method = 'GET', headers = {}, body } = {}) => {
  const normalizedPath = String(path || '').replace(/^\/+/, '');
  const baseUrl = String(supabaseUrl || '').replace(/\/$/, '');
  const url = `${baseUrl}/storage/v1/${normalizedPath}`;
  const response = await fetch(url, {
    method,
    headers: getStorageHeaders(serviceKey, headers),
    body
  });
  const raw = await response.text();
  const data = raw ? safeParseJson(raw) : null;
  const bodySummary = summarizeText(
    raw || (data && typeof data === 'object' ? JSON.stringify(data) : String(data || ''))
  );

  return {
    ok: response.ok,
    status: response.status,
    url,
    data,
    raw,
    bodySummary
  };
};

const listStorageBuckets = async ({ supabaseUrl, serviceKey } = {}) => {
  const result = await fetchStorageJson({
    supabaseUrl,
    serviceKey,
    path: 'bucket'
  });

  const buckets = Array.isArray(result.data)
    ? result.data.map((bucket) => ({
      id: String(bucket?.id || bucket?.name || '').trim(),
      name: String(bucket?.name || bucket?.id || '').trim(),
      public: Boolean(bucket?.public)
    }))
    : [];

  return {
    ...result,
    buckets
  };
};

const getStorageBucket = async ({ supabaseUrl, serviceKey, bucketName } = {}) => {
  const result = await fetchStorageJson({
    supabaseUrl,
    serviceKey,
    path: `bucket/${encodeURIComponent(String(bucketName || '').trim())}`
  });

  return {
    ...result,
    bucket: asPlainObject(result.data)
  };
};

const assertStorageBucketExists = async ({ supabaseUrl, serviceKey, bucketName } = {}) => {
  const normalizedBucketName = String(bucketName || '').trim();
  const bucketsResult = await listStorageBuckets({ supabaseUrl, serviceKey });
  const bucketResult = await getStorageBucket({ supabaseUrl, serviceKey, bucketName: normalizedBucketName });
  const visibleBucketNames = bucketsResult.buckets
    .map((bucket) => String(bucket?.id || bucket?.name || '').trim())
    .filter(Boolean);
  const targetBucketName = String(bucketResult.bucket?.id || bucketResult.bucket?.name || '').trim();
  const exists = Boolean(targetBucketName) || visibleBucketNames.includes(normalizedBucketName);

  if (!exists) {
    const error = createSupabaseServerConfigError(
      `Bucket check failed for "${normalizedBucketName}" - visible buckets: ${visibleBucketNames.join(', ') || '(none)'}`
    );
    error.statusCode = Number.isInteger(bucketResult.status)
      ? bucketResult.status
      : Number.isInteger(bucketsResult.status)
        ? bucketsResult.status
        : 500;
    error.storageDebug = {
      bucketName: normalizedBucketName,
      visibleBucketNames,
      listStatus: bucketsResult.status,
      listBodySummary: bucketsResult.bodySummary,
      targetStatus: bucketResult.status,
      targetBodySummary: bucketResult.bodySummary,
      targetBucket: bucketResult.bucket
    };
    throw error;
  }

  return {
    bucketName: normalizedBucketName,
    visibleBucketNames,
    visibleBuckets: bucketsResult.buckets,
    listStatus: bucketsResult.status,
    listBodySummary: bucketsResult.bodySummary,
    targetStatus: bucketResult.status,
    targetBodySummary: bucketResult.bodySummary,
    targetBucket: bucketResult.bucket
  };
};

module.exports = {
  assertStorageBucketExists,
  createSupabaseServerConfigError,
  describeServerSupabaseConfig,
  fetchStorageJson,
  getPublicSupabaseConfig,
  getRequiredPublicSupabaseConfig,
  getRequiredServerSupabaseConfig,
  getStorageBucket,
  getStorageHeaders,
  getSupabaseServiceKey,
  listStorageBuckets,
  maskValue,
  safeParseJson
};
