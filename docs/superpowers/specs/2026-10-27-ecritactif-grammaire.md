# EcritActif : raisonnement grammatical, voies A et B (spec à valider)

Décision de JF (2026-10-27) : « A et B (au choix de l'enseignant) ». La grammaire est un attendu essentiel de P4 à P6. Ce document décrit ce qui sera construit ; **rien n'est codé tant que JF n'a pas validé les sections 3 et 4** (contenu pédagogique).

## 0. Hypothèses (non données par moi, à confirmer ou corriger)

1. L'enseignant active A et B **activité par activité** (deux cases à cocher dans le formulaire d'activité). Jamais activées par défaut.
2. Disponibles en **P4, P5 et P6** seulement. P3 reste hors périmètre (accords vus en P3, mais l'année est ouverte et testée telle quelle).
3. L'élève **marque les mots en cliquant** (un bouton par mot, accessible au clavier et à la tablette), pas en recopiant.
4. **Aucun jugement automatique** en A : l'application ne dit jamais « juste » ou « faux » sur la grammaire de l'élève. En B, le corrigé vient de l'enseignant, pas d'une analyse.
5. Trace pour l'enseignant : étapes faites, « Je ne suis pas sûr », et la **justification écrite par l'élève** (texte d'élève, même statut de confidentialité que ses textes).
6. Même démarche de P4 à P6 ; la complexité vient des phrases choisies, pas de la démarche. P5 et P6 ajoutent un module « participe passé » **après lecture de F627 à F629 et F834 à F836**, non lus à ce jour.
7. Nouvelles colonnes de base de données (jsonb) sur `ecrit_textes` pour l'atelier, tables `ecrit_chasses` et `ecrit_chasse_essais` pour B : dans une nouvelle migration, non appliquée sans l'accord de JF.

## 1. Ancrage

- RISS lu : Arseneau & Geoffre (2023), `halshs-04327552` (justification, identification, manipulations syntaxiques ; erreurs d'autrui plus faciles à traiter que les siennes ; détection et correction d'erreurs en amont de la révision). Limites déjà notées dans `docs/proposition-p4-p6.md`, section 8.
- Programme : F554 à F557 (accorder verbe-sujet, déterminants et adjectifs, pluriel, féminin), F441 et F558 (sujet, prédicat, fonction), F552 (conjuguer), F543 (classes de mots), F759 (**procédure** de raisonnement grammatical, premier item en **P5** ; en P4 l'attendu est « accorder » sans « procédure » nommée).
- **Ce que cette spec n'établit pas** : l'efficacité de l'atelier sur la qualité des accords des élèves de la FWB. Elle est à observer en classe.

## 2. Vue d'ensemble

| | A. Atelier « Je raisonne sur une phrase » | B. Chasse aux erreurs |
|---|---|---|
| Où | Temps « Corriger », bouton « Raisonner sur une phrase » | Activité de l'enseignant, écran propre avant « Rendre » ou à la place de l'écriture |
| Texte travaillé | Une phrase du texte de l'élève | Un court texte fourni par l'enseignant (80 mots au plus), avec erreurs placées par lui |
| Qui sait si c'est juste | Personne dans l'application : l'enseignant ou un pair | L'application, d'après le corrigé saisi par l'enseignant |
| Trace | étapes, « Je ne suis pas sûr », justification | erreurs trouvées, tentatives, indices demandés |

## 3. A : la démarche (contenu à valider par JF)

Consignes à l'infinitif, une action par puce, vocabulaire de P4 ; termes à contrôler contre le programme (test) : verbe, sujet, pronom (F346, P3), groupe sujet (F270, P3), accord (F265, P3), terminaison (F430, P4).

Choisir la phrase
- Cliquer sur une phrase de son texte.

Étape 1. Trouver le verbe
- Changer le moment de la phrase : ajouter « hier » ou « demain » au début.
- Regarder le mot qui change.
- Cliquer sur ce mot : c'est le verbe.

Étape 2. Trouver le sujet
- Chercher le groupe de mots qui fait l'action du verbe.
- Remplacer ce groupe par il, elle, ils ou elles.
- Cliquer sur le groupe de mots remplacé.
- Choisir le pronom qui convient : il, elle, ils ou elles.

Étape 3. Regarder la terminaison
- Lire le verbe avec le pronom choisi.
- Regarder la fin du verbe dans mon texte.
- Écrire la fin du verbe : ______ . *(l'application n'évalue pas ; elle garde la trace)*

Étape 4. Justifier
- Compléter : « Le sujet est ______ . Je peux le remplacer par ______ . Le verbe ______ se termine par ______ . »
- Ou dire la phrase à voix haute à un camarade ou à l'enseignant.

Étape 5. Décider
- Choisir : garder la phrase, ou retourner modifier son texte.
- Cliquer sur « Je ne suis pas sûr » si besoin : l'enseignant le voit et peut aider.

Variante « groupe nominal » (F555, F556) : même démarche, étapes 1 et 2 remplacées par « trouver le nom » et « trouver ce qui le précède et le suit (déterminant, adjectif) », puis regarder le genre et le nombre. **À rédiger après validation de la démarche ci-dessus.**

Ce qui doit rester vrai (tests) :
- aucun mot ne dépasse le vocabulaire de l'année (test existant étendu) ;
- chaque étape cite des codes du programme existants ;
- aucune phrase ne dit « bravo », « faux » ou « correct » sur la grammaire ;
- l'élève peut quitter l'atelier à tout moment sans perdre son texte.

## 4. B : la chasse aux erreurs (contenu à valider par JF)

### Côté enseignant (formulaire, avec guidage sur chaque champ)

Chaque champ aura : un libellé précis, un exemple réel de la FWB en espace réservé, et une phrase d'aide sur ce que la saisie change dans l'application.

- **Texte à corriger** (80 mots au plus) : exemple « Les élèves de 4e année prépare leur sortie à la Citadelle de Namur. Ils emporte un pique-nique. » Aide : « Écrivez le texte avec ses erreurs. L'élève le lit et cherche ce qui ne va pas. »
- **Erreurs à trouver** (une ligne par erreur) : mot erroné tel qu'il apparaît dans le texte (et son rang s'il apparaît plusieurs fois), forme attendue, type, indice.
  - Types proposés, reliés au programme : accord du verbe avec le sujet (F554) ; accord dans le groupe nominal (F555, F556) ; pluriel ou féminin particulier (F557) ; **homophone (F534, F535 en P4)**.
  - Indice : une phrase de l'enseignant, à la deuxième personne, sans donner la réponse. Si le champ reste vide, l'application utilise un indice par type (voir ci-dessous).
- **Contrôle automatique** à l'enregistrement : chaque mot erroné doit se trouver dans le texte ; une erreur ne doit pas coïncider avec la forme attendue.

### Côté élève

1. Lire le texte.
2. Cliquer sur le mot qui ne va pas.
3. Écrire la forme corrigée.
4. Justifier avec le gabarit de l'atelier (étape 4).
5. Cliquer sur « Vérifier ».

Réponse de l'application (qualitative, jamais une note) :
- mot cliqué qui est bien une erreur, forme juste : « Tu as trouvé une erreur. » + rappel de la justification attendue ;
- mot cliqué qui est bien une erreur, forme fausse : indice du type, par exemple « Regarde le sujet de ce verbe. » (sans donner la forme) ;
- mot cliqué qui n'est pas une erreur : « Ce mot est correct. Cherche encore. » (sans dire où) ;
- erreurs restantes : « Il reste N erreur(s) dans le texte. » (nombre seul) ;
- après trois essais sur une même erreur : « Demande de l'aide à ton enseignant. » ; le mot n'est pas révélé.

Ce qui doit rester vrai (tests) :
- le corrigé n'est jamais affiché à l'élève ;
- aucun score, aucun pourcentage, aucun classement ;
- aucun message ne contient « faux », « raté » ou « mauvais » ;
- l'indice par défaut ne contient pas la forme attendue.

## 5. Données et sécurité

- Texte de l'élève (justifications) : même chemin, mêmes protections que les textes ; rien dans les journaux.
- Corrigé de la chasse : jamais envoyé au navigateur de l'élève (la vérification se fait côté serveur, `api/eleve/chasse.ts`). L'élève ne reçoit que le texte et le nombre d'erreurs.
- RLS sur les nouvelles tables (`auth.uid() = user_id` côté enseignant ; accès élève uniquement par l'API avec jeton), préfixe `ecrit_`, grants explicites.

## 6. Accessibilité

- Chaque mot cliquable est un `button`, avec une cible d'au moins 44 px, un état marqué par une bordure en plus de la couleur.
- Police de l'application (Arial, au moins 16 px), pas de mur de texte : une étape à la fois.
- Aides audio existantes (« Écouter la consigne », « Écouter mon texte ») disponibles dans l'atelier.

## 7. Plan de construction (après validation)

1. Découpage d'un texte en phrases et en mots (tests : apostrophes, traits d'union, ponctuation, guillemets).
2. Données de la démarche (étapes, formulations, codes) + tests de conformité (vocabulaire, codes, tons interdits).
3. Composant Atelier (étapes, trace) + intégration au temps « Corriger ».
4. Option « Atelier » dans le formulaire d'activité, avec guidage des champs.
5. Chasse : validation du corrigé (lib, tests), puis API serveur, puis composant élève.
6. Formulaire de chasse (enseignant), avec contrôle à l'enregistrement.
7. Migration (non appliquée) et API de sauvegarde de la trace.
8. Tableau de classe : colonnes « Atelier » et « Chasse ».
9. Mise à jour du mode d'emploi, de la page jfb4plai.com et de la liste des limites.
10. Essai par JF avec des élèves de P4 à P6 avant toute ouverture.

## 8. Ce qui reste hors périmètre

- Détection automatique des accords dans le texte de l'élève (voie C, section 8 de `proposition-p4-p6.md`).
- Participe passé et fonctions détaillées (P5, P6) : modules à ajouter après lecture des items.
- Secondaire : référentiels à récupérer par JF.
