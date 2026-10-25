import { render, screen, waitFor } from '@testing-library/react';
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
    ...surcharge,
  };
}

function apiDeTest(reponse: Awaited<ReturnType<ApiEleve['sauver']>> = { version: 1, aides: [] }) {
  const api: ApiEleve = { sauver: vi.fn(async () => reponse) };
  return api;
}

beforeEach(() => localStorage.clear());
afterEach(() => vi.restoreAllMocks());

async function versEcriture() {
  await userEvent.click(screen.getByRole('button', { name: /commencer à écrire/i }));
}

describe('EcranEleve : réfléchir', () => {
  test('affiche la consigne et les questions de la phase réfléchir', () => {
    render(<EcranEleve activite={activite()} jeton="j" api={apiDeTest()} delaiSauvegardeMs={0} />);
    expect(screen.getByText(/Écrire trois phrases sur mon animal/)).toBeInTheDocument();
    expect(screen.getByText(/Que veux-tu dire dans ce texte/)).toBeInTheDocument();
  });
});

describe('EcranEleve : écrire', () => {
  test('aucune correction n’apparaît pendant l’écriture', async () => {
    render(<EcranEleve activite={activite()} jeton="j" api={apiDeTest()} delaiSauvegardeMs={0} />);
    await versEcriture();
    await userEvent.type(screen.getByLabelText(/mon texte/i), 'mon chat dort');
    expect(screen.queryByText(/Regarde la première lettre/)).not.toBeInTheDocument();
  });

  test('un texte enregistré sur l’appareil revient après fermeture de l’onglet (Review Focus 1)', () => {
    localStorage.setItem('ecrit:act1', 'Mon chat dort.');
    render(<EcranEleve activite={activite()} jeton="j" api={apiDeTest()} delaiSauvegardeMs={0} />);
    expect(screen.getByLabelText(/mon texte/i)).toHaveValue('Mon chat dort.');
  });

  test('la sauvegarde sur le serveur est appelée avec le texte, la phase et la version', async () => {
    const api = apiDeTest();
    render(<EcranEleve activite={activite()} jeton="jeton-x" api={api} delaiSauvegardeMs={0} />);
    await versEcriture();
    await userEvent.type(screen.getByLabelText(/mon texte/i), 'Un chat');
    await waitFor(() => {
      const dernier = (api.sauver as ReturnType<typeof vi.fn>).mock.calls.at(-1)?.[0];
      expect(dernier).toMatchObject({ jeton: 'jeton-x', activiteId: 'act1', texte: 'Un chat', phase: 'ecrire', version: 1 });
    });
  });

  test('si le serveur est injoignable, le texte reste et un message le dit', async () => {
    const api: ApiEleve = { sauver: vi.fn(async () => Promise.reject(new Error('réseau'))) };
    render(<EcranEleve activite={activite()} jeton="j" api={api} delaiSauvegardeMs={0} />);
    await versEcriture();
    await userEvent.type(screen.getByLabelText(/mon texte/i), 'Un chat');
    expect(await screen.findByText(/seulement sur cet appareil/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/mon texte/i)).toHaveValue('Un chat');
  });
});

describe('EcranEleve : relire et corriger', () => {
  async function jusqueRelire(texte: string, a = activite()) {
    render(<EcranEleve activite={a} jeton="j" api={apiDeTest({ version: 1, aides: a.aides })} delaiSauvegardeMs={0} />);
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

  test('sans synthèse vocale : le bouton Écouter est absent et une phrase l’explique (Review Focus 3)', async () => {
    await jusqueRelire('Un chat.', activite({ aides: [{ id: 'audio-relecture', active: true }] }));
    expect(screen.queryByRole('button', { name: /écouter mon texte/i })).not.toBeInTheDocument();
    expect(screen.getByText(/ne peut pas lire à voix haute/i)).toBeInTheDocument();
  });

  test('réécrire ouvre une nouvelle version', async () => {
    const api = apiDeTest();
    render(<EcranEleve activite={activite()} jeton="j" api={api} delaiSauvegardeMs={0} />);
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
    const api = apiDeTest({ version: 1, aides: [{ id: 'clavier', active: false, raison: 'Pas de clavier ce jour.' }] });
    render(<EcranEleve activite={activite({ aides: [{ id: 'clavier', active: true }] })} jeton="j" api={api} delaiSauvegardeMs={0} />);
    await versEcriture();
    await userEvent.type(screen.getByLabelText(/mon texte/i), 'Un chat');
    expect(await screen.findByText(/Pas de clavier ce jour/)).toBeInTheDocument();
    expect(screen.getByLabelText(/mon texte/i)).toHaveValue('Un chat');
  });

  test('une aide retirée par l’enseignant ne peut pas être activée par l’élève', async () => {
    render(
      <EcranEleve
        activite={activite({ aidesRetirees: [{ id: 'clavier', raison: 'On vérifie le geste d’écrire.' }] })}
        jeton="j"
        api={apiDeTest()}
        delaiSauvegardeMs={0}
      />,
    );
    await versEcriture();
    expect(screen.getByLabelText(/écrire à la main est lent ou fatigant/i)).toBeInTheDocument();
    await userEvent.click(screen.getByLabelText(/écrire à la main est lent ou fatigant/i));
    expect(screen.getByText(/On vérifie le geste d’écrire/)).toBeInTheDocument();
  });

  test('pictogrammes actifs : l’attribution ARASAAC est affichée', () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, json: async () => [] }) as Response));
    render(<EcranEleve activite={activite({ aides: [{ id: 'pictogrammes', active: true }] })} jeton="j" api={apiDeTest()} delaiSauvegardeMs={0} />);
    expect(screen.getByText(/Sergio Palao/)).toBeInTheDocument();
    vi.unstubAllGlobals();
  });
});
