/**
 * DiagTertiaire - Moteur de calcul energetique
 * SOURCE UNIQUE - Ne pas dupliquer ce fichier
 *
 * Ce fichier est charge par :
 * - index.html (diagnostic public)
 * - espace-professionnel.html (espace pro)
 * - public-report-print.html (template PDF serveur)
 *
 * Toute modification doit etre testee sur minimum 3 scenarios.
 */
const ENGINE_VERSION = '1.5.0';
const ENGINE_LAST_UPDATED = '2026-04-04';

// ═══════════════════════════════════════════════════════════════
// CONSTANTES PARTAGEES (utilisees par le moteur ET le formulaire)
// ═══════════════════════════════════════════════════════════════

const NEW_DIAGNOSTIC_BUILDING_AGES = [
    { id: 'pre1975', label: 'Avant 1975', coef: 1.40, benchCoeff: 1.25, G: 1.40, icon: 'solar:home-angle-linear' },
    { id: '1975_2000', label: '1975 - 2000', coef: 1.15, benchCoeff: 1.05, G: 0.90, icon: 'solar:home-2-linear' },
    { id: '2001_2012', label: '2001 - 2012', coef: 1.00, benchCoeff: 0.90, G: 0.60, icon: 'solar:buildings-linear' },
    { id: 'post2012', label: 'Apres 2012 (RT2012+)', coef: 0.75, benchCoeff: 0.75, G: 0.45, icon: 'solar:buildings-2-linear' }
];

const NEW_DIAGNOSTIC_BOILER_AGES = [
    { id: 'under5', label: 'Moins de 5 ans', pacPriority: 0 },
    { id: '5to15', label: '5 à 15 ans', pacPriority: 1 },
    { id: '15to20', label: '15 à 20 ans', pacPriority: 2 },
    { id: 'over20', label: 'Plus de 20 ans', pacPriority: 3 }
];

const NEW_DIAGNOSTIC_MAX_TOTAL_SAVINGS_PCT = 0.65;

// ═══════════════════════════════════════════════════════════════
// FONCTIONS DE FORMATAGE (utilisees par le moteur)
// ═══════════════════════════════════════════════════════════════

function newDiagnosticFormatNumber(value, options = {}) {
    const safe = Number(value);
    const numericValue = Number.isFinite(safe) ? safe : 0;
    const maximumFractionDigits = typeof options.maximumFractionDigits === 'number' ? options.maximumFractionDigits : 0;
    const minimumFractionDigits = typeof options.minimumFractionDigits === 'number' ? options.minimumFractionDigits : 0;
    return numericValue.toLocaleString('fr-FR', {
        minimumFractionDigits,
        maximumFractionDigits
    });
}

function newDiagnosticFormatInteger(value) {
    return newDiagnosticFormatNumber(value, { maximumFractionDigits: 0 });
}

function newDiagnosticFormatDecimal(value, maximumFractionDigits = 1) {
    return newDiagnosticFormatNumber(value, { minimumFractionDigits: 0, maximumFractionDigits });
}


// ═══════════════════════════════════════════════════════════════
// MOTEUR DE CALCUL
// ═══════════════════════════════════════════════════════════════

const NEW_DIAGNOSTIC_ENERGY_PRICES = {
    version_tag: 'v1.1-2026',
    last_updated: '2026-03-23',

    electricity: {
        price_default_eur_kwh: 0.1960,
        price_min_eur_kwh: 0.15,
        price_max_eur_kwh: 0.30,
        unit: '€/kWh TTC',
        source_level: 'source_partial',
        source_ref: 'CRE - TRVE fév 2026, profil professionnel ≤ 36 kVA (baisse -15% fév 2025, stable fév 2026)',
        source_note: 'Ordre de grandeur TTC retenu : 0,196 €/kWh, hors abonnement. Moyenne tertiaire petit site.',
        validity_limits: 'Tertiaire < 36 kVA, périmètre France métropolitaine',
        subscription_excluded: true
    },

    gas: {
        price_default_eur_kwh: 0.108,
        price_min_eur_kwh: 0.09630,
        price_max_eur_kwh: 0.12291,
        unit: '€/kWh TTC',
        source_level: 'source_strong',
        source_ref: 'CRE - Prix repère gaz professionnel 2026, profil chauffage',
        source_note: 'Tarif TTC confirmé, applicable TPE/PME tertiaire',
        validity_limits: 'Profil chauffage, < 150 MWh/an',
        subscription_excluded: true
    },
    heat_network: { price_default_eur_kwh: 0.095 },
    fuel_oil: { price_default_eur_kwh: 0.125 },
    wood_pellets: { price_default_eur_kwh: 0.068 },
    solar_thermal: {
        price_default_eur_kwh: 0.02,
        source_ref: 'Estimation produit — maintenance annuelle ramenée au kWh',
        source_note: 'Quasi nul, seule la maintenance du système est comptée'
    }
};

const ROOF_TYPE_COEFF = {
    flat: 0.85,
    pitched_south: 1.00,
    pitched_se_sw: 0.93,
    pitched_east: 0.82,
    pitched_west: 0.82,
    pitched_north: 0.55,
    pitched_unknown: 0.85,
    none: 0
};

const INFLATION_ENERGIE = {
    electricite: 0.035, // SOURCE_PARTIAL — hausse ARENH + TURPE
    gaz: 0.045, // SOURCE_PARTIAL — stabilisation post-crise, phase-out progressif
    reseau_chaleur: 0.030, // SOURCE_PARTIAL — stable, renouvelable
    fioul: 0.060, // SOURCE_PARTIAL — phase-out, taxe carbone croissante
    bois_granules: 0.025, // SOURCE_PARTIAL — marché stable
};

const CARBON_FACTORS_KG_CO2_PER_KWH = {
    electricite: 0.079,      // ADEME RE2020 methode mensualisee par usage -- valeur minimale prospective 2026-2030
    gaz: 0.227,              // Base Carbone ADEME 2024
    fioul: 0.324,            // Base Carbone ADEME 2024
    reseau_chaleur: 0.100,   // Moyenne nationale (très variable)
    bois_granules: 0.030,    // Base Carbone ADEME 2024
};

/* ─────────────────────────────────────────────────────────────────────────
   TABLE 2 : NEW_DIAGNOSTIC_BENCHMARKS_INTENSITY
   v2.0 — Valeurs corrigées ADEME/OPERAT/CEREN (kWh EF/m²/an)
   ───────────────────────────────────────────────────────────────────────── */

const NEW_DIAGNOSTIC_BENCHMARKS_INTENSITY = {
    version_tag: 'v3.0-2026',
    last_updated: '2026-04-04',

    offices: {
        median_kwh_m2_an: 135, low_kwh_m2_an: 85, high_kwh_m2_an: 195,
        unit: 'kWh EF/m²/an', energy_scope: 'final_energy', stat_type: 'median_q1_q3',
        source_level: 'source_partial', source_ref: 'ADEME ECNA 2022 + OPERAT',
        source_note: 'Bureaux chauffes, mediane France metropolitaine', validity_limits: 'Bureaux standards, hors data centers'
    },
    retail: {
        median_kwh_m2_an: 210, low_kwh_m2_an: 140, high_kwh_m2_an: 300,
        unit: 'kWh EF/m²/an', energy_scope: 'final_energy', stat_type: 'median_q1_q3',
        source_level: 'source_partial', source_ref: 'ADEME/SDES 2024 -- commerce non-alimentaire, energie finale',
        source_note: 'Commerce non-alimentaire, hors froid commercial', validity_limits: 'Commerce de detail hors alimentaire'
    },
    retail_food: {
        median_kwh_m2_an: 360, low_kwh_m2_an: 250, high_kwh_m2_an: 500,
        unit: 'kWh EF/m²/an', energy_scope: 'final_energy', stat_type: 'median_q1_q3',
        source_level: 'source_partial', source_ref: 'ADEME (froid alimentaire)',
        source_note: 'Commerce alimentaire avec froid integre', validity_limits: 'Supermarche, epicerie avec froid'
    },
    hotel: {
        median_kwh_m2_an: 230, low_kwh_m2_an: 140, high_kwh_m2_an: 380,
        unit: 'kWh EF/m²/an', energy_scope: 'final_energy', stat_type: 'median_q1_q3',
        source_level: 'source_partial', source_ref: 'ADEME Hotellerie 2024',
        source_note: 'Hors blanchisserie industrielle et restauration', validity_limits: 'Hotellerie standard, hors palace'
    },
    restaurant: {
        median_kwh_m2_an: 270, low_kwh_m2_an: 190, high_kwh_m2_an: 400,
        unit: 'kWh EF/m²/an', energy_scope: 'final_energy', stat_type: 'median_q1_q3',
        source_level: 'source_partial', source_ref: 'ADEME HORECA 2024',
        source_note: 'Restaurant / brasserie avec cuisson, valeurs ajustees pour un usage reel hors fast-food', validity_limits: 'Restaurant service, hors restauration tres intensive'
    },
    education: {
        median_kwh_m2_an: 110, low_kwh_m2_an: 75, high_kwh_m2_an: 165,
        unit: 'kWh EF/m²/an', energy_scope: 'final_energy', stat_type: 'median_q1_q3',
        source_level: 'source_partial', source_ref: 'ADEME/OPERAT (-27% depuis 2010)',
        source_note: 'Primaire/secondaire, hors universite', validity_limits: 'Enseignement primaire/secondaire'
    },
    warehouse_heated: {
        median_kwh_m2_an: 120, low_kwh_m2_an: 70, high_kwh_m2_an: 180,
        unit: 'kWh EF/m²/an', energy_scope: 'final_energy', stat_type: 'median_q1_q3',
        source_level: 'source_partial', source_ref: 'CEREN Logistique revise',
        source_note: 'Chauffage + eclairage', validity_limits: 'Logistique legere chauffee'
    },
    light_warehouse: {
        median_kwh_m2_an: 45, low_kwh_m2_an: 20, high_kwh_m2_an: 75,
        unit: 'kWh EF/m²/an', energy_scope: 'final_energy', stat_type: 'median_q1_q3',
        source_level: 'source_partial', source_ref: 'CEREN Logistique',
        source_note: 'Eclairage seul', validity_limits: 'Logistique legere, hors entrepots frigorifiques'
    },
    health_local: {
        median_kwh_m2_an: 195, low_kwh_m2_an: 125, high_kwh_m2_an: 310,
        unit: 'kWh EF/m²/an', energy_scope: 'final_energy', stat_type: 'median_q1_q3',
        source_level: 'source_partial', source_ref: 'ADEME Sante',
        source_note: 'Ventilation reglementaire incluse, cabinets < 500m²', validity_limits: 'Sante ambulatoire < 500m²'
    }
};

// Aliases tunnel form IDs → résolution immédiate
NEW_DIAGNOSTIC_BENCHMARKS_INTENSITY.bureau = NEW_DIAGNOSTIC_BENCHMARKS_INTENSITY.offices;
NEW_DIAGNOSTIC_BENCHMARKS_INTENSITY.restauration = NEW_DIAGNOSTIC_BENCHMARKS_INTENSITY.restaurant;
NEW_DIAGNOSTIC_BENCHMARKS_INTENSITY.sante = NEW_DIAGNOSTIC_BENCHMARKS_INTENSITY.health_local;
NEW_DIAGNOSTIC_BENCHMARKS_INTENSITY.enseignement = NEW_DIAGNOSTIC_BENCHMARKS_INTENSITY.education;
NEW_DIAGNOSTIC_BENCHMARKS_INTENSITY.entrepot_chauffe = NEW_DIAGNOSTIC_BENCHMARKS_INTENSITY.warehouse_heated;
NEW_DIAGNOSTIC_BENCHMARKS_INTENSITY.entrepot_non_chauffe = NEW_DIAGNOSTIC_BENCHMARKS_INTENSITY.light_warehouse;
NEW_DIAGNOSTIC_BENCHMARKS_INTENSITY.commerce_non_alim = NEW_DIAGNOSTIC_BENCHMARKS_INTENSITY.retail;
NEW_DIAGNOSTIC_BENCHMARKS_INTENSITY.commerce_alim = NEW_DIAGNOSTIC_BENCHMARKS_INTENSITY.retail_food;

// Cibles Décret Tertiaire 2030 (Cabs) — uniquement pour bâtiments > 1000m²
const DECRET_TERTIAIRE_CABS_2030 = {
    offices: { cabs_kwh_m2_an: 103, source: 'Arrêté 13 avril 2022' },
    education: { cabs_kwh_m2_an: 80, source: 'Arrêté 13 avril 2022' },
    health_local: { cabs_kwh_m2_an: 165, source: 'Arrêté 28 novembre 2023' },
    hotel: { cabs_kwh_m2_an: 170, source: 'Arrêté 28 novembre 2023' },
    restaurant: { cabs_kwh_m2_an: 185, source: 'Arrêté 28 novembre 2023' },
    retail: { cabs_kwh_m2_an: 125, source: 'Arrêté 13 avril 2022' },
    retail_food: { cabs_kwh_m2_an: 240, source: 'Estimation prudente - pas d\'arrêté spécifique froid alimentaire (125 irréaliste pour ce secteur)' },
    warehouse_heated: { cabs_kwh_m2_an: 135, source: 'Arrêté 13 avril 2022' },
    light_warehouse: { cabs_kwh_m2_an: 135, source: 'Arrêté 13 avril 2022' }
};
// Aliases Cabs
DECRET_TERTIAIRE_CABS_2030.bureau = DECRET_TERTIAIRE_CABS_2030.offices;
DECRET_TERTIAIRE_CABS_2030.restauration = DECRET_TERTIAIRE_CABS_2030.restaurant;
DECRET_TERTIAIRE_CABS_2030.sante = DECRET_TERTIAIRE_CABS_2030.health_local;
DECRET_TERTIAIRE_CABS_2030.enseignement = DECRET_TERTIAIRE_CABS_2030.education;
DECRET_TERTIAIRE_CABS_2030.entrepot_chauffe = DECRET_TERTIAIRE_CABS_2030.warehouse_heated;
DECRET_TERTIAIRE_CABS_2030.entrepot_non_chauffe = DECRET_TERTIAIRE_CABS_2030.light_warehouse;
DECRET_TERTIAIRE_CABS_2030.commerce_non_alim = DECRET_TERTIAIRE_CABS_2030.retail;
DECRET_TERTIAIRE_CABS_2030.commerce_alim = DECRET_TERTIAIRE_CABS_2030.retail_food;



/* ─────────────────────────────────────────────────────────────────────────
   TABLE 3 : NEW_DIAGNOSTIC_USAGE_BREAKDOWNS
   
   Répartition indicative par postes (%)
   IMPORTANT : Non mesurée sur site, usage pédagogique + calcul gains
   ───────────────────────────────────────────────────────────────────────── */

const NEW_DIAGNOSTIC_USAGE_BREAKDOWNS = {
    version_tag: 'v2.0-2026',
    last_updated: '2026-03-23',

    offices: {
        heating_pct: 43,
        cooling_pct: 10,
        vent_aux_pct: 8,
        lighting_pct: 20,
        dhw_pct: 5,
        cooking_pct: 0,
        other_specific_pct: 14,
        breakdown_mode: 'coarse_statistical',
        source_level: 'source_partial',
        source_ref: 'ADEME - Répartition usages bureaux tertiaire',
        source_note: 'Répartition statistique moyenne, non mesurée sur site',
        validity_limits: 'Bureaux standards chauffés, périmètre indicatif'
    },

    retail: {
        heating_pct: 30,
        cooling_pct: 12,
        vent_aux_pct: 7,
        lighting_pct: 32,
        dhw_pct: 3,
        cooking_pct: 0,
        other_specific_pct: 16,
        breakdown_mode: 'coarse_statistical',
        source_level: 'source_partial',
        source_ref: 'CEREN - Commerce',
        source_note: 'Éclairage vitrine important, répartition indicative',
        validity_limits: 'Commerce de détail, hors alimentaire spécialisé'
    },

    hotel: {
        heating_pct: 38,
        cooling_pct: 8,
        vent_aux_pct: 8,
        lighting_pct: 15,
        dhw_pct: 22,
        cooking_pct: 5,
        other_specific_pct: 4,
        breakdown_mode: 'coarse_statistical',
        source_level: 'source_partial',
        source_ref: 'ADEME - Hôtellerie',
        source_note: 'ECS importante (chambres + cuisine), répartition indicative',
        validity_limits: 'Hôtel avec restauration'
    },

    restaurant: {
        heating_pct: 25,
        cooling_pct: 5,
        vent_aux_pct: 12,
        lighting_pct: 18,
        dhw_pct: 10,
        cooking_pct: 20,
        other_specific_pct: 10,
        breakdown_mode: 'coarse_statistical',
        source_level: 'source_partial',
        source_ref: 'ADEME - Restauration commerciale, profil brasserie',
        source_note: 'Cuisson = poste majeur, extraction importante, salle éclairée sur de longues plages',
        validity_limits: 'Restaurant service, hors restauration très intensive et hors cuisine de production lourde'
    },

    health_local: {
        heating_pct: 35,
        cooling_pct: 8,
        vent_aux_pct: 18,
        lighting_pct: 15,
        dhw_pct: 12,
        cooking_pct: 0,
        other_specific_pct: 12,
        breakdown_mode: 'coarse_statistical',
        source_level: 'source_partial',
        source_ref: 'ADEME Santé',
        source_note: 'Ventilation réglementaire importante, équipements médicaux en "autre"',
        validity_limits: 'Cabinet médical/dentaire local < 500m²'
    },

    education: {
        heating_pct: 52,
        cooling_pct: 3,
        vent_aux_pct: 8,
        lighting_pct: 20,
        dhw_pct: 7,
        cooking_pct: 2,
        other_specific_pct: 8,
        breakdown_mode: 'coarse_statistical',
        source_level: 'source_partial',
        source_ref: 'ADEME - Établissements scolaires',
        source_note: 'Occupation partielle année, chauffage dominant, cantine scolaire',
        validity_limits: 'Enseignement primaire/secondaire'
    },

    light_warehouse: {
        heating_pct: 35,
        cooling_pct: 0,
        vent_aux_pct: 5,
        lighting_pct: 40,
        dhw_pct: 2,
        cooking_pct: 0,
        other_specific_pct: 18,
        breakdown_mode: 'coarse_statistical',
        source_level: 'source_partial',
        source_ref: 'CEREN - Entrepôts',
        source_note: 'Éclairage dominant, peu chauffé',
        validity_limits: 'Entrepôt logistique standard'
    },

    // Aliases — résolus après la déclaration (lignes ci-dessous)
    // NB : "hotel" n'a pas d'alias car la clé existe déjà
    bureau: null,
    restauration: null,
    sante: null,
    enseignement: null,
    entrepot_chauffe: null,
    entrepot_non_chauffe: null,
    commerce_non_alim: null,
    commerce_alim: null
};

// Résolution des aliases dans NEW_DIAGNOSTIC_USAGE_BREAKDOWNS
NEW_DIAGNOSTIC_USAGE_BREAKDOWNS.bureau = NEW_DIAGNOSTIC_USAGE_BREAKDOWNS.offices;
NEW_DIAGNOSTIC_USAGE_BREAKDOWNS.restauration = NEW_DIAGNOSTIC_USAGE_BREAKDOWNS.restaurant;
NEW_DIAGNOSTIC_USAGE_BREAKDOWNS.sante = NEW_DIAGNOSTIC_USAGE_BREAKDOWNS.health_local;
NEW_DIAGNOSTIC_USAGE_BREAKDOWNS.enseignement = NEW_DIAGNOSTIC_USAGE_BREAKDOWNS.education;
NEW_DIAGNOSTIC_USAGE_BREAKDOWNS.entrepot_chauffe = { ...NEW_DIAGNOSTIC_USAGE_BREAKDOWNS.light_warehouse, heating_pct: 50, lighting_pct: 28, vent_aux_pct: 5, other_specific_pct: 15 };
NEW_DIAGNOSTIC_USAGE_BREAKDOWNS.warehouse_heated = NEW_DIAGNOSTIC_USAGE_BREAKDOWNS.entrepot_chauffe;
NEW_DIAGNOSTIC_USAGE_BREAKDOWNS.entrepot_non_chauffe = NEW_DIAGNOSTIC_USAGE_BREAKDOWNS.light_warehouse;
NEW_DIAGNOSTIC_USAGE_BREAKDOWNS.commerce_non_alim = NEW_DIAGNOSTIC_USAGE_BREAKDOWNS.retail;
NEW_DIAGNOSTIC_USAGE_BREAKDOWNS.commerce_alim = { ...NEW_DIAGNOSTIC_USAGE_BREAKDOWNS.retail, cooling_pct: 35, heating_pct: 12, lighting_pct: 24, cooking_pct: 5, other_specific_pct: 14 };
NEW_DIAGNOSTIC_USAGE_BREAKDOWNS.retail_food = NEW_DIAGNOSTIC_USAGE_BREAKDOWNS.commerce_alim;

// Garde-fou : vérification 100% au chargement
(function validateUsageBreakdowns() {
    const KEYS = ['heating_pct','cooling_pct','vent_aux_pct','lighting_pct','dhw_pct','cooking_pct','other_specific_pct'];
    Object.entries(NEW_DIAGNOSTIC_USAGE_BREAKDOWNS).forEach(([activity, data]) => {
        if (!data || typeof data !== 'object' || activity === 'version_tag' || activity === 'last_updated') return;
        const sum = KEYS.reduce((s, k) => s + (data[k] || 0), 0);
        if (Math.abs(sum - 100) > 0.5) {
            console.error(`[USAGE_BREAKDOWNS] ${activity} totalise ${sum}% au lieu de 100%`);
        }
    });
})();

/* ─────────────────────────────────────────────────────────────────────────
   TABLE 4 : NEW_DIAGNOSTIC_ACTIONS_LIBRARY
   
   22 actions avec gains/CAPEX/ROI + aid_pct
   tier: 'light' (max 3) ou 'heavy' (max 3)
   ───────────────────────────────────────────────────────────────────────── */

const NEW_DIAGNOSTIC_ACTIONS_LIBRARY = {
    version_tag: 'v2.0-2026',
    last_updated: '2026-03-23',

    actions: [
        {
            id: 'ACT01',
            name: 'Réglage horaires et abaissement chauffage',
            category: 'heating',
            tier: 'light',
            aid_pct: 0.00,
            trigger_rules: ['heating_post > 30%', 'no_regulation_done'],
            gain_scope: 'heating_post',
            gain_pct_low: 0.08, gain_pct_med: 0.12, gain_pct_high: 0.18,
            capex_low: 0, capex_med: 500, capex_high: 1500,
            capex_unit: '€',
            roi_method: 'simple_payback',
            aid_tags: [],
            source_level_gain: 'source_partial', source_ref_gain: 'ADEME - Réglages chauffage tertiaire',
            source_level_capex: 'hypothesis', source_ref_capex: 'Estimation produit - main d\'oeuvre réglage',
            source_level_roi: 'hypothesis'
        },
        {
            id: 'ACT02',
            name: 'Régulation centrale chauffage (sonde + programmation)',
            category: 'heating',
            tier: 'light',
            aid_pct: 0.20,
            trigger_rules: ['heating_post > 30%', 'no_regulation_done'],
            gain_scope: 'heating_post',
            gain_pct_low: 0.10, gain_pct_med: 0.15, gain_pct_high: 0.25,
            capex_low: 1500, capex_med: 4000, capex_high: 8000,
            capex_unit: '€',
            roi_method: 'simple_payback',
            aid_tags: ['CEE'],
            source_level_gain: 'source_partial', source_ref_gain: 'ADEME - Régulation centrale',
            source_level_capex: 'source_partial', source_ref_capex: 'Retours installateurs + ADEME',
            source_level_roi: 'hypothesis'
        },
        {
            id: 'ACT03',
            name: 'Robinets thermostatiques (zonage)',
            category: 'heating',
            tier: 'light',
            aid_pct: 0.15,
            trigger_rules: ['heating_post > 25%', 'surface > 200'],
            gain_scope: 'heating_post',
            gain_pct_low: 0.05, gain_pct_med: 0.10, gain_pct_high: 0.15,
            capex_low: 30, capex_med: 50, capex_high: 80,
            capex_unit: '€/radiateur',
            roi_method: 'simple_payback',
            aid_tags: ['CEE'],
            source_level_gain: 'source_partial', source_ref_gain: 'ADEME - Robinets thermostatiques',
            source_level_capex: 'source_strong', source_ref_capex: 'Prix marché constatés 2025',
            source_level_roi: 'hypothesis'
        },
        {
            id: 'ACT04',
            name: 'Désembouage et équilibrage réseau chauffage',
            category: 'heating',
            tier: 'light',
            aid_pct: 0.10,
            trigger_rules: ['heating_post > 30%', 'age_building > 15'],
            gain_scope: 'heating_post',
            gain_pct_low: 0.05, gain_pct_med: 0.08, gain_pct_high: 0.12,
            capex_low: 1000, capex_med: 2500, capex_high: 5000,
            capex_unit: '€',
            roi_method: 'simple_payback',
            aid_tags: [],
            source_level_gain: 'hypothesis', source_ref_gain: 'Retours terrain installateurs',
            source_level_capex: 'source_partial', source_ref_capex: 'Devis moyens constatés',
            source_level_roi: 'hypothesis'
        },
        {
            id: 'ACT05',
            name: 'Pilotage ventilation / extraction hors service',
            category: 'ventilation',
            tier: 'light',
            aid_pct: 0.15,
            trigger_rules: ['vent_aux_post > 8%', 'no_regulation_done'],
            gain_scope: 'vent_aux_post',
            gain_pct_low: 0.15, gain_pct_med: 0.25, gain_pct_high: 0.40,
            capex_low: 500, capex_med: 1500, capex_high: 3000,
            capex_unit: '€',
            roi_method: 'simple_payback',
            aid_tags: ['CEE'],
            source_level_gain: 'source_partial', source_ref_gain: 'ADEME - Ventilation tertiaire / extraction sur plages pilotées',
            source_level_capex: 'hypothesis', source_ref_capex: 'Estimation horloge, pilotage simple et raccordement',
            source_level_roi: 'hypothesis'
        },
        {
            id: 'ACT06',
            name: 'Ventilation asservie présence',
            category: 'ventilation',
            tier: 'light',
            aid_pct: 0.20,
            trigger_rules: ['vent_aux_post > 8%', 'offices or education'],
            gain_scope: 'vent_aux_post',
            gain_pct_low: 0.20, gain_pct_med: 0.30, gain_pct_high: 0.45,
            capex_low: 2000, capex_med: 5000, capex_high: 10000,
            capex_unit: '€',
            roi_method: 'simple_payback',
            aid_tags: ['CEE'],
            source_level_gain: 'source_partial', source_ref_gain: 'ADEME - Détection présence ventilation',
            source_level_capex: 'hypothesis', source_ref_capex: 'Estimation sondes + GTB',
            source_level_roi: 'hypothesis'
        },
        {
            id: 'ACT07',
            name: 'Ventilation asservie CO2 / humidité',
            category: 'ventilation',
            tier: 'heavy',
            aid_pct: 0.20,
            trigger_rules: ['vent_aux_post > 10%', 'high_occupancy'],
            gain_scope: 'vent_aux_post',
            gain_pct_low: 0.15, gain_pct_med: 0.25, gain_pct_high: 0.35,
            capex_low: 3000, capex_med: 7000, capex_high: 15000,
            capex_unit: '€',
            roi_method: 'simple_payback',
            aid_tags: ['CEE'],
            source_level_gain: 'source_partial', source_ref_gain: 'ADEME - VAV CO2',
            source_level_capex: 'hypothesis', source_ref_capex: 'Estimation sondes qualité air + régulation',
            source_level_roi: 'hypothesis'
        },
        {
            id: 'ACT08',
            name: 'Relamping LED complet',
            category: 'lighting',
            tier: 'light',
            aid_pct: 0.30,
            trigger_rules: ['lighting_post > 15%', 'no_led_done'],
            gain_scope: 'lighting_post',
            gain_pct_low: 0.45, gain_pct_med: 0.60, gain_pct_high: 0.75,
            capex_low: 15, capex_med: 30, capex_high: 45,
            capex_unit: '€/m²',
            roi_method: 'simple_payback',
            aid_tags: ['CEE'],
            aid_detail: 'CEE (fiche BAT-EQ-127) ~25-30% du CAPEX en 2026 (primes en baisse depuis 2023). TVA 20% (tertiaire).',
            source_level_gain: 'source_strong', source_ref_gain: 'ADEME - LED tertiaire, gains mesurés (plafonné 75%)',
            source_level_capex: 'source_strong', source_ref_capex: 'Prix marché LED 2025-2026',
            source_level_roi: 'hypothesis'
        },
        {
            id: 'ACT09',
            name: 'Éclairage détection présence et zonage',
            category: 'lighting',
            tier: 'light',
            aid_pct: 0.25,
            trigger_rules: ['lighting_post > 15%', 'offices or education'],
            gain_scope: 'lighting_post',
            gain_pct_low: 0.15, gain_pct_med: 0.25, gain_pct_high: 0.35,
            capex_low: 10, capex_med: 20, capex_high: 35,
            capex_unit: '€/m²',
            roi_method: 'simple_payback',
            aid_tags: ['CEE'],
            source_level_gain: 'source_partial', source_ref_gain: 'ADEME - Détection présence éclairage',
            source_level_capex: 'source_partial', source_ref_capex: 'Prix détecteurs + installation',
            source_level_roi: 'hypothesis'
        },
        {
            id: 'ACT10',
            name: 'Calorifugeage conduites ECS',
            category: 'dhw',
            tier: 'light',
            aid_pct: 0.20,
            trigger_rules: ['dhw_post > 8%', 'no_dhw_done'],
            gain_scope: 'dhw_post',
            gain_pct_low: 0.10, gain_pct_med: 0.15, gain_pct_high: 0.25,
            capex_low: 500, capex_med: 1500, capex_high: 3000,
            capex_unit: '€',
            roi_method: 'simple_payback',
            aid_tags: ['CEE'],
            source_level_gain: 'source_partial', source_ref_gain: 'ADEME - Calorifugeage ECS',
            source_level_capex: 'source_partial', source_ref_capex: 'Prix isolants + MO',
            source_level_roi: 'hypothesis'
        },
        {
            id: 'ACT11',
            name: 'Isolation ballon ECS',
            category: 'dhw',
            tier: 'light',
            aid_pct: 0.15,
            trigger_rules: ['dhw_post > 8%', 'no_dhw_done'],
            gain_scope: 'dhw_post',
            gain_pct_low: 0.08, gain_pct_med: 0.12, gain_pct_high: 0.20,
            capex_low: 200, capex_med: 500, capex_high: 1000,
            capex_unit: '€',
            roi_method: 'simple_payback',
            aid_tags: ['CEE'],
            source_level_gain: 'source_partial', source_ref_gain: 'ADEME - Isolation ballons',
            source_level_capex: 'hypothesis', source_ref_capex: 'Estimation jaquette isolante',
            source_level_roi: 'hypothesis'
        },
        {
            id: 'ACT13',
            name: 'Remplacement chaudière gaz par PAC air/eau',
            category: 'heating',
            tier: 'heavy',
            aid_pct: 0.35,
            trigger_rules: ['mainHeating === gas', 'boilerAge >= 15to20'],
            gain_scope: 'heating_post',
            gain_pct_low: 0.35, gain_pct_med: 0.50, gain_pct_high: 0.65,
            capex_low: 10000, capex_med: 19000, capex_high: 40000,
            capex_unit: '€',
            capex_method: 'pac_tranches',
            roi_method: 'simple_payback',
            aid_tags: ['CEE', 'Fonds_Chaleur_ADEME', 'MaPrimeRenov_petit_tertiaire'],
            aid_detail: 'CEE (fiche BAT-TH-102) ~15-20% + Fonds Chaleur ADEME ~15-25% si ENR. MaPrimeRenov possible petit tertiaire < 1000m2 sous conditions (parcours accompagné). Cumul plafonné 80% HT.',
            source_level_gain: 'source_strong', source_ref_gain: 'ADEME - PAC air/eau vs chaudière gaz',
            source_level_capex: 'source_partial', source_ref_capex: 'Prix marché PAC 2025-2026',
            source_level_roi: 'hypothesis'
        },
        {
            id: 'ACT14',
            name: 'Installation GTB / Supervision centralisée',
            category: 'pilotage',
            tier: 'heavy',
            aid_pct: 0.28,
            trigger_rules: ['surface > 500'],
            gain_scope: 'total',
            gain_pct_low: 0.12, gain_pct_med: 0.18, gain_pct_high: 0.22,
            capex_low: 8000, capex_med: 20000, capex_high: 45000,
            capex_unit: '€',
            capex_per_m2: 25,
            capex_min: 8000,
            roi_method: 'simple_payback',
            aid_tags: ['CEE'],
            source_level_gain: 'source_partial', source_ref_gain: 'ADEME - GTB tertiaire (gain plafonné 22%, ADEME recommande 12-18% pour GTB seule)',
            source_level_capex: 'hypothesis', source_ref_capex: 'Estimation intégrateurs GTB',
            source_level_roi: 'hypothesis'
        },
        {
            id: 'ACT15',
            name: 'Isolation thermique toiture',
            category: 'envelope_roof',
            tier: 'heavy',
            aid_pct: 0.35,
            trigger_rules: ['roofInsulation !== yes'],
            gain_scope: 'heating_post',
            gain_pct_low: 0.15, gain_pct_med: 0.20, gain_pct_high: 0.25,
            capex_low: 40, capex_med: 80, capex_high: 120,
            capex_unit: '€/m²',
            roi_method: 'simple_payback',
            aid_tags: ['CEE', 'MaPrimeRenov_petit_tertiaire'],
            aid_detail: 'CEE (fiche BAT-EN-101) ~20-25%. MaPrimeRenov possible petit tertiaire < 1000m2 sous conditions. TVA 20% (tertiaire).',
            source_level_gain: 'source_strong', source_ref_gain: 'ADEME - Isolation toiture tertiaire (plafonné 25%)',
            source_level_capex: 'source_partial', source_ref_capex: 'Prix marché isolation 2025',
            source_level_roi: 'hypothesis'
        },
        {
            id: 'ACT16',
            name: 'Isolation thermique murs extérieurs (ITE)',
            category: 'envelope_walls',
            tier: 'heavy',
            aid_pct: 0.35,
            trigger_rules: ['wallInsulation !== yes'],
            gain_scope: 'heating_post',
            gain_pct_low: 0.12, gain_pct_med: 0.18, gain_pct_high: 0.25,
            capex_low: 120, capex_med: 190, capex_high: 280,
            capex_unit: '€/m²',
            roi_method: 'simple_payback',
            aid_tags: ['CEE', 'MaPrimeRenov_petit_tertiaire'],
            aid_detail: 'CEE (fiche BAT-EN-102) ~20-25%. MaPrimeRenov possible petit tertiaire < 1000m2 sous conditions. TVA 20% (tertiaire).',
            source_level_gain: 'source_partial', source_ref_gain: 'ADEME - ITE tertiaire',
            source_level_capex: 'source_partial', source_ref_capex: 'Prix marché ITE 2025-2026',
            source_level_roi: 'hypothesis'
        },
        {
            id: 'ACT17',
            name: 'Remplacement fenêtres (double/triple vitrage)',
            category: 'envelope_windows',
            tier: 'heavy',
            aid_pct: 0.22,
            trigger_rules: [],
            gain_scope: 'heating_post',
            gain_pct_low: 0.05, gain_pct_med: 0.12, gain_pct_high: 0.15,
            capex_low: 400, capex_med: 550, capex_high: 900,
            capex_unit: '€/m² vitré',
            roi_method: 'simple_payback',
            aid_tags: ['CEE', 'MaPrimeRenov_petit_tertiaire'],
            aid_detail: 'CEE (fiche BAT-EN-104) ~12-18%. MaPrimeRenov possible petit tertiaire < 1000m2 sous conditions. TVA 20% (tertiaire).',
            source_level_gain: 'source_partial', source_ref_gain: 'ADEME - Menuiseries',
            source_level_capex: 'source_partial', source_ref_capex: 'Prix marché menuiseries 2025',
            source_level_roi: 'hypothesis'
        },
        {
            id: 'ACT18',
            name: 'Ballon ECS thermodynamique',
            category: 'dhw',
            tier: 'heavy',
            aid_pct: 0.20,
            trigger_rules: ['ecsSystem === electric_boiler'],
            gain_scope: 'dhw_post',
            gain_pct_low: 0.50, gain_pct_med: 0.60, gain_pct_high: 0.75,
            capex_low: 2500, capex_med: 4500, capex_high: 6000,
            capex_unit: '€',
            roi_method: 'simple_payback',
            aid_tags: ['CEE', 'Fonds_Chaleur_ADEME', 'MaPrimeRenov_petit_tertiaire'],
            aid_detail: 'CEE (fiche BAT-TH-148) ~15-20%. Fonds Chaleur ADEME ~15-20% si ENR. MaPrimeRenov possible petit tertiaire < 1000m2. Cumul plafonné 80% HT.',
            source_level_gain: 'source_strong', source_ref_gain: 'ADEME - Chauffe-eau thermodynamique',
            source_level_capex: 'source_partial', source_ref_capex: 'Prix marché CET 2025-2026',
            source_level_roi: 'hypothesis'
        },
        {
            id: 'ACT19',
            name: 'Free cooling / Sur-ventilation nocturne',
            category: 'cooling',
            tier: 'light',
            aid_pct: 0.10,
            trigger_rules: ['hasCooling === true'],
            gain_scope: 'cooling_post',
            gain_pct_low: 0.15, gain_pct_med: 0.25, gain_pct_high: 0.40,
            capex_low: 500, capex_med: 2000, capex_high: 5000,
            capex_unit: '€',
            roi_method: 'simple_payback',
            aid_tags: [],
            source_level_gain: 'hypothesis', source_ref_gain: 'Estimation produit',
            source_level_capex: 'hypothesis', source_ref_capex: 'Estimation automatisation',
            source_level_roi: 'hypothesis'
        },
        {
            id: 'ACT20',
            name: 'Récupération chaleur sur groupe froid',
            category: 'heating',
            tier: 'heavy',
            aid_pct: 0.28,
            trigger_rules: ['hasCooling === true'],
            gain_scope: 'dhw_post',
            gain_pct_low: 0.30, gain_pct_med: 0.50, gain_pct_high: 0.70,
            capex_low: 3000, capex_med: 8000, capex_high: 15000,
            capex_unit: '€',
            roi_method: 'simple_payback',
            aid_tags: ['CEE'],
            source_level_gain: 'source_partial', source_ref_gain: 'ADEME - Récupération chaleur froid commercial',
            source_level_capex: 'hypothesis', source_ref_capex: 'Estimation échangeur + installation',
            source_level_roi: 'hypothesis'
        },
        {
            id: 'ACT21',
            name: 'Comptage intelligent / Sous-comptage',
            category: 'pilotage',
            tier: 'light',
            aid_pct: 0.15,
            trigger_rules: ['surface > 300'],
            gain_scope: 'total',
            gain_pct_low: 0.03, gain_pct_med: 0.05, gain_pct_high: 0.08,
            capex_low: 1000, capex_med: 3000, capex_high: 8000,
            capex_unit: '€',
            roi_method: 'simple_payback',
            aid_tags: [],
            source_level_gain: 'hypothesis', source_ref_gain: 'Estimation effet comportemental',
            source_level_capex: 'hypothesis', source_ref_capex: 'Prix compteurs communicants',
            source_level_roi: 'hypothesis'
        },
        {
            id: 'ACT22',
            name: 'Installation photovoltaïque en autoconsommation',
            category: 'production',
            tier: 'heavy',
            aid_pct: 0.10,
            trigger_rules: ['surface > 100', 'roofType !== none'],
            gain_scope: 'elec_post',
            gain_pct_low: 0.10, gain_pct_med: 0.20, gain_pct_high: 0.30,
            capex_low: 8000, capex_med: 15000, capex_high: 30000,
            capex_unit: '€',
            capex_per_kwc: 1200,
            roi_method: 'simple_payback',
            aid_tags: [],
            source_level_gain: 'source_partial', source_ref_gain: 'PVGIS (JRC) + arrêté S21 du 26 mars 2025',
            source_level_capex: 'source_partial', source_ref_capex: 'Prix marché PV 2025 — 1,20€/Wc installé',
            source_level_roi: 'hypothesis'
        }
    ]
};

/* ═══════════════════════════════════════════════════════════════════════════
   EXPORTS POUR INTÉGRATION
   ═══════════════════════════════════════════════════════════════════════════ */

// Ces tables sont prêtes à être utilisées dans newDiagnosticBuildReportData()

/* ═══════════════════════════════════════════════════════════════════════════
   PHASE 3 : MOTEUR DE CALCUL - PIPELINE COMPLET
   
   Pipeline :
   1. Normalisation inputs
   2. Conversion € → kWh (avec option B : déduction abonnement)
   3. Calcul intensité kWh/m²/an
   4. Benchmark vs activité (+ mix si applicable)
   5. Répartition postes (usage_breakdowns)
   6. Déclenchement actions (règles + exclusions)
   7. Calcul gains/économies/ROI (par poste si applicable)
   8. Tri actions (impact + faisabilité)
   9. Output payload standardisé avec unités partout
   
   ═══════════════════════════════════════════════════════════════════════════ */

/* ─────────────────────────────────────────────────────────────────────────
   HELPERS : CONVERSION € → kWh (OPTION B)
   ───────────────────────────────────────────────────────────────────────── */

const newDiagnosticConvertEuroToKwh = (energy, formData) => {
    const isElec = energy === 'elec';
    const priceDefault = isElec
        ? NEW_DIAGNOSTIC_ENERGY_PRICES.electricity.price_default_eur_kwh
        : NEW_DIAGNOSTIC_ENERGY_PRICES.gas.price_default_eur_kwh;

    const kwh = formData[`${energy}Kwh`];
    const euro = formData[`${energy}Euro`];
    const includesSubscription = formData[`${energy}IncludesSubscription`];
    const subscriptionYearly = formData[`${energy}SubscriptionYearly`];

    // Priorité 1 : kWh saisis
    if (kwh && parseFloat(kwh) > 0) {
        return {
            value: parseFloat(kwh),
            method: 'kwh_provided',
            price_used: null
        };
    }

    // Priorité 2 : Conversion depuis €
    if (euro && parseFloat(euro) > 0) {
        let montantEnergie = parseFloat(euro);

        // Option B : Déduction abonnement si renseigné
        if (includesSubscription && subscriptionYearly && parseFloat(subscriptionYearly) > 0) {
            montantEnergie = Math.max(montantEnergie - parseFloat(subscriptionYearly), 0);
        }

        const kwhEstimated = montantEnergie / priceDefault;

        return {
            value: Math.round(kwhEstimated),
            method: includesSubscription && subscriptionYearly
                ? 'euro_converted_subscription_deducted'
                : 'euro_converted_default_price',
            price_used: priceDefault
        };
    }

    return {
        value: 0,
        method: 'none',
        price_used: null
    };
};

/* ─────────────────────────────────────────────────────────────────────────
   HELPERS : BENCHMARK & MIX USAGE
   ───────────────────────────────────────────────────────────────────────── */

const newDiagnosticGetBenchmark = (activity, formData) => {
    // Si usage mixte, pondération par les pourcentages du slider
    if (activity === 'mixed') {
        const u1 = (formData && formData.mixedUsage1) || 'offices';
        const u2 = (formData && formData.mixedUsage2) || 'retail';
        const p1 = (formData && formData.mixOfficesPct) / 100 || 0.5;
        const p2 = (formData && formData.mixRetailPct) / 100 || 0.5;
        const data1 = NEW_DIAGNOSTIC_BENCHMARKS_INTENSITY[u1] || NEW_DIAGNOSTIC_BENCHMARKS_INTENSITY.offices;
        const data2 = NEW_DIAGNOSTIC_BENCHMARKS_INTENSITY[u2] || NEW_DIAGNOSTIC_BENCHMARKS_INTENSITY.retail;

        return {
            median_kwh_m2_an: Math.round(data1.median_kwh_m2_an * p1 + data2.median_kwh_m2_an * p2),
            low_kwh_m2_an: Math.round(data1.low_kwh_m2_an * p1 + data2.low_kwh_m2_an * p2),
            high_kwh_m2_an: Math.round(data1.high_kwh_m2_an * p1 + data2.high_kwh_m2_an * p2),
            source_level: 'hypothesis',
            source_ref: `Pondération ${Math.round(p1 * 100)}/${Math.round(p2 * 100)} : ${u1} + ${u2}`,
            is_mixed: true
        };
    }

    // Activité simple
    const benchmark = NEW_DIAGNOSTIC_BENCHMARKS_INTENSITY[activity];
    if (!benchmark) {
        return {
            median_kwh_m2_an: 200,
            low_kwh_m2_an: 150,
            high_kwh_m2_an: 280,
            source_level: 'hypothesis',
            source_ref: 'Fallback générique',
            is_mixed: false
        };
    }

    return { ...benchmark, is_mixed: false };
};

const newDiagnosticGetUsageBreakdown = (activity, formData) => {
    // Si usage mixte, pondération par les pourcentages du slider
    if (activity === 'mixed') {
        const u1 = (formData && formData.mixedUsage1) || 'offices';
        const u2 = (formData && formData.mixedUsage2) || 'retail';
        const p1 = (formData && formData.mixOfficesPct) / 100 || 0.5;
        const p2 = (formData && formData.mixRetailPct) / 100 || 0.5;
        const data1 = NEW_DIAGNOSTIC_USAGE_BREAKDOWNS[u1] || NEW_DIAGNOSTIC_USAGE_BREAKDOWNS.offices;
        const data2 = NEW_DIAGNOSTIC_USAGE_BREAKDOWNS[u2] || NEW_DIAGNOSTIC_USAGE_BREAKDOWNS.retail;

        const h = Math.round(data1.heating_pct * p1 + data2.heating_pct * p2);
        const c = Math.round(data1.cooling_pct * p1 + data2.cooling_pct * p2);
        const v = Math.round(data1.vent_aux_pct * p1 + data2.vent_aux_pct * p2);
        const l = Math.round(data1.lighting_pct * p1 + data2.lighting_pct * p2);
        const d = Math.round(data1.dhw_pct * p1 + data2.dhw_pct * p2);
        const k = Math.round(data1.cooking_pct * p1 + data2.cooking_pct * p2);
        // other absorbe le résidu d'arrondi pour garantir 100%
        const o = Math.max(0, 100 - h - c - v - l - d - k);

        return {
            heating_pct: h,
            cooling_pct: c,
            vent_aux_pct: v,
            lighting_pct: l,
            dhw_pct: d,
            cooking_pct: k,
            other_specific_pct: o,
            source_level: 'hypothesis',
            source_ref: `Pondération ${Math.round(p1 * 100)}/${Math.round(p2 * 100)} : ${u1} + ${u2}`,
            breakdown_mode: 'coarse_statistical'
        };
    }

    // Activité simple
    const breakdown = NEW_DIAGNOSTIC_USAGE_BREAKDOWNS[activity];
    if (!breakdown) {
        return {
            heating_pct: 45,
            cooling_pct: 5,
            vent_aux_pct: 10,
            lighting_pct: 20,
            dhw_pct: 5,
            cooking_pct: 0,
            other_specific_pct: 15,
            source_level: 'hypothesis',
            source_ref: 'Fallback générique',
            breakdown_mode: 'coarse_statistical'
        };
    }

    return breakdown;
};

/* ─────────────────────────────────────────────────────────────────────────
   HELPERS : ACTIONS & GAINS
   ───────────────────────────────────────────────────────────────────────── */

const NEW_DIAGNOSTIC_ACTION_ENERGY_MAP = {
    heating: 'heating_energy',
    heating_structural: 'heating_energy',
    dhw: 'heating_energy',
    dhw_structural: 'heating_energy',
    envelope: 'heating_energy',
    envelope_roof: 'heating_energy',
    envelope_walls: 'heating_energy',
    lighting: 'elec',
    ventilation: 'elec',
    ventilation_structural: 'elec',
    cooling: 'elec',
    cold_commercial: 'elec',
    cold_maintenance: 'elec',
    production: 'elec',
    automation: 'elec',
};

const NEW_DIAGNOSTIC_PV_SELF_CONSUMPTION_BY_ACTIVITY = {
    offices: 0.65,
    retail: 0.68,
    hotel: 0.76,
    restaurant: 0.79,
    commerce_alim: 0.82,
    health_local: 0.75,
    education: 0.64,
    light_warehouse: 0.48
};

const NEW_DIAGNOSTIC_PV_DEFAULT_YIELD_KWH_PER_KWC = 1220;
const NEW_DIAGNOSTIC_PV_BUILDING_SURPLUS_TARIFF_EUR_KWH = {
    le9: 0.0400,    // CRE S21 T2 2026 — stable depuis T3 2025
    le100: 0.0473   // CRE S21 T2 2026 — anciennement 0.0761, baissé significativement
};
const NEW_DIAGNOSTIC_PV_YIELD_BY_DEPARTMENT = [
    { prefixes: ['20'], yield: 1450 },
    { prefixes: ['06', '11', '13', '30', '34', '66', '83'], yield: 1380 },
    { prefixes: ['09', '31', '32', '33', '40', '64', '65'], yield: 1330 },
    { prefixes: ['12', '16', '17', '18', '19', '23', '24', '46', '47', '79', '81', '82', '86', '87'], yield: 1270 },
    { prefixes: ['03', '04', '05', '07', '15', '21', '25', '26', '38', '39', '42', '43', '48', '58', '63', '69', '70', '71', '73', '74', '84', '90'], yield: 1210 },
    { prefixes: ['14', '22', '27', '28', '29', '35', '36', '37', '41', '44', '45', '49', '50', '53', '56', '61', '72', '76', '85', '89'], yield: 1160 },
    { prefixes: ['02', '08', '10', '51', '52', '54', '55', '57', '59', '60', '62', '67', '68', '77', '78', '80', '88', '91', '92', '93', '94', '95'], yield: 1110 }
];

/* ─────────────────────────────────────────────────────────────────────────
   TABLE : RÉPARTITION GAZ PAR ACTIVITÉ
   Comment le gaz se distribue entre chauffage et ECS.
   Source : CEREN 2019 + ADEME répartition usages tertiaire
   Note : le gaz ne sert physiquement QU'au chauffage et à l'ECS
   ───────────────────────────────────────────────────────────────────────── */
const NEW_DIAGNOSTIC_GAS_SPLIT_BY_ACTIVITY = {
    offices: { heating_pct: 88, ecs_pct: 12 },
    bureau: { heating_pct: 88, ecs_pct: 12 },
    retail: { heating_pct: 92, ecs_pct: 8 },
    commerce_non_alim: { heating_pct: 92, ecs_pct: 8 },
    hotel: { heating_pct: 60, ecs_pct: 40 },
    restaurant: { heating_pct: 65, ecs_pct: 35 },
    restauration: { heating_pct: 65, ecs_pct: 35 },
    education: { heating_pct: 90, ecs_pct: 10 },
    enseignement: { heating_pct: 90, ecs_pct: 10 },
    health_local: { heating_pct: 78, ecs_pct: 22 },
    sante: { heating_pct: 78, ecs_pct: 22 },
    light_warehouse: { heating_pct: 95, ecs_pct: 5 },
    entrepot_non_chauffe: { heating_pct: 95, ecs_pct: 5 },
    entrepot_chauffe: { heating_pct: 95, ecs_pct: 5 },
    warehouse_heated: { heating_pct: 95, ecs_pct: 5 },
    commerce_alim: { heating_pct: 90, ecs_pct: 10 },
    retail_food: { heating_pct: 90, ecs_pct: 10 }
};

/* ─────────────────────────────────────────────────────────────────────────
   TABLE : RÉPARTITION ÉLECTRICITÉ NON-THERMIQUE PAR ACTIVITÉ
   % appliqués à l'élec HORS chauffage et ECS (déjà déduits)
   Source : ADEME chiffres clés 2018, CEREN répartition usages élec tertiaire
   Note : "other" inclut bureautique, froid commercial, cuisson élec, process
   ───────────────────────────────────────────────────────────────────────── */
const NEW_DIAGNOSTIC_ELEC_SPLIT_BY_ACTIVITY = {
    offices: { lighting_pct: 30, cooling_pct: 18, ventilation_pct: 15, other_pct: 37 },
    bureau: { lighting_pct: 30, cooling_pct: 18, ventilation_pct: 15, other_pct: 37 },
    retail: { lighting_pct: 48, cooling_pct: 15, ventilation_pct: 10, other_pct: 27 },
    commerce_non_alim: { lighting_pct: 48, cooling_pct: 15, ventilation_pct: 10, other_pct: 27 },
    hotel: { lighting_pct: 28, cooling_pct: 12, ventilation_pct: 18, other_pct: 42 },
    restaurant: { lighting_pct: 20, cooling_pct: 8, ventilation_pct: 22, other_pct: 50 },
    restauration: { lighting_pct: 20, cooling_pct: 8, ventilation_pct: 22, other_pct: 50 },
    education: { lighting_pct: 35, cooling_pct: 5, ventilation_pct: 15, other_pct: 45 },
    enseignement: { lighting_pct: 35, cooling_pct: 5, ventilation_pct: 15, other_pct: 45 },
    health_local: { lighting_pct: 25, cooling_pct: 15, ventilation_pct: 30, other_pct: 30 },
    sante: { lighting_pct: 25, cooling_pct: 15, ventilation_pct: 30, other_pct: 30 },
    light_warehouse: { lighting_pct: 60, cooling_pct: 0, ventilation_pct: 8, other_pct: 32 },
    entrepot_non_chauffe: { lighting_pct: 60, cooling_pct: 0, ventilation_pct: 8, other_pct: 32 },
    entrepot_chauffe: { lighting_pct: 45, cooling_pct: 0, ventilation_pct: 10, other_pct: 45 },
    warehouse_heated: { lighting_pct: 45, cooling_pct: 0, ventilation_pct: 10, other_pct: 45 },
    // commerce_alim : froid commercial dans "other" (usage spécifique, pas climato de confort)
    commerce_alim: { lighting_pct: 25, cooling_pct: 5, ventilation_pct: 8, other_pct: 62 },
    retail_food: { lighting_pct: 25, cooling_pct: 5, ventilation_pct: 8, other_pct: 62 }
};

/* ─────────────────────────────────────────────────────────────────────────
   NOUVELLE FONCTION PRINCIPALE : SÉPARATION FLUX ÉLEC / GAZ
   Remplace la logique totalKwh + breakdown%.
   Principe : le gaz ne chauffe que (chauffage + ECS).
              l'élec alimente tout le reste.
   ───────────────────────────────────────────────────────────────────────── */
const newDiagnosticSplitByEnergySource = (formData, elecKwh, gasKwh, activity) => {
    const elec = Math.max(0, elecKwh || 0);
    const gas = Math.max(0, gasKwh || 0);
    const totalKwh = elec + gas;
    const mainHeating = formData.mainHeating || 'gas';

    // ──────────────────────────────────────────────────────────────────
    // ÉTAPE 1 : Répartition de RÉFÉRENCE du secteur (fixe)
    // ──────────────────────────────────────────────────────────────────
    const ref = newDiagnosticGetUsageBreakdown(activity, formData);
    const heatingPct = ref.heating_pct || 0;
    const ecsPct = ref.dhw_pct || 0;
    const lightingPct = ref.lighting_pct || 0;
    const coolingPct = ref.cooling_pct || 0;
    const ventPct = ref.vent_aux_pct || 0;
    const cookingPct = ref.cooking_pct || 0;
    const otherPct = ref.other_specific_pct || 0;

    // Garde-fou : vérifier que la table totalise 100%
    const sumPct = heatingPct + ecsPct + lightingPct + coolingPct + ventPct + cookingPct + otherPct;
    if (Math.abs(sumPct - 100) > 1) {
        console.warn(`[DiagTertiaire] Table breakdown "${activity}" totalise ${sumPct}% au lieu de 100%. Résultats potentiellement incohérents.`);
    }

    // ──────────────────────────────────────────────────────────────────
    // ÉTAPE 2 : kWh par poste via SÉPARATION PAR SOURCE
    // Le gaz ne sert qu'au chauffage + ECS (table GAS_SPLIT).
    // L'élec non-thermique est répartie via ELEC_SPLIT_BY_ACTIVITY.
    // Les % globaux (USAGE_BREAKDOWNS) restent exposés en breakdown_pct
    // pour affichage pédagogique, mais les kWh réels viennent des splits.
    // ──────────────────────────────────────────────────────────────────

    // --- GAZ : chauffage + ECS ---
    const gasSplit = NEW_DIAGNOSTIC_GAS_SPLIT_BY_ACTIVITY[activity]
        || NEW_DIAGNOSTIC_GAS_SPLIT_BY_ACTIVITY.offices;
    const gasHeatingKwh = Math.round(gas * (gasSplit.heating_pct || 88) / 100);
    const gasEcsKwh = Math.max(0, gas - gasHeatingKwh);

    // --- Chauffage et ECS : gaz ou élec selon source déclarée ---
    const heatingIsGasPreCalc = ['gas', 'fuel', 'other', 'network'].includes(mainHeating);
    let heatingKwh, ecsKwh, elecForHeating, elecForEcs;

    if (heatingIsGasPreCalc && gas > 0) {
        // Chauffage et ECS principalement gaz
        heatingKwh = gasHeatingKwh;
        ecsKwh = gasEcsKwh;
        elecForHeating = 0;
        elecForEcs = 0;
    } else {
        // Chauffage électrique : estimer via % globaux sur totalKwh
        heatingKwh = Math.round(totalKwh * heatingPct / 100);
        ecsKwh = Math.round(totalKwh * ecsPct / 100);
        elecForHeating = heatingKwh;
        elecForEcs = ecsKwh;
    }

    // --- ÉLEC non-thermique : répartition via ELEC_SPLIT_BY_ACTIVITY ---
    const elecNonThermal = Math.max(0, elec - elecForHeating - elecForEcs);
    const elecSplit = NEW_DIAGNOSTIC_ELEC_SPLIT_BY_ACTIVITY[activity]
        || NEW_DIAGNOSTIC_ELEC_SPLIT_BY_ACTIVITY.offices;
    const lightingKwh = Math.round(elecNonThermal * (elecSplit.lighting_pct || 30) / 100);
    const coolingKwh = Math.round(elecNonThermal * (elecSplit.cooling_pct || 10) / 100);
    const ventKwh = Math.round(elecNonThermal * (elecSplit.ventilation_pct || 15) / 100);
    const cookingKwh = Math.round(totalKwh * cookingPct / 100);
    // "other" absorbe le résidu pour garantir la conservation
    const otherKwh = Math.max(0, totalKwh - heatingKwh - ecsKwh - lightingKwh
        - coolingKwh - ventKwh - cookingKwh);

    // ──────────────────────────────────────────────────────────────────
    // ÉTAPE 3 : Déterminer la SOURCE de chaque poste
    // ──────────────────────────────────────────────────────────────────

    // Source du chauffage
    const heatingIsGas = ['gas', 'fuel', 'other', 'network'].includes(mainHeating);
    const heatingIsElec = ['electric', 'pac'].includes(mainHeating);
    const heatingIsNetwork = mainHeating === 'network';

    // Source de l'ECS
    const ecsSameAsHeating = formData.ecsSameSystem !== false;
    let ecsSource;
    if (ecsSameAsHeating) {
        ecsSource = heatingIsGas ? (heatingIsNetwork ? 'network' : 'gas') : 'elec';
    } else {
        const ecsSystem = formData.ecsSystem || '';
        if (['gas_boiler', 'gas_instant'].includes(ecsSystem)) {
            ecsSource = 'gas';
        } else if (['electric_boiler', 'heat_pump'].includes(ecsSystem)) {
            ecsSource = 'elec';
        } else if (['solar'].includes(ecsSystem)) {
            ecsSource = 'solar';
        } else if (['network_dedicated'].includes(ecsSystem)) {
            ecsSource = 'network';
        } else {
            ecsSource = 'elec'; // fallback
        }
    }

    // Source du chauffage (simplifiée pour le prix)
    const heatingSource = heatingIsNetwork ? 'network'
        : heatingIsGas ? 'gas' : 'elec';

    // ──────────────────────────────────────────────────────────────────
    // ÉTAPE 4 : Prix par poste selon la source
    // ──────────────────────────────────────────────────────────────────
    const PRICE = {
        elec: NEW_DIAGNOSTIC_ENERGY_PRICES.electricity.price_default_eur_kwh,
        gas: NEW_DIAGNOSTIC_ENERGY_PRICES.gas.price_default_eur_kwh,
        network: NEW_DIAGNOSTIC_ENERGY_PRICES.heat_network.price_default_eur_kwh,
        solar: 0.02  // quasi gratuit, maintenance seule (pas de table centralisée pour solaire thermique)
    };

    let heatingPrice = PRICE[heatingSource] || PRICE.gas;
    let ecsPrice = PRICE[ecsSource] || PRICE.elec;

    // Ajuster le prix si chauffage fioul
    if (mainHeating === 'fuel' || mainHeating === 'fioul') {
        const fuelPrice = NEW_DIAGNOSTIC_ENERGY_PRICES.fuel_oil.price_default_eur_kwh;
        if (heatingSource === 'gas') heatingPrice = fuelPrice;
        if (ecsSource === 'gas' && ecsSameAsHeating) ecsPrice = fuelPrice;
    }

    // Postes toujours électriques
    const elecPrice = PRICE.elec;

    // ──────────────────────────────────────────────────────────────────
    // ÉTAPE 5 : Vérification de cohérence (warning, pas bloquant)
    // ──────────────────────────────────────────────────────────────────
    // Calculer combien de kWh "devraient" être gaz vs élec selon les sources
    const kwhOnGas = (heatingSource === 'gas' || heatingSource === 'network' ? heatingKwh : 0)
        + (ecsSource === 'gas' || ecsSource === 'network' ? ecsKwh : 0);
    const kwhOnElec = totalKwh - kwhOnGas
        - (ecsSource === 'solar' ? ecsKwh : 0);

    // Warning si la répartition théorique dépasse les kWh déclarés par source
    const warnings = [];
    if (gas > 0 && kwhOnGas > gas * 1.3) {
        warnings.push(`Les postes gaz estimés (${kwhOnGas} kWh) dépassent le gaz déclaré (${gas} kWh). La répartition sectorielle peut être approximative pour ce bâtiment.`);
    }
    if (elec > 0 && kwhOnElec > elec * 1.3) {
        warnings.push(`Les postes élec estimés (${kwhOnElec} kWh) dépassent l'élec déclaré (${elec} kWh). La répartition sectorielle peut être approximative pour ce bâtiment.`);
    }
    if (warnings.length > 0) {
        console.warn('[DiagTertiaire] Cohérence énergétique :', warnings.join(' | '));
    }

    // ──────────────────────────────────────────────────────────────────
    // RETOUR
    // ──────────────────────────────────────────────────────────────────
    return {
        elecKwh: elec,
        gasKwh: gas,
        totalKwh,

        posts: {
            heating: { kwh: heatingKwh, source: heatingSource, pricePerKwh: heatingPrice },
            ecs: { kwh: ecsKwh, source: ecsSource, pricePerKwh: ecsPrice },
            lighting: { kwh: lightingKwh, source: 'elec', pricePerKwh: elecPrice },
            cooling: { kwh: coolingKwh, source: 'elec', pricePerKwh: elecPrice },
            ventilation: { kwh: ventKwh, source: 'elec', pricePerKwh: elecPrice },
            cooking: { kwh: cookingKwh, source: 'elec', pricePerKwh: elecPrice },
            other: { kwh: otherKwh, source: 'elec', pricePerKwh: elecPrice }
        },

        // Pourcentages = TOUJOURS les % de référence du secteur
        breakdown_pct: {
            heating_pct: heatingPct,
            dhw_pct: ecsPct,
            lighting_pct: lightingPct,
            cooling_pct: coolingPct,
            vent_aux_pct: ventPct,
            cooking_pct: cookingPct,
            other_specific_pct: otherPct
        },

        heatingSource,
        ecsSource,
        warnings
    };
};

/* ─────────────────────────────────────────────────────────────────────────
   HELPER PV : CIBLE ÉLEC POST-TRAVAUX
   Si PAC recommandée, la conso élec augmente → PV dimensionné sur la vraie
   consommation future.
   ───────────────────────────────────────────────────────────────────────── */
const newDiagnosticEstimatePvSizing = (splitResult, topActions) => {
    let targetElecKwh = splitResult.elecKwh;

    // Si PAC dans les actions : la conso élec augmente
    const pacAction = (topActions || []).find(a => a.id === 'ACT13');
    if (pacAction && pacAction.energy_switch && pacAction.energy_switch_detail) {
        // Utiliser directement la nouvelle conso calculée par la bascule
        targetElecKwh = splitResult.elecKwh + pacAction.energy_switch_detail.new_kwh;
    } else if (pacAction && splitResult.heatingSource === 'gas') {
        // Fallback ancien calcul
        const heatingGasKwh = splitResult.posts.heating.kwh;
        targetElecKwh = splitResult.elecKwh + Math.round(heatingGasKwh / 3.5);
    }

    // Si CET (ACT18) dans les actions et ECS gaz
    const cetAction = (topActions || []).find(a => a.id === 'ACT18');
    if (cetAction && cetAction.energy_switch && cetAction.energy_switch_detail) {
        targetElecKwh += cetAction.energy_switch_detail.new_kwh;
    }

    return Math.max(1, targetElecKwh);
};

const newDiagnosticClamp = (value, min, max) => Math.min(max, Math.max(min, value));

const newDiagnosticExtractPostalPrefix = (postalCode) => String(postalCode || '').trim().slice(0, 2);

const newDiagnosticEstimatePhotovoltaicYield = (formData) => {
    const lat = Number(formData?.lat);
    const lon = Number(formData?.lon);
    const postalPrefix = newDiagnosticExtractPostalPrefix(formData?.postalCode);
    const deptRule = NEW_DIAGNOSTIC_PV_YIELD_BY_DEPARTMENT.find(rule => rule.prefixes.includes(postalPrefix));
    const byDepartment = deptRule?.yield || NEW_DIAGNOSTIC_PV_DEFAULT_YIELD_KWH_PER_KWC;

    // Approximation locale bornée sur les ordres de grandeur PVGIS (JRC / Commission européenne).
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
        return byDepartment;
    }

    const latitudeComponent = (48.5 - lat) * 55;
    const mediterraneanBoost = lon > 2 && lat < 45.8 ? 55 : 0;
    const southWestBoost = lon < 0.5 && lat < 45.8 ? 32 : 0;
    const northEastPenalty = lon > 5 && lat > 46.5 ? -18 : 0;
    const corsicaBoost = postalPrefix === '20' ? 80 : 0;
    const byCoordinates = newDiagnosticClamp(
        Math.round(1180 + latitudeComponent + mediterraneanBoost + southWestBoost + northEastPenalty + corsicaBoost),
        1050,
        1450
    );

    return Math.round((byCoordinates * 0.65) + (byDepartment * 0.35));
};

const newDiagnosticEstimateSiteElectricityKwh = (formData, totalKwh, breakdown) => {
    const explicitElecKwh = formData?.elecUsed ? (parseFloat(formData?.elecKwh || 0) || 0) : 0;
    const heatingOnElectricity = formData?.mainHeating === 'electric' ? (breakdown?.heating_pct || 0) : 0;
    const dhwOnElectricity = (
        (!formData?.ecsSameSystem && formData?.ecsSystem === 'electric_boiler')
        || (formData?.ecsSameSystem && formData?.mainHeating === 'electric')
    ) ? (breakdown?.dhw_pct || 0) : 0;

    const inferredElectricSharePct = (breakdown?.cooling_pct || 0)
        + (breakdown?.vent_aux_pct || 0)
        + (breakdown?.lighting_pct || 0)
        + (breakdown?.other_specific_pct || 0)
        + (breakdown?.cooking_pct || 0)
        + heatingOnElectricity
        + dhwOnElectricity;

    const inferredElectricShare = newDiagnosticClamp(inferredElectricSharePct / 100, 0.22, 0.95);
    const inferredElecKwh = totalKwh * inferredElectricShare;

    return explicitElecKwh > 0 ? explicitElecKwh : Math.round(inferredElecKwh);
};

const newDiagnosticEstimatePhotovoltaicAutoconsumptionRate = (formData) => {
    const activity = formData?.activity || 'offices';
    if (activity !== 'mixed') {
        return NEW_DIAGNOSTIC_PV_SELF_CONSUMPTION_BY_ACTIVITY[activity] || 0.65;
    }

    const mixedActivities = [formData?.mixedUsage1, formData?.mixedUsage2].filter(Boolean);
    if (!mixedActivities.length) {
        return 0.65;
    }

    const averageRate = mixedActivities.reduce((sum, current) => (
        sum + (NEW_DIAGNOSTIC_PV_SELF_CONSUMPTION_BY_ACTIVITY[current] || 0.65)
    ), 0) / mixedActivities.length;

    return Math.round(averageRate * 100) / 100;
};

const newDiagnosticGetPhotovoltaicSurplusTariff = (installedKwc) => (
    installedKwc <= 9
        ? NEW_DIAGNOSTIC_PV_BUILDING_SURPLUS_TARIFF_EUR_KWH.le9
        : NEW_DIAGNOSTIC_PV_BUILDING_SURPLUS_TARIFF_EUR_KWH.le100
);

const newDiagnosticEstimatePhotovoltaicScenario = ({ action, totalKwh, breakdown, surface, formData, ePrices }) => {
    const safeSurface = Math.max(1, Number(surface || formData?.surface || 100));
    const levels = Math.max(1, parseInt(formData?.levels || 1, 10) || 1);
    const roofSurface = safeSurface / levels;
    const _roofType = formData?.roofType || 'flat';
    const usableRoofRatio = _roofType === 'flat' ? 0.60 : 0.48;
    const usableRoofSurface = Math.max(0, roofSurface * usableRoofRatio);
    const _getRoofCoeff = (rt, ro) => {
        if (rt === 'none') return 0;
        if (rt === 'flat') return ROOF_TYPE_COEFF.flat;
        if (rt === 'pitched') {
            if (ro === 'south') return ROOF_TYPE_COEFF.pitched_south;
            if (ro === 'east') return ROOF_TYPE_COEFF.pitched_east;
            if (ro === 'west') return ROOF_TYPE_COEFF.pitched_west;
            if (ro === 'north') return ROOF_TYPE_COEFF.pitched_north;
            return ROOF_TYPE_COEFF.pitched_unknown;
        }
        return 0.85;
    };
    const _roofCoeff = _getRoofCoeff(_roofType, formData?.roofOrientation || '');
    const roofLimitedKwc = usableRoofSurface * 0.20;
    const localYieldKwhPerKwc = newDiagnosticEstimatePhotovoltaicYield(formData) * _roofCoeff;
    // Cible élec post-travaux (si PAC recommandée, la conso élec augmente)
    // Note : à ce stade l'appel vient de calculateActionGain qui passe splitResult via ePrices.targetElecKwh
    const estimatedSiteElectricityKwh = Math.max(1,
        ePrices && ePrices.targetElecKwh
            ? ePrices.targetElecKwh
            : newDiagnosticEstimateSiteElectricityKwh(formData, totalKwh, breakdown)
    );
    // Réduire le facteur de dimensionnement si autoconsommation attendue faible
    const autoRate = newDiagnosticEstimatePhotovoltaicAutoconsumptionRate(formData);
    const sizingFactor = autoRate < 0.55 ? 0.75 : 0.90;
    const loadLimitedKwc = localYieldKwhPerKwc > 0 ? (estimatedSiteElectricityKwh * sizingFactor) / localYieldKwhPerKwc : roofLimitedKwc;
    const installedKwc = Math.round(newDiagnosticClamp(Math.min(roofLimitedKwc, loadLimitedKwc, 100), 0.5, 100) * 10) / 10;
    const annualProductionKwh = Math.max(0, Math.round(installedKwc * localYieldKwhPerKwc));
    const autoconsumedKwh = Math.max(0, Math.round(Math.min(annualProductionKwh * autoRate, estimatedSiteElectricityKwh * 0.95)));
    const surplusSoldKwh = Math.max(0, annualProductionKwh - autoconsumedKwh);
    const surplusTariff = newDiagnosticGetPhotovoltaicSurplusTariff(installedKwc);
    const selfConsumptionSavingsEuro = autoconsumedKwh * ePrices.elec;
    const surplusRevenueEuro = surplusSoldKwh * surplusTariff;
    const totalGainEuro = Math.round(selfConsumptionSavingsEuro + surplusRevenueEuro);
    const newDiagnosticGetPvCapexPerKwc = (kwc) => {
        if (kwc <= 9) return 1400;
        if (kwc <= 36) return 1200;
        return 1050; // 36-100 kWc
    };
    const capexPerKwc = newDiagnosticGetPvCapexPerKwc(installedKwc);
    const capex = Math.round(installedKwc * capexPerKwc);

    const newDiagnosticGetPvAutoconoPrime = (kwc) => {
        if (kwc <= 9) return 80;    // €/kWc — CRE T1-T2 2026 (arrêté 26 mars 2025)
        if (kwc <= 36) return 120;  // €/kWc -- CRE T2 2026 (corrige, ancienne valeur 70 fausse)
        return 60;                  // 36-100 kWc — CRE T2 2026
    };
    const primePerKwc = newDiagnosticGetPvAutoconoPrime(installedKwc);
    const aidAmount = Math.round(installedKwc * primePerKwc);
    const capexNet = Math.max(0, capex - aidAmount);
    const aidPct = capex > 0 ? aidAmount / capex : 0;
    const roiYears = totalGainEuro > 0 ? Math.round((capexNet / totalGainEuro) * 10) / 10 : null;
    const hypothesisLabel = `Hypothèse de calcul : productible local ~${newDiagnosticFormatInteger(localYieldKwhPerKwc)} kWh/kWc/an, autoconsommation ${newDiagnosticFormatInteger(autoRate * 100)} %, surplus valorisé à ${newDiagnosticFormatDecimal(surplusTariff, 3)} €/kWh.`;

    return {
        gainKwh: autoconsumedKwh,
        gainEuro: totalGainEuro,
        capex,
        capexNet,
        aidAmount,
        aidPct,
        roi_years: roiYears,
        gain_pct_total: totalKwh > 0 ? autoconsumedKwh / totalKwh : 0,
        extraAnnualRevenueEuro: Math.round(surplusRevenueEuro),
        pv_hypothesis: hypothesisLabel,
        energy_switch_note: `Productible local estimé : ${newDiagnosticFormatInteger(localYieldKwhPerKwc)} kWh/kWc/an. ${newDiagnosticFormatInteger(autoconsumedKwh)} kWh valorisés sur site et ${newDiagnosticFormatInteger(surplusSoldKwh)} kWh revendus en surplus.`,
        pv_production_kwh_an: annualProductionKwh,
        pv_surplus_kwh_an: surplusSoldKwh,
        pv_surplus_revenue_euro_an: Math.round(surplusRevenueEuro),
        pv_autoconsumption_rate: Math.round(autoRate * 100),
        pv_local_yield_kwh_kwc: localYieldKwhPerKwc,
        pv_installed_kwc: installedKwc
    };
};

const newDiagnosticCalculateActionGain = (action, splitResult, surface, formData, energyPrices) => {
    const ePrices = energyPrices || { elec: NEW_DIAGNOSTIC_ENERGY_PRICES.electricity.price_default_eur_kwh, gas: NEW_DIAGNOSTIC_ENERGY_PRICES.gas.price_default_eur_kwh };
    const totalKwh = splitResult.totalKwh;
    const posts = splitResult.posts;
    const safeSurface = Math.max(1, Number(surface || 100));

    // ── Déterminer le poste ciblé et son prix par source ──
    let baseKwh = 0;
    let actionPrice = ePrices.elec;

    switch (action.gain_scope) {
        case 'heating_post':
            baseKwh = posts.heating.kwh;
            actionPrice = posts.heating.pricePerKwh;
            break;
        case 'dhw_post':
            baseKwh = posts.ecs.kwh;
            actionPrice = posts.ecs.pricePerKwh;
            break;
        case 'lighting_post':
            baseKwh = posts.lighting.kwh;
            actionPrice = ePrices.elec;
            break;
        case 'cooling_post':
            baseKwh = posts.cooling.kwh;
            actionPrice = ePrices.elec;
            break;
        case 'vent_aux_post':
            baseKwh = posts.ventilation.kwh;
            actionPrice = ePrices.elec;
            break;
        case 'elec_post':
            baseKwh = splitResult.elecKwh;
            actionPrice = ePrices.elec;
            break;
        case 'total':
        default:
            baseKwh = totalKwh;
            actionPrice = totalKwh > 0
                ? (splitResult.elecKwh * ePrices.elec + splitResult.gasKwh * ePrices.gas) / totalKwh
                : ePrices.elec;
            break;
    }

    // ── BASCULE SOURCE : PAC chauffage (ACT13) — gaz → élec ──
    if (action.id === 'ACT13' && splitResult.heatingSource === 'gas') {
        // Si la chaudière gaz fait aussi l'ECS, la PAC couvre les deux postes
        const ecsAlsoOnGasBoiler = (splitResult.ecsSource === 'gas') &&
            (formData.ecsSameSystem !== false || !formData.ecsSystem || formData.ecsSystem === 'gas_boiler');
        const heatingGasKwh = posts.heating.kwh + (ecsAlsoOnGasBoiler ? posts.ecs.kwh : 0);
        const copPac = 3.5;
        const newElecKwh = Math.round(heatingGasKwh / copPac);

        const economieGaz = Math.round(heatingGasKwh * ePrices.gas);
        const surcoutElec = Math.round(newElecKwh * ePrices.elec);
        const gainEuro = Math.max(0, economieGaz - surcoutElec);
        const gainKwh = Math.max(0, heatingGasKwh - newElecKwh);

        let capex = 0;
        if (safeSurface <= 200) capex = Math.max(10000, safeSurface * 95);
        else if (safeSurface <= 500) capex = 200 * 95 + (safeSurface - 200) * 65;
        else capex = 200 * 95 + 300 * 65 + (safeSurface - 500) * 45;

        const aidPct = action.aid_pct || 0;
        const aidAmount = Math.round(capex * aidPct);
        const capexNet = Math.round(capex * (1 - aidPct));
        const roi_years = gainEuro > 0 ? Math.round((capexNet / gainEuro) * 10) / 10 : null;

        return {
            gainKwh,
            gainEuro,
            capex,
            capexNet,
            aidAmount,
            aidPct,
            roi_years,
            gain_pct_total: totalKwh > 0 ? Math.round((gainKwh / totalKwh) * 1000) / 10 : 0,
            energy_switch: true,
            energy_switch_detail: {
                old_source: 'gas',
                new_source: 'elec',
                old_kwh: heatingGasKwh,
                new_kwh: newElecKwh,
                cop: copPac,
                economie_old_euro: economieGaz,
                surcout_new_euro: surcoutElec
            },
            energy_switch_note: `Remplacement chaudière gaz → PAC air/eau COP ${copPac}${ecsAlsoOnGasBoiler ? ' (chauffage + ECS)' : ''}. Suppression ${newDiagnosticFormatInteger(heatingGasKwh)} kWh gaz, ajout ${newDiagnosticFormatInteger(newElecKwh)} kWh élec. Gain net : ${newDiagnosticFormatInteger(gainEuro)} €/an.`
        };
    }

    // ── BASCULE SOURCE : PAC chauffage (ACT13) — chauffage ELEC existant ──
    if (action.id === 'ACT13' && splitResult.heatingSource === 'elec' && formData.mainHeating !== 'pac') {
        const heatingElecKwh = posts.heating.kwh;
        const copPac = 3.5;
        const newElecKwh = Math.round(heatingElecKwh / copPac);
        const gainKwh = heatingElecKwh - newElecKwh;
        const gainEuro = Math.round(gainKwh * ePrices.elec);

        let capex = 0;
        if (safeSurface <= 200) capex = Math.max(10000, safeSurface * 95);
        else if (safeSurface <= 500) capex = 200 * 95 + (safeSurface - 200) * 65;
        else capex = 200 * 95 + 300 * 65 + (safeSurface - 500) * 45;

        const aidPct = action.aid_pct || 0;
        const aidAmount = Math.round(capex * aidPct);
        const capexNet = Math.round(capex * (1 - aidPct));
        const roi_years = gainEuro > 0 ? Math.round((capexNet / gainEuro) * 10) / 10 : null;

        return {
            gainKwh, gainEuro, capex, capexNet, aidAmount, aidPct, roi_years,
            gain_pct_total: totalKwh > 0 ? Math.round((gainKwh / totalKwh) * 1000) / 10 : 0,
            energy_switch: true,
            energy_switch_detail: {
                old_source: 'elec', new_source: 'elec',
                old_kwh: heatingElecKwh, new_kwh: newElecKwh, cop: copPac,
                economie_old_euro: Math.round(heatingElecKwh * ePrices.elec),
                surcout_new_euro: Math.round(newElecKwh * ePrices.elec)
            },
            energy_switch_note: `Remplacement convecteurs élec (COP 1) → PAC COP ${copPac}. Réduction de ${newDiagnosticFormatInteger(gainKwh)} kWh élec.`
        };
    }

    // ── BASCULE SOURCE : Ballon thermodynamique ECS (ACT18) — gaz → élec ──
    if (action.id === 'ACT18' && splitResult.ecsSource === 'gas') {
        const ecsGasKwh = posts.ecs.kwh;
        const copCet = 3.0;
        const newElecKwh = Math.round(ecsGasKwh / copCet);

        const economieGaz = Math.round(ecsGasKwh * ePrices.gas);
        const surcoutElec = Math.round(newElecKwh * ePrices.elec);
        const gainEuro = Math.max(0, economieGaz - surcoutElec);
        const gainKwh = Math.max(0, ecsGasKwh - newElecKwh);

        const capex = action.capex_med || 4500;
        const aidPct = action.aid_pct || 0;
        const aidAmount = Math.round(capex * aidPct);
        const capexNet = Math.round(capex * (1 - aidPct));
        const roi_years = gainEuro > 0 ? Math.round((capexNet / gainEuro) * 10) / 10 : null;

        return {
            gainKwh, gainEuro, capex, capexNet, aidAmount, aidPct, roi_years,
            gain_pct_total: totalKwh > 0 ? Math.round((gainKwh / totalKwh) * 1000) / 10 : 0,
            energy_switch: true,
            energy_switch_detail: {
                old_source: 'gas', new_source: 'elec',
                old_kwh: ecsGasKwh, new_kwh: newElecKwh, cop: copCet,
                economie_old_euro: economieGaz, surcout_new_euro: surcoutElec
            },
            energy_switch_note: `Remplacement ECS gaz → ballon thermodynamique COP ${copCet}. Suppression ${newDiagnosticFormatInteger(ecsGasKwh)} kWh gaz, ajout ${newDiagnosticFormatInteger(newElecKwh)} kWh élec.`
        };
    }

    // ── BASCULE SOURCE : CET (ACT18) — ECS élec existante (ballon classique COP 1) ──
    if (action.id === 'ACT18' && splitResult.ecsSource === 'elec') {
        const ecsElecKwh = posts.ecs.kwh;
        const copCet = 3.0;
        const newElecKwh = Math.round(ecsElecKwh / copCet);
        const gainKwh = ecsElecKwh - newElecKwh;
        const gainEuro = Math.round(gainKwh * ePrices.elec);

        const capex = action.capex_med || 4500;
        const aidPct = action.aid_pct || 0;
        const aidAmount = Math.round(capex * aidPct);
        const capexNet = Math.round(capex * (1 - aidPct));
        const roi_years = gainEuro > 0 ? Math.round((capexNet / gainEuro) * 10) / 10 : null;

        return {
            gainKwh, gainEuro, capex, capexNet, aidAmount, aidPct, roi_years,
            gain_pct_total: totalKwh > 0 ? Math.round((gainKwh / totalKwh) * 1000) / 10 : 0,
            energy_switch: true,
            energy_switch_detail: {
                old_source: 'elec', new_source: 'elec',
                old_kwh: ecsElecKwh, new_kwh: newElecKwh, cop: copCet,
                economie_old_euro: Math.round(ecsElecKwh * ePrices.elec),
                surcout_new_euro: Math.round(newElecKwh * ePrices.elec)
            },
            energy_switch_note: `Remplacement ballon élec (COP 1) → CET COP ${copCet}. Réduction ${newDiagnosticFormatInteger(gainKwh)} kWh élec.`
        };
    }

    // ── CAS STANDARD : gain = % × kWh poste × prix source ──
    const gainKwh = Math.round(baseKwh * (action.gain_pct_med || 0));
    const gainEuro = Math.round(gainKwh * actionPrice);

    // ── CAPEX ──
    let capex = action.capex_med || 0;

    if (action.capex_method === 'pac_tranches') {
        if (safeSurface <= 200) capex = Math.max(10000, safeSurface * 95);
        else if (safeSurface <= 500) capex = 200 * 95 + (safeSurface - 200) * 65;
        else capex = 200 * 95 + 300 * 65 + (safeSurface - 500) * 45;
    } else if (action.capex_per_m2) {
        capex = Math.max(action.capex_min || action.capex_low, Math.round(safeSurface * action.capex_per_m2));
    } else if (action.capex_unit === '€/m²') {
        capex = action.capex_med * safeSurface;
    } else if (action.capex_unit === '€/radiateur') {
        capex = action.capex_med * Math.max(6, Math.round(safeSurface / 15));
    }

    if (action.capex_unit === '€/m² de façade' || (action.capex_unit === '€/m²' && action.category === 'envelope_walls')) {
        capex = action.capex_med * safeSurface * 0.6;
    }
    if (action.capex_unit === '€/m² vitré') {
        const GLAZING_RATIO = {
            warehouse: 0.05, light_warehouse: 0.05,
            offices: 0.20, coworking: 0.20, education: 0.20,
            health: 0.15, hotel: 0.15,
            retail: 0.35, commerce_alim: 0.35, restaurant: 0.30,
            mixed: 0.20
        };
        const activity = (formData && formData.activity) || 'offices';
        capex = action.capex_med * safeSurface * (GLAZING_RATIO[activity] || 0.20);
    }
    if (action.capex_unit === '€/ml') {
        capex = action.capex_med * 6;
    }

    // ── PV (ACT22) : logique spécifique inchangée ──
    if (action.id === 'ACT22' && action.gain_scope === 'elec_post') {
        const targetElecKwh = splitResult.elecKwh;
        return newDiagnosticEstimatePhotovoltaicScenario({
            action,
            totalKwh,
            breakdown: splitResult.breakdown_pct,
            surface: safeSurface,
            formData,
            ePrices: { ...ePrices, targetElecKwh }
        });
    }

    const aidPct = action.aid_pct || 0;
    const capexNet = Math.round(capex * (1 - aidPct));
    const aidAmount = Math.round(capex * aidPct);
    const roi_years = gainEuro > 0 ? Math.round((capexNet / gainEuro) * 10) / 10 : null;

    return {
        gainKwh,
        gainEuro,
        capex,
        capexNet,
        aidAmount,
        aidPct,
        roi_years,
        gain_pct_total: totalKwh > 0 ? Math.round((gainKwh / totalKwh) * 1000) / 10 : 0,
        energy_switch: false,
        energy_switch_note: null
    };
};

const newDiagnosticFilterAndScoreActions = (formData, splitResult) => {
    const worksDone = formData.worksDone || [];
    const surface = Math.max(1, Number(formData.surface || 100));
    const buildingAge = formData.buildingAge || '2001_2012';
    const boilerAge = formData.boilerAge || 'under5';

    let eligibleActions = NEW_DIAGNOSTIC_ACTIONS_LIBRARY.actions.filter(action => {
        // EXCLUSIONS PAR TRAVAUX DÉJÀ RÉALISÉS
        if (worksDone.includes('led_done') && action.category === 'lighting') return false;
        if (worksDone.includes('regulation_done') && ['ACT01', 'ACT02', 'ACT03'].includes(action.id)) return false;
        if (worksDone.includes('pac_done') && action.id === 'ACT13') return false;
        if (worksDone.includes('boiler_recent') && action.id === 'ACT13') return false;
        if (worksDone.includes('roof_done') && action.category === 'envelope_roof') return false;
        if (worksDone.includes('walls_done') && action.category === 'envelope_walls') return false;
        if (worksDone.includes('windows_done') && action.category === 'envelope_windows') return false;
        if (worksDone.includes('gtb_done') && action.category === 'pilotage') return false;
        if (worksDone.includes('dhw_done') && action.category === 'dhw') return false;
        if (worksDone.includes('vmc_df_done') && action.category === 'ventilation') return false;
        if (worksDone.includes('pv_done') && action.id === 'ACT22') return false;

        // EXCLUSIONS PAR ÉTAT DU BÂTIMENT
        if (!formData.hasCooling && ['ACT19', 'ACT20'].includes(action.id)) return false;
        if (formData.mainHeating === 'electric' && action.id === 'ACT04') return false;
        // ACT13 PAC : autorisé pour gaz ET électrique (convecteurs → PAC), exclu si déjà PAC
        if (!['gas', 'electric'].includes(formData.mainHeating) && action.id === 'ACT13') return false;
        if (formData.mainHeating === 'pac' && action.id === 'ACT13') return false;
        if (formData.hasGtb && ['ACT14', 'ACT21'].includes(action.id)) return false;
        if (formData.roofInsulation === 'yes' && action.id === 'ACT15') return false;
        if (formData.wallInsulation === 'yes' && action.id === 'ACT16') return false;
        // ACT18 CET : autorisé pour ballon élec OU gaz (remplacement par thermodynamique)
        if (action.id === 'ACT18' && !formData.ecsSameSystem && !['electric_boiler', 'gas_boiler', 'gas_instant'].includes(formData.ecsSystem)) return false;
        if (action.id === 'ACT18' && formData.ecsSameSystem) return false;
        // ACT22 conditions
        if (action.id === 'ACT22' && surface < 100) return false;
        if (action.id === 'ACT22' && formData.roofType === 'none') return false;

        return true;
    });

    const buildingAgeCoef = (NEW_DIAGNOSTIC_BUILDING_AGES || []).find(a => a.id === buildingAge)?.coef || 1.0;
    const boilerAgePriority = (NEW_DIAGNOSTIC_BOILER_AGES || []).find(a => a.id === boilerAge)?.pacPriority || 0;

    const energyPrices = { elec: NEW_DIAGNOSTIC_ENERGY_PRICES.electricity.price_default_eur_kwh, gas: NEW_DIAGNOSTIC_ENERGY_PRICES.gas.price_default_eur_kwh };
    const scoredActions = eligibleActions.map(action => {
        const calc = newDiagnosticCalculateActionGain(action, splitResult, surface, formData, energyPrices);

        let feasibility = 1.0;
        if (action.category?.includes('envelope')) feasibility = 0.55;
        if (action.category === 'heating' && (calc.capex || 0) > 10000) feasibility = 0.65;
        if (action.category === 'lighting') feasibility = 1.3;
        if (action.tier === 'light') feasibility *= 1.3;
        if (action.tier === 'heavy') feasibility *= 0.7;

        if (action.category?.includes('envelope') && ['pre1975', '1975_2000'].includes(buildingAge)) {
            feasibility *= buildingAgeCoef;
        }
        if (action.id === 'ACT13' && boilerAgePriority >= 2) feasibility *= 1.5;

        const safeCapex = Math.max(1, calc.capexNet || calc.capex);
        const priorityScore = (calc.gainEuro * feasibility) / safeCapex;

        return { ...action, ...calc, priorityScore };
    });

    // Filtrer les actions non rentables
    const filteredActions = scoredActions.filter(a => {
        if (a.roi_years !== null && a.roi_years > 10) return false;
        if (a.gainEuro <= 0) return false;
        return true;
    });

    filteredActions.sort((a, b) => b.priorityScore - a.priorityScore);

    // Sélection max 3 light + 3 heavy
    const lightActions = filteredActions.filter(a => a.tier === 'light').slice(0, 3);
    const heavyActions = filteredActions.filter(a => a.tier === 'heavy').slice(0, 3);

    let topActions = [...lightActions, ...heavyActions];

    // Si ACT13 couvre déjà l'ECS (PAC remplace chaudière gaz qui faisait chauffage+ECS),
    // retirer ACT18 (ballon thermo) et ACT20 (récup chaleur groupe froid sur ECS)
    const act13Result = topActions.find(a => a.id === 'ACT13');
    if (act13Result && act13Result.energy_switch_detail && splitResult.ecsSource === 'gas' &&
        (formData.ecsSameSystem !== false)) {
        topActions = topActions.filter(a => a.id !== 'ACT18' && a.id !== 'ACT20');
    }

    return topActions;
};

/* ─────────────────────────────────────────────────────────────────────────
   TESTS UNITAIRES ENRICHIS (appeler newDiagnosticRunSplitUnitTests() dans la console)
   ───────────────────────────────────────────────────────────────────────── */

const newDiagnosticRunSplitUnitTests = () => {
    const TESTS = [
        {
            name: 'T1 — Hôtel gaz : ECS doit être à ~22% (table ADEME)',
            fd: { mainHeating: 'gas', ecsSameSystem: true },
            elec: 30000, gas: 80000, activity: 'hotel',
            check: (r) => {
                const ecsPct = r.breakdown_pct.dhw_pct;
                if (ecsPct < 15 || ecsPct > 35) throw new Error(`ECS hotel = ${ecsPct}% (attendu 18-30%)`);
                const sum = Object.values(r.posts).reduce((s, p) => s + p.kwh, 0);
                if (Math.abs(sum - r.totalKwh) > 2) throw new Error(`Conservation: ${sum} vs ${r.totalKwh}`);
            }
        },
        {
            name: 'T2 — Bureau : ECS doit être faible (~5%)',
            fd: { mainHeating: 'gas', ecsSameSystem: true },
            elec: 40000, gas: 30000, activity: 'offices',
            check: (r) => {
                const ecsPct = r.breakdown_pct.dhw_pct;
                if (ecsPct > 12) throw new Error(`ECS bureau = ${ecsPct}% (attendu < 12%)`);
            }
        },
        {
            name: 'T3 — PAC gaz→élec : gain net = éco gaz - surcoût élec',
            fd: { mainHeating: 'gas', ecsSameSystem: true },
            elec: 30000, gas: 80000, activity: 'hotel',
            check: (r) => {
                const action = { id: 'ACT13', gain_scope: 'heating_post', gain_pct_med: 0.50,
                    capex_method: 'pac_tranches', capex_med: 19000, aid_pct: 0.35 };
                const result = newDiagnosticCalculateActionGain(action, r, 1000,
                    { mainHeating: 'gas', ecsSameSystem: true, activity: 'hotel' },
                    { elec: 0.206, gas: 0.108 });
                if (!result.energy_switch) throw new Error('PAC devrait avoir energy_switch=true');
                if (result.gainEuro <= 0) throw new Error(`Gain PAC = ${result.gainEuro} (devrait être > 0)`);
                const ecoGazBrute = Math.round(result.energy_switch_detail.old_kwh * 0.108);
                if (result.gainEuro >= ecoGazBrute) throw new Error(`Gain PAC (${result.gainEuro}) >= éco gaz brute (${ecoGazBrute}). Le surcoût élec n'est pas déduit.`);
            }
        },
        {
            name: 'T4 — CET gaz→élec : gain net positif mais < éco gaz',
            fd: { mainHeating: 'gas', ecsSameSystem: false, ecsSystem: 'gas_boiler' },
            elec: 20000, gas: 50000, activity: 'hotel',
            check: (r) => {
                const action = { id: 'ACT18', gain_scope: 'dhw_post', gain_pct_med: 0.60,
                    capex_med: 4500, aid_pct: 0.20 };
                const result = newDiagnosticCalculateActionGain(action, r, 1000,
                    { mainHeating: 'gas', ecsSameSystem: false, ecsSystem: 'gas_boiler', activity: 'hotel' },
                    { elec: 0.206, gas: 0.108 });
                if (!result.energy_switch) throw new Error('CET devrait avoir energy_switch=true');
                if (result.gainEuro <= 0) throw new Error(`Gain CET = ${result.gainEuro}`);
            }
        },
        {
            name: 'T5 — Restaurant : cuisson doit être > 0%',
            fd: { mainHeating: 'gas', ecsSameSystem: true },
            elec: 40000, gas: 60000, activity: 'restaurant',
            check: (r) => {
                if (!r.posts.cooking || r.posts.cooking.kwh <= 0) {
                    throw new Error('Poste cuisson absent ou nul pour un restaurant');
                }
            }
        },
        {
            name: 'T6 — Education : ELEC_SPLIT ne doit pas utiliser le fallback',
            fd: { mainHeating: 'gas', ecsSameSystem: true },
            elec: 20000, gas: 30000, activity: 'education',
            check: (r) => {
                const sum = Object.values(r.posts).reduce((s, p) => s + p.kwh, 0);
                if (Math.abs(sum - r.totalKwh) > 2) throw new Error(`Conservation education: ${sum} vs ${r.totalKwh}`);
            }
        },
        {
            name: 'T7 — Fioul : prix chauffage doit être 0.125 (table centralisée)',
            fd: { mainHeating: 'fuel', ecsSameSystem: true },
            elec: 15000, gas: 40000, activity: 'offices',
            check: (r) => {
                const expected = NEW_DIAGNOSTIC_ENERGY_PRICES.fuel_oil.price_default_eur_kwh;
                if (Math.abs(r.posts.heating.pricePerKwh - expected) > 0.001) {
                    throw new Error(`Prix chauffage fioul = ${r.posts.heating.pricePerKwh} (attendu ${expected})`);
                }
            }
        },
        {
            name: 'T8 — Réseau chaleur : prix dans split = prix table centralisée',
            fd: { mainHeating: 'network', ecsSameSystem: true },
            elec: 20000, gas: 0, activity: 'offices',
            check: (r) => {
                const expected = NEW_DIAGNOSTIC_ENERGY_PRICES.heat_network.price_default_eur_kwh;
                if (Math.abs(r.posts.heating.pricePerKwh - expected) > 0.001) {
                    throw new Error(`Prix réseau chaleur = ${r.posts.heating.pricePerKwh} (attendu ${expected})`);
                }
            }
        }
    ];

    const results = [];
    for (const t of TESTS) {
        try {
            const r = newDiagnosticSplitByEnergySource(t.fd, t.elec, t.gas, t.activity);
            t.check(r);
            results.push({ name: t.name, status: 'PASS' });
        } catch (e) {
            results.push({ name: t.name, status: 'FAIL', error: e.message });
            console.error(`${t.name}: ${e.message}`);
        }
    }
    console.table(results);
    const allPass = results.every(r => r.status === 'PASS');
    console.info(allPass ? 'Tous les tests passent' : 'Des tests ont échoué');
    return results;
};

/* ─────────────────────────────────────────────────────────────────────────
   HELPERS : GAINS COMPOSÉS + CAP
   ───────────────────────────────────────────────────────────────────────── */

const newDiagnosticGetComplementaryPhotovoltaicOpportunity = (formData, splitResult, topActions) => {
    const photovoltaicAction = NEW_DIAGNOSTIC_ACTIONS_LIBRARY.actions.find(action => action.id === 'ACT22');
    const surface = Math.max(1, Number(formData.surface || 100));

    if (!photovoltaicAction) return null;
    if ((topActions || []).some(action => action.id === photovoltaicAction.id)) return null;
    if (surface < 100) return null;
    if (formData.roofType === 'none') return null;

    const energyPrices = {
        elec: NEW_DIAGNOSTIC_ENERGY_PRICES.electricity.price_default_eur_kwh,
        gas: NEW_DIAGNOSTIC_ENERGY_PRICES.gas.price_default_eur_kwh,
        targetElecKwh: newDiagnosticEstimatePvSizing(splitResult, topActions)
    };
    const calc = newDiagnosticCalculateActionGain(photovoltaicAction, splitResult, surface, formData, energyPrices);

    if (!calc || calc.gainKwh <= 0 || calc.gainEuro <= 0) return null;
    // Afficher en complémentaire uniquement si ROI strictement entre 10 et 15 ans
    if (calc.roi_years === null) return null;
    if (calc.roi_years < 10) return null;  // trop bon ROI, devrait déjà être dans topActions
    if (calc.roi_years > 15) return null;   // trop long, pas pertinent

    return {
        ...photovoltaicAction,
        ...calc,
        note: "Le photovoltaïque peut constituer un levier complémentaire à étudier pour réduire une partie des consommations électriques en journée et valoriser le site."
    };
};

const newDiagnosticCalculateCompositeSavings = (actions, totalKwh) => {
    // Gains composés : 1 - Π(1 - g_i)
    // gainPct = gainKwh / totalKwh (toutes sources confondues pour l'intensité)
    let composite = 1;

    for (const action of actions) {
        const gainPct = totalKwh > 0
            ? Math.max(0, Math.min(0.65, (action.gainKwh || 0) / totalKwh))
            : 0;
        composite *= (1 - gainPct);
    }

    // Cap max 65%
    return Math.min(1 - composite, NEW_DIAGNOSTIC_MAX_TOTAL_SAVINGS_PCT);
};

// Gains composés en euros — même logique que les kWh mais pondérée par le prix de chaque action
// Évite que la somme brute des gainEuro individuels dépasse la facture totale
const newDiagnosticCalculateCompositeSavingsEuro = (actions, totalEuro) => {
    if (totalEuro <= 0) return 0;
    let composite = 1;
    for (const action of actions) {
        const gainPct = Math.max(0, Math.min(0.65, (action.gainEuro || 0) / totalEuro));
        composite *= (1 - gainPct);
    }
    return Math.round(Math.min(1 - composite, NEW_DIAGNOSTIC_MAX_TOTAL_SAVINGS_PCT) * totalEuro);
};

/* ─────────────────────────────────────────────────────────────────────────
   WARNINGS STANDARDISÉS
   ───────────────────────────────────────────────────────────────────────── */

const newDiagnosticGenerateWarnings = (formData, conversionResults) => {
    const warnings = [];

    // Warning prix implicite
    ['elec', 'gas'].forEach(energy => {
        const kwh = formData[`${energy}Kwh`];
        const euro = formData[`${energy}Euro`];

        if (kwh && euro) {
            const implicitPrice = parseFloat(euro) / parseFloat(kwh);
            const priceMin = energy === 'elec' ? 0.10 : 0.05;
            const priceMax = energy === 'elec' ? 0.35 : 0.20;

            if (implicitPrice < priceMin || implicitPrice > priceMax) {
                warnings.push({
                    code: 'PRICE_IMPLIED_OUT_OF_RANGE',
                    severity: 'warning',
                    message: `${energy === 'elec' ? 'Électricité' : 'Gaz'} : prix implicite ${implicitPrice.toFixed(3)} €/kWh inhabituel`,
                    energy
                });
            }
        }
    });

    // Warning abonnement
    ['elec', 'gas'].forEach(energy => {
        if (formData[`${energy}IncludesSubscription`] && !formData[`${energy}SubscriptionYearly`]) {
            warnings.push({
                code: 'SUBSCRIPTION_INCLUDED_NO_VALUE',
                severity: 'warning',
                message: `${energy === 'elec' ? 'Électricité' : 'Gaz'} : abonnement inclus mais montant non renseigné`,
                energy
            });
        }
    });

    // Warning mix usage (ne devrait pas arriver car validation formulaire)
    // (Supprimé car le mix est maintenant géré via mixedUsage1/mixedUsage2 en Step1)

    return warnings;
};

/* ─────────────────────────────────────────────────────────────────────────
   SCORE CONFIANCE
   ───────────────────────────────────────────────────────────────────────── */

const newDiagnosticCalculateConfidenceScore = (formData, conversionResults) => {
    let score = 100;

    // Pénalité si conversion depuis €
    if (conversionResults.elec?.method?.includes('euro_converted')) score -= 15;
    if (conversionResults.gas?.method?.includes('euro_converted')) score -= 15;

    // Pénalité si aucune donnée énergie
    if (conversionResults.elec?.value === 0 && conversionResults.gas?.value === 0) score -= 50;

    // Bonus si kWh fournis
    if (conversionResults.elec?.method === 'kwh_provided') score += 5;
    if (conversionResults.gas?.method === 'kwh_provided') score += 5;

    // Pénalité si pending_expert sur activité
    const benchmark = newDiagnosticGetBenchmark(formData.activity, formData);
    if (benchmark.source_level === 'pending_expert') score -= 20;

    score = Math.max(0, Math.min(100, score));

    // Niveau
    let level = 'strong';
    if (score < 50) level = 'low';
    else if (score < 75) level = 'medium';

    return {
        score,
        level,
        label: level === 'strong' ? 'Fort' : level === 'medium' ? 'Moyen' : 'Faible'
    };
};

const newDiagnosticCalculateLeadScore = (formData, compositeSavingsPct) => {
    let score = 0;
    const reasons = [];

    // Urgence (0–30)
    const hScore = { immediate: 30, '3to6months': 24, '6to12months': 16, over1year: 8, exploring: 4 };
    score += hScore[formData.decisionHorizon] || 8;
    if (formData.decisionHorizon === 'immediate') reasons.push('Décision imminente');

    // Budget (0–25)
    const bScore = { over80k: 25, '20to80k': 20, '5to20k': 14, under5k: 6, unknown: 10 };
    score += bScore[formData.budgetRange] || 10;
    if (['over80k', '20to80k'].includes(formData.budgetRange)) reasons.push('Budget significatif');

    // Potentiel économies (0–20)
    const pct = typeof compositeSavingsPct === 'number' ? compositeSavingsPct * 100 : 0;
    if (pct >= 30) { score += 20; reasons.push("Fort potentiel d'économies"); }
    else if (pct >= 20) score += 14;
    else if (pct >= 10) score += 8;
    else score += 3;

    // Pouvoir décision (0–15)
    if (formData.role === 'owner') { score += 15; reasons.push('Propriétaire décideur'); }
    else if (formData.isDecisionMaker === 'yes') { score += 12; reasons.push('Décideur direct'); }
    else if (formData.isDecisionMaker === 'need_approval') score += 7;
    else score += 3;

    // Objectif (0–10)
    const oScore = { reduce_costs: 10, comply_regulation: 9, valorise_asset: 7, comfort: 5 };
    score += oScore[formData.projectObjective] || 5;

    const s = Math.min(100, score);
    const level = s >= 80 ? 5 : s >= 65 ? 4 : s >= 48 ? 3 : s >= 30 ? 2 : 1;

    return {
        score: s,
        level,
        label: ['', 'Découverte', 'Tiède', 'Chaud', 'Très chaud', 'Urgent'][level],
        reasons: reasons.slice(0, 3),
        hasPhone: !!(formData.phone && formData.phone.trim()),
        canContact: !!formData.contactOptIn
    };
};

/* ─────────────────────────────────────────────────────────────────────────
   FONCTION PRINCIPALE : newDiagnosticBuildReportData()
   ───────────────────────────────────────────────────────────────────────── */

const newDiagnosticBuildReportData = (formData) => {
    const reportId = `DIAG-${Date.now()}`;
    const generatedAt = new Date().toISOString();

    // ──────────────────────────────────────────────────────────────────────
    // 1. NORMALISATION INPUTS
    // ──────────────────────────────────────────────────────────────────────
    const surface = parseFloat(formData.surface) || 0;
    const activity = formData.activity || 'offices';

    // Garde-fou surface
    if (surface <= 0) {
        throw new Error('Surface invalide (doit être > 0)');
    }

    // ──────────────────────────────────────────────────────────────────────
    // 2. CONVERSION € → kWh
    // ──────────────────────────────────────────────────────────────────────
    const elecConversion = formData.elecUsed ? newDiagnosticConvertEuroToKwh('elec', formData) : { value: 0, method: 'not_used' };
    const gasConversion = formData.gasUsed ? newDiagnosticConvertEuroToKwh('gas', formData) : { value: 0, method: 'not_used' };

    const totalKwh = elecConversion.value + gasConversion.value;

    // Garde-fou NaN
    if (isNaN(totalKwh) || !isFinite(totalKwh)) {
        throw new Error('Calcul consommation invalide (NaN ou Infinity)');
    }

    // ──────────────────────────────────────────────────────────────────────
    // 2bis. SÉPARATION PAR SOURCE D'ÉNERGIE (NOUVEAU PIPELINE)
    // Chaque poste reçoit ses propres kWh avec le bon prix
    // ──────────────────────────────────────────────────────────────────────
    const splitResult = newDiagnosticSplitByEnergySource(
        formData,
        elecConversion.value,
        gasConversion.value,
        activity
    );

    // ──────────────────────────────────────────────────────────────────────
    // 3. INTENSITÉ kWh/m²/an (inchangée — totalKwh = élec + gaz)
    // ──────────────────────────────────────────────────────────────────────
    const intensity_kwh_m2_an = surface > 0 ? Math.round(totalKwh / surface) : 0;

    // ──────────────────────────────────────────────────────────────────────
    // 4. BENCHMARK
    // ──────────────────────────────────────────────────────────────────────
    const benchmark = newDiagnosticGetBenchmark(activity, formData);

    let benchmarkPosition = 'in_range';
    if (intensity_kwh_m2_an < benchmark.low_kwh_m2_an) benchmarkPosition = 'below_range';
    else if (intensity_kwh_m2_an > benchmark.high_kwh_m2_an) benchmarkPosition = 'above_range';
    if (intensity_kwh_m2_an > benchmark.high_kwh_m2_an * 1.2) benchmarkPosition = 'far_above_range';

    // ──────────────────────────────────────────────────────────────────────
    // 5. RÉPARTITION POSTES (issue du splitResult, en énergie finale)
    // ──────────────────────────────────────────────────────────────────────
    const breakdown = splitResult.breakdown_pct;
    const breakdownKwh = {
        heating: splitResult.posts.heating.kwh,
        cooling: splitResult.posts.cooling.kwh,
        vent_aux: splitResult.posts.ventilation.kwh,
        lighting: splitResult.posts.lighting.kwh,
        dhw: splitResult.posts.ecs.kwh,
        cooking: splitResult.posts.cooking.kwh,
        other_specific: splitResult.posts.other.kwh
    };

    // ──────────────────────────────────────────────────────────────────────
    // 6-8. ACTIONS + GAINS + TRI (avec splitResult)
    // ──────────────────────────────────────────────────────────────────────

    // avgPrice pour l'indicateur total_cost_euro_an uniquement
    const elecPrice = NEW_DIAGNOSTIC_ENERGY_PRICES.electricity.price_default_eur_kwh;
    const gasPrice = NEW_DIAGNOSTIC_ENERGY_PRICES.gas.price_default_eur_kwh;
    let totalEuro = 0;
    if (formData.elecUsed) {
        totalEuro += (formData.elecEuro && parseFloat(formData.elecEuro) > 0)
            ? Number(formData.elecEuro)
            : elecConversion.value * elecPrice;
    }
    if (formData.gasUsed) {
        totalEuro += (formData.gasEuro && parseFloat(formData.gasEuro) > 0)
            ? Number(formData.gasEuro)
            : gasConversion.value * gasPrice;
    }
    const avgPrice = totalKwh > 0
        ? Math.min(Math.max(totalEuro / totalKwh, 0.05), 0.40)
        : elecPrice;

    const topActions = newDiagnosticFilterAndScoreActions(formData, splitResult);
    const complementaryPhotovoltaic = newDiagnosticGetComplementaryPhotovoltaicOpportunity(formData, splitResult, topActions);

    const compositeSavingsPct = newDiagnosticCalculateCompositeSavings(topActions, totalKwh);
    const annualSavingsKwh = Math.round(totalKwh * compositeSavingsPct);
    const annualAdditionalRevenueEuro = topActions.reduce((sum, action) => sum + (action.extraAnnualRevenueEuro || 0), 0);
    // annualSavingsEuro = gains composés en euros (évite dépassement de la facture)
    const annualSavingsEuro = Math.min(
        newDiagnosticCalculateCompositeSavingsEuro(topActions, totalEuro) + annualAdditionalRevenueEuro,
        Math.round(totalEuro * NEW_DIAGNOSTIC_MAX_TOTAL_SAVINGS_PCT)
    );

    // ──────────────────────────────────────────────────────────────────────
    // 9. PROJECTIONS
    // ──────────────────────────────────────────────────────────────────────
    // [V1] Simplification : Projection sur 3 ans (actionnable) au lieu de 5/10 ans
    const projection3y = {
        savings_euro: annualSavingsEuro * 3,
        unit: '€',
        period: '3 ans'
    };

    // ──────────────────────────────────────────────────────────────────────
    // WARNINGS & CONFIANCE
    // ──────────────────────────────────────────────────────────────────────
    const warnings = newDiagnosticGenerateWarnings(formData, { elec: elecConversion, gas: gasConversion });
    const confidence = newDiagnosticCalculateConfidenceScore(formData, { elec: elecConversion, gas: gasConversion });
    const leadScore = newDiagnosticCalculateLeadScore(formData, compositeSavingsPct);

    // ──────────────────────────────────────────────────────────────────────
    // PAYLOAD STANDARDISÉ AVEC UNITÉS PARTOUT
    // ──────────────────────────────────────────────────────────────────────
    return {
        report_id: reportId,
        version_tag: 'v2.0-2026-energy-split',
        generated_at: generatedAt,

        // Source d'énergie (diagnostic)
        energy_split: {
            elec_kwh: { value: splitResult.elecKwh, unit: 'kWh/an' },
            gas_kwh: { value: splitResult.gasKwh, unit: 'kWh/an' },
            heating_source: splitResult.heatingSource,
            ecs_source: splitResult.ecsSource,
            posts: {
                heating: { kwh: splitResult.posts.heating.kwh, price: splitResult.posts.heating.pricePerKwh },
                ecs: { kwh: splitResult.posts.ecs.kwh, price: splitResult.posts.ecs.pricePerKwh },
                lighting: { kwh: splitResult.posts.lighting.kwh, price: NEW_DIAGNOSTIC_ENERGY_PRICES.electricity.price_default_eur_kwh },
                cooling: { kwh: splitResult.posts.cooling.kwh, price: NEW_DIAGNOSTIC_ENERGY_PRICES.electricity.price_default_eur_kwh },
                ventilation: { kwh: splitResult.posts.ventilation.kwh, price: NEW_DIAGNOSTIC_ENERGY_PRICES.electricity.price_default_eur_kwh },
                cooking: { kwh: splitResult.posts.cooking.kwh, price: NEW_DIAGNOSTIC_ENERGY_PRICES.electricity.price_default_eur_kwh },
                other: { kwh: splitResult.posts.other.kwh, price: NEW_DIAGNOSTIC_ENERGY_PRICES.electricity.price_default_eur_kwh }
            }
        },

        // Inputs summary
        inputs_summary: {
            email: formData.email,
            address: formData.address,
            address_obj: formData.addressObj || null,
            lat: formData.lat || null,
            lon: formData.lon || null,
            address_source: formData.addressSource || null,
            address_score: formData.addressScore || null,
            address_type: formData.addressType || null,
            address_precision: formData.addressPrecision || null,
            street_number: formData.streetNumber || null,
            street_label: formData.streetLabel || null,
            address_is_valid: formData.addressIsValid || false,
            cover_image_source: formData.coverImageSource || null,
            cover_image_path: formData.coverImagePath || null,
            cover_image_selected: !!formData.coverImageSelected,
            cover_original_filename: formData.coverUploadFileName || null,
            cover_is_manual: !!formData.coverIsManual,
            city: formData.city || null,
            role: formData.role,
            site_name: formData.siteName || (formData.address ? formData.address.split(',')[0].trim() : 'Bâtiment tertiaire'),
            postal_code: formData.postalCode,
            activity: activity,
            mixedUsage1: activity === 'mixed' ? formData.mixedUsage1 : null,
            mixedUsage2: activity === 'mixed' ? formData.mixedUsage2 : null,
            surface: { value: surface, unit: 'm²' },
            levels: { value: parseInt(formData.levels) || 1, unit: 'niveaux' },
            works_done: formData.worksDone || [],
            phone: formData.phone || null,
            ecsSameSystem: formData.ecsSameSystem,
            ecsSystem: formData.ecsSystem || null,
            primary_goal: formData.primaryGoal || null,
            project_horizon: formData.projectHorizon || null,
            decision_role: formData.decisionRole || null,
            contactOptIn: formData.contactOptIn || false,
            mainHeating: formData.mainHeating || 'gas'
        },

        // Calculation results
        calculation_results: {
            elec_kwh_an: { value: elecConversion.value, unit: 'kWh/an', method: elecConversion.method },
            gas_kwh_an: { value: gasConversion.value, unit: 'kWh/an', method: gasConversion.method },
            total_kwh_an: { value: totalKwh, unit: 'kWh/an' },
            intensity_kwh_m2_an: { value: intensity_kwh_m2_an, unit: 'kWh/m²/an' },
            total_cost_euro_an: { value: Math.round(totalKwh * avgPrice), unit: '€/an', price_avg: avgPrice }
        },

        // Benchmark
        benchmark_result: {
            position: benchmarkPosition,
            site_intensity: { value: intensity_kwh_m2_an, unit: 'kWh/m²/an' },
            benchmark_median: { value: benchmark.median_kwh_m2_an, unit: 'kWh/m²/an' },
            benchmark_low: { value: benchmark.low_kwh_m2_an, unit: 'kWh/m²/an' },
            benchmark_high: { value: benchmark.high_kwh_m2_an, unit: 'kWh/m²/an' },
            source_level: benchmark.source_level,
            source_ref: benchmark.source_ref
        },

        // Usage breakdown
        usage_breakdown: {
            breakdown_pct: breakdown,
            breakdown_kwh: breakdownKwh,
            source_level: breakdown.source_level,
            source_ref: breakdown.source_ref,
            breakdown_mode: breakdown.breakdown_mode
        },

        // Top actions
        top_actions: topActions.map(a => ({
            id: a.id,
            name: a.name,
            category: a.category,
            tier: a.tier || 'light',
            gain_kwh_an: { value: a.gainKwh, unit: 'kWh/an' },
            gain_euro_an: { value: a.gainEuro, unit: '€/an' },
            capex: { value: a.capex, unit: '€' },
            capex_net: { value: a.capexNet || a.capex, unit: '€' },
            aid_amount: { value: a.aidAmount || 0, unit: '€' },
            aid_pct: a.aidPct || 0,
            roi_years: { value: a.roi_years, unit: 'ans' },
            source_level_gain: a.source_level_gain,
            source_level_capex: a.source_level_capex,
            aid_tags: a.aid_tags || [],
            fiche_cee: a.fiche_cee || null,
            intervenants: a.intervenants || null,
            energy_switch_note: a.energy_switch_note || null,
            pv_hypothesis: a.pv_hypothesis || null,
            pv_production_kwh_an: a.pv_production_kwh_an || null,
            pv_autoconsumption_rate: a.pv_autoconsumption_rate || null,
            pv_surplus_kwh_an: a.pv_surplus_kwh_an || null,
            pv_surplus_revenue_euro_an: a.pv_surplus_revenue_euro_an || null,
            pv_installed_kwc: a.pv_installed_kwc || null,
            extraAnnualRevenueEuro: a.extraAnnualRevenueEuro || null
        })),

        complementary_opportunity: complementaryPhotovoltaic ? {
            id: complementaryPhotovoltaic.id,
            name: complementaryPhotovoltaic.name,
            category: complementaryPhotovoltaic.category,
            tier: complementaryPhotovoltaic.tier || 'heavy',
            note: complementaryPhotovoltaic.note,
            gain_kwh_an: { value: complementaryPhotovoltaic.gainKwh, unit: 'kWh/an' },
            gain_euro_an: { value: complementaryPhotovoltaic.gainEuro, unit: '€/an' },
            capex: { value: complementaryPhotovoltaic.capex, unit: '€' },
            capex_net: { value: complementaryPhotovoltaic.capexNet || complementaryPhotovoltaic.capex, unit: '€' },
            aid_amount: { value: complementaryPhotovoltaic.aidAmount || 0, unit: '€' },
            aid_pct: complementaryPhotovoltaic.aidPct || 0,
            roi_years: { value: complementaryPhotovoltaic.roi_years, unit: 'ans' },
            pv_hypothesis: complementaryPhotovoltaic.pv_hypothesis || null,
            pv_production_kwh_an: complementaryPhotovoltaic.pv_production_kwh_an || null,
            pv_autoconsumption_rate: complementaryPhotovoltaic.pv_autoconsumption_rate || null,
            pv_surplus_kwh_an: complementaryPhotovoltaic.pv_surplus_kwh_an || null,
            pv_surplus_revenue_euro_an: complementaryPhotovoltaic.pv_surplus_revenue_euro_an || null,
            pv_installed_kwc: complementaryPhotovoltaic.pv_installed_kwc || null,
            extraAnnualRevenueEuro: complementaryPhotovoltaic.extraAnnualRevenueEuro || null
        } : null,

        // Projections
        projection_3y: projection3y,

        // Composite savings
        composite_savings: {
            total_pct: { value: Math.round(compositeSavingsPct * 100), unit: '%' },
            annual_kwh: { value: annualSavingsKwh, unit: 'kWh/an' },
            annual_euro: { value: annualSavingsEuro, unit: '€/an' }
        },

        // Qualification prospect
        lead_qualification: {
            score: leadScore.score,
            level: leadScore.level,
            label: leadScore.label,
            reasons: leadScore.reasons,
            objective: formData.projectObjective || null,
            horizon: formData.decisionHorizon || null,
            budget: formData.budgetRange || null,
            is_decision_maker: formData.isDecisionMaker || (formData.role === 'owner' ? 'yes' : null),
            has_phone: leadScore.hasPhone,
            can_contact: leadScore.canContact
        },

        // Metadata
        confidence: confidence,
        warnings: warnings,

        // Hypothèses & limites
        assumptions: [
            'Pré-diagnostic, non substituable à un audit énergétique réglementaire',
            'Benchmarks issus de données publiques statistiques',
            'Répartition par postes indicative (non mesurée sur site)',
            `Conversion € → kWh basée sur des prix simplifiés (élec ${newDiagnosticFormatDecimal(NEW_DIAGNOSTIC_ENERGY_PRICES.electricity.price_default_eur_kwh, 3)} €/kWh, gaz ${newDiagnosticFormatDecimal(NEW_DIAGNOSTIC_ENERGY_PRICES.gas.price_default_eur_kwh, 3)} €/kWh)`,
            'Gains et ROI indicatifs à confirmer avant travaux',
            'Aides indicatives à vérifier selon éligibilité réelle'
        ],

        limits: [
            'Résultats dépendants de la qualité des données saisies',
            'Hypothèses sur usages et horaires non vérifiées',
            'Pas de prise en compte de l\'état réel des équipements',
            'Gains cumulés plafonnés à 65% (anti-surpromesse)',
            'CAPEX et aides à confirmer par devis professionnel'
        ]
    };
};

// ═══════════════════════════════════════════════════════════════
// PROJECTION FINANCIERE
// ═══════════════════════════════════════════════════════════════

function newDiagnosticBuildProjectionData({ annualSavingsEuro, totalCostEuroAn, elecKwh = 0, gasKwh = 0, actions = [] }) {
    const elecEur = elecKwh * NEW_DIAGNOSTIC_ENERGY_PRICES.electricity.price_default_eur_kwh;
    const gazEur = gasKwh * NEW_DIAGNOSTIC_ENERGY_PRICES.gas.price_default_eur_kwh;
    const totalBase = Math.max(elecEur + gazEur, 1);
    const partElec = elecEur / totalBase;
    const partGaz = gazEur / totalBase;
    const taux = partElec * INFLATION_ENERGIE.electricite
        + partGaz * INFLATION_ENERGIE.gaz
        + Math.max(0, 1 - partElec - partGaz) * INFLATION_ENERGIE.electricite;
    const tauxPct = (taux * 100).toFixed(1);
    const hasGaz = gazEur > 0;

    const safeActions = actions || [];
    const capexBrut = safeActions.reduce((s, a) => s + (a.capex?.value || 0), 0);
    let aidesTotal = 0;
    for (const action of safeActions) { aidesTotal += action.aid_amount?.value || 0; }
    const capexNet = Math.max(0, capexBrut - aidesTotal);

    // Scénario 2 : actions rapides seulement (tier=light ou petits budgets)
    const lightActionsOnly = safeActions.filter(a => a.tier === 'light' || (!a.tier && (a.capex?.value || 0) < 3000));
    const lightSavingsEuro = (() => {
        if (lightActionsOnly.length === 0 || totalCostEuroAn <= 0) return 0;
        let c = 1;
        for (const a of lightActionsOnly) {
            c *= (1 - Math.max(0, Math.min(0.65, (a.gain_euro_an?.value || 0) / totalCostEuroAn)));
        }
        return Math.round(Math.min(1 - c, 0.65) * totalCostEuroAn);
    })();
    const lightCapexBrut = lightActionsOnly.reduce((s, a) => s + (a.capex?.value || 0), 0);
    const lightAides = lightActionsOnly.reduce((s, a) => s + (a.aid_amount?.value || 0), 0);
    const lightCapexNet = Math.max(0, lightCapexBrut - lightAides);
    const hasLightScenario = lightActionsOnly.length > 0 && lightActionsOnly.length < safeActions.length;

    const roiGlobal = annualSavingsEuro > 0 ? capexNet / annualSavingsEuro : 999;
    const economiesPct = totalCostEuroAn > 0 ? annualSavingsEuro / totalCostEuroAn : 0;
    const graphiquePubliable = roiGlobal >= 0.5 && roiGlobal <= 20 && economiesPct >= 0.01;
    const horizon = 10;

    const data = [{
        annee: 'Auj.',
        sans_travaux: 0,
        avec_actions_rapides: hasLightScenario ? Math.round(lightCapexNet) : undefined,
        avec_travaux: Math.round(capexNet),
        economies_nettes: -Math.round(capexNet)
    }];
    let cumSans = 0;
    let cumAvec = capexNet;
    let cumLight = lightCapexNet;
    let roiAnnee = null;
    let roiRapideAnnee = null;
    for (let an = 1; an <= horizon; an++) {
        const f = Math.pow(1 + taux, an);
        cumSans += totalCostEuroAn * f;
        cumAvec += (totalCostEuroAn - annualSavingsEuro) * f;
        cumLight += (totalCostEuroAn - lightSavingsEuro) * f;
        const ecoNettes = Math.round(cumSans - cumAvec);
        if (!roiAnnee && ecoNettes > 0) roiAnnee = `A+${an}`;
        if (!roiRapideAnnee && hasLightScenario && Math.round(cumSans - cumLight) > 0) roiRapideAnnee = `A+${an}`;
        data.push({
            annee: `A+${an}`,
            sans_travaux: Math.round(cumSans),
            avec_actions_rapides: hasLightScenario ? Math.round(cumLight) : undefined,
            avec_travaux: Math.round(cumAvec),
            economies_nettes: ecoNettes
        });
    }

    return {
        data,
        taux,
        tauxPct,
        hasGaz,
        horizon,
        roiAnnee,
        roiRapideAnnee,
        roiGlobal,
        capexBrut: Math.round(capexBrut),
        capexNet: Math.round(capexNet),
        aidesTotal: Math.round(aidesTotal),
        lightCapexNet: Math.round(lightCapexNet),
        lightSavingsEuro: Math.round(lightSavingsEuro),
        hasLightScenario,
        graphiquePubliable
    };
}
