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
    annee: 'P2',
    consigne: 'Écrire trois phrases sur mon animal.',
    contraintes: { minMots: 5 },
    itemIds: ['P1:F114+F115'],
    principeIds: ['rel-intention'],
    categories: ['point_fin_phrase'],
    aidesRetirees: [{ id: 'dictee-vocale', raison: 'On vérifie le geste d’écrire.' }],
    banqueMots: ['chat', 'dormir'],
    principesPerso: [{ phase: 'relire', question: 'As-tu décrit son pelage ?' }],
    atelier: true,
  };
  const depot: Depot = {
    classeParCode: async (code) => (code === 'ABCDEF' ? { id: 'cl1' } : null),
    eleveParCode: async (classeId, code) => (classeId === 'cl1' && code === 'KMNPQR' ? { id: 'el1', aides: ['dictee-vocale', 'colorisation'] } : null),
    activites: async (classeId) => (classeId === 'cl1' ? [activite] : []),
    activite: async (id) => (id === 'act1' ? activite : null),
    enregistrer: async (t) => {
      const i = textes.findIndex((x) => x.activiteId === t.activiteId && x.eleveId === t.eleveId && x.version === t.version);
      if (i >= 0) textes[i] = t;
      else textes.push(t);
    },
    eleve: async (id) => (id === 'el1' ? { id: 'el1', aides: ['dictee-vocale', 'colorisation'] } : null),
    dernierTexte: async (eleveId, activiteId) => {
      const l = textes.filter((x) => x.eleveId === eleveId && x.activiteId === activiteId);
      if (l.length === 0) return null;
      const d = l.reduce((m, x) => (x.version > m.version ? x : m));
      return { texte: d.texte, version: d.version, phase: d.phase };
    },
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
    expect(r.corps.activites[0].aidesRetirees).toEqual([{ id: 'dictee-vocale', raison: 'On vérifie le geste d’écrire.' }]);
    expect(r.corps.activites[0].aides).toEqual([
      { id: 'dictee-vocale', active: false, raison: 'On vérifie le geste d’écrire.' },
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

describe('ouvrirEleve : niveau de l’activité', () => {
  test('l’année de l’activité arrive à l’élève', async () => {
    const { depot } = depotDeTest();
    const r = await ouvrirEleve(depot, SECRET, { codeClasse: 'ABCDEF', codeEleve: 'KMNPQR' });
    expect(r.status === 200 && r.corps.activites[0].annee).toBe('P2');
  });
});

describe('ouvrirEleve : atelier de grammaire', () => {
  test('l’activité dit si l’enseignant a activé l’atelier', async () => {
    const { depot } = depotDeTest();
    const r = await ouvrirEleve(depot, SECRET, { codeClasse: 'ABCDEF', codeEleve: 'KMNPQR' });
    expect(r.status === 200 && r.corps.activites[0].atelier).toBe(true);
  });
});

describe('ouvrirEleve : apports de l’enseignant', () => {
  test('la banque de mots et les questions de l’enseignant arrivent à l’élève', async () => {
    const { depot } = depotDeTest();
    const r = await ouvrirEleve(depot, SECRET, { codeClasse: 'ABCDEF', codeEleve: 'KMNPQR' });
    expect(r.status === 200 && r.corps.activites[0].banqueMots).toEqual(['chat', 'dormir']);
    expect(r.status === 200 && r.corps.activites[0].principesPerso).toEqual([{ phase: 'relire', question: 'As-tu décrit son pelage ?' }]);
  });
});

describe('ouvrirEleve : identité et reprise', () => {
  test('renvoie l’identifiant de l’élève (pour isoler la copie locale sur un appareil partagé)', async () => {
    const { depot } = depotDeTest();
    const r = await ouvrirEleve(depot, SECRET, { codeClasse: 'ABCDEF', codeEleve: 'KMNPQR' });
    expect(r.status === 200 && r.corps.eleveId).toBe('el1');
  });

  test('renvoie le dernier texte enregistré de cet élève pour chaque activité', async () => {
    const { depot, textes } = depotDeTest();
    textes.push({ activiteId: 'act1', eleveId: 'el1', version: 1, texte: 'Mon chat', phase: 'ecrire', evenements: [] });
    textes.push({ activiteId: 'act1', eleveId: 'el1', version: 2, texte: 'Mon chat dort.', phase: 'rendu', evenements: [] });
    const r = await ouvrirEleve(depot, SECRET, { codeClasse: 'ABCDEF', codeEleve: 'KMNPQR' });
    expect(r.status === 200 && r.corps.activites[0].reprise).toEqual({ texte: 'Mon chat dort.', version: 2, phase: 'rendu' });
  });

  test('aucun texte enregistré : pas de reprise', async () => {
    const { depot } = depotDeTest();
    const r = await ouvrirEleve(depot, SECRET, { codeClasse: 'ABCDEF', codeEleve: 'KMNPQR' });
    expect(r.status === 200 && r.corps.activites[0].reprise).toBeUndefined();
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
    expect(r.corps.aides.find((a) => a.id === 'dictee-vocale')?.active).toBe(false);
    // Les retraits courants de l'activité sont renvoyés : l'élève ne peut pas garder une aide que l'enseignant vient de retirer.
    expect(r.corps.aidesRetirees).toEqual([{ id: 'dictee-vocale', raison: 'On vérifie le geste d’écrire.' }]);
    expect(textes).toHaveLength(1);
  });

  test('un événement de trace est limité à 300 signes : jamais un texte entier dans les traces', async () => {
    const { depot, textes } = depotDeTest();
    const r = await sauverTexte(depot, SECRET, { jeton: jeton(), activiteId: 'act1', texte: 'Mon chat dort.', phase: 'corriger', version: 1, evenements: ['atelier:justification:' + 'x'.repeat(2000), 'frappe'] });
    expect(r.status).toBe(200);
    expect(textes[0].evenements[0].length).toBe(300);
    expect(textes[0].evenements[1]).toBe('frappe');
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

  test('la phase « rendu » est acceptée', async () => {
    const { depot, textes } = depotDeTest();
    const r = await sauverTexte(depot, SECRET, { jeton: jeton(), activiteId: 'act1', texte: 'Fini.', phase: 'rendu', version: 1, evenements: ['choix:rendre'] });
    expect(r.status).toBe(200);
    expect(textes[0].phase).toBe('rendu');
  });

  test('l’auto-évaluation de l’élève est enregistrée avec le texte', async () => {
    const { depot, textes } = depotDeTest();
    const auto = { etoiles: ['J’ai décrit mon chat', 'J’ai mis un point'], souhait: 'Écrire une phrase de plus' };
    const r = await sauverTexte(depot, SECRET, { jeton: jeton(), activiteId: 'act1', texte: 'Fini.', phase: 'rendu', version: 1, evenements: [], autoEvaluation: auto });
    expect(r.status).toBe(200);
    expect((textes[0] as { autoEvaluation?: unknown }).autoEvaluation).toEqual(auto);
  });

  test.each([
    ['plus de deux étoiles', { etoiles: ['a', 'b', 'c'], souhait: 'x' }],
    ['étoile trop longue', { etoiles: ['a'.repeat(201)], souhait: 'x' }],
    ['souhait qui n’est pas du texte', { etoiles: ['a'], souhait: 42 }],
    ['pas un objet', 'oups'],
  ])('auto-évaluation invalide (%s) : 400', async (_nom, auto) => {
    const { depot } = depotDeTest();
    const r = await sauverTexte(depot, SECRET, { jeton: jeton(), activiteId: 'act1', texte: 'x', phase: 'rendu', version: 1, evenements: [], autoEvaluation: auto });
    expect(r.status).toBe(400);
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
