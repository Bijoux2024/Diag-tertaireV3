/**
 * ═══════════════════════════════════════════════════════════════════════════
 * api/_lib/pdf-renderer.js — Moteur de rendu PDF via Puppeteer + Chromium
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * RÔLE :
 *   Génère un PDF à partir d'une chaîne HTML en lançant un navigateur
 *   Chromium headless (sans interface graphique) via Puppeteer.
 *
 * CYCLE DE VIE D'UN RENDU :
 *   1. launchChromiumBrowser()   → Lance Chromium (@sparticuz/chromium sur Vercel)
 *   2. browser.newPage()         → Ouvre un onglet vide
 *   3. page.setContent(html)     → Injecte le HTML et attend le chargement
 *   4. document.fonts.ready      → Attend que les polices soient chargées
 *   5. page.pdf()                → Génère le PDF au format A4
 *   6. browser.close()           → Ferme Chromium (libère la mémoire)
 *
 * CONTRAINTES VERCEL :
 *   - Lambda timeout : 30s max (configuré dans api/pdf.js)
 *   - Mémoire : @sparticuz/chromium est optimisé pour les lambdas (< 50MB)
 *   - Le navigateur est mis en cache entre les appels (cachedPuppeteerCore / cachedChromiumRuntime)
 *     pour éviter de recharger les modules à chaque invocation.
 *
 * SÉCURITÉ :
 *   - La taille maximale du HTML est limitée (DEFAULT_MAX_HTML_LENGTH = 1.5MB)
 *   - Le rendu s'exécute dans un sandbox Chromium isolé
 *   - Aucun accès réseau n'est bloqué pendant le rendu (le HTML est injecté directement,
 *     pas chargé via une URL — networkidle0 attend la fin des requêtes internes)
 *
 * EXPORTS :
 *   - DEFAULT_MAX_HTML_LENGTH   → Taille max du payload HTML (bytes)
 *   - DEFAULT_TIMEOUT_MS        → Timeout global du rendu (ms)
 *   - createPdfRenderError()    → Crée une erreur avec statusCode HTTP
 *   - renderPdfFromHtml()       → Fonction principale de rendu
 * ═══════════════════════════════════════════════════════════════════════════
 */

const DEFAULT_MAX_HTML_LENGTH = 1_500_000;
const DEFAULT_TIMEOUT_MS = 45_000;
const DEFAULT_VIEWPORT = Object.freeze({
  width: 1280,
  height: 960,
  deviceScaleFactor: 1
});
const DEFAULT_PDF_OPTIONS = Object.freeze({
  format: 'A4',
  printBackground: true,
  preferCSSPageSize: true,
  margin: {
    top: '12mm',
    right: '10mm',
    bottom: '12mm',
    left: '10mm'
  }
});

const normalizeMediaType = (value) => {
  return value === 'print' ? 'print' : 'screen';
};

const createPdfRenderError = (message, statusCode = 500) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

let cachedPuppeteerCore = null;
let cachedChromiumRuntime = null;

// Keep literal requires so Vercel's runtime tracing includes these modules.
const getPuppeteerCore = () => {
  if (cachedPuppeteerCore) {
    return cachedPuppeteerCore;
  }

  try {
    cachedPuppeteerCore = require('puppeteer-core');
    return cachedPuppeteerCore;
  } catch (error) {
    throw createPdfRenderError(
      'Missing runtime dependency "puppeteer-core". Install it in package.json dependencies for the Vercel runtime.',
      500
    );
  }
};

const getChromiumRuntime = () => {
  if (cachedChromiumRuntime) {
    return cachedChromiumRuntime;
  }

  try {
    cachedChromiumRuntime = require('@sparticuz/chromium');
    return cachedChromiumRuntime;
  } catch (error) {
    throw createPdfRenderError(
      'Missing runtime dependency "@sparticuz/chromium". Install it in package.json dependencies for the Vercel runtime.',
      500
    );
  }
};

const resolveChromiumExecutablePath = async (chromium) => {
  try {
    const runtimePath = await chromium.executablePath();
    if (runtimePath) {
      return runtimePath;
    }
  } catch (error) {
    // Fall through to the explicit error below.
  }

  throw createPdfRenderError(
    'Chromium executable unavailable. On Vercel, use @sparticuz/chromium. For local API execution, set PUPPETEER_EXECUTABLE_PATH.',
    500
  );
};

const launchChromiumBrowser = async () => {
  const puppeteer = getPuppeteerCore();
  const explicitPath = String(process.env.PUPPETEER_EXECUTABLE_PATH || '').trim();
  const chromium = explicitPath ? null : getChromiumRuntime();
  const executablePath = explicitPath || await resolveChromiumExecutablePath(chromium);
  const args = chromium && Array.isArray(chromium.args) ? chromium.args.slice() : [];

  return puppeteer.launch({
    args: [...args, '--hide-scrollbars', '--font-render-hinting=medium'],
    executablePath,
    headless: chromium ? chromium.headless !== false : true,
    defaultViewport: chromium?.defaultViewport || DEFAULT_VIEWPORT
  });
};

const renderPdfFromUrl = async (url, {
  timeoutMs = DEFAULT_TIMEOUT_MS,
  readySignal = null,
  errorSignal = null,
  pdfOptions = {},
  mediaType = 'print'
} = {}) => {
  if (!url || typeof url !== 'string') {
    throw createPdfRenderError('Missing "url"', 400);
  }

  let browser = null;

  try {
    browser = await launchChromiumBrowser();
    const page = await browser.newPage();

    page.setDefaultNavigationTimeout(timeoutMs);
    page.setDefaultTimeout(timeoutMs);

    await page.emulateMediaType(normalizeMediaType(mediaType));

    await page.goto(url, {
      waitUntil: ['load', 'networkidle2'],
      timeout: timeoutMs
    });

    if (readySignal) {
      await page.waitForFunction(readySignal, { timeout: timeoutMs });
    }

    if (errorSignal) {
      const renderError = await page.evaluate(
        (sig) => { try { return eval(sig) || null; } catch { return null; } },
        errorSignal
      );
      if (renderError) {
        throw createPdfRenderError(`Print page error: ${renderError}`, 422);
      }
    }

    await page.evaluate(async () => {
      if (document.fonts && document.fonts.ready) {
        await document.fonts.ready;
      }
    });

    const pdfData = await page.pdf({
      ...DEFAULT_PDF_OPTIONS,
      ...pdfOptions
    });

    return Buffer.from(pdfData);
  } catch (error) {
    if (error?.statusCode) {
      throw error;
    }

    const message = String(error?.message || 'PDF rendering failed');
    if (error?.name === 'TimeoutError' || /timed out/i.test(message)) {
      throw createPdfRenderError('PDF rendering timeout', 504);
    }

    throw createPdfRenderError(message, 500);
  } finally {
    if (browser) {
      await browser.close().catch(() => { });
    }
  }
};

const renderPdfFromHtml = async (html, {
  timeoutMs = DEFAULT_TIMEOUT_MS,
  maxHtmlLength = DEFAULT_MAX_HTML_LENGTH,
  pdfOptions = {},
  mediaType = 'screen'
} = {}) => {
  if (typeof html !== 'string') {
    throw createPdfRenderError('Missing "html" content', 400);
  }

  const normalizedHtml = html.trim();
  if (!normalizedHtml) {
    throw createPdfRenderError('Missing "html" content', 400);
  }

  if (normalizedHtml.length > maxHtmlLength) {
    throw createPdfRenderError('HTML payload too large', 413);
  }

  let browser = null;

  try {
    browser = await launchChromiumBrowser();
    const page = await browser.newPage();

    page.setDefaultNavigationTimeout(timeoutMs);
    page.setDefaultTimeout(timeoutMs);

    await page.emulateMediaType(normalizeMediaType(mediaType));
    await page.setContent(normalizedHtml, {
      waitUntil: ['domcontentloaded', 'networkidle0'],
      timeout: timeoutMs
    });

    await page.evaluate(async () => {
      if (document.fonts && document.fonts.ready) {
        await document.fonts.ready;
      }
    });

    const pdfData = await page.pdf({
      ...DEFAULT_PDF_OPTIONS,
      ...pdfOptions
    });

    return Buffer.from(pdfData);
  } catch (error) {
    if (error?.statusCode) {
      throw error;
    }

    const message = String(error?.message || 'PDF rendering failed');
    if (error?.name === 'TimeoutError' || /timed out/i.test(message)) {
      throw createPdfRenderError('PDF rendering timeout', 504);
    }

    throw createPdfRenderError(message, 500);
  } finally {
    if (browser) {
      await browser.close().catch(() => { });
    }
  }
};

module.exports = {
  DEFAULT_MAX_HTML_LENGTH,
  DEFAULT_TIMEOUT_MS,
  createPdfRenderError,
  renderPdfFromHtml,
  renderPdfFromUrl
};
