import { describe, expect, test } from 'vitest';
import principesJson from '../data/principes.json';
import { filtrerPrincipes, principeParId, principesPour } from './principes';
import { itemParCode } from './cecp';
import type { Principe } from '../types';

const TOUS = principesJson as Principe[];

describe('principes (questions fixes)', () => {
  test('chaque code cité existe dans les données CECP', () => {
    for (const p of TOUS) {
      for (const c of p.codes) {
        expect(itemParCode(c), `${p.id} cite ${c}`).toBeDefined();
      }
    }
  });

  test('chaque principe a une source déclarée', () => {
    for (const p of TOUS) {
      expect(['riss', 'hors-riss', 'non-etaye']).toContain(p.source.kind);
      if (p.source.kind === 'riss') expect(p.source.ids.length).toBeGreaterThan(0);
    }
  });

  test('chaque question tient en 14 mots et une seule phrase', () => {
    for (const p of TOUS) {
      const mots = p.question.trim().split(/\s+/);
      expect(mots.length, p.id).toBeLessThanOrEqual(14);
      expect((p.question.match(/[.?!]/g) ?? []).length, p.id).toBe(1);
      expect(/[.?!]$/.test(p.question.trim()), p.id).toBe(true);
    }
  });

  test('aucun principe ne parle de style d’apprentissage ni de police spéciale', () => {
    expect(JSON.stringify(TOUS)).not.toMatch(/visuel|auditif|kinesth|opendyslexic/i);
  });

  test('principeParId retrouve un principe, même en brouillon, et renvoie undefined sinon', () => {
    expect(principeParId('rel-intention')?.phase).toBe('relire');
    expect(principeParId('inconnu')).toBeUndefined();
  });

  test('par défaut les brouillons sont exclus, avec l’option ils sont inclus', () => {
    expect(principesPour(['F411'], 'relire')).toHaveLength(0);
    expect(principesPour(['F411'], 'relire', { brouillons: true }).length).toBeGreaterThan(0);
  });

  test('filtrerPrincipes garde seulement les principes validés de la phase et des codes demandés', () => {
    const liste: Principe[] = [
      { id: 'a', phase: 'relire', question: 'Question a ?', codes: ['F411'], source: { kind: 'non-etaye' }, statut: 'valide' },
      { id: 'b', phase: 'relire', question: 'Question b ?', codes: ['F411'], source: { kind: 'non-etaye' }, statut: 'brouillon' },
      { id: 'c', phase: 'corriger', question: 'Question c ?', codes: ['F411'], source: { kind: 'non-etaye' }, statut: 'valide' },
      { id: 'd', phase: 'relire', question: 'Question d ?', codes: ['F7'], source: { kind: 'non-etaye' }, statut: 'valide' },
    ];
    expect(filtrerPrincipes(liste, ['F411'], 'relire').map((p) => p.id)).toEqual(['a']);
    expect(filtrerPrincipes(liste, ['F411'], 'relire', { brouillons: true }).map((p) => p.id)).toEqual(['a', 'b']);
  });
});
