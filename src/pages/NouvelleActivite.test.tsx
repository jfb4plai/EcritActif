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
  test.each([/consigne pour les élèves/i, /nombre minimum de mots/i, /nombre maximum de mots/i, /mots utiles/i, /ma question pour réfléchir/i, /ma question pour relire/i, /ma question pour corriger/i])('%s a un placeholder et une aide', (nom) => {
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
    await userEvent.click(screen.getByLabelText(/retirer : dire mon texte à voix haute/i));
    expect(bouton).toBeDisabled();
    await userEvent.type(screen.getByLabelText(/raison du retrait : dire mon texte à voix haute/i), 'On vérifie le geste d’écrire.');
    expect(bouton).toBeEnabled();
    await userEvent.click(bouton);
    expect(onEnregistrer).toHaveBeenCalledOnce();
    const a = onEnregistrer.mock.calls[0][0];
    expect(a.aidesRetirees).toEqual([{ id: 'dictee-vocale', raison: 'On vérifie le geste d’écrire.' }]);
    expect(a.consigne).toBe('Écrire trois phrases sur mon animal.');
  });

  test('les mots utiles et les questions de l’enseignant sont enregistrés (singularité de l’enseignant)', async () => {
    const { onEnregistrer } = formulaire();
    await userEvent.type(screen.getByLabelText(/consigne pour les élèves/i), 'Décrire mon animal.');
    await userEvent.type(screen.getByLabelText(/mots utiles/i), 'chat, dormir ,, poil');
    await userEvent.type(screen.getByLabelText(/ma question pour relire/i), 'As-tu décrit son pelage ?');
    await userEvent.click(screen.getByRole('button', { name: /enregistrer/i }));
    const a = onEnregistrer.mock.calls[0][0];
    expect(a.banqueMots).toEqual(['chat', 'dormir', 'poil']);
    expect(a.principesPerso).toEqual([{ phase: 'relire', question: 'As-tu décrit son pelage ?' }]);
  });

  test('sans saisie : banque de mots et questions vides', async () => {
    const { onEnregistrer } = formulaire();
    await userEvent.type(screen.getByLabelText(/consigne pour les élèves/i), 'Décrire mon animal.');
    await userEvent.click(screen.getByRole('button', { name: /enregistrer/i }));
    const a = onEnregistrer.mock.calls[0][0];
    expect(a.banqueMots).toEqual([]);
    expect(a.principesPerso).toEqual([]);
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
