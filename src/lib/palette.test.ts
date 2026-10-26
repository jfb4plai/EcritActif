import { describe, expect, test } from 'vitest';
import { PALETTE, TEXTE_SOMBRE, contraste } from './palette';

describe('contraste (WCAG)', () => {
  test('noir sur blanc = 21 ; une couleur sur elle-même = 1', () => {
    expect(contraste('#000000', '#ffffff')).toBeCloseTo(21, 0);
    expect(contraste('#336699', '#336699')).toBeCloseTo(1, 5);
  });
});

describe('palette « Pop en tuiles colorées »', () => {
  const noms = Object.keys(PALETTE) as (keyof typeof PALETTE)[];

  test.each(noms)('%s : texte sur fond plein ≥ 4,5 et texte sombre sur fond pâle ≥ 7', (nom) => {
    const t = PALETTE[nom];
    expect(contraste(t.fond, t.texte), `${nom} plein`).toBeGreaterThanOrEqual(4.5);
    expect(contraste(t.pale, TEXTE_SOMBRE), `${nom} pâle`).toBeGreaterThanOrEqual(7);
  });

  test('les quatre temps ont quatre couleurs différentes (jamais la couleur seule : chaque tuile porte aussi un numéro et un nom)', () => {
    const fonds = [PALETTE.reflechir.fond, PALETTE.ecrire.fond, PALETTE.relire.fond, PALETTE.corriger.fond];
    expect(new Set(fonds).size).toBe(4);
  });

  test('chaque couleur est un code hexadécimal à six chiffres', () => {
    for (const nom of noms) {
      for (const c of Object.values(PALETTE[nom])) expect(c).toMatch(/^#[0-9a-f]{6}$/i);
    }
  });
});
