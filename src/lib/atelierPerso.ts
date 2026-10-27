import { toutesLesDemarches, type Demarche, type Etape } from './atelier';

// « Ma formulation » : l'enseignant remplace les consignes de l'application, étape par étape, par ses propres mots
// (son vocabulaire, ses gestes, ses couleurs). L'élève voit sa version. Le contrôle de vocabulaire ne s'applique pas à ce
// texte : c'est la singularité de l'enseignant. Les rappels de règle de l'application, eux, ne sont pas remplacés.
export type AtelierPerso = Record<string, Record<string, string[]>>;

export const PERSO_LIGNES_MAX = 6;
export const PERSO_LONGUEUR_MAX = 200;

function lignesValides(x: unknown): string[] {
  if (!Array.isArray(x)) return [];
  return x
    .filter((l): l is string => typeof l === 'string')
    .map((l) => l.trim().slice(0, PERSO_LONGUEUR_MAX))
    .filter((l) => l !== '')
    .slice(0, PERSO_LIGNES_MAX);
}

const connues = () => {
  const m = new Map<string, Set<string>>();
  for (const d of toutesLesDemarches()) m.set(d.id, new Set([...(m.get(d.id) ?? []), ...d.etapes.map((e) => e.id)]));
  return m;
};

// Ce qui sort de la base est inconnu : on ne garde que des démarches et étapes qui existent, et du texte court.
export function nettoyerPerso(x: unknown): AtelierPerso {
  const sortie: AtelierPerso = {};
  if (typeof x !== 'object' || x === null || Array.isArray(x)) return sortie;
  const etapesConnues = connues();
  for (const [idDemarche, etapes] of Object.entries(x as Record<string, unknown>)) {
    const autorisees = etapesConnues.get(idDemarche);
    if (!autorisees || typeof etapes !== 'object' || etapes === null || Array.isArray(etapes)) continue;
    const propres: Record<string, string[]> = {};
    for (const [idEtape, lignes] of Object.entries(etapes as Record<string, unknown>)) {
      if (!autorisees.has(idEtape)) continue;
      const l = lignesValides(lignes);
      if (l.length > 0) propres[idEtape] = l;
    }
    if (Object.keys(propres).length > 0) sortie[idDemarche] = propres;
  }
  return sortie;
}

export function consignesPour(d: Demarche, e: Etape, perso?: AtelierPerso): { consignes: string[]; perso: boolean } {
  const siennes = perso?.[d.id]?.[e.id];
  return siennes && siennes.length > 0 ? { consignes: siennes, perso: true } : { consignes: e.consignes, perso: false };
}

// Saisie du formulaire : { 'démarche/étape': 'une consigne par ligne' }.
export function persoDepuisTextes(textes: Record<string, string>): AtelierPerso {
  // Objets sans prototype : une clé comme « __proto__ » ne peut rien polluer.
  const brut: Record<string, Record<string, string[]>> = Object.create(null);
  for (const [cle, texte] of Object.entries(textes)) {
    const [d, e] = cle.split('/');
    if (!d || !e) continue;
    (brut[d] ??= Object.create(null))[e] = texte.split('\n');
  }
  return nettoyerPerso(brut);
}
