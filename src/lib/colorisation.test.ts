import { beforeAll, describe, expect, test } from 'vitest';
import { chargerColorisation, colorise, colorisationPrete, type ModeColorisation } from './colorisation';

const MODES: ModeColorisation[] = ['phonemes', 'syllabes', 'bpdq', 'voyelles-consonnes'];

describe('avant chargement', () => {
  test('colorise lève une erreur claire tant que le moteur n’est pas chargé', () => {
    expect(colorisationPrete()).toBe(false);
    expect(() => colorise('chat', 'syllabes')).toThrow(/chargée/);
  });
});

describe('colorisation', () => {
  beforeAll(async () => {
    await chargerColorisation();
  });

  test('le moteur est prêt après chargement', () => {
    expect(colorisationPrete()).toBe(true);
  });

  test.each(MODES)('mode %s : segments triés, sans chevauchement, dans les bornes, sans espace', (mode) => {
    const texte = 'Les petits chapeaux';
    const segs = colorise(texte, mode);
    expect(segs.length).toBeGreaterThan(0);
    let precedentFin = 0;
    for (const s of segs) {
      expect(s.debut).toBeGreaterThanOrEqual(precedentFin);
      expect(s.fin).toBeGreaterThan(s.debut);
      expect(s.fin).toBeLessThanOrEqual(texte.length);
      expect(texte.slice(s.debut, s.fin)).not.toMatch(/\s/);
      expect(s.couleur).toMatch(/^#[0-9a-f]{6}$/);
      precedentFin = s.fin;
    }
  });

  test('syllabes : les segments d’un mot recomposent le mot', () => {
    const texte = 'chapeau';
    const segs = colorise(texte, 'syllabes');
    expect(segs.map((s) => texte.slice(s.debut, s.fin)).join('')).toBe('chapeau');
  });

  test.each(MODES)('mode %s : texte vide', (mode) => {
    expect(colorise('', mode)).toEqual([]);
  });

  test('texte de plus de 5000 caractères avec apostrophes typographiques en moins de 1 s', () => {
    const texte = 'Les enfants de l’école dessinent un grand chapeau. '.repeat(100);
    expect(texte.length).toBeGreaterThan(5000);
    for (const mode of MODES) {
      const t0 = performance.now();
      const segs = colorise(texte, mode);
      expect(performance.now() - t0).toBeLessThan(1000);
      for (const s of segs) expect(s.fin).toBeLessThanOrEqual(texte.length);
    }
  });
});
