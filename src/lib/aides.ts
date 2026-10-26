import type { Source } from '../types';

export type AideId =
  | 'audio-consigne'
  | 'audio-relecture'
  | 'dictee-vocale'
  | 'pictogrammes'
  | 'colorisation'
  | 'organisateur'
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

// Formulations d'élève (colonne « gene »). Seules les aides qui ont un comportement dans l'écran élève figurent ici :
// clavier, prédiction de mots et séances courtes ont été retirées du catalogue (rien à construire de fondé, 2026-10-26).
export const AIDES: Aide[] = [
  { id: 'organisateur', libelle: 'Ranger mes idées dans un schéma', gene: 'Je ne trouve pas d’idées ou je ne sais pas par où commencer', source: { kind: 'riss', ids: ['hal-04120344'] } },
  { id: 'dictee-vocale', libelle: 'Dire mon texte à voix haute', gene: 'Écrire est lent ou fatigant', source: { kind: 'riss', ids: ['dumas-05497857'] } },
  { id: 'audio-relecture', libelle: 'Écouter mon texte', gene: 'Je ne vois pas mes erreurs quand je relis', source: { kind: 'riss', ids: ['dumas-05497857'] } },
  { id: 'colorisation', libelle: 'Colorer les sons ou les syllabes', gene: 'Les sons et les lettres se mélangent quand je lis', source: { kind: 'riss', ids: ['dumas-03282114'] } },
  { id: 'audio-consigne', libelle: 'Écouter la consigne', gene: 'Le français est ma deuxième langue', source: { kind: 'riss', ids: ['hal-03194300'] } },
  { id: 'pictogrammes', libelle: 'Voir des images pour les mots', gene: 'Le français est ma deuxième langue', source: { kind: 'non-etaye' } },
  { id: 'banque-mots', libelle: 'Chercher des mots dans une liste', gene: 'Je trouve difficilement mes mots', source: { kind: 'non-etaye' } },
];

export function resoudreAides(choisies: AideId[], retirees: { id: AideId; raison: string }[]): AideActive[] {
  return choisies.map((id) => {
    const r = retirees.find((x) => x.id === id);
    return r ? { id, active: false, raison: r.raison } : { id, active: true };
  });
}
