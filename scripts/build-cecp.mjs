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

// Fichier source et date d'extraction de chaque année : l'app cite d'où viennent les items.
const sources = {};
for (const annee of ['P1', 'P2', 'P3']) {
  const m = JSON.parse(readFileSync(`${SOURCE}${annee}/francais.json`, 'utf-8')).meta;
  sources[annee] = { pdf: m.source_pdf, extraitLe: m.extrait_le };
}
writeFileSync(fileURLToPath(new URL('../src/data/cecp-sources.json', import.meta.url)), JSON.stringify(sources, null, 1), 'utf-8');
console.log(`${items.length} items écrits dans ${SORTIE}`);
