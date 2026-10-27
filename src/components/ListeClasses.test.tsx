import { render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, test } from 'vitest';
import ListeClasses from './ListeClasses';
import type { ClasseLigne } from '../lib/enseignant';

const classes: ClasseLigne[] = [
  { id: 'c1', nom: 'essai', code_classe: 'PAPAG4', niveau: 'P4' },
  { id: 'c2', nom: '2e A', code_classe: 'KMNPQR', niveau: null },
];

const monter = (liste: ClasseLigne[]) =>
  render(
    <MemoryRouter>
      <ListeClasses classes={liste} />
    </MemoryRouter>,
  );

describe('ListeClasses : chaque classe se reconnaît et s’ouvre par un vrai bouton', () => {
  test('une consigne dit sur quoi cliquer et pourquoi', () => {
    monter(classes);
    expect(screen.getByText(/Cliquer sur « Ouvrir la classe »/)).toBeInTheDocument();
    expect(screen.getByText(/ajouter vos élèves et créer vos activités/)).toBeInTheDocument();
  });

  test('chaque classe : nom, année scolaire et code à donner aux élèves', () => {
    monter(classes);
    const carte = screen.getByText('essai', { selector: 'strong' }).closest('li') as HTMLElement;
    expect(within(carte).getByText(/P4/)).toBeInTheDocument();
    expect(within(carte).getByText('PAPAG4')).toBeInTheDocument();
    expect(within(carte).getByText(/Code à donner aux élèves/)).toBeInTheDocument();
  });

  test('un lien « Ouvrir la classe » par classe, avec le nom de la classe pour les lecteurs d’écran', () => {
    monter(classes);
    const liens = screen.getAllByRole('link', { name: /Ouvrir la classe/ });
    expect(liens).toHaveLength(2);
    expect(liens[0]).toHaveAttribute('href', '/enseignant/classe/c1');
    expect(liens[0]).toHaveAccessibleName('Ouvrir la classe essai');
    expect(liens[1]).toHaveAttribute('href', '/enseignant/classe/c2');
  });

  test('le lien a l’aspect d’un bouton', () => {
    monter(classes);
    expect(screen.getAllByRole('link', { name: /Ouvrir la classe/ })[0]).toHaveClass('plai-btn');
  });

  test('classe créée avant le champ année : « année à préciser », qui sera demandée à l’ouverture', () => {
    monter(classes);
    const carte = screen.getByText('2e A', { selector: 'strong' }).closest('li') as HTMLElement;
    expect(within(carte).getByText(/année à préciser/)).toBeInTheDocument();
  });

  test('aucune classe : une phrase explique quoi faire, sans liste vide', () => {
    monter([]);
    expect(screen.getByText(/pas encore de classe/i)).toBeInTheDocument();
    expect(screen.queryByRole('list')).not.toBeInTheDocument();
  });
});
