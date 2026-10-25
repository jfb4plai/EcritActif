// Extrait les items « écrire » de P1 à P3 depuis referentiels-fwb. Le texte officiel n'est jamais reformulé.
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const SOURCE = fileURLToPath(new URL('../../referentiels-fwb/', import.meta.url));
const SORTIE = fileURLToPath(new URL('../src/data/cecp-ecrire.json', import.meta.url));

const items = [];
for (const annee of ['P1', 'P2', 'P3']) {
  const d = JSON.parse(readFileSync(`${SOURCE}${annee}/francais.json`, 'utf-8'));
  for (const i of d.referentiel.items) {
    if (!(i.tags || []).includes('écrire')) continue;
    items.push({
      id: `${annee}:${i.codes.join('+')}`,
      annee,
      codes: i.codes,
      type: i.type,
      rubrique: i.rubrique ?? null,
      contenu: i.contenu,
      attendus: i.attendus,
      pagePdf: i.page_pdf,
    });
  }
}
writeFileSync(SORTIE, JSON.stringify(items, null, 1), 'utf-8');
console.log(`${items.length} items écrits dans ${SORTIE}`);
