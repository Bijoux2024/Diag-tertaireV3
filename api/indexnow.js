/*
 * api/indexnow.js - Endpoint IndexNow pour notifier Bing/Yandex/Naver/Seznam
 *
 * Cible :
 *  - POST /api/indexnow body: { urls: string[] }
 *  - 405 si autre methode, 400 si urls vide/non array, 500 si INDEXNOW_KEY non configuree
 *
 * Configuration requise (Vercel Dashboard > Settings > Environment Variables) :
 *  - INDEXNOW_KEY = la cle hex 32 chars deposee aussi dans /<key>.txt a la racine
 *
 * Reference protocole : https://www.indexnow.org/documentation
 */

const INDEXNOW_HOST = 'diag-tertiaire.fr';
const INDEXNOW_ENDPOINT = 'https://api.indexnow.org/IndexNow';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const key = process.env.INDEXNOW_KEY;
  if (!key) {
    return res.status(500).json({ error: 'INDEXNOW_KEY not configured' });
  }

  const { urls } = req.body || {};
  if (!Array.isArray(urls) || urls.length === 0) {
    return res.status(400).json({ error: 'urls (array) required' });
  }

  // Filtrage defensif : ne soumettre que des URLs du domaine DiagTertiaire
  const validUrls = urls.filter(u => typeof u === 'string' && u.startsWith(`https://${INDEXNOW_HOST}/`));
  if (validUrls.length === 0) {
    return res.status(400).json({ error: `urls must start with https://${INDEXNOW_HOST}/` });
  }

  try {
    const response = await fetch(INDEXNOW_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        host: INDEXNOW_HOST,
        key,
        keyLocation: `https://${INDEXNOW_HOST}/${key}.txt`,
        urlList: validUrls
      })
    });

    if (!response.ok) {
      const text = await response.text();
      return res.status(response.status).json({ error: text || 'IndexNow error' });
    }

    return res.status(200).json({ status: 'ok', notified: validUrls.length });
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Unknown error' });
  }
}
