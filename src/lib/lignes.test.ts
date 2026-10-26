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
      { eleveId: 'e1', activiteId: 'a1', version: 1, phase: 'corriger', updatedAt: '2026-10-25T10:00:00Z' },
      { eleveId: 'e1', activiteId: 'a1', version: 2, phase: 'relire', updatedAt: '2026-10-25T10:05:00Z' },
    ];
    const l = construireLignes(eleves, activites, textes, []);
    expect(l[0]).toMatchObject({ id: 'e1', code: 'KMNPQR', dernierePhase: 'relire', versions: 2 });
  });

  test('« où il en est » suit le texte le plus récemment modifié, pas la version la plus haute (revue finale)', () => {
    const textes = [
      { eleveId: 'e1', activiteId: 'a1', version: 3, phase: 'corriger', updatedAt: '2026-10-24T09:00:00Z' },
      { eleveId: 'e1', activiteId: 'a2', version: 1, phase: 'reflechir', updatedAt: '2026-10-25T09:00:00Z' },
    ];
    const l = construireLignes(eleves, activites, textes, []);
    expect(l[0]).toMatchObject({ dernierePhase: 'reflechir', versions: 1 });
  });

  test('un texte rendu apparaît comme rendu', () => {
    const textes = [{ eleveId: 'e1', activiteId: 'a1', version: 1, phase: 'rendu', updatedAt: '2026-10-25T09:00:00Z' }];
    expect(construireLignes(eleves, activites, textes, [])[0].dernierePhase).toBe('rendu');
  });

  test('demandes d’aide et auto-évaluation du dernier texte, pour lire la littératie à la rétroaction', () => {
    const auto = { etoiles: ['a', 'b'], souhait: 'c' };
    const textes = [
      { eleveId: 'e1', activiteId: 'a1', version: 1, phase: 'ecrire', updatedAt: '2026-10-25T09:00:00Z' },
      { eleveId: 'e1', activiteId: 'a1', version: 2, phase: 'rendu', updatedAt: '2026-10-25T10:00:00Z', autoEvaluation: auto },
    ];
    const traces = [
      { eleveId: 'e1', evenement: 'clarification:majuscule_debut_phrase' },
      { eleveId: 'e1', evenement: 'clarification:rel-intention' },
      { eleveId: 'e1', evenement: 'aide:colorisation' },
      { eleveId: 'e2', evenement: 'clarification:mot_repete' },
    ];
    const l = construireLignes(eleves, activites, textes, traces);
    expect(l[0]).toMatchObject({ clarifications: 2, autoEvaluation: auto, aides: ['colorisation'] });
    expect(l[1]).toMatchObject({ clarifications: 1, autoEvaluation: null });
  });

  test('élève sans texte : jamais commencé', () => {
    const l = construireLignes(eleves, activites, [], []);
    expect(l[1]).toMatchObject({ id: 'e2', dernierePhase: null, versions: 0, itemsTravailles: [], aides: [] });
  });

  test('items travaillés = items des activités où l’élève a écrit', () => {
    const textes = [{ eleveId: 'e1', activiteId: 'a2', version: 1, phase: 'ecrire', updatedAt: '2026-10-25T10:00:00Z' }];
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
