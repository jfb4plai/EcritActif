import { describe, expect, test } from 'vitest';
import { ETAPES_ATELIER, GABARIT_JUSTIFICATION, PRONOMS, motsDeLAtelier } from './atelier';
import { itemParCode } from './cecp';
import { termesNonEncore } from './vocabulaire';
import { ANNEES_ATELIER } from './atelier';

const normaliser = (s: string) => s.toLowerCase().replace(/[’']/g, "'").replace(/\s+/g, ' ');

describe('atelier de raisonnement grammatical : démarche', () => {
  test('cinq étapes dans l’ordre voulu', () => {
    expect(ETAPES_ATELIER.map((e) => e.id)).toEqual(['verbe', 'sujet', 'terminaison', 'justifier', 'decider']);
  });

  test('les pronoms à essayer sont il, elle, ils, elles', () => {
    expect(PRONOMS).toEqual(['il', 'elle', 'ils', 'elles']);
  });

  test('l’atelier est ouvert de P4 à P6 seulement', () => {
    expect(ANNEES_ATELIER).toEqual(['P4', 'P5', 'P6']);
  });

  test.each(ETAPES_ATELIER.map((e) => [e.id, e] as const))('étape « %s » : codes du programme existants, en P4 au plus tard', (_id, etape) => {
    expect(etape.codes.length).toBeGreaterThan(0);
    for (const code of etape.codes) {
      const item = itemParCode(code);
      expect(item, code).toBeDefined();
      expect(['P1', 'P2', 'P3', 'P4']).toContain(item!.annee);
    }
  });

  test.each(ETAPES_ATELIER.map((e) => [e.id, e] as const))('étape « %s » : consignes à l’infinitif, une action par puce, aucune puce vide', (_id, etape) => {
    expect(etape.consignes.length).toBeGreaterThan(0);
    for (const c of etape.consignes) {
      expect(c.trim().length).toBeGreaterThan(0);
      expect(c, c).toMatch(/^[A-ZÉÈ][\p{L}]*(er|ir|re)\b/u);
      expect(c).not.toMatch(/^(Tu|Je|Il|Elle|Vous|Nous)\b/);
    }
  });

  test('aucun mot de l’atelier ne dépasse le vocabulaire de P4', () => {
    const interdits = termesNonEncore('P4').map(normaliser);
    const texte = normaliser(motsDeLAtelier());
    for (const t of interdits) expect(texte, t).not.toContain(t);
  });

  test('l’atelier ne juge jamais la grammaire : ni « bravo », ni « faux », ni « correct », ni « juste »', () => {
    const texte = normaliser(motsDeLAtelier());
    expect(texte).not.toMatch(/\b(bravo|faux|fausse|correct|correcte|juste|exact|raté|mauvais|erreur)\b/);
  });

  test('le gabarit de justification a quatre blancs, jamais la réponse', () => {
    expect(GABARIT_JUSTIFICATION.match(/______/g)).toHaveLength(4);
    expect(GABARIT_JUSTIFICATION).toContain('Le sujet est');
    expect(GABARIT_JUSTIFICATION).toContain('Je peux le remplacer par');
  });
});
