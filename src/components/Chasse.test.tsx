import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import Chasse from './Chasse';
import type { Verdict } from '../lib/chasse';

const TEXTE = 'Les élèves prépare leur sortie. Ils emporte un pique-nique.';

function monter(verdicts: (Verdict | Error)[], surcharge: Partial<React.ComponentProps<typeof Chasse>> = {}) {
  const file = [...verdicts];
  const essayer = vi.fn(async () => {
    const v = file.shift();
    if (v instanceof Error) throw v;
    return v as Verdict;
  });
  render(<Chasse cle="test-chasse" texte={TEXTE} nbErreurs={2} essayer={essayer} {...surcharge} />);
  return { essayer };
}

async function essai(mot: string, forme: string, justification = '') {
  await userEvent.click(screen.getByRole('button', { name: new RegExp('^' + mot) }));
  const champ = screen.getByLabelText(/forme corrigée/i);
  await userEvent.clear(champ);
  await userEvent.type(champ, forme);
  if (justification) await userEvent.type(screen.getByLabelText(/justification/i), justification);
  await userEvent.click(screen.getByRole('button', { name: /vérifier/i }));
}

beforeEach(() => localStorage.clear());

describe('Chasse : lecture et consignes', () => {
  test('le texte est lisible mot à mot et les consignes sont à l’infinitif', () => {
    monter([]);
    expect(screen.getByRole('heading', { name: /chasse aux erreurs/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'prépare' })).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByText(/Cliquer sur un mot qui ne va pas/)).toBeInTheDocument();
    expect(screen.getByText('Il y a 2 erreurs dans le texte.')).toBeInTheDocument();
  });

  test('« Vérifier » n’apparaît qu’après avoir cliqué sur un mot, et reste bloqué sans forme corrigée', async () => {
    monter([]);
    expect(screen.queryByRole('button', { name: /vérifier/i })).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'prépare' }));
    expect(screen.getByRole('button', { name: /vérifier/i })).toBeDisabled();
    await userEvent.type(screen.getByLabelText(/forme corrigée/i), 'préparent');
    expect(screen.getByRole('button', { name: /vérifier/i })).toBeEnabled();
  });
});

describe('Chasse : réponses qualitatives', () => {
  test('trouvé : message simple, nombre d’erreurs restantes, mot marqué trouvé', async () => {
    const { essayer } = monter([{ resultat: 'trouve', erreurId: 0 }]);
    await essai('prépare', 'préparent', 'Le sujet est élèves.');
    expect(essayer).toHaveBeenCalledWith({ motIndex: 2, forme: 'préparent', justification: 'Le sujet est élèves.' });
    expect(screen.getByRole('status')).toHaveTextContent('Tu as trouvé une erreur.');
    expect(screen.getByText('Il reste 1 erreur dans le texte.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /prépare.*trouvé/ })).toBeDisabled();
  });

  test('indice : l’indice s’affiche, la forme proposée n’est pas jugée', async () => {
    monter([{ resultat: 'indice', erreurId: 0, indice: 'Cherche le sujet de ce verbe.' }]);
    await essai('prépare', 'prépares');
    expect(screen.getByRole('status')).toHaveTextContent('Cherche le sujet de ce verbe.');
    expect(screen.getByText('Il y a 2 erreurs dans le texte.')).toBeInTheDocument();
  });

  test('mot qui n’est pas à corriger : message neutre, sans dire où chercher', async () => {
    monter([{ resultat: 'pas-erreur' }]);
    await essai('sortie', 'sorties');
    expect(screen.getByRole('status')).toHaveTextContent('Ce n’est pas un des mots à corriger. Cherche encore.');
  });

  test('après trois indices sur la même erreur : demander de l’aide, sans révéler le mot', async () => {
    const indice: Verdict = { resultat: 'indice', erreurId: 0, indice: 'Cherche le sujet.' };
    monter([indice, indice, indice]);
    await essai('prépare', 'a');
    await essai('prépare', 'b');
    expect(screen.getByRole('status')).not.toHaveTextContent(/aide/i);
    await essai('prépare', 'c');
    expect(screen.getByRole('status')).toHaveTextContent('Demande de l’aide à ton enseignant.');
  });

  test('toutes les erreurs trouvées : félicitation sobre, jamais de score', async () => {
    monter([
      { resultat: 'trouve', erreurId: 0 },
      { resultat: 'trouve', erreurId: 1 },
    ]);
    await essai('prépare', 'préparent');
    await essai('emporte', 'emportent');
    expect(screen.getByText('Tu as trouvé toutes les erreurs.')).toBeInTheDocument();
    expect(document.body.textContent).not.toMatch(/\d+\s*%|\/\s*\d+|points?\b|score|note\b/i);
  });

  test('aucun message ne juge : ni « faux », ni « raté », ni « mauvais »', async () => {
    monter([{ resultat: 'indice', erreurId: 0, indice: 'Regarde la fin du verbe.' }, { resultat: 'pas-erreur' }]);
    await essai('prépare', 'x');
    await essai('sortie', 'y');
    expect(document.body.textContent).not.toMatch(/\b(faux|raté|mauvais|bravo)\b/i);
  });

  test('serveur injoignable : message simple, l’essai reste possible', async () => {
    monter([new Error('Le serveur ne répond pas. Réessaie dans un moment.'), { resultat: 'trouve', erreurId: 0 }]);
    await essai('prépare', 'préparent');
    expect(screen.getByRole('alert')).toHaveTextContent('Le serveur ne répond pas');
    await userEvent.click(screen.getByRole('button', { name: /vérifier/i }));
    expect(screen.getByRole('status')).toHaveTextContent('Tu as trouvé une erreur.');
  });
});

describe('Chasse : reprise', () => {
  test('les erreurs trouvées restent trouvées après un rechargement de la page', async () => {
    const { essayer } = monter([{ resultat: 'trouve', erreurId: 0 }]);
    await essai('prépare', 'préparent');
    expect(essayer).toHaveBeenCalledTimes(1);
    document.body.innerHTML = '';
    render(<Chasse cle="test-chasse" texte={TEXTE} nbErreurs={2} essayer={vi.fn()} />);
    expect(screen.getByRole('button', { name: /prépare.*trouvé/ })).toBeDisabled();
    expect(screen.getByText('Il reste 1 erreur dans le texte.')).toBeInTheDocument();
  });
});
