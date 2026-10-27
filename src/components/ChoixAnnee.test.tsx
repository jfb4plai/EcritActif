import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, test, vi } from 'vitest';
import ChoixAnnee from './ChoixAnnee';

const base = { id: 'x', libelle: 'Année scolaire de la classe', aide: 'Valeur de départ de vos nouvelles activités.' };

describe('ChoixAnnee : une année du programme, avec son aide', () => {
  test('libellé relié au champ et aide reliée par aria-describedby', () => {
    render(<ChoixAnnee {...base} valeur="" onChange={vi.fn()} />);
    const champ = screen.getByLabelText('Année scolaire de la classe');
    const aide = document.getElementById(champ.getAttribute('aria-describedby') as string);
    expect(aide?.textContent).toBe('Valeur de départ de vos nouvelles activités.');
  });

  test('par défaut, les années proposées aux enseignants', () => {
    render(<ChoixAnnee {...base} valeur="P1" onChange={vi.fn()} />);
    expect(screen.getAllByRole('option').map((o) => o.textContent)).toEqual(['P1', 'P2', 'P3']);
  });

  test('valeur vide : une première option « Choisir… » invite à décider ; elle ne compte pas comme une année', () => {
    render(<ChoixAnnee {...base} valeur="" onChange={vi.fn()} invite="Choisir l’année" />);
    const options = screen.getAllByRole('option').map((o) => o.textContent);
    expect(options[0]).toBe('Choisir l’année');
    expect(options.slice(1)).toEqual(['P1', 'P2', 'P3']);
    expect(screen.getByLabelText('Année scolaire de la classe')).toHaveValue('');
  });

  test('une valeur hors des années proposées reste visible (activité existante, test de P4 avant ouverture)', () => {
    render(<ChoixAnnee {...base} valeur="P4" onChange={vi.fn()} />);
    expect(screen.getAllByRole('option').map((o) => o.textContent)).toContain('P4');
    expect(screen.getByLabelText('Année scolaire de la classe')).toHaveValue('P4');
  });

  test('un changement renvoie l’année choisie', async () => {
    const onChange = vi.fn();
    render(<ChoixAnnee {...base} valeur="P1" onChange={onChange} />);
    await userEvent.selectOptions(screen.getByLabelText('Année scolaire de la classe'), 'P3');
    expect(onChange).toHaveBeenCalledWith('P3');
  });

  test('le choix « Choisir… » ne renvoie jamais une année vide', async () => {
    const onChange = vi.fn();
    render(<ChoixAnnee {...base} valeur="P2" onChange={onChange} invite="Choisir" />);
    await userEvent.selectOptions(screen.getByLabelText('Année scolaire de la classe'), '');
    expect(onChange).not.toHaveBeenCalled();
  });
});
