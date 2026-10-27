import { decouperMots } from './mots.js';

// Chasse aux erreurs (spec 2026-10-27, voie B). L'enseignant fournit un court texte, les erreurs qu'il y a placées
// et la forme attendue. L'élève cherche, corrige, justifie. Le corrigé reste côté serveur : l'élève ne reçoit que le
// texte et le nombre d'erreurs ; la vérification renvoie un verdict qualitatif, jamais une note.
export const MOTS_MAX = 80;
export const ERREURS_MAX = 6;

export type TypeErreur = 'accord-verbe' | 'groupe-nominal' | 'pluriel-feminin' | 'homophone';

// Indices par défaut : ils orientent le regard sans donner la forme. Codes du programme : F554 (verbe et sujet),
// F555 et F556 (déterminants et adjectifs), F557 (pluriel et féminin particuliers), F534 et F535 (homophones).
export const TYPES_ERREUR: { id: TypeErreur; libelle: string; codes: string[]; indice: string }[] = [
  { id: 'accord-verbe', libelle: 'Accord du verbe avec son sujet', codes: ['F554'], indice: 'Regarde le sujet de ce verbe, puis la fin du verbe.' },
  { id: 'groupe-nominal', libelle: 'Accord dans le groupe du nom (déterminant, adjectif)', codes: ['F555', 'F556'], indice: 'Regarde le nom, puis le mot qui le précède ou qui le suit.' },
  { id: 'pluriel-feminin', libelle: 'Pluriel ou féminin particulier', codes: ['F557'], indice: 'Regarde la fin de ce mot : est-ce un pluriel ou un féminin qui suit une règle particulière ?' },
  { id: 'homophone', libelle: 'Homophone', codes: ['F534', 'F535'], indice: 'Ce mot se prononce comme un autre. Essaie de le remplacer par un autre mot pour vérifier.' },
];

export interface ErreurChasse {
  // Numéro du mot dans le texte (voir decouperMots).
  position: number;
  mot: string;
  attendu: string;
  type: TypeErreur;
  // Indice de l'enseignant ; vide : l'indice du type est utilisé.
  indice: string;
}

export interface ChasseBrute {
  texte: string;
  erreurs: ErreurChasse[];
}

export interface ChasseEleve {
  texte: string;
  nbErreurs: number;
}

export interface LigneErreurSaisie {
  mot: string;
  rang: number;
  attendu: string;
  type: TypeErreur;
  indice: string;
}

export function localiserErreurs(texte: string, lignes: LigneErreurSaisie[]): { ok: true; chasse: ChasseBrute } | { ok: false; message: string } {
  const mots = decouperMots(texte);
  if (mots.length === 0) return { ok: false, message: 'Écrivez le texte à corriger.' };
  if (mots.length > MOTS_MAX) return { ok: false, message: `Le texte compte ${mots.length} mots ; ${MOTS_MAX} au plus.` };
  if (lignes.length === 0) return { ok: false, message: 'Indiquez au moins une erreur à trouver.' };
  if (lignes.length > ERREURS_MAX) return { ok: false, message: `${ERREURS_MAX} erreurs au plus.` };

  const erreurs: ErreurChasse[] = [];
  for (const l of lignes) {
    const mot = l.mot.trim();
    const attendu = l.attendu.trim();
    if (mot === '') return { ok: false, message: 'Chaque erreur a besoin du mot tel qu’il est écrit dans le texte.' };
    if (attendu === '') return { ok: false, message: `Indiquez la forme attendue pour « ${mot} ».` };
    if (attendu === mot) return { ok: false, message: `La forme attendue pour « ${mot} » doit être différente du mot du texte.` };
    const occurrences = mots.map((m, i) => (m.texte === mot ? i : -1)).filter((i) => i >= 0);
    if (occurrences.length === 0) return { ok: false, message: `Le mot « ${mot} » ne se trouve pas dans le texte.` };
    const rang = Math.max(1, Math.floor(l.rang) || 1);
    if (rang > occurrences.length) return { ok: false, message: `Le mot « ${mot} » apparaît ${occurrences.length} fois : le rang ${rang} n’existe pas.` };
    const position = occurrences[rang - 1];
    if (erreurs.some((e) => e.position === position)) return { ok: false, message: `Deux lignes portent sur le même mot (« ${mot} »).` };
    erreurs.push({ position, mot, attendu, type: l.type, indice: l.indice.trim() });
  }
  return { ok: true, chasse: { texte, erreurs } };
}

export type Verdict = { resultat: 'trouve'; erreurId: number } | { resultat: 'indice'; erreurId: number; indice: string } | { resultat: 'pas-erreur' };

// Casse indifférente, espaces ignorés, accents exacts : « Préparent » vaut « préparent », « preparent » non.
const normaliser = (s: string) => s.normalize('NFC').trim().toLowerCase();

export function verifierEssai(chasse: ChasseBrute, essai: { motIndex: number; forme: string }): Verdict {
  const erreurId = chasse.erreurs.findIndex((e) => e.position === essai.motIndex);
  if (erreurId < 0) return { resultat: 'pas-erreur' };
  const e = chasse.erreurs[erreurId];
  if (normaliser(essai.forme) !== '' && normaliser(essai.forme) === normaliser(e.attendu)) return { resultat: 'trouve', erreurId };
  return { resultat: 'indice', erreurId, indice: e.indice !== '' ? e.indice : TYPES_ERREUR.find((t) => t.id === e.type)!.indice };
}

export function chasseVersEleve(c: ChasseBrute): ChasseEleve {
  return { texte: c.texte, nbErreurs: c.erreurs.length };
}
