import type { ActiviteEleve } from '../../api/_lib/eleve';
import type { ApiEleve } from '../pages/EcranEleve';

async function appeler<T>(chemin: string, corps: unknown): Promise<T> {
  const r = await fetch(chemin, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(corps) });
  const donnees = await r.json();
  if (!r.ok) throw new Error((donnees as { erreur?: string }).erreur ?? 'Une erreur est survenue.');
  return donnees as T;
}

export function ouvrirSession(codeClasse: string, codeEleve: string): Promise<{ jeton: string; activites: ActiviteEleve[] }> {
  return appeler('/api/eleve/ouvrir', { codeClasse: codeClasse.trim().toUpperCase(), codeEleve: codeEleve.trim().toUpperCase() });
}

export const apiEleve: ApiEleve = {
  sauver: (p) => appeler('/api/eleve/sauver', p),
};
