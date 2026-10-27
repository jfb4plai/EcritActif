import type { Annee } from '../types';

// Atelier « Je raisonne sur une phrase » (spec 2026-10-27, voie A) : l'élève suit une démarche pour justifier un accord.
// L'application pose les questions et garde la trace ; elle ne juge jamais la grammaire.
// Sources : Arseneau et Geoffre (2023, RISS halshs-04327552) pour la justification et les manipulations ; programme CECP
// pour les codes (F431 et F543 classes de mots, F441 sujet, F552 conjuguer, F554 à F557 accorder, F472 verbaliser un raisonnement).
// Une démarche est une donnée : on peut en ajouter ou en adapter sans toucher au composant.
export const ANNEES_ATELIER: Annee[] = ['P4', 'P5', 'P6'];

export const PRONOMS = ['il', 'elle', 'ils', 'elles'] as const;
export type Pronom = (typeof PRONOMS)[number];

export type Element =
  // L'élève clique sur des mots de la phrase. Les mots déjà pris par un autre élément sont bloqués.
  | { kind: 'marquer'; cle: string; legende?: string; min: number }
  | { kind: 'choisir'; cle: string; legende: string; options: string[] }
  | { kind: 'ecrire'; cle: string; libelle: string; aide: string; placeholder: string };

export interface Etape {
  id: string;
  titre: string;
  consignes: string[];
  codes: string[];
  elements: Element[];
}

// Source d'une valeur pour la justification : mots marqués, choix ou texte écrit plus tôt.
export type Depuis = { kind: 'mots' | 'choix' | 'texte'; cle: string };

export interface Demarche {
  id: string;
  // Texte du bouton qui propose la démarche.
  titre: string;
  // Étapes de travail ; les deux dernières (justifier, décider) sont communes et ajoutées par le composant.
  etapes: Etape[];
  // Consigne et champs de la justification ; les blancs du gabarit suivent l'ordre des champs.
  gabarit: string;
  champs: { libelle: string; depuis: Depuis }[];
  // Phrase lue par l'enseignant dans le tableau ; {0}, {1}… sont les valeurs saisies, dans l'ordre des champs.
  modele: string;
  // Codes du programme de la démarche entière.
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

export const DEMARCHES: Demarche[] = [VERBE_SUJET, GROUPE_NOMINAL];

export const demarcheParId = (id: string): Demarche | undefined => DEMARCHES.find((d) => d.id === id);

// Compatibilité : le gabarit de la démarche verbe-sujet, repris par la chasse aux erreurs.
export const GABARIT_JUSTIFICATION = VERBE_SUJET.gabarit;

// Phrase lue dans le tableau de classe à partir de la trace de justification (« id:val|val|... »).
export function justificationEnPhrase(trace: string): string {
  const i = trace.indexOf(':');
  const d = demarcheParId(i > 0 ? trace.slice(0, i) : '');
  if (!d) return trace;
  const valeurs = trace.slice(i + 1).split('|');
  return d.modele.replace(/\{(\d+)\}/g, (_, k) => valeurs[Number(k)] ?? '');
}

// Tout ce que l'atelier dit à l'élève : sert aux tests de vocabulaire et de ton.
export function motsDeLAtelier(): string {
  return DEMARCHES.flatMap((d) => [
    d.titre,
    d.gabarit,
    ...d.etapes.flatMap((e) => [
      e.titre,
      ...e.consignes,
      ...e.elements.flatMap((el) => (el.kind === 'choisir' ? [el.legende, ...el.options] : el.kind === 'ecrire' ? [el.libelle, el.aide] : el.legende ? [el.legende] : [])),
    ]),
    ...d.champs.map((c) => c.libelle),
  ]).join(' ');
}
