import type { Annee } from '../types';

// Atelier « Je raisonne sur une phrase » (spec 2026-10-27, voie A) : l'élève suit une démarche pour justifier un accord ou
// une fonction. L'application pose les questions et garde la trace ; elle ne juge jamais la grammaire.
// Règle numéro 1 (JF) : le respect du programme. Les démarches n'emploient que les termes du programme de l'année et ne
// couvrent que ce qu'il demande : les verbes pronominaux sont HORS programme (F627, F834) et donc hors de l'atelier.
// Sources : Arseneau et Geoffre (2023, RISS halshs-04327552) pour la justification et les manipulations ; programme CECP
// pour les codes. Une démarche est une donnée : on peut en ajouter ou en adapter sans toucher au composant.
export const ANNEES_ATELIER: Annee[] = ['P4', 'P5', 'P6'];

export const PRONOMS = ['il', 'elle', 'ils', 'elles'] as const;
export type Pronom = (typeof PRONOMS)[number];

// Un élément n'est affiché que si le choix indiqué par `si` a été fait.
interface Condition {
  si?: { cle: string; valeur: string };
}

export type Element = Condition &
  (
    | { kind: 'marquer'; cle: string; legende?: string; min: number }
    | { kind: 'choisir'; cle: string; legende: string; options: string[] }
    | { kind: 'cocher'; cle: string; legende: string; options: string[] }
    | { kind: 'ecrire'; cle: string; libelle: string; aide: string; placeholder: string }
  );

export interface Etape {
  id: string;
  titre: string;
  consignes: string[];
  // Consignes et rappel propres à un choix déjà fait (par exemple le cas du participe passé).
  selon?: { cle: string; valeur: string; consignes: string[]; rappel?: string }[];
  codes: string[];
  elements: Element[];
}

// Source d'une valeur pour la justification. `sinon` : seconde clé si la première est vide. `libre` : l'élève écrit.
export type Depuis = { kind: 'mots' | 'choix' | 'texte' | 'libre'; cle: string; sinon?: string };

export interface Demarche {
  id: string;
  // Texte du bouton qui propose la démarche.
  titre: string;
  annees: Annee[];
  etapes: Etape[];
  // Consigne et champs de la justification ; les blancs du gabarit suivent l'ordre des champs.
  gabarit: string;
  champs: { libelle: string; depuis: Depuis }[];
  // Phrase lue par l'enseignant dans le tableau ; {0}, {1}… sont les valeurs saisies ; {2?} : phrase omise si vide.
  modele: string;
  codes: string[];
}

const JUSTIFIER: Etape = {
  id: 'justifier',
  titre: 'Justifier',
  consignes: ['Compléter les phrases ci-dessous.', 'Dire la phrase à voix haute à un camarade ou à l’enseignant, si besoin.'],
  codes: ['F472', 'F554'],
  elements: [],
};

const DECIDER: Etape = {
  id: 'decider',
  titre: 'Décider',
  consignes: ['Choisir : garder la phrase ou modifier mon texte.', 'Cliquer sur « Je ne suis pas sûr » si besoin.'],
  codes: ['F554', 'F600'],
  elements: [],
};

export const VERBE_SUJET: Demarche = {
  id: 'verbe-sujet',
  titre: 'Le verbe et son sujet',
  annees: ['P4', 'P5', 'P6'],
  gabarit: 'Le groupe sujet est ______ . Je peux le remplacer par ______ . Le verbe ______ se termine par ______ .',
  modele: 'Le groupe sujet est {0}. Je peux le remplacer par {1}. Le verbe {2} se termine par {3}.',
  champs: [
    { libelle: 'Le groupe sujet est', depuis: { kind: 'mots', cle: 'sujet' } },
    { libelle: 'Je peux le remplacer par', depuis: { kind: 'choix', cle: 'pronom' } },
    { libelle: 'Le verbe', depuis: { kind: 'mots', cle: 'verbe' } },
    { libelle: 'se termine par', depuis: { kind: 'texte', cle: 'fin' } },
  ],
  codes: ['F441', 'F552', 'F554'],
  etapes: [
    {
      id: 'verbe',
      titre: 'Trouver le verbe',
      consignes: ['Changer le temps de la phrase (le moment où l’action se passe) : ajouter « hier » ou « demain » au début.', 'Regarder le mot qui change.', 'Cliquer sur ce mot : c’est le verbe.'],
      codes: ['F431', 'F543'],
      elements: [{ kind: 'marquer', cle: 'verbe', min: 1 }],
    },
    {
      id: 'sujet',
      titre: 'Trouver le groupe sujet',
      consignes: [
        'Chercher le groupe sujet : le groupe de mots qui fait l’action du verbe.',
        'Remplacer le groupe sujet par il, elle, ils ou elles.',
        'Cliquer sur le groupe sujet.',
        'Choisir le pronom qui convient.',
      ],
      codes: ['F441', 'F558'],
      elements: [
        { kind: 'marquer', cle: 'sujet', min: 1 },
        { kind: 'choisir', cle: 'pronom', legende: 'Pronom', options: [...PRONOMS] },
      ],
    },
    {
      id: 'terminaison',
      titre: 'Regarder la terminaison',
      consignes: ['Lire le verbe avec le pronom choisi.', 'Regarder la fin du verbe dans mon texte.', 'Écrire la fin du verbe.'],
      codes: ['F552', 'F554'],
      elements: [
        {
          kind: 'ecrire',
          cle: 'fin',
          libelle: 'Fin du verbe',
          aide: 'Écris seulement les dernières lettres du verbe, comme dans ton texte. Personne ne note cette réponse.',
          placeholder: 'ent',
        },
      ],
    },
    JUSTIFIER,
    DECIDER,
  ],
};

export const GROUPE_NOMINAL: Demarche = {
  id: 'groupe-nominal',
  titre: 'Le nom et les mots qui l’accompagnent',
  annees: ['P4', 'P5', 'P6'],
  gabarit: 'Le nom est ______ . Il est ______ (masculin ou féminin) et ______ (un seul ou plusieurs). Le mot ______ s’accorde avec lui : il se termine par ______ .',
  modele: 'Le nom est {0}. Il est {1} et {2}. Le mot {3} s’accorde avec lui : il se termine par {4}.',
  champs: [
    { libelle: 'Le nom est', depuis: { kind: 'mots', cle: 'nom' } },
    { libelle: 'Il est (masculin ou féminin)', depuis: { kind: 'choix', cle: 'genre' } },
    { libelle: 'et (un seul ou plusieurs)', depuis: { kind: 'choix', cle: 'nombre' } },
    { libelle: 'Le mot', depuis: { kind: 'mots', cle: 'determinant' } },
    { libelle: 'se termine par', depuis: { kind: 'texte', cle: 'fin-determinant' } },
  ],
  codes: ['F431', 'F555', 'F556'],
  etapes: [
    {
      id: 'nom',
      titre: 'Trouver le nom',
      consignes: ['Chercher un mot qui peut s’écrire après « un », « une » ou « des ».', 'Cliquer sur ce mot : c’est le nom.'],
      codes: ['F431', 'F543'],
      elements: [{ kind: 'marquer', cle: 'nom', min: 1 }],
    },
    {
      id: 'accompagnants',
      titre: 'Trouver les mots qui l’accompagnent',
      consignes: ['Cliquer sur le petit mot placé devant le nom : c’est le déterminant.', 'Cliquer sur le mot qui décrit le nom, s’il y en a un : c’est l’adjectif.'],
      codes: ['F431', 'F543'],
      elements: [
        { kind: 'marquer', cle: 'determinant', legende: 'Le déterminant', min: 1 },
        { kind: 'marquer', cle: 'adjectif', legende: 'L’adjectif, s’il y en a un', min: 0 },
      ],
    },
    {
      id: 'genre-nombre',
      titre: 'Regarder le genre et le nombre',
      consignes: [
        'Choisir : le nom est masculin ou féminin.',
        'Choisir : le nom désigne un seul être ou plusieurs.',
        'Regarder la fin du déterminant dans mon texte.',
        'Écrire la fin du déterminant.',
      ],
      codes: ['F555', 'F556'],
      elements: [
        { kind: 'choisir', cle: 'genre', legende: 'Le nom est', options: ['masculin', 'féminin'] },
        { kind: 'choisir', cle: 'nombre', legende: 'Le nom désigne', options: ['un seul', 'plusieurs'] },
        {
          kind: 'ecrire',
          cle: 'fin-determinant',
          libelle: 'Fin du déterminant',
          aide: 'Écris seulement les dernières lettres du petit mot qui précède le nom, comme dans ton texte. Personne ne note cette réponse.',
          placeholder: 'es',
        },
      ],
    },
    JUSTIFIER,
    DECIDER,
  ],
};

// Participe passé (P5, P6 ; F627, F753, F834). Hors programme, donc absents : les verbes pronominaux.
// Les rappels énoncent les règles générales usuelles ; ils sont à faire relire par l'enseignant (brouillon de la spec).
export const PARTICIPE_PASSE: Demarche = {
  id: 'participe-passe',
  titre: 'Le participe passé',
  annees: ['P5', 'P6'],
  gabarit: 'Le participe passé est ______ . Il est employé ______ . Le mot à regarder est ______ . Le complément direct est placé ______ (avec « avoir »). Il se termine par ______ .',
  modele: 'Le participe passé {0} est employé {1}. Le mot à regarder est {2}. Le complément direct est placé {3?}. Il se termine par {4}.',
  champs: [
    { libelle: 'Le participe passé est', depuis: { kind: 'mots', cle: 'pp' } },
    { libelle: 'Il est employé', depuis: { kind: 'choix', cle: 'cas' } },
    { libelle: 'Le mot à regarder est', depuis: { kind: 'mots', cle: 'accord', sinon: 'cd' } },
    { libelle: 'Le complément direct est placé (avec « avoir »)', depuis: { kind: 'choix', cle: 'place' } },
    { libelle: 'se termine par', depuis: { kind: 'texte', cle: 'fin-pp' } },
  ],
  codes: ['F627', 'F753', 'F441'],
  etapes: [
    {
      id: 'pp',
      titre: 'Trouver le participe passé',
      consignes: ['Mettre la phrase au passé composé, si besoin.', 'Cliquer sur le participe passé.'],
      codes: ['F627', 'F753'],
      elements: [{ kind: 'marquer', cle: 'pp', min: 1 }],
    },
    {
      id: 'cas',
      titre: 'Regarder comment il est employé',
      consignes: ['Chercher s’il y a l’auxiliaire « avoir » ou l’auxiliaire « être ».', 'Choisir comment le participe passé est employé.'],
      codes: ['F627', 'F753'],
      elements: [{ kind: 'choisir', cle: 'cas', legende: 'Le participe passé est employé', options: ['seul, sans auxiliaire', 'avec « être »', 'avec « avoir »'] }],
    },
    {
      id: 'accord',
      titre: 'Chercher avec quel mot il s’accorde',
      consignes: [],
      selon: [
        {
          cle: 'cas',
          valeur: 'seul, sans auxiliaire',
          consignes: ['Chercher le nom que le participe passé complète.', 'Cliquer sur ce nom.'],
          rappel: 'Employé seul, le participe passé s’accorde avec le nom qu’il complète.',
        },
        {
          cle: 'cas',
          valeur: 'avec « être »',
          consignes: ['Chercher le groupe sujet du verbe.', 'Cliquer sur le groupe sujet.'],
          rappel: 'Avec « être », le participe passé s’accorde avec le sujet.',
        },
        {
          cle: 'cas',
          valeur: 'avec « avoir »',
          consignes: ['Chercher le complément direct du verbe : le remplacer par « le », « la », « l’ » ou « les ».', 'Cliquer sur le complément direct, s’il y en a un.', 'Choisir où il est placé par rapport au verbe.'],
          rappel: 'Avec « avoir », le participe passé ne s’accorde pas avec le sujet. Il s’accorde avec le complément direct, seulement si ce complément est placé avant le verbe.',
        },
      ],
      codes: ['F627', 'F753', 'F441'],
      elements: [
        { kind: 'marquer', cle: 'accord', legende: 'Le nom', min: 1, si: { cle: 'cas', valeur: 'seul, sans auxiliaire' } },
        { kind: 'marquer', cle: 'accord', legende: 'Le groupe sujet', min: 1, si: { cle: 'cas', valeur: 'avec « être »' } },
        { kind: 'marquer', cle: 'cd', legende: 'Le complément direct, s’il y en a un', min: 0, si: { cle: 'cas', valeur: 'avec « avoir »' } },
        { kind: 'choisir', cle: 'place', legende: 'Le complément direct est placé', options: ['avant le verbe', 'après le verbe', 'il n’y en a pas'], si: { cle: 'cas', valeur: 'avec « avoir »' } },
      ],
    },
    {
      id: 'fin-pp',
      titre: 'Regarder la fin du participe passé',
      consignes: ['Regarder la fin du participe passé dans mon texte.', 'Écrire la fin du participe passé.'],
      codes: ['F753'],
      elements: [
        {
          kind: 'ecrire',
          cle: 'fin-pp',
          libelle: 'Fin du participe passé',
          aide: 'Écris seulement les dernières lettres du participe passé, comme dans ton texte. Personne ne note cette réponse.',
          placeholder: 'ées',
        },
      ],
    },
    JUSTIFIER,
    DECIDER,
  ],
};

// Fonction d'un groupe (P4 : cinq fonctions ; P5 et P6 : huit). Cadre « programme » par défaut ; l'option « Grammaire 3D »
// change les noms des fonctions et les pronoms proposés (fichiers fonctions.ts et pronouns.ts de Grammaire 3D), pas la liste
// des fonctions du programme : celles que Grammaire 3D n'a pas gardent le nom du programme.
const FONCTIONS_PROGRAMME: Record<'P4' | 'P5', string[]> = {
  P4: ['groupe sujet', 'groupe prédicat', 'groupe complément circonstanciel', 'complément direct du verbe', 'complément indirect du verbe'],
  P5: ['groupe sujet', 'groupe prédicat', 'groupe complément circonstanciel', 'complément direct du verbe', 'complément indirect du verbe', 'complément du nom', 'attribut', 'épithète'],
};
const FONCTIONS_3D: Record<'P4' | 'P5', string[]> = {
  P4: ['groupe sujet', 'prédicat', 'complément de phrase', 'complément direct', 'complément indirect'],
  P5: ['groupe sujet', 'prédicat', 'complément de phrase', 'complément direct', 'complément indirect', 'complément du nom', 'attribut du sujet', 'épithète'],
};
const PRONOMS_PROGRAMME = 'Pronoms utiles : il, elle, ils, elles, le, la, l’, les, lui, leur, y, en.';
// « attribut du sujet » est un terme de P5 : il n'apparaît pas dans l'aide de P4.
const PRONOMS_3D_P4 = 'Pronoms utiles, par fonction : groupe sujet : il, elle, ils, elles, on ; complément direct : le, la, l’, les ; complément indirect : lui, leur, y, en ; complément de phrase : y, là, alors.';
const PRONOMS_3D_P5 = PRONOMS_3D_P4.replace(/\.$/, ' ; attribut du sujet : le.');

export function fonctions(annee: Annee, grammaire3d: boolean): Demarche {
  const cle = annee === 'P4' ? 'P4' : 'P5';
  const options = (grammaire3d ? FONCTIONS_3D : FONCTIONS_PROGRAMME)[cle];
  return {
    id: 'fonctions',
    titre: 'La fonction d’un groupe',
    annees: ['P4', 'P5', 'P6'],
    gabarit: 'Le groupe ______ est ______ parce que ______ .',
    modele: 'Le groupe {0} est {1} parce que {2}.',
    champs: [
      { libelle: 'Le groupe', depuis: { kind: 'mots', cle: 'groupe' } },
      { libelle: 'est', depuis: { kind: 'choix', cle: 'fonction' } },
      { libelle: 'parce que', depuis: { kind: 'libre', cle: 'parce-que' } },
    ],
    codes: cle === 'P4' ? ['F441', 'F558'] : ['F441', 'F558', 'F633', 'F758'],
    etapes: [
      {
        id: 'groupe',
        titre: 'Choisir un groupe',
        consignes: ['Choisir un groupe de la phrase à étudier.', 'Cliquer sur les mots de ce groupe.'],
        codes: ['F441', 'F558'],
        elements: [{ kind: 'marquer', cle: 'groupe', min: 1 }],
      },
      {
        id: 'manipulations',
        titre: 'Essayer les manipulations',
        consignes: [
          'Déplacer le groupe ailleurs dans la phrase.',
          'Effacer le groupe.',
          'Remplacer le groupe par un pronom.',
          'Encadrer le groupe par « c’est … qui » ou « c’est … que ».',
          'Cocher ce qui fonctionne.',
        ],
        codes: ['F441', 'F558'],
        elements: [
          {
            kind: 'cocher',
            cle: 'manips',
            legende: 'Ce qui fonctionne',
            options: ['Le groupe se déplace.', 'Le groupe s’efface.', 'Le groupe se remplace par un pronom.', 'Le groupe s’encadre par « c’est … qui » ou « c’est … que ».'],
          },
          {
            kind: 'ecrire',
            cle: 'pronom-utilise',
            libelle: 'Pronom utilisé, s’il y en a un',
            aide: grammaire3d ? (cle === 'P4' ? PRONOMS_3D_P4 : PRONOMS_3D_P5) : PRONOMS_PROGRAMME,
            placeholder: 'il',
          },
        ],
      },
      {
        id: 'fonction',
        titre: 'Choisir la fonction',
        consignes: ['Regarder ce qui a fonctionné.', 'Choisir la fonction du groupe.'],
        codes: ['F441', 'F558'],
        elements: [{ kind: 'choisir', cle: 'fonction', legende: 'Fonction du groupe', options }],
      },
      JUSTIFIER,
      DECIDER,
    ],
  };
}

export interface OptionsAtelier {
  grammaire3d?: boolean;
}

// Les démarches proposées à un élève : celles de son année, avec le cadre choisi par l'enseignant.
export function demarchesPour(annee: Annee, options: OptionsAtelier = {}): Demarche[] {
  return [VERBE_SUJET, GROUPE_NOMINAL, PARTICIPE_PASSE, fonctions(annee, options.grammaire3d === true)].filter((d) => d.annees.includes(annee));
}

// Toutes les variantes (années et cadres), pour les tests et la lecture des traces.
export function toutesLesDemarches(): Demarche[] {
  const vues = new Map<string, Demarche>();
  for (const annee of ANNEES_ATELIER) for (const g of [false, true]) for (const d of demarchesPour(annee, { grammaire3d: g })) vues.set(`${d.id}|${annee}|${g}`, d);
  return [...vues.values()];
}

export const demarcheParId = (id: string): Demarche | undefined => toutesLesDemarches().find((d) => d.id === id);

// Compatibilité : le gabarit de la démarche verbe-sujet, repris par la chasse aux erreurs.
export const GABARIT_JUSTIFICATION = VERBE_SUJET.gabarit;

// Phrase lue dans le tableau de classe à partir de la trace de justification (« id:val|val|... »).
// {n?} : la phrase qui contient une valeur vide est omise.
export function justificationEnPhrase(trace: string): string {
  const i = trace.indexOf(':');
  const d = demarcheParId(i > 0 ? trace.slice(0, i) : '');
  if (!d) return trace;
  const valeurs = trace.slice(i + 1).split('|');
  const phrases = d.modele.split(/(?<=\.)\s+/).filter((p) => [...p.matchAll(/\{(\d+)\?\}/g)].every((m) => (valeurs[Number(m[1])] ?? '') !== ''));
  return phrases.join(' ').replace(/\{(\d+)\??\}/g, (_, k) => valeurs[Number(k)] ?? '');
}

const textesElement = (el: Element): string[] => (el.kind === 'choisir' || el.kind === 'cocher' ? [el.legende, ...el.options] : el.kind === 'ecrire' ? [el.libelle, el.aide] : el.legende ? [el.legende] : []);

// Tout ce que l'atelier dit à l'élève : sert aux tests de vocabulaire et de ton.
export function motsDeLAtelier(demarches: Demarche[] = toutesLesDemarches()): string {
  return demarches
    .flatMap((d) => [
      d.titre,
      d.gabarit,
      ...d.etapes.flatMap((e) => [e.titre, ...e.consignes, ...(e.selon ?? []).flatMap((s) => [...s.consignes, ...(s.rappel ? [s.rappel] : [])]), ...e.elements.flatMap(textesElement)]),
      ...d.champs.map((c) => c.libelle),
    ])
    .join(' ');
}
