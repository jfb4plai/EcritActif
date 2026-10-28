// Liste de mots du français (dictionnaire Hunspell « fr » de Grammalecte, licence MPL 2.0, dossier public/dictionnaire).
// Chargée seulement quand l'activité demande de signaler les mots absents ; ~1,4 Mo.
import type NSpell from 'nspell';

export type EstConnu = (mot: string) => boolean;

// Le mot entier (aujourd'hui, peut-être) d'abord, puis chaque morceau (l'école = l + école).
export function verifierMot(dico: { correct(m: string): boolean }, mot: string): boolean {
  const m = mot.replace(/’/g, "'");
  if (dico.correct(m) || dico.correct(m.toLowerCase())) return true;
  const morceaux = m.split(/['-]/).filter(Boolean);
  return morceaux.length > 1 && morceaux.every((x) => dico.correct(x) || dico.correct(x.toLowerCase()));
}

export function creerVerificateur(nspell: typeof NSpell, aff: string, dic: string): EstConnu {
  const dico = nspell(aff, dic);
  return (mot) => verifierMot(dico, mot);
}

let enCours: Promise<EstConnu> | null = null;

export function chargerDictionnaire(base = '/dictionnaire'): Promise<EstConnu> {
  enCours ??= (async () => {
    const [aff, dic] = await Promise.all([fetch(`${base}/fr.aff`).then((r) => r.text()), fetch(`${base}/fr.dic`).then((r) => r.text())]);
    // Un serveur qui renvoie la page d'accueil à la place du fichier ne doit pas passer pour une liste vide.
    if (!aff.includes('SET') || dic.trimStart().startsWith('<')) throw new Error('liste de mots illisible');
    // Le moteur n'est téléchargé qu'avec la liste, pas pour toutes les activités.
    const { default: nspell } = await import('nspell');
    return creerVerificateur(nspell, aff, dic);
  })().catch((e) => {
    enCours = null;
    throw e;
  });
  return enCours;
}
