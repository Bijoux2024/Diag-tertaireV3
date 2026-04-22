'use strict';

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * api/csp-report.js — Endpoint de collecte des violations CSP
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * ROLE :
 *   Recoit les rapports de violation Content-Security-Policy via la directive
 *   `report-uri /api/csp-report` declaree dans la CSP globale (vercel.json).
 *
 * METHODE : POST uniquement
 *
 * SECURITE :
 *   - Rate limit : 30 rapports / 60 s par fingerprint (scope csp-report)
 *   - Body log uniquement en preview / dev (jamais en production)
 *   - Retourne toujours 204 (No Content) : pas de leak d'info au client
 *
 * NOTE :
 *   Les navigateurs envoient le rapport avec Content-Type `application/csp-report`
 *   ou `application/json`. On ne valide pas le format pour eviter de casser les
 *   vieux navigateurs, on log une slice et on oublie.
 * ═══════════════════════════════════════════════════════════════════════════
 */

const { enforceRateLimit } = require('./_lib/request-guard.js');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    enforceRateLimit(req, {
      scope: 'csp-report',
      windowMs: 60_000,
      maxHits: 30,
      message: 'Too many CSP reports'
    });
  } catch (error) {
    return res.status(error?.statusCode || 500).end();
  }

  const env = String(process.env.VERCEL_ENV || process.env.NODE_ENV || '').toLowerCase();
  if (env !== 'production') {
    try {
      const bodyStr = typeof req.body === 'string'
        ? req.body
        : JSON.stringify(req.body || {});
      console.info('[CSP report]', bodyStr.slice(0, 1500));
    } catch (_) {
      /* ignore : malformed body must not crash the endpoint */
    }
  }

  return res.status(204).end();
};
