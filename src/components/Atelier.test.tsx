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

describe('Atelier : choisir la phrase', () => {
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
    await userEvent.click(screen.getByRole('button', { name: /Phrase 2/ }));
    expect(tracer).toHaveBeenCalledWith('atelier:phrase:2');
    expect(tracer.mock.calls.flat().join(' ')).not.toContain('élèves');
  });

  test('on peut fermer l’atelier à tout moment', async () => {
    const { onFermer } = monter();
    await userEvent.click(screen.getByRole('button', { name: /Quitter l’atelier/ }));
    expect(onFermer).toHaveBeenCalled();
  });
});

async function jusquauSujet() {
  await userEvent.click(screen.getByRole('button', { name: /Phrase 2/ }));
  await userEvent.click(screen.getByRole('button', { name: 'prépare' }));
  await suivante();
}

describe('Atelier : étapes', () => {
  test('étape 1 : consignes à l’infinitif et mots cliquables avec état annoncé', async () => {
    monter();
    await userEvent.click(screen.getByRole('button', { name: /Phrase 2/ }));
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
    await userEvent.click(screen.getByRole('button', { name: /Phrase 2/ }));
    expect(screen.getByRole('button', { name: /Étape suivante/ })).toBeDisabled();
  });

  test('étape 2 : marquer le sujet et choisir un pronom parmi il, elle, ils, elles', async () => {
    monter();
    await jusquauSujet();
    expect(screen.getByRole('heading', { name: /Trouver le sujet/ })).toBeInTheDocument();
    expect(screen.getAllByRole('radio').map((r) => (r as HTMLInputElement).value)).toEqual(['il', 'elle', 'ils', 'elles']);
    expect(screen.getByRole('button', { name: /Étape suivante/ })).toBeDisabled();
    await userEvent.click(screen.getByRole('button', { name: 'élèves' }));
    await userEvent.click(screen.getByRole('radio', { name: 'ils' }));
    expect(screen.getByRole('button', { name: /Étape suivante/ })).toBeEnabled();
  });

  test('l’application ne dit jamais si le verbe, le sujet ou le pronom sont les bons', async () => {
    monter();
    await jusquauSujet();
    await userEvent.click(screen.getByRole('button', { name: 'élèves' }));
    await userEvent.click(screen.getByRole('radio', { name: 'elle' }));
    expect(document.body.textContent).not.toMatch(/bravo|faux|correct|juste|exact|raté|mauvais/i);
  });

  test('on peut revenir à l’étape précédente sans perdre ses choix', async () => {
    monter();
    await jusquauSujet();
    await userEvent.click(screen.getByRole('button', { name: /Étape précédente/ }));
    expect(screen.getByRole('button', { name: 'prépare' })).toHaveAttribute('aria-pressed', 'true');
  });

  test('le cadre des étapes montre les cinq étapes', async () => {
    monter();
    await userEvent.click(screen.getByRole('button', { name: /Phrase 1/ }));
    expect(within(screen.getByRole('list', { name: /Les étapes/ })).getAllByRole('listitem')).toHaveLength(5);
  });
});

async function jusquauBout() {
  await jusquauSujet();
  await userEvent.click(screen.getByRole('button', { name: 'élèves' }));
  await userEvent.click(screen.getByRole('radio', { name: 'ils' }));
  await suivante();
  await userEvent.type(screen.getByLabelText(/Fin du verbe/), 'e');
  await suivante();
}

describe('Atelier : justifier et décider', () => {
  test('la justification a quatre champs, préremplis avec les choix de l’élève', async () => {
    monter();
    await jusquauBout();
    expect(screen.getByRole('heading', { name: /Justifier/ })).toBeInTheDocument();
    expect(screen.getByLabelText('Le sujet est')).toHaveValue('élèves');
    expect(screen.getByLabelText('Je peux le remplacer par')).toHaveValue('ils');
    expect(screen.getByLabelText('Le verbe')).toHaveValue('prépare');
    expect(screen.getByLabelText('se termine par')).toHaveValue('e');
  });

  test('décider : garder la phrase trace la décision et la justification', async () => {
    const { tracer } = monter();
    await jusquauBout();
    await suivante();
    await userEvent.click(screen.getByRole('button', { name: /Garder la phrase/ }));
    expect(tracer).toHaveBeenCalledWith('atelier:decision:garder');
    expect(tracer).toHaveBeenCalledWith('atelier:justification:élèves|ils|prépare|e');
  });

  test('décider : modifier mon texte ramène l’élève à son texte', async () => {
    const { tracer, onModifier } = monter();
    await jusquauBout();
    await suivante();
    await userEvent.click(screen.getByRole('button', { name: /Modifier mon texte/ }));
    expect(tracer).toHaveBeenCalledWith('atelier:decision:modifier');
    expect(onModifier).toHaveBeenCalled();
  });

  test('« Je ne suis pas sûr » est tracé pour l’enseignant', async () => {
    const { tracer } = monter();
    await jusquauBout();
    await suivante();
    await userEvent.click(screen.getByRole('button', { name: /Je ne suis pas sûr/ }));
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
    await userEvent.click(screen.getByRole('button', { name: /Garder la phrase/ }));
    const justif = tracer.mock.calls.map((c) => c[0] as string).find((e) => e.startsWith('atelier:justification:'))!;
    expect(justif.length).toBeLessThanOrEqual(300);
  });
});
