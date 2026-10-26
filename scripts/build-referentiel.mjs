// Extrait, du référentiel de français du tronc commun (FWB), ce qui concerne l'écriture en P1 à P3.
// Le texte officiel est cité tel quel, jamais reformulé.
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const SOURCE = fileURLToPath(new URL('../../referentiels-fwb/francais/', import.meta.url));
const SORTIE = fileURLToPath(new URL('../src/data/referentiel-ecrire.json', import.meta.url));

const sortie = {};
for (const annee of ['P1', 'P2', 'P3']) {
  const d = JSON.parse(readFileSync(`${SOURCE}${annee}.json`, 'utf-8'));
  const pages = /p\.(\d+)-(\d+)/.exec(d.source);
  const ecrire = d.competences_production.ecrire;
  const verbaliser = ecrire.find((e) => e.contenu.startsWith('Verbaliser les composantes'));
  const composantes = verbaliser.attendus[0]
    .split(':')
    .slice(1)
    .join(':')
    .split(';')
    .map((x) => x.trim().replace(/\.$/, ''));
  sortie[annee] = {
    pages: `${pages[1]}-${pages[2]}`,
    palierScripteur: d.descripteurs_transversaux.palier_scripteur_attendu,
    formesCorrectes: d.descripteurs_transversaux.pourcentage_formes_correctes_ecriture ?? null,
    composantes,
    attenduEcrire: ecrire[0].attendus[0],
  };
}
writeFileSync(SORTIE, JSON.stringify(sortie, null, 1), 'utf-8');
console.log(`référentiel : ${Object.keys(sortie).join(', ')} écrits dans ${SORTIE}`);
