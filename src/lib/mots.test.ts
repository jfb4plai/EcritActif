import { describe, expect, test } from 'vitest';
import { decouperMots, decouperPhrases, morceauxDePhrase } from './mots';

describe('découpage en mots', () => {
  test('mots simples avec leurs positions', () => {
    const t = 'Les élèves lisent.';
    const m = decouperMots(t);
    expect(m.map((x) => x.texte)).toEqual(['Les', 'élèves', 'lisent']);
    for (const x of m) expect(t.slice(x.debut, x.fin)).toBe(x.texte);
  });

  test('l’élision reste attachée au petit mot : l’élève donne l’ et élève', () => {
    expect(decouperMots('L’élève lit d’abord.').map((x) => x.texte)).toEqual(['L’', 'élève', 'lit', 'd’', 'abord']);
    expect(decouperMots("l'ami").map((x) => x.texte)).toEqual(["l'", 'ami']);
  });

  test('aujourd’hui et les mots avec trait d’union restent entiers', () => {
    expect(decouperMots('Aujourd’hui, dit-il, peut-être.').map((x) => x.texte)).toEqual(['Aujourd’hui', 'dit-il', 'peut-être']);
  });

  test('la ponctuation et les espaces ne sont pas des mots ; les chiffres en sont', () => {
    expect(decouperMots('« Viens ! » dit Léa, 3 fois…').map((x) => x.texte)).toEqual(['Viens', 'dit', 'Léa', '3', 'fois']);
  });

  test('texte vide : aucun mot', () => {
    expect(decouperMots('')).toEqual([]);
    expect(decouperMots('  ,; ')).toEqual([]);
  });
});

describe('découpage en phrases', () => {
  test('coupe après . ! ? … suivis d’une espace ou de la fin', () => {
    const t = 'Il pleut. Tu viens ? Oui ! Peut-être… Non.';
    expect(decouperPhrases(t).map((p) => p.texte)).toEqual(['Il pleut.', 'Tu viens ?', 'Oui !', 'Peut-être…', 'Non.']);
  });

  test('les positions pointent le texte d’origine', () => {
    const t = '  Un chat dort.\nLe chien aboie sans point';
    const p = decouperPhrases(t);
    expect(p.map((x) => x.texte)).toEqual(['Un chat dort.', 'Le chien aboie sans point']);
    for (const x of p) expect(t.slice(x.debut, x.fin)).toBe(x.texte);
  });

  test('un point dans un nombre ou une abréviation collée ne coupe pas', () => {
    expect(decouperPhrases('Il coûte 3.50 euros. Merci.').map((x) => x.texte)).toEqual(['Il coûte 3.50 euros.', 'Merci.']);
  });

  test('guillemets fermants après la ponctuation restent dans la phrase', () => {
    expect(decouperPhrases('Elle dit « Viens ! » Puis elle part.').map((x) => x.texte)).toEqual(['Elle dit « Viens ! »', 'Puis elle part.']);
  });

  test('texte vide : aucune phrase', () => {
    expect(decouperPhrases('')).toEqual([]);
    expect(decouperPhrases(' \n ')).toEqual([]);
  });

  test('les mots d’une phrase gardent leur position dans le texte entier', () => {
    const t = 'Il rit. Elle chante.';
    const [, p2] = decouperPhrases(t);
    const mots = decouperMots(t).filter((m) => m.debut >= p2.debut && m.fin <= p2.fin);
    expect(mots.map((m) => m.texte)).toEqual(['Elle', 'chante']);
  });
});

describe('morceaux d’une phrase', () => {
  test('les mots sont numérotés, la ponctuation et les espaces restent tels quels', () => {
    const m = morceauxDePhrase('Les chats dorment, ils rêvent.');
    expect(m.map((x) => x.texte).join('')).toBe('Les chats dorment, ils rêvent.');
    expect(m.filter((x) => x.motIndex !== null).map((x) => [x.motIndex, x.texte])).toEqual([[0, 'Les'], [1, 'chats'], [2, 'dorment'], [3, 'ils'], [4, 'rêvent']]);
    expect(m.filter((x) => x.motIndex === null).map((x) => x.texte)).toEqual([' ', ' ', ', ', ' ', '.']);
  });
});
