import { describe, expect, test } from 'vitest';
import { comparerMots } from './diff';

describe('comparerMots : premier jet contre version finale', () => {
  test('textes identiques : rien de changé', () => {
    const r = comparerMots('Un chat dort.', 'Un chat dort.');
    expect(r.avant.every((m) => m.change === false)).toBe(true);
    expect(r.apres.every((m) => m.change === false)).toBe(true);
  });

  test('un mot corrigé : retiré du premier jet, ajouté à la version finale, le reste est stable', () => {
    const r = comparerMots('Les élèves prépare leur sortie.', 'Les élèves préparent leur sortie.');
    expect(r.avant.filter((m) => m.change).map((m) => m.mot)).toEqual(['prépare']);
    expect(r.apres.filter((m) => m.change).map((m) => m.mot)).toEqual(['préparent']);
  });

  test('un mot ajouté en fin de texte', () => {
    const r = comparerMots('Mon chat dort', 'Mon chat dort bien');
    expect(r.avant.filter((m) => m.change)).toEqual([]);
    expect(r.apres.filter((m) => m.change).map((m) => m.mot)).toEqual(['bien']);
  });

  test('les mots rendus gardent leur ordre et recomposent le texte', () => {
    const r = comparerMots('a b c', 'a x c');
    expect(r.apres.map((m) => m.mot).join(' ')).toBe('a x c');
    expect(r.avant.map((m) => m.mot).join(' ')).toBe('a b c');
  });

  test('textes vides : pas d’erreur', () => {
    expect(comparerMots('', '')).toEqual({ avant: [], apres: [] });
    expect(comparerMots('', 'a').apres).toEqual([{ mot: 'a', change: true }]);
  });
});
