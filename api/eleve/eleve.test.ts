import { describe, expect, test } from 'vitest';
import { signerJeton, verifierJeton } from '../_lib/session.js';
import { creerLimiteur } from '../_lib/limite.js';
import { ouvrirEleve, sauverTexte, type ActiviteBrute, type Depot } from '../_lib/eleve.js';
import { essaiChasse } from '../_lib/chasse.js';
import { localiserErreurs } from '../../src/lib/chasse.js';

const SECRET = 'secret-de-test';

function depotDeTest() {
  const textes: { activiteId: string; eleveId: string; version: number; texte: string; phase: string; evenements: string[] }[] = [];
  const instantanes: { activiteId: string; eleveId: string; version: number; moment: string; texte: string }[] = [];
  const traces: { eleveId: string; activiteId: string; phase: string; evenement: string }[] = [];
  const r = localiserErreurs('Les élèves de 4e année prépare leur sortie. Ils emporte un pique-nique.', [
    { mot: 'prépare', rang: 1, attendu: 'préparent', type: 'accord-verbe', indice: 'Cherche le sujet.' },
    { mot: 'emporte', rang: 1, attendu: 'emportent', type: 'accord-verbe', indice: '' },
  ]);
  if (!r.ok) throw new Error(r.message);
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
    grammaire3d: true,
    atelierPerso: { 'verbe-sujet': { verbe: ['Mettre la phrase à l’imparfait.'] }, inconnue: { x: ['y'] } },
    chasse: r.chasse,
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
    instantane: async (i) => {
      const k = instantanes.findIndex((x) => x.activiteId === i.activiteId && x.eleveId === i.eleveId && x.version === i.version && x.moment === i.moment);
      if (k < 0) instantanes.push({ activiteId: i.activiteId, eleveId: i.eleveId, version: i.version, moment: i.moment, texte: i.texte });
      else if (i.ecraser) instantanes[k].texte = i.texte;
    },
    eleve: async (id) => (id === 'el1' ? { id: 'el1', aides: ['dictee-vocale', 'colorisation'] } : null),
    tracer: async (eleveId, activiteId, phase, evenements) => {
      for (const evenement of evenements) traces.push({ eleveId, activiteId, phase, evenement });
    },
    dernierTexte: async (eleveId, activiteId) => {
      const l = textes.filter((x) => x.eleveId === eleveId && x.activiteId === activiteId);
      if (l.length === 0) return null;
      const d = l.reduce((m, x) => (x.version > m.version ? x : m));
      return { texte: d.texte, version: d.version, phase: d.phase };
    },
  };
  return { depot, textes, traces, activite, instantanes };
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
    expect(r.status === 200 && r.corps.activites[0].grammaire3d).toBe(true);
  });
});

describe('ouvrirEleve : formulation de l’enseignant (atelier)', () => {
  test('les consignes de l’enseignant arrivent à l’élève, nettoyées (démarches et étapes inconnues retirées)', async () => {
    const { depot } = depotDeTest();
    const r = await ouvrirEleve(depot, SECRET, { codeClasse: 'ABCDEF', codeEleve: 'KMNPQR' });
    expect(r.status === 200 && r.corps.activites[0].atelierPerso).toEqual({ 'verbe-sujet': { verbe: ['Mettre la phrase à l’imparfait.'] } });
  });

  test('sans formulation : objet vide', async () => {
    const { depot, activite } = depotDeTest();
    activite.atelierPerso = undefined;
    const r = await ouvrirEleve(depot, SECRET, { codeClasse: 'ABCDEF', codeEleve: 'KMNPQR' });
    expect(r.status === 200 && r.corps.activites[0].atelierPerso).toEqual({});
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

describe('chasse aux erreurs : ce que l’élève reçoit à l’ouverture', () => {
  test('le texte et le nombre d’erreurs, jamais le corrigé ni les positions', async () => {
    const { depot } = depotDeTest();
    const r = await ouvrirEleve(depot, SECRET, { codeClasse: 'ABCDEF', codeEleve: 'KMNPQR' });
    expect(r.status).toBe(200);
    if (r.status !== 200) return;
    expect(r.corps.activites[0].chasse).toEqual({ texte: 'Les élèves de 4e année prépare leur sortie. Ils emporte un pique-nique.', nbErreurs: 2 });
    const tout = JSON.stringify(r.corps);
    expect(tout).not.toContain('préparent');
    expect(tout).not.toContain('emportent');
    expect(tout).not.toContain('Cherche le sujet');
  });

  test('activité sans chasse : null', async () => {
    const { depot, activite } = depotDeTest();
    activite.chasse = null;
    const r = await ouvrirEleve(depot, SECRET, { codeClasse: 'ABCDEF', codeEleve: 'KMNPQR' });
    expect(r.status === 200 && r.corps.activites[0].chasse).toBeNull();
  });
});

describe('essaiChasse', () => {
  const jeton = () => signerJeton({ eleveId: 'el1', classeId: 'cl1' }, SECRET);
  // « prépare » est le 8e mot du texte de test (numéro 6 : Les, élèves, de, 4e, année, prépare).
  const corps = (surcharge: Record<string, unknown> = {}) => ({ jeton: jeton(), activiteId: 'act1', motIndex: 5, forme: 'préparent', ...surcharge });

  test('bon mot, bonne forme : trouvé, et la trace est enregistrée', async () => {
    const { depot, traces } = depotDeTest();
    const r = await essaiChasse(depot, SECRET, corps());
    expect(r).toEqual({ status: 200, corps: { resultat: 'trouve', erreurId: 0 } });
    expect(traces.map((t) => t.evenement)).toEqual(['chasse:essai:e0:trouve']);
  });

  test('bon mot, mauvaise forme : l’indice, jamais la forme attendue', async () => {
    const { depot, traces } = depotDeTest();
    const r = await essaiChasse(depot, SECRET, corps({ forme: 'prépares' }));
    expect(r).toEqual({ status: 200, corps: { resultat: 'indice', erreurId: 0, indice: 'Cherche le sujet.' } });
    expect(JSON.stringify(r)).not.toContain('préparent');
    expect(traces.map((t) => t.evenement)).toEqual(['chasse:essai:e0:indice']);
  });

  test('mot qui n’est pas à corriger : pas-erreur, une trace sans le mot', async () => {
    const { depot, traces } = depotDeTest();
    const r = await essaiChasse(depot, SECRET, corps({ motIndex: 0 }));
    expect(r).toEqual({ status: 200, corps: { resultat: 'pas-erreur' } });
    expect(traces.map((t) => t.evenement)).toEqual(['chasse:essai:pas-erreur']);
  });

  test('la justification est tracée, limitée à 300 signes, seulement quand une erreur est visée', async () => {
    const { depot, traces } = depotDeTest();
    await essaiChasse(depot, SECRET, corps({ justification: 'Le sujet est élèves.' }));
    expect(traces.map((t) => t.evenement)).toContain('chasse:justification:e0:Le sujet est élèves.');
    const { depot: d2, traces: t2 } = depotDeTest();
    await essaiChasse(d2, SECRET, corps({ motIndex: 0, justification: 'bla' }));
    expect(t2.map((t) => t.evenement)).toEqual(['chasse:essai:pas-erreur']);
    const { depot: d3 } = depotDeTest();
    const trop = await essaiChasse(d3, SECRET, corps({ justification: 'x'.repeat(301) }));
    expect(trop.status).toBe(400);
  });

  test.each([
    ['corps absent', null, 400],
    ['mot sans numéro', { motIndex: 'a' }, 400],
    ['numéro négatif', { motIndex: -1 }, 400],
    ['forme trop longue', { forme: 'x'.repeat(61) }, 400],
    ['jeton falsifié', { jeton: 'x.y.z' }, 401],
    ['activité inconnue', { activiteId: 'zzz' }, 404],
  ])('refus : %s', async (_n, surcharge, status) => {
    const { depot } = depotDeTest();
    const r = await essaiChasse(depot, SECRET, surcharge === null ? null : corps(surcharge as Record<string, unknown>));
    expect(r.status).toBe(status);
  });

  test('activité sans chasse : 404', async () => {
    const { depot, activite } = depotDeTest();
    activite.chasse = null;
    expect((await essaiChasse(depot, SECRET, corps())).status).toBe(404);
  });
});

describe('sauverTexte : instantanés du texte (premier jet, rendu)', () => {
  const jeton = () => signerJeton({ eleveId: 'el1', classeId: 'cl1' }, SECRET);
  const envoi = (depot: Depot, texte: string, phase: string, version = 1) =>
    sauverTexte(depot, SECRET, { jeton: jeton(), activiteId: 'act1', texte, phase, version, evenements: [] });

  test('pendant « écrire » ou « réfléchir » : aucun instantané (le texte bouge encore)', async () => {
    const { depot, instantanes } = depotDeTest();
    await envoi(depot, 'Les élèves prépare', 'reflechir');
    await envoi(depot, 'Les élèves prépare leur sortie.', 'ecrire');
    expect(instantanes).toEqual([]);
  });

  test('premier enregistrement après « écrire » : le premier jet est gardé, et jamais écrasé ensuite', async () => {
    const { depot, instantanes } = depotDeTest();
    await envoi(depot, 'Les élèves prépare leur sortie.', 'relire');
    await envoi(depot, 'Les élèves préparent leur sortie.', 'corriger');
    expect(instantanes).toEqual([{ activiteId: 'act1', eleveId: 'el1', version: 1, moment: 'premier-jet', texte: 'Les élèves prépare leur sortie.' }]);
  });

  test('rendu : le texte final est gardé en plus du premier jet, et le dernier rendu l’emporte', async () => {
    const { depot, instantanes } = depotDeTest();
    await envoi(depot, 'Les élèves prépare.', 'relire');
    await envoi(depot, 'Les élèves préparent.', 'rendu');
    await envoi(depot, 'Les élèves préparent bien.', 'rendu');
    expect(instantanes.map((i) => [i.moment, i.texte])).toEqual([
      ['premier-jet', 'Les élèves prépare.'],
      ['rendu', 'Les élèves préparent bien.'],
    ]);
  });

  test('une nouvelle version (réécrire) a son propre premier jet', async () => {
    const { depot, instantanes } = depotDeTest();
    await envoi(depot, 'V1.', 'relire', 1);
    await envoi(depot, 'V2.', 'relire', 2);
    expect(instantanes.map((i) => [i.version, i.texte])).toEqual([[1, 'V1.'], [2, 'V2.']]);
  });

  test('un échec d’écriture des instantanés ne fait pas perdre le texte enregistré', async () => {
    const { depot, textes } = depotDeTest();
    depot.instantane = async () => {
      throw new Error('table absente');
    };
    const r = await envoi(depot, 'Mon texte.', 'relire');
    expect(r.status).toBe(200);
    expect(textes).toHaveLength(1);
  });
});
