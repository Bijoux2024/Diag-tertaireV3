/**
 * Simulation 30 scenarios - DiagTertiaire Engine v1.5.0
 * Usage: node scripts/simulate30.js
 * Sortie : ./simulation-output/rapport-synthese.md + rapport-detail.xlsx
 */

'use strict';

const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

// ─── Chargement moteur ────────────────────────────────────────────────────────
// Le moteur utilise const (block-scoped) - on l'enveloppe dans un module temporaire
const os = require('os');
const engineCode = fs.readFileSync(path.join(__dirname, '../src/engine.js'), 'utf8');
const exportLine = `\nmodule.exports = { newDiagnosticBuildReportData, NEW_DIAGNOSTIC_BENCHMARKS_INTENSITY, CARBON_FACTORS_KG_CO2_PER_KWH, NEW_DIAGNOSTIC_ENERGY_PRICES, ENGINE_VERSION, ENGINE_LAST_UPDATED, INFLATION_ENERGIE };`;
const tmpPath = path.join(os.tmpdir(), `engine_sim_${Date.now()}.cjs`);
fs.writeFileSync(tmpPath, engineCode + exportLine, 'utf8');
let engineModule;
try { engineModule = require(tmpPath); } finally { try { fs.unlinkSync(tmpPath); } catch(e) {} }

const newDiagnosticBuildReportData = engineModule.newDiagnosticBuildReportData;
const BENCHMARKS = engineModule.NEW_DIAGNOSTIC_BENCHMARKS_INTENSITY;
const CARBON = engineModule.CARBON_FACTORS_KG_CO2_PER_KWH;
const E_PRICES = engineModule.NEW_DIAGNOSTIC_ENERGY_PRICES;

if (!newDiagnosticBuildReportData) throw new Error('Moteur non charge');
console.log('[OK] Moteur charge - ENGINE_VERSION:', engineModule.ENGINE_VERSION);

// ─── Helpers ──────────────────────────────────────────────────────────────────
const deriveScore = (intensity, bench) => {
    if (!bench || bench.median_kwh_m2_an === 0) return 'N/A';
    const r = intensity / bench.median_kwh_m2_an;
    if (r < 0.60) return 'A';
    if (r < 0.90) return 'B';
    if (r < 1.20) return 'C';
    if (r < 1.70) return 'D';
    return 'E';
};

const computeCO2 = (elecKwh, gasKwh, mainHeating) => {
    const elecCO2 = elecKwh * CARBON.electricite;
    let heatCO2 = 0;
    if (mainHeating === 'fuel') heatCO2 = gasKwh * CARBON.fioul;
    else if (mainHeating === 'network') heatCO2 = gasKwh * CARBON.reseau_chaleur;
    else heatCO2 = gasKwh * CARBON.gaz;
    return Math.round(elecCO2 + heatCO2);
};

const computeCO2Savings = (actions, mainHeating) => {
    // actions = payload format (top_actions), utilise gain_kwh_an.value
    let saved = 0;
    for (const a of actions) {
        const gainKwh = a.gain_kwh_an?.value || 0;
        let factor;
        if (a.id === 'ACT22') {
            factor = CARBON.electricite; // PV compense elec
        } else if (a.id === 'ACT13') {
            // PAC: remplace gaz par elec. CO2 net = gainKwh * facteur melange approx.
            // gainKwh net = gaz supprime - elec ajoute. Sur le gaz supprime CO2 = 0.227, sur elec ajoute = 0.079/3.5
            // Simplifie: facteur reduit (~0.15 gaz net, 0.22 fioul net)
            factor = mainHeating === 'fuel' ? CARBON.fioul * 0.65 : CARBON.gaz * 0.65;
        } else if (['heating', 'dhw', 'envelope_roof', 'envelope_walls', 'envelope_windows'].includes(a.category)) {
            if (mainHeating === 'fuel') factor = CARBON.fioul;
            else if (mainHeating === 'network') factor = CARBON.reseau_chaleur;
            else if (mainHeating === 'gas') factor = CARBON.gaz;
            else factor = CARBON.electricite;
        } else {
            factor = CARBON.electricite; // eclairage, ventil, clim, pilotage
        }
        saved += gainKwh * factor;
    }
    return Math.round(saved);
};

const detectAnomalies = (scenario, result, formData) => {
    const issues = [];
    if (!result || result.error) return [{ severity: 'CRITIQUE', msg: `Erreur moteur: ${result?.error}` }];
    const r = result;
    const intensity = r.calculation_results?.intensity_kwh_m2_an?.value;
    const totalKwh = r.calculation_results?.total_kwh_an?.value;
    const benchMedian = r.benchmark_result?.benchmark_median?.value;
    const score = deriveScore(intensity, { median_kwh_m2_an: benchMedian });
    const totalCost = r.calculation_results?.total_cost_euro_an?.value;

    // NaN/Infinity
    const str = JSON.stringify(r);
    if (str.includes('"NaN"') || str.includes(':NaN')) issues.push({ severity: 'CRITIQUE', msg: 'NaN detecte dans le payload' });
    if (str.includes('Infinity')) issues.push({ severity: 'CRITIQUE', msg: 'Infinity detecte dans le payload' });

    // Cost = 0 avec kWh > 0
    if (totalKwh > 0 && totalCost === 0) issues.push({ severity: 'CRITIQUE', msg: `Cout annuel = 0 mais totalKwh = ${totalKwh}` });

    // Breakdown sum
    const bp = r.usage_breakdown?.breakdown_pct;
    if (bp) {
        const sum = (bp.heating_pct||0)+(bp.cooling_pct||0)+(bp.vent_aux_pct||0)+(bp.lighting_pct||0)+(bp.dhw_pct||0)+(bp.cooking_pct||0)+(bp.other_specific_pct||0);
        if (Math.abs(sum - 100) > 1) issues.push({ severity: 'CRITIQUE', msg: `Breakdown = ${sum}% (attendu 100)` });
    }

    // Score incoh. intensite
    if (intensity < 50 && ['D','E'].includes(score)) issues.push({ severity: 'WARNING', msg: `Intensite faible (${intensity}) mais score ${score}` });
    if (intensity > 400 && ['A','B'].includes(score)) issues.push({ severity: 'WARNING', msg: `Intensite elevee (${intensity}) mais score ${score}` });

    // ROI
    for (const a of (r.top_actions||[])) {
        if (a.roi_years?.value !== null && a.roi_years?.value > 50) issues.push({ severity: 'WARNING', msg: `Action ${a.id}: ROI = ${a.roi_years?.value} ans (> 50)` });
        if (a.roi_years?.value !== null && a.roi_years?.value < 0) issues.push({ severity: 'CRITIQUE', msg: `Action ${a.id}: ROI negatif (${a.roi_years?.value})` });
        if ((a.capex?.value || 0) === 0 && ['ACT13','ACT15','ACT16','ACT17'].includes(a.id)) issues.push({ severity: 'WARNING', msg: `Action ${a.id}: CAPEX = 0` });
    }

    // PV sur toiture none
    const hasActPV = (r.top_actions||[]).some(a => a.id === 'ACT22');
    if (hasActPV && formData.roofType === 'none') issues.push({ severity: 'CRITIQUE', msg: 'ACT22 (PV) recommande sur toiture=none' });

    // PAC malgre pac_done
    const hasActPAC = (r.top_actions||[]).some(a => a.id === 'ACT13');
    if (hasActPAC && (formData.worksDone||[]).includes('pac_done')) issues.push({ severity: 'CRITIQUE', msg: 'ACT13 (PAC) recommande malgre pac_done' });

    return issues;
};

// ─── Parametres communs ───────────────────────────────────────────────────────
const BASE = {
    postalCode: '75001',
    role: 'owner',
    roofType: 'flat',
    roofOrientation: '',
    roofInsulation: 'unknown',
    wallInsulation: 'unknown',
    hasVmc: false,
    vmcType: '',
    hasGtb: false,
    ceilingHeight: '',
    ecsSameSystem: true,
    ecsSystem: '',
    boilerAge: '5to15',
    elecIncludesSubscription: false,
    gasIncludesSubscription: false,
    worksDone: [],
    projectObjective: 'reduce_costs',
    decisionHorizon: 'immediate',
    budgetRange: '20to80k',
    isDecisionMaker: 'yes',
    contactOptIn: false,
    firstName: 'Simulation',
    email: 'sim@test.fr',
    phone: '',
    company: '',
    opt_in_politique: true
};

// ─── 30 Scenarios ─────────────────────────────────────────────────────────────
const SCENARIOS = [
    // ── Bloc A : Variation par activite ──────────────────────────────────────
    {
        id: 'S01', nom: 'Bureau standard Paris',
        formData: { ...BASE, postalCode:'75001', activity:'offices', surface:'350', mainHeating:'gas', hasCooling:true, buildingAge:'2001_2012',
            elecUsed:true, elecKwh:'28000', gasUsed:true, gasKwh:'42000' }
    },
    {
        id: 'S02', nom: 'Commerce retail Lyon',
        formData: { ...BASE, postalCode:'69001', activity:'retail', surface:'200', mainHeating:'electric', hasCooling:false, buildingAge:'1975_2000',
            roofType:'pitched', roofOrientation:'south',
            elecUsed:true, elecKwh:'52000', gasUsed:false, gasKwh:'' }
    },
    {
        id: 'S03', nom: 'Hotel 3 etoiles Nice',
        formData: { ...BASE, postalCode:'06000', activity:'hotel', surface:'1200', mainHeating:'gas', hasCooling:true, buildingAge:'1975_2000',
            elecUsed:true, elecKwh:'95000', gasUsed:true, gasKwh:'180000' }
    },
    {
        id: 'S04', nom: 'Restaurant Toulouse',
        formData: { ...BASE, postalCode:'31000', activity:'restaurant', surface:'120', mainHeating:'gas', hasCooling:false, buildingAge:'pre1975',
            roofType:'pitched', roofOrientation:'west',
            elecUsed:true, elecKwh:'38000', gasUsed:true, gasKwh:'55000' }
    },
    {
        id: 'S05', nom: 'Commerce alimentaire Lille',
        formData: { ...BASE, postalCode:'59000', activity:'commerce_alim', surface:'400', mainHeating:'electric', hasCooling:true, buildingAge:'2001_2012',
            elecUsed:true, elecKwh:'130000', gasUsed:false, gasKwh:'' }
    },
    {
        id: 'S06', nom: 'Cabinet medical Bordeaux',
        formData: { ...BASE, postalCode:'33000', activity:'health_local', surface:'90', mainHeating:'electric', hasCooling:true, buildingAge:'post2012',
            roofType:'pitched', roofOrientation:'south',
            elecUsed:true, elecKwh:'14000', gasUsed:false, gasKwh:'' }
    },
    {
        id: 'S07', nom: 'Ecole primaire Nantes',
        formData: { ...BASE, postalCode:'44000', activity:'education', surface:'800', mainHeating:'gas', hasCooling:false, buildingAge:'1975_2000',
            roofType:'pitched', roofOrientation:'',
            elecUsed:true, elecKwh:'35000', gasUsed:true, gasKwh:'65000' }
    },
    {
        id: 'S08', nom: 'Entrepot logistique Marseille',
        formData: { ...BASE, postalCode:'13001', activity:'light_warehouse', surface:'2500', mainHeating:'gas', hasCooling:false, buildingAge:'1975_2000',
            elecUsed:true, elecKwh:'25000', gasUsed:true, gasKwh:'80000' }
    },
    // ── Bloc B : Variation par systeme de chauffage ───────────────────────────
    {
        id: 'S09', nom: 'Bureau tout electrique (convecteurs)',
        formData: { ...BASE, postalCode:'75001', activity:'offices', surface:'300', mainHeating:'electric', hasCooling:false, buildingAge:'2001_2012',
            elecUsed:true, elecKwh:'55000', gasUsed:false, gasKwh:'' }
    },
    {
        id: 'S10', nom: 'Bureau gaz + ECS electrique separee',
        formData: { ...BASE, postalCode:'75001', activity:'offices', surface:'300', mainHeating:'gas', hasCooling:false, buildingAge:'1975_2000',
            ecsSameSystem:false, ecsSystem:'electric_boiler',
            elecUsed:true, elecKwh:'20000', gasUsed:true, gasKwh:'45000' }
    },
    {
        id: 'S11', nom: 'Bureau fioul (mainHeating=fuel)',
        // Le fioul est renseigne comme "gaz" car le moteur n'a pas de champ fioul separe
        // mainHeating='fuel' informe le moteur pour le prix et le CO2
        formData: { ...BASE, postalCode:'75001', activity:'offices', surface:'300', mainHeating:'fuel', hasCooling:false, buildingAge:'pre1975',
            boilerAge:'over20',
            elecUsed:true, elecKwh:'15000', gasUsed:true, gasKwh:'60000' }
    },
    {
        id: 'S12', nom: 'Bureau reseau chaleur (mainHeating=network)',
        // Le reseau est renseigne comme "gaz" (seul champ thermique disponible)
        // mainHeating='network' informe le moteur pour le prix (0.095 EUR/kWh)
        formData: { ...BASE, postalCode:'75001', activity:'offices', surface:'300', mainHeating:'network', hasCooling:false, buildingAge:'2001_2012',
            // Note : sans kWh reseau declares, le moteur estime le chauffage via % global
            elecUsed:true, elecKwh:'20000', gasUsed:false, gasKwh:'' }
    },
    {
        id: 'S13', nom: 'Bureau PAC deja installee',
        formData: { ...BASE, postalCode:'75001', activity:'offices', surface:'300', mainHeating:'electric', hasCooling:true, buildingAge:'post2012',
            worksDone:['pac_done'],
            elecUsed:true, elecKwh:'25000', gasUsed:false, gasKwh:'' }
    },
    {
        id: 'S14', nom: 'Bureau gaz chaudiere > 20 ans',
        formData: { ...BASE, postalCode:'75001', activity:'offices', surface:'300', mainHeating:'gas', hasCooling:false, buildingAge:'pre1975',
            boilerAge:'over20',
            elecUsed:true, elecKwh:'18000', gasUsed:true, gasKwh:'60000' }
    },
    // ── Bloc C : Variation par surface et age ─────────────────────────────────
    {
        id: 'S15', nom: 'Micro-bureau recent (50m2)',
        formData: { ...BASE, postalCode:'75001', activity:'offices', surface:'50', mainHeating:'gas', hasCooling:false, buildingAge:'post2012',
            elecUsed:true, elecKwh:'5000', gasUsed:true, gasKwh:'3000' }
    },
    {
        id: 'S16', nom: 'Bureau ancien enorme (5000m2 pre-1975)',
        formData: { ...BASE, postalCode:'75001', activity:'offices', surface:'5000', mainHeating:'gas', hasCooling:false, buildingAge:'pre1975',
            boilerAge:'over20',
            elecUsed:true, elecKwh:'400000', gasUsed:true, gasKwh:'600000' }
    },
    {
        id: 'S17', nom: 'Bureau annees 80 moyen (500m2)',
        formData: { ...BASE, postalCode:'75001', activity:'offices', surface:'500', mainHeating:'gas', hasCooling:false, buildingAge:'1975_2000',
            elecUsed:true, elecKwh:'45000', gasUsed:true, gasKwh:'70000' }
    },
    {
        id: 'S18', nom: 'Bureau RT2005 (800m2)',
        formData: { ...BASE, postalCode:'75001', activity:'offices', surface:'800', mainHeating:'gas', hasCooling:false, buildingAge:'2001_2012',
            elecUsed:true, elecKwh:'50000', gasUsed:true, gasKwh:'40000' }
    },
    {
        id: 'S19', nom: 'Bureau RT2012+ tres performant (300m2)',
        formData: { ...BASE, postalCode:'75001', activity:'offices', surface:'300', mainHeating:'gas', hasCooling:false, buildingAge:'post2012',
            elecUsed:true, elecKwh:'20000', gasUsed:true, gasKwh:'10000' }
    },
    // ── Bloc D : Variation toiture / PV ───────────────────────────────────────
    {
        id: 'S20', nom: 'Bureau toiture plate (PV coeff 0.85)',
        formData: { ...BASE, postalCode:'75001', activity:'offices', surface:'400', mainHeating:'gas', hasCooling:true, buildingAge:'2001_2012',
            roofType:'flat', roofOrientation:'',
            elecUsed:true, elecKwh:'30000', gasUsed:true, gasKwh:'45000' }
    },
    {
        id: 'S21', nom: 'Bureau toiture sud optimale (PV coeff 1.00)',
        formData: { ...BASE, postalCode:'75001', activity:'offices', surface:'400', mainHeating:'gas', hasCooling:true, buildingAge:'2001_2012',
            roofType:'pitched', roofOrientation:'south',
            elecUsed:true, elecKwh:'30000', gasUsed:true, gasKwh:'45000' }
    },
    {
        id: 'S22', nom: 'Bureau toiture nord degradee (PV coeff 0.55)',
        formData: { ...BASE, postalCode:'75001', activity:'offices', surface:'400', mainHeating:'gas', hasCooling:true, buildingAge:'2001_2012',
            roofType:'pitched', roofOrientation:'north',
            elecUsed:true, elecKwh:'30000', gasUsed:true, gasKwh:'45000' }
    },
    {
        id: 'S23', nom: 'Bureau sans toiture (aucun PV)',
        formData: { ...BASE, postalCode:'75001', activity:'offices', surface:'400', mainHeating:'gas', hasCooling:true, buildingAge:'2001_2012',
            roofType:'none', roofOrientation:'',
            elecUsed:true, elecKwh:'30000', gasUsed:true, gasKwh:'45000' }
    },
    // ── Bloc E : Cas limites ──────────────────────────────────────────────────
    {
        id: 'S24', nom: 'Usage mixte 60/40 bureau-commerce (500m2)',
        formData: { ...BASE, postalCode:'75001', activity:'mixed', mixedUsage1:'offices', mixedUsage2:'retail',
            mixOfficesPct:60, mixRetailPct:40,
            surface:'500', mainHeating:'gas', hasCooling:true, buildingAge:'2001_2012',
            elecUsed:true, elecKwh:'40000', gasUsed:true, gasKwh:'50000' }
    },
    {
        id: 'S25', nom: 'Saisie en euros uniquement (sans kWh)',
        formData: { ...BASE, postalCode:'75001', activity:'offices', surface:'300', mainHeating:'gas', hasCooling:false, buildingAge:'2001_2012',
            elecUsed:true, elecKwh:'', elecEuro:'8500',
            gasUsed:true, gasKwh:'', gasEuro:'6200' }
    },
    {
        id: 'S26', nom: 'Aucune conso saisie (elec=false, gaz=false)',
        formData: { ...BASE, postalCode:'75001', activity:'offices', surface:'300', mainHeating:'gas', hasCooling:false, buildingAge:'2001_2012',
            elecUsed:false, elecKwh:'', elecEuro:'',
            gasUsed:false, gasKwh:'', gasEuro:'' }
    },
    {
        id: 'S27', nom: 'Tous travaux deja realises (0 action attendue)',
        formData: { ...BASE, postalCode:'75001', activity:'offices', surface:'400', mainHeating:'gas', hasCooling:true, buildingAge:'2001_2012',
            elecUsed:true, elecKwh:'30000', gasUsed:true, gasKwh:'50000',
            worksDone:['led_done','regulation_done','pac_done','boiler_recent','roof_done','walls_done','windows_done','gtb_done','dhw_done','vmc_df_done'],
            hasGtb:true, roofInsulation:'yes', wallInsulation:'yes' }
    },
    // ── Bloc F : Scenarios metier realistes ───────────────────────────────────
    {
        id: 'S28', nom: 'Restaurant gastronomique ancien (250m2)',
        formData: { ...BASE, postalCode:'31000', activity:'restaurant', surface:'250', mainHeating:'gas', hasCooling:true, buildingAge:'pre1975',
            roofType:'pitched', roofOrientation:'east',
            ecsSameSystem:false, ecsSystem:'gas_boiler',
            boilerAge:'over20',
            hasVmc:true, vmcType:'simple_flux',
            roofInsulation:'unknown', wallInsulation:'unknown',
            elecUsed:true, elecKwh:'60000', gasUsed:true, gasKwh:'95000',
            role:'owner', projectObjective:'reduce_costs', decisionHorizon:'immediate', budgetRange:'20to80k' }
    },
    {
        id: 'S29', nom: 'Immeuble bureaux recent performant (2000m2)',
        formData: { ...BASE, postalCode:'75001', activity:'offices', surface:'2000', mainHeating:'electric', hasCooling:true, buildingAge:'post2012',
            roofType:'flat',
            ecsSameSystem:false, ecsSystem:'thermodynamic',
            hasGtb:true,
            hasVmc:true, vmcType:'double_flux',
            roofInsulation:'yes', wallInsulation:'yes',
            worksDone:['led_done','regulation_done'],
            elecUsed:true, elecKwh:'120000', gasUsed:false, gasKwh:'',
            role:'tenant', projectObjective:'comply_regulation', decisionHorizon:'1year', budgetRange:'20to80k' }
    },
    {
        id: 'S30', nom: 'Superette de quartier (150m2)',
        formData: { ...BASE, postalCode:'75001', activity:'commerce_alim', surface:'150', mainHeating:'electric', hasCooling:true, buildingAge:'1975_2000',
            roofType:'pitched', roofOrientation:'south',
            hasVmc:false,
            elecUsed:true, elecKwh:'85000', gasUsed:false, gasKwh:'',
            role:'owner', projectObjective:'valorize_asset', decisionHorizon:'6months', budgetRange:'5to20k' }
    }
];

// ─── Execution des simulations ────────────────────────────────────────────────
console.log(`\nExecution de ${SCENARIOS.length} simulations...\n`);

const RESULTS = SCENARIOS.map(s => {
    let result = null;
    let errorMsg = null;
    try {
        result = newDiagnosticBuildReportData(s.formData);
    } catch (e) {
        errorMsg = e.message;
    }
    const anomalies = detectAnomalies(s.id, result || { error: errorMsg }, s.formData);
    const r = result;
    const fd = s.formData;

    // Extraction resultats
    const elecKwh = r?.calculation_results?.elec_kwh_an?.value || 0;
    const gasKwh  = r?.calculation_results?.gas_kwh_an?.value  || 0;
    const intensity = r?.calculation_results?.intensity_kwh_m2_an?.value || 0;
    const benchMedian = r?.benchmark_result?.benchmark_median?.value || 0;
    const benchLow = r?.benchmark_result?.benchmark_low?.value || 0;
    const benchHigh = r?.benchmark_result?.benchmark_high?.value || 0;
    const score = errorMsg ? 'ERR' : deriveScore(intensity, { median_kwh_m2_an: benchMedian });
    const totalCost = r?.calculation_results?.total_cost_euro_an?.value || 0;
    const confiance = r?.confidence?.label || 'N/A';
    const nbActions = r?.top_actions?.length || 0;
    const actions = r?.top_actions || [];
    const bp = r?.usage_breakdown?.breakdown_pct || {};
    const compositePct = r?.composite_savings?.total_pct?.value || 0;
    const annualSavingsEuro = r?.composite_savings?.annual_euro?.value || 0;
    const ecartMediane = benchMedian > 0 ? Math.round((intensity / benchMedian - 1) * 100) : null;

    // CO2
    const co2TotalKg = computeCO2(elecKwh, gasKwh, fd.mainHeating || 'gas');
    const co2SavedKg = computeCO2Savings(actions, fd.mainHeating || 'gas');
    const co2EquivTrees = Math.round(co2SavedKg / 22);

    // Top 3 actions
    const topA = actions.slice(0, 3);

    const status = errorMsg ? `ERREUR: ${errorMsg}` : (anomalies.filter(x=>x.severity==='CRITIQUE').length > 0 ? 'CRITIQUE' : (anomalies.filter(x=>x.severity==='WARNING').length > 0 ? 'WARNING' : 'OK'));

    console.log(`  ${s.id} | ${s.nom.substring(0,35).padEnd(35)} | Score:${score} | Intensite:${String(intensity).padStart(4)} kWh/m2 | Actions:${nbActions} | ${status}`);

    return {
        // Meta
        scenario_id: s.id,
        scenario_nom: s.nom,
        status,
        errorMsg,
        anomalies,
        formData: fd,

        // Synthese
        activite: fd.activity,
        surface: parseFloat(fd.surface),
        chauffage: fd.mainHeating || 'gas',
        age: fd.buildingAge,
        elec_input_kwh: parseFloat(fd.elecKwh)||0,
        gaz_input_kwh: parseFloat(fd.gasKwh)||0,
        score,
        intensity,
        benchMedian,
        benchLow,
        benchHigh,
        ecartMediane,
        totalCost,
        elecKwh,
        gasKwh,
        elecMethod: r?.calculation_results?.elec_kwh_an?.method || 'N/A',
        gasMethod: r?.calculation_results?.gas_kwh_an?.method || 'N/A',
        confiance,
        nbActions,
        compositePct,
        annualSavingsEuro,

        // CO2
        co2TotalKg,
        co2SavedKg,
        co2EquivTrees,

        // Breakdown
        bp_heating: bp.heating_pct || 0,
        bp_cooling: bp.cooling_pct || 0,
        bp_vent: bp.vent_aux_pct || 0,
        bp_lighting: bp.lighting_pct || 0,
        bp_ecs: bp.dhw_pct || 0,
        bp_cooking: bp.cooking_pct || 0,
        bp_other: bp.other_specific_pct || 0,
        bp_sum: (bp.heating_pct||0)+(bp.cooling_pct||0)+(bp.vent_aux_pct||0)+(bp.lighting_pct||0)+(bp.dhw_pct||0)+(bp.cooking_pct||0)+(bp.other_specific_pct||0),

        // Actions
        actions,
        topA,

        // Raw result
        raw: r
    };
});

console.log('\n[OK] Simulations terminees\n');

// ─── Génération XLSX ──────────────────────────────────────────────────────────
const wb = XLSX.utils.book_new();

// === Onglet 1 : Synthese =====================================================
const synthRows = RESULTS.map(r => {
    const a0 = r.topA[0]; const a1 = r.topA[1]; const a2 = r.topA[2];
    return {
        'Scenario': r.scenario_id,
        'Nom': r.scenario_nom,
        'Activite': r.activite,
        'Surface m2': r.surface,
        'Chauffage': r.chauffage,
        'Age batiment': r.age,
        'Elec input kWh': r.elec_input_kwh,
        'Gaz input kWh': r.gaz_input_kwh,
        'Elec calcule kWh': r.elecKwh,
        'Gaz calcule kWh': r.gasKwh,
        'Methode elec': r.elecMethod,
        'Methode gaz': r.gasMethod,
        'Score A-E': r.score,
        'Intensite kWh/m2/an': r.intensity,
        'Mediane sectorielle': r.benchMedian,
        'Q1 (bas)': r.benchLow,
        'Q3 (haut)': r.benchHigh,
        'Ecart mediane %': r.ecartMediane !== null ? `${r.ecartMediane > 0 ? '+' : ''}${r.ecartMediane}%` : 'N/A',
        'Cout annuel EUR': r.totalCost,
        'Confiance': r.confiance,
        'Nb actions': r.nbActions,
        'Economies composees %': r.compositePct,
        'Economies annuelles EUR': r.annualSavingsEuro,
        'CO2 total kg/an': r.co2TotalKg,
        'CO2 evite kg/an': r.co2SavedKg,
        'Equiv arbres': r.co2EquivTrees,
        'Action 1': a0 ? a0.id : '',
        'Gain 1 EUR/an': a0 ? (a0.gain_euro_an?.value || 0) : '',
        'ROI 1 ans': a0 ? (a0.roi_years?.value ?? 'N/A') : '',
        'Action 2': a1 ? a1.id : '',
        'Gain 2 EUR/an': a1 ? (a1.gain_euro_an?.value || 0) : '',
        'ROI 2 ans': a1 ? (a1.roi_years?.value ?? 'N/A') : '',
        'Action 3': a2 ? a2.id : '',
        'Gain 3 EUR/an': a2 ? (a2.gain_euro_an?.value || 0) : '',
        'ROI 3 ans': a2 ? (a2.roi_years?.value ?? 'N/A') : '',
        'Anomalies': r.anomalies.map(x => `[${x.severity}] ${x.msg}`).join(' | ') || 'Aucune',
        'Statut': r.status
    };
});
const ws1 = XLSX.utils.json_to_sheet(synthRows);
ws1['!cols'] = [{ wch:6 },{ wch:40 },{ wch:15 },{ wch:10 },{ wch:12 },{ wch:14 },{ wch:14 },{ wch:14 },{ wch:14 },{ wch:14 },{ wch:18 },{ wch:18 },{ wch:10 },{ wch:16 },{ wch:16 },{ wch:8 },{ wch:8 },{ wch:14 },{ wch:14 },{ wch:10 },{ wch:10 },{ wch:20 },{ wch:22 },{ wch:14 },{ wch:14 },{ wch:12 },{ wch:8 },{ wch:14 },{ wch:10 },{ wch:8 },{ wch:14 },{ wch:10 },{ wch:8 },{ wch:14 },{ wch:10 },{ wch:50 },{ wch:10 }];
XLSX.utils.book_append_sheet(wb, ws1, 'Synthese');

// === Onglet 2 : Detail actions ===============================================
const actRows = [];
for (const r of RESULTS) {
    for (const a of r.actions) {
        const isPV = a.id === 'ACT22';
        actRows.push({
            'Scenario': r.scenario_id,
            'Scenario nom': r.scenario_nom,
            'Action ID': a.id,
            'Titre': a.name,
            'Categorie': a.category,
            'Tier': a.tier,
            'Gain kWh/an': a.gain_kwh_an?.value || 0,
            'Gain EUR/an': a.gain_euro_an?.value || 0,
            'Gain % total': a.gain_pct_total || 0,
            'CAPEX EUR': a.capex?.value || 0,
            'Aides EUR': a.aid_amount?.value || 0,
            'Aides %': Math.round((a.aid_pct||0)*100),
            'Net EUR': a.capex_net?.value || 0,
            'ROI ans': a.roi_years?.value ?? 'N/A',
            'Bascule source': a.energy_switch_note ? 'Oui' : 'Non',
            'PV kWc': isPV && a.pv_installed_kwc ? a.pv_installed_kwc : '',
            'PV prod kWh/an': isPV && a.pv_production_kwh_an ? a.pv_production_kwh_an : '',
            'PV autoconso %': isPV && a.pv_autoconsumption_rate ? a.pv_autoconsumption_rate : '',
            'PV surplus kWh': isPV && a.pv_surplus_kwh_an ? a.pv_surplus_kwh_an : '',
            'Aide tags': (a.aid_tags||[]).join(', ')
        });
    }
}
const ws2 = XLSX.utils.json_to_sheet(actRows);
ws2['!cols'] = [{ wch:6 },{ wch:40 },{ wch:8 },{ wch:50 },{ wch:20 },{ wch:8 },{ wch:12 },{ wch:12 },{ wch:10 },{ wch:12 },{ wch:12 },{ wch:8 },{ wch:12 },{ wch:8 },{ wch:14 },{ wch:8 },{ wch:12 },{ wch:12 },{ wch:12 },{ wch:20 }];
XLSX.utils.book_append_sheet(wb, ws2, 'Detail actions');

// === Onglet 3 : Breakdowns ===================================================
const bkRows = RESULTS.map(r => ({
    'Scenario': r.scenario_id,
    'Nom': r.scenario_nom,
    'Activite': r.activite,
    'Chauffage %': r.bp_heating,
    'Climatisation %': r.bp_cooling,
    'Ventilation %': r.bp_vent,
    'Eclairage %': r.bp_lighting,
    'ECS %': r.bp_ecs,
    'Cuisson %': r.bp_cooking,
    'Autres %': r.bp_other,
    'Somme %': r.bp_sum,
    'Source chauffage': r.raw?.energy_split?.heating_source || 'N/A',
    'Source ECS': r.raw?.energy_split?.ecs_source || 'N/A',
    'Alerte somme': Math.abs(r.bp_sum - 100) > 1 ? `ALERTE: ${r.bp_sum}%` : 'OK'
}));
const ws3 = XLSX.utils.json_to_sheet(bkRows);
ws3['!cols'] = [{ wch:6 },{ wch:40 },{ wch:15 },{ wch:12 },{ wch:14 },{ wch:13 },{ wch:13 },{ wch:8 },{ wch:10 },{ wch:10 },{ wch:10 },{ wch:16 },{ wch:12 },{ wch:12 }];
XLSX.utils.book_append_sheet(wb, ws3, 'Breakdowns');

// Sauvegarde
const outDir = path.join(__dirname, '../simulation-output');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
const xlsxPath = path.join(outDir, 'rapport-detail.xlsx');
XLSX.writeFile(wb, xlsxPath);
console.log(`[OK] Excel genere : ${xlsxPath}`);

// ─── Génération Markdown ──────────────────────────────────────────────────────

// Stats globales
const totalAnomaliesCritiques = RESULTS.flatMap(r => r.anomalies.filter(a => a.severity === 'CRITIQUE')).length;
const totalAnomaliesWarning = RESULTS.flatMap(r => r.anomalies.filter(a => a.severity === 'WARNING')).length;
const scores = RESULTS.filter(r => !r.errorMsg).map(r => r.score);
const scoreCount = { A:0, B:0, C:0, D:0, E:0, 'N/A':0 };
scores.forEach(s => { scoreCount[s] = (scoreCount[s]||0) + 1; });
const intensities = RESULTS.filter(r => r.intensity > 0).map(r => r.intensity);
const avgIntensity = Math.round(intensities.reduce((a,b)=>a+b,0)/intensities.length);
const allErrors = RESULTS.filter(r => r.errorMsg);

// Action frequency
const actionFreq = {};
RESULTS.forEach(r => { r.actions.forEach(a => { actionFreq[a.id] = (actionFreq[a.id]||{count:0, name:a.name, gains:[], rois:[]}); actionFreq[a.id].count++; actionFreq[a.id].gains.push(a.gain_euro_an?.value||0); if(a.roi_years?.value !== null && a.roi_years?.value !== undefined) actionFreq[a.id].rois.push(a.roi_years.value); }); });
const topActions5 = Object.entries(actionFreq).sort((a,b) => b[1].count - a[1].count).slice(0, 8);
const neverRecommended = ['ACT01','ACT02','ACT03','ACT04','ACT05','ACT06','ACT07','ACT08','ACT09','ACT10','ACT11','ACT13','ACT14','ACT15','ACT16','ACT17','ACT18','ACT19','ACT20','ACT21','ACT22']
    .filter(id => !actionFreq[id] || actionFreq[id].count === 0);

const md = [];
md.push(`# Rapport de simulation energetique - DiagTertiaire v${engineModule.ENGINE_VERSION}`);
md.push(`\n**Date de simulation :** ${new Date().toLocaleDateString('fr-FR', {day:'2-digit',month:'2-digit',year:'numeric'})}  `);
md.push(`**Moteur :** ENGINE_VERSION ${engineModule.ENGINE_VERSION} (${engineModule.ENGINE_LAST_UPDATED})\n`);

md.push(`---\n`);
md.push(`## A. Resume executif\n`);
md.push(`- **Simulations executees :** ${RESULTS.length}/30`);
md.push(`- **Erreurs moteur :** ${allErrors.length} (${allErrors.map(r=>r.scenario_id).join(', ')||'Aucune'})`);
md.push(`- **Anomalies CRITIQUE :** ${totalAnomaliesCritiques}`);
md.push(`- **Anomalies WARNING :** ${totalAnomaliesWarning}`);
md.push(`- **Repartition des scores A-E :** A=${scoreCount.A} | B=${scoreCount.B} | C=${scoreCount.C} | D=${scoreCount.D} | E=${scoreCount.E} | ERR/NA=${scoreCount['N/A']+(scoreCount['ERR']||0)}`);
md.push(`- **Intensite observee :** min=${Math.min(...intensities)} | max=${Math.max(...intensities)} | moy=${avgIntensity} kWh/m2/an`);
const costs = RESULTS.filter(r => r.totalCost > 0).map(r => r.totalCost);
md.push(`- **Cout annuel :** min=${Math.min(...costs).toLocaleString('fr-FR')} EUR | max=${Math.max(...costs).toLocaleString('fr-FR')} EUR`);
md.push(`\n### Tableau de synthese global\n`);
md.push(`| ID | Nom scenario | Score | Intensite | Mediane | Ecart | Cout EUR | Actions | Economies EUR | Statut |`);
md.push(`|---|---|---|---|---|---|---|---|---|---|`);
RESULTS.forEach(r => {
    md.push(`| ${r.scenario_id} | ${r.scenario_nom} | **${r.score}** | ${r.intensity} | ${r.benchMedian} | ${r.ecartMediane !== null ? (r.ecartMediane >= 0 ? '+' : '')+r.ecartMediane+'%' : 'N/A'} | ${r.totalCost.toLocaleString('fr-FR')} | ${r.nbActions} | ${r.annualSavingsEuro.toLocaleString('fr-FR')} | ${r.status} |`);
});

md.push(`\n---\n`);
md.push(`## B. Analyse par activite\n`);

const byActivity = {};
RESULTS.forEach(r => {
    if (!byActivity[r.activite]) byActivity[r.activite] = [];
    byActivity[r.activite].push(r);
});

const ACT_LABELS = {
    offices: 'Bureaux', retail: 'Commerce non-alim', hotel: 'Hotellerie', restaurant: 'Restauration',
    commerce_alim: 'Commerce alimentaire', health_local: 'Sante locale', education: 'Enseignement',
    light_warehouse: 'Entrepot leger', mixed: 'Usage mixte'
};

for (const [act, rlist] of Object.entries(byActivity)) {
    const bench = BENCHMARKS[act];
    md.push(`### ${ACT_LABELS[act] || act}`);
    if (bench) {
        md.push(`\n**Benchmark moteur :** mediane = ${bench.median_kwh_m2_an} | Q1 = ${bench.low_kwh_m2_an} | Q3 = ${bench.high_kwh_m2_an} kWh/m2/an`);
    }
    md.push(`\n| ID | Surface | Age | Score | Intensite | Ecart mediane | Nb actions | Actions principales |`);
    md.push(`|---|---|---|---|---|---|---|---|`);
    rlist.forEach(r => {
        const acts = r.actions.slice(0,3).map(a => `${a.id}`).join(', ');
        md.push(`| ${r.scenario_id} | ${r.surface}m2 | ${r.age} | **${r.score}** | ${r.intensity} kWh/m2 | ${r.ecartMediane !== null ? (r.ecartMediane >= 0 ? '+' : '')+r.ecartMediane+'%' : 'N/A'} | ${r.nbActions} | ${acts} |`);
    });
    md.push(``);
}

md.push(`---\n`);
md.push(`## C. Analyse des actions\n`);
md.push(`### Top actions les plus frequemment recommandees\n`);
md.push(`| Rang | ID | Nom | Frequence | Gain min EUR | Gain max EUR | ROI min | ROI max |`);
md.push(`|---|---|---|---|---|---|---|---|`);
topActions5.forEach(([id, data], i) => {
    const gains = data.gains.filter(x=>x>0);
    const rois = data.rois.filter(x=>x>0);
    md.push(`| ${i+1} | ${id} | ${data.name.substring(0,55)} | ${data.count}/30 | ${gains.length?Math.min(...gains).toLocaleString('fr-FR'):'-'} | ${gains.length?Math.max(...gains).toLocaleString('fr-FR'):'-'} | ${rois.length?Math.min(...rois):'-'} | ${rois.length?Math.max(...rois):'-'} |`);
});
if (neverRecommended.length > 0) {
    md.push(`\n**Actions jamais recommandees dans les 30 scenarios :** ${neverRecommended.join(', ')}`);
    md.push(`\n> Note: Cela peut indiquer que les conditions declenchantes ne sont pas remplies pour les scenarios testes (ex: ACT07 "VMC CO2" necessite high_occupancy, ACT17 "fenetres" a ROI souvent > 10 ans), ou que ces actions sont eclipsees par d'autres plus rentables.`);
}

md.push(`\n---\n`);
md.push(`## D. Analyse CO2\n`);
md.push(`\n**Facteurs CO2 utilises par le moteur :**\n`);
md.push(`| Energie | Facteur kgCO2/kWh | Source |`);
md.push(`|---|---|---|`);
md.push(`| Electricite | ${CARBON.electricite} | ADEME RE2020 mensualisee par usage (valeur prospective 2026-2030) |`);
md.push(`| Gaz naturel | ${CARBON.gaz} | Base Carbone ADEME 2024 |`);
md.push(`| Fioul | ${CARBON.fioul} | Base Carbone ADEME 2024 |`);
md.push(`| Reseau chaleur | ${CARBON.reseau_chaleur} | Moyenne nationale (tres variable) |`);
md.push(`| Bois granules | ${CARBON.bois_granules} | Base Carbone ADEME 2024 |`);
md.push(`\n> **Note critique :** Le facteur CO2 electricite de ${CARBON.electricite} kgCO2/kWh est la valeur ADEME RE2020 prospective (methode mensualisee par usage, 2026-2030). La valeur courante ACV (analyse du cycle de vie) ADEME 2023 est ~0.052 kgCO2/kWh, et la valeur "contenu carbone moyen" RTE est ~0.062 kgCO2/kWh. Ce choix methodologique est determinant sur le comparatif gaz/elec.\n`);
md.push(`\n**CO2 par scenario (calcule en post-traitement) :**\n`);
md.push(`| ID | Nom | CO2 total kg/an | CO2 evite kg/an | Equiv arbres/an |`);
md.push(`|---|---|---|---|---|`);
RESULTS.forEach(r => {
    md.push(`| ${r.scenario_id} | ${r.scenario_nom} | ${r.co2TotalKg.toLocaleString('fr-FR')} | ${r.co2SavedKg.toLocaleString('fr-FR')} | ${r.co2EquivTrees} |`);
});

md.push(`\n---\n`);
md.push(`## E. Anomalies et alertes\n`);

const allAnomalies = RESULTS.flatMap(r => r.anomalies.map(a => ({ ...a, scenario: r.scenario_id, nom: r.scenario_nom })));
const critiques = allAnomalies.filter(a => a.severity === 'CRITIQUE');
const warnings = allAnomalies.filter(a => a.severity === 'WARNING');

if (critiques.length === 0 && warnings.length === 0) {
    md.push(`> Aucune anomalie detectee sur les 30 scenarios.`);
} else {
    if (critiques.length > 0) {
        md.push(`### Anomalies CRITIQUE (${critiques.length})\n`);
        md.push(`| Scenario | Anomalie |`);
        md.push(`|---|---|`);
        critiques.forEach(a => md.push(`| **${a.scenario}** - ${a.nom} | ${a.msg} |`));
        md.push(``);
    }
    if (warnings.length > 0) {
        md.push(`### Alertes WARNING (${warnings.length})\n`);
        md.push(`| Scenario | Alerte |`);
        md.push(`|---|---|`);
        warnings.forEach(a => md.push(`| ${a.scenario} - ${a.nom} | ${a.msg} |`));
        md.push(``);
    }
}

if (allErrors.length > 0) {
    md.push(`\n### Erreurs moteur\n`);
    allErrors.forEach(r => md.push(`- **${r.scenario_id}** - ${r.scenario_nom}: \`${r.errorMsg}\``));
}

md.push(`\n---\n`);
md.push(`## F. Questions pour l'expert energie\n`);
md.push(`_Basees sur les resultats observes, a soumettre pour validation metier._\n`);

const questions = [];

// Q1 : Mediane bureaux
const s01 = RESULTS.find(r=>r.scenario_id==='S01');
if (s01) questions.push(`**Q1 - Mediane bureaux :** Pour un bureau de ${s01.surface}m2 chauffage gaz (${s01.elec_input_kwh/1000}k kWh elec + ${s01.gaz_input_kwh/1000}k kWh gaz), le moteur calcule une intensite de **${s01.intensity} kWh/m2/an**. La mediane sectorielle est de **${s01.benchMedian} kWh/m2/an** (score **${s01.score}**). Ces references bureaux sont-elles coherentes avec la realite 2024-2025 ?`);

// Q2 : Restaurant
const s04 = RESULTS.find(r=>r.scenario_id==='S04');
const s28 = RESULTS.find(r=>r.scenario_id==='S28');
if (s04) questions.push(`**Q2 - Intensite restauration :** Le restaurant S04 (${s04.surface}m2, ${s04.intensity} kWh/m2/an) obtient un score **${s04.score}** vs mediane ${s04.benchMedian}. S28 (${s28?.surface}m2 gastronomique ancien) : ${s28?.intensity} kWh/m2/an, score **${s28?.score}**. La mediane 270 kWh/m2/an pour la restauration vous semble-t-elle realiste ? L'ecart type constate en pratique est-il tres large ?`);

// Q3 : Commerce alimentaire
const s05 = RESULTS.find(r=>r.scenario_id==='S05');
if (s05) questions.push(`**Q3 - Score commerce alimentaire :** S05 (${s05.surface}m2 superette, ${s05.intensity} kWh/m2/an) obtient un score **${s05.score}** vs mediane sectorielle ${s05.benchMedian} kWh/m2/an. Ce score reflete-t-il correctement la realite du commerce alimentaire avec froid commercial ? La mediane 360 kWh/m2/an est-elle representative des petites superettes ?`);

// Q4 : PAC ROI
const pacResults = RESULTS.filter(r => r.actions.some(a => a.id === 'ACT13'));
if (pacResults.length > 0) {
    const pacRois = pacResults.map(r => { const a = r.actions.find(x=>x.id==='ACT13'); return { id: r.scenario_id, roi: a?.roi_years?.value, gain: a?.gain_euro_an?.value, capex: a?.capex?.value }; });
    questions.push(`**Q4 - ROI PAC :** L'action PAC (ACT13) est recommandee sur ${pacResults.length} scenarios. ROI observe : ${pacRois.map(x=>`${x.id}=${x.roi}ans`).join(', ')}. Ces ROI de remplacement chaudiere gaz par PAC air/eau sont-ils realistes ? En particulier pour les grandes surfaces (>500m2) ou le CAPEX depasse 30 000 EUR ?`);
}

// Q5 : Fioul CO2
const s11 = RESULTS.find(r=>r.scenario_id==='S11');
if (s11) questions.push(`**Q5 - Facteur CO2 fioul :** Le moteur utilise 0.324 kgCO2/kWh pour le fioul (Base Carbone ADEME 2024). S11 (bureau fioul, 300m2) genere un total CO2 de ${s11.co2TotalKg.toLocaleString('fr-FR')} kg/an. La valeur ADEME Base Carbone pour le fioul domestique (EF = 0.324 kgCO2/kWh) vous semble-t-elle correcte ? Certaines sources citent 0.276 (NCV). La distinction NCV/GCV peut-elle expliquer l'ecart ?`);

// Q6 : Facteur CO2 electricite
questions.push(`**Q6 - Facteur CO2 electricite (DEBAT METHODOLOGIQUE) :** Le moteur utilise 0.079 kgCO2/kWh (ADEME RE2020 prospective 2026-2030). La valeur ACV ADEME 2023 est ~0.052, et la valeur "moyen" RTE est ~0.062. Ce choix a un impact fort : avec 0.079, un kWh elec "vaut" ${(0.079/0.227*100).toFixed(0)}% d'un kWh gaz en CO2. Avec 0.052, il ne vaudrait que ${(0.052/0.227*100).toFixed(0)}%. Quelle valeur recommandez-vous pour un pre-diagnostic tertiaire grand public ?`);

// Q7 : Reseau chaleur sans kWh declares
const s12 = RESULTS.find(r=>r.scenario_id==='S12');
if (s12) questions.push(`**Q7 - Reseau de chaleur sans kWh declares :** S12 (bureau reseau chaleur, 300m2) : elec seule declaree (20 000 kWh), pas de kWh reseau. Le moteur estime une intensite de **${s12.intensity} kWh/m2/an**. Le traitement du reseau de chaleur comme "chauffage non declare" est-il acceptable ? Le moteur devrait-il avoir un champ separe "chaleur reseau kWh/an" pour mieux traiter ce cas ?`);

// Q8 : Aucune conso
const s26 = RESULTS.find(r=>r.scenario_id==='S26');
if (s26) questions.push(`**Q8 - Aucune consommation saisie :** S26 (bureau 300m2, ni elec ni gaz declared) retourne une intensite de **${s26.intensity} kWh/m2/an** et ${s26.nbActions} action(s). Le moteur ne refuse pas cette configuration - il renvoie simplement totalKwh=0. Ce comportement est-il acceptable ? Faut-il une estimation par defaut basee sur la surface et l'activite ?`);

// Q9 : Decret tertiaire
const bigBuildings = RESULTS.filter(r => r.surface >= 1000);
if (bigBuildings.length > 0) questions.push(`**Q9 - Decret tertiaire :** ${bigBuildings.length} scenarios depassent 1 000m2 (${bigBuildings.map(r=>`${r.scenario_id}: ${r.surface}m2`).join(', ')}). Le moteur mentionne le Decret Tertiaire mais ne bloque pas sur les CAbs. Pour S03 (hotel 1 200m2), l'intensite ${bigBuildings.find(r=>r.scenario_id==='S03')?.intensity || '?'} kWh/m2/an depasse-t-elle la CAbs 2030 de 170 kWh/m2/an pour l'hotellerie ? Comment le moteur devrait-il integrer le Decret de facon plus proactive ?`);

// Q10 : LED ROI
const ledResults = RESULTS.filter(r => r.actions.some(a => a.id === 'ACT08'));
if (ledResults.length > 0) {
    const ledRois = ledResults.map(r => { const a = r.actions.find(x=>x.id==='ACT08'); return `${r.scenario_id}=${a?.roi_years?.value}ans`; });
    questions.push(`**Q10 - ROI LED :** L'action LED (ACT08) est recommandee sur ${ledResults.length}/30 scenarios. ROI observe : ${ledRois.join(', ')}. Un ROI LED < 3 ans est generalement consideré tres optimiste - le plafond de gain LED (75%) est-il realiste ? Le CAPEX de 30 EUR/m2 est-il representatif 2025 ?`);
}

// Q11 : Entrepot score
const s08 = RESULTS.find(r=>r.scenario_id==='S08');
if (s08) questions.push(`**Q11 - Entrepot logistique :** S08 (entrepot leger 2500m2) : intensite **${s08.intensity} kWh/m2/an**, mediane ${s08.benchMedian}, score **${s08.score}**. La mediane 45 kWh/m2/an pour "entrepot leger" integre-t-elle le chauffage ? Pour un entrepot gaz (${s08.gaz_input_kwh.toLocaleString('fr-FR')} kWh gaz), la mediane de 45 kWh/m2/an (eclairage seul) semble tres basse. Y aurait-il une erreur de categorisation dans le plan de simulation ?`);

// Q12 : Gains composés cap
const maxCompEuro = Math.max(...RESULTS.map(r=>r.annualSavingsEuro));
const maxCompScenario = RESULTS.find(r=>r.annualSavingsEuro===maxCompEuro);
questions.push(`**Q12 - Cap des economies a 65% :** Le moteur plafonne les economies composees a 65% de la facture totale. Le scenario maximum est ${maxCompScenario?.scenario_id} avec ${maxCompEuro.toLocaleString('fr-FR')} EUR/an d'economies (${maxCompScenario?.compositePct}% de reduction). Ce plafond de 65% vous semble-t-il conservateur, realiste ou trop permissif pour un pre-diagnostic ?`);

// Q13 : PV par orientation
const s20 = RESULTS.find(r=>r.scenario_id==='S20');
const s21 = RESULTS.find(r=>r.scenario_id==='S21');
const s22 = RESULTS.find(r=>r.scenario_id==='S22');
const s23 = RESULTS.find(r=>r.scenario_id==='S23');
const getPVKwc = r => r.actions.find(a=>a.id==='ACT22')?.pv_installed_kwc || r.raw?.complementary_opportunity?.pv_installed_kwc || 'N/A';
const getPVGain = r => r.actions.find(a=>a.id==='ACT22')?.gain_euro_an?.value || r.raw?.complementary_opportunity?.gain_euro_an?.value || 'N/A';
questions.push(`**Q13 - Impact orientation toiture sur PV :** Meme batiment (bureau 400m2, 75 kWh elec+gaz) en variant la toiture:\n  - S20 plate: ${getPVKwc(s20)} kWc, ${getPVGain(s20)} EUR/an\n  - S21 sud: ${getPVKwc(s21)} kWc, ${getPVGain(s21)} EUR/an\n  - S22 nord: ${getPVKwc(s22)} kWc, ${getPVGain(s22)} EUR/an\n  - S23 sans toiture: ${getPVKwc(s23)} kWc\n\nCes ecarts reflètent-ils la realite terrain ? Le dimensionnement PV (m2 utile = surface/niveaux * 0.60) est-il correct pour une toiture plate ?`);

// Q14 : ECS hotel
const s03 = RESULTS.find(r=>r.scenario_id==='S03');
if (s03) {
    const ecsHotel = s03.bp_ecs;
    questions.push(`**Q14 - ECS hotellerie :** Pour S03 (hotel 1200m2), le moteur affiche ${ecsHotel}% en ECS sur le breakdown. Avec ${s03.gaz_input_kwh.toLocaleString('fr-FR')} kWh gaz (source principale), cela represente ~${Math.round(s03.gaz_input_kwh * ecsHotel / 100).toLocaleString('fr-FR')} kWh/an pour l'ECS. En hotellerie, l'ECS est typiquement 15-25% de la consommation totale (ADEME). Le moteur utilise 22% pour ce poste. Cela vous semble-t-il coherent pour un hotel 3 etoiles de 1200m2 ?`);
}

// Q15 : formData pre-1975 / fioul
questions.push(`**Q15 - Gestion du "fioul" dans le formulaire :** Le moteur ne possede pas de champ "fioul_kwh" separe. Pour S11 (bureau fioul), la conso fioul a ete renseignee dans le champ "gaz" (gasUsed=true, gasKwh=60000) avec mainHeating='fuel'. Le moteur ajuste alors correctement le prix (0.125 EUR/kWh) mais la methode de saisie est ambigue pour l'utilisateur. Faut-il ajouter un champ "fioul_kwh" distinct dans le formulaire ? Ou un champ generique "autre_thermique_kwh" ?`);

questions.forEach((q, i) => md.push(`\n${q}`));

md.push(`\n---\n`);
md.push(`## G. Annexe - Detail par scenario\n`);

RESULTS.forEach(r => {
    md.push(`\n### ${r.scenario_id} - ${r.scenario_nom}\n`);
    md.push(`| Parametre | Valeur |`);
    md.push(`|---|---|`);
    md.push(`| Activite | ${r.activite} |`);
    md.push(`| Surface | ${r.surface} m2 |`);
    md.push(`| Chauffage | ${r.chauffage} |`);
    md.push(`| Age | ${r.age} |`);
    md.push(`| **Score** | **${r.score}** |`);
    md.push(`| Intensite site | ${r.intensity} kWh/m2/an |`);
    md.push(`| Mediane sectorielle | ${r.benchMedian} kWh/m2/an |`);
    md.push(`| Ecart mediane | ${r.ecartMediane !== null ? (r.ecartMediane >= 0 ? '+' : '')+r.ecartMediane+'%' : 'N/A'} |`);
    md.push(`| Cout annuel estime | ${r.totalCost.toLocaleString('fr-FR')} EUR/an |`);
    md.push(`| Confiance | ${r.confiance} |`);
    md.push(`| CO2 total | ${r.co2TotalKg.toLocaleString('fr-FR')} kgCO2/an |`);
    md.push(`| Economies estimees | ${r.annualSavingsEuro.toLocaleString('fr-FR')} EUR/an (${r.compositePct}%) |`);
    if (r.errorMsg) {
        md.push(`| **ERREUR** | \`${r.errorMsg}\` |`);
    }
    if (r.actions.length > 0) {
        md.push(`\n**Actions recommandees (${r.actions.length}) :**\n`);
        md.push(`| ID | Titre | Gain EUR | ROI | CAPEX | Net | Aides |`);
        md.push(`|---|---|---|---|---|---|---|`);
        r.actions.forEach(a => {
            const pvNote = a.pv_installed_kwc ? ` (${a.pv_installed_kwc} kWc)` : '';
            md.push(`| ${a.id} | ${a.name}${pvNote} | ${(a.gain_euro_an?.value||0).toLocaleString('fr-FR')} EUR | ${a.roi_years?.value ?? 'N/A'} ans | ${(a.capex?.value||0).toLocaleString('fr-FR')} EUR | ${(a.capex_net?.value||a.capex?.value||0).toLocaleString('fr-FR')} EUR | ${(a.aid_amount?.value||0).toLocaleString('fr-FR')} EUR |`);
        });
    } else {
        md.push(`\n**Actions : Aucune (filtrees ou budget trop faible)**`);
    }
    if (r.anomalies.length > 0) {
        md.push(`\n**Anomalies detectees :**`);
        r.anomalies.forEach(a => md.push(`- [${a.severity}] ${a.msg}`));
    }
});

// Sauvegarde Markdown
const mdPath = path.join(outDir, 'rapport-synthese.md');
fs.writeFileSync(mdPath, md.join('\n'), 'utf8');
console.log(`[OK] Markdown genere : ${mdPath}`);
console.log(`\nSIMULATION TERMINEE - Fichiers disponibles dans : ${outDir}`);
