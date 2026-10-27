import { describe, expect, test } from 'vitest';
import { consignesPour, nettoyerPerso, persoDepuisTextes, PERSO_LIGNES_MAX, PERSO_LONGUEUR_MAX } from './atelierPerso';
import { VERBE_SUJET } from './atelier';

const etape = (id: string) => VERBE_SUJET.etapes.find((e) => e.id === id)!;

describe('nettoyerPerso : ce que l’élève reçoit de la formulation de l’enseignant', () => {
  test('garde les consignes valides des démarches et des étapes connues', () => {
    const p = nettoyerPerso({ 'verbe-sujet': { verbe: ['Mettre la phrase au passé.', 'Cliquer sur le verbe.'] } });
    expect(p).toEqual({ 'verbe-sujet': { verbe: ['Mettre la phrase au passé.', 'Cliquer sur le verbe.'] } });
  });

  test.each([undefined, null, 'texte', 12, [], [['a']]])('valeur inattendue %p : rien', (x) => {
    expect(nettoyerPerso(x)).toEqual({});
  });

  test('démarche ou étape inconnue : ignorée', () => {
    expect(nettoyerPerso({ inconnue: { verbe: ['x'] }, 'verbe-sujet': { zzz: ['x'], verbe: ['Cliquer.'] } })).toEqual({ 'verbe-sujet': { verbe: ['Cliquer.'] } });
  });

  test('lignes vides retirées, espaces coupés, longueur et nombre de lignes plafonnés', () => {
    const lignes = ['  Une.  ', '', '   ', 'x'.repeat(PERSO_LONGUEUR_MAX + 50), ...Array.from({ length: 10 }, (_, i) => `ligne ${i}`)];
    const p = nettoyerPerso({ 'verbe-sujet': { verbe: lignes } });
    const r = p['verbe-sujet'].verbe;
    expect(r[0]).toBe('Une.');
    expect(r[1].length).toBe(PERSO_LONGUEUR_MAX);
    expect(r).toHaveLength(PERSO_LIGNES_MAX);
  });

  test('éléments qui ne sont pas du texte : ignorés ; étape sans consigne : retirée', () => {
    expect(nettoyerPerso({ 'verbe-sujet': { verbe: [1, null, {}, 'Cliquer.'], sujet: [1, ''] } })).toEqual({ 'verbe-sujet': { verbe: ['Cliquer.'] } });
  });

  test('clés dangereuses : aucune pollution de prototype', () => {
    const p = nettoyerPerso(JSON.parse('{"__proto__":{"verbe":["x"]},"verbe-sujet":{"__proto__":["y"],"verbe":["Cliquer."]}}'));
    expect(({} as Record<string, unknown>).verbe).toBeUndefined();
    expect(p).toEqual({ 'verbe-sujet': { verbe: ['Cliquer.'] } });
  });
});

describe('consignesPour : les mots de l’enseignant remplacent ceux de l’application', () => {
  test('sans formulation : les consignes de l’application', () => {
    expect(consignesPour(VERBE_SUJET, etape('verbe'), undefined)).toEqual({ consignes: etape('verbe').consignes, perso: false });
    expect(consignesPour(VERBE_SUJET, etape('verbe'), {})).toEqual({ consignes: etape('verbe').consignes, perso: false });
  });

  test('avec formulation pour cette étape : ses consignes, signalées comme siennes', () => {
    const p = { 'verbe-sujet': { verbe: ['Mettre la phrase à l’imparfait.'] } };
    expect(consignesPour(VERBE_SUJET, etape('verbe'), p)).toEqual({ consignes: ['Mettre la phrase à l’imparfait.'], perso: true });
    expect(consignesPour(VERBE_SUJET, etape('sujet'), p).perso).toBe(false);
  });
});

describe('persoDepuisTextes : saisie du formulaire', () => {
  test('une consigne par ligne, étapes vides ignorées', () => {
    const p = persoDepuisTextes({ 'verbe-sujet/verbe': 'Mettre la phrase à l’imparfait.\n\nCliquer sur le verbe.', 'verbe-sujet/sujet': '   ' });
    expect(p).toEqual({ 'verbe-sujet': { verbe: ['Mettre la phrase à l’imparfait.', 'Cliquer sur le verbe.'] } });
  });

  test('aucune saisie : objet vide', () => {
    expect(persoDepuisTextes({})).toEqual({});
  });

  test('clé « __proto__ » dans la saisie : aucune pollution', () => {
    const p = persoDepuisTextes({ '__proto__/verbe': 'x', 'verbe-sujet/__proto__': 'y' });
    expect(p).toEqual({});
    expect(({} as Record<string, unknown>).verbe).toBeUndefined();
  });
});

