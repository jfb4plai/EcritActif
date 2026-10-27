# P4 à P6 : état et propositions à valider par JF (2026-10-27)

Statuts : **constaté** (lu dans les fichiers ou testé), **déduit**, **à valider** (décision de JF).

## 1. Ce qui est fait (constaté)

- Données P4 à P6 chargées : CECP « écrire » (P4 : 32 items, P5 : 37, P6 : 30 ; 398 codes uniques sur P1 à P6, aucun code partagé entre deux années) et référentiel du tronc commun (pages 88-108, 109-131, 132-153 ; palier de scripteur ; 60 % de formes correctes dans le fichier de P4, 80 % dans celui de P6, rien dans celui de P3 et de P5).
- Les quatre temps (planification, mise en texte, révision, correction) sont nommés par le référentiel de P3 à P6 : aucun changement de boucle.
- Type `Annee` élargi à P1-P6 ; tests : 327 verts.
- Les années **P4 à P6 ne sont pas proposées aux enseignants** (`ANNEES_PROPOSEES` dans `src/types.ts`) : la base refuserait ces activités tant que la migration `20261027_ecrit_annees_p4_p6.sql` n'est pas appliquée (non appliquée), et le contenu ci-dessous n'est pas validé.
- Provisoire : en P4 à P6, les trois signaux existants (majuscule, point, mot répété) reprennent les explications de P3 (aucun mot nouveau).

## 2. Ce que le programme de P4 demande à l'écrit (constaté, codes CECP)

- Réviser : « Relire sa production et vérifier : le contenu des idées ; leur organisation dans des phrases respectant une structure dominante choisie (à l'aide d'une grille de révision) ; le respect de l'intention poursuivie ; le respect des critères spécifiques déterminés par l'enseignant » ; ajuster d'après un échange avec les pairs (F600, F601).
- Phrase : reconnaître groupe sujet, groupe prédicat, groupe complément circonstanciel ; respecter la structure des phrases simples avec une ponctuation adéquate (F541, F542).
- Cohérence : connecteurs de temps, d'espace, d'énumération, de cause, d'addition (F429) ; reprises d'information, substituts lexicaux et grammaticaux, anaphore (F524 à F526).
- Orthographe grammaticale : accord du verbe avec le sujet, des déterminants et adjectifs en genre et en nombre (F554 à F557).
- Structure textuelle : cinq structures dominantes (F457) ; organiser un message selon une structure (F520 à F523).
- Lexique : familles de mots, racines, champ lexical, homophones, homogrammes (F424 à F428, F534, F535).

Les items de P5 et de P6 n'ont pas encore été lus un à un : à faire avant de proposer leur vocabulaire.

## 3. Vocabulaire à introduire en P4 (à valider)

Chaque terme doit être relié à un code d'item (test existant). Les termes ci-dessous sont lus dans les attendus de P4 ; **je n'ai pas encore vérifié lesquels étaient déjà nommés en P1 à P3** (le premier contrôle automatique était trop grossier : un mot comme « nom » apparaît dans « nommer »). À contrôler par un test plus strict avant toute inscription.

| Terme | Code P4 |
|---|---|
| accent grave, accent circonflexe | F422 |
| famille de mots, racine | F424 |
| champ lexical, substitut lexical, homophone, homogramme | F427, F428 |
| connecteur | F429 |
| accord, genre, nombre, anaphore | F430 |
| groupe sujet, groupe prédicat, complément circonstanciel | F541 |

## 4. Signaux possibles en P4 (à valider)

Règles simples, sans IA, comme les trois premiers : elles détectent une forme, pas le sens, et peuvent se tromper. Chacune devra être annoncée comme telle.

| Signal | Règle | Code | Risque de faux positif |
|---|---|---|---|
| Phrase très longue | plus de N mots sans ponctuation forte (N à fixer avec des textes d'élèves) | F541, F542 | un élève qui énumère |
| Même début de phrase | trois phrases consécutives commençant par le même mot | F524 (reprises) | répétition voulue (« Il y a… ») |
| Aucun connecteur | texte de 3 phrases ou plus sans aucun mot de la liste de F429 | F429 | liste fermée de connecteurs : oublie ceux qu'elle ne contient pas |

**Non proposé : l'accord (sujet-verbe, genre, nombre, F554 à F557).** Aucune règle simple ne le détecte sans analyse grammaticale ; une règle approximative signalerait à tort des phrases correctes. Cela exigerait une analyse linguistique (hors v1) ou une IA locale, qui est une décision à part. En attendant, l'accord peut rester une **question fixe** de relecture, posée sans signal (voir 5).

## 5. Questions fixes de relecture (brouillons à valider, chacune avec ses codes)

À écrire à la deuxième personne, une action par question, vocabulaire de P4 uniquement :

- Relire le contenu : « Toutes mes idées sont-elles dans le sujet ? » (F600).
- Relire l'organisation : « Mes idées sont-elles rangées dans l'ordre de ma structure ? » (F520, F600).
- Intention : « Mon texte dit-il ce que je voulais dire à mon lecteur ? » (F600, F461).
- Accord (question seule, sans signal) : « Le verbe est-il accordé avec son sujet ? » (F554).
- Critères de l'enseignant : couverts par « vos propres questions » existantes.

Statut de chacune : **brouillon**, sans source RISS tant qu'on n'a pas lu un article précis ; la source officielle est l'attendu du programme.

## 6. Ordre proposé

1. JF valide (ou corrige) les sections 3, 4 et 5 pour P4.
2. Je code P4 (vocabulaire, explications, signaux, principes en brouillon), tests d'abord ; P4 reste fermée aux enseignants.
3. JF donne son accord pour appliquer la migration (essai d'abord dans `supabase/essai-rollback-annees.sql`, transaction annulée), puis on ouvre P4.
4. Même démarche pour P5, puis P6, en lisant leurs items avant de proposer.
5. Mise à jour de la page jfb4plai.com (années disponibles, limites).
