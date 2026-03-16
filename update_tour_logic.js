const fs = require('fs');
let code = fs.readFileSync('index.saaspro.html', 'utf8');

// 1. Update React hooks import
code = code.replace(
    "const { useState, useEffect, useRef, useMemo } = React;",
    "const { useState, useEffect, useRef, useMemo, useCallback } = React;"
);

// 2. Update OnboardingPromptModal text
code = code.replace(
    /<h3 className="text-2xl font-black text-slate-900 tracking-tight">Découvrez votre espace Pro<\/h3>/g,
    `<h3 className="text-2xl font-black text-slate-900 tracking-tight">Bienvenue sur l'espace Pro</h3>`
);
code = code.replace(
    /Souhaitez-vous faire le tour du dashboard en 7 étapes \? \(30 secondes\)/g,
    `Souhaitez-vous faire le tour du dashboard pour découvrir ses fonctionnalités ? (30 secondes)`
);
code = code.replace(
    />\s*Oui, je découvre\s*<\/button>/g,
    `>Oui, lancer la visite</button>`
);
code = code.replace(
    />\s*Passer\s*<\/button>/g,
    `>Passer la visite</button>`
);

// 3. Update component usage
code = code.replace(
    /<OnboardingTourPopover[\s\S]*?\/>/g,
    `<OnboardingTour
                        isActive={tourActive}
                        currentStep={tourStep}
                        onNext={advanceOnboardingTour}
                        onClose={handleSkipOnboarding}
                        onComplete={handleSkipOnboarding}
                    />`
);

// 4. Update advanceOnboardingTour
const advanceTourRe = /const advanceOnboardingTour = async \(\) => \{[\s\S]*?setTourStep\(nextStep\);\s*\};/g;
const newAdvance = `const advanceOnboardingTour = async () => {
                setTourStep(prev => prev + 1);
            };`;
code = code.replace(advanceTourRe, newAdvance);

// 5. Delete the obsolete useEffect that references ONBOARDING_TOUR_STEPS
const useEffectRe = /\s*useEffect\(\(\) => \{\s*if \(\!tourActive\) \{\s*return undefined;\s*\}\s*const currentStep = ONBOARDING_TOUR_STEPS\[tourStep\];[\s\S]*?\}, \[tourActive, tourStep, page\]\);/g;
code = code.replace(useEffectRe, "");

fs.writeFileSync('index.saaspro.html', code);
console.log('Update successful.');
