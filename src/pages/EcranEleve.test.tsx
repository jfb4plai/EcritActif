import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import EcranEleve, { type ApiEleve } from './EcranEleve';
import type { ActiviteEleve } from '../../api/_lib/eleve';
import { chargerDictionnaire } from '../lib/dictionnaire';

// Les fichiers de la liste de mots (1,4 Mo) ne sont pas servis en test : la vraie liste est testée dans dictionnaire.test.ts.
vi.mock('../lib/dictionnaire', async (original) => ({ ...(await original<typeof import('../lib/dictionnaire')>()), chargerDictionnaire: vi.fn() }));

function activite(surcharge: Partial<ActiviteEleve> = {}): ActiviteEleve {
  return {
    id: 'act1',
    annee: 'P2',
    consigne: 'Écrire trois phrases sur mon animal.',
    contraintes: { minMots: 5 },
    itemIds: [],
    principeIds: ['refl-intention', 'rel-intention'],
    categories: ['majuscule_debut_phrase'],
    aides: [],
    aidesRetirees: [],
    banqueMots: [],
    principesPerso: [],
    atelier: false,
    ...surcharge,
  };
}

function apiDeTest(reponse: Awaited<ReturnType<ApiEleve['sauver']>> = { version: 1, aides: [] }) {
  const api: ApiEleve = { sauver: vi.fn(async () => reponse), chasse: vi.fn(async () => ({ resultat: 'pas-erreur' as const })) };
  return api;
}

beforeEach(() => localStorage.clear());
afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

async function versEcriture() {
  await userEvent.click(screen.getByRole('button', { name: /commencer à écrire/i }));
}

describe('EcranEleve : appareil partagé et reprise (revue finale)', () => {
  test('le texte d’un autre élève sur le même appareil n’est jamais restauré', () => {
    localStorage.setItem('ecrit:elA:act1', 'Texte de A.');
    render(<EcranEleve activite={activite()} eleveId="elB" jeton="j" api={apiDeTest()} delaiSauvegardeMs={0} />);
    expect(screen.queryByLabelText(/mon texte/i)).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /commencer à écrire/i })).toBeInTheDocument();
  });

  test('le texte enregistré par le serveur est repris quand l’appareil n’a rien', () => {
    render(<EcranEleve activite={activite({ reprise: { texte: 'Du serveur.', version: 2, phase: 'relire' } })} eleveId="el1" jeton="j" api={apiDeTest()} delaiSauvegardeMs={0} />);
    expect(screen.getByLabelText(/mon texte/i)).toHaveValue('Du serveur.');
  });

  test('la version reprise du serveur est celle envoyée ensuite', async () => {
    const api = apiDeTest();
    render(<EcranEleve activite={activite({ reprise: { texte: 'Du serveur.', version: 2, phase: 'ecrire' } })} eleveId="el1" jeton="j" api={api} delaiSauvegardeMs={0} />);
    await userEvent.type(screen.getByLabelText(/mon texte/i), ' Plus.');
    await waitFor(() => {
      const d = (api.sauver as ReturnType<typeof vi.fn>).mock.calls.at(-1)?.[0];
      expect(d).toMatchObject({ version: 2, texte: 'Du serveur. Plus.' });
    });
  });

  test('un texte déjà rendu reste rendu : pas de modification, aucun envoi qui l’écraserait', async () => {
    const api = apiDeTest();
    render(<EcranEleve activite={activite({ reprise: { texte: 'Fini.', version: 1, phase: 'rendu' } })} eleveId="el1" jeton="j" api={api} delaiSauvegardeMs={0} />);
    expect(screen.getByText(/ton texte est rendu/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/mon texte/i)).toBeDisabled();
    await new Promise((r) => setTimeout(r, 30));
    expect(api.sauver).not.toHaveBeenCalled();
  });

  test('rendre le texte l’enregistre avec la phase « rendu »', async () => {
    const api = apiDeTest();
    render(<EcranEleve activite={activite()} eleveId="el1" jeton="j" api={api} delaiSauvegardeMs={0} />);
    await versEcriture();
    await userEvent.type(screen.getByLabelText(/mon texte/i), 'Un chat.');
    await userEvent.click(screen.getByRole('button', { name: /fini d.écrire/i }));
    await userEvent.click(screen.getByRole('button', { name: /passer à la correction/i }));
    await userEvent.click(screen.getByRole('button', { name: /rendre mon texte/i }));
    await waitFor(() => {
      const d = (api.sauver as ReturnType<typeof vi.fn>).mock.calls.at(-1)?.[0];
      expect(d).toMatchObject({ phase: 'rendu', texte: 'Un chat.' });
    });
  });

  test('après un échec réseau, l’envoi est retenté tout seul sans que l’élève touche au clavier', async () => {
    const sauver = vi
      .fn()
      .mockRejectedValueOnce(new Error('réseau'))
      .mockResolvedValue({ version: 1, aides: [] });
    render(<EcranEleve activite={activite()} eleveId="el1" jeton="j" api={{ sauver, chasse: vi.fn() }} delaiSauvegardeMs={0} reessaiMs={20} />);
    await versEcriture();
    await userEvent.type(screen.getByLabelText(/mon texte/i), 'Un');
    await waitFor(() => expect(sauver.mock.calls.length).toBeGreaterThanOrEqual(2));
    await waitFor(() => expect(screen.queryByText(/seulement sur cet appareil/i)).not.toBeInTheDocument());
  });
});

function simulerSynthese() {
  const parle = vi.fn();
  class Enonce {
    voice: unknown = null;
    lang = '';
    constructor(public text: string) {}
  }
  vi.stubGlobal('SpeechSynthesisUtterance', Enonce);
  vi.stubGlobal('speechSynthesis', { getVoices: () => [], speak: parle, cancel: vi.fn() });
  return parle;
}

describe('EcranEleve : chaque aide du catalogue a un effet visible (amélioration 2)', () => {
  test('audio-consigne : la consigne est lue dès l’ouverture', () => {
    const parle = simulerSynthese();
    render(<EcranEleve activite={activite({ aides: [{ id: 'audio-consigne', active: true }] })} eleveId="el1" jeton="j" api={apiDeTest()} delaiSauvegardeMs={0} />);
    expect(parle).toHaveBeenCalledOnce();
    expect((parle.mock.calls[0][0] as { text: string }).text).toContain('Écrire trois phrases sur mon animal');
  });

  test('audio-consigne inactive : rien n’est lu tout seul', () => {
    const parle = simulerSynthese();
    render(<EcranEleve activite={activite()} eleveId="el1" jeton="j" api={apiDeTest()} delaiSauvegardeMs={0} />);
    expect(parle).not.toHaveBeenCalled();
  });

  test('organisateur : trois cases pour ranger ses idées, rappelées pendant l’écriture', async () => {
    const aides = [{ id: 'organisateur' as const, active: true }];
    render(<EcranEleve activite={activite({ aides })} eleveId="el1" jeton="j" api={apiDeTest({ version: 1, aides })} delaiSauvegardeMs={0} />);
    await userEvent.type(screen.getByLabelText(/au début/i), 'un chat roux');
    expect(screen.getByLabelText(/ensuite/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/à la fin/i)).toBeInTheDocument();
    await versEcriture();
    const memo = screen.getByRole('region', { name: /mes idées/i });
    expect(memo).toHaveTextContent('un chat roux');
  });

  test('organisateur inactif : pas de cases', () => {
    render(<EcranEleve activite={activite()} eleveId="el1" jeton="j" api={apiDeTest()} delaiSauvegardeMs={0} />);
    expect(screen.queryByLabelText(/au début/i)).not.toBeInTheDocument();
  });

  test('banque-mots : les mots de l’enseignant s’insèrent dans le texte d’un clic', async () => {
    const aides = [{ id: 'banque-mots' as const, active: true }];
    render(<EcranEleve activite={activite({ banqueMots: ['chat', 'dormir'], aides })} eleveId="el1" jeton="j" api={apiDeTest({ version: 1, aides })} delaiSauvegardeMs={0} />);
    await versEcriture();
    await userEvent.click(screen.getByRole('button', { name: 'chat' }));
    await userEvent.click(screen.getByRole('button', { name: 'dormir' }));
    expect(screen.getByLabelText(/mon texte/i)).toHaveValue('chat dormir');
  });

  test('banque-mots inactive : aucun mot proposé', async () => {
    render(<EcranEleve activite={activite({ banqueMots: ['chat'] })} eleveId="el1" jeton="j" api={apiDeTest()} delaiSauvegardeMs={0} />);
    await versEcriture();
    expect(screen.queryByRole('button', { name: 'chat' })).not.toBeInTheDocument();
  });

  test('colorisation : un choix de coloration apparaît à la relecture', async () => {
    const aides = [{ id: 'colorisation' as const, active: true }];
    render(<EcranEleve activite={activite({ aides })} eleveId="el1" jeton="j" api={apiDeTest({ version: 1, aides })} delaiSauvegardeMs={0} />);
    await versEcriture();
    await userEvent.type(screen.getByLabelText(/mon texte/i), 'Un chat.');
    await userEvent.click(screen.getByRole('button', { name: /fini d.écrire/i }));
    expect(screen.getByLabelText(/colorer/i)).toBeInTheDocument();
  });
});

describe('EcranEleve : collage limité à son propre texte (amélioration 3)', () => {
  async function enEcriture() {
    render(<EcranEleve activite={activite()} eleveId="el1" jeton="j" api={apiDeTest()} delaiSauvegardeMs={0} />);
    await versEcriture();
    await userEvent.type(screen.getByLabelText(/mon texte/i), 'Mon chat dort');
    return screen.getByLabelText(/mon texte/i);
  }

  test('un texte venu d’ailleurs est refusé avec une explication', async () => {
    const zone = await enEcriture();
    const autorise = fireEvent.paste(zone, { clipboardData: { getData: () => 'Un texte copié sur un autre site.' } });
    expect(autorise).toBe(false);
    expect(zone).toHaveValue('Mon chat dort');
    expect(await screen.findByText(/écris avec tes mots/i)).toBeInTheDocument();
  });

  test('un morceau de son propre texte peut être collé', async () => {
    const zone = await enEcriture();
    expect(fireEvent.paste(zone, { clipboardData: { getData: () => 'chat dort' } })).toBe(true);
  });

  test('le refus est enregistré comme trace pour l’enseignant', async () => {
    const api = apiDeTest();
    render(<EcranEleve activite={activite()} eleveId="el1" jeton="j" api={api} delaiSauvegardeMs={0} />);
    await versEcriture();
    const zone = screen.getByLabelText(/mon texte/i);
    fireEvent.paste(zone, { clipboardData: { getData: () => 'Autre texte' } });
    await userEvent.type(zone, 'a');
    await waitFor(() => {
      const tous = (api.sauver as ReturnType<typeof vi.fn>).mock.calls.flatMap((c) => c[0].evenements as string[]);
      expect(tous).toContain('collage-refuse');
    });
  });
});

describe('EcranEleve : questions écrites par l’enseignant (amélioration 4)', () => {
  const perso = [
    { phase: 'reflechir' as const, question: 'Comment s’appelle ton animal ?' },
    { phase: 'relire' as const, question: 'As-tu décrit son pelage ?' },
    { phase: 'corriger' as const, question: 'As-tu relu les noms propres ?' },
  ];

  test('chaque question de l’enseignant apparaît dans son temps', async () => {
    render(<EcranEleve activite={activite({ principesPerso: perso, principeIds: [], contraintes: {} })} eleveId="el1" jeton="j" api={apiDeTest()} delaiSauvegardeMs={0} />);
    expect(screen.getByText('Comment s’appelle ton animal ?')).toBeInTheDocument();
    await versEcriture();
    await userEvent.type(screen.getByLabelText(/mon texte/i), 'Un chat roux.');
    await userEvent.click(screen.getByRole('button', { name: /fini d.écrire/i }));
    expect(screen.getByText('As-tu décrit son pelage ?')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /passer à la correction/i }));
    expect(screen.getByText('As-tu relu les noms propres ?')).toBeInTheDocument();
  });

  test('elles s’ajoutent aux questions fixes choisies', () => {
    render(<EcranEleve activite={activite({ principesPerso: perso })} eleveId="el1" jeton="j" api={apiDeTest()} delaiSauvegardeMs={0} />);
    expect(screen.getByText(/Que veux-tu dire dans ce texte/)).toBeInTheDocument();
    expect(screen.getByText('Comment s’appelle ton animal ?')).toBeInTheDocument();
  });
});

describe('EcranEleve : quitter avant d’avoir écrit', () => {
  test('ouvrir puis quitter sans rien écrire : à la réouverture, on recommence par « réfléchir »', () => {
    const { unmount } = render(<EcranEleve activite={activite()} eleveId="el1" jeton="j" api={apiDeTest()} delaiSauvegardeMs={0} />);
    unmount();
    render(<EcranEleve activite={activite()} eleveId="el1" jeton="j" api={apiDeTest()} delaiSauvegardeMs={0} />);
    expect(screen.getByRole('button', { name: /commencer à écrire/i })).toBeInTheDocument();
  });
});

describe('EcranEleve : qualité de la rétroaction et littératie à la rétroaction (articles de JF)', () => {
  async function jusquAuTemps(texte: string, temps: 'relire' | 'corriger', a = activite(), api = apiDeTest()) {
    render(<EcranEleve activite={a} eleveId="el1" jeton="j" api={api} delaiSauvegardeMs={0} />);
    await versEcriture();
    await userEvent.type(screen.getByLabelText(/mon texte/i), texte);
    await userEvent.click(screen.getByRole('button', { name: /fini d.écrire/i }));
    if (temps === 'corriger') await userEvent.click(screen.getByRole('button', { name: /passer à la correction/i }));
    return api;
  }
  const evenementsEnvoyes = (api: ApiEleve) => (api.sauver as ReturnType<typeof vi.fn>).mock.calls.flatMap((c) => c[0].evenements as string[]);

  test('le retour sur la longueur dit les chiffres et propose une action', async () => {
    await jusquAuTemps('Un chat.', 'relire');
    expect(screen.getByText('Ton texte a 2 mots ; il en faut au moins 5. Ajoute une phrase.')).toBeInTheDocument();
  });

  test('« Je ne comprends pas » sur un signal : explication simple et trace pour l’enseignant', async () => {
    const api = await jusquAuTemps('il pleut', 'corriger', activite({ categories: ['majuscule_debut_phrase'] }));
    await userEvent.click(screen.getAllByRole('button', { name: /je ne comprends pas/i })[0]);
    expect(screen.getByText(/grande lettre/i)).toBeInTheDocument();
    expect(screen.getByText(/demander de l.aide, c.est apprendre/i)).toBeInTheDocument();
    await userEvent.type(screen.getByLabelText(/mon texte/i), ' ');
    await waitFor(() => expect(evenementsEnvoyes(api)).toContain('clarification:majuscule_debut_phrase'));
  });

  test.each([
    ['P1', /un point/i, /exclamation/i],
    ['P2', /point d.exclamation/i, null],
  ] as const)('l’explication sur la fin du texte suit le programme de %s', async (annee, attendu, interdit) => {
    await jusquAuTemps('il pleut', annee === 'P1' ? 'relire' : 'corriger', activite({ annee, categories: ['point_fin_phrase'] }));
    await userEvent.click(screen.getAllByRole('button', { name: /je ne comprends pas/i }).at(-1)!);
    expect(screen.getByText(attendu)).toBeInTheDocument();
    if (interdit) expect(screen.queryByText(interdit)).not.toBeInTheDocument();
  });

  test('« Je ne comprends pas » sur une question de relecture : trace avec l’identifiant de la question', async () => {
    const api = await jusquAuTemps('Un chat qui dort sur le canapé du salon.', 'relire', activite({ contraintes: {}, principeIds: ['rel-intention'] }));
    await userEvent.click(screen.getByRole('button', { name: /je ne comprends pas/i }));
    expect(screen.getByText(/réponds dans ta tête/i)).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /j.ai regardé/i }));
    await waitFor(() => expect(evenementsEnvoyes(api)).toContain('clarification:rel-intention'));
  });

  test('le bilan du texte rendu est un fait sur le travail, sans « bravo »', async () => {
    await jusquAuTemps('Un chat roux.', 'corriger');
    await userEvent.click(screen.getByRole('button', { name: /rendre mon texte/i }));
    expect(screen.getByText('Ton texte est rendu : 3 mots, 1 version.')).toBeInTheDocument();
    expect(screen.queryByText(/bravo/i)).not.toBeInTheDocument();
  });

  test('deux étoiles et un souhait : envoyés avec le texte rendu', async () => {
    const api = await jusquAuTemps('Un chat roux.', 'corriger');
    expect(screen.getByRole('group', { name: /deux étoiles et un souhait/i })).toBeInTheDocument();
    await userEvent.type(screen.getByLabelText(/^une chose réussie/i), 'J’ai décrit mon chat');
    await userEvent.type(screen.getByLabelText(/une autre chose réussie/i), 'J’ai mis un point');
    await userEvent.type(screen.getByLabelText(/un souhait pour la prochaine fois/i), 'Écrire une phrase de plus');
    await userEvent.click(screen.getByRole('button', { name: /rendre mon texte/i }));
    await waitFor(() => {
      const d = (api.sauver as ReturnType<typeof vi.fn>).mock.calls.at(-1)?.[0];
      expect(d).toMatchObject({ phase: 'rendu', autoEvaluation: { etoiles: ['J’ai décrit mon chat', 'J’ai mis un point'], souhait: 'Écrire une phrase de plus' } });
    });
    expect(evenementsEnvoyes(api)).toContain('auto-evaluation:faite');
  });

  test('l’auto-évaluation est facultative : rien de rempli, rien d’envoyé', async () => {
    const api = await jusquAuTemps('Un chat roux.', 'corriger');
    await userEvent.click(screen.getByRole('button', { name: /rendre mon texte/i }));
    await waitFor(() => {
      const d = (api.sauver as ReturnType<typeof vi.fn>).mock.calls.at(-1)?.[0];
      expect(d.phase).toBe('rendu');
      expect(d.autoEvaluation).toBeUndefined();
    });
  });

  test('« Essayer autrement » garde la version d’avant à côté et demande ce qui est mieux', async () => {
    const api = await jusquAuTemps('Un chat roux.', 'corriger');
    await userEvent.click(screen.getByRole('button', { name: /essayer autrement/i }));
    const detail = screen.getByText(/ma version d.avant/i).closest('details') as HTMLElement;
    expect(detail).toHaveTextContent('Un chat roux.');
    await userEvent.type(screen.getByLabelText(/mon texte/i), ' Il dort.');
    await userEvent.click(screen.getByRole('button', { name: /fini d.écrire/i }));
    await userEvent.click(screen.getByRole('button', { name: /passer à la correction/i }));
    await userEvent.type(screen.getByLabelText(/ce qui est mieux dans ma nouvelle version/i), 'J’ai ajouté ce que fait le chat');
    await userEvent.click(screen.getByRole('button', { name: /rendre mon texte/i }));
    await waitFor(() => {
      const d = (api.sauver as ReturnType<typeof vi.fn>).mock.calls.at(-1)?.[0];
      expect(d).toMatchObject({ phase: 'rendu', version: 2, autoEvaluation: { change: 'J’ai ajouté ce que fait le chat' } });
    });
    expect(screen.getByText(/2 versions/)).toBeInTheDocument();
  });

  test('la version d’avant n’apparaît pas tant qu’il n’y a qu’une version', async () => {
    await jusquAuTemps('Un chat roux.', 'corriger');
    expect(screen.queryByText(/ma version d.avant/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/ce qui est mieux dans ma nouvelle version/i)).not.toBeInTheDocument();
  });
});

describe('EcranEleve : gérer ses émotions face aux retours (compétence 3 du cadre RISS)', () => {
  async function vers(temps: 'relire' | 'corriger', api = apiDeTest()) {
    render(<EcranEleve activite={activite({ contraintes: {} })} eleveId="el1" jeton="j" api={api} delaiSauvegardeMs={0} />);
    await versEcriture();
    await userEvent.type(screen.getByLabelText(/mon texte/i), 'il pleut');
    await userEvent.click(screen.getByRole('button', { name: /fini d.écrire/i }));
    if (temps === 'corriger') await userEvent.click(screen.getByRole('button', { name: /passer à la correction/i }));
    return api;
  }

  test.each(['relire', 'corriger'] as const)('au temps « %s », un mot sur l’erreur est visible sans rien cliquer', async (temps) => {
    await vers(temps);
    expect(screen.getByText('Se tromper, c’est normal : on apprend en essayant autrement.')).toBeVisible();
  });

  test('le temps pour respirer est proposé, fermé par défaut, jamais obligatoire', async () => {
    await vers('corriger');
    const detail = screen.getByText(/prendre un moment avant de lire les retours/i).closest('details') as HTMLElement;
    expect(detail).not.toHaveAttribute('open');
    // Les retours restent accessibles sans l'ouvrir.
    expect(screen.getByRole('button', { name: /rendre mon texte/i })).toBeEnabled();
  });

  test('« J’ai respiré » est une trace pour l’enseignant, pas un passage obligé', async () => {
    const api = await vers('corriger');
    await userEvent.click(screen.getByRole('button', { name: /j.ai respiré/i }));
    await waitFor(() => {
      const tous = (api.sauver as ReturnType<typeof vi.fn>).mock.calls.flatMap((c) => c[0].evenements as string[]);
      expect(tous).toContain('respiration:faite');
    });
  });

  test('une fois le texte rendu, plus de consigne de respiration', async () => {
    await vers('corriger');
    await userEvent.click(screen.getByRole('button', { name: /rendre mon texte/i }));
    expect(screen.queryByText(/prendre un moment avant de lire les retours/i)).not.toBeInTheDocument();
  });
});

describe('EcranEleve : référence au programme CECP', () => {
  test('« Dans le programme » cite l’item du CECP tel quel, fermé par défaut', () => {
    render(<EcranEleve activite={activite({ itemIds: ['P1:F114+F115'] })} eleveId="el1" jeton="j" api={apiDeTest()} delaiSauvegardeMs={0} />);
    const detail = screen.getByText(/dans le programme/i).closest('details') as HTMLElement;
    expect(detail).not.toHaveAttribute('open');
    expect(detail).toHaveTextContent('F114, F115');
    expect(detail).toHaveTextContent('Réviser sa production écrite');
    expect(detail).toHaveTextContent('Relire son écrit en vérifiant si son contenu correspond à l’intention poursuivie');
  });

  test('les deux sources sont combinées : l’attendu du référentiel de l’année et les composantes de l’écrit, avec les items CECP', () => {
    render(<EcranEleve activite={activite({ annee: 'P1', itemIds: ['P1:F114+F115'] })} eleveId="el1" jeton="j" api={apiDeTest()} delaiSauvegardeMs={0} />);
    const detail = screen.getByText(/dans le programme/i).closest('details') as HTMLElement;
    expect(detail).toHaveTextContent('Référentiel de français et langues anciennes');
    expect(detail).toHaveTextContent('Rédiger un écrit lisible');
    expect(detail).toHaveTextContent('planification ; mise en texte ; révision');
    expect(detail).not.toHaveTextContent('correction');
    expect(detail).toHaveTextContent('Programme d’études de l’enseignement primaire (CECP');
    expect(detail).toHaveTextContent('F114, F115');
  });

  test('en P2, la correction s’ajoute aux composantes citées', () => {
    render(<EcranEleve activite={activite({ annee: 'P2', itemIds: [] })} eleveId="el1" jeton="j" api={apiDeTest()} delaiSauvegardeMs={0} />);
    expect(screen.getByText(/dans le programme/i).closest('details')).toHaveTextContent('planification ; mise en texte ; révision ; correction');
  });

  test('un identifiant d’item inconnu ne plante pas : le référentiel reste cité, sans item CECP', () => {
    render(<EcranEleve activite={activite({ itemIds: ['P9:F0'] })} eleveId="el1" jeton="j" api={apiDeTest()} delaiSauvegardeMs={0} />);
    const detail = screen.getByText(/dans le programme/i).closest('details') as HTMLElement;
    expect(detail).toHaveTextContent('Rédiger un écrit lisible');
    expect(detail).not.toHaveTextContent('P9');
  });
});

describe('EcranEleve : P1 en trois temps, comme le référentiel (correction nommée à partir de P2)', () => {
  const p1 = (surcharge: Partial<ActiviteEleve> = {}) => activite({ annee: 'P1', contraintes: {}, categories: ['majuscule_debut_phrase'], principeIds: [], ...surcharge });

  async function relirep1(texte: string, a = p1()) {
    const api = apiDeTest();
    render(<EcranEleve activite={a} eleveId="el1" jeton="j" api={api} delaiSauvegardeMs={0} />);
    await versEcriture();
    if (texte !== '') await userEvent.type(screen.getByLabelText(/mon texte/i), texte);
    await userEvent.click(screen.getByRole('button', { name: /fini d.écrire/i }));
    return api;
  }

  test('trois tuiles numérotées : Réfléchir, Écrire, Relire', () => {
    render(<EcranEleve activite={p1()} eleveId="el1" jeton="j" api={apiDeTest()} delaiSauvegardeMs={0} />);
    const liste = screen.getByRole('list', { name: /les trois temps/i });
    expect(within(liste).getAllByRole('listitem').map((t) => t.textContent)).toEqual(['1 Réfléchir', '2 Écrire', '3 Relire']);
  });

  test('en P2, il y a bien quatre tuiles', () => {
    render(<EcranEleve activite={activite({ annee: 'P2' })} eleveId="el1" jeton="j" api={apiDeTest()} delaiSauvegardeMs={0} />);
    expect(within(screen.getByRole('list', { name: /les quatre temps/i })).getAllByRole('listitem')).toHaveLength(4);
  });

  test('à « Relire », plus de passage à la correction : les signaux, la modification du texte et le rendu sont au même endroit', async () => {
    await relirep1('il pleut');
    expect(screen.queryByRole('button', { name: /passer à la correction/i })).not.toBeInTheDocument();
    expect(screen.getByText(/Regarde la première lettre de cette phrase/)).toBeInTheDocument();
    expect(screen.getByLabelText(/mon texte/i)).toBeEnabled();
    expect(screen.getByRole('group', { name: /deux étoiles et un souhait/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /rendre mon texte/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /essayer autrement/i })).toBeInTheDocument();
  });

  test('« Je ne comprends pas » fonctionne aussi à ce temps fusionné, avec le vocabulaire de P1', async () => {
    await relirep1('il pleut');
    await userEvent.click(screen.getAllByRole('button', { name: /je ne comprends pas/i })[0]);
    expect(screen.getByText(/une majuscule, une grande lettre/i)).toBeInTheDocument();
  });

  test('une question fixe « corriger » arrive comme une question de relecture', async () => {
    await relirep1('Un chat qui dort sur le canapé.', p1({ principeIds: ['cor-majuscule'] }));
    expect(screen.getByText('Chaque phrase commence-t-elle par une majuscule ?')).toBeInTheDocument();
  });

  test('une question de l’enseignant « corriger » arrive aussi à ce temps', async () => {
    await relirep1('Un chat qui dort sur le canapé.', p1({ principesPerso: [{ phase: 'corriger', question: 'As-tu relu les noms propres ?' }] }));
    expect(screen.getByText('As-tu relu les noms propres ?')).toBeInTheDocument();
  });

  test('le mot sur l’erreur n’apparaît qu’une fois', async () => {
    await relirep1('il pleut');
    expect(screen.getAllByText('Se tromper, c’est normal : on apprend en essayant autrement.')).toHaveLength(1);
  });

  test('rendre à ce temps : phase « rendu », bilan factuel', async () => {
    const api = await relirep1('Un chat roux.');
    await userEvent.click(screen.getByRole('button', { name: /rendre mon texte/i }));
    expect(screen.getByText('Ton texte est rendu : 3 mots, 1 version.')).toBeInTheDocument();
    await waitFor(() => {
      const d = (api.sauver as ReturnType<typeof vi.fn>).mock.calls.at(-1)?.[0];
      expect(d).toMatchObject({ phase: 'rendu', texte: 'Un chat roux.' });
    });
  });

  test('texte vide : seulement l’invitation à écrire, pas de formulaire de fin', async () => {
    await relirep1('');
    expect(screen.getByText(/Écris d.abord quelques mots/i)).toBeInTheDocument();
    expect(screen.queryByRole('group', { name: /deux étoiles et un souhait/i })).not.toBeInTheDocument();
  });

  test('un texte déjà rendu en P1 reprend au troisième temps, sans modification possible', () => {
    render(<EcranEleve activite={p1({ reprise: { texte: 'Fini.', version: 1, phase: 'rendu' } })} eleveId="el1" jeton="j" api={apiDeTest()} delaiSauvegardeMs={0} />);
    const [, , t3] = within(screen.getByRole('list', { name: /les trois temps/i })).getAllByRole('listitem');
    expect(t3).toHaveAttribute('aria-current', 'step');
    expect(screen.getByText(/ton texte est rendu/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/mon texte/i)).toBeDisabled();
  });
});

describe('EcranEleve : les questions fixes « corriger » ne sont plus perdues dès P2', () => {
  test('en P2, la question fixe choisie par l’enseignant s’affiche au temps Corriger', async () => {
    render(<EcranEleve activite={activite({ annee: 'P2', contraintes: {}, principeIds: ['cor-point'] })} eleveId="el1" jeton="j" api={apiDeTest()} delaiSauvegardeMs={0} />);
    await versEcriture();
    await userEvent.type(screen.getByLabelText(/mon texte/i), 'Un chat qui dort.');
    await userEvent.click(screen.getByRole('button', { name: /fini d.écrire/i }));
    await userEvent.click(screen.getByRole('button', { name: /passer à la correction/i }));
    expect(screen.getByText('Chaque phrase se termine-t-elle par un point ?')).toBeInTheDocument();
  });
});

describe('EcranEleve : réfléchir', () => {
  test('affiche la consigne et les questions de la phase réfléchir', () => {
    render(<EcranEleve activite={activite()} eleveId="el1" jeton="j" api={apiDeTest()} delaiSauvegardeMs={0} />);
    expect(screen.getByText(/Écrire trois phrases sur mon animal/)).toBeInTheDocument();
    expect(screen.getByText(/Que veux-tu dire dans ce texte/)).toBeInTheDocument();
  });
});

describe('EcranEleve : questions lues à voix haute (revue finale)', () => {
  test('un bouton lit les questions à voix haute quand la synthèse existe', async () => {
    const parle = vi.fn();
    class Enonce {
      voice: unknown = null;
      lang = '';
      constructor(public text: string) {}
    }
    vi.stubGlobal('SpeechSynthesisUtterance', Enonce);
    vi.stubGlobal('speechSynthesis', { getVoices: () => [], speak: parle, cancel: vi.fn() });
    render(<EcranEleve activite={activite()} eleveId="el1" jeton="j" api={apiDeTest()} delaiSauvegardeMs={0} />);
    await userEvent.click(screen.getByRole('button', { name: /écouter les questions/i }));
    expect(parle).toHaveBeenCalledOnce();
    expect((parle.mock.calls[0][0] as Enonce).text).toContain('Que veux-tu dire dans ce texte');
    vi.unstubAllGlobals();
  });
});

describe('EcranEleve : écrire', () => {
  test('aucune correction n’apparaît pendant l’écriture', async () => {
    render(<EcranEleve activite={activite()} eleveId="el1" jeton="j" api={apiDeTest()} delaiSauvegardeMs={0} />);
    await versEcriture();
    await userEvent.type(screen.getByLabelText(/mon texte/i), 'mon chat dort');
    expect(screen.queryByText(/Regarde la première lettre/)).not.toBeInTheDocument();
  });

  test('un texte enregistré sur l’appareil revient après fermeture de l’onglet (Review Focus 1)', () => {
    localStorage.setItem('ecrit:el1:act1', 'Mon chat dort.');
    render(<EcranEleve activite={activite()} eleveId="el1" jeton="j" api={apiDeTest()} delaiSauvegardeMs={0} />);
    expect(screen.getByLabelText(/mon texte/i)).toHaveValue('Mon chat dort.');
  });

  test('la sauvegarde sur le serveur est appelée avec le texte, la phase et la version', async () => {
    const api = apiDeTest();
    render(<EcranEleve activite={activite()} eleveId="el1" jeton="jeton-x" api={api} delaiSauvegardeMs={0} />);
    await versEcriture();
    await userEvent.type(screen.getByLabelText(/mon texte/i), 'Un chat');
    await waitFor(() => {
      const dernier = (api.sauver as ReturnType<typeof vi.fn>).mock.calls.at(-1)?.[0];
      expect(dernier).toMatchObject({ jeton: 'jeton-x', activiteId: 'act1', texte: 'Un chat', phase: 'ecrire', version: 1 });
    });
  });

  test('si le serveur est injoignable, le texte reste et un message le dit', async () => {
    const api: ApiEleve = { sauver: vi.fn(async () => Promise.reject(new Error('réseau'))), chasse: vi.fn() };
    render(<EcranEleve activite={activite()} eleveId="el1" jeton="j" api={api} delaiSauvegardeMs={0} />);
    await versEcriture();
    await userEvent.type(screen.getByLabelText(/mon texte/i), 'Un chat');
    expect(await screen.findByText(/seulement sur cet appareil/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/mon texte/i)).toHaveValue('Un chat');
  });
});

describe('EcranEleve : relire et corriger', () => {
  async function jusqueRelire(texte: string, a = activite()) {
    render(<EcranEleve activite={a} eleveId="el1" jeton="j" api={apiDeTest({ version: 1, aides: a.aides })} delaiSauvegardeMs={0} />);
    await versEcriture();
    if (texte) await userEvent.type(screen.getByLabelText(/mon texte/i), texte);
    await userEvent.click(screen.getByRole('button', { name: /fini d.écrire/i }));
  }

  test('texte vide : une invitation à écrire, pas d’erreur (Review Focus 2)', async () => {
    await jusqueRelire('');
    expect(screen.getByText(/Écris d.abord quelques mots/i)).toBeInTheDocument();
  });

  test('corriger : l’indice est donné sans la forme corrigée', async () => {
    await jusqueRelire('mon chat dort');
    await userEvent.click(screen.getByRole('button', { name: /passer à la correction/i }));
    expect(screen.getByText(/Regarde la première lettre de cette phrase/)).toBeInTheDocument();
    expect(screen.queryByText(/Mon chat dort/)).not.toBeInTheDocument();
  });

  test('chaque signal montre l’endroit du texte concerné, sans la forme corrigée', async () => {
    await jusqueRelire('il pleut. elle rit.');
    await userEvent.click(screen.getByRole('button', { name: /passer à la correction/i }));
    const extraits = Array.from(document.querySelectorAll('q')).map((q) => q.textContent ?? '');
    expect(extraits).toHaveLength(2);
    expect(extraits[0]).toContain('il pleut');
    expect(extraits[1]).toContain('elle rit');
    expect(extraits.join(' ')).not.toMatch(/Il pleut|Elle rit/);
  });

  test('sans synthèse vocale : le bouton Écouter est absent et une phrase l’explique (Review Focus 3)', async () => {
    await jusqueRelire('Un chat.', activite({ aides: [{ id: 'audio-relecture', active: true }] }));
    expect(screen.queryByRole('button', { name: /écouter mon texte/i })).not.toBeInTheDocument();
    expect(screen.getByText(/ne peut pas lire à voix haute/i)).toBeInTheDocument();
  });

  test('réécrire ouvre une nouvelle version', async () => {
    const api = apiDeTest();
    render(<EcranEleve activite={activite()} eleveId="el1" jeton="j" api={api} delaiSauvegardeMs={0} />);
    await versEcriture();
    await userEvent.type(screen.getByLabelText(/mon texte/i), 'Un chat.');
    await userEvent.click(screen.getByRole('button', { name: /fini d.écrire/i }));
    await userEvent.click(screen.getByRole('button', { name: /passer à la correction/i }));
    await userEvent.click(screen.getByRole('button', { name: /nouvelle version/i }));
    await userEvent.type(screen.getByLabelText(/mon texte/i), ' Il dort.');
    await waitFor(() => {
      const appels = (api.sauver as ReturnType<typeof vi.fn>).mock.calls.map((c) => c[0].version);
      expect(appels).toContain(2);
    });
  });
});

describe('EcranEleve : aides', () => {
  test('une aide retirée en cours d’écriture est signalée avec sa raison, sans perdre le texte (Review Focus 5)', async () => {
    const api = apiDeTest({ version: 1, aides: [{ id: 'dictee-vocale', active: false, raison: 'Pas de clavier ce jour.' }] });
    render(<EcranEleve activite={activite({ aides: [{ id: 'dictee-vocale', active: true }] })} eleveId="el1" jeton="j" api={api} delaiSauvegardeMs={0} />);
    await versEcriture();
    await userEvent.type(screen.getByLabelText(/mon texte/i), 'Un chat');
    expect(await screen.findByText(/Pas de clavier ce jour/)).toBeInTheDocument();
    expect(screen.getByLabelText(/mon texte/i)).toHaveValue('Un chat');
  });

  test('une aide retirée par l’enseignant ne peut pas être activée par l’élève', async () => {
    render(
      <EcranEleve
        activite={activite({ aidesRetirees: [{ id: 'dictee-vocale', raison: 'On vérifie le geste d’écrire.' }] })}
        eleveId="el1"
        jeton="j"
        api={apiDeTest()}
        delaiSauvegardeMs={0}
      />,
    );
    await versEcriture();
    expect(screen.getByLabelText(/écrire est lent ou fatigant/i)).toBeInTheDocument();
    await userEvent.click(screen.getByLabelText(/écrire est lent ou fatigant/i));
    expect(screen.getByText(/On vérifie le geste d’écrire/)).toBeInTheDocument();
  });

  test('une aide que l’élève s’est donnée elle-même est coupée quand l’enseignant la retire en cours de route', async () => {
    const api = apiDeTest({ version: 1, aides: [], aidesRetirees: [{ id: 'dictee-vocale', raison: 'Retiré pendant l’activité.' }] });
    render(<EcranEleve activite={activite()} eleveId="el1" jeton="j" api={api} delaiSauvegardeMs={0} />);
    await versEcriture();
    await userEvent.click(screen.getByLabelText(/écrire est lent ou fatigant/i));
    await userEvent.type(screen.getByLabelText(/mon texte/i), 'Un');
    expect(await screen.findByText(/Retiré pendant l’activité/)).toBeInTheDocument();
    expect(screen.queryByText(/Aide active : dire mon texte à voix haute/)).not.toBeInTheDocument();
    expect(screen.getByLabelText(/mon texte/i)).toHaveValue('Un');
  });

  test('activer une aide l’enregistre comme trace pour le tableau de bord', async () => {
    const api = apiDeTest();
    render(<EcranEleve activite={activite()} eleveId="el1" jeton="j" api={api} delaiSauvegardeMs={0} />);
    await versEcriture();
    await userEvent.click(screen.getByLabelText(/les sons et les lettres se mélangent/i));
    await userEvent.type(screen.getByLabelText(/mon texte/i), 'Un');
    await waitFor(() => {
      const tous = (api.sauver as ReturnType<typeof vi.fn>).mock.calls.flatMap((c) => c[0].evenements as string[]);
      expect(tous).toContain('aide:colorisation');
    });
  });

  test('pictogrammes actifs : l’attribution ARASAAC est affichée', () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, json: async () => [] }) as Response));
    render(<EcranEleve activite={activite({ aides: [{ id: 'pictogrammes', active: true }] })} eleveId="el1" jeton="j" api={apiDeTest()} delaiSauvegardeMs={0} />);
    expect(screen.getByText(/Sergio Palao/)).toBeInTheDocument();
    vi.unstubAllGlobals();
  });
});

describe('EcranEleve : atelier de raisonnement grammatical (voie A)', () => {
  const TEXTE = 'Les élèves prépare leur sortie.';
  async function auTempsCorriger(surcharge: Partial<ActiviteEleve>) {
    const api = apiDeTest();
    render(<EcranEleve activite={activite({ contraintes: {}, categories: [], principeIds: [], ...surcharge })} eleveId="el1" jeton="j" api={api} delaiSauvegardeMs={0} />);
    await versEcriture();
    await userEvent.type(screen.getByLabelText(/mon texte/i), TEXTE);
    await userEvent.click(screen.getByRole('button', { name: /fini d.écrire/i }));
    await userEvent.click(screen.getByRole('button', { name: /passer à la correction/i }));
    return api;
  }
  const evenements = (api: ApiEleve) => (api.sauver as ReturnType<typeof vi.fn>).mock.calls.flatMap((c) => c[0].evenements as string[]);

  test('P4 avec atelier activé : le bouton « Raisonner sur une phrase » apparaît au temps Corriger', async () => {
    await auTempsCorriger({ annee: 'P4', atelier: true });
    expect(screen.getByRole('button', { name: /raisonner sur une phrase/i })).toBeInTheDocument();
  });

  test('atelier non activé par l’enseignant : pas de bouton', async () => {
    await auTempsCorriger({ annee: 'P4', atelier: false });
    expect(screen.queryByRole('button', { name: /raisonner sur une phrase/i })).not.toBeInTheDocument();
  });

  test('année qui n’a pas l’atelier (P2) : pas de bouton, même si la case est cochée', async () => {
    await auTempsCorriger({ annee: 'P2', atelier: true });
    expect(screen.queryByRole('button', { name: /raisonner sur une phrase/i })).not.toBeInTheDocument();
  });

  test('le bouton ouvre l’atelier sur le texte de l’élève ; « Quitter l’atelier » le referme', async () => {
    await auTempsCorriger({ annee: 'P4', atelier: true });
    await userEvent.click(screen.getByRole('button', { name: /raisonner sur une phrase/i }));
    expect(screen.getByRole('button', { name: /Phrase 1/ })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /quitter l’atelier/i }));
    expect(screen.queryByRole('button', { name: /Phrase 1/ })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /raisonner sur une phrase/i })).toBeInTheDocument();
  });

  test('« Modifier mon texte » ferme l’atelier et laisse le texte modifiable', async () => {
    await auTempsCorriger({ annee: 'P4', atelier: true });
    await userEvent.click(screen.getByRole('button', { name: /raisonner sur une phrase/i }));
    await userEvent.click(screen.getByRole('button', { name: /Phrase 1/ }));
    await userEvent.click(screen.getByRole('button', { name: 'Le verbe et son sujet' }));
    await userEvent.click(screen.getByRole('button', { name: 'prépare' }));
    await userEvent.click(screen.getByRole('button', { name: /étape suivante/i }));
    await userEvent.click(screen.getByRole('button', { name: 'élèves' }));
    await userEvent.click(screen.getByRole('radio', { name: 'ils' }));
    for (let i = 0; i < 3; i++) await userEvent.click(screen.getByRole('button', { name: /étape suivante/i }));
    await userEvent.click(screen.getByRole('button', { name: /modifier mon texte/i }));
    expect(screen.queryByRole('heading', { name: /Raisonner sur une phrase/ })).not.toBeInTheDocument();
    expect(screen.getByLabelText(/mon texte/i)).toBeEnabled();
  });

  test('la trace de l’atelier arrive au serveur avec le texte', async () => {
    const api = await auTempsCorriger({ annee: 'P4', atelier: true });
    await userEvent.click(screen.getByRole('button', { name: /raisonner sur une phrase/i }));
    await userEvent.click(screen.getByRole('button', { name: /Phrase 1/ }));
    await userEvent.click(screen.getByRole('button', { name: 'Le verbe et son sujet' }));
    await userEvent.click(screen.getByRole('button', { name: 'prépare' }));
    await userEvent.click(screen.getByRole('button', { name: /étape suivante/i }));
    await userEvent.click(screen.getByRole('button', { name: 'élèves' }));
    await userEvent.click(screen.getByRole('radio', { name: 'ils' }));
    for (let i = 0; i < 3; i++) await userEvent.click(screen.getByRole('button', { name: /étape suivante/i }));
    await userEvent.click(screen.getByRole('button', { name: /je ne suis pas sûr/i }));
    await userEvent.click(screen.getByRole('button', { name: /garder la phrase/i }));
    await userEvent.type(screen.getByLabelText(/mon texte/i), ' ');
    await waitFor(() => {
      const ev = evenements(api);
      expect(ev).toContain('atelier:phrase:1');
      expect(ev).toContain('atelier:pas-sur');
      expect(ev).toContain('atelier:decision:garder');
      expect(ev.some((e) => e.startsWith('atelier:justification:'))).toBe(true);
    });
  });

  test('la formulation de l’enseignant et l’option Grammaire 3D arrivent à l’atelier', async () => {
    await auTempsCorriger({ annee: 'P5', atelier: true, grammaire3d: true, atelierPerso: { 'verbe-sujet': { verbe: ['Mettre la phrase à l’imparfait.'] } } });
    await userEvent.click(screen.getByRole('button', { name: /raisonner sur une phrase/i }));
    await userEvent.click(screen.getByRole('button', { name: /Phrase 1/ }));
    await userEvent.click(screen.getByRole('button', { name: 'Le verbe et son sujet' }));
    expect(screen.getByText('Mettre la phrase à l’imparfait.')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /changer de démarche/i }));
    await userEvent.click(screen.getByRole('button', { name: /La fonction d’un groupe/ }));
    await userEvent.click(screen.getByRole('button', { name: 'prépare' }));
    await userEvent.click(screen.getByRole('button', { name: /étape suivante/i }));
    await userEvent.click(screen.getByRole('button', { name: /étape suivante/i }));
    expect(screen.getByRole('radio', { name: 'complément de phrase' })).toBeInTheDocument();
  });

  test('texte rendu : plus de bouton d’atelier', async () => {
    render(<EcranEleve activite={activite({ annee: 'P4', atelier: true, reprise: { texte: TEXTE, version: 1, phase: 'rendu' } })} eleveId="el1" jeton="j" api={apiDeTest()} delaiSauvegardeMs={0} />);
    expect(screen.queryByRole('button', { name: /raisonner sur une phrase/i })).not.toBeInTheDocument();
  });
});

describe('EcranEleve : chasse aux erreurs (voie B)', () => {
  const CHASSE = { texte: 'Les élèves prépare leur sortie.', nbErreurs: 1 };
  async function auTempsCorriger(surcharge: Partial<ActiviteEleve>, api = apiDeTest()) {
    render(<EcranEleve activite={activite({ contraintes: {}, categories: [], principeIds: [], ...surcharge })} eleveId="el1" jeton="j" api={api} delaiSauvegardeMs={0} />);
    await versEcriture();
    await userEvent.type(screen.getByLabelText(/mon texte/i), 'Mon chat dort.');
    await userEvent.click(screen.getByRole('button', { name: /fini d.écrire/i }));
    await userEvent.click(screen.getByRole('button', { name: /passer à la correction/i }));
    return api;
  }

  test('P4 avec une chasse : le bouton « Chasse aux erreurs » apparaît au temps Corriger', async () => {
    await auTempsCorriger({ annee: 'P4', chasse: CHASSE });
    expect(screen.getByRole('button', { name: /^chasse aux erreurs$/i })).toBeInTheDocument();
  });

  test.each([
    ['sans chasse', { annee: 'P4' as const, chasse: null }],
    ['en P2, même avec une chasse', { annee: 'P2' as const, chasse: CHASSE }],
  ])('pas de bouton : %s', async (_n, surcharge) => {
    await auTempsCorriger(surcharge);
    expect(screen.queryByRole('button', { name: /^chasse aux erreurs$/i })).not.toBeInTheDocument();
  });

  test('un essai part au serveur avec le jeton, l’activité, le numéro du mot et la forme', async () => {
    const api = apiDeTest();
    (api.chasse as ReturnType<typeof vi.fn>).mockResolvedValue({ resultat: 'trouve', erreurId: 0 });
    await auTempsCorriger({ annee: 'P4', chasse: CHASSE }, api);
    await userEvent.click(screen.getByRole('button', { name: /^chasse aux erreurs$/i }));
    await userEvent.click(screen.getByRole('button', { name: 'prépare' }));
    await userEvent.type(screen.getByLabelText(/forme corrigée/i), 'préparent');
    await userEvent.click(screen.getByRole('button', { name: /vérifier/i }));
    expect(api.chasse).toHaveBeenCalledWith({ jeton: 'j', activiteId: 'act1', motIndex: 2, forme: 'préparent', justification: '' });
    expect(await screen.findByText('Tu as trouvé une erreur.')).toBeInTheDocument();
  });

  test('on peut refermer la chasse', async () => {
    await auTempsCorriger({ annee: 'P4', chasse: CHASSE });
    await userEvent.click(screen.getByRole('button', { name: /^chasse aux erreurs$/i }));
    await userEvent.click(screen.getByRole('button', { name: /fermer la chasse/i }));
    expect(screen.getByRole('button', { name: /^chasse aux erreurs$/i })).toBeInTheDocument();
  });

  test('texte rendu : plus de chasse', () => {
    render(<EcranEleve activite={activite({ annee: 'P4', chasse: CHASSE, reprise: { texte: 'Fini.', version: 1, phase: 'rendu' } })} eleveId="el1" jeton="j" api={apiDeTest()} delaiSauvegardeMs={0} />);
    expect(screen.queryByRole('button', { name: /^chasse aux erreurs$/i })).not.toBeInTheDocument();
  });
});

describe('EcranEleve : contrainte d’écriture (jeu de lettre)', () => {
  async function jusquAuTemps(texte: string, temps: 'relire' | 'corriger', a = activite(), api = apiDeTest()) {
    render(<EcranEleve activite={a} eleveId="el1" jeton="j" api={api} delaiSauvegardeMs={0} />);
    await versEcriture();
    await userEvent.type(screen.getByLabelText(/mon texte/i), texte);
    await userEvent.click(screen.getByRole('button', { name: /fini d.écrire/i }));
    if (temps === 'corriger') await userEvent.click(screen.getByRole('button', { name: /passer à la correction/i }));
    return api;
  }

  test('à la relecture, la question cite les mots à changer', async () => {
    await jusquAuTemps('Maman mange des pommes.', 'relire', activite({ contraintes: { initiale: 'm' }, principeIds: [], categories: [] }));
    expect(screen.getByText(/commencent par M/)).toBeInTheDocument();
    expect(screen.getByText(/« des », « pommes »/)).toBeInTheDocument();
  });

  test('à la correction, les mots fautifs sont surlignés, sans mot de remplacement', async () => {
    await jusquAuTemps('Le renard dort.', 'corriger', activite({ contraintes: { lettreInterdite: 'r' }, principeIds: [], categories: [] }));
    const marques = Array.from(document.querySelectorAll('mark')).map((m) => m.textContent);
    expect(marques).toEqual(['renard', 'dort']);
  });

  test('contrainte respectée : aucune alerte de lettre', async () => {
    await jusquAuTemps('Le chat mange.', 'corriger', activite({ contraintes: { lettreInterdite: 'r' }, principeIds: [], categories: [] }));
    expect(document.querySelectorAll('mark')).toHaveLength(0);
  });
});

describe('EcranEleve : réglages de colorisation de l’enseignant', () => {
  const aides = [{ id: 'colorisation' as const, active: true }];
  async function relire(colorisation: unknown) {
    render(<EcranEleve activite={activite({ aides, colorisation } as Partial<ActiviteEleve>)} eleveId="el1" jeton="j" api={apiDeTest({ version: 1, aides })} delaiSauvegardeMs={0} />);
    await versEcriture();
    await userEvent.type(screen.getByLabelText(/mon texte/i), 'Un chat.');
    await userEvent.click(screen.getByRole('button', { name: /fini d.écrire/i }));
  }

  test('le mode choisi par l’enseignant est celui du départ', async () => {
    await relire({ defaut: 'bpdq', permis: ['bpdq', 'syllabes'] });
    expect(screen.getByLabelText(/colorer/i)).toHaveValue('bpdq');
  });

  test('seuls les modes permis sont proposés', async () => {
    await relire({ defaut: 'bpdq', permis: ['bpdq', 'syllabes'] });
    const options = within(screen.getByLabelText(/colorer/i)).getAllByRole('option').map((o) => o.textContent);
    expect(options).toEqual(['Les syllabes', 'b, p, d, q']);
  });

  test('un seul mode permis : pas de menu, le mode est dit', async () => {
    await relire({ defaut: 'syllabes', permis: ['syllabes'] });
    expect(screen.queryByLabelText(/colorer/i)).not.toBeInTheDocument();
    expect(screen.getByText(/les syllabes d’un mot ont des couleurs qui alternent/i)).toBeInTheDocument();
  });

  test('une phrase dit ce que montrent les couleurs du mode affiché', async () => {
    await relire({ defaut: 'voyelles-consonnes', permis: ['voyelles-consonnes', 'syllabes'] });
    expect(screen.getByText(/les voyelles ont une couleur, les consonnes une autre/i)).toBeInTheDocument();
  });

  test('sans réglage : comportement habituel (syllabes au départ, quatre modes)', async () => {
    await relire(null);
    expect(screen.getByLabelText(/colorer/i)).toHaveValue('syllabes');
    expect(within(screen.getByLabelText(/colorer/i)).getAllByRole('option')).toHaveLength(4);
  });
});

describe('EcranEleve : vue colorée à « Corriger » (lecture seule)', () => {
  const aides = [{ id: 'colorisation' as const, active: true }];
  async function corriger(a = aides) {
    render(<EcranEleve activite={activite({ aides: a, categories: [] })} eleveId="el1" jeton="j" api={apiDeTest({ version: 1, aides: a })} delaiSauvegardeMs={0} />);
    await versEcriture();
    await userEvent.type(screen.getByLabelText(/mon texte/i), 'Un chat qui dort sur le canapé.');
    await userEvent.click(screen.getByRole('button', { name: /fini d.écrire/i }));
    await userEvent.click(screen.getByRole('button', { name: /passer à la correction/i }));
  }

  test('avec la colorisation : le texte apparaît aussi en couleurs, sans champ de saisie en plus', async () => {
    await corriger();
    const vue = screen.getByRole('group', { name: /ton texte en couleurs/i });
    expect(vue).toHaveTextContent('Un chat qui dort sur le canapé.');
    expect(within(vue).queryByRole('textbox')).not.toBeInTheDocument();
    expect(screen.getAllByRole('textbox', { name: /mon texte/i })).toHaveLength(1);
  });

  test('le choix du mode est disponible à la correction et la phrase explique les couleurs', async () => {
    await corriger();
    expect(screen.getByLabelText(/colorer/i)).toHaveValue('syllabes');
    expect(screen.getByText(/syllabes d’un mot ont des couleurs/i)).toBeInTheDocument();
  });

  test('la vue colorée suit le texte quand l’élève corrige', async () => {
    await corriger();
    await userEvent.type(screen.getByRole('textbox', { name: /mon texte/i }), ' Bien.');
    expect(screen.getByRole('group', { name: /ton texte en couleurs/i })).toHaveTextContent('canapé. Bien.');
  });

  test('sans colorisation : aucune vue colorée', async () => {
    await corriger([]);
    expect(screen.queryByRole('group', { name: /ton texte en couleurs/i })).not.toBeInTheDocument();
  });
});

describe('EcranEleve : recopier la dernière version à la main (option de l’enseignant)', () => {
  async function rendre(contraintes: object) {
    render(<EcranEleve activite={activite({ contraintes, categories: [], principeIds: [] })} eleveId="el1" jeton="j" api={apiDeTest()} delaiSauvegardeMs={0} />);
    await versEcriture();
    await userEvent.type(screen.getByLabelText(/mon texte/i), 'Un chat roux dort.');
    await userEvent.click(screen.getByRole('button', { name: /fini d.écrire/i }));
    await userEvent.click(screen.getByRole('button', { name: /passer à la correction/i }));
    await userEvent.click(screen.getByRole('button', { name: /rendre mon texte/i }));
  }

  test('option cochée : deux consignes à l’infinitif, une action par puce, après le rendu', async () => {
    await rendre({ recopier: true });
    const bloc = screen.getByRole('group', { name: /sur une feuille/i });
    const puces = within(bloc).getAllByRole('listitem').map((l) => l.textContent);
    expect(puces).toEqual(['Prendre une feuille et un stylo.', 'Recopier la version finale à la main.']);
  });

  test('option non cochée : rien de tel', async () => {
    await rendre({});
    expect(screen.queryByRole('group', { name: /sur une feuille/i })).not.toBeInTheDocument();
  });

  test('option cochée mais texte pas encore rendu : rien', async () => {
    render(<EcranEleve activite={activite({ contraintes: { recopier: true }, categories: [] })} eleveId="el1" jeton="j" api={apiDeTest()} delaiSauvegardeMs={0} />);
    await versEcriture();
    expect(screen.queryByRole('group', { name: /sur une feuille/i })).not.toBeInTheDocument();
  });
});

describe('EcranEleve : ce que l’application regarde, mots absents de la liste, mots douteux', () => {
  async function versRelecture(a: ActiviteEleve, api = apiDeTest()) {
    render(<EcranEleve activite={a} eleveId="el1" jeton="j" api={api} delaiSauvegardeMs={0} />);
    await userEvent.click(screen.getByRole('button', { name: /J’ai fini d’écrire/i }));
    return api;
  }

  test('sans signal, l’écran dit ce qui est regardé et que ce n’est pas une garantie', async () => {
    await versRelecture(activite({ annee: 'P1', categories: ['point_fin_phrase'], reprise: { texte: 'Le chat dort.', version: 1, phase: 'ecrire' } }));
    const bloc = screen.getByTestId('limites-app');
    expect(within(bloc).getByText('Aucun signal sur :')).toBeInTheDocument();
    expect(within(bloc).getByText('le point à la fin du texte')).toBeInTheDocument();
    expect(bloc).toHaveTextContent('Aucun signal ne veut pas dire que ton texte est sans erreur');
    expect(document.body.textContent).not.toMatch(/Rien à signaler/);
  });

  test('mot absent de la liste : signalé avec le message neutre, sans correction', async () => {
    vi.mocked(chargerDictionnaire).mockResolvedValue((m: string) => m !== 'pomes');
    await versRelecture(activite({ annee: 'P1', categories: ['mot_inconnu'], reprise: { texte: 'Le chat mange des pomes.', version: 1, phase: 'ecrire' } }));
    await waitFor(() => expect(screen.getByText(/n’est pas dans la liste de mots/)).toBeInTheDocument());
    expect(screen.getByTestId('limites-app')).toHaveTextContent('L’application regarde seulement :les mots absents de la liste de mots');
    expect(document.body.textContent).not.toMatch(/pommes/);
  });

  test('liste de mots impossible à charger : l’élève est prévenu, rien n’est annoncé comme regardé', async () => {
    vi.mocked(chargerDictionnaire).mockRejectedValue(new Error('x'));
    await versRelecture(activite({ annee: 'P1', categories: ['mot_inconnu'], reprise: { texte: 'Le chat mange des pomes.', version: 1, phase: 'ecrire' } }));
    await waitFor(() => expect(screen.getByText(/n’a pas pu être chargée : les mots ne sont pas vérifiés/)).toBeInTheDocument());
    expect(screen.getByTestId('limites-app')).toHaveTextContent('Ici, l’application ne vérifie rien dans ton texte.');
  });

  test('marquer un mot douteux envoie la trace « doute:mot » au serveur', async () => {
    const api = await versRelecture(activite({ annee: 'P1', categories: [], reprise: { texte: 'Le chat mange des pomes.', version: 1, phase: 'ecrire' } }));
    await userEvent.click(screen.getByRole('button', { name: /Marquer un mot dont je doute/ }));
    await userEvent.click(screen.getByRole('button', { name: 'pomes' }));
    await waitFor(() => {
      const evenements = (api.sauver as ReturnType<typeof vi.fn>).mock.calls.flatMap((c) => c[0].evenements);
      expect(evenements).toContain('doute:pomes');
    });
  });

  test('mot accepté par l’enseignant : plus signalé, et annoncé à l’élève', async () => {
    vi.mocked(chargerDictionnaire).mockResolvedValue((m: string) => !['pomes', 'trémie'].includes(m.toLowerCase()));
    await versRelecture(
      activite({ annee: 'P1', categories: ['mot_inconnu'], contraintes: { motsAcceptes: ['trémie'] }, reprise: { texte: 'La trémie mange des pomes.', version: 1, phase: 'ecrire' } }),
    );
    await waitFor(() => expect(screen.getByText(/n’est pas dans la liste de mots/)).toBeInTheDocument());
    const marques = Array.from(document.querySelectorAll('mark')).map((m) => m.textContent);
    expect(marques).toEqual(['pomes']);
    expect(screen.getByTestId('limites-app')).toHaveTextContent('Mots ajoutés par ton enseignant, jamais signalés : trémie.');
  });

  test('mots acceptés de la classe : plus signalés, annoncés à l’élève', async () => {
    vi.mocked(chargerDictionnaire).mockResolvedValue((m: string) => !['pomes', 'cointe'].includes(m.toLowerCase()));
    await versRelecture(activite({ annee: 'P1', categories: ['mot_inconnu'], motsClasse: ['Cointe'], reprise: { texte: 'Je vais à Cointe avec des pomes.', version: 1, phase: 'ecrire' } }));
    await waitFor(() => expect(screen.getByText(/n’est pas dans la liste de mots/)).toBeInTheDocument());
    expect(Array.from(document.querySelectorAll('mark')).map((m) => m.textContent)).toEqual(['pomes']);
    expect(screen.getByTestId('limites-app')).toHaveTextContent('Mots ajoutés par ton enseignant, jamais signalés : Cointe.');
  });
});
