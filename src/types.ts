export type Annee = 'P1' | 'P2' | 'P3';

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
