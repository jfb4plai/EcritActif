import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, test } from 'vitest';
import App from './App';

function afficher(chemin = '/') {
  return render(
    <MemoryRouter initialEntries={[chemin]}>
      <App />
    </MemoryRouter>,
  );
}

describe('App : branding PLAI', () => {
  test('le logo a une hauteur de 32px et aucune largeur carrée', () => {
    afficher();
    const logo = screen.getByRole('img', { name: /PLAI/i });
    expect(logo.style.height).toBe('32px');
    expect(logo.getAttribute('width')).not.toBe('32');
  });

  test('la page a une navigation et un pied de page', () => {
    const { container } = afficher();
    expect(container.querySelector('nav')).not.toBeNull();
    expect(container.querySelector('footer')).not.toBeNull();
  });
});

describe('App : routes', () => {
  test('l’accueil propose les deux entrées', () => {
    afficher('/');
    expect(screen.getByRole('link', { name: /je suis élève/i })).toHaveAttribute('href', '/eleve');
    expect(screen.getByRole('link', { name: /je suis enseignant/i })).toHaveAttribute('href', '/enseignant');
  });

  test('l’accueil dit pour quel programme l’app est faite', () => {
    afficher('/');
    expect(screen.getByText(/programme CECP de l.enseignement primaire en Fédération Wallonie-Bruxelles/i)).toBeInTheDocument();
  });

  test('la page À propos décrit l’ancrage dans le programme de la Fédération Wallonie-Bruxelles', () => {
    afficher('/apropos');
    expect(screen.getByRole('heading', { name: /ancrage dans le programme de la fédération wallonie-bruxelles/i })).toBeInTheDocument();
    expect(screen.getByText(/P3_Montage_10-12-2024_INT\.pdf/)).toBeInTheDocument();
    expect(screen.getByText(/planification/i)).toBeInTheDocument();
    expect(screen.getByText(/F282/)).toBeInTheDocument();
    expect(screen.getByText(/cité tel quel/i)).toBeInTheDocument();
  });

  test('la page À propos cite aussi le référentiel du tronc commun et ses composantes de l’écrit par année', () => {
    afficher('/apropos');
    expect(screen.getByText(/Référentiel de français et langues anciennes/)).toBeInTheDocument();
    expect(screen.getByText(/En P1, le référentiel nomme trois composantes/i)).toBeInTheDocument();
    expect(screen.getByText(/la correction s’ajoute en P2/i)).toBeInTheDocument();
  });

  test('la page À propos mentionne la licence GPL-3.0', () => {
    afficher('/apropos');
    expect(screen.getByText(/GPL-3\.0/)).toBeInTheDocument();
  });

  test('la page À propos présente les quatre compétences de la littératie à la rétroaction, avec leur source', () => {
    afficher('/apropos');
    for (const c of [/comprendre la rétroaction/i, /porter un jugement/i, /gérer ses émotions/i, /agir après/i]) {
      expect(screen.getByText(c)).toBeInTheDocument();
    }
    expect(screen.getByText(/Hausman/)).toBeInTheDocument();
    expect(screen.queryByText(/pas encore travaillée/i)).not.toBeInTheDocument();
    expect(screen.getByText(/gérer ses émotions/i)).toHaveTextContent(/essai avec des élèves à faire/i);
    expect(screen.getByText(/Carless et Boud/)).toBeInTheDocument();
  });

  test('la page élève demande les deux codes avec leur aide', () => {
    afficher('/eleve');
    for (const nom of [/code de la classe/i, /mon code/i]) {
      const champ = screen.getByLabelText(nom);
      expect(champ.getAttribute('placeholder')).toBeTruthy();
      expect(document.getElementById(champ.getAttribute('aria-describedby') as string)?.textContent?.length).toBeGreaterThan(10);
    }
  });
});
