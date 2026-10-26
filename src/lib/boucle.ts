import type { Annee, Phase } from '../types';

export interface EtatBoucle {
  phase: Phase;
  critereActif: string | null;
  versions: number;
}

export type Choix = 'continuer' | 'reecrire' | 'rendre';

// Le référentiel FWB ne nomme que trois composantes en P1 (planification, mise en texte, révision) ;
// la correction s'y ajoute à partir de P2. En P1, « corriger » est donc fusionné avec « relire ».
export function phasesDe(annee: Annee): Phase[] {
  return annee === 'P1' ? ['reflechir', 'ecrire', 'relire'] : ['reflechir', 'ecrire', 'relire', 'corriger'];
}

export function phaseFinale(annee: Annee): Phase {
  const p = phasesDe(annee);
  return p[p.length - 1];
}

export function initial(): EtatBoucle {
  return { phase: 'reflechir', critereActif: null, versions: 1 };
}

export function suivant(e: EtatBoucle, annee: Annee = 'P2'): EtatBoucle {
  const ordre = phasesDe(annee);
  const i = ordre.indexOf(e.phase);
  return { ...e, phase: ordre[Math.min(i + 1, ordre.length - 1)] };
}

export function decider(e: EtatBoucle, choix: Choix): { etat: EtatBoucle; rendu: boolean } {
  if (choix === 'rendre') return { etat: e, rendu: true };
  if (choix === 'reecrire') return { etat: { ...e, phase: 'ecrire', versions: e.versions + 1 }, rendu: false };
  return { etat: { ...e, phase: 'ecrire' }, rendu: false };
}

// Aucune correction pendant la génération des idées ni l'écriture (spec §3).
export function retourAutorise(phase: Phase): boolean {
  return phase === 'relire' || phase === 'corriger';
}

export function choisirCritere(criteres: string[], deja: string[]): string | null {
  return criteres.find((c) => !deja.includes(c)) ?? null;
}
