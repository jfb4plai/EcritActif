import { describe, expect, test } from 'vitest';
import { compterMots, detecterSignaux, verifierContraintes } from './retour';

describe('compterMots', () => {
  test('l’apostrophe droite ou typographique ne coupe pas un mot', () => {
    expect(compterMots('l’école est belle')).toBe(3);
    expect(compterMots("l'école est belle")).toBe(3);
  });
  test('texte vide', () => {
    expect(compterMots('')).toBe(0);
  });
});

describe('detecterSignaux', () => {
  test('majuscule en début de phrase', () => {
    const s = detecterSignaux('il pleut. elle rit.', ['majuscule_debut_phrase']);
    expect(s.map((x) => x.debut)).toEqual([0, 10]);
  });

  test('point final manquant', () => {
    const s = detecterSignaux('Il pleut', ['point_fin_phrase']);
    expect(s).toHaveLength(1);
    expect(s[0].categorie).toBe('point_fin_phrase');
  });

  test('point final présent : aucun signal', () => {
    expect(detecterSignaux('Il pleut.', ['point_fin_phrase'])).toHaveLength(0);
  });

  test('mot répété deux fois de suite', () => {
    const s = detecterSignaux('le le chat', ['mot_repete']);
    expect(s).toHaveLength(1);
    expect(s[0].debut).toBe(3);
  });

  test('seules les catégories demandées sont vérifiées', () => {
    expect(detecterSignaux('il pleut', ['mot_repete'])).toHaveLength(0);
  });

  test('texte vide ou d’un mot ne plante pas', () => {
    expect(detecterSignaux('', ['majuscule_debut_phrase', 'point_fin_phrase', 'mot_repete'])).toEqual([]);
    expect(() => detecterSignaux('chat', ['majuscule_debut_phrase', 'point_fin_phrase', 'mot_repete'])).not.toThrow();
  });

  test('texte de plus de 5000 caractères avec apostrophes typographiques en moins de 200 ms', () => {
    const texte = 'Le chat de l’école dort. '.repeat(250);
    expect(texte.length).toBeGreaterThan(5000);
    const t0 = performance.now();
    detecterSignaux(texte, ['majuscule_debut_phrase', 'point_fin_phrase', 'mot_repete']);
    expect(performance.now() - t0).toBeLessThan(200);
  });

  test('un signal n’a que categorie, debut, fin, indice (jamais de correction)', () => {
    const s = detecterSignaux('il pleut', ['majuscule_debut_phrase', 'point_fin_phrase']);
    for (const x of s) {
      expect(Object.keys(x).sort()).toEqual(['categorie', 'debut', 'fin', 'indice']);
    }
  });
});

describe('verifierContraintes', () => {
  test('longueur minimale', () => {
    expect(verifierContraintes('un deux trois', { minMots: 5 })[0].atteinte).toBe(false);
    expect(verifierContraintes('un deux trois quatre cinq', { minMots: 5 })[0].atteinte).toBe(true);
  });
  test('longueur maximale', () => {
    expect(verifierContraintes('un deux trois', { maxMots: 2 })[0].atteinte).toBe(false);
  });
  test('sans contrainte : liste vide', () => {
    expect(verifierContraintes('abc', {})).toEqual([]);
  });
});
