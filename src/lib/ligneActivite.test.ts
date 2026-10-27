import { describe, expect, test } from 'vitest';
import { ligneActivite } from './enseignant';

describe('ligneActivite : ce qui est écrit en base pour une nouvelle activité', () => {
  test('l’année est enregistrée avec l’activité', () => {
    const l = ligneActivite('u1', 'c1', {
      annee: 'P3',
      consigne: 'Décrire mon animal.',
      contraintes: { minMots: 8 },
      itemIds: ['P3:F411+F412'],
      principeIds: [],
      categories: [],
      aidesRetirees: [],
      banqueMots: ['chat'],
      principesPerso: [],
      atelier: false,
    });
    expect(l).toMatchObject({ user_id: 'u1', classe_id: 'c1', annee: 'P3', consigne: 'Décrire mon animal.', banque_mots: ['chat'], item_ids: ['P3:F411+F412'] });
    // Sans atelier, la colonne n'est pas envoyée (la base d'avant la migration l'ignore).
    expect(l).not.toHaveProperty('atelier');
  });

  test('l’atelier de grammaire est enregistré quand l’enseignant l’active', () => {
    const l = ligneActivite('u1', 'c1', { annee: 'P4', consigne: 'Écrire.', contraintes: {}, itemIds: [], principeIds: [], categories: [], aidesRetirees: [], banqueMots: [], principesPerso: [], atelier: true });
    expect(l.atelier).toBe(true);
  });
});
