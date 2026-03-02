const PDFSHIFT_ENDPOINT = 'https://api.pdfshift.io/v3/convert/pdf';
const MAX_HTML_LENGTH = 1_500_000;

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

  const apiKey = process.env.PDFSHIFT_API_KEY;
  if (!apiKey) {
    return res.status(500).json({
      error: 'Missing PDFSHIFT_API_KEY',
      details: 'Configurez la variable d’environnement PDFSHIFT_API_KEY.'
    });
  }

  const body = safeJsonParse(req.body);
  if (!body || typeof body !== 'object') {
    return res.status(400).json({ error: 'Invalid JSON payload' });
  }

  if (typeof body.html !== 'string') {
    return res.status(400).json({ error: 'Missing "html" content' });
  }
  const html = body.html;
  if (!html.trim()) {
    return res.status(400).json({ error: 'Missing "html" content' });
  }
  if (html.length > MAX_HTML_LENGTH) {
    return res.status(413).json({
      error: 'HTML payload too large',
      details: 'Réduisez la taille du rapport avant export.'
    });
  }

  const filename = sanitizeFilename(body.filename);

  if (typeof fetch !== 'function') {
    return res.status(500).json({
      error: 'Fetch API unavailable',
      details: 'L’environnement serveur ne supporte pas fetch.'
    });
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30_000);

  try {
    const response = await fetch(PDFSHIFT_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': apiKey
      },
      body: JSON.stringify({ source: html }),
      signal: controller.signal
    });

    if (!response.ok) {
      const details = await response.text();
      return res.status(502).json({
        error: 'PDFShift request failed',
        details: details ? details.slice(0, 500) : `HTTP ${response.status}`
      });
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    return res.status(200).send(buffer);
  } catch (error) {
    const isAbort = error && error.name === 'AbortError';
    return res.status(isAbort ? 504 : 500).json({
      error: isAbort ? 'PDF generation timeout' : 'PDF generation failed',
      details: isAbort ? 'Le service PDFShift a expiré.' : (error && error.message) || 'Unknown error'
    });
  } finally {
    clearTimeout(timeout);
  }
};
