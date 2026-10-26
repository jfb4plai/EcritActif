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
