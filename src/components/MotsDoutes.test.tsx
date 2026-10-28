import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, test, vi } from 'vitest';
import LimitesApp from './LimitesApp';
import MotsDoutes, { motsDuTexte } from './MotsDoutes';

function Essai({ onBasculer }: { onBasculer: (m: string, v: boolean) => void }) {
  const [d, setD] = useState<string[]>([]);
  return <MotsDoutes texte="Le chat mange le pomes." doutes={d} onBasculer={(m, v) => { setD(v ? [...d, m.toLowerCase()] : d.filter((x) => x !== m.toLowerCase())); onBasculer(m, v); }} />;
}

describe('MotsDoutes', () => {
  test('mots uniques du texte', () => {
    expect(motsDuTexte("Le chat. le CHAT l'école")).toEqual(['Le', 'chat', "l'école"]);
  });
  test('fermé par défaut, marquer puis retirer un mot', async () => {
    const sur = vi.fn();
    render(<Essai onBasculer={sur} />);
    expect(screen.queryByRole('button', { name: 'pomes' })).toBeNull();
    await userEvent.click(screen.getByRole('button', { name: /Marquer un mot dont je doute/ }));
    await userEvent.click(screen.getByRole('button', { name: 'pomes' }));
    expect(sur).toHaveBeenLastCalledWith('pomes', true);
    expect(screen.getByRole('button', { name: '? pomes' })).toHaveAttribute('aria-pressed', 'true');
    await userEvent.click(screen.getByRole('button', { name: '? pomes' }));
    expect(sur).toHaveBeenLastCalledWith('pomes', false);
  });
  test('ne dit jamais si le mot est juste', async () => {
    render(<Essai onBasculer={() => {}} />);
    await userEvent.click(screen.getByRole('button', { name: /Marquer un mot dont je doute/ }));
    expect(document.body.textContent).toMatch(/ne dit pas si un mot est juste ou faux/);
  });
});

describe('LimitesApp', () => {
  test('aucun signal n’est jamais présenté comme « texte correct »', () => {
    render(<LimitesApp categories={['point_fin_phrase']} contrainte={false} listeDeMots={false} aucunSignal />);
    expect(screen.getByText('Aucun signal sur :')).toBeInTheDocument();
    expect(screen.getByText(/Aucun signal ne veut pas dire que ton texte est sans erreur/)).toBeInTheDocument();
    expect(screen.getByText(/Elle ne voit pas : les fautes dans les mots, les fautes d’accord, le sens de ton texte\./)).toBeInTheDocument();
  });
  test('aucune catégorie : dit que rien n’est vérifié', () => {
    render(<LimitesApp categories={[]} contrainte={false} listeDeMots={false} aucunSignal />);
    expect(screen.getByText('Ici, l’application ne vérifie rien dans ton texte.')).toBeInTheDocument();
  });
});
