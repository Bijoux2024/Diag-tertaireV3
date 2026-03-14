const { DEFAULT_MAX_HTML_LENGTH, renderPdfFromHtml } = require('./_lib/pdf-renderer');

const safeJsonParse = (value) => {
  if (typeof value !== 'string') return value;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
};

const sanitizeFilename = (value) => {
  const raw = String(value || 'rapport-diagnostic.pdf').trim();
  const cleaned = raw.replace(/[^\w.-]+/g, '_');
  return cleaned.toLowerCase().endsWith('.pdf') ? cleaned : `${cleaned}.pdf`;
};

const sanitizeMediaType = (value) => {
  return value === 'print' ? 'print' : 'screen';
};

const sanitizePdfLength = (value) => {
  if (typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 50) {
    return `${value}mm`;
  }

  if (typeof value !== 'string') {
    return null;
  }

  const normalizedValue = value.trim();
  return /^(0|[0-9]+(?:\.[0-9]+)?(?:mm|cm|in|px))$/i.test(normalizedValue)
    ? normalizedValue
    : null;
};

const sanitizePdfMargin = (value) => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }

  const top = sanitizePdfLength(value.top);
  const right = sanitizePdfLength(value.right);
  const bottom = sanitizePdfLength(value.bottom);
  const left = sanitizePdfLength(value.left);

  if (!top || !right || !bottom || !left) {
    return null;
  }

  return { top, right, bottom, left };
};

const sanitizePdfOptions = (value) => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return {};
  }

  const options = {};
  const scale = Number(value.scale);

  if (Number.isFinite(scale) && scale >= 0.5 && scale <= 1) {
    options.scale = scale;
  }

  const margin = sanitizePdfMargin(value.margin);
  if (margin) {
    options.margin = margin;
  }

  if (value.landscape === true) {
    options.landscape = true;
  }

  return options;
};

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const body = safeJsonParse(req.body);
  if (!body || typeof body !== 'object') {
    return res.status(400).json({ error: 'Invalid JSON payload' });
  }

  const html = typeof body.html === 'string' ? body.html : '';
  const filename = sanitizeFilename(body.filename);
  const mediaType = sanitizeMediaType(body.mediaType);
  const pdfOptions = sanitizePdfOptions(body.pdfOptions);

  try {
    const pdfBuffer = await renderPdfFromHtml(html, {
      maxHtmlLength: DEFAULT_MAX_HTML_LENGTH,
      timeoutMs: 30_000,
      mediaType,
      pdfOptions
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    return res.status(200).send(pdfBuffer);
  } catch (error) {
    const statusCode = Number.isInteger(error?.statusCode) ? error.statusCode : 500;
    const details = error?.message || 'Unknown error';
    return res.status(statusCode).json({
      error: statusCode === 504 ? 'PDF generation timeout' : 'PDF generation failed',
      details
    });
  }
};
