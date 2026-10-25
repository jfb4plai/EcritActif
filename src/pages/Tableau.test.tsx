import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, test, vi } from 'vitest';
import Tableau from './Tableau';
import type { ItemCecp } from '../types';

const base = { annee: 'P1' as const, type: 'Savoir-faire' as const, rubrique: null, pagePdf: 1, attendus: ['x'] };
const I1: ItemCecp = { ...base, id: 'P1:F114+F115', codes: ['F114', 'F115'], contenu: 'Réviser sa production écrite' };
const I2: ItemCecp = { ...base, id: 'P1:F39+F40', codes: ['F39', 'F40'], contenu: 'Utiliser la majuscule et le point' };

function afficher(validations: { eleveId: string; itemId: string }[] = []) {
  const onValider = vi.fn();
  render(
    <Tableau
      annee="P1"
      items={[I1, I2]}
      eleves={[
        { id: 'e1', code: 'KMNPQR', dernierePhase: 'relire', versions: 2, aides: ['colorisation'], itemsTravailles: ['P1:F114+F115'] },
        { id: 'e2', code: 'STUVWX', dernierePhase: null, versions: 0, aides: [], itemsTravailles: [] },
      ]}
      activites={[{ id: 'a1', itemIds: ['P1:F114+F115'] }]}
      validations={validations}
      onValider={onValider}
    />,
  );
  return { onValider };
}

describe('Tableau', () => {
  test('affiche les codes anonymes, la dernière phase atteinte et les versions', () => {
    afficher();
    const ligne = screen.getByText('KMNPQR').closest('tr') as HTMLElement;
    expect(within(ligne).getByText('Relire')).toBeInTheDocument();
    expect(within(ligne).getByText(/2 versions/)).toBeInTheDocument();
    expect(within(screen.getByText('STUVWX').closest('tr') as HTMLElement).getByText(/pas encore commencé/i)).toBeInTheDocument();
  });

  test('un texte rendu est indiqué « Rendu »', () => {
    render(
      <Tableau annee="P1" items={[I1]} eleves={[{ id: 'e1', code: 'KMNPQR', dernierePhase: 'rendu', versions: 1, aides: [], itemsTravailles: [] }]} activites={[]} validations={[]} onValider={() => {}} />,
    );
    expect(screen.getByText('Rendu')).toBeInTheDocument();
  });

  test('affiche les aides utilisées par libellé', () => {
    afficher();
    expect(within(screen.getByText('KMNPQR').closest('tr') as HTMLElement).getByText(/Colorer les sons ou les syllabes/)).toBeInTheDocument();
  });

  test('l’enseignant valide un item pour un élève ; l’app ne le fait jamais seule', async () => {
    const { onValider } = afficher();
    expect(onValider).not.toHaveBeenCalled();
    await userEvent.click(screen.getByRole('button', { name: /valider cet item pour cet élève/i }));
    expect(onValider).toHaveBeenCalledWith('e1', 'P1:F114+F115');
  });

  test('un item déjà validé est marqué et n’a plus de bouton', () => {
    afficher([{ eleveId: 'e1', itemId: 'P1:F114+F115' }]);
    expect(screen.queryByRole('button', { name: /valider cet item pour cet élève/i })).not.toBeInTheDocument();
    expect(screen.getByText(/^Validé$/)).toBeInTheDocument();
  });

  test('la carte du programme distingue pas encore travaillé et travaillé', () => {
    afficher();
    const carte = screen.getByRole('region', { name: /programme/i });
    expect(within(carte).getAllByText(/F114, F115/).length).toBeGreaterThan(0);
    expect(within(carte).getByText(/Pas encore travaillé/)).toBeInTheDocument();
    expect(within(carte).getByText(/Travaillé · 0 sur 2 validé/)).toBeInTheDocument();
  });
});
