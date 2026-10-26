// Palette « Pop en tuiles colorées » : couleurs franches pour les quatre temps, lisibles (contraste vérifié par test).
// La couleur n'est jamais seule : chaque tuile porte aussi un numéro et un nom.
export const TEXTE_SOMBRE = '#1a1814';

export interface Tuile {
  fond: string; // tuile pleine
  texte: string; // texte sur la tuile pleine
  pale: string; // tuile non active, texte sombre dessus
}

export const PALETTE = {
  reflechir: { fond: '#5b3fa0', texte: '#ffffff', pale: '#ece6f9' },
  ecrire: { fond: '#0f6e56', texte: '#ffffff', pale: '#e1f5ee' },
  relire: { fond: '#f59e0b', texte: '#1a1814', pale: '#fff1d0' },
  corriger: { fond: '#1d4ed8', texte: '#ffffff', pale: '#e0e9ff' },
  eleve: { fond: '#be185d', texte: '#ffffff', pale: '#fde7f1' },
  enseignant: { fond: '#334155', texte: '#ffffff', pale: '#e8edf3' },
} satisfies Record<string, Tuile>;

function luminance(hex: string): number {
  const n = parseInt(hex.slice(1), 16);
  const canaux = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * canaux[0] + 0.7152 * canaux[1] + 0.0722 * canaux[2];
}

export function contraste(a: string, b: string): number {
  const [haut, bas] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (haut + 0.05) / (bas + 0.05);
}
