import type { Annee } from '../types';
import type { CategorieErreur } from './retour';

// Réponse à « Je ne comprends pas » : on explique la règle et on invite à regarder, sans donner la forme corrigée.
// Le vocabulaire suit le programme CECP de l'année (voir vocabulaire.ts) : la fin de phrase s'élargit du point (P1) au
// point d'interrogation et au point d'exclamation (P2, F156), nommés comme signes de ponctuation en P3 (F255).
const MAJUSCULE = 'Une phrase commence par une majuscule, une grande lettre. Regarde la lettre marquée : est-ce une majuscule ?';
const MOT_REPETE = 'Tu as écrit deux fois le même mot, l’un après l’autre. Relis ces deux mots à voix haute : sont-ils tous les deux utiles ?';

export const EXPLICATIONS: Record<Annee, Record<CategorieErreur, string>> = {
  P1: {
    majuscule_debut_phrase: MAJUSCULE,
    point_fin_phrase: 'Une phrase se termine par un point. Regarde la fin de ton texte : y a-t-il un point ?',
    mot_repete: MOT_REPETE,
  },
  P2: {
    majuscule_debut_phrase: MAJUSCULE,
    point_fin_phrase: 'Une phrase se termine par un point, un point d’interrogation ou un point d’exclamation. Regarde la fin de ton texte : y a-t-il un de ces signes ?',
    mot_repete: MOT_REPETE,
  },
  P3: {
    majuscule_debut_phrase: MAJUSCULE,
    point_fin_phrase:
      'Une phrase se termine par un signe de ponctuation : le point, le point d’interrogation ou le point d’exclamation. Regarde la fin de ton texte : y a-t-il un signe de ponctuation ?',
    mot_repete: MOT_REPETE,
  },
};

export function explicationDe(categorie: CategorieErreur, annee: Annee): string {
  return EXPLICATIONS[annee][categorie];
}

export const EXPLICATION_QUESTION = 'Cette question t’aide à relire. Réponds dans ta tête, puis clique sur « J’ai regardé ».';
