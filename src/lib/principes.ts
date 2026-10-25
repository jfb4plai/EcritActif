import donnees from '../data/principes.json';
import type { Phase, Principe } from '../types';

export type { Phase, Source, Principe } from '../types';

interface Options {
  brouillons?: boolean;
}

export function filtrerPrincipes(liste: Principe[], codes: string[], phase: Phase, opts: Options = {}): Principe[] {
  return liste.filter(
    (p) =>
      p.phase === phase &&
      p.codes.some((c) => codes.includes(c)) &&
      (p.statut === 'valide' || opts.brouillons === true),
  );
}

export function principesPour(codes: string[], phase: Phase, opts: Options = {}): Principe[] {
  return filtrerPrincipes(donnees as Principe[], codes, phase, opts);
}
