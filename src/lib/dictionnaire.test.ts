import { readFileSync } from 'node:fs';
import { describe, expect, test } from 'vitest';
import nspell from 'nspell';
import { creerVerificateur } from './dictionnaire';
import { detecterSignaux, limitesDesSignaux } from './retour';

const connu = creerVerificateur(nspell, readFileSync('public/dictionnaire/fr.aff', 'utf-8'), readFileSync('public/dictionnaire/fr.dic', 'utf-8'));

describe('liste de mots (fichiers servis par public/dictionnaire)', () => {
  test('mots courants, élisions et mots belges reconnus', () => {
    for (const m of ['école', 'chats', "l'école", 'l’école', "aujourd'hui", "qu'il", "j'aime", "c'est", 'peut-être', 'nonante', 'septante']) expect([m, connu(m)]).toEqual([m, true]);
  });
  test('mots mal écrits signalés', () => {
    for (const m of ['ecole', 'pomes', 'chatt']) expect([m, connu(m)]).toEqual([m, false]);
  });
  test('limite connue : un mot qui existe mais n’est pas le bon passe', () => {
    expect(connu('à')).toBe(true);
    expect(detecterSignaux('Il a mangé à pomme.', ['mot_inconnu'], connu)).toEqual([]);
  });
});

describe('signal mot_inconnu', () => {
  test('signale chaque mot absent une seule fois, avec sa position', () => {
    const s = detecterSignaux('Le chat mange des pomes. Les pomes sont bonnes.', ['mot_inconnu'], connu);
    expect(s).toHaveLength(1);
    expect(s[0]).toMatchObject({ categorie: 'mot_inconnu', debut: 18, fin: 23 });
  });
  test('sans liste chargée, rien n’est signalé', () => {
    expect(detecterSignaux('pomes', ['mot_inconnu'])).toEqual([]);
  });
  test('la catégorie non choisie ne signale rien', () => {
    expect(detecterSignaux('pomes', ['mot_repete'], connu)).toEqual([]);
  });
});

describe('limitesDesSignaux', () => {
  test('liste ce qui est regardé et ce qui ne l’est pas', () => {
    const l = limitesDesSignaux(['point_fin_phrase', 'mot_repete'], false, false);
    expect(l.regarde).toEqual(['le point à la fin du texte', 'un mot écrit deux fois de suite']);
    expect(l.nePasVoit).toContain('les fautes dans les mots');
  });
  test('avec la liste de mots, ne prétend pas voir les mots qui existent', () => {
    const l = limitesDesSignaux(['mot_inconnu'], false, true);
    expect(l.regarde).toEqual(['les mots absents de la liste de mots']);
    expect(l.nePasVoit.join(' ')).toMatch(/existent mais ne sont pas les bons/);
  });
  test('liste de mots non chargée : elle n’est pas annoncée comme regardée', () => {
    expect(limitesDesSignaux(['mot_inconnu'], false, false).regarde).toEqual([]);
  });
});

describe('mots acceptés par l’enseignant', () => {
  test('un mot absent de la liste : signalé sans l’ajout, accepté avec (casse ignorée)', async () => {
    const { avecMotsAcceptes } = await import('./dictionnaire');
    // « trémie » est déjà dans la liste Grammalecte (constaté) : on teste avec un mot absent.
    expect(connu('trémie')).toBe(true);
    const absent = 'cointe-xyz';
    expect(connu(absent)).toBe(false);
    const avec = avecMotsAcceptes(connu, [absent]);
    expect(avec('Cointe-XYZ')).toBe(true);
    expect(avec('pomes')).toBe(false);
    expect(detecterSignaux(`Il va à ${absent}.`, ['mot_inconnu'], avec)).toEqual([]);
  });
  test('saisie : mots seuls, doublons ignorés, expressions refusées', async () => {
    const { lireMotsAcceptes } = await import('./dictionnaire');
    expect(lireMotsAcceptes('trémie, Trémie; Outremeuse\nl’Ourthe')).toEqual({ mots: ['trémie', 'Outremeuse', 'l’Ourthe'], invalides: [] });
    expect(lireMotsAcceptes('trémie, tunnel de la Meuse, 123').invalides).toEqual(['tunnel de la Meuse', '123']);
  });
});
