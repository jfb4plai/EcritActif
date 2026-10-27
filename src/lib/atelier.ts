import type { Annee } from '../types';

// Atelier « Je raisonne sur une phrase » (spec 2026-10-27, voie A) : l'élève suit une démarche pour justifier l'accord
// du verbe avec son sujet. L'application pose les questions et garde la trace ; elle ne juge jamais la grammaire.
// Sources : Arseneau et Geoffre (2023, RISS halshs-04327552) pour la justification et les manipulations ; programme CECP
// pour les codes (F441 sujet, F543 classes de mots, F552 conjuguer, F554 accorder, F472 verbaliser un raisonnement).
export const ANNEES_ATELIER: Annee[] = ['P4', 'P5', 'P6'];

export const PRONOMS = ['il', 'elle', 'ils', 'elles'] as const;
export type Pronom = (typeof PRONOMS)[number];

export type EtapeId = 'verbe' | 'sujet' | 'terminaison' | 'justifier' | 'decider';

export interface EtapeAtelier {
  id: EtapeId;
  titre: string;
  consignes: string[];
  codes: string[];
}

export const ETAPES_ATELIER: EtapeAtelier[] = [
  {
    id: 'verbe',
    titre: 'Trouver le verbe',
    consignes: ['Changer le moment de la phrase : ajouter « hier » ou « demain » au début.', 'Regarder le mot qui change.', 'Cliquer sur ce mot : c’est le verbe.'],
    codes: ['F431', 'F543'],
  },
  {
    id: 'sujet',
    titre: 'Trouver le sujet',
    consignes: [
      'Chercher le groupe de mots qui fait l’action du verbe.',
      'Remplacer ce groupe par il, elle, ils ou elles.',
      'Cliquer sur le groupe de mots remplacé.',
      'Choisir le pronom qui convient.',
    ],
    codes: ['F441', 'F558'],
  },
  {
    id: 'terminaison',
    titre: 'Regarder la terminaison',
    consignes: ['Lire le verbe avec le pronom choisi.', 'Regarder la fin du verbe dans mon texte.', 'Écrire la fin du verbe.'],
    codes: ['F552', 'F554'],
  },
  {
    id: 'justifier',
    titre: 'Justifier',
    consignes: ['Compléter les phrases ci-dessous.', 'Dire la phrase à voix haute à un camarade ou à l’enseignant, si besoin.'],
    codes: ['F472', 'F554'],
  },
  {
    id: 'decider',
    titre: 'Décider',
    consignes: ['Choisir : garder la phrase ou modifier mon texte.', 'Cliquer sur « Je ne suis pas sûr » si besoin.'],
    codes: ['F554', 'F600'],
  },
];

export const GABARIT_JUSTIFICATION = 'Le sujet est ______ . Je peux le remplacer par ______ . Le verbe ______ se termine par ______ .';

// Tout ce que l'atelier dit à l'élève : sert aux tests de vocabulaire et de ton.
export function motsDeLAtelier(): string {
  return [...ETAPES_ATELIER.flatMap((e) => [e.titre, ...e.consignes]), GABARIT_JUSTIFICATION].join(' ');
}
