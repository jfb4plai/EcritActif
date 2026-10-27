import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, test, vi } from 'vitest';
import ReglageColorisation from './ReglageColorisation';

describe('ReglageColorisation : l’enseignant règle la colorisation d’un élève', () => {
  test('sans réglage : les quatre modes sont permis, syllabes au départ, avec une aide', () => {
    render(<ReglageColorisation valeur={null} onChange={vi.fn()} />);
    expect(screen.getByLabelText(/mode affiché au départ/i)).toHaveValue('syllabes');
    expect(screen.getAllByRole('checkbox')).toHaveLength(4);
    for (const c of screen.getAllByRole('checkbox')) expect(c).toBeChecked();
    expect(screen.getByText(/l’élève peut choisir parmi les modes cochés/i)).toBeInTheDocument();
  });

  test('décocher un mode enregistre le réglage sans ce mode', async () => {
    const onChange = vi.fn();
    render(<ReglageColorisation valeur={null} onChange={onChange} />);
    await userEvent.click(screen.getByLabelText('Les sons'));
    expect(onChange).toHaveBeenLastCalledWith({ defaut: 'syllabes', permis: ['syllabes', 'bpdq', 'voyelles-consonnes'] });
  });

  test('changer le mode de départ le rend permis', async () => {
    const onChange = vi.fn();
    render(<ReglageColorisation valeur={{ defaut: 'syllabes', permis: ['syllabes'] }} onChange={onChange} />);
    await userEvent.selectOptions(screen.getByLabelText(/mode affiché au départ/i), 'bpdq');
    expect(onChange).toHaveBeenLastCalledWith({ defaut: 'bpdq', permis: ['syllabes', 'bpdq'] });
  });

  test('on ne peut pas décocher le dernier mode permis', async () => {
    const onChange = vi.fn();
    render(<ReglageColorisation valeur={{ defaut: 'syllabes', permis: ['syllabes'] }} onChange={onChange} />);
    expect(screen.getByLabelText('Les syllabes')).toBeDisabled();
  });

  test('décocher le mode de départ : le premier mode restant le remplace', async () => {
    const onChange = vi.fn();
    render(<ReglageColorisation valeur={{ defaut: 'syllabes', permis: ['phonemes', 'syllabes'] }} onChange={onChange} />);
    await userEvent.click(screen.getByLabelText('Les syllabes'));
    expect(onChange).toHaveBeenLastCalledWith({ defaut: 'phonemes', permis: ['phonemes'] });
  });
});
