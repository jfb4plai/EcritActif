import { describe, expect, test } from 'vitest';
import { choisirCritere, decider, initial, phaseFinale, phasesDe, retourAutorise, suivant } from './boucle';

describe('boucle des quatre temps', () => {
  test('ordre des phases', () => {
    let e = initial();
    expect(e.phase).toBe('reflechir');
    e = suivant(e);
    expect(e.phase).toBe('ecrire');
    e = suivant(e);
    expect(e.phase).toBe('relire');
    e = suivant(e);
    expect(e.phase).toBe('corriger');
    expect(suivant(e).phase).toBe('corriger');
  });

  test('aucun retour de correction pendant réfléchir et écrire', () => {
    expect(retourAutorise('reflechir')).toBe(false);
    expect(retourAutorise('ecrire')).toBe(false);
    expect(retourAutorise('relire')).toBe(true);
    expect(retourAutorise('corriger')).toBe(true);
  });

  test('réécrire ouvre une nouvelle version et revient à écrire', () => {
    const e = { phase: 'corriger' as const, critereActif: null, versions: 1 };
    const r = decider(e, 'reecrire');
    expect(r.etat.phase).toBe('ecrire');
    expect(r.etat.versions).toBe(2);
    expect(r.rendu).toBe(false);
  });

  test('continuer revient à écrire dans la même version', () => {
    const e = { phase: 'corriger' as const, critereActif: null, versions: 1 };
    const r = decider(e, 'continuer');
    expect(r.etat.phase).toBe('ecrire');
    expect(r.etat.versions).toBe(1);
  });

  test('rendre termine l’activité', () => {
    const e = { phase: 'corriger' as const, critereActif: null, versions: 1 };
    expect(decider(e, 'rendre').rendu).toBe(true);
  });
});

describe('les temps dépendent de l’année (référentiel FWB : la correction n’est nommée qu’à partir de P2)', () => {
  test('P1 : trois temps ; P2 et P3 : quatre', () => {
    expect(phasesDe('P1')).toEqual(['reflechir', 'ecrire', 'relire']);
    expect(phasesDe('P2')).toEqual(['reflechir', 'ecrire', 'relire', 'corriger']);
    expect(phasesDe('P3')).toEqual(['reflechir', 'ecrire', 'relire', 'corriger']);
  });

  test('le dernier temps : relire en P1, corriger ensuite', () => {
    expect(phaseFinale('P1')).toBe('relire');
    expect(phaseFinale('P2')).toBe('corriger');
  });

  test('en P1, on ne passe jamais à « corriger »', () => {
    let e = initial();
    for (let i = 0; i < 6; i++) e = suivant(e, 'P1');
    expect(e.phase).toBe('relire');
  });

  test('en P2, on y passe après relire', () => {
    let e = initial();
    for (let i = 0; i < 6; i++) e = suivant(e, 'P2');
    expect(e.phase).toBe('corriger');
  });
});

describe('choisirCritere', () => {
  test('un seul critère à la fois, le premier non traité', () => {
    expect(choisirCritere(['a', 'b'], ['a'])).toBe('b');
    expect(choisirCritere(['a'], ['a'])).toBeNull();
    expect(choisirCritere([], [])).toBeNull();
  });
});
