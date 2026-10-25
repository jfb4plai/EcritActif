import { describe, expect, test } from 'vitest';
import { statutParItem } from './statut';
import type { ItemCecp } from '../types';

const base = { annee: 'P1' as const, type: 'Savoir-faire' as const, rubrique: null, pagePdf: 1, attendus: ['x'] };
const I1: ItemCecp = { ...base, id: 'P1:F1', codes: ['F1'], contenu: 'Item un' };
const I2: ItemCecp = { ...base, id: 'P1:F2', codes: ['F2'], contenu: 'Item deux' };
const I3: ItemCecp = { ...base, id: 'P1:F3', codes: ['F3'], contenu: 'Item trois' };

describe('statutParItem', () => {
  test('absent de toute activité : non-vu', () => {
    const r = statutParItem([I1], [], [], ['e1']);
    expect(r['P1:F1']).toEqual({ statut: 'non-vu', nbValides: 0 });
  });

  test('présent dans une activité sans validation : travaille', () => {
    const r = statutParItem([I1], [{ id: 'a1', itemIds: ['P1:F1'] }], [], ['e1', 'e2']);
    expect(r['P1:F1']).toEqual({ statut: 'travaille', nbValides: 0 });
  });

  test('validé par une partie de la classe : travaille avec le bon nombre', () => {
    const r = statutParItem([I1], [{ id: 'a1', itemIds: ['P1:F1'] }], [{ eleveId: 'e1', itemId: 'P1:F1' }], ['e1', 'e2']);
    expect(r['P1:F1']).toEqual({ statut: 'travaille', nbValides: 1 });
  });

  test('validé par toute la classe : valide', () => {
    const r = statutParItem(
      [I1],
      [{ id: 'a1', itemIds: ['P1:F1'] }],
      [
        { eleveId: 'e1', itemId: 'P1:F1' },
        { eleveId: 'e2', itemId: 'P1:F1' },
      ],
      ['e1', 'e2'],
    );
    expect(r['P1:F1']).toEqual({ statut: 'valide', nbValides: 2 });
  });

  test('une validation d’un élève hors liste est ignorée ; une classe vide ne plante pas', () => {
    expect(statutParItem([I2], [{ id: 'a', itemIds: ['P1:F2'] }], [{ eleveId: 'ailleurs', itemId: 'P1:F2' }], ['e1'])['P1:F2'].nbValides).toBe(0);
    expect(statutParItem([I3], [], [], [])['P1:F3']).toEqual({ statut: 'non-vu', nbValides: 0 });
  });
});
