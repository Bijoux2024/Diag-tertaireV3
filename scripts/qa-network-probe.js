// Probe ciblée BUG-007 : réseau de chaleur + variations ECS.
// Confirme que l'ECS est perdue quand mainHeating=network et ecsSameSystem=true.
const fs = require('fs');
const path = require('path');
const vm = require('vm');

let engineSrc = fs.readFileSync(path.join(__dirname, '..', 'src', 'engine.js'), 'utf8');
engineSrc = engineSrc.replace(/^(const|let) /gm, 'var ');
const sandbox = { console, Math, Date, JSON, Number, Array, Object, String, isNaN, isFinite, parseFloat, parseInt };
sandbox.window = sandbox; sandbox.globalThis = sandbox;
vm.createContext(sandbox);
vm.runInContext(engineSrc, sandbox, { filename: 'engine.js' });

const { newDiagnosticBuildReportData, newDiagnosticSplitByEnergySource, newDiagnosticComputeCetSizing, newDiagnosticResolveEcsSource } = sandbox;

const P = [
  { name: 'N1 — Network + ECS same system (gaz implicite via network)', fd: { activity:'offices', surface:'1000', postalCode:'75012', elecUsed:true, elecKwh:'50000', gasUsed:false, networkUsed:true, networkKwh:'400000', mainHeating:'network', ecsSameSystem:true, buildingAge:'2001_2012' } },
  { name: 'N2 — Network + ECS séparée ballon élec', fd: { activity:'offices', surface:'1000', postalCode:'75012', elecUsed:true, elecKwh:'60000', gasUsed:false, networkUsed:true, networkKwh:'400000', mainHeating:'network', ecsSameSystem:false, ecsSystem:'electric_boiler', buildingAge:'2001_2012' } },
  { name: 'N3 — Network + ECS séparée chaudière gaz (gasUsed=true)', fd: { activity:'hotel', surface:'500', postalCode:'67000', elecUsed:true, elecKwh:'40000', gasUsed:true, gasKwh:'50000', networkUsed:true, networkKwh:'200000', mainHeating:'network', ecsSameSystem:false, ecsSystem:'gas_boiler', buildingAge:'1975_2000' } },
  { name: 'N4 — Network + ECS network_dedicated (source=gas mais gasKwh=0)', fd: { activity:'hotel', surface:'2000', postalCode:'57000', elecUsed:true, elecKwh:'100000', gasUsed:false, networkUsed:true, networkKwh:'600000', mainHeating:'network', ecsSameSystem:false, ecsSystem:'network_dedicated', buildingAge:'1975_2000' } }
];

for (const p of P) {
  const rpt = newDiagnosticBuildReportData(p.fd);
  const split = newDiagnosticSplitByEnergySource(p.fd, parseFloat(p.fd.elecKwh)||0, parseFloat(p.fd.networkKwh)||0, p.fd.activity);
  const ecs = newDiagnosticResolveEcsSource(p.fd);
  const cet = newDiagnosticComputeCetSizing(p.fd, split.breakdown_pct);
  console.log('\n=== ' + p.name + ' ===');
  console.log('ecsSource resolved :', ecs);
  console.log('dhw_pct split      :', split.breakdown_pct.dhw_pct + '%', '(dhw_kwh=' + split.posts.ecs.kwh + ')');
  console.log('CET sizing         :', cet ? `V=${cet.volumeL}L capex=${cet.capex}€ besoin=${cet.besoin_utile_kwh}kWh source=${cet.source_ecs} zone=${cet.climat_zone}` : 'null (ECS perdue)');
  console.log('actions            :', rpt.top_actions.map(a=>a.id).join(','));
}
