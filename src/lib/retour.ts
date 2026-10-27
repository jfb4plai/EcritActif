export type CategorieErreur = 'majuscule_debut_phrase' | 'point_fin_phrase' | 'mot_repete';

// Pas de champ de correction : le retour signale, il ne corrige jamais (spec §7).
export interface Signal {
  categorie: CategorieErreur;
  debut: number;
  fin: number;
  indice: string;
}

export interface Contraintes {
  minMots?: number;
  maxMots?: number;
  // Jeux d'écriture choisis par l'enseignant : une seule lettre (accent et casse ignorés).
  initiale?: string;
  lettreInterdite?: string;
  // Option de l'enseignant : après le rendu, l'élève recopie sa version finale sur une feuille. Stockée ici pour ne pas changer la base.
  recopier?: boolean;
}

export interface Verification {
  contrainte: keyof Contraintes;
  atteinte: boolean;
  message: string;
}

const MOT = /[\p{L}\p{N}]+(?:['’][\p{L}\p{N}]+)*/gu;

export function compterMots(texte: string): number {
  return (texte.match(MOT) ?? []).length;
}

const INDICES: Record<CategorieErreur, string> = {
  majuscule_debut_phrase: 'Regarde la première lettre de cette phrase.',
  point_fin_phrase: 'Regarde la fin de ton texte.',
  mot_repete: 'Regarde ces deux mots à la suite.',
};

export function detecterSignaux(texte: string, categories: CategorieErreur[]): Signal[] {
  const signaux: Signal[] = [];
  if (texte.trim() === '') return signaux;

  if (categories.includes('majuscule_debut_phrase')) {
    // Début de texte, puis première lettre après . ! ? suivis d'espaces.
    const debuts = /(?:^|[.!?…]\s+)(\p{L})/gu;
    let m: RegExpExecArray | null;
    while ((m = debuts.exec(texte)) !== null) {
      const lettre = m[1];
      if (lettre !== lettre.toUpperCase()) {
        const debut = m.index + m[0].length - lettre.length;
        signaux.push({ categorie: 'majuscule_debut_phrase', debut, fin: debut + lettre.length, indice: INDICES.majuscule_debut_phrase });
      }
    }
  }

  if (categories.includes('point_fin_phrase')) {
    const fin = texte.trimEnd().length;
    if (!/[.!?…]$/.test(texte.trimEnd())) {
      const dernier = [...texte.matchAll(MOT)].pop();
      const debut = dernier?.index ?? Math.max(0, fin - 1);
      signaux.push({ categorie: 'point_fin_phrase', debut, fin, indice: INDICES.point_fin_phrase });
    }
  }

  if (categories.includes('mot_repete')) {
    const mots = [...texte.matchAll(MOT)];
    for (let i = 1; i < mots.length; i++) {
      const avant = mots[i - 1];
      const mot = mots[i];
      const entre = texte.slice((avant.index ?? 0) + avant[0].length, mot.index);
      if (/^\s+$/.test(entre) && avant[0].toLowerCase() === mot[0].toLowerCase()) {
        const debut = mot.index ?? 0;
        signaux.push({ categorie: 'mot_repete', debut, fin: debut + mot[0].length, indice: INDICES.mot_repete });
      }
    }
  }

  return signaux.sort((a, b) => a.debut - b.debut);
}

const pluriel = (n: number, mot: string) => `${n} ${mot}${n >= 2 ? 's' : ''}`;

const sansAccent = (x: string) => x.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const lettreValide = (l: unknown): l is string => typeof l === 'string' && /^\p{L}$/u.test(l.normalize('NFD').replace(/[̀-ͯ]/g, ''));

export interface MotFautif {
  mot: string;
  debut: number;
  fin: number;
}

// Mots qui ne respectent pas la contrainte de lettre. Ne propose jamais de remplaçant.
export function motsFautifs(texte: string, c: Contraintes): MotFautif[] {
  const fautifs: MotFautif[] = [];
  const ini = lettreValide(c.initiale) ? sansAccent(c.initiale) : null;
  const interdite = lettreValide(c.lettreInterdite) ? sansAccent(c.lettreInterdite) : null;
  if (!ini && !interdite) return fautifs;
  for (const m of texte.matchAll(MOT)) {
    const mot = m[0];
    const base = sansAccent(mot);
    const faute = (ini !== null && !base.startsWith(ini)) || (interdite !== null && base.includes(interdite));
    if (faute) fautifs.push({ mot, debut: m.index ?? 0, fin: (m.index ?? 0) + mot.length });
  }
  return fautifs;
}

const listeMots = (f: MotFautif[]) => [...new Set(f.map((x) => x.mot))].map((m) => `« ${m} »`).join(', ');

// Un retour qui informe : les chiffres, puis quoi faire (qualité de la rétroaction, voir qualite.ts).
export function verifierContraintes(texte: string, c: Contraintes): Verification[] {
  const n = compterMots(texte);
  const r: Verification[] = [];
  if (c.minMots !== undefined) {
    const atteinte = n >= c.minMots;
    r.push({
      contrainte: 'minMots',
      atteinte,
      message: atteinte ? `Ton texte a ${pluriel(n, 'mot')} : c’est ce qui est demandé.` : `Ton texte a ${pluriel(n, 'mot')} ; il en faut au moins ${c.minMots}. Ajoute une phrase.`,
    });
  }
  if (c.maxMots !== undefined) {
    const atteinte = n <= c.maxMots;
    r.push({
      contrainte: 'maxMots',
      atteinte,
      message: atteinte ? `Ton texte a ${pluriel(n, 'mot')} : c’est ce qui est demandé.` : `Ton texte a ${pluriel(n, 'mot')} ; il en faut au plus ${c.maxMots}. Garde l’essentiel.`,
    });
  }
  const jeu = (cle: 'initiale' | 'lettreInterdite', c1: Contraintes, ok: string, ko: (l: string) => string) => {
    const f = motsFautifs(texte, c1);
    const lettre = c1[cle]!.toUpperCase();
    r.push({
      contrainte: cle,
      atteinte: f.length === 0,
      message: f.length === 0 ? ok.replace('{l}', lettre) : `${ko(lettre)} Mots à changer : ${listeMots(f)}. Change chaque mot, puis relis.`,
    });
  };
  if (lettreValide(c.initiale)) jeu('initiale', { initiale: c.initiale }, 'Tous tes mots commencent par {l} : c’est ce qui est demandé.', (l) => `Il faut des mots qui commencent par ${l}.`);
  if (lettreValide(c.lettreInterdite)) jeu('lettreInterdite', { lettreInterdite: c.lettreInterdite }, 'Aucun mot ne contient la lettre {l} : c’est ce qui est demandé.', (l) => `La lettre ${l} est interdite.`);
  return r;
}

// Bilan factuel du travail, sans « bravo » : il décrit ce qui a été fait.
export function recapRendu(texte: string, versions: number): string {
  const base = `Ton texte est rendu : ${pluriel(compterMots(texte), 'mot')}, ${pluriel(versions, 'version')}.`;
  return versions >= 2 ? `${base} Regarde ce qui a changé dans « Ma version d’avant ».` : base;
}
