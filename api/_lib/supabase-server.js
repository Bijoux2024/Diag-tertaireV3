const createSupabaseServerConfigError = (message) => {
  const error = new Error(message);
  error.statusCode = 500;
  return error;
};

const readEnv = (key) => String(process.env[key] || '').trim();

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

const getSupabaseServiceKey = () => {
  const canonicalServiceKey = readEnv('SUPABASE_SERVICE_KEY');
  if (canonicalServiceKey) {
    return canonicalServiceKey;
  }

  const fallbackSecretKey = readEnv('SUPABASE_SECRET_KEY');
  if (fallbackSecretKey) {
    // Temporary compatibility for environments not yet migrated to SUPABASE_SERVICE_KEY.
    console.warn('[supabase-server] Using SUPABASE_SECRET_KEY fallback. SUPABASE_SERVICE_KEY remains the canonical variable.');
    return fallbackSecretKey;
  }

  throw createSupabaseServerConfigError(
    'Missing Supabase server key. Set SUPABASE_SERVICE_KEY (canonical) or SUPABASE_SECRET_KEY (temporary fallback) in the server environment.'
  );
};

const getRequiredServerSupabaseConfig = () => {
  const publicConfig = getRequiredPublicSupabaseConfig();
  return {
    ...publicConfig,
    serviceKey: getSupabaseServiceKey()
  };
};

module.exports = {
  createSupabaseServerConfigError,
  getPublicSupabaseConfig,
  getRequiredPublicSupabaseConfig,
  getRequiredServerSupabaseConfig,
  getSupabaseServiceKey
};
