import type { Phase } from '../types';

export interface EtatBoucle {
  phase: Phase;
  critereActif: string | null;
  versions: number;
}

export type Choix = 'continuer' | 'reecrire' | 'rendre';

const ORDRE: Phase[] = ['reflechir', 'ecrire', 'relire', 'corriger'];

export function initial(): EtatBoucle {
  return { phase: 'reflechir', critereActif: null, versions: 1 };
}

export function suivant(e: EtatBoucle): EtatBoucle {
  const i = ORDRE.indexOf(e.phase);
  return { ...e, phase: ORDRE[Math.min(i + 1, ORDRE.length - 1)] };
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
