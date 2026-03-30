/**
 * DiagTertiaire — Gestion des cookies / consentement
 * Conforme CNIL · Buildless · Sans dépendance externe
 *
 * Traceur soumis à consentement : Vercel Analytics (/_vercel/insights/script.js)
 * Stockage : localStorage['dt_cookie_consent'] — durée 6 mois max
 *
 * Structure du consentement (v2) :
 *   { v: 2, ts: <timestamp>, necessary: true, analytics: true|false }
 *
 * API publique :
 *   window.dtCookies.open()        → ouvre le panneau de préférences
 *   window.dtCookies.openBanner()  → rouvre le bandeau premier niveau
 *   window.dtCookies.getConsent()  → retourne l'objet de consentement ou null
 *   window.dtCookies.reset()       → efface le choix et rouvre le bandeau
 */
(function () {
    'use strict';

    var CONSENT_KEY    = 'dt_cookie_consent';
    var CONSENT_MAX_MS = 180 * 24 * 60 * 60 * 1000; // 6 mois
    var VA_SCRIPT      = '/_vercel/insights/script.js';
    var COOKIES_PAGE   = './cookies.html';

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
            // Migration douce depuis v1 (analytics: bool) vers v2
            if (d.v === 1) {
                return { v: 2, ts: d.ts, necessary: true, analytics: !!d.analytics };
            }
            return d;
        } catch (e) { return null; }
    }

    function writeConsent(analytics) {
        try {
            localStorage.setItem(CONSENT_KEY, JSON.stringify({
                v:         2,
                ts:        Date.now(),
                necessary: true,
                analytics: !!analytics
            }));
        } catch (e) { }
    }

    /* ── Chargement conditionnel de Vercel Analytics ─────────────────────── */

    function loadAnalytics() {
        if (document.querySelector('[data-dt-va]')) return; // anti double-injection
        var s = document.createElement('script');
        s.src = VA_SCRIPT;
        s.defer = true;
        s.setAttribute('data-dt-va', '1');
        document.head.appendChild(s);
    }

    /* ── Styles (injectés une seule fois) ─────────────────────────────────── */

    function injectStyles() {
        if (document.getElementById('dt-cb-style')) return;
        var style = document.createElement('style');
        style.id = 'dt-cb-style';
        style.textContent =

        /* ─── Bannière (bas d'écran) ─────────────────────────── */
        '#dt-cb{position:fixed;bottom:0;left:0;right:0;z-index:99990;' +
        'background:rgba(255,255,255,.96);border-top:1px solid rgba(226,232,240,.92);' +
        'backdrop-filter:saturate(145%) blur(14px);' +
        'box-shadow:0 -10px 30px rgba(15,23,42,.08);' +
        'font-family:Inter,-apple-system,BlinkMacSystemFont,sans-serif;' +
        'font-size:14px;color:#0F172A;line-height:1.5;' +
        'transform:translateY(100%);transition:transform .28s cubic-bezier(.4,0,.2,1)}' +
        '#dt-cb.dt-in{transform:translateY(0)}' +

        '#dt-cb-inner{max-width:980px;margin:0 auto;padding:.875rem 1.25rem;' +
        'display:flex;align-items:center;gap:1rem;flex-wrap:wrap}' +

        '#dt-cb-text{flex:1 1 360px;min-width:0}' +
        '#dt-cb-text h2{font-size:13.5px;font-weight:700;color:#0F172A;margin:0 0 .2rem 0}' +
        '#dt-cb-text p{margin:0;max-width:48rem;color:#475569;font-size:12px;line-height:1.55}' +
        '#dt-cb-text a{color:#1D4ED8;text-decoration:underline;text-underline-offset:2px}' +
        '#dt-cb-text a:hover{color:#1E40AF}' +

        '#dt-cb-btns{display:grid;grid-template-columns:repeat(3,minmax(0,auto));gap:.45rem;' +
        'flex-shrink:0;align-items:center;justify-content:end}' +

        /* ─── Boutons communs ─────────────────────────────────── */
        '.dt-btn{min-height:40px;padding:.625rem .95rem;border-radius:10px;font-size:12px;font-weight:600;' +
        'cursor:pointer;line-height:1;white-space:nowrap;font-family:inherit;' +
        'transition:background .14s,color .14s,border-color .14s}' +
        '.dt-btn:focus-visible{outline:2px solid #1D4ED8;outline-offset:2px}' +

        /* ghost = Tout refuser */
        '.dt-btn-ghost{background:transparent;border:1.5px solid #CBD5E1;color:#334155}' +
        '.dt-btn-ghost:hover{background:#F1F5F9;border-color:#94A3B8}' +

        /* outline = Personnaliser */
        '.dt-btn-outline{background:transparent;border:1.5px solid #93C5FD;color:#1D4ED8}' +
        '.dt-btn-outline:hover{background:#EFF6FF;border-color:#60A5FA}' +

        /* primary = Tout accepter */
        '.dt-btn-primary{background:#1D4ED8;border:1.5px solid #1D4ED8;color:#fff}' +
        '.dt-btn-primary:hover{background:#1E40AF;border-color:#1E40AF}' +

        /* dark = Enregistrer */
        '.dt-btn-dark{background:#0F172A;border:1.5px solid #0F172A;color:#fff}' +
        '.dt-btn-dark:hover{background:#1E293B}' +

        /* ─── Bannière mobile ─────────────────────────────────── */
        '@media(max-width:600px){' +
        '#dt-cb{max-height:min(34vh,240px);overflow-y:auto}' +
        '#dt-cb-inner{padding:.75rem .875rem;gap:.625rem;align-items:flex-start}' +
        '#dt-cb-text h2{font-size:13px}' +
        '#dt-cb-text p{font-size:11.5px;line-height:1.45}' +
        '#dt-cb-btns{width:100%;grid-template-columns:repeat(2,minmax(0,1fr));justify-content:stretch}' +
        '#dt-cb-btns .dt-btn{width:100%;text-align:center;padding:.625rem .75rem}' +
        '#dt-cb-accept{grid-column:1 / -1}' +
        '}' +

        /* ─── Panneau overlay ─────────────────────────────────── */
        '#dt-panel-bg{position:fixed;inset:0;z-index:99991;' +
        'background:rgba(15,23,42,.38);display:flex;' +
        'align-items:center;justify-content:center;padding:1rem;' +
        'opacity:0;transition:opacity .22s ease}' +
        '#dt-panel-bg.dt-in{opacity:1}' +

        '#dt-panel{background:#fff;border-radius:16px;' +
        'box-shadow:0 20px 60px rgba(15,23,42,.18);' +
        'width:100%;max-width:460px;' +
        'transform:scale(.96) translateY(10px);opacity:0;' +
        'transition:transform .22s cubic-bezier(.4,0,.2,1),opacity .22s;' +
        'overflow:hidden;' +
        'font-family:Inter,-apple-system,BlinkMacSystemFont,sans-serif;' +
        'font-size:14px;color:#0F172A}' +
        '#dt-panel-bg.dt-in #dt-panel{transform:scale(1) translateY(0);opacity:1}' +

        /* En-tête panneau */
        '#dt-panel-head{padding:1.125rem 1.375rem .75rem;' +
        'border-bottom:1px solid #F1F5F9;' +
        'display:flex;align-items:center;justify-content:space-between;gap:.5rem}' +
        '#dt-panel-head h2{font-size:14.5px;font-weight:700;color:#0F172A;' +
        'margin:0;line-height:1.3}' +
        '#dt-panel-close{background:transparent;border:none;cursor:pointer;' +
        'color:#64748B;padding:.3rem .4rem;border-radius:6px;' +
        'font-size:15px;line-height:1;flex-shrink:0}' +
        '#dt-panel-close:hover{color:#0F172A;background:#F1F5F9}' +
        '#dt-panel-close:focus-visible{outline:2px solid #1D4ED8;outline-offset:2px}' +

        /* Corps panneau */
        '#dt-panel-body{padding:.75rem 1.375rem .875rem;' +
        'display:flex;flex-direction:column;gap:.625rem}' +

        /* Catégories */
        '.dt-cat{display:flex;align-items:flex-start;gap:.875rem;' +
        'padding:.75rem .875rem;background:#F8FAFC;border-radius:10px;' +
        'border:1px solid #E2E8F0}' +
        '.dt-cat-info{flex:1;min-width:0}' +
        '.dt-cat-info strong{display:block;font-size:12.5px;font-weight:600;' +
        'color:#0F172A;margin-bottom:.2rem;line-height:1.3}' +
        '.dt-cat-info p{margin:0;font-size:12px;color:#475569;line-height:1.5}' +

        /* Toggle switch */
        '.dt-toggle{position:relative;flex-shrink:0;' +
        'width:38px;height:22px;margin-top:1px}' +
        '.dt-toggle input{opacity:0;width:0;height:0;position:absolute}' +
        '.dt-toggle-track{position:absolute;inset:0;border-radius:999px;' +
        'background:#CBD5E1;transition:background .18s;cursor:pointer}' +
        '.dt-toggle input:checked+.dt-toggle-track{background:#1D4ED8}' +
        '.dt-toggle-track::before{content:"";position:absolute;' +
        'width:16px;height:16px;border-radius:50%;background:#fff;' +
        'top:3px;left:3px;transition:transform .18s;' +
        'box-shadow:0 1px 4px rgba(0,0,0,.18)}' +
        '.dt-toggle input:checked+.dt-toggle-track::before{transform:translateX(16px)}' +
        '.dt-toggle input:disabled+.dt-toggle-track{cursor:not-allowed;opacity:.55}' +
        '.dt-toggle:focus-within .dt-toggle-track{outline:2px solid #93C5FD;outline-offset:1px}' +

        /* Pied panneau */
        '#dt-panel-footer{padding:.625rem 1.375rem 1.125rem;' +
        'display:flex;gap:.5rem;flex-wrap:wrap;border-top:1px solid #F1F5F9}' +
        '#dt-panel-footer .dt-btn-ghost{flex:1}' +
        '#dt-panel-footer .dt-btn-primary{flex:1}' +
        '#dt-panel-footer .dt-btn-dark{flex:2;text-align:center}' +

        /* Panneau mobile */
        '@media(max-width:500px){' +
        '#dt-panel{border-radius:12px}' +
        '#dt-panel-head{padding:.875rem 1.125rem .625rem}' +
        '#dt-panel-body{padding:.625rem 1.125rem .75rem}' +
        '#dt-panel-footer{padding:.5rem 1.125rem .875rem;flex-wrap:wrap}' +
        '#dt-panel-footer .dt-btn{font-size:12px;padding:.5rem .75rem}' +
        '#dt-panel-footer .dt-btn-ghost,' +
        '#dt-panel-footer .dt-btn-primary{flex:calc(50% - .25rem)}' +
        '#dt-panel-footer .dt-btn-dark{flex:100%}' +
        '}';

        document.head.appendChild(style);
    }

    /* ── Utilitaires ──────────────────────────────────────────────────────── */

    function byId(id) { return document.getElementById(id); }

    function slideOut(elem, cb) {
        if (!elem) return;
        elem.classList.remove('dt-in');
        setTimeout(function () {
            if (elem.parentNode) elem.parentNode.removeChild(elem);
            if (cb) cb();
        }, 280);
    }

    /* ── Fermeture ────────────────────────────────────────────────────────── */

    function hideBanner(cb) { slideOut(byId('dt-cb'), cb); }
    function hidePanel(cb)  { slideOut(byId('dt-panel-bg'), cb); }
    function hideAll()      { hideBanner(); hidePanel(); }

    /* ── Focus trap ───────────────────────────────────────────────────────── */

    function trapFocus(container) {
        container.addEventListener('keydown', function (e) {
            if (e.key !== 'Tab') return;
            var sel = 'a[href],button:not([disabled]),input:not([disabled]),' +
                      '[tabindex]:not([tabindex="-1"])';
            var nodes = container.querySelectorAll(sel);
            var arr = Array.prototype.slice.call(nodes);
            if (!arr.length) return;
            var first = arr[0], last = arr[arr.length - 1];
            if (e.shiftKey) {
                if (document.activeElement === first) { last.focus(); e.preventDefault(); }
            } else {
                if (document.activeElement === last) { first.focus(); e.preventDefault(); }
            }
        });
    }

    /* ── Bannière — niveau 1 ──────────────────────────────────────────────── */

    function showBanner() {
        if (byId('dt-cb') || byId('dt-panel-bg')) return;
        injectStyles();

        var banner = document.createElement('div');
        banner.id = 'dt-cb';
        banner.setAttribute('role', 'dialog');
        banner.setAttribute('aria-modal', 'false');
        banner.setAttribute('aria-labelledby', 'dt-cb-title');
        banner.setAttribute('aria-describedby', 'dt-cb-desc');

        banner.innerHTML =
            '<div id="dt-cb-inner">' +
            '<div id="dt-cb-text">' +
            '<h2 id="dt-cb-title">Cookies et mesure d\'audience</h2>' +
            '<p id="dt-cb-desc">' +
            'Nous utilisons des cookies et autres traceurs pour mesurer l\'audience du site ' +
            'et, si vous l\'acceptez, ameliorer l\'experience. ' +
            'Votre choix reste modifiable a tout moment via le lien\u00a0' +
            '«\u00a0Gestion des cookies\u00a0». ' +
            '<a href="' + COOKIES_PAGE + '">Politique cookies.</a>' +
            '</p>' +
            '</div>' +
            '<div id="dt-cb-btns">' +
            '<button id="dt-cb-refuse"  class="dt-btn dt-btn-ghost"   type="button">Tout refuser</button>' +
            '<button id="dt-cb-custom"  class="dt-btn dt-btn-outline" type="button">Personnaliser</button>' +
            '<button id="dt-cb-accept"  class="dt-btn dt-btn-primary" type="button">Tout accepter</button>' +
            '</div>' +
            '</div>';

        document.body.appendChild(banner);

        requestAnimationFrame(function () {
            requestAnimationFrame(function () { banner.classList.add('dt-in'); });
        });

        // Focus sur "Tout refuser" — pas de dark pattern
        setTimeout(function () {
            var btn = byId('dt-cb-refuse');
            if (btn) btn.focus();
        }, 300);

        byId('dt-cb-accept').addEventListener('click', function () {
            writeConsent(true);
            hideBanner();
            loadAnalytics();
        });

        byId('dt-cb-refuse').addEventListener('click', function () {
            writeConsent(false);
            hideBanner();
        });

        byId('dt-cb-custom').addEventListener('click', function () {
            hideBanner(function () { showPanel(); });
        });

        // Échap = refus (fermeture sans choix = refus sur premier affichage)
        banner.addEventListener('keydown', function (e) {
            if (e.key === 'Escape') {
                writeConsent(false);
                hideBanner();
            }
        });

        trapFocus(banner);
    }

    /* ── Panneau de personnalisation — niveau 2 ───────────────────────────── */

    function showPanel() {
        if (byId('dt-panel-bg')) return;
        if (byId('dt-cb')) hideBanner();
        injectStyles();

        var prevConsent   = readConsent();
        var analyticsOn   = prevConsent ? !!prevConsent.analytics : false;
        var prevFocus     = document.activeElement;

        var bg = document.createElement('div');
        bg.id = 'dt-panel-bg';
        bg.setAttribute('role', 'dialog');
        bg.setAttribute('aria-modal', 'true');
        bg.setAttribute('aria-labelledby', 'dt-panel-title');

        bg.innerHTML =
            '<div id="dt-panel">' +

            '<div id="dt-panel-head">' +
            '<h2 id="dt-panel-title">Personnaliser mes préférences</h2>' +
            '<button id="dt-panel-close" type="button" aria-label="Fermer">&#x2715;</button>' +
            '</div>' +

            '<div id="dt-panel-body">' +

            /* Catégorie 1 — Nécessaires (verrouillé) */
            '<div class="dt-cat">' +
            '<div class="dt-cat-info">' +
            '<strong>Strictement nécessaires</strong>' +
            '<p>Indispensable au fonctionnement du site, à votre session et à la mémorisation de vos préférences. Toujours actif.</p>' +
            '</div>' +
            '<label class="dt-toggle" aria-label="Strictement nécessaires — toujours actif">' +
            '<input type="checkbox" checked disabled tabindex="-1">' +
            '<span class="dt-toggle-track" aria-hidden="true"></span>' +
            '</label>' +
            '</div>' +

            /* Catégorie 2 — Mesure d'audience */
            '<div class="dt-cat">' +
            '<div class="dt-cat-info">' +
            '<strong>Mesure d\'audience</strong>' +
            '<p>Permet de mesurer les visites et les performances du site via Vercel Analytics. Aucun cookie tiers n\'est déposé dans votre navigateur.</p>' +
            '</div>' +
            '<label class="dt-toggle" aria-label="Autoriser la mesure d\'audience">' +
            '<input type="checkbox" id="dt-toggle-analytics"' + (analyticsOn ? ' checked' : '') + '>' +
            '<span class="dt-toggle-track" aria-hidden="true"></span>' +
            '</label>' +
            '</div>' +

            '</div>' + /* /dt-panel-body */

            '<div id="dt-panel-footer">' +
            '<button id="dt-p-refuse" class="dt-btn dt-btn-ghost"   type="button">Tout refuser</button>' +
            '<button id="dt-p-accept" class="dt-btn dt-btn-primary" type="button">Tout accepter</button>' +
            '<button id="dt-p-save"   class="dt-btn dt-btn-dark"    type="button">Enregistrer mes choix</button>' +
            '</div>' +

            '</div>'; /* /dt-panel */

        document.body.appendChild(bg);

        /* Fermer en restituant le focus */
        function closePanel(analytics) {
            writeConsent(analytics);
            hidePanel(function () {
                if (prevFocus && typeof prevFocus.focus === 'function') {
                    prevFocus.focus();
                }
            });
            if (analytics) loadAnalytics();
        }

        requestAnimationFrame(function () {
            requestAnimationFrame(function () {
                bg.classList.add('dt-in');
                var saveBtn = byId('dt-p-save');
                if (saveBtn) saveBtn.focus();
            });
        });

        /* Clic backdrop */
        bg.addEventListener('click', function (e) {
            if (e.target === bg) {
                // Fermeture backdrop : enregistre l'état actuel des toggles
                var checked = !!(byId('dt-toggle-analytics') && byId('dt-toggle-analytics').checked);
                closePanel(checked);
            }
        });

        byId('dt-panel-close').addEventListener('click', function () {
            var checked = !!(byId('dt-toggle-analytics') && byId('dt-toggle-analytics').checked);
            closePanel(checked);
        });

        byId('dt-p-accept').addEventListener('click', function () {
            closePanel(true);
        });

        byId('dt-p-refuse').addEventListener('click', function () {
            closePanel(false);
        });

        byId('dt-p-save').addEventListener('click', function () {
            var checked = !!(byId('dt-toggle-analytics') && byId('dt-toggle-analytics').checked);
            closePanel(checked);
        });

        bg.addEventListener('keydown', function (e) {
            if (e.key === 'Escape') {
                var checked = !!(byId('dt-toggle-analytics') && byId('dt-toggle-analytics').checked);
                closePanel(checked);
            }
        });

        trapFocus(bg);
    }

    /* ── API publique ─────────────────────────────────────────────────────── */

    window.dtCookies = {
        /** Ouvre le panneau de préférences complet */
        open: showPanel,

        /** Rouvre le bandeau de premier niveau */
        openBanner: showBanner,

        /** Retourne l'objet de consentement ou null */
        getConsent: readConsent,

        /** Efface le choix et rouvre le bandeau */
        reset: function () {
            try { localStorage.removeItem(CONSENT_KEY); } catch (e) { }
            hideAll();
            setTimeout(showBanner, 300);
        }
    };

    /* ── Initialisation ───────────────────────────────────────────────────── */

    function init() {
        var c = readConsent();
        if (c === null) {
            // Premier affichage — bandeau de consentement
            showBanner();
        } else if (c.analytics === true) {
            // Consentement analytics déjà accordé — charger immédiatement
            loadAnalytics();
        }
        // Refus déjà enregistré — ne rien charger
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
