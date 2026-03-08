/**
 * test-audit.js — Test end-to-end DiagTertiaire Pro Alpha
 * Remplit le vrai formulaire dans l'iframe module par module.
 */
const puppeteer = require('puppeteer');

const BASE = 'http://localhost:8765';
const D = ms => new Promise(r => setTimeout(r, ms));
const checks = [], errors = [];

function log(msg) { console.log(`[${new Date().toISOString().slice(11,19)}] ${msg}`); }
function ok(label) { checks.push({ ok: true, label }); log(`  ✅ ${label}`); }
function fail(label) { checks.push({ ok: false, label }); errors.push(label); log(`  ❌ ${label}`); }
function warn(label) { log(`  ⚠️  ${label}`); }

// Remplir un input React (contourne le state React via nativeInputValueSetter)
async function reactFill(frame, selector, value) {
  try {
    await frame.waitForSelector(selector, { timeout: 4000 });
    await frame.evaluate((sel, val) => {
      const input = document.querySelector(sel);
      if (!input) return;
      const nativeInputSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
      nativeInputSetter.call(input, val);
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
    }, selector, value);
    return true;
  } catch(e) { warn(`reactFill "${selector}" : ${e.message.slice(0,60)}`); return false; }
}

// Remplir un textarea React
async function reactFillTA(frame, selector, value) {
  try {
    await frame.waitForSelector(selector, { timeout: 3000 });
    await frame.evaluate((sel, val) => {
      const el = document.querySelector(sel);
      if (!el) return;
      const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value').set;
      nativeSetter.call(el, val);
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
    }, selector, value);
    return true;
  } catch(e) { warn(`reactFillTA "${selector}" : ${e.message.slice(0,60)}`); return false; }
}

// Cliquer sur un bouton dans une frame par texte partiel
async function clickText(frame, text, timeout = 5000) {
  try {
    await frame.waitForFunction(
      t => [...document.querySelectorAll('button, [role=button]')].some(el => el.textContent.includes(t)),
      { timeout }, text
    );
    return frame.evaluate(t => {
      const btn = [...document.querySelectorAll('button, [role=button]')].find(el => el.textContent.includes(t));
      if (btn) { btn.click(); return true; }
      return false;
    }, text);
  } catch(e) { warn(`clickText "${text}" : ${e.message.slice(0,60)}`); return false; }
}

// Sélectionner une option dans un select React
async function reactSelect(frame, selector, value) {
  try {
    await frame.waitForSelector(selector, { timeout: 4000 });
    await frame.evaluate((sel, val) => {
      const el = document.querySelector(sel);
      if (!el) return;
      el.value = val;
      el.dispatchEvent(new Event('change', { bubbles: true }));
    }, selector, value);
    return true;
  } catch(e) { warn(`reactSelect "${selector}"="${value}" : ${e.message.slice(0,60)}`); return false; }
}

// Cliquer sur une RadioCard par data-value ou texte du label
async function clickRadioCard(frame, textContent) {
  return frame.evaluate(txt => {
    const candidates = [...document.querySelectorAll('[class*="cursor"], button, label, div[class*="radio"], div[class*="card"]')];
    const target = candidates.find(el => el.textContent.includes(txt) && !el.children.length ||
      el.textContent.includes(txt));
    if (target) { target.click(); return true; }
    return false;
  }, textContent);
}

// Cliquer sur le bouton Suivant
async function clickNext(frame) {
  const clicked = await frame.evaluate(() => {
    const btns = [...document.querySelectorAll('button')];
    const btn = btns.find(b =>
      /Suivant|Continuer|Générer|Terminer|Valider/.test(b.textContent) &&
      !b.disabled
    );
    if (btn) { btn.click(); return btn.textContent.trim().slice(0, 30); }
    return null;
  });
  return clicked;
}

async function run() {
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: { width: 1440, height: 900 },
    args: ['--no-sandbox'],
    slowMo: 20,
  });

  const page = await browser.newPage();
  const pageErrors = [];
  page.on('pageerror', e => { if (!e.message.includes('PropTypes') && !e.message.includes('oneOfType')) pageErrors.push(e.message.slice(0,100)); });

  // ─────────────────────────────────────────────────────────────
  // 1. LOGIN & SETUP
  // ─────────────────────────────────────────────────────────────
  log('\n══ 1. LOGIN PRO ══');
  await page.goto(`${BASE}/index.saaspro.html`, { waitUntil: 'networkidle2', timeout: 30000 });
  await D(1500);
  await page.evaluate(() => { localStorage.clear(); localStorage.setItem('proAuth', 'true'); });
  await page.reload({ waitUntil: 'networkidle2' });
  await D(2000);

  const appLoaded = await page.evaluate(() => !!document.querySelector('.nav-item'));
  appLoaded ? ok('App Pro chargée') : fail('App Pro non chargée');

  // ─────────────────────────────────────────────────────────────
  // 2. OUVRIR L'OUTIL NOUVEAU DIAGNOSTIC (IFRAME)
  // ─────────────────────────────────────────────────────────────
  log('\n══ 2. OUVERTURE IFRAME ══');
  await page.evaluate(() => {
    [...document.querySelectorAll('.nav-item')].find(e => e.textContent.includes('Nouveau'))?.click();
  });
  await D(3000);

  let frame = page.frames().find(f => f.url().includes('diagtertiaire-pro-alpha'));
  if (!frame) { fail('Iframe alpha introuvable'); await browser.close(); return; }
  ok('Iframe alpha chargée');
  await page.screenshot({ path: 'sc-01-gate.png' });

  // ─────────────────────────────────────────────────────────────
  // 3. GATE : clic "NON — < 1 000 m²"
  // ─────────────────────────────────────────────────────────────
  log('\n══ 3. GATE SURFACE ══');
  const gateOk = await clickText(frame, 'NON', 5000);
  log(`   Gate cliqué (NON): ${gateOk}`);
  await D(1500);
  await page.screenshot({ path: 'sc-02-m1-debut.png' });

  const formVisible = await frame.evaluate(() => !!document.querySelector('input[placeholder*="Jean"], input[placeholder*="contact"]'));
  formVisible ? ok('Module 1 visible') : fail('Module 1 non visible après gate');

  // ─────────────────────────────────────────────────────────────
  // 4. MODULE 1 — IDENTIFICATION
  // ─────────────────────────────────────────────────────────────
  log('\n══ 4. MODULE 1 — Identification ══');

  await reactFill(frame, 'input[placeholder*="Jean Dupont"]', 'Marie Durand');
  await D(200);
  await reactFill(frame, 'input[placeholder*="SAS Immobilier"]', 'Agence Martin Immobilier');
  await D(200);
  await reactFill(frame, 'input[type="email"]', 'm.durand@martin-immo.fr');
  await D(200);
  await reactFill(frame, 'input[type="tel"]', '06 12 34 56 78');
  await D(200);
  await reactFill(frame, 'input[placeholder*="Paix"], input[placeholder*="Paris"], input[placeholder*="adresse"], input[placeholder*="Adresse"]', '47 Rue de la Paix');
  await D(200);
  // CP
  await reactFill(frame, 'input[placeholder*="75001"], input[maxlength="5"]', '69003');
  await D(500);

  // Statut : propriétaire occupant
  await frame.evaluate(() => {
    const all = [...document.querySelectorAll('button, div[class*="cursor"], label')];
    const t = all.find(e => e.textContent.includes('propriétaire') && e.textContent.includes('occupant'));
    if (t) { t.click(); return true; }
    // Fallback: chercher tout ce qui contient "propriétaire"
    const t2 = all.find(e => e.textContent.toLowerCase().includes('propriétaire'));
    if (t2) { t2.click(); return true; }
    return false;
  });
  await D(300);

  // Objectif : réduire les charges
  await frame.evaluate(() => {
    const all = [...document.querySelectorAll('button, div[class*="cursor"], label, div[class*="card"]')];
    const t = all.find(e => e.textContent.includes('Réduire') || e.textContent.includes('charges'));
    if (t) t.click();
  });
  await D(300);

  // Horizon : Court terme (value='court')
  await reactSelect(frame, 'select', 'court');
  await D(300);

  // Contexte
  await reactFillTA(frame, 'textarea', 'Factures en forte hausse depuis 2 ans, bail commercial à renouveler en septembre.');
  await D(300);

  await page.screenshot({ path: 'sc-03-m1-rempli.png' });
  const m1Next = await clickNext(frame);
  log(`   Suivant M1: "${m1Next}"`);
  await D(2000);
  await page.screenshot({ path: 'sc-04-m2-debut.png' });

  // ─────────────────────────────────────────────────────────────
  // 5. MODULE 2 — PROFIL BÂTIMENT
  // ─────────────────────────────────────────────────────────────
  log('\n══ 5. MODULE 2 — Bâtiment ══');

  // Activité : Bureaux
  await frame.evaluate(() => {
    const all = [...document.querySelectorAll('button, div[class*="cursor"], label, div[class*="card"]')];
    const t = all.find(e => e.textContent.includes('Bureaux') || e.textContent.includes('Services'));
    if (t) { t.click(); return; }
    // Select fallback
    const sel = [...document.querySelectorAll('select')];
    for (const s of sel) {
      const opt = [...s.options].find(o => o.value === 'bureaux' || o.text.includes('Bureau'));
      if (opt) { s.value = opt.value; s.dispatchEvent(new Event('change', {bubbles:true})); return; }
    }
  });
  await D(400);

  // Surface : 380
  await frame.evaluate(() => {
    const inputs = [...document.querySelectorAll('input[type="number"]')];
    const surf = inputs.find(i => i.placeholder === '500' || i.placeholder?.includes('m') || i.min === '1');
    const target = surf || inputs[0];
    if (target) {
      Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set.call(target, '380');
      target.dispatchEvent(new Event('input', { bubbles: true }));
      target.dispatchEvent(new Event('change', { bubbles: true }));
    }
  });
  await D(300);

  // Année construction : 1948-1974
  await frame.evaluate(() => {
    const sels = [...document.querySelectorAll('select')];
    for (const s of sels) {
      const opt = [...s.options].find(o => o.value === '1948_1974' || o.text.includes('1948'));
      if (opt) { s.value = '1948_1974'; s.dispatchEvent(new Event('change', {bubbles:true})); return; }
    }
  });
  await D(300);

  await page.screenshot({ path: 'sc-05-m2-rempli.png' });
  const m2Next = await clickNext(frame);
  log(`   Suivant M2: "${m2Next}"`);
  await D(2000);

  // ─────────────────────────────────────────────────────────────
  // 6. MODULE 3 — ENVELOPPE
  // ─────────────────────────────────────────────────────────────
  log('\n══ 6. MODULE 3 — Enveloppe ══');

  // Isolation toiture : partiel
  await frame.evaluate(() => {
    const all = [...document.querySelectorAll('button, div[class*="cursor"], label, div[class*="card"]')];
    const t = all.find(e => e.textContent.includes('Partiel') || e.textContent.includes('partielle'));
    if (t) t.click();
  });
  await D(300);

  // Vitrage : double_ancien
  await frame.evaluate(() => {
    const sels = [...document.querySelectorAll('select')];
    for (const s of sels) {
      const opt = [...s.options].find(o => o.value === 'double_ancien' || o.text.includes('ancien'));
      if (opt) { s.value = 'double_ancien'; s.dispatchEvent(new Event('change', {bubbles:true})); return; }
    }
  });
  await D(300);

  await page.screenshot({ path: 'sc-06-m3-rempli.png' });
  const m3Next = await clickNext(frame);
  log(`   Suivant M3: "${m3Next}"`);
  await D(2000);

  // ─────────────────────────────────────────────────────────────
  // 7. MODULE 4 — ÉQUIPEMENTS
  // ─────────────────────────────────────────────────────────────
  log('\n══ 7. MODULE 4 — Équipements ══');

  // Chauffage : chaudiere_standard
  await frame.evaluate(() => {
    const sels = [...document.querySelectorAll('select')];
    for (const s of sels) {
      const opt = [...s.options].find(o => o.value === 'chaudiere_standard' || o.text.includes('standard'));
      if (opt) { s.value = 'chaudiere_standard'; s.dispatchEvent(new Event('change', {bubbles:true})); return; }
    }
    // Card fallback
    const all = [...document.querySelectorAll('button, div[class*="cursor"], label, div[class*="card"]')];
    const t = all.find(e => e.textContent.includes('standard') && e.textContent.includes('gaz'));
    if (t) t.click();
  });
  await D(400);

  // Age chauffage : 10_20_ans (select)
  await frame.evaluate(() => {
    const sels = [...document.querySelectorAll('select')];
    for (const s of sels) {
      const opt = [...s.options].find(o => o.value === '10_20_ans' || (o.text.includes('10') && o.text.includes('20')));
      if (opt) { s.value = opt.value; s.dispatchEvent(new Event('change', {bubbles:true})); return; }
    }
  });
  await D(300);

  // Réseau eau chaude
  await frame.evaluate(() => {
    const all = [...document.querySelectorAll('button, div[class*="cursor"], label, div[class*="card"]')];
    const t = all.find(e => e.textContent.includes('eau chaude') || e.textContent.includes('Eau chaude') || e.textContent.includes('hydraulique'));
    if (t) t.click();
  });
  await D(300);

  // VMC simple flux
  await frame.evaluate(() => {
    const sels = [...document.querySelectorAll('select')];
    for (const s of sels) {
      const opt = [...s.options].find(o => o.value === 'simple_auto' || o.text.includes('simple'));
      if (opt) { s.value = opt.value; s.dispatchEvent(new Event('change', {bubbles:true})); return; }
    }
    const all = [...document.querySelectorAll('button, div[class*="cursor"], label')];
    const t = all.find(e => e.textContent.includes('Simple flux') || e.textContent.includes('simple flux'));
    if (t) t.click();
  });
  await D(300);

  // Éclairage : fluorescent
  await frame.evaluate(() => {
    const all = [...document.querySelectorAll('button, div[class*="cursor"], label, div[class*="card"]')];
    const t = all.find(e => e.textContent.includes('fluorescent') || e.textContent.includes('Fluorescent') || e.textContent.includes('Néon'));
    if (t) t.click();
  });
  await D(300);

  await page.screenshot({ path: 'sc-07-m4-rempli.png' });
  const m4Next = await clickNext(frame);
  log(`   Suivant M4: "${m4Next}"`);
  await D(2000);

  // ─────────────────────────────────────────────────────────────
  // 8. MODULE 5 — CONSOMMATIONS
  // ─────────────────────────────────────────────────────────────
  log('\n══ 8. MODULE 5 — Consommations ══');

  // Remplir les 4 champs dans l'ordre : conso_elec_kwh, cout_elec_eur, conso_gaz_val, cout_gaz_eur
  const fillByPlaceholder = async (ph, val) => {
    await frame.evaluate((p, v) => {
      const inputs = [...document.querySelectorAll('input[type="number"]')];
      const el = inputs.find(i => i.placeholder?.includes(p));
      if (!el) return;
      Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set.call(el, v);
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
    }, ph, val);
    await D(150);
  };

  await fillByPlaceholder('45 000', '52000');
  await fillByPlaceholder('8 500', '10800');
  await fillByPlaceholder('120 000', '38000');
  await fillByPlaceholder('12 000', '4200');

  // Fallback si placeholder non trouvé : remplir les 4 premiers number inputs
  await frame.evaluate(() => {
    const inputs = [...document.querySelectorAll('input[type="number"]')].filter(i => !i.value || i.value === '0');
    const vals = ['52000', '10800', '38000', '4200'];
    const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
    inputs.slice(0, 4).forEach((inp, i) => {
      setter.call(inp, vals[i]);
      inp.dispatchEvent(new Event('input', { bubbles: true }));
      inp.dispatchEvent(new Event('change', { bubbles: true }));
    });
  });
  await D(300);

  await page.screenshot({ path: 'sc-08-m5-rempli.png' });
  const m5Next = await clickNext(frame);
  log(`   Suivant M5: "${m5Next}"`);
  await D(2000);

  // ─────────────────────────────────────────────────────────────
  // 9. MODULE 6 — USAGE
  // ─────────────────────────────────────────────────────────────
  log('\n══ 9. MODULE 6 — Usage ══');

  // Heures/semaine
  await frame.evaluate(() => {
    const inputs = [...document.querySelectorAll('input[type="number"]')];
    const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
    if (inputs[0]) { setter.call(inputs[0], '45'); inputs[0].dispatchEvent(new Event('input',{bubbles:true})); inputs[0].dispatchEvent(new Event('change',{bubbles:true})); }
  });
  await D(300);

  await page.screenshot({ path: 'sc-09-m6-rempli.png' });
  const m6Next = await clickNext(frame);
  log(`   Suivant M6: "${m6Next}"`);
  await D(2000);

  // ─────────────────────────────────────────────────────────────
  // 10. MODULE 7 — BUDGET ET TRAVAUX
  // ─────────────────────────────────────────────────────────────
  log('\n══ 10. MODULE 7 — Budget ══');

  // Budget : 5k_20k
  await frame.evaluate(() => {
    const all = [...document.querySelectorAll('button, div[class*="cursor"], label, div[class*="card"]')];
    const t = all.find(e => e.textContent.includes('5 000') || e.textContent.includes('20 000') || e.textContent.includes('5k'));
    if (t) t.click();
  });
  await D(300);

  await page.screenshot({ path: 'sc-10-m7-rempli.png' });

  // Générer le rapport
  log('   → Clic "Générer le rapport"');
  const genNext = await clickNext(frame);
  log(`   Bouton cliqué: "${genNext}"`);
  await D(4000);
  await page.screenshot({ path: 'sc-11-rapport-alpha.png', fullPage: true });

  // ─────────────────────────────────────────────────────────────
  // 11. VÉRIFICATION RAPPORT DANS L'IFRAME ALPHA
  // ─────────────────────────────────────────────────────────────
  log('\n══ 11. VÉRIFICATION RAPPORT IFRAME ALPHA ══');

  // Le rapport alpha s'affiche dans l'iframe
  const alphaRapport = await frame.evaluate(() => {
    return {
      hasScore: !!document.querySelector('[class*="score"], [class*="grade"], [class*="indice"]'),
      hasActions: !!document.querySelector('[class*="action"], [class*="ACT"]'),
      bodyText200: document.body.textContent.slice(0, 200),
      sections: [...document.querySelectorAll('h2, h3')].map(h => h.textContent.trim()).slice(0, 15),
      hasGraphique: !!document.querySelector('.recharts-surface, svg'),
    };
  });
  log(`   Sections iframe alpha: ${alphaRapport.sections.join(' | ').slice(0,200)}`);
  alphaRapport.hasScore ? ok('Score présent dans rapport alpha') : warn('Score non détecté dans iframe');
  alphaRapport.hasActions ? ok('Actions présentes dans rapport alpha') : warn('Actions non détectées dans iframe');
  alphaRapport.hasGraphique ? ok('Graphique SVG/Recharts dans iframe') : warn('Graphique absent de iframe');

  // ─────────────────────────────────────────────────────────────
  // 12. RAPPORT PRO DANS INDEX.SAASPRO.HTML
  // ─────────────────────────────────────────────────────────────
  log('\n══ 12. RAPPORT PRO (index.saaspro.html) ══');

  // Attendre que ProNewDiag détecte le rapport via localStorage polling
  await D(3000);

  const hasNewReportBtn = await page.evaluate(() => {
    return [...document.querySelectorAll('button')].some(b => b.textContent.includes('rapport') || b.textContent.includes('Rapport'));
  });

  if (hasNewReportBtn) {
    ok('"Voir le rapport" apparu dans ProNewDiag');
    await page.evaluate(() => {
      const btn = [...document.querySelectorAll('button')].find(b => b.textContent.includes('rapport') || b.textContent.includes('Rapport'));
      if (btn) btn.click();
    });
    await D(3000);
  } else {
    warn('Bouton rapport pas détecté — forçage via navigate dossiers');
    await page.evaluate(() => {
      [...document.querySelectorAll('.nav-item')].find(e => e.textContent.includes('Dossiers'))?.click();
    });
    await D(1500);
    await page.evaluate(() => {
      const rows = [...document.querySelectorAll('tr, tbody tr, [class*="cursor"]')];
      const row = rows.find(r => r.textContent.includes('Martin') || r.textContent.includes('Marie'));
      if (row) { row.click(); return; }
      // Cliquer sur la première ligne du tableau
      const firstRow = document.querySelector('tbody tr');
      if (firstRow) firstRow.click();
    });
    await D(2500);
  }

  await page.screenshot({ path: 'sc-12-rapport-pro-top.png' });

  // ─────────────────────────────────────────────────────────────
  // 13. VÉRIFICATIONS COMPLÈTES DU RAPPORT PRO
  // ─────────────────────────────────────────────────────────────
  log('\n══ 13. VÉRIFICATIONS RAPPORT PRO ══');

  const rapport = await page.evaluate(() => {
    // Score
    const scoreBig = document.querySelector('[class*="text-7xl"]');
    // Sections
    const h2s = [...document.querySelectorAll('h2[class*="font-black"]')].map(e => e.textContent.trim());
    // Charts
    const hasBar  = !!document.querySelector('.recharts-bar, .recharts-rectangle');
    const hasPie  = !!document.querySelector('.recharts-pie, .recharts-sector');
    const hasLine = !!document.querySelector('.recharts-surface');
    // KPIs
    const kpis = [...document.querySelectorAll('[class*="text-3xl"][class*="font-black"]')].map(e => e.textContent.trim());
    // Actions (partie 5)
    const actionCards = [...document.querySelectorAll('.border-2.border-slate-200.rounded-2xl')];
    const actionTitles = actionCards.map(c => c.querySelector('h3')?.textContent?.trim() || '').filter(Boolean);
    // Tableau postes headers
    const tableHeaders = [...document.querySelectorAll('th[class*="font-bold"]')].map(e => e.textContent.trim());
    // Dashboard pro (no-print, bg-slate-900)
    const dashPro = document.querySelector('.no-print.bg-slate-900, [class*="no-print"][class*="bg-slate-900"]') ||
                    document.querySelector('[class*="Qualification Prospect"]')?.closest('div');
    // CEE badges
    const cee = [...document.querySelectorAll('[class*="text-blue-800"][class*="bg-blue-100"]')].map(e => e.textContent.trim());
    // En-tête données bâtiment
    const printPages = [...document.querySelectorAll('.print-page')];
    const entete = printPages[0]?.textContent?.slice(0,400) || '';
    // Projection table rows
    const projRows = [...document.querySelectorAll('td[class*="font-bold"]')].map(e => e.textContent.trim());
    // LocalStorage
    const ls = JSON.parse(localStorage.getItem('newDiagnosticLatestReport') || '{}');
    // Confidence badge
    const confBadge = document.querySelector('[class*="bg-green-100"][class*="text-green-800"], [class*="confiance"]')?.textContent || '';

    return {
      score: scoreBig?.textContent?.trim(),
      scoreColor: scoreBig?.style?.color || '',
      sections: h2s,
      hasBarChart: hasBar, hasPieChart: hasPie, hasLineChart: hasLine,
      kpis,
      actionTitles,
      tableHeaders,
      hasDashboardPro: !!(dashPro || document.querySelector('[class*="Qualification"]')),
      ceeBadges: cee.slice(0,5),
      entete,
      projRows: projRows.slice(0,10),
      lsId: ls.id, lsVersion: ls.version, lsHasTelephone: !!ls.formData?.telephone,
      confBadge,
    };
  });

  // Checks score
  rapport.score === 'D' ? ok(`Score D ✓`) : fail(`Score "${rapport.score}" ≠ D attendu (ratio 236.8/180=1.32 → D)`);
  (rapport.scoreColor.includes('249,') || rapport.scoreColor.includes('F97'))
    ? ok(`Couleur F97316 (orange) ✓`) : fail(`Couleur score incorrecte: ${rapport.scoreColor}`);

  // Checks sections
  log(`\n   Sections: ${rapport.sections.join(' | ')}`);
  ['Synthèse', 'Positionnement', 'Répartition', 'Actions', 'Projection', 'Impact', 'Financement', 'Intervenants', 'Annexe']
    .forEach(s => rapport.sections.some(t => t.includes(s)) ? ok(`Section "${s}"`) : fail(`Section "${s}" ABSENTE`));
  !rapport.sections.some(t => t.includes('Réglementaire'))
    ? ok('Section 10 Réglementaire absente (380m²<800, objectif=economie) ✓') : warn('Section 10 présente');

  // Checks graphiques
  rapport.hasBarChart ? ok('BarChart Recharts (Partie 3)') : fail('BarChart ABSENT');
  rapport.hasPieChart ? ok('PieChart Recharts (Partie 4)') : fail('PieChart ABSENT');
  rapport.hasLineChart ? ok('LineChart/ComposedChart (Partie 6)') : fail('LineChart ABSENT');

  // Checks KPIs
  log(`\n   KPIs: ${rapport.kpis.join(' | ')}`);
  rapport.kpis.some(k => k.includes('90') || k.includes('000')) ? ok('KPI 90 000 kWh/an ✓') : fail('KPI conso ABSENT');
  rapport.kpis.some(k => /\d{4,}/.test(k)) ? ok('KPI coût annuel présent') : fail('KPI coût ABSENT');
  rapport.kpis.some(k => k.startsWith('-') || k.startsWith('−') || k.startsWith('+')) ? ok('KPI potentiel économies ✓') : warn('KPI économies pas trouvé');

  // Checks actions
  log(`\n   Actions (${rapport.actionTitles.length}): ${rapport.actionTitles.map(a=>a.slice(0,40)).join(' | ')}`);
  (rapport.actionTitles.length >= 3 && rapport.actionTitles.length <= 5)
    ? ok(`${rapport.actionTitles.length} actions (3-5 ✓)`) : fail(`${rapport.actionTitles.length} actions (hors 3-5)`);

  // Checks tableau postes
  log(`\n   Colonnes tableau postes: ${rapport.tableHeaders.join(' | ')}`);
  rapport.tableHeaders.some(h => h.includes('kWh')) ? ok('Colonne kWh/an ✓') : fail('Colonne kWh/an ABSENTE');
  rapport.tableHeaders.some(h => h.includes('€')) ? ok('Colonne €/an ✓') : fail('Colonne €/an ABSENTE');

  // CEE
  rapport.ceeBadges.length > 0 ? ok(`CEE badges: ${rapport.ceeBadges.join(', ')}`) : fail('CEE badges ABSENTS');

  // Dashboard pro
  rapport.hasDashboardPro ? ok('Dashboard qualification pro ✓') : fail('Dashboard pro ABSENT');

  // LocalStorage
  rapport.lsId ? ok(`ID rapport: ${rapport.lsId}`) : fail('ID rapport ABSENT en LS');
  rapport.lsVersion === 'pro-alpha-1' ? ok('Version pro-alpha-1 ✓') : warn(`Version LS: ${rapport.lsVersion}`);
  rapport.lsHasTelephone ? ok('Téléphone dans formData ✓') : warn('Téléphone absent formData');

  // Confiance
  rapport.confBadge ? ok(`Badge confiance: "${rapport.confBadge.slice(0,50)}"`) : warn('Badge confiance non trouvé');

  // En-tête bâtiment
  log(`\n   En-tête (début): ${rapport.entete.slice(0,200)}`);
  rapport.entete.includes('Martin') || rapport.entete.includes('Marie') || rapport.entete.includes('Agence')
    ? ok('Nom bâtiment/contact dans en-tête ✓') : warn('Nom bâtiment absent en-tête');
  rapport.entete.includes('380') ? ok('Surface 380 m² dans en-tête ✓') : warn('Surface 380 absente en-tête');
  rapport.entete.includes('H2') || rapport.entete.includes('Zone') ? ok('Zone climatique dans en-tête ✓') : warn('Zone absente en-tête');

  // Projection rows
  log(`\n   Projection: ${rapport.projRows.join(' | ')}`);
  rapport.projRows.some(r => r.includes('3')) && rapport.projRows.some(r => r.includes('10'))
    ? ok('Tableau projection 3/5/10 ans ✓') : warn('Lignes projection pas toutes trouvées');

  // Screenshots finales
  log('\n══ 14. SCREENSHOTS SECTIONS RAPPORT ══');
  for (const [y, name] of [[0,'entete'],[900,'synthese'],[1800,'benchmark'],[2800,'postes'],[3700,'actions'],[5200,'projection'],[6500,'co2-aides'],[8000,'planning-annexe']]) {
    await page.evaluate(y => window.scrollTo(0, y), y);
    await D(400);
    await page.screenshot({ path: `sc-rapport-${name}.png` });
  }

  // ─────────────────────────────────────────────────────────────
  // RÉSUMÉ
  // ─────────────────────────────────────────────────────────────
  const passed = checks.filter(c => c.ok).length;
  const failed = checks.filter(c => !c.ok).length;
  log(`\n${'═'.repeat(55)}`);
  log(`RÉSULTAT FINAL : ${passed} ✅  |  ${failed} ❌`);
  if (errors.length) { log('\nÉCHECS :'); errors.forEach(e => log(`  ❌ ${e}`)); }
  if (pageErrors.length) { log('\nERREURS JS PAGE :'); pageErrors.slice(0,5).forEach(e => log(`  ⚠️  ${e}`)); }
  log(`${'═'.repeat(55)}`);

  await D(15000);
  await browser.close();
}

run().catch(e => { console.error('FATAL:', e.message); process.exit(1); });
