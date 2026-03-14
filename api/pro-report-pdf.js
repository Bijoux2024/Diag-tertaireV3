const { DEFAULT_MAX_HTML_LENGTH, renderPdfFromHtml } = require('./_lib/pdf-renderer');
const { getRequiredServerSupabaseConfig } = require('./_lib/supabase-server');
const ORGANIZATION_ASSETS_BUCKET = 'organization-assets';
const REPORT_PDF_FILE_KIND = 'report_pdf';
const MAX_HTML_LENGTH = DEFAULT_MAX_HTML_LENGTH;
const DEFAULT_ACCENT = '#1D4ED8';

const safeJsonParse = (value) => {
  if (typeof value !== 'string') return value;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
};

const asPlainObject = (value) => {
  return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
};

const asArray = (value) => Array.isArray(value) ? value : [];

const encodeQueryValue = (value) => encodeURIComponent(String(value ?? ''));

const encodeStoragePath = (path) => String(path || '')
  .split('/')
  .map((segment) => encodeURIComponent(segment))
  .join('/');

const escapeHtml = (value) => String(value ?? '')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#39;');

const sanitizeFileSegment = (value, fallback = 'rapport') => {
  const normalized = String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^\w.-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

  return normalized || fallback;
};

const sanitizeDownloadFilename = (value) => {
  const safeStem = sanitizeFileSegment(value, 'rapport-officiel');
  return safeStem.endsWith('.pdf') ? safeStem : `${safeStem}.pdf`;
};

const createHttpError = (statusCode, message) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const assertStoragePathPrefix = (storagePath, expectedPrefix, label) => {
  const normalizedPath = String(storagePath || '').trim();
  if (!normalizedPath.startsWith(expectedPrefix)) {
    throw createHttpError(403, `${label} path is outside the authenticated organization scope`);
  }

  return normalizedPath;
};

const formatCurrency = (value) => {
  const numeric = Number(value || 0);
  return Number.isFinite(numeric)
    ? `${numeric.toLocaleString('fr-FR')} EUR`
    : '0 EUR';
};

const formatInteger = (value, suffix = '') => {
  const numeric = Number(value || 0);
  const formatted = Number.isFinite(numeric) ? numeric.toLocaleString('fr-FR') : '0';
  return suffix ? `${formatted} ${suffix}` : formatted;
};

const formatDateTime = (value) => {
  const date = value ? new Date(value) : new Date();
  if (Number.isNaN(date.getTime())) {
    return escapeHtml(String(value || ''));
  }

  return date.toLocaleString('fr-FR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const getScoreTone = (score) => {
  if (score === 'A' || score === 'B') {
    return { color: '#15803D', background: '#DCFCE7' };
  }

  if (score === 'C') {
    return { color: '#A16207', background: '#FEF3C7' };
  }

  return { color: '#B91C1C', background: '#FEE2E2' };
};

const normalizeTextList = (value, limit = 6) => asArray(value)
  .map((item) => {
    if (typeof item === 'string') {
      return item.trim();
    }

    if (item && typeof item === 'object') {
      if (typeof item.title === 'string') {
        return item.title.trim();
      }

      if (typeof item.label === 'string') {
        return item.label.trim();
      }

      if (typeof item.description === 'string') {
        return item.description.trim();
      }
    }

    return '';
  })
  .filter(Boolean)
  .slice(0, limit);

const buildDefaultReportSummary = (source = {}, engineResult = {}) => {
  if (typeof source.summary === 'string' && source.summary.trim()) {
    return source.summary.trim();
  }

  const score = String(engineResult.score || source.score || '').trim().toUpperCase();
  const savingsValue = Number(engineResult.totalSavingsEur || source.estimatedSavingsPerYear || 0);
  const savingsLabel = savingsValue > 0
    ? `${Math.round(savingsValue).toLocaleString('fr-FR')} EUR / an`
    : '';
  const roiValue = Number(source.roiGlobal || engineResult.roiGlobal || 0);
  const roiLabel = roiValue > 0 ? `${String(roiValue).replace('.', ',')} ans` : '';

  if (score === 'A' || score === 'B') {
    return savingsLabel
      ? `Batiment deja bien positionne. Les gains restants se situent sur des optimisations ciblees, avec un potentiel estime a ${savingsLabel}.`
      : 'Batiment deja bien positionne. Les gains restants se situent sur des optimisations ciblees.';
  }

  if (score === 'C') {
    return savingsLabel
      ? `Niveau de performance dans la mediane du secteur. Des gains accessibles restent mobilisables sur l'exploitation, pour un potentiel estime a ${savingsLabel}.`
      : "Niveau de performance dans la mediane du secteur. Des gains accessibles restent mobilisables sur l'exploitation.";
  }

  if (roiLabel) {
    return `Surconsommation notable. Des actions prioritaires peuvent etre engages avec un ROI global estime a ${roiLabel}.`;
  }

  return 'Surconsommation notable. Des actions prioritaires permettent des gains significatifs sur ce perimetre.';
};

const buildDefaultNarrativeSections = (source = {}, engineResult = {}) => {
  const activity = String(source.activity || source.formData?.activity || source.formData?.activite || '').trim().toLowerCase();
  const isHigh = ['D', 'E'].includes(String(engineResult.score || source.score || '').trim().toUpperCase());
  const isMulti = activity.includes('multi');
  const isLowReliability = String(source.reliability || '').trim().toLowerCase() === 'faible';

  const resultBasis = isMulti
    ? [
      'Perimetre multi-sites consolide',
      'Donnees agregees et heterogenes',
      'Lecture directionnelle a confirmer site par site'
    ]
    : isLowReliability
      ? [
        'Facture annuelle connue',
        'Usage principal identifie',
        'Hypotheses de calcul utilisees pour completer les donnees'
      ]
      : [
        'Surface et activite connues',
        'Usage clairement identifie',
        'Ordres de grandeur bases sur le perimetre analyse'
      ];

  const providerQuestions = isHigh
    ? [
      "Quel poste explique l'essentiel de la derive observee ?",
      'Quels reglages peuvent etre corriges sans investissement lourd ?',
      "Quelles hypotheses d'occupation ont ete retenues ?",
      'Le chiffrage inclut-il fourniture, pose et mise en service ?',
      "Qu'est-ce qui reste hors perimetre a ce stade ?"
    ]
    : [
      'Quels leviers rapides peuvent etre actives en priorite ?',
      "Le gain porte-t-il sur le total ou sur un poste precis ?",
      "Quelles hypotheses d'occupation avez-vous retenues ?",
      'Le chiffrage inclut-il fourniture, pose et mise en service ?',
      "Qu'est-ce qui est exclu de votre perimetre ?"
    ];

  return { resultBasis, providerQuestions };
};

const buildCanonicalReportNarrative = (source = {}, engineResult = {}) => {
  const defaults = buildDefaultNarrativeSections(source, engineResult);
  const resultBasis = normalizeTextList(source.resultBasis, 6);
  const providerQuestions = normalizeTextList(source.providerQuestions, 6);

  return {
    summary: buildDefaultReportSummary(source, engineResult),
    resultBasis: resultBasis.length ? resultBasis : defaults.resultBasis,
    providerQuestions: providerQuestions.length ? providerQuestions : defaults.providerQuestions
  };
};

const normalizeRecommendedActions = (payload, engineResult) => {
  const topActions = asArray(engineResult?.topActions);
  if (topActions.length) {
    return topActions.slice(0, 6).map((action) => ({
      title: action.title || action.name || 'Action recommandee',
      description: action.description || action.sourceWarning || '',
      savings: action.gainEur || action.savingsEuro || 0,
      capex: action.capex || 0,
      roi: action.roi || 0
    }));
  }

  const rawActions = asArray(payload.actions).length
    ? asArray(payload.actions)
    : asArray(payload.actionPlan);

  return rawActions.slice(0, 6).map((action) => ({
    title: action.title || action.name || 'Action recommandee',
    description: action.description || '',
    savings: action.gainEur || action.savingsEuro || 0,
    capex: action.capex || action.cost || 0,
    roi: action.roi || action.timeline || 0
  }));
};

const REPORT_COLORS = {
  chauffage: '#F97316',
  clim: '#06B6D4',
  ventil: '#3B82F6',
  eclairage: '#F59E0B',
  ecs: '#8B5CF6',
  autres: '#94A3B8'
};

const REPORT_LABELS = {
  chauffage: 'Chauffage',
  clim: 'Climatisation',
  ventil: 'Ventilation',
  eclairage: 'Eclairage',
  ecs: 'ECS',
  autres: 'Autres'
};

const REPORT_SCORE_CONFIG = {
  A: { color: '#00A651', background: '#D4F5E3', label: 'A', text: 'Tres performant' },
  B: { color: '#4CAF50', background: '#E8F5E9', label: 'B', text: 'Performant' },
  C: { color: '#F59E0B', background: '#FEF3C7', label: 'C', text: 'Dans la mediane' },
  D: { color: '#F97316', background: '#FFF7ED', label: 'D', text: 'Surconsommation' },
  E: { color: '#EF4444', background: '#FEE2E2', label: 'E', text: 'Tres energivore' }
};

const CO2_ARBRE_KG_AN = 22;
const CO2_VOITURE_KG_AN = 2100;
const CO2_VOITURE_KM = 0.193;

const toNumber = (value, fallback = 0) => {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
};

const formatNumber = (value, digits = 0) => {
  const numeric = toNumber(value, 0);
  return numeric.toLocaleString('fr-FR', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits
  });
};

const computeScoreFromIntensity = (intensityValue, medianValue) => {
  const intensity = toNumber(intensityValue, 0);
  const median = toNumber(medianValue, 0);
  const ratioRaw = median > 0 ? intensity / median : 1;
  const ratio = Number(ratioRaw.toFixed(4));

  if (ratio < 0.6) return { score: 'A', positioning: 'Tres performant', ratio };
  if (ratio < 0.9) return { score: 'B', positioning: 'Performant', ratio };
  if (ratio < 1.2) return { score: 'C', positioning: 'Dans la mediane', ratio };
  if (ratio < 1.7) return { score: 'D', positioning: 'Surconsommation notable', ratio };
  return { score: 'E', positioning: 'Tres energivore', ratio };
};

const getSectorialThresholds = (ref) => {
  if (!ref || !ref.med) return null;
  const med = toNumber(ref.med, 0);
  if (med <= 0) return null;

  return {
    A: Math.round(med * 0.6),
    B: Math.round(med * 0.9),
    C: Math.round(med * 1.2),
    D: Math.round(med * 1.7)
  };
};

const buildCompactBenchmarkData = (buildingValue, medianValue) => {
  const building = Math.round(toNumber(buildingValue, 0));
  const median = Math.round(toNumber(medianValue, 0));
  const buildingColor = building < median ? '#10B981' : '#EF4444';

  return [
    { name: 'Votre batiment', value: building, fill: buildingColor },
    { name: 'Mediane', value: median, fill: '#F59E0B' }
  ].filter((item) => item.value > 0);
};

const getCapexBrutValue = (source) => {
  if (!source) return 0;

  const explicit = Number(source.totalCapexBrut ?? source.totalCapex);
  if (Number.isFinite(explicit) && explicit > 0) {
    return Math.round(explicit);
  }

  const net = Number(source.totalCapexNet);
  const aides = Number(source.aidesTotal ?? source.aidesEstimees);
  if (Number.isFinite(net) && Number.isFinite(aides) && (net > 0 || aides > 0)) {
    return Math.max(0, Math.round(net + aides));
  }

  const actions = source.topActions || source.actions || [];
  const fromActions = actions.reduce((sum, action) => sum + (Number(action?.capex) || 0), 0);
  if (fromActions > 0) {
    return Math.round(fromActions);
  }

  if (Number.isFinite(net) && net > 0) {
    return Math.round(net);
  }

  return 0;
};

const getCO2Equivalences = (co2KgEvite) => {
  const safe = Math.max(0, toNumber(co2KgEvite, 0));
  return {
    arbres: Math.round(safe / CO2_ARBRE_KG_AN),
    voitures: (safe / CO2_VOITURE_KG_AN).toFixed(1),
    km: Math.round(safe / CO2_VOITURE_KM)
  };
};

const buildBreakdownData = (source, engineResult) => {
  const postesSource = Object.keys(asPlainObject(engineResult?.postes)).length
    ? asPlainObject(engineResult.postes)
    : asPlainObject(source.postes);

  return Object.entries(postesSource)
    .filter(([, value]) => toNumber(value?.pct, 0) > 0 || toNumber(value?.kwh, 0) > 0)
    .map(([key, value]) => ({
      key,
      name: REPORT_LABELS[key] || key,
      value: Math.round(toNumber(value?.kwh, 0)),
      eur: Math.round(toNumber(value?.eur, 0)),
      pct: Math.round(toNumber(value?.pct, 0)),
      fill: REPORT_COLORS[key] || '#94A3B8'
    }))
    .sort((left, right) => right.value - left.value);
};

const buildRoiData = (actions = []) => {
  return actions
    .filter((action) => toNumber(action?.roi, 0) > 0 && toNumber(action?.roi, 0) <= 20)
    .sort((left, right) => toNumber(left.roi, 0) - toNumber(right.roi, 0))
    .map((action) => ({
      name: action.title || 'Action recommandee',
      roi: toNumber(action.roi, 0),
      investissement: Math.round(toNumber(action.capex, 0)),
      economie: Math.round(toNumber(action.savings, 0)),
      fill: toNumber(action.roi, 0) <= 3 ? '#059669' : toNumber(action.roi, 0) <= 7 ? '#F59E0B' : '#EF4444'
    }));
};

const buildProjectionModel = (source, engineResult) => {
  const projectionData = asArray(engineResult?.projectionData).length
    ? asArray(engineResult.projectionData)
    : asArray(source.projectionData);
  const rawInflation = toNumber(engineResult?.tauxInflation || source.tauxInflation, 0);
  const inflationPct = rawInflation > 1 ? rawInflation : rawInflation * 100;
  const roiValue = toNumber(source.roiAnnee || engineResult?.roiAnnee || source.roiGlobal || engineResult?.roiGlobal, 0);
  const roiMarkerLabel = roiValue > 0 ? `A+${Math.ceil(roiValue)}` : '';
  const roiMarkerIndex = roiMarkerLabel
    ? projectionData.findIndex((item) => String(item?.annee || '') === roiMarkerLabel)
    : -1;

  return {
    show: projectionData.length > 2 && source.graphiquePubliable !== false && engineResult?.graphiquePubliable !== false,
    data: projectionData,
    inflationPct,
    horizonAns: Math.round(toNumber(engineResult?.horizonAns || source.horizonAns, 10)) || 10,
    roiMarkerLabel,
    roiMarkerIndex,
    annualSavings: Math.round(toNumber(engineResult?.totalSavingsEur || source.estimatedSavingsPerYear, 0)),
    capexNet: Math.round(toNumber(engineResult?.totalCapexNet || source.totalCapexNet || source.totalCapex, 0)),
    aides: Math.round(toNumber(engineResult?.aidesTotal || source.aidesEstimees || source.aidesTotal, 0)),
    roiGlobal: toNumber(engineResult?.roiGlobal || source.roiGlobal, 0)
  };
};

const buildScoreBandModel = (source, engineResult, score) => {
  const median = toNumber(engineResult?.ref?.med || source.benchmark?.median || source.benchmark?.med, 0);
  const currentIntensity = Math.round(toNumber(engineResult?.intensity || source.intensityPerSqm, 0));
  const totalKwh = toNumber(engineResult?.kwhTotal || source.annualConsumption, 0);
  const savingsKwh = toNumber(engineResult?.totalSavingsKwh || source.totalSavingsKwh, 0);
  const savingsPct = totalKwh > 0 ? savingsKwh / totalKwh : 0;
  const afterIntensity = Math.max(0, Math.round(currentIntensity * (1 - savingsPct)));
  const afterScore = source.scoreApresTravauxLabel || computeScoreFromIntensity(afterIntensity, median).score;

  return {
    show: currentIntensity > 0 && median > 0,
    currentScore: score,
    currentIntensity,
    afterScore,
    afterIntensity,
    savingsPct,
    thresholds: getSectorialThresholds({ med: median }),
    scope: engineResult?.ref?.scope || source.activity || source.formData?.activity || '-'
  };
};

const buildEnvironmentalImpactModel = (source, engineResult) => {
  const co2Total = toNumber(engineResult?.co2Total || source.co2Total, 0);
  const co2Apres = toNumber(engineResult?.co2Apres || source.co2Apres, 0);
  const co2Evite = Math.max(0, toNumber(engineResult?.co2Evite || source.co2Evite, co2Total - co2Apres));

  if (co2Evite <= 0) {
    return null;
  }

  const equivalences = getCO2Equivalences(co2Evite);
  return {
    co2Evite,
    arbres: equivalences.arbres,
    voitures: equivalences.voitures,
    km: equivalences.km
  };
};

const buildDonutGradient = (data = []) => {
  const total = data.reduce((sum, item) => sum + Math.max(0, toNumber(item.value, 0)), 0);
  if (total <= 0) {
    return 'conic-gradient(#CBD5E1 0 100%)';
  }

  let start = 0;
  const segments = data.map((item) => {
    const share = (Math.max(0, toNumber(item.value, 0)) / total) * 100;
    const end = start + share;
    const segment = `${item.fill} ${start.toFixed(2)}% ${end.toFixed(2)}%`;
    start = end;
    return segment;
  });

  return `conic-gradient(${segments.join(', ')})`;
};

// Build a static SVG projection chart so the official PDF keeps the same visual structure as the workspace report.
const buildProjectionChartSvg = (projection) => {
  if (!projection?.show) {
    return '';
  }

  const width = 720;
  const height = 280;
  const padding = { top: 18, right: 18, bottom: 42, left: 56 };
  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;
  const data = projection.data;
  const values = data.flatMap((item) => [
    toNumber(item?.sans_travaux, 0),
    toNumber(item?.avec_travaux, 0)
  ]);
  const maxValue = Math.max(...values, 1);

  const xForIndex = (index) => {
    if (data.length <= 1) {
      return padding.left + plotWidth / 2;
    }

    return padding.left + (plotWidth * index) / (data.length - 1);
  };

  const yForValue = (value) => padding.top + plotHeight - ((toNumber(value, 0) / maxValue) * plotHeight);
  const buildPoints = (key) => data.map((item, index) => `${xForIndex(index)},${yForValue(item?.[key])}`).join(' ');
  const areaPoints = [
    `${xForIndex(0)},${padding.top + plotHeight}`,
    ...data.map((item, index) => `${xForIndex(index)},${yForValue(item?.avec_travaux)}`),
    `${xForIndex(data.length - 1)},${padding.top + plotHeight}`
  ].join(' ');

  const gridValues = [0, 0.25, 0.5, 0.75, 1].map((ratio) => Math.round(maxValue * ratio));
  const gridHtml = gridValues.map((value) => {
    const y = yForValue(value);
    const label = value >= 1000 ? `${Math.round(value / 1000)}kEUR` : `${value} EUR`;
    return `
      <line x1="${padding.left}" y1="${y}" x2="${width - padding.right}" y2="${y}" stroke="#E2E8F0" stroke-width="1" />
      <text x="${padding.left - 10}" y="${y + 4}" text-anchor="end" font-size="11" fill="#64748B">${escapeHtml(label)}</text>
    `;
  }).join('');

  const xLabels = data.map((item, index) => `
    <text x="${xForIndex(index)}" y="${height - 14}" text-anchor="middle" font-size="11" fill="#64748B">${escapeHtml(String(item?.annee || ''))}</text>
  `).join('');

  const roiMarkerHtml = projection.roiMarkerIndex >= 0
    ? `
      <line x1="${xForIndex(projection.roiMarkerIndex)}" y1="${padding.top}" x2="${xForIndex(projection.roiMarkerIndex)}" y2="${padding.top + plotHeight}" stroke="#1B4FD8" stroke-width="2" stroke-dasharray="6 5" />
      <text x="${xForIndex(projection.roiMarkerIndex) + 6}" y="${padding.top + 14}" font-size="11" font-weight="700" fill="#1B4FD8">Rentable ${escapeHtml(projection.roiMarkerLabel)}</text>
    `
    : '';

  return `
    <svg viewBox="0 0 ${width} ${height}" class="projection-svg" role="img" aria-label="Projection financiere">
      ${gridHtml}
      <polygon points="${areaPoints}" fill="rgba(16, 185, 129, 0.08)"></polygon>
      <polyline points="${buildPoints('sans_travaux')}" fill="none" stroke="#EF4444" stroke-width="3" stroke-dasharray="9 7"></polyline>
      <polyline points="${buildPoints('avec_travaux')}" fill="none" stroke="#10B981" stroke-width="4"></polyline>
      ${roiMarkerHtml}
      ${xLabels}
    </svg>
  `;
};

const buildReportPdfPayload = ({
  reportRecord,
  caseRecord,
  organizationRecord,
  settingsRecord,
  brandingRecord,
  logoDataUrl
}) => {
  const reportPayload = asPlainObject(reportRecord?.report_payload);
  const casePayload = asPlainObject(caseRecord?.case_data);
  const source = { ...casePayload, ...reportPayload };
  const rawEngineResult = asPlainObject(source.engineResult);
  const reportSummary = asPlainObject(reportRecord?.report_summary);

  const brandName = String(
    settingsRecord?.brand_name
      || organizationRecord?.name
      || source.brandName
      || 'DiagTertiaire Pro'
  ).trim();

  const accent = String(settingsRecord?.accent || DEFAULT_ACCENT).trim() || DEFAULT_ACCENT;
  const clientName = source.clientName || source.company || source.projectName || reportRecord?.report_name || 'Rapport';
  const projectName = source.projectName || clientName;
  const activity = source.activity || source.formData?.activity || caseRecord?.activity_type || '-';
  const surface = source.surfaceLabel || (source.buildingArea ? `${formatInteger(source.buildingArea, 'm2')}` : '-');
  const address = source.address || source.postalCode || '-';
  const reportName = reportRecord?.report_name || projectName || clientName || 'Rapport';
  const median = toNumber(rawEngineResult.ref?.med || source.benchmark?.median || source.benchmark?.med, 0);
  const intensity = Math.round(toNumber(rawEngineResult.intensity || source.intensityPerSqm || reportSummary.intensity_per_sqm, 0));
  const computedScore = computeScoreFromIntensity(intensity, median);
  const score = rawEngineResult.score || source.score || reportSummary.score || computedScore.score || '-';
  const positioning = rawEngineResult.positioning || source.positioning || computedScore.positioning || '';
  const confidence = rawEngineResult.badgeConfiance || source.scoreConfidence || '';
  const effectiveEngineResult = {
    ...rawEngineResult,
    score,
    positioning,
    badgeConfiance: confidence,
    intensity,
    ref: {
      ...(rawEngineResult.ref || {}),
      med: median,
      scope: rawEngineResult.ref?.scope || activity,
      unit: rawEngineResult.ref?.unit || 'kWh EF/m2/an'
    },
    kwhTotal: Math.round(toNumber(rawEngineResult.kwhTotal || source.annualConsumption, 0)),
    totalBill: Math.round(toNumber(rawEngineResult.totalBill || source.annualCost, 0)),
    totalSavingsEur: Math.round(toNumber(rawEngineResult.totalSavingsEur || source.estimatedSavingsPerYear || reportSummary.estimated_savings_per_year, 0)),
    totalSavingsKwh: Math.round(toNumber(rawEngineResult.totalSavingsKwh || source.totalSavingsKwh, 0)),
    co2Total: Math.round(toNumber(rawEngineResult.co2Total || source.co2Total, 0)),
    co2Apres: Math.round(toNumber(rawEngineResult.co2Apres || source.co2Apres, 0)),
    totalCapexNet: Math.round(toNumber(rawEngineResult.totalCapexNet || source.totalCapexNet || source.totalCapex, 0)),
    aidesTotal: Math.round(toNumber(rawEngineResult.aidesTotal || source.aidesEstimees || source.aidesTotal, 0)),
    projectionData: asArray(rawEngineResult.projectionData).length ? asArray(rawEngineResult.projectionData) : asArray(source.projectionData),
    horizonAns: Math.round(toNumber(rawEngineResult.horizonAns || source.horizonAns, 10)) || 10,
    roiGlobal: toNumber(rawEngineResult.roiGlobal || source.roiGlobal, 0),
    tauxInflation: rawEngineResult.tauxInflation || source.tauxInflation || 0,
    graphiquePubliable: rawEngineResult.graphiquePubliable !== false && source.graphiquePubliable !== false,
    zone: rawEngineResult.zone || source.zone || '',
    anneeCorr: rawEngineResult.anneeCorr || source.anneeCorr || 1,
    postes: Object.keys(asPlainObject(rawEngineResult.postes)).length ? asPlainObject(rawEngineResult.postes) : asPlainObject(source.postes)
  };
  const narrative = buildCanonicalReportNarrative(source, effectiveEngineResult);
  const recommendedActions = normalizeRecommendedActions(source, effectiveEngineResult);
  const scoreTone = getScoreTone(score);
  const breakdownData = buildBreakdownData(source, effectiveEngineResult);
  const benchmarkData = buildCompactBenchmarkData(effectiveEngineResult.intensity, effectiveEngineResult.ref?.med || 0);
  const roiData = buildRoiData(recommendedActions);
  const projection = buildProjectionModel(source, effectiveEngineResult);
  const scoreBand = buildScoreBandModel(source, effectiveEngineResult, score);
  const environmentalImpact = buildEnvironmentalImpactModel(source, effectiveEngineResult);
  const capexBrut = getCapexBrutValue({
    ...source,
    ...effectiveEngineResult,
    topActions: recommendedActions
  });

  return {
    brandName,
    accent,
    logoDataUrl: logoDataUrl || '',
    reportId: reportRecord?.id,
    reportName,
    clientName,
    projectName,
    activity,
    surface,
    address,
    summary: narrative.summary,
    generatedAtLabel: formatDateTime(new Date().toISOString()),
    score,
    scoreTone,
    positioning,
    confidence,
    reportGeneratedAtLabel: source.reportGeneratedAt || reportRecord?.updated_at ? formatDateTime(source.reportGeneratedAt || reportRecord?.updated_at) : '',
    metrics: [
      {
        label: 'Consommation',
        value: formatInteger(effectiveEngineResult.kwhTotal, 'kWh/an'),
        sub: formatInteger(effectiveEngineResult.intensity, 'kWh/m2/an'),
        accent: '#2563EB'
      },
      {
        label: 'Facture estimee',
        value: formatCurrency(effectiveEngineResult.totalBill),
        sub: rawEngineResult.isFallback ? 'Ratio sectoriel' : 'Donnees saisies',
        accent: '#059669'
      },
      {
        label: 'Economies potentielles',
        value: formatCurrency(effectiveEngineResult.totalSavingsEur),
        sub: formatInteger(effectiveEngineResult.totalSavingsKwh, 'kWh econ.'),
        accent: '#F97316'
      },
      {
        label: 'CO2 actuel',
        value: formatInteger(effectiveEngineResult.co2Total, 'kg/an'),
        sub: `Apres travaux : ${formatInteger(effectiveEngineResult.co2Apres, 'kg')}`,
        accent: '#7C3AED'
      }
    ],
    resultBasis: narrative.resultBasis,
    providerQuestions: narrative.providerQuestions,
    recommendedActions,
    breakdownData,
    benchmarkData,
    roiData,
    projection,
    scoreBand,
    environmentalImpact,
    actionSummary: {
      capexBrut,
      aides: Math.round(toNumber(effectiveEngineResult.aidesTotal, 0)),
      capexNet: Math.round(toNumber(effectiveEngineResult.totalCapexNet, 0)),
      annualSavings: Math.round(toNumber(effectiveEngineResult.totalSavingsEur, 0)),
      roiGlobal: effectiveEngineResult.roiGlobal
    }
  };
};

const buildReportPdfHtml = (viewModel) => {
  const metricsHtml = viewModel.metrics.map((metric) => `
    <div class="metric-card">
      <div class="metric-label">${escapeHtml(metric.label)}</div>
      <div class="metric-value">${escapeHtml(metric.value)}</div>
      <div class="metric-sub">${escapeHtml(metric.sub)}</div>
    </div>
  `).join('');

  const actionsHtml = viewModel.recommendedActions.length
    ? viewModel.recommendedActions.map((action) => `
      <div class="action-card">
        <div class="action-header">
          <h3>${escapeHtml(action.title)}</h3>
          <span>${escapeHtml(typeof action.roi === 'number' && action.roi > 0 ? `${String(action.roi).replace('.', ',')} ans` : String(action.roi || 'Prioritaire'))}</span>
        </div>
        ${action.description ? `<p class="action-description">${escapeHtml(action.description)}</p>` : ''}
        <div class="action-metrics">
          <div><strong>Investissement</strong><span>${escapeHtml(formatCurrency(action.capex || 0))}</span></div>
          <div><strong>Economies / an</strong><span>${escapeHtml(formatCurrency(action.savings || 0))}</span></div>
        </div>
      </div>
    `).join('')
    : '<p class="empty-state">Aucune action detaillee n\'est disponible dans le rapport sauvegarde.</p>';

  const resultBasisHtml = viewModel.resultBasis.length
    ? `<ul>${viewModel.resultBasis.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul>`
    : '<p class="empty-state">Base de calcul non detaillee dans ce rapport.</p>';

  const providerQuestionsHtml = viewModel.providerQuestions.length
    ? `<ul>${viewModel.providerQuestions.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul>`
    : '<p class="empty-state">Aucune question complementaire en attente.</p>';

  return `<!DOCTYPE html>
  <html lang="fr">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>${escapeHtml(viewModel.reportName)}</title>
      <style>
        :root {
          --accent: ${escapeHtml(viewModel.accent)};
          --accent-soft: rgba(29, 78, 216, 0.08);
          --text: #0f172a;
          --muted: #475569;
          --border: #e2e8f0;
          --surface: #ffffff;
          --surface-soft: #f8fafc;
        }
        * { box-sizing: border-box; }
        body {
          margin: 0;
          font-family: Arial, Helvetica, sans-serif;
          color: var(--text);
          background: #eef2f7;
          padding: 32px;
        }
        .page {
          max-width: 920px;
          margin: 0 auto;
          background: var(--surface);
          border-radius: 24px;
          overflow: hidden;
          box-shadow: 0 18px 45px rgba(15, 23, 42, 0.12);
        }
        .hero {
          background: linear-gradient(135deg, #0f172a 0%, #102a43 55%, var(--accent) 100%);
          color: #fff;
          padding: 36px 40px;
        }
        .hero-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 24px;
          padding-bottom: 20px;
          margin-bottom: 20px;
          border-bottom: 1px solid rgba(255,255,255,0.14);
        }
        .brand-block {
          display: flex;
          align-items: center;
          gap: 14px;
          min-width: 0;
        }
        .brand-logo {
          max-height: 46px;
          max-width: 180px;
          object-fit: contain;
          display: block;
        }
        .brand-name {
          font-size: 24px;
          font-weight: 700;
          line-height: 1.2;
        }
        .hero-kicker {
          font-size: 12px;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: rgba(191, 219, 254, 0.95);
          font-weight: 700;
        }
        .hero-main {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 24px;
        }
        .hero-main h1 {
          margin: 6px 0 8px;
          font-size: 34px;
          line-height: 1.08;
        }
        .hero-meta {
          font-size: 14px;
          color: rgba(226, 232, 240, 0.9);
          line-height: 1.7;
        }
        .score-card {
          min-width: 180px;
          background: rgba(255,255,255,0.12);
          border: 1px solid rgba(255,255,255,0.16);
          border-radius: 20px;
          padding: 18px 20px;
          text-align: center;
        }
        .score-card-label {
          font-size: 12px;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: rgba(226, 232, 240, 0.86);
          font-weight: 700;
        }
        .score-card-value {
          width: 72px;
          height: 72px;
          border-radius: 20px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          margin: 14px auto 10px;
          font-size: 40px;
          font-weight: 800;
          color: ${escapeHtml(viewModel.scoreTone.color)};
          background: ${escapeHtml(viewModel.scoreTone.background)};
        }
        .score-card-sub {
          font-size: 13px;
          color: rgba(226, 232, 240, 0.94);
        }
        .content {
          padding: 32px 40px 40px;
        }
        .metrics-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 14px;
          margin-bottom: 26px;
        }
        .metric-card {
          background: var(--surface-soft);
          border: 1px solid var(--border);
          border-radius: 18px;
          padding: 18px;
        }
        .metric-label {
          font-size: 11px;
          line-height: 1.4;
          text-transform: uppercase;
          letter-spacing: 0.12em;
          font-weight: 700;
          color: var(--accent);
          margin-bottom: 8px;
        }
        .metric-value {
          font-size: 20px;
          font-weight: 800;
          line-height: 1.2;
        }
        .metric-sub {
          font-size: 12px;
          color: var(--muted);
          margin-top: 6px;
        }
        .section {
          margin-top: 22px;
          border: 1px solid var(--border);
          border-radius: 20px;
          padding: 22px;
          background: var(--surface);
        }
        .section h2 {
          margin: 0 0 12px;
          font-size: 20px;
          line-height: 1.25;
        }
        .section p,
        .section li {
          font-size: 14px;
          line-height: 1.7;
          color: var(--muted);
        }
        .section ul {
          margin: 0;
          padding-left: 18px;
        }
        .section-grid {
          display: grid;
          grid-template-columns: 1.1fr 0.9fr;
          gap: 20px;
        }
        .action-card {
          background: var(--surface-soft);
          border: 1px solid var(--border);
          border-radius: 16px;
          padding: 16px;
          margin-bottom: 12px;
        }
        .action-card:last-child {
          margin-bottom: 0;
        }
        .action-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 16px;
        }
        .action-header h3 {
          margin: 0;
          font-size: 15px;
          line-height: 1.45;
          color: var(--text);
        }
        .action-header span {
          white-space: nowrap;
          font-size: 12px;
          font-weight: 700;
          color: var(--accent);
          background: var(--accent-soft);
          border-radius: 999px;
          padding: 6px 10px;
        }
        .action-description {
          margin: 10px 0 14px;
        }
        .action-metrics {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
        }
        .action-metrics div {
          background: #fff;
          border: 1px solid var(--border);
          border-radius: 14px;
          padding: 12px;
        }
        .action-metrics strong {
          display: block;
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: var(--muted);
          margin-bottom: 4px;
        }
        .action-metrics span {
          font-size: 14px;
          font-weight: 700;
          color: var(--text);
        }
        .empty-state {
          margin: 0;
          color: var(--muted);
        }
        .footer-note {
          margin-top: 24px;
          font-size: 11px;
          text-align: center;
          color: #64748b;
        }
      </style>
    </head>
    <body>
      <div class="page">
        <div class="hero">
          <div class="hero-top">
            <div class="brand-block">
              ${viewModel.logoDataUrl ? `<img class="brand-logo" src="${viewModel.logoDataUrl}" alt="Logo organisation" />` : ''}
              <div class="brand-name">${escapeHtml(viewModel.brandName)}</div>
            </div>
            <div class="hero-kicker">PDF officiel sauvegarde</div>
          </div>
          <div class="hero-main">
            <div>
              <div class="hero-kicker">Pre-diagnostic energetique</div>
              <h1>${escapeHtml(viewModel.clientName)}</h1>
              <div class="hero-meta">
                ${escapeHtml(viewModel.activity)} | ${escapeHtml(viewModel.surface)} | ${escapeHtml(viewModel.address)}<br />
                Rapport ${escapeHtml(viewModel.reportId)} | Genere le ${escapeHtml(viewModel.generatedAtLabel)}
              </div>
            </div>
            <div class="score-card">
              <div class="score-card-label">Score energetique</div>
              <div class="score-card-value">${escapeHtml(viewModel.score)}</div>
              <div class="score-card-sub">${escapeHtml(viewModel.positioning || viewModel.confidence || 'Rapport sauvegarde')}</div>
            </div>
          </div>
        </div>
        <div class="content">
          <div class="metrics-grid">${metricsHtml}</div>
          <div class="section">
            <h2>Synthese</h2>
            <p>${escapeHtml(viewModel.summary || 'Le rapport officiel a ete genere a partir des donnees sauvegardees du dossier. Le detail complet reste disponible dans l espace pro.')}</p>
          </div>
          <div class="section-grid">
            <div class="section">
              <h2>Actions recommandees</h2>
              ${actionsHtml}
            </div>
            <div>
              <div class="section">
                <h2>Base de calcul</h2>
                ${resultBasisHtml}
              </div>
              <div class="section">
                <h2>Points a confirmer</h2>
                ${providerQuestionsHtml}
              </div>
            </div>
          </div>
          <div class="footer-note">
            DiagTertiaire Pro | Document genere cote serveur et archive dans l'espace prive de l'organisation.
          </div>
        </div>
      </div>
    </body>
  </html>`;
};

const buildRichReportPdfHtml = (viewModel) => {
  const metricsHtml = viewModel.metrics.map((metric) => `
    <div class="metric-card" style="--metric-accent:${escapeHtml(metric.accent || viewModel.accent)};">
      <div class="metric-label">${escapeHtml(metric.label)}</div>
      <div class="metric-value">${escapeHtml(metric.value)}</div>
      <div class="metric-sub">${escapeHtml(metric.sub)}</div>
    </div>
  `).join('');

  const actionsHtml = viewModel.recommendedActions.length
    ? viewModel.recommendedActions.map((action) => `
      <div class="action-card">
        <div class="action-header">
          <div class="action-copy">
            <h3>${escapeHtml(action.title)}</h3>
            ${action.description ? `<p class="action-description">${escapeHtml(action.description)}</p>` : ''}
          </div>
          <span class="action-roi">${escapeHtml(typeof action.roi === 'number' && action.roi > 0 ? `${String(action.roi).replace('.', ',')} ans` : String(action.roi || 'Prioritaire'))}</span>
        </div>
        <div class="action-metrics">
          <div><strong>Investissement</strong><span>${escapeHtml(formatCurrency(action.capex || 0))}</span></div>
          <div><strong>Economies / an</strong><span>${escapeHtml(formatCurrency(action.savings || 0))}</span></div>
          <div><strong>ROI</strong><span>${escapeHtml(typeof action.roi === 'number' && action.roi > 0 ? `${String(action.roi).replace('.', ',')} ans` : 'A confirmer')}</span></div>
        </div>
      </div>
    `).join('')
    : '<p class="empty-state">Aucune action detaillee n\'est disponible dans le rapport sauvegarde.</p>';

  const resultBasisHtml = viewModel.resultBasis.length
    ? `<ul class="bullet-list">${viewModel.resultBasis.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul>`
    : '<p class="empty-state">Base de calcul non detaillee dans ce rapport.</p>';

  const providerQuestionsHtml = viewModel.providerQuestions.length
    ? `<ul class="bullet-list">${viewModel.providerQuestions.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul>`
    : '<p class="empty-state">Aucune question complementaire en attente.</p>';

  const breakdownTotalKwh = viewModel.breakdownData.reduce((sum, item) => sum + item.value, 0);
  const breakdownHtml = viewModel.breakdownData.length
    ? `
      <div class="split-chart">
        <div class="donut-wrapper">
          <div class="donut-chart" style="background:${buildDonutGradient(viewModel.breakdownData)};">
            <div class="donut-hole">
              <div class="donut-kicker">Consommation</div>
              <div class="donut-value">${escapeHtml(formatInteger(breakdownTotalKwh, 'kWh/an'))}</div>
            </div>
          </div>
        </div>
        <div class="legend-list">
          ${viewModel.breakdownData.map((item) => `
            <div class="legend-row">
              <div class="legend-main">
                <span class="legend-dot" style="background:${item.fill};"></span>
                <span class="legend-name">${escapeHtml(item.name)}</span>
              </div>
              <div class="legend-meta">
                <span>${escapeHtml(`${item.pct}%`)}</span>
                <strong>${escapeHtml(formatCurrency(item.eur || 0))}</strong>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `
    : '<p class="empty-state">Repartition par poste indisponible.</p>';

  const benchmarkMax = Math.max(...viewModel.benchmarkData.map((item) => item.value), 1);
  const benchmarkHtml = viewModel.benchmarkData.length
    ? `
      <div class="bar-list">
        ${viewModel.benchmarkData.map((item) => `
          <div class="bar-row">
            <div class="bar-row-head">
              <span>${escapeHtml(item.name)}</span>
              <strong>${escapeHtml(`${formatNumber(item.value)} kWh/m2/an`)}</strong>
            </div>
            <div class="bar-track">
              <div class="bar-fill" style="width:${Math.max(8, Math.round((item.value / benchmarkMax) * 100))}%; background:${item.fill};"></div>
            </div>
          </div>
        `).join('')}
      </div>
    `
    : '<p class="empty-state">Benchmark sectoriel indisponible.</p>';

  const roiMax = Math.max(...viewModel.roiData.map((item) => item.roi), 1);
  const roiHtml = viewModel.roiData.length
    ? `
      <div class="roi-list">
        ${viewModel.roiData.map((item) => `
          <div class="roi-row">
            <div class="roi-head">
              <span>${escapeHtml(item.name)}</span>
              <strong>${escapeHtml(`${String(item.roi).replace('.', ',')} ans`)}</strong>
            </div>
            <div class="roi-track">
              <div class="roi-fill" style="width:${Math.max(8, Math.round((item.roi / roiMax) * 100))}%; background:${item.fill};"></div>
            </div>
            <div class="roi-foot">
              <span>Invest. ${escapeHtml(formatCurrency(item.investissement))}</span>
              <span>Eco. ${escapeHtml(formatCurrency(item.economie))}/an</span>
            </div>
          </div>
        `).join('')}
      </div>
    `
    : '<p class="empty-state">Comparatif ROI indisponible.</p>';

  const thresholds = viewModel.scoreBand.thresholds || {};
  const renderScoreBandColumn = (score, intensity) => ['A', 'B', 'C', 'D', 'E'].map((letter) => {
    const config = REPORT_SCORE_CONFIG[letter];
    const isActive = letter === score;
    const thresholdLabel = letter === 'A'
      ? `< ${formatNumber(thresholds.A || 0)} kWh`
      : letter === 'B'
        ? `${formatNumber(thresholds.A || 0)} - ${formatNumber(thresholds.B || 0)} kWh`
        : letter === 'C'
          ? `${formatNumber(thresholds.B || 0)} - ${formatNumber(thresholds.C || 0)} kWh`
          : letter === 'D'
            ? `${formatNumber(thresholds.C || 0)} - ${formatNumber(thresholds.D || 0)} kWh`
            : `> ${formatNumber(thresholds.D || 0)} kWh`;

    return `
      <div class="score-band-row${isActive ? ' active' : ''}" style="${isActive ? `background:${config.color};` : ''}">
        <div class="score-band-letter" style="background:${config.color}; opacity:${isActive ? '1' : '0.26'};">${letter}</div>
        <div class="score-band-copy">
          ${isActive
            ? `<div class="score-band-value">${escapeHtml(`${formatNumber(intensity)} kWh/m2/an`)}</div><div class="score-band-text">${escapeHtml(config.text)}</div>`
            : `<div class="score-band-threshold">${escapeHtml(thresholdLabel)}</div>`}
        </div>
      </div>
    `;
  }).join('');

  const scoreBandHtml = viewModel.scoreBand.show
    ? `
      <div class="report-card section-space">
        <div class="card-title">Indice DiagTertiaire - avant / apres travaux</div>
        <div class="card-subtitle">Indicateur indicatif - non opposable, hors cadre OPERAT reglementaire.</div>
        <div class="score-band-grid">
          <div class="score-band-card">
            <div class="score-band-head">Etiquette actuelle</div>
            ${renderScoreBandColumn(viewModel.scoreBand.currentScore, viewModel.scoreBand.currentIntensity)}
            <div class="score-band-foot">Indice DiagTertiaire - indicatif - secteur ${escapeHtml(viewModel.scoreBand.scope)}</div>
          </div>
          <div class="score-band-delta">
            <div class="score-band-arrow">&rarr;</div>
            <div class="score-band-delta-label">-${Math.round(viewModel.scoreBand.savingsPct * 100)}%</div>
          </div>
          <div class="score-band-card">
            <div class="score-band-head">Apres travaux estimes</div>
            ${renderScoreBandColumn(viewModel.scoreBand.afterScore, viewModel.scoreBand.afterIntensity)}
            <div class="score-band-foot">Indice DiagTertiaire - indicatif - secteur ${escapeHtml(viewModel.scoreBand.scope)}</div>
          </div>
        </div>
      </div>
    `
    : '';

  const projectionHtml = viewModel.projection.show
    ? `
      <div class="report-card section-space">
        <div class="chart-title">Projection financiere sur ${escapeHtml(String(viewModel.projection.horizonAns))} ans</div>
        <div class="chart-note">Inflation ponderee : ${escapeHtml(`${formatNumber(viewModel.projection.inflationPct, 1)}%/an`)} - Invest. net apres aides estimees : ${escapeHtml(formatCurrency(viewModel.projection.capexNet))}</div>
        ${buildProjectionChartSvg(viewModel.projection)}
        <div class="mini-stats">
          <div class="mini-stat"><div class="mini-stat-label">Economies / an</div><div class="mini-stat-value text-green">${escapeHtml(formatCurrency(viewModel.projection.annualSavings))}</div></div>
          <div class="mini-stat"><div class="mini-stat-label">Invest. net estime</div><div class="mini-stat-value text-blue">${escapeHtml(formatCurrency(viewModel.projection.capexNet))}</div></div>
          <div class="mini-stat"><div class="mini-stat-label">ROI global</div><div class="mini-stat-value">${escapeHtml(viewModel.projection.roiGlobal > 0 ? `${String(viewModel.projection.roiGlobal).replace('.', ',')} ans` : '-')}</div></div>
        </div>
      </div>
    `
    : '';

  const environmentalImpactHtml = viewModel.environmentalImpact
    ? `
      <div class="impact-card section-space">
        <div class="impact-header">
          <span class="impact-kicker">Impact environnemental des travaux</span>
          <span class="impact-badge">CO2 evite / an</span>
        </div>
        <div class="impact-grid">
          <div class="impact-tile"><div class="impact-value">${escapeHtml(formatNumber(viewModel.environmentalImpact.arbres))}</div><div class="impact-label">arbres absorbant le meme CO2 en 1 an</div></div>
          <div class="impact-tile"><div class="impact-value">${escapeHtml(String(viewModel.environmentalImpact.voitures))}</div><div class="impact-label">voitures retirees de la circulation pendant 1 an</div></div>
          <div class="impact-tile"><div class="impact-value">${escapeHtml(`${formatNumber(viewModel.environmentalImpact.km)} km`)}</div><div class="impact-label">de route evites</div></div>
        </div>
      </div>
    `
    : '';

  return `<!DOCTYPE html>
  <html lang="fr">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>${escapeHtml(viewModel.reportName)}</title>
      <style>
        :root { --accent:${escapeHtml(viewModel.accent)}; --border:#e2e8f0; --surface:#ffffff; --surface-soft:#f8fafc; --text:#0f172a; --muted:#475569; }
        * { box-sizing:border-box; }
        @page { margin:18mm 14mm; }
        body { margin:0; background:#f1f5f9; color:var(--text); font-family:Inter, "Segoe UI", Arial, sans-serif; }
        .page { max-width:1120px; margin:0 auto; padding:24px 18px 30px; }
        .hero { background:linear-gradient(135deg,#0f172a 0%,#102a43 58%,var(--accent) 100%); color:#fff; border-radius:26px; padding:34px 36px; box-shadow:0 20px 50px rgba(15,23,42,0.18); page-break-inside:avoid; }
        .hero-top { display:flex; align-items:center; justify-content:space-between; gap:20px; padding-bottom:18px; margin-bottom:18px; border-bottom:1px solid rgba(255,255,255,0.12); }
        .brand-block { display:flex; align-items:center; gap:14px; }
        .brand-logo { display:block; max-height:44px; max-width:180px; object-fit:contain; }
        .brand-name { font-size:22px; font-weight:800; line-height:1.1; }
        .hero-kicker { font-size:12px; font-weight:700; letter-spacing:0.14em; text-transform:uppercase; color:rgba(191,219,254,0.92); }
        .hero-main { display:flex; align-items:flex-start; justify-content:space-between; gap:28px; }
        .hero-main h1 { margin:8px 0 8px; font-size:36px; line-height:1.02; letter-spacing:-0.03em; }
        .hero-meta { font-size:14px; line-height:1.7; color:rgba(226,232,240,0.92); }
        .score-card { min-width:190px; padding:18px 20px; border-radius:22px; background:rgba(255,255,255,0.12); border:1px solid rgba(255,255,255,0.16); text-align:center; }
        .score-card-label { font-size:11px; text-transform:uppercase; letter-spacing:0.12em; color:rgba(226,232,240,0.84); font-weight:700; }
        .score-card-value { width:74px; height:74px; margin:14px auto 10px; border-radius:22px; display:inline-flex; align-items:center; justify-content:center; background:${escapeHtml(viewModel.scoreTone.background)}; color:${escapeHtml(viewModel.scoreTone.color)}; font-size:42px; font-weight:900; }
        .score-card-sub { font-size:12px; line-height:1.5; color:rgba(226,232,240,0.94); }
        .content { padding:24px 2px 0; }
        .metrics-grid { display:grid; grid-template-columns:repeat(4,minmax(0,1fr)); gap:14px; margin:0 0 18px; page-break-inside:avoid; }
        .metric-card,.report-card,.section { background:#fff; border:1px solid var(--border); border-radius:24px; padding:24px; box-shadow:0 8px 24px rgba(15,23,42,0.05); page-break-inside:avoid; }
        .metric-card { border-radius:18px; padding:18px; }
        .metric-label { font-size:11px; text-transform:uppercase; letter-spacing:0.12em; font-weight:800; color:var(--metric-accent); margin-bottom:8px; }
        .metric-value { font-size:20px; font-weight:900; line-height:1.2; }
        .metric-sub { margin-top:6px; font-size:12px; color:#64748b; line-height:1.5; }
        .card-title,.chart-title,.section h2 { margin:0 0 8px; font-size:21px; line-height:1.14; font-weight:900; letter-spacing:-0.03em; color:#0f172a; }
        .card-subtitle,.chart-note { margin:0 0 18px; font-size:13px; line-height:1.7; color:#94a3b8; }
        .chart-grid { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:18px; margin-top:18px; }
        .split-chart { display:grid; grid-template-columns:280px 1fr; gap:22px; align-items:center; }
        .donut-wrapper { display:flex; justify-content:center; }
        .donut-chart { width:220px; height:220px; border-radius:999px; position:relative; }
        .donut-hole { position:absolute; inset:34px; background:#fff; border-radius:999px; display:flex; flex-direction:column; align-items:center; justify-content:center; text-align:center; box-shadow:inset 0 0 0 1px rgba(226,232,240,0.9); padding:18px; }
        .donut-kicker { font-size:11px; text-transform:uppercase; letter-spacing:0.1em; color:#64748b; font-weight:700; }
        .donut-value { margin-top:8px; font-size:20px; font-weight:900; line-height:1.2; }
        .legend-list,.bar-list,.roi-list { display:flex; flex-direction:column; gap:12px; }
        .legend-row,.bar-row,.roi-row { border:1px solid var(--border); background:var(--surface-soft); border-radius:16px; padding:12px 14px; }
        .legend-main,.bar-row-head,.roi-head { display:flex; align-items:center; justify-content:space-between; gap:12px; }
        .legend-main { justify-content:flex-start; }
        .legend-dot { width:12px; height:12px; border-radius:999px; flex:none; }
        .legend-name,.bar-row-head span,.roi-head span { font-size:13px; font-weight:700; color:#334155; }
        .legend-meta,.roi-foot { display:flex; gap:14px; align-items:center; justify-content:space-between; margin-top:8px; font-size:12px; color:#64748b; }
        .legend-meta strong,.bar-row-head strong,.roi-head strong { font-size:13px; color:#0f172a; }
        .bar-track,.roi-track { width:100%; height:14px; margin-top:10px; background:#e2e8f0; border-radius:999px; overflow:hidden; }
        .bar-fill,.roi-fill { height:100%; border-radius:999px; }
        .score-band-grid { display:grid; grid-template-columns:1fr 84px 1fr; gap:20px; align-items:center; }
        .score-band-card { border:1px solid var(--border); border-radius:20px; overflow:hidden; background:#fff; }
        .score-band-head { background:#1e293b; color:#fff; padding:12px 18px; font-size:12px; font-weight:800; letter-spacing:0.08em; text-transform:uppercase; }
        .score-band-row { display:flex; align-items:center; gap:12px; padding:10px 16px; border-bottom:1px solid #eef2f7; }
        .score-band-row.active { color:#fff; }
        .score-band-letter { width:36px; height:36px; border-radius:8px; display:inline-flex; align-items:center; justify-content:center; color:#fff; font-size:16px; font-weight:900; flex:none; }
        .score-band-value { font-size:16px; font-weight:900; line-height:1.2; }
        .score-band-text { font-size:11px; opacity:0.88; }
        .score-band-threshold { font-size:12px; color:#94a3b8; font-weight:700; }
        .score-band-foot { background:#f8fafc; color:#94a3b8; font-size:11px; font-style:italic; padding:10px 16px; }
        .score-band-delta { display:flex; flex-direction:column; align-items:center; justify-content:center; gap:6px; color:#16a34a; font-weight:800; }
        .score-band-arrow { font-size:34px; line-height:1; }
        .score-band-delta-label { font-size:24px; }
        .action-card { background:var(--surface-soft); border:1px solid var(--border); border-radius:16px; padding:16px; margin-bottom:12px; }
        .action-card:last-child { margin-bottom:0; }
        .action-header { display:flex; align-items:flex-start; justify-content:space-between; gap:16px; }
        .action-copy h3 { margin:0; font-size:15px; line-height:1.45; }
        .action-roi { white-space:nowrap; font-size:12px; font-weight:800; color:#1d4ed8; background:rgba(29,78,216,0.10); border-radius:999px; padding:6px 10px; }
        .action-description { margin:8px 0 0; font-size:13px; line-height:1.65; color:#64748b; }
        .action-metrics { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:12px; margin-top:14px; }
        .action-metrics div,.mini-stat,.impact-tile { border:1px solid var(--border); background:#fff; border-radius:14px; padding:12px; text-align:center; }
        .action-metrics strong,.mini-stat-label { display:block; font-size:11px; text-transform:uppercase; letter-spacing:0.08em; color:#64748b; font-weight:800; }
        .action-metrics span { display:block; margin-top:4px; font-size:14px; font-weight:800; color:#0f172a; }
        .projection-svg { width:100%; height:auto; display:block; margin-top:8px; }
        .mini-stats,.impact-grid,.section-grid { display:grid; gap:14px; margin-top:14px; }
        .mini-stats,.impact-grid { grid-template-columns:repeat(3,minmax(0,1fr)); }
        .mini-stat-value { margin-top:8px; font-size:22px; line-height:1.15; font-weight:900; color:#0f172a; }
        .text-green { color:#16a34a; } .text-blue { color:#1d4ed8; }
        .impact-card { background:#ecfdf5; border:1px solid #d1fae5; border-radius:24px; padding:22px; page-break-inside:avoid; }
        .impact-header { display:flex; align-items:center; justify-content:space-between; gap:12px; margin-bottom:14px; }
        .impact-kicker { color:#047857; font-size:12px; text-transform:uppercase; letter-spacing:0.1em; font-weight:800; }
        .impact-badge { background:#d1fae5; color:#059669; font-size:11px; border-radius:999px; padding:5px 10px; font-weight:800; }
        .impact-value { font-size:28px; line-height:1.1; font-weight:900; color:#047857; }
        .impact-label { margin-top:8px; color:#64748b; font-size:12px; line-height:1.5; }
        .bullet-list { margin:0; padding-left:18px; }
        .bullet-list li,.section p,.empty-state { font-size:14px; line-height:1.75; color:var(--muted); }
        .section-grid { grid-template-columns:1.15fr 0.85fr; }
        .empty-state { margin:0; }
        .footer-note { margin-top:18px; font-size:11px; text-align:center; color:#94a3b8; }
        .section-space { margin-top:18px; }
      </style>
    </head>
    <body>
      <div class="page">
        <div class="hero">
          <div class="hero-top">
            <div class="brand-block">
              ${viewModel.logoDataUrl ? `<img class="brand-logo" src="${viewModel.logoDataUrl}" alt="Logo organisation" />` : ''}
              <div class="brand-name">${escapeHtml(viewModel.brandName)}</div>
            </div>
            <div class="hero-kicker">PDF officiel sauvegarde</div>
          </div>
          <div class="hero-main">
            <div>
              <div class="hero-kicker">Pre-diagnostic energetique</div>
              <h1>${escapeHtml(viewModel.clientName)}</h1>
              <div class="hero-meta">${escapeHtml(viewModel.activity)} | ${escapeHtml(viewModel.surface)} | ${escapeHtml(viewModel.address)}<br />Rapport ${escapeHtml(viewModel.reportId || viewModel.reportName)} | Genere le ${escapeHtml(viewModel.reportGeneratedAtLabel || viewModel.generatedAtLabel)}</div>
            </div>
            <div class="score-card">
              <div class="score-card-label">Score energetique</div>
              <div class="score-card-value">${escapeHtml(viewModel.score)}</div>
              <div class="score-card-sub">${escapeHtml(viewModel.positioning || viewModel.confidence || 'Rapport sauvegarde')}</div>
            </div>
          </div>
        </div>
        <div class="content">
          <div class="metrics-grid">${metricsHtml}</div>
          ${scoreBandHtml}
          <div class="chart-grid">
            <div class="report-card">
              <div class="chart-title">Repartition des consommations par poste</div>
              <div class="chart-note">Estimation statistique basee sur l'activite.</div>
              ${breakdownHtml}
            </div>
            <div class="report-card">
              <div class="chart-title">Benchmark sectoriel</div>
              <div class="chart-note">${escapeHtml(viewModel.activity)} - Source : ADEME / Enquete ECNA 2022</div>
              ${benchmarkHtml}
            </div>
            <div class="report-card">
              <div class="chart-title">Actions recommandees</div>
              <div class="chart-note">Meme structure que le rapport du workspace, avec budget et ROI visibles.</div>
              ${actionsHtml}
              <div class="mini-stats">
                <div class="mini-stat"><div class="mini-stat-label">Invest. brut total</div><div class="mini-stat-value">${escapeHtml(formatCurrency(viewModel.actionSummary.capexBrut))}</div></div>
                <div class="mini-stat"><div class="mini-stat-label">Aides estimees</div><div class="mini-stat-value text-blue">${escapeHtml(formatCurrency(viewModel.actionSummary.aides))}</div></div>
                <div class="mini-stat"><div class="mini-stat-label">Invest. net</div><div class="mini-stat-value">${escapeHtml(formatCurrency(viewModel.actionSummary.capexNet))}</div></div>
              </div>
            </div>
            <div class="report-card">
              <div class="chart-title">Retour sur investissement par action</div>
              <div class="chart-note">Trie du meilleur ROI au plus long.</div>
              ${roiHtml}
            </div>
          </div>
          ${projectionHtml}
          ${environmentalImpactHtml}
          <div class="section section-space">
            <h2>Synthese</h2>
            <p>${escapeHtml(viewModel.summary || 'Le rapport officiel a ete genere a partir des donnees sauvegardees du dossier. Le detail complet reste disponible dans l espace pro.')}</p>
          </div>
          <div class="section-grid">
            <div class="section"><h2>Base de calcul</h2>${resultBasisHtml}</div>
            <div class="section"><h2>Points a confirmer</h2>${providerQuestionsHtml}</div>
          </div>
          <div class="footer-note">DiagTertiaire Pro | Document genere cote serveur et archive dans l'espace prive de l'organisation.</div>
        </div>
      </div>
    </body>
  </html>`;
};

const createRestHeaders = (serviceKey, extraHeaders = {}) => ({
  apikey: serviceKey,
  Authorization: `Bearer ${serviceKey}`,
  ...extraHeaders
});

const supabaseRestFetch = async (supabaseUrl, serviceKey, path, options = {}) => {
  const response = await fetch(`${supabaseUrl}/rest/v1/${path}`, {
    method: options.method || 'GET',
    headers: createRestHeaders(serviceKey, options.headers || {}),
    body: options.body
  });

  const rawText = await response.text();
  const data = rawText ? safeJsonParse(rawText) : null;

  if (!response.ok) {
    const message = data?.message || data?.error_description || rawText || `HTTP ${response.status}`;
    throw new Error(message);
  }

  return data;
};

const fetchAuthUser = async (supabaseUrl, publishableKey, accessToken) => {
  const response = await fetch(`${supabaseUrl}/auth/v1/user`, {
    method: 'GET',
    headers: {
      apikey: publishableKey,
      Authorization: `Bearer ${accessToken}`
    }
  });

  const rawText = await response.text();
  const data = rawText ? safeJsonParse(rawText) : null;

  if (!response.ok || !data?.id) {
    const message = data?.message || data?.error_description || rawText || 'Unauthorized';
    throw createHttpError(401, message);
  }

  return data;
};

const uploadPdfToStorage = async ({
  supabaseUrl,
  serviceKey,
  storagePath,
  pdfBuffer
}) => {
  const response = await fetch(
    `${supabaseUrl}/storage/v1/object/${ORGANIZATION_ASSETS_BUCKET}/${encodeStoragePath(storagePath)}`,
    {
      method: 'POST',
      headers: createRestHeaders(serviceKey, {
        'Content-Type': 'application/pdf',
        'x-upsert': 'true'
      }),
      body: pdfBuffer
    }
  );

  const rawText = await response.text();
  const data = rawText ? safeJsonParse(rawText) : null;

  if (!response.ok) {
    const message = data?.message || data?.error || rawText || 'Storage upload failed';
    throw new Error(message);
  }

  return data;
};

const downloadStorageObject = async ({
  supabaseUrl,
  serviceKey,
  bucketName,
  storagePath
}) => {
  const response = await fetch(
    `${supabaseUrl}/storage/v1/object/authenticated/${bucketName}/${encodeStoragePath(storagePath)}`,
    {
      method: 'GET',
      headers: createRestHeaders(serviceKey)
    }
  );

  if (!response.ok) {
    const details = await response.text();
    throw new Error(details || `Storage download failed (${response.status})`);
  }

  return {
    buffer: Buffer.from(await response.arrayBuffer()),
    contentType: response.headers.get('content-type') || 'application/octet-stream'
  };
};

const removeStorageObject = async ({
  supabaseUrl,
  serviceKey,
  bucketName,
  storagePath
}) => {
  const response = await fetch(
    `${supabaseUrl}/storage/v1/object/${bucketName}/${encodeStoragePath(storagePath)}`,
    {
      method: 'DELETE',
      headers: createRestHeaders(serviceKey)
    }
  );

  if (response.ok || response.status === 404) {
    return;
  }

  const details = await response.text();
  throw new Error(details || `Storage delete failed (${response.status})`);
};

const buildStoragePathForReportPdf = (organizationId, reportId) => {
  return `org/${organizationId}/reports/${reportId}/rapport-officiel.pdf`;
};

const buildOrganizationFileMetadata = (reportRecord) => ({
  report_id: reportRecord?.id || null,
  case_id: reportRecord?.case_id || null,
  source: 'official_server_pdf'
});

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  let reportRecord = null;
  let supabaseUrl = '';
  let serviceKey = '';

  try {
    const serverSupabaseConfig = getRequiredServerSupabaseConfig();
    supabaseUrl = serverSupabaseConfig.supabaseUrl;
    serviceKey = serverSupabaseConfig.serviceKey;
    const publishableKey = serverSupabaseConfig.supabasePublishableKey;

    const authorizationHeader = req.headers.authorization || req.headers.Authorization || '';
    const accessToken = authorizationHeader.startsWith('Bearer ')
      ? authorizationHeader.slice('Bearer '.length).trim()
      : '';

    if (!accessToken) {
      return res.status(401).json({ error: 'Missing bearer token' });
    }

    const body = safeJsonParse(req.body);
    const reportId = String(body?.report_id || '').trim();
    if (!reportId) {
      return res.status(400).json({ error: 'Missing report_id' });
    }

    const authUser = await fetchAuthUser(supabaseUrl, publishableKey, accessToken);

    const profileRows = await supabaseRestFetch(
      supabaseUrl,
      serviceKey,
      `profiles?id=eq.${encodeQueryValue(authUser.id)}&select=id,organization_id`
    );
    const profile = asArray(profileRows)[0] || null;

    if (!profile?.organization_id) {
      return res.status(403).json({ error: 'Profile organization not found' });
    }

    const organizationRows = await supabaseRestFetch(
      supabaseUrl,
      serviceKey,
      `organizations?id=eq.${encodeQueryValue(profile.organization_id)}&select=id,name`
    );
    const organizationRecord = asArray(organizationRows)[0] || null;

    const reportRows = await supabaseRestFetch(
      supabaseUrl,
      serviceKey,
      `pro_reports?id=eq.${encodeQueryValue(reportId)}&organization_id=eq.${encodeQueryValue(profile.organization_id)}&status=eq.active&select=id,organization_id,case_id,created_by,status,deleted_at,report_name,report_payload,report_summary,latest_pdf_file_id,latest_pdf_generated_at,pdf_status,pdf_error,created_at,updated_at`
    );
    reportRecord = asArray(reportRows)[0] || null;

    if (!reportRecord) {
      return res.status(404).json({ error: 'Report not found' });
    }

    if (reportRecord.organization_id !== profile.organization_id) {
      return res.status(403).json({ error: 'Forbidden for this organization' });
    }

    const updateReportStatus = async (patch) => {
      const updatedRows = await supabaseRestFetch(
        supabaseUrl,
        serviceKey,
        `pro_reports?id=eq.${encodeQueryValue(reportRecord.id)}&status=eq.active`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Prefer: 'return=representation'
          },
          body: JSON.stringify(patch)
        }
      );

      if (!asArray(updatedRows)[0]) {
        throw createHttpError(409, 'Report no longer active');
      }

      reportRecord = asArray(updatedRows)[0] || reportRecord;
      return reportRecord;
    };

    const ensureReportStillActive = async () => {
      const activeRows = await supabaseRestFetch(
        supabaseUrl,
        serviceKey,
        `pro_reports?id=eq.${encodeQueryValue(reportRecord.id)}&organization_id=eq.${encodeQueryValue(profile.organization_id)}&status=eq.active&select=id`
      );

      if (!asArray(activeRows)[0]) {
        throw createHttpError(409, 'Report no longer active');
      }
    };

    await updateReportStatus({
      pdf_status: 'generating',
      pdf_error: null
    });

    const [settingsRows, brandingRows, caseRows] = await Promise.all([
      supabaseRestFetch(
        supabaseUrl,
        serviceKey,
        `organization_settings?organization_id=eq.${encodeQueryValue(profile.organization_id)}&select=organization_id,accent,brand_name`
      ),
      supabaseRestFetch(
        supabaseUrl,
        serviceKey,
        `organization_branding?organization_id=eq.${encodeQueryValue(profile.organization_id)}&select=organization_id,logo_storage_path,logo_file_name`
      ),
      reportRecord.case_id
        ? supabaseRestFetch(
          supabaseUrl,
          serviceKey,
          `pro_cases?id=eq.${encodeQueryValue(reportRecord.case_id)}&organization_id=eq.${encodeQueryValue(profile.organization_id)}&lifecycle_status=eq.active&select=id,organization_id,title,status,lifecycle_status,deleted_at,site_name,activity_type,case_data,created_at,updated_at`
        )
        : Promise.resolve([])
    ]);

    const settingsRecord = asArray(settingsRows)[0] || null;
    const brandingRecord = asArray(brandingRows)[0] || null;
    const caseRecord = asArray(caseRows)[0] || null;

    if (reportRecord.case_id && !caseRecord) {
      throw createHttpError(409, 'Case no longer active');
    }

    let logoDataUrl = '';
    if (brandingRecord?.logo_storage_path) {
      try {
        const logoStoragePath = assertStoragePathPrefix(
          brandingRecord.logo_storage_path,
          `org/${profile.organization_id}/branding/logo/`,
          'Organization logo'
        );
        const logoFileRows = await supabaseRestFetch(
          supabaseUrl,
          serviceKey,
          `organization_files?organization_id=eq.${encodeQueryValue(profile.organization_id)}&bucket_name=eq.${encodeQueryValue(ORGANIZATION_ASSETS_BUCKET)}&storage_path=eq.${encodeQueryValue(logoStoragePath)}&status=eq.active&select=id,mime_type,file_name&limit=1`
        );
        const logoFileRecord = asArray(logoFileRows)[0] || null;
        const logoDownload = await downloadStorageObject({
          supabaseUrl,
          serviceKey,
          bucketName: ORGANIZATION_ASSETS_BUCKET,
          storagePath: logoStoragePath
        });
        const logoMimeType = logoFileRecord?.mime_type || logoDownload.contentType || 'image/png';
        logoDataUrl = `data:${logoMimeType};base64,${logoDownload.buffer.toString('base64')}`;
      } catch (logoError) {
        console.warn('Unable to embed organization logo in official PDF:', logoError);
      }
    }

    const pdfPayload = buildReportPdfPayload({
      reportRecord,
      caseRecord,
      organizationRecord,
      settingsRecord,
      brandingRecord,
      logoDataUrl
    });
    const html = buildRichReportPdfHtml(pdfPayload);
    const pdfBuffer = await renderPdfFromHtml(html, {
      maxHtmlLength: MAX_HTML_LENGTH,
      timeoutMs: 45_000
    });

    const storagePath = assertStoragePathPrefix(
      buildStoragePathForReportPdf(profile.organization_id, reportRecord.id),
      `org/${profile.organization_id}/reports/${reportRecord.id}/`,
      'Official PDF'
    );
    const downloadFilename = sanitizeDownloadFilename(`rapport-${pdfPayload.reportName}`);

    await ensureReportStillActive();

    await uploadPdfToStorage({
      supabaseUrl,
      serviceKey,
      storagePath,
      pdfBuffer
    });

    try {
      await ensureReportStillActive();
    } catch (error) {
      try {
        await removeStorageObject({
          supabaseUrl,
          serviceKey,
          bucketName: ORGANIZATION_ASSETS_BUCKET,
          storagePath
        });
      } catch (cleanupError) {
        console.warn('Unable to rollback uploaded official PDF after deletion race:', cleanupError);
      }
      throw error;
    }

    const organizationFileRows = await supabaseRestFetch(
      supabaseUrl,
      serviceKey,
      'organization_files?on_conflict=storage_path',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Prefer: 'resolution=merge-duplicates,return=representation'
        },
        body: JSON.stringify({
          organization_id: profile.organization_id,
          created_by: authUser.id,
          status: 'active',
          deleted_at: null,
          kind: REPORT_PDF_FILE_KIND,
          bucket_name: ORGANIZATION_ASSETS_BUCKET,
          storage_path: storagePath,
          file_name: downloadFilename,
          mime_type: 'application/pdf',
          size_bytes: pdfBuffer.length,
          metadata: buildOrganizationFileMetadata(reportRecord)
        })
      }
    );
    const organizationFileRecord = asArray(organizationFileRows)[0] || null;

    const generatedAtIso = new Date().toISOString();
    const updatedReport = await updateReportStatus({
      latest_pdf_file_id: organizationFileRecord?.id || null,
      latest_pdf_generated_at: generatedAtIso,
      pdf_status: 'ready',
      pdf_error: null
    });

    return res.status(200).json({
      ok: true,
      report_id: updatedReport.id,
      pdf_status: updatedReport.pdf_status,
      latest_pdf_generated_at: updatedReport.latest_pdf_generated_at,
      latest_pdf_file_id: updatedReport.latest_pdf_file_id,
      report: updatedReport,
      pdf_file: organizationFileRecord
    });
  } catch (error) {
    console.error('[pro-report-pdf] Official PDF generation failed:', {
      reportId: reportRecord?.id || null,
      statusCode: Number.isInteger(error?.statusCode) ? error.statusCode : null,
      message: error?.message || 'Unknown error'
    });

    if (reportRecord?.id && supabaseUrl && serviceKey) {
      try {
        await supabaseRestFetch(
          supabaseUrl,
          serviceKey,
          `pro_reports?id=eq.${encodeQueryValue(reportRecord.id)}&status=eq.active`,
          {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              pdf_status: 'error',
              pdf_error: (error && error.message ? String(error.message) : 'Unknown error').slice(0, 1000)
            })
          }
        );
      } catch (statusError) {
        console.warn('Unable to persist PDF error status:', statusError);
      }
    }

    const message = error && error.message ? error.message : 'Unknown error';
    const statusCode = Number.isInteger(error?.statusCode)
      ? error.statusCode
      : message === 'Missing bearer token'
        ? 401
        : message.includes('Forbidden')
        ? 403
        : message.includes('not found')
          ? 404
          : 500;

    return res.status(statusCode).json({
      error: 'Official PDF generation failed',
      details: message
    });
  }
};
