import { describe, expect, test } from 'vitest';
import { choisirCritere, decider, initial, retourAutorise, suivant } from './boucle';

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

describe('choisirCritere', () => {
  test('un seul critère à la fois, le premier non traité', () => {
    expect(choisirCritere(['a', 'b'], ['a'])).toBe('b');
    expect(choisirCritere(['a'], ['a'])).toBeNull();
    expect(choisirCritere([], [])).toBeNull();
  });
});
