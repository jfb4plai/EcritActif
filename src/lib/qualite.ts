// Qualité de la rétroaction : ce que l'app dit à l'élève sur son travail doit informer, pas seulement confirmer.
// Critères tirés des deux articles de JF (littératie à la rétroaction ; « GPT-4o est mort ») et du RISS :
//  - centrée sur la tâche et le processus, pas sur la personne (Hattie & Timperley 2007, résumé dans hal-05348650) ;
//  - précise (dit où) et actionnable (propose quoi faire) ; descriptive plutôt qu'évaluative (hal-05348650) ;
//  - sans note chiffrée (hal-04646895, hal-05348650) ;
//  - sans louange vide ni validation complaisante, qui confirme sans informer (article « GPT-4o est mort », hors corpus RISS).
// Ce contrôle sert aussi de garde-fou à toute rétroaction produite par une IA activée plus tard par l'enseignant.

export type CritereQualite = 'sur-la-tache' | 'precis' | 'actionnable' | 'sans-louange-vide' | 'sans-note';

export interface Retour {
  texte: string;
  // Le retour est accompagné de l'endroit concerné dans le texte de l'élève (extrait affiché).
  localise?: boolean;
  // « bilan » : constat factuel qui n'appelle pas d'action (ex. texte rendu) ; « correctif » : par défaut.
  genre?: 'correctif' | 'bilan';
}

const L = '(?<![\\p{L}])';
const R = '(?![\\p{L}])';
const mots = (liste: string) => new RegExp(`${L}(?:${liste})${R}`, 'iu');

const PERSONNE = mots("tu es|t['’]es|doué|douée|intelligent|intelligente|nul|nulle|bête|idiot|champion|championne|génial|géniale|paresseux|paresseuse");
const COMPLAISANCE = mots("tu as raison|je suis fier|je suis fière|fier de toi|fière de toi|c['’]est parfait|rien à changer|quelle belle");
const DEBUT_LOUANGE = /^\s*(?:très bien|bien|bravo|super|parfait|ok|génial|excellent|félicitations)(?![\p{L}])/iu;
const NOTE = /\d+\s*\/\s*\d+|(?<![\p{L}])(?:note|score)(?![\p{L}])/iu;
const POSITION = mots('début|fin|phrase|phrases|paragraphe|mot|mots|ligne|première|premier|deuxième|troisième|dernière|dernier|titre|lettre|majuscule|verbe');
const ACTION = mots(
  'regarde|regardez|relis|relire|lis|écris|écrire|ajoute|ajouter|vérifie|vérifier|essaie|essayer|compare|comparer|choisis|cherche|corrige|corriger|revois|revoir|améliore|améliorer|garde|garder|réponds|répondre|nomme|dis|dire|complète|compléter|barre|efface|remplace|déplace|demande',
);

export function evaluerQualite(r: Retour): { ok: boolean; manques: CritereQualite[] } {
  const t = r.texte;
  const precis = r.localise === true || /\d/.test(t) || /«[^»]+»|"[^"]+"/.test(t) || POSITION.test(t);
  const actionnable = ACTION.test(t);
  const manques: CritereQualite[] = [];
  if (PERSONNE.test(t)) manques.push('sur-la-tache');
  if (!precis) manques.push('precis');
  if ((r.genre ?? 'correctif') === 'correctif' && !actionnable) manques.push('actionnable');
  if (COMPLAISANCE.test(t) || (DEBUT_LOUANGE.test(t) && !(precis && actionnable))) manques.push('sans-louange-vide');
  if (NOTE.test(t)) manques.push('sans-note');
  return { ok: manques.length === 0, manques };
}
