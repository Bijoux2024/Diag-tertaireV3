// QA Runner V1.6.1 — charge engine.js en sandbox Node et execute 30 simulations.
// Lecture seule sur engine.js. Aucun patch.
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const enginePath = path.join(__dirname, '..', 'src', 'engine.js');
let engineSrc = fs.readFileSync(enginePath, 'utf8');
// Transforme les declarations top-level (colonne 0) const/let -> var pour exposer globals en sandbox vm
engineSrc = engineSrc.replace(/^(const|let) /gm, 'var ');

const sandbox = { console, Math, Date, JSON, Number, Array, Object, String, isNaN, isFinite, parseFloat, parseInt };
sandbox.window = sandbox;
sandbox.globalThis = sandbox;
vm.createContext(sandbox);
vm.runInContext(engineSrc, sandbox, { filename: 'engine.js' });

const {
  newDiagnosticBuildReportData,
  newDiagnosticSplitByEnergySource,
  newDiagnosticComputeCetSizing,
  newDiagnosticComputePacEauSizing,
  newDiagnosticResolveClimatZone,
  ENGINE_VERSION,
  NEW_DIAGNOSTIC_CET_TIERS,
  NEW_DIAGNOSTIC_PAC_EAU_TIERS
} = sandbox;

// 30 scenarios
const S = [];
function add(name, fd) { S.push({ name, fd }); }

// 1-5 : offices (bureaux) variations
add('Bureau 100m² gaz H2', { activity:'offices', surface:'100', postalCode:'75008', elecUsed:true, elecKwh:'12000', gasUsed:true, gasKwh:'15000', mainHeating:'gas', ecsSameSystem:true, hasCooling:false, worksDone:[], buildingAge:'1975_2000' });
add('Bureau 500m² élec-convecteurs H1', { activity:'offices', surface:'500', postalCode:'67000', elecUsed:true, elecKwh:'100000', gasUsed:false, mainHeating:'electric_convector', ecsSameSystem:true, hasCooling:true, worksDone:[], buildingAge:'post2012' });
add('Bureau 1000m² fioul H1', { activity:'offices', surface:'1000', postalCode:'21000', elecUsed:true, elecKwh:'40000', gasUsed:true, gasKwh:'120000', mainHeating:'fuel', ecsSameSystem:false, ecsSystem:'electric_boiler', hasCooling:false, worksDone:[], buildingAge:'pre1975' });
add('Bureau 5000m² réseau chaleur H2', { activity:'offices', surface:'5000', postalCode:'75012', elecUsed:true, elecKwh:'250000', gasUsed:false, networkUsed:true, networkKwh:'400000', mainHeating:'network', ecsSameSystem:true, hasCooling:true, worksDone:[], buildingAge:'2001_2012' });
add('Bureau 20000m² PAC existante H3', { activity:'offices', surface:'20000', postalCode:'06000', elecUsed:true, elecKwh:'600000', gasUsed:false, mainHeating:'pac', ecsSameSystem:false, ecsSystem:'heat_pump', hasCooling:true, worksDone:['pac_done'], buildingAge:'post2012' });

// 6-10 : restaurant
add('Resto 100m² gaz H2', { activity:'restaurant', surface:'100', postalCode:'75001', elecUsed:true, elecKwh:'30000', gasUsed:true, gasKwh:'35000', mainHeating:'gas', ecsSameSystem:true, hasCooling:true, worksDone:[], buildingAge:'1975_2000' });
add('Resto 200m² gaz+ECS elec H1', { activity:'restaurant', surface:'200', postalCode:'69000', elecUsed:true, elecKwh:'40000', gasUsed:true, gasKwh:'30000', mainHeating:'gas', hasCooling:true, ecsSameSystem:false, ecsSystem:'electric_boiler', worksDone:[], buildingAge:'1975_2000' });
add('Resto 500m² fioul H3', { activity:'restaurant', surface:'500', postalCode:'13000', elecUsed:true, elecKwh:'80000', gasUsed:true, gasKwh:'100000', mainHeating:'fuel', ecsSameSystem:true, hasCooling:true, worksDone:[], buildingAge:'pre1975' });
add('Resto 1000m² élec convecteurs H2', { activity:'restaurant', surface:'1000', postalCode:'44000', elecUsed:true, elecKwh:'250000', gasUsed:false, mainHeating:'electric_convector', ecsSameSystem:false, ecsSystem:'electric_boiler', hasCooling:true, worksDone:[], buildingAge:'2001_2012' });
add('Resto 5000m² gaz H1 grand volume', { activity:'restaurant', surface:'5000', postalCode:'88000', elecUsed:true, elecKwh:'400000', gasUsed:true, gasKwh:'900000', mainHeating:'gas', ecsSameSystem:true, hasCooling:true, worksDone:[], buildingAge:'pre1975' });

// 11-14 : commerce alim / non alim
add('Commerce alim 1000m² gaz H2', { activity:'commerce_alim', surface:'1000', postalCode:'33000', elecUsed:true, elecKwh:'200000', gasUsed:true, gasKwh:'50000', mainHeating:'gas', ecsSameSystem:true, hasCooling:true, worksDone:[], buildingAge:'pre1975' });
add('Commerce alim 5000m² réseau H1', { activity:'commerce_alim', surface:'5000', postalCode:'57000', elecUsed:true, elecKwh:'900000', networkUsed:true, networkKwh:'250000', mainHeating:'network', ecsSameSystem:true, hasCooling:true, worksDone:[], buildingAge:'1975_2000' });
add('Commerce nonalim 500m² convecteurs H3', { activity:'commerce_nonalim', surface:'500', postalCode:'34000', elecUsed:true, elecKwh:'80000', gasUsed:false, mainHeating:'electric_convector', ecsSameSystem:true, hasCooling:true, worksDone:[], buildingAge:'2001_2012' });
add('Commerce nonalim 100m² gaz H1', { activity:'commerce_nonalim', surface:'100', postalCode:'54000', elecUsed:true, elecKwh:'8000', gasUsed:true, gasKwh:'12000', mainHeating:'gas', ecsSameSystem:true, hasCooling:false, worksDone:[], buildingAge:'1975_2000' });

// 15-18 : hotel
add('Hôtel 200m² gaz H2', { activity:'hotel', surface:'200', postalCode:'44000', elecUsed:true, elecKwh:'35000', gasUsed:true, gasKwh:'70000', mainHeating:'gas', ecsSameSystem:true, hasCooling:true, worksDone:[], buildingAge:'1975_2000' });
add('Hôtel 720m² convecteurs + ECS élec H1', { activity:'hotel', surface:'720', postalCode:'67000', elecUsed:true, elecKwh:'180000', gasUsed:false, mainHeating:'electric_convector', ecsSameSystem:false, ecsSystem:'electric_boiler', hasCooling:true, worksDone:[], buildingAge:'1975_2000' });
add('Hôtel 1000m² fioul H1 ancien', { activity:'hotel', surface:'1000', postalCode:'25000', elecUsed:true, elecKwh:'120000', gasUsed:true, gasKwh:'280000', mainHeating:'fuel', ecsSameSystem:true, hasCooling:true, worksDone:[], buildingAge:'pre1975' });
add('Hôtel 5000m² gaz H3 plafond CET', { activity:'hotel', surface:'5000', postalCode:'06000', elecUsed:true, elecKwh:'400000', gasUsed:true, gasKwh:'2000000', mainHeating:'gas', ecsSameSystem:true, hasCooling:true, worksDone:[], buildingAge:'1975_2000' });

// 19-21 : sport / santé / école
add('Sport 1000m² gaz H2 (piscine-like ECS forte)', { activity:'sport', surface:'1000', postalCode:'75014', elecUsed:true, elecKwh:'150000', gasUsed:true, gasKwh:'350000', mainHeating:'gas', ecsSameSystem:true, hasCooling:false, worksDone:[], buildingAge:'1975_2000' });
add('Santé 5000m² réseau H1', { activity:'health', surface:'5000', postalCode:'68000', elecUsed:true, elecKwh:'500000', networkUsed:true, networkKwh:'800000', mainHeating:'network', ecsSameSystem:true, hasCooling:true, worksDone:[], buildingAge:'2001_2012' });
add('École 500m² fioul H1', { activity:'school', surface:'500', postalCode:'90000', elecUsed:true, elecKwh:'25000', gasUsed:true, gasKwh:'90000', mainHeating:'fuel', ecsSameSystem:false, ecsSystem:'electric_boiler', hasCooling:false, worksDone:[], buildingAge:'pre1975' });

// 22 : logistique — engine n'a pas forcément cette clé, on mappe sur commerce_nonalim
add('Logistique 20000m² gaz H2 (fallback commerce_nonalim)', { activity:'commerce_nonalim', surface:'20000', postalCode:'45000', elecUsed:true, elecKwh:'1200000', gasUsed:true, gasKwh:'2000000', mainHeating:'gas', ecsSameSystem:true, hasCooling:false, worksDone:[], buildingAge:'1975_2000' });

// 23-25 : cas limites
add('Limite très petit bureau 100m² seul élec H2', { activity:'offices', surface:'100', postalCode:'44000', elecUsed:true, elecKwh:'4000', gasUsed:false, mainHeating:'electric_convector', ecsSameSystem:true, hasCooling:false, worksDone:[], buildingAge:'post2012' });
add('Limite plafond : Hôtel 20000m² gaz H1 (>2000L / >200kW)', { activity:'hotel', surface:'20000', postalCode:'67000', elecUsed:true, elecKwh:'800000', gasUsed:true, gasKwh:'8000000', mainHeating:'gas', ecsSameSystem:true, hasCooling:true, worksDone:[], buildingAge:'pre1975' });
add('Limite ECS absente : bureau 1000m² PAC solaire ECS', { activity:'offices', surface:'1000', postalCode:'75008', elecUsed:true, elecKwh:'60000', gasUsed:false, mainHeating:'pac', ecsSameSystem:false, ecsSystem:'solar', hasCooling:true, worksDone:[], buildingAge:'post2012' });

// 26-28 : zone H3
add('H3 Bureau 1000m² gaz Marseille', { activity:'offices', surface:'1000', postalCode:'13008', elecUsed:true, elecKwh:'70000', gasUsed:true, gasKwh:'80000', mainHeating:'gas', ecsSameSystem:true, hasCooling:true, worksDone:[], buildingAge:'1975_2000' });
add('H3 Commerce alim 500m² fioul Nîmes', { activity:'commerce_alim', surface:'500', postalCode:'30000', elecUsed:true, elecKwh:'90000', gasUsed:true, gasKwh:'40000', mainHeating:'fuel', ecsSameSystem:true, hasCooling:true, worksDone:[], buildingAge:'1975_2000' });
add('H3 Hôtel 200m² élec Corse', { activity:'hotel', surface:'200', postalCode:'20000', elecUsed:true, elecKwh:'50000', gasUsed:false, mainHeating:'electric_convector', ecsSameSystem:false, ecsSystem:'electric_boiler', hasCooling:true, worksDone:[], buildingAge:'2001_2012' });

// 29-30 : récents travaux / PAC déjà installée
add('Chaudière récente → ACT13 doit être exclu', { activity:'offices', surface:'500', postalCode:'44000', elecUsed:true, elecKwh:'30000', gasUsed:true, gasKwh:'50000', mainHeating:'gas', ecsSameSystem:true, hasCooling:false, worksDone:['boiler_recent'], buildingAge:'2001_2012' });
add('PAC déjà installée → ACT13 exclu', { activity:'hotel', surface:'1000', postalCode:'75000', elecUsed:true, elecKwh:'200000', gasUsed:false, mainHeating:'pac', ecsSameSystem:false, ecsSystem:'heat_pump', hasCooling:true, worksDone:['pac_done'], buildingAge:'post2012' });

// Execute
const results = [];
for (let i = 0; i < S.length; i++) {
  const { name, fd } = S[i];
  const row = { i: i + 1, name, fd, errors: [], warnings: [] };
  try {
    const rpt = newDiagnosticBuildReportData(fd);
    row.engine_version = rpt.engine_version;
    row.intensity = rpt.calculation_results.intensity_kwh_m2_an.value;
    row.total_kwh = rpt.calculation_results.total_kwh_an.value;
    row.totalEuro = rpt.calculation_results.total_cost_euro_an.value;
    row.actions_count = rpt.top_actions.length;
    row.actionIds = rpt.top_actions.map(a => a.id);
    const bk = rpt.usage_breakdown.breakdown_pct;
    row.breakdown_total = (bk.heating_pct||0)+(bk.cooling_pct||0)+(bk.vent_aux_pct||0)+(bk.lighting_pct||0)+(bk.dhw_pct||0)+(bk.cooking_pct||0)+(bk.other_specific_pct||0);

    // ACT13 in actions (after filter L2071 — ACT13 reste autorisé, seul ACT18/20 filtrés)
    const a13 = rpt.top_actions.find(a => a.id === 'ACT13');
    if (a13) {
      row.act13 = { capex: a13.capex.value, gainKwh: a13.gain_kwh_an.value, gainEuro: a13.gain_euro_an.value };
    }

    // ACT18 : compute internal sizing (pre-filter)
    const split = newDiagnosticSplitByEnergySource(fd, parseFloat(fd.elecKwh)||0, fd.mainHeating==='network' ? (parseFloat(fd.networkKwh)||0) : (parseFloat(fd.gasKwh)||0), fd.activity);
    const cet = newDiagnosticComputeCetSizing(fd, split.breakdown_pct);
    if (cet && cet.needsStudy) {
      row.act18_internal = { needsStudy: true, V_L_raw: cet.V_L_raw, climat_zone: cet.climat_zone, besoin_kwh: cet.besoin_utile_kwh, source_ecs: cet.source_ecs };
    } else if (cet) {
      row.act18_internal = { volumeL: cet.volumeL, volumeLraw: cet.volumeLraw, capex: cet.capex, capex_range: cet.capex_range, climat_zone: cet.climat_zone, besoin_kwh: cet.besoin_utile_kwh, source_ecs: cet.source_ecs };
    } else {
      row.act18_internal = null;
    }
    const pac = newDiagnosticComputePacEauSizing(fd, split.breakdown_pct);
    if (pac) {
      row.pac_sizing = { kW: pac.puissanceKw, kWraw: pac.puissanceKwRaw, capex: pac.capex, climat_zone: pac.climat_zone, besoin_kwh: pac.besoin_utile_kwh, source_chauffage: pac.source_chauffage };
    }

    // Checks
    const check = (cond, msg) => { if (!cond) row.errors.push(msg); };
    const warn = (cond, msg) => { if (!cond) row.warnings.push(msg); };

    check(!isNaN(row.intensity) && isFinite(row.intensity), 'intensity NaN/Inf');
    check(!isNaN(row.totalEuro) && isFinite(row.totalEuro), 'totalEuro NaN/Inf');
    check(Math.abs(row.breakdown_total - 100) < 2, `breakdown_total=${row.breakdown_total}%`);
    check(row.intensity > 0 || row.total_kwh === 0, 'intensity==0 malgré conso>0');
    check(row.engine_version === '1.6.1', `engine_version=${row.engine_version}`); // cible V1.6.1
    warn(row.engine_version === '1.6.1', `[V1.6.1-GAP] engine_version=${row.engine_version} attendu 1.6.1`);

    // V1.6.1 : ACT18 reintroduit dans top_actions (BUG-002). Sa visibilite finale
    // depend desormais des memes filtres ROI/gainEuro que les autres actions :
    // plus de warning V1.6.1-GAP systematique sur son absence.

    // V1.6.1 : ACT13 capex tier check (nouvelle grille consortium)
    if (a13) {
      const validTiers = [15000, 28000, 62000, 120000, 230000];
      check(validTiers.includes(a13.capex.value), `ACT13 capex hors tiers: ${a13.capex.value}`);
    }
    // V1.6.1 : ACT18 internal capex check (plafond 2000 L, tier 5000 L supprime)
    if (row.act18_internal && !row.act18_internal.needsStudy) {
      const validCet = [4600, 5800, 9200, 17500, 34000];
      check(validCet.includes(row.act18_internal.capex), `ACT18 capex hors tiers: ${row.act18_internal.capex}`);
    }

  } catch (e) {
    row.crash = e.message;
    row.errors.push('CRASH: ' + e.message);
  }
  results.push(row);
}

fs.writeFileSync(path.join(__dirname, 'qa-results.json'), JSON.stringify(results, null, 2));
console.log(`OK: ${results.length} scenarios executés. Engine: ${ENGINE_VERSION}`);
console.log(`PAC tiers: ${JSON.stringify(NEW_DIAGNOSTIC_PAC_EAU_TIERS)}`);
console.log(`CET tiers: ${JSON.stringify(NEW_DIAGNOSTIC_CET_TIERS)}`);
const pass = results.filter(r => r.errors.length === 0).length;
console.log(`PASS: ${pass}/${results.length}`);
