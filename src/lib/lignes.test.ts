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

  test('atelier de grammaire : phrases travaillées, « pas sûr » et justifications de chaque élève', () => {
    const traces = [
      { eleveId: 'e1', evenement: 'atelier:phrase:1' },
      { eleveId: 'e1', evenement: 'atelier:etape:verbe' },
      { eleveId: 'e1', evenement: 'atelier:justification:verbe-sujet:élèves|ils|prépare|e' },
      { eleveId: 'e1', evenement: 'atelier:pas-sur' },
      { eleveId: 'e1', evenement: 'atelier:phrase:2' },
      { eleveId: 'e2', evenement: 'atelier:phrase:1' },
    ];
    const l = construireLignes(eleves, activites, [], traces);
    expect(l[0].atelier).toEqual({ phrases: 2, pasSur: 1, justifications: ['verbe-sujet:élèves|ils|prépare|e'] });
    expect(l[1].atelier).toEqual({ phrases: 1, pasSur: 0, justifications: [] });
  });

  test('sans trace d’atelier, tout est à zéro', () => {
    expect(construireLignes(eleves, activites, [], [])[0].atelier).toEqual({ phrases: 0, pasSur: 0, justifications: [] });
  });

  test('chasse aux erreurs : erreurs trouvées (sans doublon), indices demandés, justifications', () => {
    const traces = [
      { eleveId: 'e1', evenement: 'chasse:essai:e0:indice' },
      { eleveId: 'e1', evenement: 'chasse:essai:e0:indice' },
      { eleveId: 'e1', evenement: 'chasse:essai:e0:trouve' },
      { eleveId: 'e1', evenement: 'chasse:essai:e0:trouve' },
      { eleveId: 'e1', evenement: 'chasse:essai:pas-erreur' },
      { eleveId: 'e1', evenement: 'chasse:justification:e0:Le sujet est élèves.' },
    ];
    expect(construireLignes(eleves, activites, [], traces)[0].chasse).toEqual({ trouvees: 1, indices: 2, essais: 5, justifications: ['Le sujet est élèves.'] });
    expect(construireLignes(eleves, activites, [], [])[1].chasse).toEqual({ trouvees: 0, indices: 0, essais: 0, justifications: [] });
  });
});
