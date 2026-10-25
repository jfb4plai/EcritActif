import { describe, expect, test } from 'vitest';
import { signerJeton, verifierJeton } from '../_lib/session.js';
import { creerLimiteur } from '../_lib/limite.js';
import { ouvrirEleve, sauverTexte, type ActiviteBrute, type Depot } from '../_lib/eleve.js';

const SECRET = 'secret-de-test';

function depotDeTest() {
  const textes: { activiteId: string; eleveId: string; version: number; texte: string; phase: string; evenements: string[] }[] = [];
  const activite: ActiviteBrute = {
    id: 'act1',
    classeId: 'cl1',
    consigne: 'Écrire trois phrases sur mon animal.',
    contraintes: { minMots: 5 },
    itemIds: ['P1:F114+F115'],
    principeIds: ['rel-intention'],
    categories: ['point_fin_phrase'],
    aidesRetirees: [{ id: 'clavier', raison: 'On vérifie le geste d’écrire.' }],
  };
  const depot: Depot = {
    classeParCode: async (code) => (code === 'ABCDEF' ? { id: 'cl1' } : null),
    eleveParCode: async (classeId, code) => (classeId === 'cl1' && code === 'KMNPQR' ? { id: 'el1', aides: ['clavier', 'colorisation'] } : null),
    activites: async (classeId) => (classeId === 'cl1' ? [activite] : []),
    activite: async (id) => (id === 'act1' ? activite : null),
    enregistrer: async (t) => {
      const i = textes.findIndex((x) => x.activiteId === t.activiteId && x.eleveId === t.eleveId && x.version === t.version);
      if (i >= 0) textes[i] = t;
      else textes.push(t);
    },
    eleve: async (id) => (id === 'el1' ? { id: 'el1', aides: ['clavier', 'colorisation'] } : null),
  };
  return { depot, textes };
}

describe('jeton de session', () => {
  test('un jeton valide se vérifie', () => {
    const j = signerJeton({ eleveId: 'el1', classeId: 'cl1' }, SECRET);
    expect(verifierJeton(j, SECRET)).toEqual({ eleveId: 'el1', classeId: 'cl1' });
  });
  test('un jeton falsifié est refusé', () => {
    const j = signerJeton({ eleveId: 'el1', classeId: 'cl1' }, SECRET);
    expect(verifierJeton(j.slice(0, -2) + 'xx', SECRET)).toBeNull();
    expect(verifierJeton(j, 'autre-secret')).toBeNull();
  });
  test('un jeton expiré est refusé', () => {
    const j = signerJeton({ eleveId: 'el1', classeId: 'cl1' }, SECRET, -10);
    expect(verifierJeton(j, SECRET)).toBeNull();
  });
  test('une chaîne quelconque ne plante pas', () => {
    expect(verifierJeton('n’importe quoi', SECRET)).toBeNull();
    expect(verifierJeton('', SECRET)).toBeNull();
  });
});

describe('ouvrirEleve', () => {
  test('bons codes : un jeton et les activités avec les aides résolues', async () => {
    const { depot } = depotDeTest();
    const r = await ouvrirEleve(depot, SECRET, { codeClasse: 'ABCDEF', codeEleve: 'KMNPQR' });
    expect(r.status).toBe(200);
    if (r.status !== 200) return;
    expect(verifierJeton(r.corps.jeton, SECRET)).toEqual({ eleveId: 'el1', classeId: 'cl1' });
    expect(r.corps.activites[0].aidesRetirees).toEqual([{ id: 'clavier', raison: 'On vérifie le geste d’écrire.' }]);
    expect(r.corps.activites[0].aides).toEqual([
      { id: 'clavier', active: false, raison: 'On vérifie le geste d’écrire.' },
      { id: 'colorisation', active: true },
    ]);
  });

  test('mauvais code de classe et mauvais code d’élève : même réponse 404', async () => {
    const { depot } = depotDeTest();
    const a = await ouvrirEleve(depot, SECRET, { codeClasse: 'ZZZZZZ', codeEleve: 'KMNPQR' });
    const b = await ouvrirEleve(depot, SECRET, { codeClasse: 'ABCDEF', codeEleve: 'ZZZZZZ' });
    expect(a).toEqual({ status: 404, corps: { erreur: 'Code inconnu' } });
    expect(b).toEqual(a);
  });

  test('corps absent ou mal formé : 400', async () => {
    const { depot } = depotDeTest();
    expect((await ouvrirEleve(depot, SECRET, null)).status).toBe(400);
    expect((await ouvrirEleve(depot, SECRET, { codeClasse: 12 })).status).toBe(400);
  });
});

describe('limiteur', () => {
  test('plus de 10 appels par minute depuis la même adresse : refusé', () => {
    let t = 0;
    const l = creerLimiteur(10, 60_000, () => t);
    for (let i = 0; i < 10; i++) expect(l('1.2.3.4')).toBe(true);
    expect(l('1.2.3.4')).toBe(false);
    expect(l('5.6.7.8')).toBe(true);
    t = 61_000;
    expect(l('1.2.3.4')).toBe(true);
  });
});

describe('sauverTexte', () => {
  const jeton = () => signerJeton({ eleveId: 'el1', classeId: 'cl1' }, SECRET);

  test('enregistre le texte et renvoie la version et les aides courantes', async () => {
    const { depot, textes } = depotDeTest();
    const r = await sauverTexte(depot, SECRET, { jeton: jeton(), activiteId: 'act1', texte: 'Mon chat dort.', phase: 'ecrire', version: 1, evenements: ['frappe'] });
    expect(r.status).toBe(200);
    if (r.status !== 200) return;
    expect(r.corps.version).toBe(1);
    expect(r.corps.aides.find((a) => a.id === 'clavier')?.active).toBe(false);
    expect(textes).toHaveLength(1);
  });

  test('même version : le texte est mis à jour, pas dupliqué ; nouvelle version : nouvelle ligne', async () => {
    const { depot, textes } = depotDeTest();
    const base = { jeton: jeton(), activiteId: 'act1', phase: 'ecrire', evenements: [] as string[] };
    await sauverTexte(depot, SECRET, { ...base, texte: 'Mon', version: 1 });
    await sauverTexte(depot, SECRET, { ...base, texte: 'Mon chat', version: 1 });
    expect(textes).toHaveLength(1);
    expect(textes[0].texte).toBe('Mon chat');
    await sauverTexte(depot, SECRET, { ...base, texte: 'Autre', version: 2 });
    expect(textes).toHaveLength(2);
  });

  test('jeton falsifié : 401', async () => {
    const { depot } = depotDeTest();
    const r = await sauverTexte(depot, SECRET, { jeton: 'faux', activiteId: 'act1', texte: 'x', phase: 'ecrire', version: 1, evenements: [] });
    expect(r.status).toBe(401);
  });

  test('texte de plus de 20 000 caractères : 413', async () => {
    const { depot } = depotDeTest();
    const r = await sauverTexte(depot, SECRET, { jeton: jeton(), activiteId: 'act1', texte: 'a'.repeat(20_001), phase: 'ecrire', version: 1, evenements: [] });
    expect(r.status).toBe(413);
  });

  test('activité d’une autre classe ou inconnue : 404', async () => {
    const { depot } = depotDeTest();
    const r = await sauverTexte(depot, SECRET, { jeton: jeton(), activiteId: 'inconnue', texte: 'x', phase: 'ecrire', version: 1, evenements: [] });
    expect(r.status).toBe(404);
  });
});
