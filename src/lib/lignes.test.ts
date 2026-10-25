import { describe, expect, test } from 'vitest';
import { construireLignes } from './lignes';

const eleves = [
  { id: 'e1', code: 'KMNPQR' },
  { id: 'e2', code: 'STUVWX' },
];
const activites = [
  { id: 'a1', itemIds: ['P1:F1', 'P1:F2'] },
  { id: 'a2', itemIds: ['P1:F3'] },
];

describe('construireLignes', () => {
  test('dernière phase = phase de la version la plus récente ; versions = numéro le plus haut', () => {
    const textes = [
      { eleveId: 'e1', activiteId: 'a1', version: 1, phase: 'corriger' },
      { eleveId: 'e1', activiteId: 'a1', version: 2, phase: 'relire' },
    ];
    const l = construireLignes(eleves, activites, textes, []);
    expect(l[0]).toMatchObject({ id: 'e1', code: 'KMNPQR', dernierePhase: 'relire', versions: 2 });
  });

  test('élève sans texte : jamais commencé', () => {
    const l = construireLignes(eleves, activites, [], []);
    expect(l[1]).toMatchObject({ id: 'e2', dernierePhase: null, versions: 0, itemsTravailles: [], aides: [] });
  });

  test('items travaillés = items des activités où l’élève a écrit', () => {
    const textes = [{ eleveId: 'e1', activiteId: 'a2', version: 1, phase: 'ecrire' }];
    expect(construireLignes(eleves, activites, textes, [])[0].itemsTravailles).toEqual(['P1:F3']);
  });

  test('aides utilisées = événements aide:<id> sans doublon', () => {
    const traces = [
      { eleveId: 'e1', evenement: 'aide:colorisation' },
      { eleveId: 'e1', evenement: 'aide:colorisation' },
      { eleveId: 'e1', evenement: 'phase:relire' },
      { eleveId: 'e2', evenement: 'aide:clavier' },
    ];
    const l = construireLignes(eleves, activites, [], traces);
    expect(l[0].aides).toEqual(['colorisation']);
    expect(l[1].aides).toEqual(['clavier']);
  });
});
