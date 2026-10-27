import { describe, expect, test } from 'vitest';
import { ANNEES_ATELIER, DEMARCHES, demarcheParId, GABARIT_JUSTIFICATION, GROUPE_NOMINAL, justificationEnPhrase, motsDeLAtelier, PRONOMS, VERBE_SUJET } from './atelier';
import { itemParCode } from './cecp';
import { termesNonEncore } from './vocabulaire';

const normaliser = (s: string) => s.toLowerCase().replace(/[’']/g, "'").replace(/\s+/g, ' ');
const toutesLesEtapes = DEMARCHES.flatMap((d) => d.etapes.map((e) => [`${d.id} / ${e.id}`, e] as const));

describe('atelier de raisonnement grammatical : démarches', () => {
  test('deux démarches : le verbe et son sujet, le nom et ses accompagnants', () => {
    expect(DEMARCHES.map((d) => d.id)).toEqual(['verbe-sujet', 'groupe-nominal']);
    expect(demarcheParId('groupe-nominal')).toBe(GROUPE_NOMINAL);
    expect(demarcheParId('zzz')).toBeUndefined();
  });

  test('étapes de chaque démarche, dans l’ordre voulu', () => {
    expect(VERBE_SUJET.etapes.map((e) => e.id)).toEqual(['verbe', 'sujet', 'terminaison', 'justifier', 'decider']);
    expect(GROUPE_NOMINAL.etapes.map((e) => e.id)).toEqual(['nom', 'accompagnants', 'genre-nombre', 'justifier', 'decider']);
  });

  test('les pronoms à essayer sont il, elle, ils, elles', () => {
    expect(PRONOMS).toEqual(['il', 'elle', 'ils', 'elles']);
  });

  test('l’atelier est ouvert de P4 à P6 seulement', () => {
    expect(ANNEES_ATELIER).toEqual(['P4', 'P5', 'P6']);
  });

  test.each(toutesLesEtapes)('étape « %s » : codes du programme existants, en P4 au plus tard', (_id, etape) => {
    expect(etape.codes.length).toBeGreaterThan(0);
    for (const code of etape.codes) {
      const item = itemParCode(code);
      expect(item, code).toBeDefined();
      expect(['P1', 'P2', 'P3', 'P4']).toContain(item!.annee);
    }
  });

  test.each(DEMARCHES.map((d) => [d.id, d] as const))('démarche « %s » : codes existants, en P4 au plus tard', (_id, d) => {
    for (const code of d.codes) {
      const item = itemParCode(code);
      expect(item, code).toBeDefined();
      expect(['P1', 'P2', 'P3', 'P4']).toContain(item!.annee);
    }
  });

  test.each(toutesLesEtapes)('étape « %s » : consignes à l’infinitif, une action par puce, aucune puce vide', (_id, etape) => {
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
    expect(normaliser(motsDeLAtelier())).not.toMatch(/\b(bravo|faux|fausse|correct|correcte|juste|exact|raté|mauvais|erreur)\b/);
  });

  test.each(DEMARCHES.map((d) => [d.id, d] as const))('démarche « %s » : un blanc du gabarit par champ, jamais la réponse', (_id, d) => {
    expect(d.gabarit.match(/______/g)).toHaveLength(d.champs.length);
    expect(d.modele.match(/\{\d+\}/g)).toHaveLength(d.champs.length);
  });

  test.each(DEMARCHES.map((d) => [d.id, d] as const))('démarche « %s » : chaque champ puise dans un élément de ses étapes', (_id, d) => {
    const cles = d.etapes.flatMap((e) => e.elements.map((el) => `${el.kind === 'marquer' ? 'mots' : el.kind === 'choisir' ? 'choix' : 'texte'}:${el.cle}`));
    for (const c of d.champs) expect(cles, `${c.depuis.kind}:${c.depuis.cle}`).toContain(`${c.depuis.kind}:${c.depuis.cle}`);
  });

  test('les termes du programme sont employés : groupe sujet, temps ; « moment » n’apparaît jamais sans « temps »', () => {
    const consignes = VERBE_SUJET.etapes.flatMap((e) => e.consignes).join(' ');
    expect(consignes).toContain('groupe sujet');
    expect(VERBE_SUJET.gabarit).toContain('Le groupe sujet est');
    for (const e of VERBE_SUJET.etapes) for (const c of e.consignes) if (/moment/i.test(c)) expect(c, c).toMatch(/temps/);
  });

  test('« groupe de mots » n’est jamais seul : il est suivi du terme du programme', () => {
    for (const c of VERBE_SUJET.etapes.flatMap((e) => e.consignes)) if (/groupe de mots/.test(c)) expect(c, c).toMatch(/groupe sujet/);
  });

  test('le gabarit repris par la chasse est celui du verbe et du sujet', () => {
    expect(GABARIT_JUSTIFICATION).toBe(VERBE_SUJET.gabarit);
  });
});

describe('justificationEnPhrase : phrase lue dans le tableau', () => {
  test('verbe et sujet', () => {
    expect(justificationEnPhrase('verbe-sujet:élèves|ils|prépare|e')).toBe('Le groupe sujet est élèves. Je peux le remplacer par ils. Le verbe prépare se termine par e.');
  });
  test('groupe nominal', () => {
    expect(justificationEnPhrase('groupe-nominal:élèves|masculin|plusieurs|Les|s')).toBe('Le nom est élèves. Il est masculin et plusieurs. Le mot Les s’accorde avec lui : il se termine par s.');
  });
  test('démarche inconnue ou trace sans identifiant : la trace brute, sans erreur', () => {
    expect(justificationEnPhrase('zzz:a|b')).toBe('zzz:a|b');
    expect(justificationEnPhrase('abc')).toBe('abc');
  });
});
