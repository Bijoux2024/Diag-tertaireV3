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

const renderPdfFromHtml = async (html, {
  timeoutMs = DEFAULT_TIMEOUT_MS,
  maxHtmlLength = DEFAULT_MAX_HTML_LENGTH,
  pdfOptions = {}
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

    await page.emulateMediaType('screen');
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
      await browser.close().catch(() => {});
    }
  }
};

module.exports = {
  DEFAULT_MAX_HTML_LENGTH,
  DEFAULT_TIMEOUT_MS,
  createPdfRenderError,
  renderPdfFromHtml
};
