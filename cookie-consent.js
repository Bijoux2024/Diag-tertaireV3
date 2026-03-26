/**
 * DiagTertiaire — Gestion des cookies / consentement
 * Conforme CNIL · Buildless · Sans dépendance externe
 *
 * Traceur soumis à consentement : Vercel Analytics (/_vercel/insights/script.js)
 * Stockage du choix : localStorage['dt_cookie_consent'] — durée 6 mois max
 *
 * API publique :
 *   window.dtCookies.open()     — rouvre la bannière
 *   window.dtCookies.getConsent() — retourne l'objet de consentement ou null
 *   window.dtCookies.reset()    — efface le choix et rouvre la bannière
 */
(function () {
    'use strict';

    var CONSENT_KEY = 'dt_cookie_consent';
    var CONSENT_MAX_MS = 180 * 24 * 60 * 60 * 1000; // 6 mois
    var VA_SCRIPT = '/_vercel/insights/script.js';

    /* ── Stockage ─────────────────────────────────────────────────────────── */

    function readConsent() {
        try {
            var raw = localStorage.getItem(CONSENT_KEY);
            if (!raw) return null;
            var d = JSON.parse(raw);
            if (!d || typeof d.ts !== 'number') return null;
            if (Date.now() - d.ts > CONSENT_MAX_MS) {
                localStorage.removeItem(CONSENT_KEY);
                return null;
            }
            return d;
        } catch (e) { return null; }
    }

    function writeConsent(analytics) {
        try {
            localStorage.setItem(CONSENT_KEY, JSON.stringify({
                v: 1,
                ts: Date.now(),
                analytics: !!analytics
            }));
        } catch (e) { }
    }

    /* ── Chargement conditionnel de Vercel Analytics ─────────────────────── */

    function loadAnalytics() {
        if (document.querySelector('[data-dt-va]')) return;
        var s = document.createElement('script');
        s.src = VA_SCRIPT;
        s.defer = true;
        s.setAttribute('data-dt-va', '1');
        document.head.appendChild(s);
    }

    /* ── Styles de la bannière ────────────────────────────────────────────── */

    function injectStyles() {
        if (document.getElementById('dt-cb-style')) return;
        var style = document.createElement('style');
        style.id = 'dt-cb-style';
        style.textContent =
            '#dt-cb{position:fixed;bottom:0;left:0;right:0;z-index:99999;' +
            'background:#fff;border-top:1px solid #E2E8F0;' +
            'box-shadow:0 -4px 24px rgba(15,23,42,.1);' +
            'font-family:Inter,-apple-system,BlinkMacSystemFont,sans-serif;' +
            'font-size:14px;color:#0F172A;line-height:1.5;' +
            'transform:translateY(100%);transition:transform .28s cubic-bezier(.4,0,.2,1)}' +

            '#dt-cb.dt-in{transform:translateY(0)}' +

            '#dt-cb-inner{max-width:900px;margin:0 auto;' +
            'padding:1rem 1.5rem;display:flex;align-items:center;' +
            'gap:1.25rem;flex-wrap:wrap}' +

            '#dt-cb-text{flex:1;min-width:200px}' +
            '#dt-cb-text strong{display:block;margin-bottom:.2rem;' +
            'font-size:13.5px;font-weight:600;color:#0F172A}' +
            '#dt-cb-text p{margin:0;color:#475569;font-size:13px}' +
            '#dt-cb-text a{color:#1D4ED8;text-decoration:underline;' +
            'text-underline-offset:3px}' +

            '#dt-cb-btns{display:flex;gap:.625rem;flex-shrink:0;align-items:center}' +

            '.dt-btn{padding:.5rem 1.125rem;border-radius:8px;font-size:13px;' +
            'font-weight:600;cursor:pointer;line-height:1;white-space:nowrap;' +
            'font-family:inherit;transition:background .15s,color .15s,border-color .15s}' +
            '.dt-btn:focus-visible{outline:2px solid #1D4ED8;outline-offset:2px}' +

            '#dt-cb-refuse{background:transparent;border:1.5px solid #CBD5E1;color:#334155}' +
            '#dt-cb-refuse:hover{background:#F1F5F9;border-color:#94A3B8}' +

            '#dt-cb-accept{background:#1D4ED8;border:1.5px solid #1D4ED8;color:#fff}' +
            '#dt-cb-accept:hover{background:#1E40AF;border-color:#1E40AF}' +

            '@media(max-width:560px){' +
            '#dt-cb-inner{padding:.875rem 1rem;gap:.75rem}' +
            '#dt-cb-btns{width:100%}' +
            '.dt-btn{flex:1;text-align:center;padding:.625rem 1rem}' +
            '}';
        document.head.appendChild(style);
    }

    /* ── Bannière ─────────────────────────────────────────────────────────── */

    function hideBanner() {
        var el = document.getElementById('dt-cb');
        if (!el) return;
        el.classList.remove('dt-in');
        setTimeout(function () {
            if (el.parentNode) el.parentNode.removeChild(el);
        }, 300);
    }

    function showBanner() {
        if (document.getElementById('dt-cb')) return;
        injectStyles();

        var cookiesHref = './cookies.html';

        var banner = document.createElement('div');
        banner.id = 'dt-cb';
        banner.setAttribute('role', 'dialog');
        banner.setAttribute('aria-modal', 'false');
        banner.setAttribute('aria-label', 'Préférences de cookies');
        banner.innerHTML =
            '<div id="dt-cb-inner">' +
            '<div id="dt-cb-text">' +
            '<strong>Mesure d\'audience</strong>' +
            '<p>Ce site utilise Vercel Analytics pour mesurer son audience de façon anonyme ' +
            '(pages visitées, performances). Aucun cookie tiers n\'est déposé dans votre navigateur. ' +
            '<a href="' + cookiesHref + '">En savoir plus</a></p>' +
            '</div>' +
            '<div id="dt-cb-btns">' +
            '<button id="dt-cb-refuse" class="dt-btn" type="button">Refuser</button>' +
            '<button id="dt-cb-accept" class="dt-btn" type="button">Accepter</button>' +
            '</div>' +
            '</div>';

        document.body.appendChild(banner);

        // Déclenche la transition d'entrée
        requestAnimationFrame(function () {
            requestAnimationFrame(function () {
                banner.classList.add('dt-in');
            });
        });

        // Focus initial sur le bouton Refuser (ordre logique, pas de dark pattern)
        setTimeout(function () {
            var refuse = document.getElementById('dt-cb-refuse');
            if (refuse) refuse.focus();
        }, 320);

        document.getElementById('dt-cb-accept').addEventListener('click', function () {
            writeConsent(true);
            hideBanner();
            loadAnalytics();
        });

        document.getElementById('dt-cb-refuse').addEventListener('click', function () {
            writeConsent(false);
            hideBanner();
        });

        // Échap = refus
        banner.addEventListener('keydown', function (e) {
            if (e.key === 'Escape') {
                writeConsent(false);
                hideBanner();
            }
        });
    }

    /* ── API publique ─────────────────────────────────────────────────────── */

    window.dtCookies = {
        open: function () {
            hideBanner();
            setTimeout(showBanner, 310);
        },
        getConsent: readConsent,
        reset: function () {
            try { localStorage.removeItem(CONSENT_KEY); } catch (e) { }
            hideBanner();
            setTimeout(showBanner, 310);
        }
    };

    /* ── Initialisation ───────────────────────────────────────────────────── */

    function init() {
        var c = readConsent();
        if (c === null) {
            // Aucun choix enregistré → afficher la bannière
            showBanner();
        } else if (c.analytics === true) {
            // Consentement accordé → charger Vercel Analytics
            loadAnalytics();
        }
        // Consentement refusé → ne rien charger
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
