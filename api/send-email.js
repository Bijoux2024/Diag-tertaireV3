const safeJsonParse = (value) => {
  if (typeof value !== 'string') return value;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
};

const readEnv = (key) => String(process.env[key] || '').trim();

const escapeHtml = (value) => String(value ?? '')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#39;');

const formatCurrency = (value) => {
  const numeric = Number(value || 0);
  return Number.isFinite(numeric)
    ? `${numeric.toLocaleString('fr-FR')} EUR`
    : '0 EUR';
};

const asPlainObject = (value) => {
  return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
};

const createHttpError = (statusCode, message) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const getRequiredMailConfig = (emailType) => {
  const resendApiKey = readEnv('RESEND_API_KEY');
  const resendFrom = readEnv('RESEND_FROM');
  const adminEmail = readEnv('ADMIN_EMAIL');

  if (!resendApiKey) {
    throw createHttpError(500, 'Missing RESEND_API_KEY');
  }

  if (!resendFrom) {
    throw createHttpError(500, 'Missing RESEND_FROM');
  }

  if (emailType === 'nouveau_lead_admin' && !adminEmail) {
    throw createHttpError(500, 'Missing ADMIN_EMAIL');
  }

  return { resendApiKey, resendFrom, adminEmail };
};

const buildRapportDisponibleEmail = (rawData) => {
  const data = asPlainObject(rawData);
  const buildingName = data.nomBatiment || 'Votre bâtiment';
  const scoreLabel = data.scoreLettre ? `Indice ${data.scoreLettre}` : 'Indice en cours de calcul';
  const activityLabel = data.activite || 'Activité à confirmer';
  const surfaceLabel = data.surface ? `${data.surface} m²` : 'Surface non renseignée';
  const savingsLabel = formatCurrency(data.economiesTotalesAnnuelles || 0);
  const firstName = String(data.prenom || '').trim();

  return {
    to: String(data.email || '').trim(),
    subject: 'Votre rapport DiagTertiaire est disponible',
    text: [
      firstName ? `Bonjour ${firstName},` : 'Bonjour,',
      '',
      'Votre rapport DiagTertiaire est disponible en téléchargement.',
      `Bâtiment : ${buildingName}`,
      `Activité : ${activityLabel}`,
      `Surface : ${surfaceLabel}`,
      `Indice : ${scoreLabel}`,
      `Économies annuelles estimées : ${savingsLabel}`,
      '',
      `Accéder au rapport : ${data.reportUrl || ''}`
    ].join('\n'),
    html: `
      <div style="font-family:Arial,sans-serif;background:#F8FAFC;padding:24px;color:#0F172A;">
        <div style="max-width:640px;margin:0 auto;background:#FFFFFF;border:1px solid #E2E8F0;border-radius:20px;overflow:hidden;">
          <div style="padding:24px 28px;background:linear-gradient(135deg,#102A43 0%,#1D4ED8 100%);color:#FFFFFF;">
            <div style="font-size:12px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;opacity:0.8;">DiagTertiaire</div>
            <h1 style="margin:10px 0 0;font-size:28px;line-height:1.1;">Votre rapport est disponible</h1>
          </div>
          <div style="padding:28px;">
            <p style="margin:0 0 18px;font-size:16px;line-height:1.6;">${escapeHtml(firstName ? `Bonjour ${firstName},` : 'Bonjour,')}</p>
            <p style="margin:0 0 22px;font-size:15px;line-height:1.7;">Votre rapport DiagTertiaire est maintenant disponible en téléchargement.</p>
            <div style="display:grid;gap:12px;margin-bottom:24px;">
              <div style="padding:14px 16px;border:1px solid #E2E8F0;border-radius:14px;background:#F8FAFC;"><strong>Bâtiment</strong><br>${escapeHtml(buildingName)}</div>
              <div style="padding:14px 16px;border:1px solid #E2E8F0;border-radius:14px;background:#F8FAFC;"><strong>Activité</strong><br>${escapeHtml(activityLabel)}</div>
              <div style="padding:14px 16px;border:1px solid #E2E8F0;border-radius:14px;background:#F8FAFC;"><strong>Surface</strong><br>${escapeHtml(surfaceLabel)}</div>
              <div style="padding:14px 16px;border:1px solid #E2E8F0;border-radius:14px;background:#F8FAFC;"><strong>Indice DiagTertiaire</strong><br>${escapeHtml(scoreLabel)}</div>
              <div style="padding:14px 16px;border:1px solid #E2E8F0;border-radius:14px;background:#F8FAFC;"><strong>Économies annuelles estimées</strong><br>${escapeHtml(savingsLabel)}</div>
            </div>
            <a href="${escapeHtml(data.reportUrl || '#')}" style="display:inline-block;padding:14px 20px;border-radius:12px;background:#1D4ED8;color:#FFFFFF;text-decoration:none;font-weight:700;">Accéder au rapport</a>
          </div>
        </div>
      </div>
    `
  };
};

const buildAdminLeadEmail = (rawData, adminEmail) => {
  const data = asPlainObject(rawData);
  const titleStem = data.societe || data.email || data.leadId || 'Lead';
  const scoreLabel = data.scoreLettre || 'N/A';
  const savingsLabel = formatCurrency(data.economiesTotalesAnnuelles || 0);
  const partnerConsent = data.partnerConsent ? 'Oui' : 'Non';
  const rows = [
    ['Lead ID', data.leadId || 'N/A'],
    ['Email', data.email || ''],
    ['Prénom', data.prenom || ''],
    ['Téléphone', data.telephone || ''],
    ['Société', data.societe || ''],
    ['Activité', data.activite || ''],
    ['Surface', data.surface ? `${data.surface} m²` : ''],
    ['Ville', data.ville || ''],
    ['Code postal', data.codePostal || ''],
    ['Indice DiagTertiaire', scoreLabel],
    ['Intensité', data.intensiteKwhM2 ? `${data.intensiteKwhM2} kWh/m²/an` : ''],
    ['Économies annuelles estimées', savingsLabel],
    ['Confiance', data.scoreConfiance || ''],
    ['Objectif', data.objectif || ''],
    ['Horizon décision', data.horizonDecision || ''],
    ['Consentement partenaire', partnerConsent]
  ];

  return {
    to: adminEmail,
    subject: `Nouveau lead DiagTertiaire - ${titleStem}`,
    replyTo: String(data.email || '').trim() || undefined,
    text: rows.map(([label, value]) => `${label}: ${value || '-'}`).join('\n'),
    html: `
      <div style="font-family:Arial,sans-serif;background:#F8FAFC;padding:24px;color:#0F172A;">
        <div style="max-width:720px;margin:0 auto;background:#FFFFFF;border:1px solid #E2E8F0;border-radius:20px;overflow:hidden;">
          <div style="padding:24px 28px;background:#102A43;color:#FFFFFF;">
            <div style="font-size:12px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;opacity:0.8;">DiagTertiaire</div>
            <h1 style="margin:10px 0 0;font-size:28px;line-height:1.1;">Nouveau lead public</h1>
          </div>
          <div style="padding:24px 28px;">
            <table style="width:100%;border-collapse:collapse;">
              <tbody>
                ${rows.map(([label, value]) => `
                  <tr>
                    <td style="padding:10px 0;border-bottom:1px solid #E2E8F0;font-weight:700;vertical-align:top;width:220px;">${escapeHtml(label)}</td>
                    <td style="padding:10px 0;border-bottom:1px solid #E2E8F0;vertical-align:top;">${escapeHtml(value || '-')}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `
  };
};

const sendViaResend = async ({ resendApiKey, resendFrom, emailPayload }) => {
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from: resendFrom,
      to: [emailPayload.to],
      subject: emailPayload.subject,
      html: emailPayload.html,
      text: emailPayload.text,
      reply_to: emailPayload.replyTo || undefined
    })
  });

  const rawText = await response.text();
  const parsed = rawText ? safeJsonParse(rawText) : null;

  if (!response.ok) {
    const message = parsed?.message || parsed?.error || rawText || `HTTP ${response.status}`;
    throw createHttpError(response.status, message);
  }

  return parsed;
};

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const body = safeJsonParse(req.body);
    if (!body || typeof body !== 'object') {
      throw createHttpError(400, 'Invalid JSON payload');
    }

    const emailType = String(body.type || '').trim();
    const data = asPlainObject(body.data);
    const { resendApiKey, resendFrom, adminEmail } = getRequiredMailConfig(emailType);

    let emailPayload = null;

    if (emailType === 'rapport_disponible') {
      emailPayload = buildRapportDisponibleEmail(data);
      if (!emailPayload.to) {
        throw createHttpError(400, 'Missing destination email for rapport_disponible');
      }
    } else if (emailType === 'nouveau_lead_admin') {
      emailPayload = buildAdminLeadEmail(data, adminEmail);
    } else {
      throw createHttpError(400, 'Unsupported email type');
    }

    const resendResponse = await sendViaResend({
      resendApiKey,
      resendFrom,
      emailPayload
    });

    return res.status(200).json({
      ok: true,
      emailType,
      id: resendResponse?.id || null
    });
  } catch (error) {
    const statusCode = Number.isInteger(error?.statusCode) ? error.statusCode : 500;
    return res.status(statusCode).json({
      ok: false,
      error: error?.message || 'Email delivery failed'
    });
  }
};
