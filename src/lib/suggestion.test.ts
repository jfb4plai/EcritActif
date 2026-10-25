import { describe, expect, test } from 'vitest';
import { suggererItems } from './suggestion';
import type { ItemCecp } from '../types';

const base = { annee: 'P2' as const, type: 'Savoir-faire' as const, rubrique: null, pagePdf: 1 };
const A: ItemCecp = { ...base, id: 'P2:F1', codes: ['F1'], contenu: 'Écrire un court texte descriptif', attendus: ['Décrire un animal.'] };
const B: ItemCecp = { ...base, id: 'P2:F2', codes: ['F2'], contenu: 'Écrire des mots outils', attendus: ['Copier des mots.'] };
const C: ItemCecp = { ...base, id: 'P2:F3', codes: ['F3'], contenu: 'Compter jusqu’à cent', attendus: ['Dire la suite.'] };

describe('suggererItems', () => {
  test('place en tête l’item qui recouvre le mieux la consigne', () => {
    const r = suggererItems('Écrire un court texte descriptif sur mon animal', [B, C, A]);
    expect(r[0].id).toBe('P2:F1');
    expect(r.map((i) => i.id)).not.toContain('P2:F3');
  });

  test('ignore les accents et la casse', () => {
    expect(suggererItems('ECRIRE un COURT TEXTE', [A])[0].id).toBe('P2:F1');
  });

  test('consigne vide : aucune suggestion', () => {
    expect(suggererItems('', [A, B])).toEqual([]);
    expect(suggererItems('   ', [A, B])).toEqual([]);
  });

  test('respecte le maximum demandé', () => {
    expect(suggererItems('Écrire texte mots', [A, B], 1)).toHaveLength(1);
  });
});
