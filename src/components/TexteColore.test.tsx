import { render } from '@testing-library/react';
import { beforeAll, describe, expect, test } from 'vitest';
import TexteColore from './TexteColore';
import APropos from '../pages/APropos';
import { chargerColorisation } from '../lib/colorisation';
import { ATTRIBUTION_ARASAAC } from '../lib/pictos';

describe('TexteColore', () => {
  beforeAll(async () => {
    await chargerColorisation();
  });

  test('le texte affiché reste identique au texte d’origine', () => {
    const texte = 'Les petits chapeaux dorment.';
    const { container } = render(<TexteColore texte={texte} mode="syllabes" />);
    expect(container.textContent).toBe(texte);
  });

  test('des parties du texte sont colorées', () => {
    const { container } = render(<TexteColore texte="chapeau" mode="voyelles-consonnes" />);
    expect(container.querySelectorAll('span[style*="color"]').length).toBeGreaterThan(0);
  });

  test('texte vide : rien à afficher, pas d’erreur', () => {
    const { container } = render(<TexteColore texte="" mode="phonemes" />);
    expect(container.textContent).toBe('');
  });
});

describe('À propos : licences et crédits', () => {
  test('mentionne GPL-3.0, Pierre-Alain Etique, LireCouleur et l’attribution ARASAAC', () => {
    const { container } = render(<APropos />);
    const t = container.textContent ?? '';
    expect(t).toContain('GPL-3.0');
    expect(t).toContain('Pierre-Alain Etique');
    expect(t).toContain('LireCouleur');
    expect(t).toContain(ATTRIBUTION_ARASAAC);
  });
});
