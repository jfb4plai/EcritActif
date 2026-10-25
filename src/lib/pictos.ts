// Pictogrammes ARASAAC. Recherche par mot : constatée le 2026-10-25 sur
// https://api.arasaac.org/v1/pictograms/fr/search/{mot} (tableau JSON avec _id) ;
// image : https://static.arasaac.org/pictograms/{id}/{id}_300.png.
// Licence CC BY-NC-SA : attribution obligatoire, texte officiel ci-dessous (arasaac.org/terms-of-use).
export const ATTRIBUTION_ARASAAC =
  'Auteur des pictogrammes : Sergio Palao. Origine : ARASAAC (http://www.arasaac.org). Licence : CC (BY-NC-SA). Propriétaire : Gouvernement d’Aragon (Espagne)';

const cache = new Map<string, string | null>();

export async function urlPicto(mot: string): Promise<string | null> {
  const cle = mot.trim().toLowerCase();
  if (cle === '') return null;
  if (cache.has(cle)) return cache.get(cle) ?? null;
  try {
    const r = await fetch(`https://api.arasaac.org/v1/pictograms/fr/search/${encodeURIComponent(cle)}`);
    if (!r.ok) return null;
    const liste = (await r.json()) as { _id: number }[];
    const url = liste.length > 0 ? `https://static.arasaac.org/pictograms/${liste[0]._id}/${liste[0]._id}_300.png` : null;
    cache.set(cle, url);
    return url;
  } catch {
    return null;
  }
}
