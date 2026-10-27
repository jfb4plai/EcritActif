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
      chasse: null,
    });
    expect(l).toMatchObject({ user_id: 'u1', classe_id: 'c1', annee: 'P3', consigne: 'Décrire mon animal.', banque_mots: ['chat'], item_ids: ['P3:F411+F412'] });
    // Sans atelier, la colonne n'est pas envoyée (la base d'avant la migration l'ignore).
    expect(l).not.toHaveProperty('atelier');
  });

  test('l’atelier de grammaire est enregistré quand l’enseignant l’active', () => {
    const l = ligneActivite('u1', 'c1', { annee: 'P4', consigne: 'Écrire.', contraintes: {}, itemIds: [], principeIds: [], categories: [], aidesRetirees: [], banqueMots: [], principesPerso: [], atelier: true, chasse: null });
    expect(l.atelier).toBe(true);
  });

  test('la chasse n’est envoyée que si elle existe (la base d’avant la migration ignore la colonne)', () => {
    const base = { annee: 'P4' as const, consigne: 'Écrire.', contraintes: {}, itemIds: [], principeIds: [], categories: [], aidesRetirees: [], banqueMots: [], principesPerso: [], atelier: false };
    expect(ligneActivite('u1', 'c1', { ...base, chasse: null })).not.toHaveProperty('chasse');
    const chasse = { texte: 'Ils mange.', erreurs: [{ position: 1, mot: 'mange', attendu: 'mangent', type: 'accord-verbe' as const, indice: '' }] };
    expect(ligneActivite('u1', 'c1', { ...base, chasse }).chasse).toEqual(chasse);
  });
});

