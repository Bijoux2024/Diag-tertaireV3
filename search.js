const fs = require('fs');
const lines = fs.readFileSync('index.saaspro.html', 'utf8').split('\n');
const out = [];
lines.forEach((l, i) => {
  if (/(Vue globale|Dossiers clients|Nouveau diagnostic|Configuration|ProSidebar|ProDashboard|ONBOARDING_TOUR_STEPS|ob-)/i.test(l)) {
    out.push(`${i+1}: ${l.trim()}`);
  }
});
fs.writeFileSync('search.txt', out.join('\n'));
