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

  test('le catalogue ne propose que des aides qui ont un comportement dans l’écran élève', () => {
    expect(AIDES.map((a) => a.id).sort()).toEqual(['audio-consigne', 'audio-relecture', 'banque-mots', 'colorisation', 'dictee-vocale', 'organisateur', 'pictogrammes']);
  });

  test('chaque identifiant est unique', () => {
    const ids = AIDES.map((a) => a.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe('resoudreAides', () => {
  test('une aide retirée est inactive et garde sa raison', () => {
    const r = resoudreAides(['colorisation', 'dictee-vocale'], [{ id: 'dictee-vocale', raison: 'On vérifie le geste d’écrire.' }]);
    expect(r).toEqual([
      { id: 'colorisation', active: true },
      { id: 'dictee-vocale', active: false, raison: 'On vérifie le geste d’écrire.' },
    ]);
  });

  test('une aide retirée mais non choisie n’apparaît pas', () => {
    expect(resoudreAides([], [{ id: 'dictee-vocale', raison: 'x' }])).toEqual([]);
  });
});
