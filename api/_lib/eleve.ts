import { resoudreAides, type AideActive, type AideId } from '../../src/lib/aides.js';
import type { CategorieErreur, Contraintes } from '../../src/lib/retour.js';
import { chasseVersEleve, type ChasseBrute, type ChasseEleve } from '../../src/lib/chasse.js';
import type { Annee, AutoEvaluation, Phase } from '../../src/types.js';
import { signerJeton, verifierJeton } from './session.js';

export interface ActiviteBrute {
  id: string;
  classeId: string;
  annee: Annee;
  consigne: string;
  contraintes: Contraintes;
  itemIds: string[];
  principeIds: string[];
  categories: CategorieErreur[];
  aidesRetirees: { id: AideId; raison: string }[];
  banqueMots: string[];
  principesPerso: { phase: Phase; question: string }[];
  // Atelier de raisonnement grammatical (P4 à P6), activé par l'enseignant pour cette activité.
  atelier: boolean;
  // Option pédagogique : noms et pronoms de Grammaire 3D pour les fonctions de l'atelier.
  grammaire3d: boolean;
  // Chasse aux erreurs : texte et corrigé de l'enseignant (jamais envoyés tels quels à l'élève).
  chasse: ChasseBrute | null;
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
  dernierTexte(eleveId: string, activiteId: string): Promise<{ texte: string; version: number; phase: string } | null>;
  tracer(eleveId: string, activiteId: string, phase: string, evenements: string[]): Promise<void>;
  enregistrer(t: { activiteId: string; eleveId: string; version: number; texte: string; phase: string; evenements: string[]; autoEvaluation?: AutoEvaluation }): Promise<void>;
}

export interface ActiviteEleve {
  id: string;
  // Niveau de l'activité : les messages de l'écran élève suivent le vocabulaire du programme de cette année.
  annee: Annee;
  consigne: string;
  contraintes: Contraintes;
  itemIds: string[];
  principeIds: string[];
  categories: CategorieErreur[];
  aides: AideActive[];
  // Nécessaire côté client : l'élève peut activer d'autres aides, qui doivent respecter les retraits de l'enseignant.
  aidesRetirees: { id: AideId; raison: string }[];
  // Apports propres à l'enseignant : ses mots utiles et ses questions s'ajoutent aux questions fixes.
  banqueMots: string[];
  principesPerso: { phase: Phase; question: string }[];
  atelier: boolean;
  grammaire3d?: boolean;
  // Texte à corriger et nombre d'erreurs ; le corrigé reste côté serveur.
  chasse?: ChasseEleve | null;
  // Dernier texte enregistré de cet élève : permet de reprendre sur un autre appareil et de ne pas écraser un texte rendu.
  reprise?: { texte: string; version: number; phase: string };
}

export type Reponse<T> = { status: 200; corps: T } | { status: 400 | 401 | 404 | 413 | 429; corps: { erreur: string } };

export const erreur = (status: 400 | 401 | 404 | 413, message: string): Reponse<never> => ({ status, corps: { erreur: message } });

const PHASES = ['reflechir', 'ecrire', 'relire', 'corriger', 'rendu'];
export const TEXTE_MAX = 20_000;
// Un événement de trace est court (un identifiant, au plus la justification de l'atelier) : jamais un texte entier.
export const EVENEMENT_MAX = 300;

function court(x: unknown, max: number): x is string {
  return typeof x === 'string' && x.length <= max;
}

// null = invalide ; undefined = absente.
function lireAutoEvaluation(x: unknown): AutoEvaluation | null | undefined {
  if (x === undefined) return undefined;
  const o = enObjet(x);
  if (!o || !Array.isArray(o.etoiles) || o.etoiles.length > 2 || !o.etoiles.every((e) => court(e, 200))) return null;
  if (!court(o.souhait, 200)) return null;
  if (o.change !== undefined && !court(o.change, 300)) return null;
  return { etoiles: o.etoiles as string[], souhait: o.souhait, ...(o.change !== undefined ? { change: o.change as string } : {}) };
}

export function enObjet(x: unknown): Record<string, unknown> | null {
  return typeof x === 'object' && x !== null ? (x as Record<string, unknown>) : null;
}

function versEleve(a: ActiviteBrute, eleve: EleveBrut, reprise: { texte: string; version: number; phase: string } | null): ActiviteEleve {
  return {
    id: a.id,
    annee: a.annee,
    consigne: a.consigne,
    contraintes: a.contraintes,
    itemIds: a.itemIds,
    principeIds: a.principeIds,
    categories: a.categories,
    aides: resoudreAides(eleve.aides, a.aidesRetirees),
    aidesRetirees: a.aidesRetirees,
    banqueMots: a.banqueMots,
    principesPerso: a.principesPerso,
    atelier: a.atelier,
    grammaire3d: a.grammaire3d,
    chasse: a.chasse ? chasseVersEleve(a.chasse) : null,
    ...(reprise ? { reprise } : {}),
  };
}

export async function ouvrirEleve(depot: Depot, secret: string, body: unknown): Promise<Reponse<{ jeton: string; eleveId: string; activites: ActiviteEleve[] }>> {
  const b = enObjet(body);
  if (!b || typeof b.codeClasse !== 'string' || typeof b.codeEleve !== 'string') return erreur(400, 'Demande incomplète');
  const classe = await depot.classeParCode(b.codeClasse.trim().toUpperCase());
  const eleve = classe ? await depot.eleveParCode(classe.id, b.codeEleve.trim().toUpperCase()) : null;
  // Même réponse pour une classe inconnue et un élève inconnu : pas d'énumération des codes.
  if (!classe || !eleve) return erreur(404, 'Code inconnu');
  const activites = await depot.activites(classe.id);
  const reprises = await Promise.all(activites.map((a) => depot.dernierTexte(eleve.id, a.id)));
  return {
    status: 200,
    corps: {
      jeton: signerJeton({ eleveId: eleve.id, classeId: classe.id }, secret),
      eleveId: eleve.id,
      activites: activites.map((a, i) => versEleve(a, eleve, reprises[i])),
    },
  };
}

export async function sauverTexte(depot: Depot, secret: string, body: unknown): Promise<Reponse<{ version: number; aides: AideActive[]; aidesRetirees: { id: AideId; raison: string }[] }>> {
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
  const auto = lireAutoEvaluation(b.autoEvaluation);
  if (auto === null) return erreur(400, 'Demande incomplète');
  const session = verifierJeton(b.jeton, secret);
  if (!session) return erreur(401, 'Session expirée');
  if (b.texte.length > TEXTE_MAX) return erreur(413, 'Texte trop long');
  const activite = await depot.activite(b.activiteId);
  const eleve = await depot.eleve(session.eleveId);
  if (!activite || !eleve || activite.classeId !== session.classeId) return erreur(404, 'Activité inconnue');
  const evenements = b.evenements.filter((e): e is string => typeof e === 'string').map((e) => e.slice(0, EVENEMENT_MAX)).slice(0, 50);
  await depot.enregistrer({ activiteId: activite.id, eleveId: eleve.id, version: b.version as number, texte: b.texte, phase: b.phase, evenements, ...(auto ? { autoEvaluation: auto } : {}) });
  return { status: 200, corps: { version: b.version as number, aides: resoudreAides(eleve.aides, activite.aidesRetirees), aidesRetirees: activite.aidesRetirees } };
}
