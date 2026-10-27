import type { ModeColorisation } from './colorisation';

// Réglages choisis par l'enseignant pour un élève : mode affiché au départ et modes que l'élève peut choisir.
export interface ReglagesColorisation {
  defaut: ModeColorisation;
  permis: ModeColorisation[];
}

export const MODES_COLORISATION: { id: ModeColorisation; libelle: string }[] = [
  { id: 'phonemes', libelle: 'Les sons' },
  { id: 'syllabes', libelle: 'Les syllabes' },
  { id: 'bpdq', libelle: 'b, p, d, q' },
  { id: 'voyelles-consonnes', libelle: 'Voyelles et consonnes' },
];

// Ce que montrent les couleurs (src/lib/colorisation.ts : un segment par son, par syllabe, par lettre b p d q, par voyelle ou consonne).
const PHRASES: Record<ModeColorisation, string> = {
  phonemes: 'Chaque son a sa couleur.',
  syllabes: 'Les syllabes d’un mot ont des couleurs qui alternent.',
  bpdq: 'Les lettres b, p, d et q ont chacune leur couleur.',
  'voyelles-consonnes': 'Les voyelles ont une couleur, les consonnes une autre.',
};

export const phraseMode = (m: ModeColorisation) => PHRASES[m];

const valide = (m: unknown): m is ModeColorisation => MODES_COLORISATION.some((x) => x.id === m);

// Ce qui sort de la base est inconnu : null = pas de réglage, l'élève garde le comportement habituel.
export function nettoyerReglages(x: unknown): ReglagesColorisation | null {
  if (typeof x !== 'object' || x === null || Array.isArray(x)) return null;
  const o = x as Record<string, unknown>;
  const permis = Array.isArray(o.permis) ? [...new Set(o.permis.filter(valide))] : [];
  if (permis.length === 0) return null;
  return { defaut: valide(o.defaut) && permis.includes(o.defaut) ? o.defaut : permis[0], permis };
}
