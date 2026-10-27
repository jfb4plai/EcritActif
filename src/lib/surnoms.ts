// Surnoms facultatifs que l'enseignant associe aux codes de ses élèves.
// Ils sont mémorisés dans le navigateur de l'enseignant seulement : ni envoyés au serveur, ni conservés par l'application.
// L'application ne connaît pas le nom des élèves. Un surnom relié à un code reste une donnée personnelle (RGPD) dont
// l'enseignant est responsable ; l'avertissement affiché à l'écran le dit.
export const SURNOM_MAX = 30;

const cle = (classeId: string) => `ecrit:surnoms:${classeId}`;
const CODE = /^[A-Z0-9]{6}$/;

export function lireSurnoms(classeId: string): Record<string, string> {
  const sortie: Record<string, string> = Object.create(null);
  try {
    const brut = JSON.parse(localStorage.getItem(cle(classeId)) ?? '{}');
    if (typeof brut !== 'object' || brut === null || Array.isArray(brut)) return { ...sortie };
    for (const [code, surnom] of Object.entries(brut)) {
      if (CODE.test(code) && typeof surnom === 'string' && surnom.trim() !== '') sortie[code] = surnom.slice(0, SURNOM_MAX);
    }
  } catch {
    /* stockage indisponible ou contenu abîmé : aucun surnom */
  }
  return { ...sortie };
}

// Renvoie false si le surnom n'a pas pu être mémorisé (code invalide, stockage bloqué).
export function ecrireSurnom(classeId: string, code: string, surnom: string): boolean {
  if (!CODE.test(code)) return false;
  const tous = lireSurnoms(classeId);
  const propre = surnom.trim().slice(0, SURNOM_MAX);
  if (propre === '') delete tous[code];
  else tous[code] = propre;
  try {
    localStorage.setItem(cle(classeId), JSON.stringify(tous));
    return true;
  } catch {
    return false;
  }
}

export function etiquetteEleve(code: string, surnoms: Record<string, string>): string {
  return surnoms[code] ? `${code} (${surnoms[code]})` : code;
}
