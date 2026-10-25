// Sans 0, O, 1, I, L : un enfant recopie un code sans confondre les caractères (Review Focus 4).
export const ALPHABET_CODE = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

export function genererCode(longueur = 6): string {
  const octets = new Uint8Array(longueur);
  crypto.getRandomValues(octets);
  // Rejet des valeurs hors du plus grand multiple de la taille de l'alphabet : pas de biais.
  const limite = 256 - (256 % ALPHABET_CODE.length);
  let code = '';
  for (let i = 0; i < longueur; i++) {
    let o = octets[i];
    while (o >= limite) {
      const un = new Uint8Array(1);
      crypto.getRandomValues(un);
      o = un[0];
    }
    code += ALPHABET_CODE[o % ALPHABET_CODE.length];
  }
  return code;
}
