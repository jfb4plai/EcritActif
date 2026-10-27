import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, test } from 'vitest';

// Sous jsdom, import.meta.url n'est pas une URL file: ; vitest se lance toujours à la racine du projet.
const DOSSIER = join(process.cwd(), 'supabase', 'migrations') + '/';
const fichiers = readdirSync(DOSSIER).filter((f) => f.endsWith('.sql'));

describe('migrations SQL ecrit_', () => {
  test('au moins une migration', () => {
    expect(fichiers.length).toBeGreaterThan(0);
  });

  for (const f of fichiers) {
    const sql = readFileSync(DOSSIER + f, 'utf-8').toLowerCase();
    const tables = [...sql.matchAll(/create table (?:if not exists )?public\.([a-z_]+)/g)].map((m) => m[1]);

    test(`${f} : chaque table est préfixée ecrit_`, () => {
      for (const t of tables) expect(t.startsWith('ecrit_'), t).toBe(true);
    });

    test(`${f} : RLS actif et grants pour authenticated et service_role`, () => {
      for (const t of tables) {
        expect(sql, `rls ${t}`).toContain(`alter table public.${t} enable row level security`);
        expect(sql, `grant authenticated ${t}`).toMatch(new RegExp(`grant [a-z, ]+ on public\\.${t} to authenticated`));
        expect(sql, `grant service_role ${t}`).toMatch(new RegExp(`grant [a-z, ]+ on public\\.${t} to service_role`));
      }
    });

    test(`${f} : aucun nom d’élève, aucune politique avec EXISTS auto-joint`, () => {
      expect(sql).not.toMatch(/nom_eleve|prenom|diagnostic/);
      const politiques = sql.split('create policy').slice(1);
      for (const p of politiques) expect(p.split(';')[0]).not.toMatch(/exists\s*\(/);
    });

    test(`${f} : la contrainte d’année ne laisse que P1 à P6`, () => {
      const contraintes = [...sql.matchAll(/annee in \(([^)]*)\)/g)].map((m) => m[1].replace(/\s/g, ''));
      for (const c of contraintes) expect(["'p1','p2','p3'", "'p1','p2','p3','p4','p5','p6'"]).toContain(c);
      expect(contraintes.length).toBeGreaterThan(0);
    });

    test(`${f} : ne recrée ni profiles ni le trigger updated_at`, () => {
      expect(sql).not.toMatch(/create table (?:if not exists )?public\.profiles/);
      expect(sql).not.toMatch(/create (?:or replace )?function[^;]*updated_at/);
    });
  }
});

describe('migrations SQL ecrit_ : état final', () => {
  test('après toutes les migrations, une activité peut être de P1 à P6', () => {
    const tout = fichiers.map((f) => readFileSync(DOSSIER + f, 'utf-8').toLowerCase()).join('\n');
    expect(tout).toMatch(/drop constraint (?:if exists )?ecrit_activites_annee_check/);
    expect(tout).toMatch(/add constraint ecrit_activites_annee_check\s+check \(annee in \('p1', 'p2', 'p3', 'p4', 'p5', 'p6'\)\)/);
  });
});
