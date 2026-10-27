import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { describe, expect, test } from 'vitest';

// Vercel exécute les fonctions api/ en modules ES : chaque import relatif (hors types) doit se terminer par « .js ».
// Sans cela, la fonction échoue au chargement (FUNCTION_INVOCATION_FAILED) alors que les tests et le build passent.
// Incident du 2026-10-28 : src/lib/atelierPerso.ts importait './atelier' sans extension ; l'entrée des élèves a été en
// panne en ligne jusqu'à ce test.
const RACINE = process.cwd();

function pointsEntree(): string[] {
  const dossiers = [join(RACINE, 'api'), join(RACINE, 'api', 'eleve'), join(RACINE, 'api', '_lib')];
  return dossiers.flatMap((d) => (existsSync(d) ? readdirSync(d).filter((f) => f.endsWith('.ts') && !f.endsWith('.test.ts')).map((f) => join(d, f)) : []));
}

// Imports et réexportations qui existent à l'exécution (les « import type » sont effacés à la compilation).
function importsRelatifs(code: string): string[] {
  const trouves: string[] = [];
  for (const m of code.matchAll(/^(?:import|export)\s+([\s\S]*?)\s+from\s+['"](\.[^'"]*)['"]/gm)) {
    const clause = m[1].trim();
    if (/^type\s/.test(clause)) continue;
    trouves.push(m[2]);
  }
  return trouves;
}

function fichiersAtteints(): { fichier: string; specificateur: string }[] {
  const vus = new Set<string>();
  const fautes: { fichier: string; specificateur: string }[] = [];
  const pile = pointsEntree();
  while (pile.length > 0) {
    const f = pile.pop()!;
    if (vus.has(f)) continue;
    vus.add(f);
    for (const spec of importsRelatifs(readFileSync(f, 'utf-8'))) {
      if (!spec.endsWith('.js')) {
        fautes.push({ fichier: f.replace(RACINE, '').replace(/\\/g, '/'), specificateur: spec });
        continue;
      }
      const cible = resolve(dirname(f), spec.replace(/\.js$/, '.ts'));
      if (existsSync(cible)) pile.push(cible);
    }
  }
  return fautes;
}

describe('fonctions api/ : imports relatifs compatibles avec Node en modules ES', () => {
  test('il y a bien des fonctions à contrôler', () => {
    expect(pointsEntree().length).toBeGreaterThanOrEqual(6);
  });

  test('aucun import relatif, direct ou indirect, ne manque son extension .js', () => {
    expect(fichiersAtteints()).toEqual([]);
  });

  test('le contrôle repère bien un import sans extension (garde-fou du test lui-même)', () => {
    expect(importsRelatifs("import { a } from './x';\nimport type { B } from './y';\nexport { c } from './z.js';")).toEqual(['./x', './z.js']);
  });
});
