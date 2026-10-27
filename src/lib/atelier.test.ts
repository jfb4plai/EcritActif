import { describe, expect, test } from 'vitest';
import {
  ANNEES_ATELIER,
  demarcheParId,
  demarchesPour,
  fonctions,
  GABARIT_JUSTIFICATION,
  GROUPE_NOMINAL,
  justificationEnPhrase,
  motsDeLAtelier,
  PARTICIPE_PASSE,
  PRONOMS,
  toutesLesDemarches,
  VERBE_SUJET,
} from './atelier';
import { itemParCode } from './cecp';
import { termesNonEncore } from './vocabulaire';
import type { Annee } from '../types';

const normaliser = (s: string) => s.toLowerCase().replace(/[’']/g, "'").replace(/\s+/g, ' ');
const RANG: Record<Annee, number> = { P1: 1, P2: 2, P3: 3, P4: 4, P5: 5, P6: 6 };

// Toutes les (année, cadre, démarche) possibles.
const cas = ANNEES_ATELIER.flatMap((annee) => [false, true].flatMap((g) => demarchesPour(annee, { grammaire3d: g }).map((d) => ({ annee, g, d, nom: `${annee}${g ? ' + G3D' : ''} / ${d.id}` }))));

describe('démarches proposées selon l’année', () => {
  test('P4 : verbe-sujet, groupe nominal, fonctions', () => {
    expect(demarchesPour('P4').map((d) => d.id)).toEqual(['verbe-sujet', 'groupe-nominal', 'fonctions']);
  });

  test('P5 et P6 : le participe passé s’ajoute', () => {
    for (const a of ['P5', 'P6'] as const) expect(demarchesPour(a).map((d) => d.id)).toEqual(['verbe-sujet', 'groupe-nominal', 'participe-passe', 'fonctions']);
  });

  test('avant P4, aucune démarche', () => {
    expect(demarchesPour('P3')).toEqual([]);
  });

  test('retrouver une démarche par son identifiant', () => {
    expect(demarcheParId('groupe-nominal')).toEqual(GROUPE_NOMINAL);
    expect(demarcheParId('participe-passe')).toEqual(PARTICIPE_PASSE);
    expect(demarcheParId('zzz')).toBeUndefined();
  });

  test('étapes de chaque démarche, dans l’ordre voulu', () => {
    expect(VERBE_SUJET.etapes.map((e) => e.id)).toEqual(['verbe', 'sujet', 'terminaison', 'justifier', 'decider']);
    expect(GROUPE_NOMINAL.etapes.map((e) => e.id)).toEqual(['nom', 'accompagnants', 'genre-nombre', 'justifier', 'decider']);
    expect(PARTICIPE_PASSE.etapes.map((e) => e.id)).toEqual(['pp', 'cas', 'accord', 'fin-pp', 'justifier', 'decider']);
    expect(fonctions('P5', false).etapes.map((e) => e.id)).toEqual(['groupe', 'manipulations', 'fonction', 'justifier', 'decider']);
  });

  test('les pronoms à essayer sont il, elle, ils, elles', () => {
    expect(PRONOMS).toEqual(['il', 'elle', 'ils', 'elles']);
  });

  test('l’atelier est ouvert de P4 à P6 seulement', () => {
    expect(ANNEES_ATELIER).toEqual(['P4', 'P5', 'P6']);
  });
});

describe('le programme avant tout : verbes pronominaux hors de l’atelier', () => {
  test('aucune consigne, aucun choix ni aucun rappel ne parle de verbe pronominal ou de « se »', () => {
    const texte = normaliser(motsDeLAtelier());
    expect(texte).not.toMatch(/pronominal/);
    expect(texte).not.toMatch(/\bse\b.*(réfléchi|réciproque)/);
    expect(PARTICIPE_PASSE.etapes.flatMap((e) => e.elements).filter((el) => el.kind === 'choisir' && el.cle === 'cas').flatMap((el) => (el.kind === 'choisir' ? el.options : []))).toEqual(['seul, sans auxiliaire', 'avec « être »', 'avec « avoir »']);
  });
});

describe('cohérence des données', () => {
  test.each(cas.map((c) => [c.nom, c] as const))('%s : codes du programme existants, jamais d’une année plus tardive', (_nom, { annee, d }) => {
    const codes = [...d.codes, ...d.etapes.flatMap((e) => e.codes)];
    expect(codes.length).toBeGreaterThan(0);
    for (const code of codes) {
      const item = itemParCode(code);
      expect(item, code).toBeDefined();
      expect(RANG[item!.annee], `${code} (${item!.annee}) dans ${annee}`).toBeLessThanOrEqual(RANG[annee]);
    }
  });

  test.each(cas.map((c) => [c.nom, c] as const))('%s : consignes à l’infinitif, une action par puce, aucune puce vide', (_nom, { d }) => {
    for (const e of d.etapes) {
      const toutes = [...e.consignes, ...(e.selon ?? []).flatMap((s) => s.consignes)];
      expect(toutes.length, e.id).toBeGreaterThan(0);
      for (const c of toutes) {
        expect(c.trim().length).toBeGreaterThan(0);
        expect(c, c).toMatch(/^[A-ZÉÈ][\p{L}]*(er|ir|re)\b/u);
        expect(c).not.toMatch(/^(Tu|Je|Il|Elle|Vous|Nous)\b/);
      }
    }
  });

  test.each(cas.map((c) => [c.nom, c] as const))('%s : aucun mot ne dépasse le vocabulaire de l’année', (_nom, { annee, d }) => {
    const interdits = termesNonEncore(annee).map(normaliser);
    const texte = normaliser(motsDeLAtelier([d]));
    for (const t of interdits) expect(texte, t).not.toContain(t);
  });

  test.each(cas.map((c) => [c.nom, c] as const))('%s : jamais de jugement sur la grammaire de l’élève', (_nom, { d }) => {
    expect(normaliser(motsDeLAtelier([d]))).not.toMatch(/\b(bravo|faux|fausse|correct|correcte|juste|exact|raté|mauvais|erreur)\b/);
  });

  test.each(cas.map((c) => [c.nom, c] as const))('%s : un blanc du gabarit par champ ; chaque champ puise dans un élément', (_nom, { d }) => {
    expect(d.gabarit.match(/______/g)).toHaveLength(d.champs.length);
    expect(d.modele.match(/\{\d+\??\}/g)).toHaveLength(d.champs.length);
    const cles = d.etapes.flatMap((e) => e.elements.map((el) => `${el.kind === 'marquer' ? 'mots' : el.kind === 'choisir' ? 'choix' : 'texte'}:${el.cle}`));
    for (const c of d.champs) {
      if (c.depuis.kind === 'libre') continue;
      expect(cles, `${c.depuis.kind}:${c.depuis.cle}`).toContain(`${c.depuis.kind}:${c.depuis.cle}`);
      if (c.depuis.sinon) expect(cles).toContain(`${c.depuis.kind}:${c.depuis.sinon}`);
    }
  });

  test('chaque élément conditionnel dépend d’un choix qui existe, avec une valeur qui existe', () => {
    for (const { d } of cas) {
      const choix = new Map(d.etapes.flatMap((e) => e.elements).flatMap((el) => (el.kind === 'choisir' ? [[el.cle, el.options] as const] : [])));
      for (const el of d.etapes.flatMap((e) => e.elements)) if (el.si) expect(choix.get(el.si.cle), el.si.cle).toContain(el.si.valeur);
      for (const s of d.etapes.flatMap((e) => e.selon ?? [])) expect(choix.get(s.cle), s.cle).toContain(s.valeur);
    }
  });

  test('« moment » n’apparaît jamais sans « temps » ; « groupe de mots » jamais sans « groupe sujet »', () => {
    for (const { d } of cas) {
      for (const c of d.etapes.flatMap((e) => [...e.consignes, ...(e.selon ?? []).flatMap((s) => s.consignes)])) {
        if (/moment/i.test(c)) expect(c, c).toMatch(/temps/);
        if (/groupe de mots/.test(c)) expect(c, c).toMatch(/groupe sujet/);
      }
    }
    expect(VERBE_SUJET.etapes.flatMap((e) => e.consignes).join(' ')).toContain('groupe sujet');
    expect(VERBE_SUJET.gabarit).toContain('Le groupe sujet est');
  });

  test('le gabarit repris par la chasse est celui du verbe et du sujet', () => {
    expect(GABARIT_JUSTIFICATION).toBe(VERBE_SUJET.gabarit);
  });

  test('toutesLesDemarches couvre les variantes sans doublon', () => {
    const ids = toutesLesDemarches().map((d) => d.id);
    expect(new Set(ids)).toEqual(new Set(['verbe-sujet', 'groupe-nominal', 'participe-passe', 'fonctions']));
  });
});

describe('fonctions : programme d’abord, Grammaire 3D en option', () => {
  const options = (annee: Annee, g: boolean) => {
    const el = fonctions(annee, g).etapes.find((e) => e.id === 'fonction')!.elements[0];
    return el.kind === 'choisir' ? el.options : [];
  };

  test('P4 : cinq fonctions du programme, avec les termes « groupe »', () => {
    expect(options('P4', false)).toEqual(['groupe sujet', 'groupe prédicat', 'groupe complément circonstanciel', 'complément direct du verbe', 'complément indirect du verbe']);
  });

  test('P5 et P6 : les huit fonctions du programme', () => {
    expect(options('P5', false)).toEqual([...options('P4', false), 'complément du nom', 'attribut', 'épithète']);
    expect(options('P6', false)).toEqual(options('P5', false));
  });

  test('Grammaire 3D change les noms mais garde toutes les fonctions du programme (même nombre)', () => {
    expect(options('P4', true)).toHaveLength(options('P4', false).length);
    expect(options('P5', true)).toHaveLength(options('P5', false).length);
    expect(options('P5', true)).toContain('complément de phrase');
    expect(options('P5', true)).not.toContain('groupe complément circonstanciel');
    // Grammaire 3D n'a ni « complément du nom » ni « épithète » : ils gardent le nom du programme.
    expect(options('P5', true)).toContain('complément du nom');
    expect(options('P5', true)).toContain('épithète');
  });

  test('sans l’option, aucun nom propre à Grammaire 3D n’apparaît', () => {
    expect(normaliser(motsDeLAtelier([fonctions('P5', false)]))).not.toMatch(/complément de phrase|attribut du sujet|grammaire 3d/);
  });

  test('avec l’option, les pronoms utiles sont donnés fonction par fonction', () => {
    const aide = fonctions('P5', true).etapes.find((e) => e.id === 'manipulations')!.elements.find((el) => el.kind === 'ecrire');
    expect(aide && aide.kind === 'ecrire' && aide.aide).toContain('complément de phrase : y, là, alors');
    const base = fonctions('P5', false).etapes.find((e) => e.id === 'manipulations')!.elements.find((el) => el.kind === 'ecrire');
    expect(base && base.kind === 'ecrire' && base.aide).not.toContain('complément de phrase');
  });

  test('les manipulations sont les mêmes dans les deux cadres (déplacer, effacer, remplacer, encadrer)', () => {
    const m = (g: boolean) => fonctions('P5', g).etapes.find((e) => e.id === 'manipulations')!.consignes;
    expect(m(true)).toEqual(m(false));
    expect(m(false).join(' ')).toMatch(/Déplacer.*Effacer.*Remplacer.*Encadrer/);
  });
});

describe('justificationEnPhrase : phrase lue dans le tableau', () => {
  test('verbe et sujet', () => {
    expect(justificationEnPhrase('verbe-sujet:élèves|ils|prépare|e')).toBe('Le groupe sujet est élèves. Je peux le remplacer par ils. Le verbe prépare se termine par e.');
  });
  test('groupe nominal', () => {
    expect(justificationEnPhrase('groupe-nominal:élèves|masculin|plusieurs|Les|s')).toBe('Le nom est élèves. Il est masculin et plusieurs. Le mot Les s’accorde avec lui : il se termine par s.');
  });
  test('participe passé avec « avoir » : la place du complément direct est dite', () => {
    expect(justificationEnPhrase('participe-passe:mangées|avec « avoir »|pommes|avant le verbe|ées')).toBe(
      'Le participe passé mangées est employé avec « avoir ». Le mot à regarder est pommes. Le complément direct est placé avant le verbe. Il se termine par ées.',
    );
  });
  test('participe passé avec « être » : la phrase sur le complément direct est omise', () => {
    expect(justificationEnPhrase('participe-passe:arrivées|avec « être »|filles||ées')).toBe('Le participe passé arrivées est employé avec « être ». Le mot à regarder est filles. Il se termine par ées.');
  });
  test('fonctions', () => {
    expect(justificationEnPhrase('fonctions:le chat|groupe sujet|on peut le remplacer par il')).toBe('Le groupe le chat est groupe sujet parce que on peut le remplacer par il.');
  });
  test('démarche inconnue ou trace sans identifiant : la trace brute, sans erreur', () => {
    expect(justificationEnPhrase('zzz:a|b')).toBe('zzz:a|b');
    expect(justificationEnPhrase('abc')).toBe('abc');
  });
});
