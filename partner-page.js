(() => {
  'use strict';

  const FORM_KEY = 'partner-interest-form';
  const STORAGE_PREFIX = 'diagtertiaire_antispam';
  const FORM_MINIMUM_DELAY_MS = 3000;
  const FORM_COOLDOWN_MS = 30000;
  const MAX_TEXT_LENGTH = 2500;
  const SUCCESS_MESSAGE = 'Votre demande a bien ete transmise. Nous reviendrons vers vous rapidement.';
  const GENERIC_SUBMIT_ERROR = "Impossible d'envoyer votre demande pour le moment. Merci de reessayer ou d'ecrire a contact@diag-tertiaire.fr.";

  const form = document.getElementById('partner-form');
  const formShell = document.getElementById('partner-form-shell');
  const successShell = document.getElementById('partner-success-shell');
  const successMessage = document.getElementById('partner-success-message');
  const feedback = document.getElementById('partner-feedback');
  const feedbackDetail = document.getElementById('partner-feedback-detail');
  const submitButton = document.getElementById('partner-submit-button');
  const submitLabel = document.getElementById('partner-submit-label');

  if (
    !form ||
    !formShell ||
    !successShell ||
    !successMessage ||
    !feedback ||
    !feedbackDetail ||
    !submitButton ||
    !submitLabel
  ) {
    return;
  }

  const safeJsonParse = (value) => {
    if (typeof value !== 'string') return value;
    try {
      return JSON.parse(value);
    } catch {
      return null;
    }
  };

  const normalizeText = (value, maxLength = 240) => {
    const text = String(value || '').replace(/\s+/g, ' ').trim();
    if (!text) return '';
    return text.length > maxLength ? text.slice(0, maxLength) : text;
  };

  const normalizeMultilineText = (value, maxLength = MAX_TEXT_LENGTH) => {
    const text = String(value || '')
      .replace(/\r\n/g, '\n')
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .join('\n');

    if (!text) return '';
    return text.length > maxLength ? text.slice(0, maxLength) : text;
  };

  const getStorage = (type = 'session') => {
    try {
      return type === 'local' ? window.localStorage : window.sessionStorage;
    } catch {
      return null;
    }
  };

  const getAntiSpamStorageKey = (kind, key) => `${STORAGE_PREFIX}:${kind}:${key}`;

  const readStoredTimestamp = (kind, key, type = 'session') => {
    const storage = getStorage(type);
    if (!storage) return null;

    const rawValue = storage.getItem(getAntiSpamStorageKey(kind, key));
    const parsedValue = Number(rawValue);
    return Number.isFinite(parsedValue) && parsedValue > 0 ? parsedValue : null;
  };

  const writeStoredTimestamp = (kind, key, value, type = 'session') => {
    const storage = getStorage(type);
    if (!storage) return;

    const storageKey = getAntiSpamStorageKey(kind, key);
    if (value === null || typeof value === 'undefined') {
      storage.removeItem(storageKey);
      return;
    }

    storage.setItem(storageKey, String(value));
  };

  const markFormRendered = (key) => {
    const now = Date.now();
    writeStoredTimestamp('rendered', key, now, 'session');
    return now;
  };

  const ensureFormRendered = (key) => (
    readStoredTimestamp('rendered', key, 'session') || markFormRendered(key)
  );

  const hasHoneypotValue = (value) => typeof value === 'string' && value.trim().length > 0;

  const isSubmissionTooFast = (key, minimumDelayMs) => {
    if (!minimumDelayMs) return false;
    const renderedAt = ensureFormRendered(key);
    return (Date.now() - renderedAt) < minimumDelayMs;
  };

  const getCooldownRemainingMs = (key, cooldownMs) => {
    if (!cooldownMs) return 0;
    const startedAt = readStoredTimestamp('cooldown', key, 'local');
    if (!startedAt) return 0;
    return Math.max(0, cooldownMs - (Date.now() - startedAt));
  };

  const setFormCooldown = (key) => {
    writeStoredTimestamp('cooldown', key, Date.now(), 'local');
  };

  const clearFormCooldown = (key) => {
    writeStoredTimestamp('cooldown', key, null, 'local');
  };

  const buildCooldownMessage = (remainingMs) => {
    const seconds = Math.max(1, Math.ceil(remainingMs / 1000));
    return `Merci de patienter ${seconds} seconde${seconds > 1 ? 's' : ''} avant de renvoyer votre demande.`;
  };

  const runAntiSpamChecks = ({
    formKey,
    honeypotValue,
    minimumDelayMs,
    cooldownMs,
    genericErrorMessage = GENERIC_SUBMIT_ERROR
  }) => {
    if (hasHoneypotValue(honeypotValue)) {
      return { ok: false, error: genericErrorMessage };
    }

    if (isSubmissionTooFast(formKey, minimumDelayMs)) {
      return { ok: false, error: genericErrorMessage };
    }

    const cooldownRemainingMs = getCooldownRemainingMs(formKey, cooldownMs);
    if (cooldownRemainingMs > 0) {
      return { ok: false, error: buildCooldownMessage(cooldownRemainingMs) };
    }

    return { ok: true, error: null };
  };

  const hideFeedback = () => {
    feedback.hidden = true;
    feedback.textContent = '';
    feedback.classList.remove('feedback-success');
    feedback.classList.add('feedback-error');
    feedbackDetail.hidden = true;
    feedbackDetail.textContent = '';
  };

  const showError = (message, detail = '') => {
    feedback.hidden = false;
    feedback.classList.remove('feedback-success');
    feedback.classList.add('feedback-error');
    feedback.textContent = message || GENERIC_SUBMIT_ERROR;
    feedbackDetail.hidden = !detail;
    feedbackDetail.textContent = detail || '';
  };

  const showSuccess = () => {
    hideFeedback();
    formShell.hidden = true;
    successShell.hidden = false;
    successMessage.textContent = SUCCESS_MESSAGE;
  };

  const setLoading = (isLoading) => {
    submitButton.disabled = isLoading;
    submitButton.setAttribute('aria-busy', isLoading ? 'true' : 'false');
    submitLabel.textContent = isLoading ? 'Envoi en cours...' : 'Envoyer ma demande';
  };

  const isNonProductionRuntime = () => {
    const host = String(window.location.hostname || '').toLowerCase();
    if (window.location.protocol === 'file:') return true;
    if (!host) return true;
    return host === 'localhost' || host === '127.0.0.1' || host.endsWith('.vercel.app');
  };

  const buildDevDetail = (error) => {
    const rawMessage = String(error && (error.rawMessage || error.message) || '').trim();

    if (/Missing RESEND_API_KEY/i.test(rawMessage) || /Missing RESEND_FROM/i.test(rawMessage)) {
      return 'Variables serveur manquantes en dev: RESEND_API_KEY et RESEND_FROM.';
    }

    if (/HTTP 404/i.test(rawMessage) || (rawMessage.includes('/api/send-email') && /404/.test(rawMessage))) {
      return "L'endpoint /api/send-email n'est pas disponible dans ce contexte local. Utilisez Vercel Dev ou une preview pour tester l'envoi.";
    }

    if (/Failed to fetch|NetworkError|Load failed/i.test(rawMessage) || window.location.protocol === 'file:') {
      return "L'endpoint /api/send-email est inaccessible depuis ce contexte local. Utilisez Vercel Dev ou une preview pour tester l'envoi.";
    }

    if (/Too many email requests/i.test(rawMessage)) {
      return 'La protection anti-abus a temporairement bloque les envois repetes.';
    }

    return rawMessage ? `Detail dev: ${rawMessage}` : '';
  };

  const collectPayload = (currentForm) => {
    const formData = new FormData(currentForm);

    return {
      fullName: normalizeText(formData.get('fullName'), 140),
      company: normalizeText(formData.get('company'), 180),
      email: normalizeText(formData.get('email'), 180),
      phone: normalizeText(formData.get('phone'), 60),
      structureType: normalizeText(formData.get('structureType'), 120),
      need: normalizeText(formData.get('need'), 120),
      message: normalizeMultilineText(formData.get('message'), MAX_TEXT_LENGTH),
      consent: formData.get('consent') === 'on',
      website: normalizeText(formData.get('website'), 120)
    };
  };

  const sendPartnerInterestEmail = async (payload) => {
    let response;

    try {
      response = await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'partner_interest',
          data: {
            fullName: payload.fullName,
            company: payload.company,
            email: payload.email,
            phone: payload.phone,
            structureType: payload.structureType,
            need: payload.need,
            message: payload.message,
            consent: payload.consent,
            website: payload.website,
            sourcePage: 'partenaire.html',
            sourceUrl: window.location.href
          }
        })
      });
    } catch (error) {
      const networkError = new Error(GENERIC_SUBMIT_ERROR);
      networkError.rawMessage = error && error.message ? error.message : 'Network error';
      throw networkError;
    }

    const rawText = await response.text().catch(() => '');
    const parsed = rawText ? safeJsonParse(rawText) : null;

    if (!response.ok) {
      const apiError = parsed && typeof parsed.error === 'string'
        ? parsed.error
        : (rawText || `HTTP ${response.status}`);

      const requestError = new Error(GENERIC_SUBMIT_ERROR);
      requestError.status = response.status;
      requestError.rawMessage = apiError;
      throw requestError;
    }

    return parsed;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    hideFeedback();

    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    const payload = collectPayload(form);
    const antiSpamCheck = runAntiSpamChecks({
      formKey: FORM_KEY,
      honeypotValue: payload.website,
      minimumDelayMs: FORM_MINIMUM_DELAY_MS,
      cooldownMs: FORM_COOLDOWN_MS
    });

    if (!antiSpamCheck.ok) {
      showError(antiSpamCheck.error);
      return;
    }

    if (!payload.consent) {
      showError("Merci d'accepter le traitement de vos informations pour etudier votre demande.");
      return;
    }

    setLoading(true);
    setFormCooldown(FORM_KEY);

    try {
      await sendPartnerInterestEmail(payload);
      form.reset();
      markFormRendered(FORM_KEY);
      showSuccess();
    } catch (error) {
      clearFormCooldown(FORM_KEY);
      showError(
        GENERIC_SUBMIT_ERROR,
        isNonProductionRuntime() ? buildDevDetail(error) : ''
      );
    } finally {
      setLoading(false);
    }
  };

  markFormRendered(FORM_KEY);
  form.addEventListener('submit', handleSubmit);
})();
