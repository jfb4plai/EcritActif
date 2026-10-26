import donnees from '../data/cecp-ecrire.json';
import type { Annee, ItemCecp } from '../types';

const TOUS = donnees as ItemCecp[];

export function itemsParAnnee(a: Annee): ItemCecp[] {
  return TOUS.filter((i) => i.annee === a);
}

export function itemParId(id: string): ItemCecp | undefined {
  return TOUS.find((i) => i.id === id);
}

export function itemParCode(code: string): ItemCecp | undefined {
  return TOUS.find((i) => i.codes.includes(code));
}
