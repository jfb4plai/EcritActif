import referentiel from '../data/referentiel-ecrire.json';
import sources from '../data/cecp-sources.json';
import type { Annee, Phase } from '../types';

// Deux textes officiels, combinés : le référentiel de français du tronc commun (ce que l'élève doit pouvoir faire à l'écrit,
// palier de scripteur) et le programme CECP (les items découpés par année, avec leurs codes). Les données viennent de
// referentiels-fwb ; leur texte est cité tel quel (scripts/build-referentiel.mjs et scripts/build-cecp.mjs).
export const PROGRAMME = 'Programme d’études de l’enseignement primaire (CECP, Wallonie-Bruxelles Enseignement)';
export const REFERENTIEL = 'Référentiel de français et langues anciennes (tronc commun, Fédération Wallonie-Bruxelles)';

// Les quatre temps de l'app reprennent les composantes de la production d'écrit nommées par le programme (F282, P3)
// et par le référentiel (la correction n'y est nommée qu'à partir de P2).
export const TEMPS_CECP: Record<Phase, { terme: string; code: string }> = {
  reflechir: { terme: 'planification', code: 'F282' },
  ecrire: { terme: 'mise en texte', code: 'F282' },
  relire: { terme: 'révision', code: 'F282' },
  corriger: { terme: 'correction', code: 'F282' },
};

export interface SourceCecp {
  pdf: string;
  extraitLe: string;
}
export const SOURCES_CECP = sources as Record<Annee, SourceCecp>;

export interface RepereReferentiel {
  pages: string;
  palierScripteur: string;
  formesCorrectes: number | null;
  composantes: string[];
  attenduEcrire: string;
}
export const REFERENTIEL_ANNEE = referentiel as Record<Annee, RepereReferentiel>;
