(function () {
    'use strict';

    var MEASUREMENT_ID = window.DT_GA_MEASUREMENT_ID || 'G-LP3GE90GK5';
    var CONSENT_KEY = 'dt_cookie_consent';
    var CONSENT_MAX_MS = 180 * 24 * 60 * 60 * 1000;
    var GTAG_SCRIPT_ATTR = 'data-dt-ga4-loader';
    var GTAG_SCRIPT_SRC = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(MEASUREMENT_ID);
    var DIAGNOSTIC_STEPS = {
        diagnostic_step1_completed: { step: 1, step_name: 'building' },
        diagnostic_step2_completed: { step: 2, step_name: 'equipment' },
        diagnostic_step3_completed: { step: 3, step_name: 'energy' },
        diagnostic_step4_completed: { step: 4, step_name: 'project' },
        diagnostic_step5_completed: { step: 5, step_name: 'contact' }
    };

    var state = {
        consentGranted: false,
        scriptLoaded: false,
        scriptPromise: null,
        configApplied: false,
        clickTrackingBound: false,
        lastPageKey: '',
        pendingPagePayload: null
    };

    function ensureGtagStub() {
        window.dataLayer = window.dataLayer || [];
        if (typeof window.gtag !== 'function') {
            window.gtag = function () {
                window.dataLayer.push(arguments);
            };
        }
    }

    function gtag() {
        ensureGtagStub();
        return window.gtag.apply(window, arguments);
    }

    function safeJsonParse(rawValue) {
        if (!rawValue) return null;
        try {
            return JSON.parse(rawValue);
        } catch (error) {
            return null;
        }
    }

    function readStoredConsent() {
        try {
            var stored = safeJsonParse(window.localStorage.getItem(CONSENT_KEY));
            if (!stored || typeof stored.ts !== 'number') return null;
            if (Date.now() - stored.ts > CONSENT_MAX_MS) return null;
            if (stored.v === 1) {
                return { v: 2, ts: stored.ts, necessary: true, analytics: !!stored.analytics };
            }
            return stored;
        } catch (error) {
            return null;
        }
    }

    function cleanParams(params) {
        var cleaned = {};
        Object.keys(params || {}).forEach(function (key) {
            var value = params[key];
            if (value === undefined || value === null || value === '') return;
            if (typeof value === 'string') {
                cleaned[key] = value.slice(0, 300);
                return;
            }
            if (typeof value === 'number' || typeof value === 'boolean') {
                cleaned[key] = value;
                return;
            }
            cleaned[key] = String(value).slice(0, 300);
        });
        return cleaned;
    }

    function normalizeText(value) {
        var text = String(value || '')
            .trim()
            .toLowerCase();

        if (!text) return '';
        if (typeof text.normalize === 'function') {
            text = text.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        }

        return text
            .replace(/['’]/g, ' ')
            .replace(/[^a-z0-9]+/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
    }

    function setDefaultConsentMode() {
        if (window.__dtGtagConsentDefaultSet) return;
        gtag('consent', 'default', {
            analytics_storage: 'denied',
            ad_storage: 'denied',
            ad_user_data: 'denied',
            ad_personalization: 'denied',
            wait_for_update: 500
        });
        window.__dtGtagConsentDefaultSet = true;
    }

    function applyConsentMode(granted) {
        gtag('consent', 'update', {
            analytics_storage: granted ? 'granted' : 'denied',
            ad_storage: 'denied',
            ad_user_data: 'denied',
            ad_personalization: 'denied'
        });
    }

    function loadGoogleTag() {
        if (state.scriptLoaded) {
            return Promise.resolve();
        }

        if (state.scriptPromise) {
            return state.scriptPromise;
        }

        state.scriptPromise = new Promise(function (resolve, reject) {
            var existingScript = document.querySelector('script[' + GTAG_SCRIPT_ATTR + ']');

            if (existingScript) {
                if (existingScript.getAttribute('data-loaded') === '1') {
                    state.scriptLoaded = true;
                    resolve();
                    return;
                }

                existingScript.addEventListener('load', function () {
                    state.scriptLoaded = true;
                    existingScript.setAttribute('data-loaded', '1');
                    resolve();
                }, { once: true });
                existingScript.addEventListener('error', function () {
                    reject(new Error('Impossible de charger gtag.js'));
                }, { once: true });
                return;
            }

            var script = document.createElement('script');
            script.async = true;
            script.src = GTAG_SCRIPT_SRC;
            script.setAttribute(GTAG_SCRIPT_ATTR, '1');
            script.addEventListener('load', function () {
                state.scriptLoaded = true;
                script.setAttribute('data-loaded', '1');
                resolve();
            }, { once: true });
            script.addEventListener('error', function () {
                reject(new Error('Impossible de charger gtag.js'));
            }, { once: true });

            (document.head || document.documentElement).appendChild(script);
        }).catch(function (error) {
            console.error('DiagTertiaire GA4 error:', error);
            return Promise.reject(error);
        });

        return state.scriptPromise;
    }

    function applyConfigOnce() {
        if (state.configApplied) return;
        gtag('js', new Date());
        gtag('config', MEASUREMENT_ID, {
            anonymize_ip: true,
            send_page_view: false
        });
        state.configApplied = true;
    }

    function ensureTrackingReady() {
        if (!state.consentGranted) {
            return Promise.resolve(false);
        }

        return loadGoogleTag()
            .then(function () {
                applyConfigOnce();
                return true;
            })
            .catch(function () {
                return false;
            });
    }

    function buildPagePayload(overrides) {
        var pagePath = (overrides && overrides.page_path) || (window.location.pathname + window.location.search);
        var pageLocation = (overrides && overrides.page_location) || window.location.href;
        var payload = {
            page: pagePath,
            page_location: pageLocation,
            page_path: pagePath,
            page_title: (overrides && overrides.page_title) || document.title
        };

        if (overrides && overrides.page_name) payload.page_name = overrides.page_name;
        if (overrides && overrides.page_template) payload.page_template = overrides.page_template;

        return cleanParams(payload);
    }

    function rememberPendingPagePayload(overrides) {
        state.pendingPagePayload = buildPagePayload(overrides);
        return state.pendingPagePayload;
    }

    function sendPageViewPayload(payload, options) {
        options = options || {};
        var dedupeKey = [
            payload.page_path || '',
            payload.page_title || '',
            payload.page_name || ''
        ].join('|');

        if (!options.force && dedupeKey && state.lastPageKey === dedupeKey) {
            return false;
        }

        gtag('event', 'page_view', payload);
        state.lastPageKey = dedupeKey;
        return true;
    }

    function flushPendingPageView(options) {
        var payload = state.pendingPagePayload || buildPagePayload();
        state.pendingPagePayload = null;
        return sendPageViewPayload(payload, options);
    }

    function trackPageView(overrides, options) {
        options = options || {};

        if (!state.consentGranted) {
            if (options.queue !== false) {
                rememberPendingPagePayload(overrides);
            }
            return Promise.resolve(false);
        }

        var payload = buildPagePayload(overrides);
        return ensureTrackingReady().then(function (ready) {
            if (!ready) return false;
            state.pendingPagePayload = null;
            return sendPageViewPayload(payload, options);
        });
    }

    function trackEvent(eventName, params) {
        if (!state.consentGranted) {
            return Promise.resolve(false);
        }

        return ensureTrackingReady().then(function (ready) {
            if (!ready) return false;
            gtag('event', eventName, cleanParams(params));
            return true;
        });
    }

    function resolvePlacement(element) {
        if (!element || typeof element.closest !== 'function') return 'unknown';
        if (element.closest('header, nav')) return 'header';
        if (element.closest('footer')) return 'footer';
        if (element.closest('form')) return 'form';
        if (element.closest('main')) return 'main';
        return 'body';
    }

    function resolveCtaLocation(element) {
        if (!element || typeof element.closest !== 'function') return 'unknown';
        var scoped = element.closest('[data-dt-cta-location]');
        if (scoped) {
            var explicit = scoped.getAttribute('data-dt-cta-location');
            if (explicit) return explicit;
        }
        if (element.closest('.mobile-menu, #mobile-menu')) return 'mobile_menu';
        if (element.closest('nav, header')) return 'nav';
        if (element.closest('footer')) return 'footer_link';
        if (element.closest('main, section')) return 'content';
        return 'body';
    }

    function getElementLabel(element) {
        if (!element) return '';
        var label = element.getAttribute('data-analytics-label')
            || element.getAttribute('aria-label')
            || element.getAttribute('title')
            || element.innerText
            || element.textContent
            || element.value
            || '';

        return String(label).replace(/\s+/g, ' ').trim();
    }

    function getElementHref(element) {
        if (!element || element.tagName !== 'A') return '';
        try {
            return new URL(element.getAttribute('href'), window.location.origin).pathname;
        } catch (error) {
            return '';
        }
    }

    function resolveTrackedCta(element) {
        var label = getElementLabel(element);
        var normalizedLabel = normalizeText(label);
        var href = getElementHref(element);
        var baseParams = {
            button_type: element && element.tagName ? element.tagName.toLowerCase() : 'unknown',
            cta_label: label,
            cta_location: resolveCtaLocation(element),
            destination_path: href || '',
            page: window.location.pathname,
            placement: resolvePlacement(element),
            transport_type: 'beacon'
        };

        if (
            normalizedLabel.indexOf('lancer le pre diagnostic gratuit') !== -1
            || normalizedLabel.indexOf('voir le pre diagnostic') !== -1
            || href === '/diagnostic' || href === '/diagnostic.html'
        ) {
            baseParams.cta_name = 'launch_pre_diagnostic';
            return { eventName: 'cta_click', params: baseParams };
        }

        if (
            normalizedLabel.indexOf('decouvrir l espace pro') !== -1
            || normalizedLabel === 'espace pro'
            || href === '/espace-professionnel.html'
        ) {
            baseParams.cta_name = 'discover_pro_space';
            return { eventName: 'pro_cta_click', params: baseParams };
        }

        if (
            normalizedLabel.indexOf('exemple de rapport') !== -1
            || href === '/exemple-rapport.html'
        ) {
            baseParams.cta_name = 'example_report';
            baseParams.report_type = 'example_report';
            return { eventName: 'cta_click', params: baseParams };
        }

        return null;
    }

    function bindClickTracking() {
        if (state.clickTrackingBound) return;

        document.addEventListener('click', function (event) {
            var target = event.target && typeof event.target.closest === 'function'
                ? event.target.closest('a,button')
                : null;

            if (!target || target.hasAttribute('data-dt-ga-ignore')) return;

            var trackedCta = resolveTrackedCta(target);
            if (!trackedCta) return;

            trackEvent(trackedCta.eventName, trackedCta.params);
        }, true);

        state.clickTrackingBound = true;
    }

    function resolveBusinessEvent(name, data) {
        var currentPage = window.location.pathname;
        var baseParams = cleanParams(data || {});

        if (name === 'start_diagnostic') {
            return {
                eventName: 'diagnostic_start',
                params: cleanParams({
                    page: currentPage,
                    step: 0,
                    step_name: 'start'
                })
            };
        }

        if (name === 'diagnostic_form_start') {
            return {
                eventName: 'diagnostic_form_start',
                params: cleanParams(Object.assign({}, baseParams, {
                    page: currentPage
                }))
            };
        }

        if (name === 'contact_opt_in') {
            return {
                eventName: 'contact_opt_in',
                params: cleanParams(Object.assign({}, baseParams, {
                    page: currentPage
                }))
            };
        }

        if (DIAGNOSTIC_STEPS[name]) {
            return {
                eventName: 'diagnostic_step',
                params: cleanParams(Object.assign({}, baseParams, {
                    page: currentPage,
                    step: DIAGNOSTIC_STEPS[name].step,
                    step_name: DIAGNOSTIC_STEPS[name].step_name
                }))
            };
        }

        if (name === 'submit_form') {
            return {
                eventName: 'diagnostic_complete',
                params: cleanParams(Object.assign({}, baseParams, {
                    page: currentPage,
                    report_type: 'public_report'
                }))
            };
        }

        if (name === 'pdf_downloaded') {
            return {
                eventName: 'report_download',
                params: cleanParams(Object.assign({}, baseParams, {
                    page: currentPage,
                    report_type: 'public_pdf'
                }))
            };
        }

        if (name === 'pdf_export_started') {
            return {
                eventName: 'report_download_start',
                params: cleanParams(Object.assign({}, baseParams, {
                    page: currentPage,
                    report_type: 'public_pdf'
                }))
            };
        }

        return {
            eventName: name,
            params: cleanParams(Object.assign({}, baseParams, {
                page: currentPage
            }))
        };
    }

    function trackBusinessEvent(name, data) {
        var resolved = resolveBusinessEvent(name, data);
        return trackEvent(resolved.eventName, resolved.params);
    }

    function syncConsent(consent) {
        var granted = !!(consent && consent.analytics === true);
        var hadConsent = state.consentGranted;

        state.consentGranted = granted;

        if (!granted) {
            applyConsentMode(false);
            state.lastPageKey = '';
            rememberPendingPagePayload(state.pendingPagePayload || undefined);
            return Promise.resolve(false);
        }

        applyConsentMode(true);

        return ensureTrackingReady().then(function (ready) {
            if (!ready) return false;
            if (!hadConsent) {
                return flushPendingPageView();
            }
            return true;
        });
    }

    function handleConsentChange(event) {
        syncConsent(event && event.detail ? event.detail.consent : readStoredConsent());
    }

    function handleStorageChange(event) {
        if (!event || event.key !== CONSENT_KEY) return;
        syncConsent(readStoredConsent());
    }

    ensureGtagStub();
    setDefaultConsentMode();
    rememberPendingPagePayload();
    bindClickTracking();
    window.addEventListener('dt:cookie-consent-change', handleConsentChange);
    window.addEventListener('storage', handleStorageChange);

    window.dtAnalytics = {
        measurementId: MEASUREMENT_ID,
        hasConsent: function () {
            return state.consentGranted;
        },
        syncConsent: syncConsent,
        trackBusinessEvent: trackBusinessEvent,
        trackEvent: trackEvent,
        trackPageView: trackPageView,
        updateConsent: function (analyticsGranted) {
            return syncConsent({ analytics: !!analyticsGranted });
        }
    };

    syncConsent(readStoredConsent());
})();
