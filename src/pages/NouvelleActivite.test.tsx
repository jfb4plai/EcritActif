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

describe('NouvelleActivite : atelier de grammaire (voie A)', () => {
  test('en P4, la case est proposée avec un texte d’aide, décochée par défaut', () => {
    render(<NouvelleActivite annee="P4" onEnregistrer={vi.fn()} />);
    const case_ = screen.getByLabelText(/atelier de raisonnement grammatical/i);
    expect(case_).not.toBeChecked();
    const id = case_.getAttribute('aria-describedby');
    expect(id).toBeTruthy();
    expect(document.getElementById(id as string)?.textContent).toMatch(/ne dit jamais/i);
  });

  test.each(['P1', 'P2', 'P3'] as const)('en %s, la case n’est pas proposée', (annee) => {
    render(<NouvelleActivite annee={annee} onEnregistrer={vi.fn()} />);
    expect(screen.queryByLabelText(/atelier de raisonnement grammatical/i)).not.toBeInTheDocument();
  });

  test('cochée, la case est enregistrée avec l’activité ; sinon false', async () => {
    const onEnregistrer = vi.fn();
    render(<NouvelleActivite annee="P4" onEnregistrer={onEnregistrer} />);
    await userEvent.type(screen.getByLabelText(/consigne pour les élèves/i), 'Écrire.');
    await userEvent.click(screen.getByRole('button', { name: /enregistrer/i }));
    expect(onEnregistrer).toHaveBeenLastCalledWith(expect.objectContaining({ atelier: false }));
    await userEvent.click(screen.getByLabelText(/atelier de raisonnement grammatical/i));
    await userEvent.click(screen.getByRole('button', { name: /enregistrer/i }));
    expect(onEnregistrer).toHaveBeenLastCalledWith(expect.objectContaining({ atelier: true }));
  });

  test('une activité de P2 enregistre toujours atelier : false', async () => {
    const { onEnregistrer } = formulaire();
    await userEvent.type(screen.getByLabelText(/consigne pour les élèves/i), 'Écrire.');
    await userEvent.click(screen.getByRole('button', { name: /enregistrer/i }));
    expect(onEnregistrer).toHaveBeenCalledWith(expect.objectContaining({ atelier: false }));
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

  test('en P1, l’enseignant est prévenu que « Corriger » est fusionné avec « Relire »', () => {
    render(<NouvelleActivite annee="P1" onEnregistrer={vi.fn()} />);
    expect(screen.getByRole('heading', { name: /Corriger \(avec Relire en P1\)/ })).toBeInTheDocument();
    expect(screen.getByText(/En P1, ce temps est fusionné avec Relire/)).toBeInTheDocument();
  });

  test('en P2, rien de tel', () => {
    formulaire();
    expect(screen.queryByText(/En P1, ce temps est fusionné/)).not.toBeInTheDocument();
  });

  test('l’attendu du référentiel de l’année est rappelé à côté des items CECP', () => {
    formulaire();
    expect(screen.getByText(/Rédiger un écrit lisible/)).toBeInTheDocument();
    expect(screen.getByText(/scripteur débutant/i)).toBeInTheDocument();
    expect(screen.getByText(/planification ; mise en texte ; révision ; correction/)).toBeInTheDocument();
  });

  test('chaque temps porte le terme du programme (production d’écrit, F282) et chaque principe ses codes', async () => {
    formulaire();
    await userEvent.click(screen.getByLabelText(/afficher les principes en brouillon/i));
    for (const t of [/Réfléchir \(planification\)/, /Relire \(révision\)/, /Corriger \(correction\)/]) {
      expect(screen.getByRole('heading', { name: t })).toBeInTheDocument();
    }
    expect(screen.getAllByText(/Programme : F/).length).toBeGreaterThan(0);
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
