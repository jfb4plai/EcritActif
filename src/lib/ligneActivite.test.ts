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
    });
    expect(l).toMatchObject({ user_id: 'u1', classe_id: 'c1', annee: 'P3', consigne: 'Décrire mon animal.', banque_mots: ['chat'], item_ids: ['P3:F411+F412'] });
  });
});
