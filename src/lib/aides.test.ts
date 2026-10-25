import { describe, expect, test } from 'vitest';
import { AIDES, resoudreAides } from './aides';

describe('catalogue d’aides', () => {
  test('chaque aide a une source déclarée', () => {
    for (const a of AIDES) {
      expect(['riss', 'hors-riss', 'non-etaye']).toContain(a.source.kind);
    }
  });

  test('la colorisation s’appuie sur dumas-03282114', () => {
    const c = AIDES.find((a) => a.id === 'colorisation');
    expect(c?.source).toEqual({ kind: 'riss', ids: ['dumas-03282114'] });
  });

  test('aucun libellé ne contient dyslex, visuel ou auditif', () => {
    for (const a of AIDES) {
      expect(a.libelle).not.toMatch(/dyslex|visuel|auditif/i);
    }
  });

  test('chaque identifiant est unique', () => {
    const ids = AIDES.map((a) => a.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe('resoudreAides', () => {
  test('une aide retirée est inactive et garde sa raison', () => {
    const r = resoudreAides(['colorisation', 'clavier'], [{ id: 'clavier', raison: 'On vérifie le geste d’écrire.' }]);
    expect(r).toEqual([
      { id: 'colorisation', active: true },
      { id: 'clavier', active: false, raison: 'On vérifie le geste d’écrire.' },
    ]);
  });

  test('une aide retirée mais non choisie n’apparaît pas', () => {
    expect(resoudreAides([], [{ id: 'clavier', raison: 'x' }])).toEqual([]);
  });
});
