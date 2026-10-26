import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, test, vi } from 'vitest';
import AidesRetireesEditeur from './AidesRetireesEditeur';

describe('AidesRetireesEditeur', () => {
  test('part des retraits existants et les enregistre avec leur raison', async () => {
    const onEnregistrer = vi.fn();
    render(<AidesRetireesEditeur initial={[{ id: 'dictee-vocale', raison: 'Geste d’écrire.' }]} onEnregistrer={onEnregistrer} />);
    expect(screen.getByLabelText(/retirer : dire mon texte à voix haute/i)).toBeChecked();
    expect(screen.getByLabelText(/raison du retrait : dire mon texte à voix haute/i)).toHaveValue('Geste d’écrire.');
    await userEvent.click(screen.getByLabelText(/retirer : écouter mon texte/i));
    await userEvent.type(screen.getByLabelText(/raison du retrait : écouter mon texte/i), 'On vérifie la relecture silencieuse.');
    await userEvent.click(screen.getByRole('button', { name: /enregistrer les aides retirées/i }));
    expect(onEnregistrer).toHaveBeenCalledWith([
      { id: 'dictee-vocale', raison: 'Geste d’écrire.' },
      { id: 'audio-relecture', raison: 'On vérifie la relecture silencieuse.' },
    ]);
  });

  test('un retrait sans raison empêche l’enregistrement', async () => {
    render(<AidesRetireesEditeur initial={[]} onEnregistrer={vi.fn()} />);
    await userEvent.click(screen.getByLabelText(/retirer : dire mon texte à voix haute/i));
    expect(screen.getByRole('button', { name: /enregistrer les aides retirées/i })).toBeDisabled();
  });

  test('décocher un retrait le supprime', async () => {
    const onEnregistrer = vi.fn();
    render(<AidesRetireesEditeur initial={[{ id: 'dictee-vocale', raison: 'x' }]} onEnregistrer={onEnregistrer} />);
    await userEvent.click(screen.getByLabelText(/retirer : dire mon texte à voix haute/i));
    await userEvent.click(screen.getByRole('button', { name: /enregistrer les aides retirées/i }));
    expect(onEnregistrer).toHaveBeenCalledWith([]);
  });
});
