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
    'Missing Supabase server key. Set SUPABASE_SERVICE_KEY in the server environment.'
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
