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
 *       • SUPABASE_URL       → URL publique du projet Supabase
 *       • SUPABASE_PUBLISHABLE_KEY → Clé anon (rate-limitée et row-level-security activée)
 *   - Il NE expose JAMAIS la clé serveur Supabase.
 *
 * VARIABLES D'ENVIRONNEMENT REQUISES (Vercel) :
 *   - SUPABASE_URL
 *   - SUPABASE_PUBLISHABLE_KEY
 * ═══════════════════════════════════════════════════════════════════════════
 */

const { getPublicSupabaseConfig } = require('./_lib/supabase-server');

/**
 * Handler Vercel Serverless Function.
 * Retourne la configuration publique Supabase en JSON.
 *
 * @param {import('@vercel/node').VercelRequest}  req
 * @param {import('@vercel/node').VercelResponse} res
 */
module.exports = function handler(req, res) {
  const publicConfig = getPublicSupabaseConfig();
  res.status(200).json({
    ...publicConfig,
    partnerCalendlyUrl: String(process.env.PARTNER_CALENDLY_URL || '').trim()
  });
};
