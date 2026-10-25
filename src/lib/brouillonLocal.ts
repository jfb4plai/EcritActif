// Copie locale du texte de l'élève : le stockage peut lever (navigation privée, données bloquées),
// l'écran doit alors continuer à fonctionner sans cette copie.
export function sauverLocal(cle: string, texte: string): void {
  try {
    localStorage.setItem(cle, texte);
  } catch {
    /* pas de copie locale : le serveur reste la référence */
  }
}

export function lireLocal(cle: string): string | null {
  try {
    return localStorage.getItem(cle);
  } catch {
    return null;
  }
}
