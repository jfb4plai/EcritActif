import type { LigneEleve } from '../pages/Tableau';
import type { Phase } from '../types';

export function construireLignes(
  eleves: { id: string; code: string }[],
  activites: { id: string; itemIds: string[] }[],
  textes: { eleveId: string; activiteId: string; version: number; phase: string; updatedAt: string }[],
  traces: { eleveId: string; evenement: string }[],
): LigneEleve[] {
  return eleves.map((e) => {
    const siens = textes.filter((t) => t.eleveId === e.id);
    // Le texte le plus récemment modifié (toutes activités confondues), pas la version la plus haute.
    const dernier = siens.reduce<(typeof siens)[number] | null>((m, t) => (m === null || t.updatedAt > m.updatedAt ? t : m), null);
    const ecrites = new Set(siens.map((t) => t.activiteId));
    const items = [...new Set(activites.filter((a) => ecrites.has(a.id)).flatMap((a) => a.itemIds))];
    const aides = [...new Set(traces.filter((t) => t.eleveId === e.id && t.evenement.startsWith('aide:')).map((t) => t.evenement.slice(5)))];
    return {
      id: e.id,
      code: e.code,
      dernierePhase: (dernier?.phase as Phase | 'rendu' | undefined) ?? null,
      versions: dernier?.version ?? 0,
      aides,
      itemsTravailles: items,
    };
  });
}
