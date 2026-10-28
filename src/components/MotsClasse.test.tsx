import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, test, vi } from 'vitest';
import MotsClasse from './MotsClasse';

describe('MotsClasse', () => {
  test('affiche la liste actuelle, enregistre la saisie et confirme le nombre de mots', async () => {
    const enregistrer = vi.fn(async (s: string) => s.split(',').map((m) => m.trim()));
    render(<MotsClasse initial={['Cointe']} onEnregistrer={enregistrer} />);
    const champ = screen.getByLabelText(/Mots locaux acceptés dans toutes les activités/);
    expect(champ).toHaveValue('Cointe');
    await userEvent.clear(champ);
    await userEvent.type(champ, 'Cointe, Outremeuse');
    await userEvent.click(screen.getByRole('button', { name: /Enregistrer les mots de la classe/ }));
    expect(enregistrer).toHaveBeenCalledWith('Cointe, Outremeuse');
    expect(await screen.findByRole('status')).toHaveTextContent('Liste enregistrée : 2 mots.');
  });
  test('avertit que la faute de l’enseignant serait acceptée', () => {
    render(<MotsClasse initial={[]} onEnregistrer={async () => []} />);
    expect(screen.getByText(/Une faute de votre part sera acceptée chez l’élève/)).toBeInTheDocument();
  });
  test('mots refusés : message clair, rien de confirmé', async () => {
    render(<MotsClasse initial={[]} onEnregistrer={async () => { throw new Error('Mots non reconnus : tunnel de la Meuse'); }} />);
    await userEvent.type(screen.getByLabelText(/Mots locaux/), 'tunnel de la Meuse');
    await userEvent.click(screen.getByRole('button', { name: /Enregistrer/ }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Mots non reconnus : tunnel de la Meuse. Écrivez des mots seuls');
    expect(screen.queryByRole('status')).toBeNull();
  });
});
