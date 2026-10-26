import type { CategorieErreur } from './retour';

// Réponse à « Je ne comprends pas » : on explique la règle et on invite à regarder, sans donner la forme corrigée.
export const EXPLICATIONS: Record<CategorieErreur, string> = {
  majuscule_debut_phrase: 'Une phrase commence par une grande lettre. Regarde la lettre marquée : est-ce une grande lettre ?',
  point_fin_phrase: 'Un texte se termine par un point ou un autre signe. Regarde la fin de ton texte : y a-t-il un signe ?',
  mot_repete: 'Tu as écrit deux fois le même mot, l’un après l’autre. Relis ces deux mots à voix haute : sont-ils tous les deux utiles ?',
};

export function explicationDe(categorie: CategorieErreur): string {
  return EXPLICATIONS[categorie];
}

export const EXPLICATION_QUESTION = 'Cette question t’aide à relire. Réponds dans ta tête, puis clique sur « J’ai regardé ».';
