import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, test, vi } from 'vitest';
import Atelier from './Atelier';

const TEXTE = 'Mon chat dort sur le canapé. Les élèves de 4e année prépare leur sortie.';

function monter(surcharge: Partial<React.ComponentProps<typeof Atelier>> = {}) {
  const tracer = vi.fn();
  const onModifier = vi.fn();
  const onFermer = vi.fn();
  render(<Atelier texte={TEXTE} tracer={tracer} onModifier={onModifier} onFermer={onFermer} {...surcharge} />);
  return { tracer, onModifier, onFermer };
}

const suivante = () => userEvent.click(screen.getByRole('button', { name: /Étape suivante/ }));
const cliquer = (nom: string | RegExp) => userEvent.click(screen.getByRole('button', { name: nom }));
const verbeSujet = () => cliquer('Le verbe et son sujet');
const groupeNominal = () => cliquer(/Le nom et les mots qui l’accompagnent/);

describe('Atelier : choisir la phrase puis la démarche', () => {
  test('propose les phrases du texte de l’élève, une par bouton', () => {
    monter();
    expect(screen.getByRole('button', { name: /Phrase 1/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Phrase 2/ })).toBeInTheDocument();
  });

  test('texte vide : invitation à écrire, pas de phrases', () => {
    monter({ texte: '   ' });
    expect(screen.getByText(/Écris d’abord quelques mots/)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Phrase 1/ })).not.toBeInTheDocument();
  });

  test('choisir une phrase trace son numéro, sans son contenu', async () => {
    const { tracer } = monter();
    await cliquer(/Phrase 2/);
    expect(tracer).toHaveBeenCalledWith('atelier:phrase:2');
    expect(tracer.mock.calls.flat().join(' ')).not.toContain('élèves');
  });

  test('après la phrase, deux démarches sont proposées et le choix est tracé', async () => {
    const { tracer } = monter();
    await cliquer(/Phrase 2/);
    expect(screen.getByRole('button', { name: 'Le verbe et son sujet' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Le nom et les mots qui l’accompagnent/ })).toBeInTheDocument();
    await groupeNominal();
    expect(tracer).toHaveBeenCalledWith('atelier:demarche:groupe-nominal');
  });

  test('on peut changer de phrase, puis de démarche, sans fermer l’atelier', async () => {
    monter();
    await cliquer(/Phrase 2/);
    await cliquer(/Changer de phrase/);
    expect(screen.getByRole('button', { name: /Phrase 1/ })).toBeInTheDocument();
    await cliquer(/Phrase 2/);
    await verbeSujet();
    await cliquer(/Changer de démarche/);
    expect(screen.getByRole('button', { name: /Le nom et les mots/ })).toBeInTheDocument();
  });

  test('on peut fermer l’atelier à tout moment', async () => {
    const { onFermer } = monter();
    await cliquer(/Quitter l’atelier/);
    expect(onFermer).toHaveBeenCalled();
  });
});

async function jusquauSujet() {
  await cliquer(/Phrase 2/);
  await verbeSujet();
  await cliquer('prépare');
  await suivante();
}

describe('Atelier : le verbe et son sujet', () => {
  test('étape 1 : consignes à l’infinitif et mots cliquables avec état annoncé', async () => {
    monter();
    await cliquer(/Phrase 2/);
    await verbeSujet();
    expect(screen.getByRole('heading', { name: /Trouver le verbe/ })).toBeInTheDocument();
    expect(screen.getByText(/Changer le moment de la phrase/)).toBeInTheDocument();
    const mot = screen.getByRole('button', { name: 'prépare' });
    expect(mot).toHaveAttribute('aria-pressed', 'false');
    await userEvent.click(mot);
    expect(mot).toHaveAttribute('aria-pressed', 'true');
    await userEvent.click(mot);
    expect(mot).toHaveAttribute('aria-pressed', 'false');
  });

  test('« Étape suivante » reste bloquée tant qu’aucun mot n’est marqué', async () => {
    monter();
    await cliquer(/Phrase 2/);
    await verbeSujet();
    expect(screen.getByRole('button', { name: /Étape suivante/ })).toBeDisabled();
  });

  test('étape 2 : marquer le sujet et choisir un pronom parmi il, elle, ils, elles', async () => {
    monter();
    await jusquauSujet();
    expect(screen.getByRole('heading', { name: /Trouver le sujet/ })).toBeInTheDocument();
    expect(screen.getAllByRole('radio').map((r) => (r as HTMLInputElement).value)).toEqual(['il', 'elle', 'ils', 'elles']);
    expect(screen.getByRole('button', { name: /Étape suivante/ })).toBeDisabled();
    await cliquer('élèves');
    await userEvent.click(screen.getByRole('radio', { name: 'ils' }));
    expect(screen.getByRole('button', { name: /Étape suivante/ })).toBeEnabled();
  });

  test('le mot déjà pris comme verbe ne peut pas être pris comme sujet', async () => {
    monter();
    await jusquauSujet();
    expect(screen.getByRole('button', { name: 'prépare' })).toBeDisabled();
  });

  test('l’application ne dit jamais si le verbe, le sujet ou le pronom sont les bons', async () => {
    monter();
    await jusquauSujet();
    await cliquer('élèves');
    await userEvent.click(screen.getByRole('radio', { name: 'elle' }));
    expect(document.body.textContent).not.toMatch(/bravo|faux|correct|juste|exact|raté|mauvais/i);
  });

  test('on peut revenir à l’étape précédente sans perdre ses choix', async () => {
    monter();
    await jusquauSujet();
    await cliquer(/Étape précédente/);
    expect(screen.getByRole('button', { name: 'prépare' })).toHaveAttribute('aria-pressed', 'true');
  });

  test('le cadre des étapes montre les cinq étapes', async () => {
    monter();
    await cliquer(/Phrase 1/);
    await verbeSujet();
    expect(within(screen.getByRole('list', { name: /Les étapes/ })).getAllByRole('listitem')).toHaveLength(5);
  });
});

async function jusquauBout() {
  await jusquauSujet();
  await cliquer('élèves');
  await userEvent.click(screen.getByRole('radio', { name: 'ils' }));
  await suivante();
  await userEvent.type(screen.getByLabelText(/Fin du verbe/), 'e');
  await suivante();
}

describe('Atelier : justifier et décider (verbe et sujet)', () => {
  test('la justification a quatre champs, préremplis avec les choix de l’élève', async () => {
    monter();
    await jusquauBout();
    expect(screen.getByRole('heading', { name: /Justifier/ })).toBeInTheDocument();
    expect(screen.getByLabelText('Le sujet est')).toHaveValue('élèves');
    expect(screen.getByLabelText('Je peux le remplacer par')).toHaveValue('ils');
    expect(screen.getByLabelText('Le verbe')).toHaveValue('prépare');
    expect(screen.getByLabelText('se termine par')).toHaveValue('e');
  });

  test('décider : garder la phrase trace la décision et la justification, avec la démarche', async () => {
    const { tracer } = monter();
    await jusquauBout();
    await suivante();
    await cliquer(/Garder la phrase/);
    expect(tracer).toHaveBeenCalledWith('atelier:decision:garder');
    expect(tracer).toHaveBeenCalledWith('atelier:justification:verbe-sujet:élèves|ils|prépare|e');
  });

  test('décider : modifier mon texte ramène l’élève à son texte', async () => {
    const { tracer, onModifier } = monter();
    await jusquauBout();
    await suivante();
    await cliquer(/Modifier mon texte/);
    expect(tracer).toHaveBeenCalledWith('atelier:decision:modifier');
    expect(onModifier).toHaveBeenCalled();
  });

  test('« Je ne suis pas sûr » est tracé pour l’enseignant', async () => {
    const { tracer } = monter();
    await jusquauBout();
    await suivante();
    await cliquer(/Je ne suis pas sûr/);
    expect(tracer).toHaveBeenCalledWith('atelier:pas-sur');
  });

  test('la justification tracée est limitée en taille (champs de 60 signes, événement de 300 au plus)', async () => {
    const { tracer } = monter();
    await jusquauBout();
    for (const libelle of ['Le sujet est', 'Je peux le remplacer par', 'Le verbe', 'se termine par']) {
      const champ = screen.getByLabelText(libelle);
      await userEvent.clear(champ);
      await userEvent.click(champ);
      await userEvent.paste('x'.repeat(100));
      expect((champ as HTMLInputElement).value.length).toBeLessThanOrEqual(60);
    }
    await suivante();
    await cliquer(/Garder la phrase/);
    const justif = tracer.mock.calls.map((c) => c[0] as string).find((e) => e.startsWith('atelier:justification:'))!;
    expect(justif.length).toBeLessThanOrEqual(300);
  });
});

describe('Atelier : le nom et les mots qui l’accompagnent (groupe nominal)', () => {
  const T2 = 'Les petits chats dorment.';

  async function auNom() {
    await cliquer(/Phrase 1/);
    await groupeNominal();
  }
  async function jusquauxAccompagnants() {
    await auNom();
    await cliquer('chats');
    await suivante();
  }
  async function jusquauGenre() {
    await jusquauxAccompagnants();
    // deux zones de mots : le déterminant puis l'adjectif ; les mêmes mots apparaissent dans chaque zone
    const [det, adj] = [screen.getByText('Le déterminant').parentElement!, screen.getByText(/L’adjectif, s’il y en a un/).parentElement!];
    await userEvent.click(within(det).getByRole('button', { name: 'Les' }));
    await userEvent.click(within(adj).getByRole('button', { name: 'petits' }));
    await suivante();
  }

  test('étape 1 : trouver le nom, consignes avec « un », « une » ou « des »', async () => {
    monter({ texte: T2 });
    await auNom();
    expect(screen.getByRole('heading', { name: /Trouver le nom/ })).toBeInTheDocument();
    expect(screen.getByText(/après « un », « une » ou « des »/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Étape suivante/ })).toBeDisabled();
  });

  test('étape 2 : déterminant obligatoire, adjectif facultatif ; un mot ne sert qu’une fois', async () => {
    monter({ texte: T2 });
    await jusquauxAccompagnants();
    expect(screen.getByRole('heading', { name: /Trouver les mots qui l’accompagnent/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Étape suivante/ })).toBeDisabled();
    const det = screen.getByText('Le déterminant').parentElement!;
    await userEvent.click(within(det).getByRole('button', { name: 'Les' }));
    expect(screen.getByRole('button', { name: /Étape suivante/ })).toBeEnabled();
    const adj = screen.getByText(/L’adjectif, s’il y en a un/).parentElement!;
    expect(within(adj).getByRole('button', { name: 'Les' })).toBeDisabled();
    expect(within(adj).getByRole('button', { name: 'chats' })).toBeDisabled();
  });

  test('étape 3 : masculin ou féminin, un seul ou plusieurs, fin du déterminant', async () => {
    monter({ texte: T2 });
    await jusquauGenre();
    expect(screen.getByRole('heading', { name: /Regarder le genre et le nombre/ })).toBeInTheDocument();
    expect(screen.getAllByRole('radio').map((r) => (r as HTMLInputElement).value)).toEqual(['masculin', 'féminin', 'un seul', 'plusieurs']);
    expect(screen.getByRole('button', { name: /Étape suivante/ })).toBeDisabled();
    await userEvent.click(screen.getByRole('radio', { name: 'masculin' }));
    await userEvent.click(screen.getByRole('radio', { name: 'plusieurs' }));
    expect(screen.getByRole('button', { name: /Étape suivante/ })).toBeEnabled();
    expect(screen.getByLabelText(/Fin du déterminant/)).toBeInTheDocument();
  });

  test('justification préremplie et tracée avec l’identifiant de la démarche', async () => {
    const { tracer } = monter({ texte: T2 });
    await jusquauGenre();
    await userEvent.click(screen.getByRole('radio', { name: 'masculin' }));
    await userEvent.click(screen.getByRole('radio', { name: 'plusieurs' }));
    await userEvent.type(screen.getByLabelText(/Fin du déterminant/), 's');
    await suivante();
    expect(screen.getByLabelText('Le nom est')).toHaveValue('chats');
    expect(screen.getByLabelText('Il est (masculin ou féminin)')).toHaveValue('masculin');
    expect(screen.getByLabelText('et (un seul ou plusieurs)')).toHaveValue('plusieurs');
    expect(screen.getByLabelText('Le mot')).toHaveValue('Les');
    expect(screen.getByLabelText('se termine par')).toHaveValue('s');
    await suivante();
    await cliquer(/Garder la phrase/);
    expect(tracer).toHaveBeenCalledWith('atelier:justification:groupe-nominal:chats|masculin|plusieurs|Les|s');
  });

  test('l’application ne dit jamais si le nom, le genre ou le nombre sont les bons', async () => {
    monter({ texte: T2 });
    await jusquauGenre();
    await userEvent.click(screen.getByRole('radio', { name: 'féminin' }));
    expect(document.body.textContent).not.toMatch(/bravo|faux|correct|juste|exact|raté|mauvais/i);
  });
});
