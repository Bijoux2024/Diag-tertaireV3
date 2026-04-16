// Whitepaper simulations - exécute le moteur pour 8 scénarios sectoriels
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const src = fs.readFileSync(path.join(__dirname, '..', 'src', 'engine.js'), 'utf8');
// const/let -> var pour exposer les globales au sandbox
const transformed = src.replace(/^(\s*)const\s+/gm, '$1var ').replace(/^(\s*)let\s+/gm, '$1var ');
const ctx = { console, Math, Number, parseInt, parseFloat, isNaN, isFinite, Intl, Date, Object, Array, JSON, String, Set };
vm.createContext(ctx);
vm.runInContext(transformed, ctx);

const scenarios = [
  { label: 'Bureau 500 m² tout élec post-2012', fd: { activity: 'offices', surface: '500', elecUsed: true, elecKwh: '100000', gasUsed: false, mainHeating: 'electric_convector', hasCooling: true, ecsSameSystem: false, ecsSystem: 'electric_boiler', worksDone: [], buildingAge: 'post2012', roofType: 'flat', roofAccessible: 'yes', postalCode: '75001' } },
  { label: 'Restaurant 200 m² gaz+élec 1975-2000', fd: { activity: 'restaurant', surface: '200', elecUsed: true, elecKwh: '40000', gasUsed: true, gasKwh: '30000', mainHeating: 'gas', hasCooling: true, ecsSameSystem: false, ecsSystem: 'electric_boiler', worksDone: [], buildingAge: '1975_2000', postalCode: '69001' } },
  { label: 'Commerce alim 1000 m² pre-1975', fd: { activity: 'commerce_alim', surface: '1000', elecUsed: true, elecKwh: '200000', gasUsed: true, gasKwh: '50000', mainHeating: 'gas', hasCooling: true, ecsSameSystem: true, worksDone: [], buildingAge: 'pre1975', roofType: 'flat', postalCode: '33000' } },
  { label: 'Hôtel 720 m² convecteurs 1975-2000', fd: { activity: 'hotel', surface: '720', elecUsed: true, elecKwh: '180000', gasUsed: false, mainHeating: 'electric_convector', hasCooling: true, ecsSameSystem: false, ecsSystem: 'electric_boiler', worksDone: [], buildingAge: '1975_2000', postalCode: '06000' } },
  { label: 'École 800 m² gaz pre-1975', fd: { activity: 'education', surface: '800', elecUsed: true, elecKwh: '40000', gasUsed: true, gasKwh: '100000', mainHeating: 'gas', hasCooling: false, ecsSameSystem: true, worksDone: [], buildingAge: 'pre1975', postalCode: '59000' } },
  { label: 'Cabinet médical 350 m² PAC post-2012', fd: { activity: 'health_local', surface: '350', elecUsed: true, elecKwh: '55000', gasUsed: false, mainHeating: 'electric_pac', pacAge: '5to15', hasCooling: true, ecsSameSystem: false, ecsSystem: 'electric_boiler', worksDone: ['led_done'], buildingAge: 'post2012', postalCode: '44000' } },
  { label: 'Entrepôt léger 2000 m² 2001-2012', fd: { activity: 'light_warehouse', surface: '2000', elecUsed: true, elecKwh: '90000', gasUsed: false, mainHeating: 'electric_convector', hasCooling: false, ecsSameSystem: true, worksDone: [], buildingAge: '2001_2012', roofType: 'pitched', roofOrientation: 'south', postalCode: '13000' } },
  { label: 'Commerce non-alim 400 m² réseau chaleur', fd: { activity: 'retail', surface: '400', elecUsed: true, elecKwh: '45000', networkUsed: true, networkKwh: '60000', mainHeating: 'network', hasCooling: true, ecsSameSystem: true, worksDone: [], buildingAge: '1975_2000', postalCode: '75011' } }
];

const out = [];
for (const s of scenarios) {
  const r = ctx.newDiagnosticBuildReportData(s.fd);
  out.push({
    label: s.label,
    activity: s.fd.activity,
    surface: s.fd.surface,
    intensity: r.calculation_results.intensity_kwh_m2_an.value,
    median: r.benchmark_result.benchmark_median.value,
    position: r.benchmark_result.position,
    total_kwh: r.calculation_results.total_kwh_an.value,
    total_cost_eur: r.calculation_results.total_cost_euro_an.value,
    composite_pct: r.composite_savings.total_pct.value,
    composite_eur: r.composite_savings.annual_euro.value,
    heating_src: r.energy_split.heating_source,
    ecs_src: r.energy_split.ecs_source,
    top_actions: r.top_actions.map(a => ({
      id: a.id,
      name: a.displayName || a.name,
      gain_kwh: a.gain_kwh_an.value,
      gain_eur: a.gain_euro_an.value,
      capex: a.capex.value,
      aid_pct: Math.round((a.aid_pct || 0) * 100),
      aid_eur: a.aid_amount.value,
      capex_net: a.capex_net.value,
      roi: a.roi_years.value,
      tier: a.tier
    })),
    breakdown_pct: r.usage_breakdown.breakdown_pct,
    envelope_opps: r.envelope_opportunities?.applicable ? r.envelope_opportunities.items.map(o => ({ id: o.id, name: o.name, capex: o.capex_estimate.value, gain: o.gain_estimate.value, roi: o.roi_indicatif })) : null,
    warnings: r.warnings.map(w => w.code)
  });
}
console.log(JSON.stringify(out, null, 2));
