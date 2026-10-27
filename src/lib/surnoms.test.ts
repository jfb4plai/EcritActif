import { beforeEach, describe, expect, test, vi } from 'vitest';
import { ecrireSurnom, etiquetteEleve, lireSurnoms, SURNOM_MAX } from './surnoms';

beforeEach(() => localStorage.clear());

describe('surnoms : mémorisés dans le navigateur de l’enseignant seulement', () => {
  test('un surnom écrit se relit pour la même classe et le même code', () => {
    expect(ecrireSurnom('c1', 'KMNPQR', 'Léa')).toBe(true);
    expect(lireSurnoms('c1')).toEqual({ KMNPQR: 'Léa' });
  });

  test('les classes sont isolées : un même code dans une autre classe n’a pas de surnom', () => {
    ecrireSurnom('c1', 'KMNPQR', 'Léa');
    expect(lireSurnoms('c2')).toEqual({});
  });

  test('le surnom est nettoyé et plafonné', () => {
    ecrireSurnom('c1', 'KMNPQR', '  ' + 'x'.repeat(SURNOM_MAX + 20) + '  ');
    expect(lireSurnoms('c1').KMNPQR).toHaveLength(SURNOM_MAX);
  });

  test('un surnom vide efface le surnom', () => {
    ecrireSurnom('c1', 'KMNPQR', 'Léa');
    ecrireSurnom('c1', 'KMNPQR', '   ');
    expect(lireSurnoms('c1')).toEqual({});
  });

  test('plusieurs élèves coexistent et se modifient séparément', () => {
    ecrireSurnom('c1', 'KMNPQR', 'Léa');
    ecrireSurnom('c1', 'STUVWX', 'Noé');
    ecrireSurnom('c1', 'KMNPQR', 'Léa B.');
    expect(lireSurnoms('c1')).toEqual({ KMNPQR: 'Léa B.', STUVWX: 'Noé' });
  });

  test('un code invalide est refusé, y compris « __proto__ », sans rien polluer', () => {
    expect(ecrireSurnom('c1', '__proto__', 'x')).toBe(false);
    expect(ecrireSurnom('c1', 'abc', 'x')).toBe(false);
    expect(({} as Record<string, unknown>).x).toBeUndefined();
    expect(lireSurnoms('c1')).toEqual({});
  });

  test('contenu abîmé dans le navigateur : aucun surnom, aucune erreur', () => {
    localStorage.setItem('ecrit:surnoms:c1', 'pas du json');
    expect(lireSurnoms('c1')).toEqual({});
    localStorage.setItem('ecrit:surnoms:c1', JSON.stringify({ KMNPQR: 12, abc: 'x', STUVWX: 'Noé' }));
    expect(lireSurnoms('c1')).toEqual({ STUVWX: 'Noé' });
  });

  test('stockage indisponible (navigation privée) : lecture vide, écriture signalée comme échouée', () => {
    const setItem = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('bloqué');
    });
    const getItem = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('bloqué');
    });
    expect(lireSurnoms('c1')).toEqual({});
    expect(ecrireSurnom('c1', 'KMNPQR', 'Léa')).toBe(false);
    setItem.mockRestore();
    getItem.mockRestore();
  });

  test('le surnom n’est jamais écrit sous une clé qui ressemble à un texte d’élève', () => {
    ecrireSurnom('c1', 'KMNPQR', 'Léa');
    expect(Object.keys(localStorage)).toEqual(['ecrit:surnoms:c1']);
  });
});

describe('etiquetteEleve', () => {
  test('code seul sans surnom, code et surnom avec', () => {
    expect(etiquetteEleve('KMNPQR', {})).toBe('KMNPQR');
    expect(etiquetteEleve('KMNPQR', { KMNPQR: 'Léa' })).toBe('KMNPQR (Léa)');
  });
});
