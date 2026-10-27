import { describe, expect, test } from 'vitest';
import { MODES_COLORISATION, nettoyerReglages, phraseMode } from './reglagesColorisation';

describe('nettoyerReglages : ce qui sort de la base est inconnu', () => {
  test('réglage valide gardé tel quel', () => {
    expect(nettoyerReglages({ defaut: 'syllabes', permis: ['sons', 'syllabes'].map((m) => (m === 'sons' ? 'phonemes' : m)) })).toEqual({ defaut: 'syllabes', permis: ['phonemes', 'syllabes'] });
  });
  test('rien, null ou autre type : pas de réglage (comportement actuel)', () => {
    for (const x of [undefined, null, 'x', 3, [], {}]) expect(nettoyerReglages(x)).toBeNull();
  });
  test('modes inconnus retirés ; plus aucun mode permis : pas de réglage', () => {
    expect(nettoyerReglages({ defaut: 'syllabes', permis: ['syllabes', 'magie'] })).toEqual({ defaut: 'syllabes', permis: ['syllabes'] });
    expect(nettoyerReglages({ defaut: 'syllabes', permis: ['magie'] })).toBeNull();
  });
  test('le mode par défaut doit être permis : sinon le premier mode permis le remplace', () => {
    expect(nettoyerReglages({ defaut: 'bpdq', permis: ['syllabes', 'phonemes'] })).toEqual({ defaut: 'syllabes', permis: ['syllabes', 'phonemes'] });
  });
  test('doublons retirés', () => {
    expect(nettoyerReglages({ defaut: 'syllabes', permis: ['syllabes', 'syllabes'] })?.permis).toEqual(['syllabes']);
  });
});

describe('phraseMode : ce que montrent les couleurs', () => {
  test('une phrase par mode', () => {
    for (const m of MODES_COLORISATION) expect(phraseMode(m.id).length).toBeGreaterThan(10);
  });
});
