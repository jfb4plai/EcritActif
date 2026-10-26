import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import EcranEleve, { type ApiEleve } from './EcranEleve';
import type { ActiviteEleve } from '../../api/_lib/eleve';

function activite(surcharge: Partial<ActiviteEleve> = {}): ActiviteEleve {
  return {
    id: 'act1',
    consigne: 'Écrire trois phrases sur mon animal.',
    contraintes: { minMots: 5 },
    itemIds: [],
    principeIds: ['refl-intention', 'rel-intention'],
    categories: ['majuscule_debut_phrase'],
    aides: [],
    aidesRetirees: [],
    banqueMots: [],
    principesPerso: [],
    ...surcharge,
  };
}

function apiDeTest(reponse: Awaited<ReturnType<ApiEleve['sauver']>> = { version: 1, aides: [] }) {
  const api: ApiEleve = { sauver: vi.fn(async () => reponse) };
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
    render(<EcranEleve activite={activite()} eleveId="el1" jeton="j" api={{ sauver }} delaiSauvegardeMs={0} reessaiMs={20} />);
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
    const api: ApiEleve = { sauver: vi.fn(async () => Promise.reject(new Error('réseau'))) };
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
