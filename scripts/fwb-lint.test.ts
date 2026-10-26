import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, test } from 'vitest';

// Singularité de l'app : l'ancrage dans la Fédération Wallonie-Bruxelles et le programme CECP.
// Aucun mot de l'école française dans ce que lit l'élève ou l'enseignant (les commentaires de code sont ignorés).
const RACINE = join(process.cwd(), 'src');
const IGNORES = [/\.test\./, /[\\/]data[\\/]/, /[\\/]vendor[\\/]/, /vite-env/];

function fichiers(dossier: string): string[] {
  return readdirSync(dossier).flatMap((nom) => {
    const chemin = join(dossier, nom);
    if (statSync(chemin).isDirectory()) return fichiers(chemin);
    return /\.(ts|tsx)$/.test(nom) && !IGNORES.some((r) => r.test(chemin)) ? [chemin] : [];
  });
}

const sansCommentaires = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '').replace(/\s\/\/ .*$/gm, '');

const INTERDITS: { motif: RegExp; pourquoi: string }[] = [
  { motif: /collège|lycée/i, pourquoi: 'écoles françaises : en FWB on dit école primaire ou secondaire' },
  { motif: /\b(CP|CE1|CE2|CM1|CM2)\b/, pourquoi: 'niveaux français : en FWB P1 à P6' },
  { motif: /cycle [23]\b/i, pourquoi: 'cycles français' },
  { motif: /éducation nationale|eduscol/i, pourquoi: 'institution française' },
  { motif: /\b(GAR|ENT)\b/, pourquoi: 'dispositifs français de connexion' },
];

describe('ancrage FWB : aucun repère de l’école française dans l’interface', () => {
  const liste = fichiers(RACINE);

  test('des fichiers sont bien analysés', () => {
    expect(liste.length).toBeGreaterThan(10);
  });

  test.each(INTERDITS.map((i) => [i.pourquoi, i.motif] as const))('%s', (_pourquoi, motif) => {
    for (const f of liste) {
      const texte = sansCommentaires(readFileSync(f, 'utf-8'));
      expect(texte, f).not.toMatch(motif);
    }
  });

  test('les principes fixes ne contiennent aucun repère français', () => {
    const principes = readFileSync(join(RACINE, 'data', 'principes.json'), 'utf-8');
    for (const { motif } of INTERDITS) expect(principes).not.toMatch(motif);
  });
});
