import { describe, expect, test } from 'vitest';
import { INTRODUCTIONS, termesNonEncore } from './vocabulaire';
import { itemParCode } from './cecp';
import { EXPLICATIONS, explicationDe } from './explications';
import { detecterSignaux, type CategorieErreur } from './retour';
import type { Annee } from '../types';

const ANNEES: Annee[] = ['P1', 'P2', 'P3'];
const CATEGORIES: CategorieErreur[] = ['majuscule_debut_phrase', 'point_fin_phrase', 'mot_repete'];

const normaliser = (s: string) => s.toLowerCase().replace(/[’']/g, "'").replace(/\s+/g, ' ');

describe('vocabulaire par année : chaque terme vient du programme CECP', () => {
  test.each(INTRODUCTIONS.map((i) => [i.terme, i.annee, i.code] as const))('« %s » est introduit en %s (code %s)', (terme, annee, code) => {
    const item = itemParCode(code);
    expect(item, `code ${code}`).toBeDefined();
    expect(item!.annee).toBe(annee);
    expect(item!.attendus.map(normaliser).join(' ')).toContain(normaliser(terme));
  });
});

describe('termesNonEncore : ce que le programme ne nomme pas encore', () => {
  test('P1 ne connaît pas encore le point d’exclamation ni les voyelles', () => {
    const t = termesNonEncore('P1');
    expect(t).toContain('point d’exclamation');
    expect(t).toContain('voyelle');
    expect(t).not.toContain('majuscule');
    expect(t).not.toContain('point');
  });
  test('P2 connaît le point d’exclamation, pas encore les voyelles', () => {
    const t = termesNonEncore('P2');
    expect(t).not.toContain('point d’exclamation');
    expect(t).toContain('voyelle');
  });
  test('P3 connaît tout ce qui est listé', () => {
    expect(termesNonEncore('P3')).toEqual([]);
  });
});

describe('tout ce que l’app dit à l’élève n’emploie que le vocabulaire de son année', () => {
  test.each(ANNEES)('explications et indices en %s', (annee) => {
    const interdits = termesNonEncore(annee).map(normaliser);
    const messages = [
      ...CATEGORIES.map((c) => explicationDe(c, annee)),
      ...detecterSignaux('il pleut. le le chat', CATEGORIES).map((s) => s.indice),
    ];
    for (const m of messages) {
      for (const t of interdits) expect(normaliser(m), `« ${t} » dans « ${m} »`).not.toContain(t);
    }
  });

  test('il y a bien une explication par année et par catégorie', () => {
    for (const a of ANNEES) expect(Object.keys(EXPLICATIONS[a]).sort()).toEqual(['majuscule_debut_phrase', 'mot_repete', 'point_fin_phrase']);
  });

  test('la fin de phrase s’élargit avec le programme : point en P1, puis point d’interrogation et d’exclamation', () => {
    expect(explicationDe('point_fin_phrase', 'P1')).not.toContain('exclamation');
    expect(explicationDe('point_fin_phrase', 'P2')).toContain('point d’exclamation');
    expect(explicationDe('point_fin_phrase', 'P3')).toContain('point d’exclamation');
  });
});
