export interface MotCompare {
  mot: string;
  // Vrai : ce mot n'existe que dans cette version (retiré du premier jet, ou ajouté dans la version finale).
  change: boolean;
}

// Comparaison mot à mot (plus longue suite commune) entre le premier jet et la version finale.
// Elle montre ce qui a changé ; elle ne juge jamais si le changement est une bonne correction.
export function comparerMots(avant: string, apres: string): { avant: MotCompare[]; apres: MotCompare[] } {
  const a = avant.split(/\s+/).filter((m) => m !== '');
  const b = apres.split(/\s+/).filter((m) => m !== '');
  const lcs: number[][] = Array.from({ length: a.length + 1 }, () => new Array<number>(b.length + 1).fill(0));
  for (let i = a.length - 1; i >= 0; i--) for (let j = b.length - 1; j >= 0; j--) lcs[i][j] = a[i] === b[j] ? lcs[i + 1][j + 1] + 1 : Math.max(lcs[i + 1][j], lcs[i][j + 1]);

  const sortieAvant: MotCompare[] = [];
  const sortieApres: MotCompare[] = [];
  let i = 0;
  let j = 0;
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) {
      sortieAvant.push({ mot: a[i++], change: false });
      sortieApres.push({ mot: b[j++], change: false });
    } else if (lcs[i + 1][j] >= lcs[i][j + 1]) sortieAvant.push({ mot: a[i++], change: true });
    else sortieApres.push({ mot: b[j++], change: true });
  }
  while (i < a.length) sortieAvant.push({ mot: a[i++], change: true });
  while (j < b.length) sortieApres.push({ mot: b[j++], change: true });
  return { avant: sortieAvant, apres: sortieApres };
}
