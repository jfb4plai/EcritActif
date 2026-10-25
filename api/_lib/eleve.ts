import { resoudreAides, type AideActive, type AideId } from '../../src/lib/aides.js';
import type { CategorieErreur, Contraintes } from '../../src/lib/retour.js';
import { signerJeton, verifierJeton } from './session.js';

export interface ActiviteBrute {
  id: string;
  classeId: string;
  consigne: string;
  contraintes: Contraintes;
  itemIds: string[];
  principeIds: string[];
  categories: CategorieErreur[];
  aidesRetirees: { id: AideId; raison: string }[];
}

export interface EleveBrut {
  id: string;
  aides: AideId[];
}

export interface Depot {
  classeParCode(code: string): Promise<{ id: string } | null>;
  eleveParCode(classeId: string, code: string): Promise<EleveBrut | null>;
  eleve(id: string): Promise<EleveBrut | null>;
  activites(classeId: string): Promise<ActiviteBrute[]>;
  activite(id: string): Promise<ActiviteBrute | null>;
  enregistrer(t: { activiteId: string; eleveId: string; version: number; texte: string; phase: string; evenements: string[] }): Promise<void>;
}

export interface ActiviteEleve {
  id: string;
  consigne: string;
  contraintes: Contraintes;
  itemIds: string[];
  principeIds: string[];
  categories: CategorieErreur[];
  aides: AideActive[];
}

export type Reponse<T> = { status: 200; corps: T } | { status: 400 | 401 | 404 | 413 | 429; corps: { erreur: string } };

const erreur = (status: 400 | 401 | 404 | 413, message: string): Reponse<never> => ({ status, corps: { erreur: message } });

const PHASES = ['reflechir', 'ecrire', 'relire', 'corriger'];
export const TEXTE_MAX = 20_000;

function enObjet(x: unknown): Record<string, unknown> | null {
  return typeof x === 'object' && x !== null ? (x as Record<string, unknown>) : null;
}

function versEleve(a: ActiviteBrute, eleve: EleveBrut): ActiviteEleve {
  return {
    id: a.id,
    consigne: a.consigne,
    contraintes: a.contraintes,
    itemIds: a.itemIds,
    principeIds: a.principeIds,
    categories: a.categories,
    aides: resoudreAides(eleve.aides, a.aidesRetirees),
  };
}

export async function ouvrirEleve(depot: Depot, secret: string, body: unknown): Promise<Reponse<{ jeton: string; activites: ActiviteEleve[] }>> {
  const b = enObjet(body);
  if (!b || typeof b.codeClasse !== 'string' || typeof b.codeEleve !== 'string') return erreur(400, 'Demande incomplète');
  const classe = await depot.classeParCode(b.codeClasse.trim().toUpperCase());
  const eleve = classe ? await depot.eleveParCode(classe.id, b.codeEleve.trim().toUpperCase()) : null;
  // Même réponse pour une classe inconnue et un élève inconnu : pas d'énumération des codes.
  if (!classe || !eleve) return erreur(404, 'Code inconnu');
  const activites = await depot.activites(classe.id);
  return {
    status: 200,
    corps: { jeton: signerJeton({ eleveId: eleve.id, classeId: classe.id }, secret), activites: activites.map((a) => versEleve(a, eleve)) },
  };
}

export async function sauverTexte(depot: Depot, secret: string, body: unknown): Promise<Reponse<{ version: number; aides: AideActive[] }>> {
  const b = enObjet(body);
  if (
    !b ||
    typeof b.jeton !== 'string' ||
    typeof b.activiteId !== 'string' ||
    typeof b.texte !== 'string' ||
    typeof b.phase !== 'string' ||
    !PHASES.includes(b.phase) ||
    !Number.isInteger(b.version) ||
    (b.version as number) < 1 ||
    !Array.isArray(b.evenements)
  ) {
    return erreur(400, 'Demande incomplète');
  }
  const session = verifierJeton(b.jeton, secret);
  if (!session) return erreur(401, 'Session expirée');
  if (b.texte.length > TEXTE_MAX) return erreur(413, 'Texte trop long');
  const activite = await depot.activite(b.activiteId);
  const eleve = await depot.eleve(session.eleveId);
  if (!activite || !eleve || activite.classeId !== session.classeId) return erreur(404, 'Activité inconnue');
  const evenements = b.evenements.filter((e): e is string => typeof e === 'string').slice(0, 50);
  await depot.enregistrer({ activiteId: activite.id, eleveId: eleve.id, version: b.version as number, texte: b.texte, phase: b.phase, evenements });
  return { status: 200, corps: { version: b.version as number, aides: resoudreAides(eleve.aides, activite.aidesRetirees) } };
}
