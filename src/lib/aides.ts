import type { Source } from '../types';

export type AideId =
  | 'audio-consigne'
  | 'audio-relecture'
  | 'dictee-vocale'
  | 'clavier'
  | 'prediction'
  | 'pictogrammes'
  | 'colorisation'
  | 'organisateur'
  | 'seances-courtes'
  | 'banque-mots';

export interface Aide {
  id: AideId;
  libelle: string;
  gene: string;
  source: Source;
}

export interface AideActive {
  id: AideId;
  active: boolean;
  raison?: string;
}

// Formulations d'élève (colonne « gene »), une ligne par aide du §5 de la spec.
export const AIDES: Aide[] = [
  { id: 'organisateur', libelle: 'Ranger mes idées dans un schéma', gene: 'Je ne trouve pas d’idées ou je ne sais pas par où commencer', source: { kind: 'riss', ids: ['hal-04120344'] } },
  { id: 'dictee-vocale', libelle: 'Dire mon texte à voix haute', gene: 'Écrire à la main est lent ou fatigant', source: { kind: 'riss', ids: ['dumas-05497857'] } },
  { id: 'clavier', libelle: 'Écrire au clavier', gene: 'Écrire à la main est lent ou fatigant', source: { kind: 'riss', ids: ['dumas-05497857'] } },
  { id: 'prediction', libelle: 'Choisir un mot proposé', gene: 'Je me trompe dans les mots', source: { kind: 'riss', ids: ['dumas-05497857'] } },
  { id: 'audio-relecture', libelle: 'Écouter mon texte', gene: 'Je ne vois pas mes erreurs quand je relis', source: { kind: 'riss', ids: ['dumas-05497857'] } },
  { id: 'colorisation', libelle: 'Colorer les sons ou les syllabes', gene: 'Les sons et les lettres se mélangent quand je lis', source: { kind: 'riss', ids: ['dumas-03282114'] } },
  { id: 'audio-consigne', libelle: 'Écouter la consigne', gene: 'Le français est ma deuxième langue', source: { kind: 'riss', ids: ['hal-03194300'] } },
  { id: 'pictogrammes', libelle: 'Voir des images pour les mots', gene: 'Le français est ma deuxième langue', source: { kind: 'non-etaye' } },
  { id: 'seances-courtes', libelle: 'Travailler par petites étapes', gene: 'Je perds le fil', source: { kind: 'non-etaye' } },
  { id: 'banque-mots', libelle: 'Chercher des mots dans une liste', gene: 'Je trouve difficilement mes mots', source: { kind: 'riss', ids: ['dumas-03246050'] } },
];

export function resoudreAides(choisies: AideId[], retirees: { id: AideId; raison: string }[]): AideActive[] {
  return choisies.map((id) => {
    const r = retirees.find((x) => x.id === id);
    return r ? { id, active: false, raison: r.raison } : { id, active: true };
  });
}
