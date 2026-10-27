import type { LigneEleve } from '../pages/Tableau';
import type { AutoEvaluation, Phase } from '../types';
import { motsFautifs, type Contraintes } from './retour';

export interface ProductionEleve {
  activiteId: string;
  consigne: string;
  version: number;
  // Texte au premier enregistrement après « écrire » ; absent pour les textes écrits avant les instantanés.
  premierJet?: string;
  // Dernier texte enregistré (version finale si l'élève a rendu).
  final: string;
  rendu: boolean;
  // Contrainte de lettre de l'activité, contrôlée sur le texte final ; null si l'activité n'en a pas.
  contrainte: { respectee: boolean; mots: string[] } | null;
}

export function construireLignes(
  eleves: { id: string; code: string; aides?: string[] }[],
  activites: { id: string; itemIds: string[]; consigne?: string; contraintes?: Contraintes }[],
  textes: { eleveId: string; activiteId: string; version: number; phase: string; updatedAt: string; autoEvaluation?: AutoEvaluation; texte?: string }[],
  traces: { eleveId: string; evenement: string }[],
  instantanes: { eleveId: string; activiteId: string; version: number; moment: string; texte: string }[] = [],
): LigneEleve[] {
  return eleves.map((e) => {
    const siennes = traces.filter((t) => t.eleveId === e.id);
    const siens = textes.filter((t) => t.eleveId === e.id);
    // Le texte le plus récemment modifié (toutes activités confondues), pas la version la plus haute.
    const dernier = siens.reduce<(typeof siens)[number] | null>((m, t) => (m === null || t.updatedAt > m.updatedAt ? t : m), null);
    const ecrites = new Set(siens.map((t) => t.activiteId));
    const items = [...new Set(activites.filter((a) => ecrites.has(a.id)).flatMap((a) => a.itemIds))];
    const aides = [...new Set(traces.filter((t) => t.eleveId === e.id && t.evenement.startsWith('aide:')).map((t) => t.evenement.slice(5)))];
    // Une production par activité : la version la plus haute, avec son premier jet.
    const productions: ProductionEleve[] = [];
    for (const a of activites) {
      const versions = siens.filter((t) => t.activiteId === a.id && t.texte !== undefined);
      const haute = versions.reduce<(typeof versions)[number] | null>((m, t) => (m === null || t.version > m.version ? t : m), null);
      if (!haute) continue;
      const premierJet = instantanes.find((i) => i.eleveId === e.id && i.activiteId === a.id && i.version === haute.version && i.moment === 'premier-jet')?.texte;
      const jeu = a.contraintes && (a.contraintes.initiale || a.contraintes.lettreInterdite);
      const fautifs = jeu ? [...new Set(motsFautifs(haute.texte!, a.contraintes!).map((f) => f.mot))] : [];
      productions.push({
        activiteId: a.id,
        consigne: a.consigne ?? '',
        version: haute.version,
        ...(premierJet !== undefined ? { premierJet } : {}),
        final: haute.texte!,
        rendu: haute.phase === 'rendu',
        contrainte: jeu ? { respectee: fautifs.length === 0, mots: fautifs } : null,
      });
    }
    return {
      productions,
      id: e.id,
      code: e.code,
      dernierePhase: (dernier?.phase as Phase | 'rendu' | undefined) ?? null,
      versions: dernier?.version ?? 0,
      clarifications: traces.filter((t) => t.eleveId === e.id && t.evenement.startsWith('clarification:')).length,
      autoEvaluation: dernier?.autoEvaluation ?? null,
      aides,
      // Aides activées par l'enseignant pour cet élève (réglage de la classe), distinctes de celles que l'élève ajoute lui-même.
      aidesEnseignant: e.aides ?? [],
      itemsTravailles: items,
      chasse: {
        trouvees: new Set(siennes.filter((t) => /^chasse:essai:e\d+:trouve$/.test(t.evenement)).map((t) => t.evenement.split(':')[2])).size,
        indices: siennes.filter((t) => /^chasse:essai:e\d+:indice$/.test(t.evenement)).length,
        essais: siennes.filter((t) => t.evenement.startsWith('chasse:essai:')).length,
        justifications: siennes.filter((t) => t.evenement.startsWith('chasse:justification:')).map((t) => t.evenement.replace(/^chasse:justification:e\d+:/, '')),
      },
      atelier: {
        phrases: siennes.filter((t) => t.evenement.startsWith('atelier:phrase:')).length,
        pasSur: siennes.filter((t) => t.evenement === 'atelier:pas-sur').length,
        justifications: siennes.filter((t) => t.evenement.startsWith('atelier:justification:')).map((t) => t.evenement.slice('atelier:justification:'.length)),
      },
    };
  });
}
