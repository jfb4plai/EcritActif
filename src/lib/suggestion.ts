import type { ItemCecp } from '../types';

const normaliser = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();

const mots = (s: string) => new Set(normaliser(s).match(/[a-z0-9]{4,}/g) ?? []);

// Recouvrement de mots (4 lettres et plus) entre la consigne et le texte de l'item ; sans IA.
export function suggererItems(consigne: string, items: ItemCecp[], max = 5): ItemCecp[] {
  const voulus = mots(consigne);
  if (voulus.size === 0) return [];
  return items
    .map((item) => {
      const dispo = mots([item.contenu, ...item.attendus].join(' '));
      let score = 0;
      for (const m of voulus) if (dispo.has(m)) score++;
      return { item, score };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, max)
    .map((x) => x.item);
}
