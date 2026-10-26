import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import Accueil from './Accueil';
import EcranEleve from './EcranEleve';
import { PALETTE } from '../lib/palette';
import type { ActiviteEleve } from '../../api/_lib/eleve';

const activite: ActiviteEleve = {
  id: 'act1',
  consigne: 'Écrire trois phrases sur mon animal.',
  contraintes: {},
  itemIds: [],
  principeIds: [],
  categories: [],
  aides: [],
  aidesRetirees: [],
  banqueMots: [],
  principesPerso: [],
};

beforeEach(() => localStorage.clear());

function afficher() {
  return render(<EcranEleve activite={activite} eleveId="el1" jeton="j" api={{ sauver: vi.fn(async () => ({ version: 1, aides: [] })) }} delaiSauvegardeMs={0} />);
}

describe('Accueil en tuiles colorées', () => {
  test('les deux entrées sont de grandes tuiles aux couleurs de la palette', () => {
    render(
      <MemoryRouter>
        <Accueil />
      </MemoryRouter>,
    );
    const eleve = screen.getByRole('link', { name: /je suis élève/i });
    const enseignant = screen.getByRole('link', { name: /je suis enseignant/i });
    expect(eleve).toHaveClass('tuile');
    expect(eleve).toHaveStyle({ backgroundColor: PALETTE.eleve.fond, color: PALETTE.eleve.texte });
    expect(enseignant).toHaveStyle({ backgroundColor: PALETTE.enseignant.fond, color: PALETTE.enseignant.texte });
  });
});

describe('Écran élève en tuiles colorées', () => {
  test('quatre tuiles numérotées et nommées : la couleur n’est jamais seule', () => {
    afficher();
    const liste = screen.getByRole('list', { name: /les quatre temps/i });
    const tuiles = within(liste).getAllByRole('listitem');
    expect(tuiles.map((t) => t.textContent)).toEqual(['1 Réfléchir', '2 Écrire', '3 Relire', '4 Corriger']);
  });

  test('le temps en cours est plein et marqué ; les autres sont pâles', async () => {
    afficher();
    const liste = screen.getByRole('list', { name: /les quatre temps/i });
    const [t1, t2] = within(liste).getAllByRole('listitem');
    expect(t1).toHaveAttribute('aria-current', 'step');
    expect(t1).toHaveStyle({ backgroundColor: PALETTE.reflechir.fond, color: PALETTE.reflechir.texte });
    expect(t2).not.toHaveAttribute('aria-current');
    expect(t2).toHaveStyle({ backgroundColor: PALETTE.ecrire.pale });
    await userEvent.click(screen.getByRole('button', { name: /commencer à écrire/i }));
    expect(within(liste).getAllByRole('listitem')[1]).toHaveStyle({ backgroundColor: PALETTE.ecrire.fond });
  });

  test('chaque temps a sa zone teintée de la couleur du temps', async () => {
    const { container } = afficher();
    expect(container.querySelector('[data-phase="reflechir"]')).toHaveStyle({ backgroundColor: PALETTE.reflechir.pale });
    await userEvent.click(screen.getByRole('button', { name: /commencer à écrire/i }));
    expect(container.querySelector('[data-phase="ecrire"]')).toHaveStyle({ backgroundColor: PALETTE.ecrire.pale });
  });

  test('les boutons d’action sont de grosses tuiles', () => {
    afficher();
    expect(screen.getByRole('button', { name: /commencer à écrire/i })).toHaveClass('tuile');
  });
});
