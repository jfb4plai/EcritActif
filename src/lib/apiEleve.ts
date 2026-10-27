import type { ActiviteEleve } from '../../api/_lib/eleve';
import type { ApiEleve } from '../pages/EcranEleve';

async function appeler<T>(chemin: string, corps: unknown): Promise<T> {
  const SANS_REPONSE = 'Le serveur ne répond pas. Réessaie dans un moment.';
  let r: Response;
  let donnees: unknown;
  try {
    r = await fetch(chemin, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(corps) });
    donnees = await r.json();
  } catch {
    // Réseau coupé ou réponse qui n'est pas du JSON (page d'erreur) : jamais de message technique pour un enfant.
    throw new Error(SANS_REPONSE);
  }
  if (!r.ok) throw new Error((donnees as { erreur?: string }).erreur ?? 'Une erreur est survenue.');
  return donnees as T;
}

export function ouvrirSession(codeClasse: string, codeEleve: string): Promise<{ jeton: string; eleveId: string; activites: ActiviteEleve[] }> {
  return appeler('/api/eleve/ouvrir', { codeClasse: codeClasse.trim().toUpperCase(), codeEleve: codeEleve.trim().toUpperCase() });
}

export const apiEleve: ApiEleve = {
  sauver: (p) => appeler('/api/eleve/sauver', p),
  chasse: (p) => appeler('/api/eleve/chasse', p),
};
