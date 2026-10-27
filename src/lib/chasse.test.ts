import { describe, expect, test } from 'vitest';
import { chasseVersEleve, ERREURS_MAX, localiserErreurs, MOTS_MAX, TYPES_ERREUR, verifierEssai, type LigneErreurSaisie } from './chasse';
import { itemParCode } from './cecp';
import { decouperMots } from './mots';

const TEXTE = 'Les élèves de 4e année prépare leur sortie. Ils emporte un pique-nique.';
const ligne = (surcharge: Partial<LigneErreurSaisie> = {}): LigneErreurSaisie => ({ mot: 'prépare', rang: 1, attendu: 'préparent', type: 'accord-verbe', indice: '', ...surcharge });

describe('types d’erreurs de la chasse', () => {
  test('chaque type cite des codes du programme existants (P4 au plus tard)', () => {
    for (const t of TYPES_ERREUR) {
      expect(t.codes.length).toBeGreaterThan(0);
      for (const c of t.codes) {
        const item = itemParCode(c);
        expect(item, c).toBeDefined();
        expect(['P1', 'P2', 'P3', 'P4']).toContain(item!.annee);
      }
    }
  });

  test('l’indice par défaut ne donne jamais la réponse et ne juge pas', () => {
    for (const t of TYPES_ERREUR) {
      expect(t.indice.length).toBeGreaterThan(10);
      expect(t.indice).not.toMatch(/\b(faux|raté|mauvais|bravo)\b/i);
    }
  });
});

describe('localiserErreurs : contrôle à l’enregistrement', () => {
  test('retrouve la position du mot dans le texte (numéro de mot)', () => {
    const r = localiserErreurs(TEXTE, [ligne(), ligne({ mot: 'emporte', attendu: 'emportent' })]);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    const mots = decouperMots(TEXTE).map((m) => m.texte);
    expect(r.chasse.erreurs.map((e) => mots[e.position])).toEqual(['prépare', 'emporte']);
    expect(r.chasse.texte).toBe(TEXTE);
  });

  test('le rang choisit l’occurrence quand le mot apparaît plusieurs fois', () => {
    const t = 'Il mange. Ils mange. Ils mange.';
    const r = localiserErreurs(t, [ligne({ mot: 'mange', rang: 3, attendu: 'mangent' })]);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    const mots = decouperMots(t);
    expect(mots[r.chasse.erreurs[0].position].debut).toBe(t.lastIndexOf('mange'));
  });

  test.each([
    ['mot absent du texte', [ligne({ mot: 'chantent' })], /chantent/],
    ['rang trop grand', [ligne({ rang: 2 })], /apparaît 1 fois/],
    ['forme attendue vide', [ligne({ attendu: '  ' })], /forme attendue/i],
    ['forme attendue identique au mot', [ligne({ attendu: 'prépare' })], /différente/i],
    ['deux lignes sur le même mot', [ligne(), ligne({ attendu: 'préparait' })], /même mot/i],
    ['aucune erreur', [], /au moins une erreur/i],
  ])('refuse : %s', (_nom, lignes, motif) => {
    const r = localiserErreurs(TEXTE, lignes as LigneErreurSaisie[]);
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.message).toMatch(motif);
  });

  test('refuse un texte vide, trop long, ou trop d’erreurs', () => {
    expect(localiserErreurs('  ', [ligne()]).ok).toBe(false);
    const long = Array.from({ length: MOTS_MAX + 1 }, (_, i) => 'mot' + i).join(' ');
    const rl = localiserErreurs(long, [ligne({ mot: 'mot1', attendu: 'mot2' })]);
    expect(rl.ok).toBe(false);
    if (!rl.ok) expect(rl.message).toMatch(new RegExp(String(MOTS_MAX)));
    const lignes = Array.from({ length: ERREURS_MAX + 1 }, (_, i) => ligne({ mot: 'mot' + i, attendu: 'autre' + i }));
    const texte = lignes.map((l) => l.mot).join(' ');
    expect(localiserErreurs(texte, lignes).ok).toBe(false);
  });
});

function chasse() {
  const r = localiserErreurs(TEXTE, [ligne({ indice: 'Cherche le sujet de ce verbe.' }), ligne({ mot: 'emporte', attendu: 'emportent', type: 'accord-verbe' })]);
  if (!r.ok) throw new Error(r.message);
  return r.chasse;
}
const mot = (t: string) => decouperMots(TEXTE).findIndex((m) => m.texte === t);

describe('verifierEssai : réponse qualitative, jamais une note', () => {
  test('bon mot, bonne forme : trouvé (casse indifférente, espaces ignorés, accents exacts)', () => {
    const c = chasse();
    expect(verifierEssai(c, { motIndex: mot('prépare'), forme: 'préparent' })).toEqual({ resultat: 'trouve', erreurId: 0 });
    expect(verifierEssai(c, { motIndex: mot('prépare'), forme: '  Préparent ' })).toEqual({ resultat: 'trouve', erreurId: 0 });
    expect(verifierEssai(c, { motIndex: mot('prépare'), forme: 'preparent' }).resultat).toBe('indice');
  });

  test('bon mot, mauvaise forme : l’indice de l’enseignant, sans la forme attendue', () => {
    const c = chasse();
    const v = verifierEssai(c, { motIndex: mot('prépare'), forme: 'prépares' });
    expect(v).toEqual({ resultat: 'indice', erreurId: 0, indice: 'Cherche le sujet de ce verbe.' });
    expect(JSON.stringify(v)).not.toContain('préparent');
  });

  test('sans indice de l’enseignant : l’indice du type', () => {
    const c = chasse();
    const v = verifierEssai(c, { motIndex: mot('emporte'), forme: 'emportes' });
    expect(v.resultat).toBe('indice');
    expect(v.resultat === 'indice' && v.indice).toBe(TYPES_ERREUR.find((t) => t.id === 'accord-verbe')!.indice);
  });

  test('mot qui n’est pas à corriger : pas-erreur, sans dire où est l’erreur', () => {
    const c = chasse();
    expect(verifierEssai(c, { motIndex: mot('sortie'), forme: 'sorties' })).toEqual({ resultat: 'pas-erreur' });
  });

  test('position hors du texte ou forme vide : pas-erreur / indice sans rien révéler', () => {
    const c = chasse();
    expect(verifierEssai(c, { motIndex: 999, forme: 'x' })).toEqual({ resultat: 'pas-erreur' });
    expect(verifierEssai(c, { motIndex: -1, forme: 'x' })).toEqual({ resultat: 'pas-erreur' });
    expect(verifierEssai(c, { motIndex: mot('prépare'), forme: '' }).resultat).toBe('indice');
  });
});

describe('chasseVersEleve : ce que l’élève reçoit', () => {
  test('le texte et le nombre d’erreurs, jamais le corrigé', () => {
    const e = chasseVersEleve(chasse());
    expect(e).toEqual({ texte: TEXTE, nbErreurs: 2 });
    expect(JSON.stringify(e)).not.toContain('préparent');
    expect(JSON.stringify(e)).not.toContain('position');
  });
});
