(() => {
  'use strict';

  const FORM_KEY = 'partner-interest-form';
  const STORAGE_PREFIX = 'diagtertiaire_antispam';
  const GENERIC_SUBMIT_ERROR = "Impossible d'envoyer votre demande pour le moment. Merci de reessayer dans quelques instants.";
  const FORM_MINIMUM_DELAY_MS = 3000;
  const FORM_COOLDOWN_MS = 30000;
  const MAX_TEXT_LENGTH = 2000;

  let publicRuntimeConfig = null;
  let publicRuntimeConfigPromise = null;

  const form = document.getElementById('partner-form');
  const formShell = document.getElementById('partner-form-shell');
  const successShell = document.getElementById('partner-success-shell');
  const feedback = document.getElementById('partner-feedback');
  const submitButton = document.getElementById('partner-submit-button');
  const submitLabel = document.getElementById('partner-submit-label');
  const calendlyCta = document.getElementById('partner-calendly-cta');
  const honeypotField = document.getElementById('partner-website');

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

  const loadPublicRuntimeConfig = () => {
    if (publicRuntimeConfig) return Promise.resolve(publicRuntimeConfig);
    if (publicRuntimeConfigPromise) return publicRuntimeConfigPromise;

    publicRuntimeConfigPromise = fetch('/api/public-config', { cache: 'no-store' })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Impossible de charger /api/public-config (${response.status})`);
        }
        return response.json();
      })
      .then((data) => {
        publicRuntimeConfig = {
          supabaseUrl: String(data && data.supabaseUrl || '').trim(),
          supabasePublishableKey: String(data && data.supabasePublishableKey || '').trim(),
          partnerCalendlyUrl: String(data && data.partnerCalendlyUrl || '').trim()
        };
        return publicRuntimeConfig;
      })
      .catch((error) => {
        console.error('Erreur chargement config publique :', error);
        publicRuntimeConfig = {
          supabaseUrl: '',
          supabasePublishableKey: '',
          partnerCalendlyUrl: ''
        };
        return publicRuntimeConfig;
      });

    return publicRuntimeConfigPromise;
  };

  const insertSupabaseRow = async (tableName, payload, preferHeader = 'return=minimal') => {
    const { supabaseUrl, supabasePublishableKey } = await loadPublicRuntimeConfig();

    if (!supabaseUrl || !supabasePublishableKey) {
      return {
        ok: false,
        status: 0,
        error: 'Configuration Supabase indisponible.'
      };
    }

    try {
      const response = await fetch(`${supabaseUrl}/rest/v1/${tableName}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: supabasePublishableKey,
          Authorization: `Bearer ${supabasePublishableKey}`,
          Prefer: preferHeader
        },
        body: JSON.stringify(payload)
      });

      const rawText = await response.text().catch(() => '');
      const parsed = rawText ? safeJsonParse(rawText) : null;

      if (!response.ok) {
        return {
          ok: false,
          status: response.status,
          error: (parsed && (parsed.message || parsed.error)) || rawText || `HTTP ${response.status}`
        };
      }

      return {
        ok: true,
        status: response.status,
        data: parsed
      };
    } catch (error) {
      return {
        ok: false,
        status: 0,
        error: error && error.message ? error.message : 'Erreur reseau.'
      };
    }
  };

  const buildLeadMessage = (payload) => {
    const summaryParts = [
      payload.partnerType ? `Type: ${payload.partnerType}` : '',
      payload.requestSubject ? `Objet: ${payload.requestSubject}` : '',
      payload.monthlyVolume ? `Volume: ${payload.monthlyVolume}` : '',
      payload.message ? payload.message : ''
    ].filter(Boolean);

    return summaryParts.join(' | ');
  };

  const buildPartnerLeadPayload = (payload) => ({
    source: 'partner_page',
    name: payload.fullName || null,
    email: payload.email || null,
    company: payload.company || null,
    phone: payload.phone || null,
    message: buildLeadMessage(payload) || null,
    raw_payload: {
      form: 'partner_page',
      page_url: window.location.href,
      full_name: payload.fullName || null,
      company: payload.company || null,
      email: payload.email || null,
      phone: payload.phone || null,
      partner_type: payload.partnerType || null,
      monthly_volume: payload.monthlyVolume || null,
      request_subject: payload.requestSubject || null,
      message: payload.message || null,
      consent_rgpd: true,
      consent_text_version: 'partner_page_rgpd_v1_2026-04-01'
    }
  });

  const submitPartnerLead = async (payload) => {
    const leadPayload = buildPartnerLeadPayload(payload);
    const result = await insertSupabaseRow('pro_interest_submissions', leadPayload);

    if (!result.ok) {
      console.warn('partner lead persistence failed', result.status, result.error);
    }

    return result;
  };

  const sendPartnerInterestEmail = async (payload) => {
    const response = await fetch('/api/send-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'partner_interest',
        data: {
          fullName: payload.fullName,
          company: payload.company,
          email: payload.email,
          phone: payload.phone,
          partnerType: payload.partnerType,
          monthlyVolume: payload.monthlyVolume,
          requestSubject: payload.requestSubject,
          message: payload.message,
          consent: true,
          sourcePage: 'partenaire.html',
          sourceUrl: window.location.href
        }
      })
    });

    const raw = await response.text().catch(() => '');
    const parsed = raw ? safeJsonParse(raw) : null;

    if (!response.ok) {
      const apiError = parsed && typeof parsed.error === 'string' ? parsed.error : '';
      const message = response.status >= 500
        ? GENERIC_SUBMIT_ERROR
        : (apiError || GENERIC_SUBMIT_ERROR);
      throw new Error(message);
    }

    return parsed;
  };

  const setLoading = (isLoading) => {
    submitButton.disabled = isLoading;
    submitButton.setAttribute('aria-busy', isLoading ? 'true' : 'false');
    submitLabel.textContent = isLoading
      ? 'Envoi en cours...'
      : 'Parlez-nous de votre activite';
  };

  const hideFeedback = () => {
    feedback.hidden = true;
    feedback.classList.remove('feedback-success');
    feedback.classList.add('feedback-error');
    feedback.textContent = '';
  };

  const showError = (message) => {
    feedback.hidden = false;
    feedback.classList.remove('feedback-success');
    feedback.classList.add('feedback-error');
    feedback.textContent = message || GENERIC_SUBMIT_ERROR;
  };

  const showSuccess = async () => {
    hideFeedback();
    formShell.hidden = true;
    successShell.hidden = false;

    const config = await loadPublicRuntimeConfig();
    if (config.partnerCalendlyUrl) {
      calendlyCta.href = config.partnerCalendlyUrl;
      calendlyCta.hidden = false;
    }
  };

  const collectPayload = (currentForm) => {
    const formData = new FormData(currentForm);

    return {
      fullName: normalizeText(formData.get('fullName'), 140),
      company: normalizeText(formData.get('company'), 180),
      email: normalizeText(formData.get('email'), 180),
      phone: normalizeText(formData.get('phone'), 60),
      partnerType: normalizeText(formData.get('partnerType'), 120),
      monthlyVolume: normalizeText(formData.get('monthlyVolume'), 40),
      requestSubject: normalizeText(formData.get('requestSubject'), 120),
      message: normalizeMultilineText(formData.get('message'), MAX_TEXT_LENGTH),
      consent: formData.get('consent') === 'on'
    };
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    hideFeedback();

    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    const antiSpamCheck = runAntiSpamChecks({
      formKey: FORM_KEY,
      honeypotValue: honeypotField.value,
      minimumDelayMs: FORM_MINIMUM_DELAY_MS,
      cooldownMs: FORM_COOLDOWN_MS
    });

    if (!antiSpamCheck.ok) {
      showError(antiSpamCheck.error);
      return;
    }

    const payload = collectPayload(form);
    if (!payload.consent) {
      showError("Merci d'accepter le traitement de vos informations pour etudier votre demande.");
      return;
    }

    setLoading(true);
    setFormCooldown(FORM_KEY);

    try {
      await sendPartnerInterestEmail(payload);
      await submitPartnerLead(payload);
      await showSuccess();
      form.reset();
      markFormRendered(FORM_KEY);
    } catch (error) {
      clearFormCooldown(FORM_KEY);
      showError(error && error.message ? error.message : GENERIC_SUBMIT_ERROR);
    } finally {
      setLoading(false);
    }
  };

  if (!form || !submitButton || !submitLabel || !feedback || !formShell || !successShell || !honeypotField) {
    return;
  }

  markFormRendered(FORM_KEY);
  loadPublicRuntimeConfig().catch(() => null);
  form.addEventListener('submit', handleSubmit);
})();
