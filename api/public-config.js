/**
 * ═══════════════════════════════════════════════════════════════════════════
 * api/public-config.js — Endpoint de configuration publique
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * RÔLE :
 *   Expose les variables de configuration Supabase non-secrètes au front-end.
 *   Le front-end ne peut pas lire process.env directement (il est côté serveur),
 *   donc il appelle cet endpoint pour obtenir l'URL et la clé publique Supabase.
 *
 * MÉTHODE : GET /api/public-config
 *
 * SÉCURITÉ :
 *   - Cet endpoint est VOLONTAIREMENT public (pas d'authentification).
 *   - Il n'expose QUE les variables "publishable" (non-secrètes) :
 *       • SUPABASE_URL             → URL publique du projet Supabase
 *       • SUPABASE_PUBLISHABLE_KEY → Clé anon (rate-limitée, RLS activée)
 *   - Il NE expose JAMAIS la clé serveur Supabase.
 *   - Rate limit : 120 requêtes / 10 min par fingerprint (scope public-config).
 *   - Origin check optional : bloque les origines hors whitelist si header présent.
 *
 * VARIABLES D'ENVIRONNEMENT REQUISES (Vercel) :
 *   - SUPABASE_URL
 *   - SUPABASE_PUBLISHABLE_KEY
 * ═══════════════════════════════════════════════════════════════════════════
 */

const { getPublicSupabaseConfig } = require('./_lib/supabase-server');
const {
  assertAllowedOrigin,
  enforceRateLimit
} = require('./_lib/request-guard');

/**
 * Handler Vercel Serverless Function.
 * Retourne la configuration publique Supabase en JSON.
 *
 * @param {import('@vercel/node').VercelRequest}  req
 * @param {import('@vercel/node').VercelResponse} res
 */
module.exports = function handler(req, res) {
  try {
    enforceRateLimit(req, {
      scope: 'public-config',
      windowMs: 10 * 60 * 1000,
      maxHits: 120,
      message: 'Too many config requests'
    });
    assertAllowedOrigin(req, { optional: true });
    return res.status(200).json(getPublicSupabaseConfig());
  } catch (error) {
    if (Number.isInteger(error?.rateLimit?.retryAfterSeconds)) {
      res.setHeader('Retry-After', String(error.rateLimit.retryAfterSeconds));
    }
    const statusCode = Number.isInteger(error?.statusCode) ? error.statusCode : 500;
    return res.status(statusCode).json({
      ok: false,
      error: error?.message || 'Config unavailable'
    });
  }
};
