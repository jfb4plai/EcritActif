import type { Annee } from '../types';

// Vocabulaire que le programme CECP fait nommer à l'élève, année par année (attendus « écrire » lus dans
// referentiels-fwb, vérifiés par test contre src/data/cecp-ecrire.json). L'app n'emploie, dans ses messages,
// que les mots que l'élève a déjà rencontrés à l'école.
export interface Introduction {
  terme: string;
  annee: Annee;
  code: string;
}

export const INTRODUCTIONS: Introduction[] = [
  { terme: 'minuscule', annee: 'P1', code: 'F10' },
  { terme: 'majuscule', annee: 'P1', code: 'F10' },
  { terme: 'signes de ponctuation', annee: 'P1', code: 'F10' },
  { terme: 'point d’interrogation', annee: 'P1', code: 'F10' },
  { terme: 'le point', annee: 'P1', code: 'F40' },
  { terme: 'point d’exclamation', annee: 'P2', code: 'F156' },
  { terme: 'guillemets', annee: 'P2', code: 'F155' },
  { terme: 'tiret', annee: 'P2', code: 'F155' },
  { terme: 'points de suspension', annee: 'P2', code: 'F155' },
  { terme: 'consonne', annee: 'P3', code: 'F254' },
  { terme: 'voyelle', annee: 'P3', code: 'F254' },
  { terme: 'accent aigu', annee: 'P3', code: 'F254' },
  { terme: 'cédille', annee: 'P3', code: 'F254' },
  { terme: 'virgule', annee: 'P3', code: 'F295' },
  { terme: 'les deux points', annee: 'P3', code: 'F295' },
  { terme: 'apostrophe', annee: 'P3', code: 'F295' },
  { terme: 'parenthèses', annee: 'P3', code: 'F295' },
];

const RANG: Record<Annee, number> = { P1: 1, P2: 2, P3: 3, P4: 4, P5: 5, P6: 6 };

// Mots que le programme n'a pas encore fait nommer à cette année : l'app ne les emploie pas dans ses messages.
export function termesNonEncore(annee: Annee): string[] {
  const nettoyes = INTRODUCTIONS.filter((i) => RANG[i.annee] > RANG[annee]).map((i) => i.terme.replace(/^(?:le|les) /, ''));
  return [...new Set(nettoyes)];
}
