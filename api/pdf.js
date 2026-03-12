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

  try {
    const pdfBuffer = await renderPdfFromHtml(html, {
      maxHtmlLength: DEFAULT_MAX_HTML_LENGTH,
      timeoutMs: 30_000
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
