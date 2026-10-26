export type Annee = 'P1' | 'P2' | 'P3';

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
