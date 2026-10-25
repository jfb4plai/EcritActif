import type { ItemCecp } from '../types';

export type StatutItem = 'non-vu' | 'travaille' | 'valide';

// « valide » seulement quand tous les élèves de la liste ont été validés par l'enseignant :
// l'app ne déclare jamais seule qu'un item est acquis (spec §2, §4).
export function statutParItem(
  items: ItemCecp[],
  activites: { id: string; itemIds: string[] }[],
  validations: { eleveId: string; itemId: string }[],
  eleveIds: string[],
): Record<string, { statut: StatutItem; nbValides: number }> {
  const resultat: Record<string, { statut: StatutItem; nbValides: number }> = {};
  for (const item of items) {
    const nbValides = new Set(validations.filter((v) => v.itemId === item.id && eleveIds.includes(v.eleveId)).map((v) => v.eleveId)).size;
    const travaille = activites.some((a) => a.itemIds.includes(item.id));
    let statut: StatutItem = 'non-vu';
    if (eleveIds.length > 0 && nbValides === eleveIds.length) statut = 'valide';
    else if (travaille || nbValides > 0) statut = 'travaille';
    resultat[item.id] = { statut, nbValides };
  }
  return resultat;
}
