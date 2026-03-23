'use strict';

/**
 * api/save-public-report.js — DEPRECATED
 *
 * Cette route n'est plus utilisée. La génération de PDF public passe
 * désormais exclusivement par /api/public-report-pdf (pipeline Puppeteer
 * + bucket public-reports).
 *
 * Retourne 410 Gone pour signaler la dépréciation aux éventuels appels
 * résiduels (scripts externes, tests, anciens bookmarks).
 */

module.exports = function handler(req, res) {
  return res.status(410).json({
    ok: false,
    error: 'Cette route est supprimée. Utilisez /api/public-report-pdf.',
    canonical: '/api/public-report-pdf',
  });
};
