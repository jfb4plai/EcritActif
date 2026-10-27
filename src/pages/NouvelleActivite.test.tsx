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

describe('NouvelleActivite : « Ma formulation » (atelier)', () => {
  async function ouvrir(annee: 'P4' | 'P5' = 'P4', g = false) {
    const onEnregistrer = vi.fn();
    render(<NouvelleActivite annee={annee} onEnregistrer={onEnregistrer} />);
    await userEvent.type(screen.getByLabelText(/consigne pour les élèves/i), 'Écrire.');
    await userEvent.click(screen.getByLabelText(/atelier de raisonnement grammatical/i));
    if (g) await userEvent.click(screen.getByLabelText(/grammaire 3d/i));
    return { onEnregistrer };
  }

  test('sans atelier coché, pas de zone « Ma formulation »', () => {
    render(<NouvelleActivite annee="P4" onEnregistrer={vi.fn()} />);
    expect(screen.queryByText(/ma formulation/i)).not.toBeInTheDocument();
  });

  test('atelier coché : un champ par étape, avec les consignes de l’application en exemple et une aide', async () => {
    await ouvrir();
    const champ = screen.getByLabelText(/Ma formulation : Le verbe et son sujet, Trouver le verbe/);
    expect((champ.getAttribute('placeholder') ?? '')).toContain('Changer le temps de la phrase');
    const aide = document.getElementById(champ.getAttribute('aria-describedby') as string)?.textContent ?? '';
    expect(aide).toMatch(/une consigne par ligne/i);
    expect(aide).toMatch(/laissez vide/i);
  });

  test('seules les démarches de l’année sont proposées : pas de participe passé en P4', async () => {
    await ouvrir('P4');
    expect(screen.queryByLabelText(/Ma formulation : Le participe passé/)).not.toBeInTheDocument();
    expect(screen.getAllByLabelText(/Ma formulation : La fonction d’un groupe/).length).toBeGreaterThan(0);
  });

  test('en P5, le participe passé est proposé', async () => {
    await ouvrir('P5');
    expect(screen.getByLabelText(/Ma formulation : Le participe passé, Trouver le participe passé/)).toBeInTheDocument();
  });

  test('ce que l’enseignant écrit est enregistré ; l’étape laissée vide ne l’est pas', async () => {
    const { onEnregistrer } = await ouvrir();
    await userEvent.type(screen.getByLabelText(/Ma formulation : Le verbe et son sujet, Trouver le verbe/), 'Mettre la phrase à l’imparfait.{Enter}Cliquer sur le mot qui change.');
    await userEvent.click(screen.getByRole('button', { name: /enregistrer/i }));
    expect(onEnregistrer.mock.calls[0][0].atelierPerso).toEqual({ 'verbe-sujet': { verbe: ['Mettre la phrase à l’imparfait.', 'Cliquer sur le mot qui change.'] } });
  });

  test('aucune saisie : objet vide', async () => {
    const { onEnregistrer } = await ouvrir();
    await userEvent.click(screen.getByRole('button', { name: /enregistrer/i }));
    expect(onEnregistrer.mock.calls[0][0].atelierPerso).toEqual({});
  });

  test('atelier décoché avant d’enregistrer : la formulation n’est pas enregistrée', async () => {
    const { onEnregistrer } = await ouvrir();
    await userEvent.type(screen.getByLabelText(/Ma formulation : Le verbe et son sujet, Trouver le verbe/), 'Mes mots.');
    await userEvent.click(screen.getByLabelText(/atelier de raisonnement grammatical/i));
    await userEvent.click(screen.getByRole('button', { name: /enregistrer/i }));
    expect(onEnregistrer.mock.calls[0][0].atelierPerso).toEqual({});
  });

  test('avec Grammaire 3D, la fonction d’un groupe garde sa zone de formulation', async () => {
    await ouvrir('P5', true);
    expect(screen.getByLabelText(/Ma formulation : La fonction d’un groupe, Choisir un groupe/)).toBeInTheDocument();
  });
});

describe('NouvelleActivite : Grammaire 3D (option pédagogique de l’atelier)', () => {
  test('en P5, une case à cocher, décochée par défaut, avec une aide qui dit que le programme reste la référence', () => {
    render(<NouvelleActivite annee="P5" onEnregistrer={vi.fn()} />);
    const c = screen.getByLabelText(/grammaire 3d/i);
    expect(c).not.toBeChecked();
    const aide = document.getElementById(c.getAttribute('aria-describedby') as string)?.textContent ?? '';
    expect(aide).toMatch(/fonctions/i);
    expect(aide).toMatch(/programme/i);
  });

  test.each(['P1', 'P2', 'P3'] as const)('en %s, pas d’option Grammaire 3D', (annee) => {
    render(<NouvelleActivite annee={annee} onEnregistrer={vi.fn()} />);
    expect(screen.queryByLabelText(/grammaire 3d/i)).not.toBeInTheDocument();
  });

  test('cochée, l’option est enregistrée ; sinon false', async () => {
    const onEnregistrer = vi.fn();
    render(<NouvelleActivite annee="P5" onEnregistrer={onEnregistrer} />);
    await userEvent.type(screen.getByLabelText(/consigne pour les élèves/i), 'Écrire.');
    await userEvent.click(screen.getByRole('button', { name: /enregistrer/i }));
    expect(onEnregistrer).toHaveBeenLastCalledWith(expect.objectContaining({ grammaire3d: false }));
    await userEvent.click(screen.getByLabelText(/grammaire 3d/i));
    await userEvent.click(screen.getByRole('button', { name: /enregistrer/i }));
    expect(onEnregistrer).toHaveBeenLastCalledWith(expect.objectContaining({ grammaire3d: true }));
  });

  test('le formulaire dit que les verbes pronominaux ne sont pas dans l’atelier, puisque hors programme', () => {
    render(<NouvelleActivite annee="P5" onEnregistrer={vi.fn()} />);
    expect(screen.getByText(/verbes pronominaux/i)).toBeInTheDocument();
  });
});

describe('NouvelleActivite : chasse aux erreurs (voie B)', () => {
  const TEXTE = 'Les élèves de 4e année prépare leur sortie. Ils emporte un pique-nique.';

  async function activerChasse() {
    await userEvent.click(screen.getByLabelText(/proposer une chasse aux erreurs/i));
  }
  async function remplirErreur(mot: string, attendu: string, indice = '') {
    await userEvent.type(screen.getByLabelText(/mot tel qu’il est écrit/i), mot);
    await userEvent.type(screen.getByLabelText(/forme attendue/i), attendu);
    if (indice) await userEvent.type(screen.getByLabelText(/mon indice/i), indice);
  }

  test('en P4, la case est proposée, décochée, et ne montre rien d’autre tant qu’elle est décochée', () => {
    render(<NouvelleActivite annee="P4" onEnregistrer={vi.fn()} />);
    expect(screen.getByLabelText(/proposer une chasse aux erreurs/i)).not.toBeChecked();
    expect(screen.queryByLabelText(/texte à corriger/i)).not.toBeInTheDocument();
  });

  test.each(['P1', 'P2', 'P3'] as const)('en %s, pas de chasse', (annee) => {
    render(<NouvelleActivite annee={annee} onEnregistrer={vi.fn()} />);
    expect(screen.queryByLabelText(/proposer une chasse aux erreurs/i)).not.toBeInTheDocument();
  });

  test.each([/texte à corriger/i, /mot tel qu’il est écrit/i, /forme attendue/i, /mon indice/i])('%s a un placeholder et une aide', async (nom) => {
    render(<NouvelleActivite annee="P4" onEnregistrer={vi.fn()} />);
    await activerChasse();
    const champ = screen.getByLabelText(nom);
    expect(champ.getAttribute('placeholder')).toBeTruthy();
    const id = champ.getAttribute('aria-describedby');
    expect(id).toBeTruthy();
    expect(document.getElementById(id as string)?.textContent?.length).toBeGreaterThan(10);
  });

  test('un texte et une erreur valides : la chasse est enregistrée avec la position du mot', async () => {
    const onEnregistrer = vi.fn();
    render(<NouvelleActivite annee="P4" onEnregistrer={onEnregistrer} />);
    await userEvent.type(screen.getByLabelText(/consigne pour les élèves/i), 'Écrire.');
    await activerChasse();
    await userEvent.type(screen.getByLabelText(/texte à corriger/i), TEXTE);
    await remplirErreur('prépare', 'préparent', 'Cherche le sujet.');
    await userEvent.click(screen.getByRole('button', { name: /enregistrer/i }));
    const a = onEnregistrer.mock.calls[0][0];
    expect(a.chasse.texte).toBe(TEXTE);
    expect(a.chasse.erreurs).toEqual([{ position: 5, mot: 'prépare', attendu: 'préparent', type: 'accord-verbe', indice: 'Cherche le sujet.' }]);
  });

  test('un mot absent du texte : message clair, rien n’est enregistré', async () => {
    const onEnregistrer = vi.fn();
    render(<NouvelleActivite annee="P4" onEnregistrer={onEnregistrer} />);
    await userEvent.type(screen.getByLabelText(/consigne pour les élèves/i), 'Écrire.');
    await activerChasse();
    await userEvent.type(screen.getByLabelText(/texte à corriger/i), TEXTE);
    await remplirErreur('chantent', 'chantent');
    await userEvent.click(screen.getByRole('button', { name: /enregistrer/i }));
    expect(screen.getByRole('alert')).toHaveTextContent(/chantent/);
    expect(onEnregistrer).not.toHaveBeenCalled();
  });

  test('on peut ajouter une deuxième erreur et en retirer une', async () => {
    render(<NouvelleActivite annee="P4" onEnregistrer={vi.fn()} />);
    await activerChasse();
    await userEvent.click(screen.getByRole('button', { name: /ajouter une erreur/i }));
    expect(screen.getAllByLabelText(/forme attendue/i)).toHaveLength(2);
    await userEvent.click(screen.getAllByRole('button', { name: /retirer cette erreur/i })[0]);
    expect(screen.getAllByLabelText(/forme attendue/i)).toHaveLength(1);
  });

  test('case décochée : pas de chasse enregistrée', async () => {
    const onEnregistrer = vi.fn();
    render(<NouvelleActivite annee="P4" onEnregistrer={onEnregistrer} />);
    await userEvent.type(screen.getByLabelText(/consigne pour les élèves/i), 'Écrire.');
    await userEvent.click(screen.getByRole('button', { name: /enregistrer/i }));
    expect(onEnregistrer.mock.calls[0][0].chasse).toBeNull();
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
