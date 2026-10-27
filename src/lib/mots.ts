// Découpage d'un texte d'élève en phrases et en mots, avec leurs positions dans le texte d'origine.
// Sert à rendre les mots cliquables (atelier de grammaire, chasse aux erreurs). Règles simples, sans analyse du sens.

export interface Segment {
  texte: string;
  debut: number;
  fin: number;
}

// « aujourd'hui » reste entier ; une élision (l', d', qu'…) reste collée au petit mot ; le trait d'union relie les mots (dit-il).
const MOT = /aujourd['’]hui|[\p{L}\p{N}]+(?:-[\p{L}\p{N}]+)*['’]?/giu;

export function decouperMots(texte: string): Segment[] {
  return [...texte.matchAll(MOT)].map((m) => ({ texte: m[0], debut: m.index!, fin: m.index! + m[0].length }));
}

// Fin de phrase : . ! ? … (répétés), guillemets ou parenthèse fermants éventuels, puis espace ou fin de texte.
// Un point entre deux chiffres (3.50) ne coupe pas, faute d'espace derrière.
const FIN = /[.!?…]+(?:["»”’)]|\s+[»”)])*(?=\s|$)/g;

export function decouperPhrases(texte: string): Segment[] {
  const coupures: number[] = [];
  for (const m of texte.matchAll(FIN)) coupures.push(m.index! + m[0].length);
  for (const m of texte.matchAll(/\n+/g)) coupures.push(m.index!);
  coupures.sort((a, b) => a - b);
  const bornes = [...new Set([...coupures, texte.length])];
  const phrases: Segment[] = [];
  let depart = 0;
  for (const fin of bornes) {
    const brut = texte.slice(depart, fin);
    const nette = brut.trim();
    if (nette !== '') {
      const debut = depart + brut.indexOf(nette);
      phrases.push({ texte: nette, debut, fin: debut + nette.length });
    }
    depart = fin;
  }
  return phrases;
}

// Une phrase découpée en morceaux : les mots portent leur numéro (motIndex), le reste (espaces, ponctuation) est affiché tel quel.
export interface Morceau {
  texte: string;
  motIndex: number | null;
}

export function morceauxDePhrase(phrase: string): Morceau[] {
  const mots = decouperMots(phrase);
  const morceaux: Morceau[] = [];
  let curseur = 0;
  mots.forEach((m, i) => {
    if (m.debut > curseur) morceaux.push({ texte: phrase.slice(curseur, m.debut), motIndex: null });
    morceaux.push({ texte: m.texte, motIndex: i });
    curseur = m.fin;
  });
  if (curseur < phrase.length) morceaux.push({ texte: phrase.slice(curseur), motIndex: null });
  return morceaux;
}
