export type Annee = 'P1' | 'P2' | 'P3' | 'P4' | 'P5' | 'P6';

// Années dont les données (programme, référentiel) sont chargées.
export const ANNEES: Annee[] = ['P1', 'P2', 'P3', 'P4', 'P5', 'P6'];

// Années proposées aux enseignants. P4 à P6 restent fermées tant que la migration de la contrainte d'année
// n'est pas appliquée en base et que le contenu élève (vocabulaire, signaux) n'est pas validé par JF.
export const ANNEES_PROPOSEES: Annee[] = ['P1', 'P2', 'P3'];

// Deux étoiles et un souhait (Black et al. 2004, cité dans l'article de JF) : l'élève juge lui-même son travail avant de le rendre.
export interface AutoEvaluation {
  etoiles: string[];
  souhait: string;
  change?: string;
}

export type Phase = 'reflechir' | 'ecrire' | 'relire' | 'corriger';

export type Source =
  | { kind: 'riss'; ids: string[] }
  | { kind: 'hors-riss' }
  | { kind: 'non-etaye' };

export interface Principe {
  id: string;
  phase: Phase;
  question: string;
  codes: string[];
  source: Source;
  statut: 'brouillon' | 'valide';
}

export interface ItemCecp {
  id: string;
  annee: Annee;
  codes: string[];
  type: 'Savoir' | 'Savoir-faire' | 'Compétence';
  rubrique: string | null;
  contenu: string;
  attendus: string[];
  pagePdf: number;
}
