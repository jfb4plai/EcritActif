import { describe, expect, test } from 'vitest';
import { itemParCode, itemsParAnnee } from './cecp';
import type { Annee } from '../types';

const ANNEES: Annee[] = ['P1', 'P2', 'P3', 'P4', 'P5', 'P6'];

describe('données CECP écrire P1-P6', () => {
  test('nombre d’items écrire par année', () => {
    expect(itemsParAnnee('P1')).toHaveLength(24);
    expect(itemsParAnnee('P2')).toHaveLength(25);
    expect(itemsParAnnee('P3')).toHaveLength(33);
    expect(itemsParAnnee('P4')).toHaveLength(32);
    expect(itemsParAnnee('P5')).toHaveLength(37);
    expect(itemsParAnnee('P6')).toHaveLength(30);
  });

  test('les identifiants sont uniques', () => {
    const ids = ANNEES.flatMap((a) => itemsParAnnee(a)).map((i) => i.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  test('chaque item a au moins un code et un attendu', () => {
    for (const a of ANNEES) {
      for (const i of itemsParAnnee(a)) {
        expect(i.codes.length).toBeGreaterThan(0);
        expect(i.attendus.length).toBeGreaterThan(0);
      }
    }
  });

  test('itemParCode retrouve l’item pour chacun des 398 codes', () => {
    const items = ANNEES.flatMap((a) => itemsParAnnee(a));
    const codes = items.flatMap((i) => i.codes);
    expect(new Set(codes).size).toBe(398);
    for (const c of codes) {
      expect(itemParCode(c)?.codes).toContain(c);
    }
  });

  test('un code inconnu renvoie undefined', () => {
    expect(itemParCode('F999999')).toBeUndefined();
  });
});
