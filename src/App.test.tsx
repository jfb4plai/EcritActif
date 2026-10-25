import { render, screen } from '@testing-library/react';
import { describe, expect, test } from 'vitest';
import App from './App';

describe('App : branding PLAI', () => {
  test('le logo a une hauteur de 32px et aucune largeur carrée', () => {
    render(<App />);
    const logo = screen.getByRole('img', { name: /PLAI/i });
    expect(logo.style.height).toBe('32px');
    expect(logo.getAttribute('width')).not.toBe('32');
  });

  test('la page a une navigation et un pied de page', () => {
    const { container } = render(<App />);
    expect(container.querySelector('nav')).not.toBeNull();
    expect(container.querySelector('footer')).not.toBeNull();
  });
});
