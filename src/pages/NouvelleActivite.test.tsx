import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, test, vi } from 'vitest';
import NouvelleActivite from './NouvelleActivite';

function formulaire() {
  const onEnregistrer = vi.fn();
  render(<NouvelleActivite annee="P2" onEnregistrer={onEnregistrer} />);
  return { onEnregistrer };
}

describe('NouvelleActivite : guidage de chaque champ', () => {
  test.each([/consigne pour les élèves/i, /nombre minimum de mots/i, /nombre maximum de mots/i])('%s a un placeholder et une aide', (nom) => {
    formulaire();
    const champ = screen.getByLabelText(nom);
    expect(champ.getAttribute('placeholder')).toBeTruthy();
    const id = champ.getAttribute('aria-describedby');
    expect(id).toBeTruthy();
    expect(document.getElementById(id as string)?.textContent?.length).toBeGreaterThan(10);
  });
});

describe('NouvelleActivite : comportement', () => {
  test('enregistrer est désactivé tant que la consigne est vide', () => {
    formulaire();
    expect(screen.getByRole('button', { name: /enregistrer/i })).toBeDisabled();
  });

  test('retirer une aide sans raison désactive l’enregistrement ; avec une raison, il redevient possible', async () => {
    const { onEnregistrer } = formulaire();
    await userEvent.type(screen.getByLabelText(/consigne pour les élèves/i), 'Écrire trois phrases sur mon animal.');
    const bouton = screen.getByRole('button', { name: /enregistrer/i });
    expect(bouton).toBeEnabled();
    await userEvent.click(screen.getByLabelText(/retirer : écrire au clavier/i));
    expect(bouton).toBeDisabled();
    await userEvent.type(screen.getByLabelText(/raison du retrait : écrire au clavier/i), 'On vérifie le geste d’écrire.');
    expect(bouton).toBeEnabled();
    await userEvent.click(bouton);
    expect(onEnregistrer).toHaveBeenCalledOnce();
    const a = onEnregistrer.mock.calls[0][0];
    expect(a.aidesRetirees).toEqual([{ id: 'clavier', raison: 'On vérifie le geste d’écrire.' }]);
    expect(a.consigne).toBe('Écrire trois phrases sur mon animal.');
  });

  test('les principes en brouillon ne s’affichent que si l’enseignant le demande', async () => {
    formulaire();
    expect(screen.queryByText(/Ton texte dit-il ce que tu voulais dire/)).not.toBeInTheDocument();
    await userEvent.click(screen.getByLabelText(/afficher les principes en brouillon/i));
    expect(screen.getAllByText(/Ton texte dit-il ce que tu voulais dire/).length).toBeGreaterThan(0);
  });

  test('un principe en brouillon est étiqueté comme tel et la phrase d’aide ne prétend pas qu’il est validé (revue finale)', async () => {
    formulaire();
    await userEvent.click(screen.getByLabelText(/afficher les principes en brouillon/i));
    expect(screen.getAllByText(/\(brouillon\)/).length).toBeGreaterThan(0);
    expect(document.body.textContent).toMatch(/sous votre responsabilité/);
    expect(document.body.textContent).not.toMatch(/Seuls les principes validés sont proposés aux élèves/);
  });
});
