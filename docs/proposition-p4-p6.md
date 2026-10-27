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

Contrôle fait le 2026-10-27 : pour chaque terme, première année où il apparaît dans les attendus « écrire » (mot entier, avec pluriel). Limite : le contrôle lit les attendus, pas les pages du programme hors « écrire » ; un terme peut avoir été vu en classe plus tôt sans figurer dans ces items.

| Déjà nommé avant P4 (donc utilisable en P4) | Première apparition |
|---|---|
| connecteur | P1 (F72) |
| famille de mots | P1 (F15) |
| champ lexical, pronom, référent | P2 (F207, F196) |
| accent grave, accent circonflexe, racine, substitut lexical et grammatical, homophone, homonyme, synonyme, accord, genre, nombre, groupe sujet, groupe prédicat | P3 (F254, F259, F262, F346, F357, F265, F270) |

| Nouveaux en P4 (à introduire seulement s'ils servent un message) | Code |
|---|---|
| préfixe, suffixe | F527 |
| homogramme | F427 |
| anaphore | F430 |
| complément circonstanciel | F441, F541 |
| terminaison | F430, F552 |
| imparfait, conditionnel | F552 |
| adverbe | F431, F543 |

Ma première version de cette liste (section 3 du premier jet) classait « accent grave », « famille de mots », « racine », « accord » comme nouveaux en P4 : c'était faux, ils sont déjà dans les items de P1 à P3.

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

## 7. P5 et P6 : ce qui change (constaté dans les items, lu le 2026-10-27)

- **P5** (37 items) : toutes les marques de ponctuation dans une production personnelle (F663) ; accord du participe passé et formation du pluriel des noms et adjectifs (F622 à F629) ; temps et modes à conjuguer, dont passé simple (F750) ; fonctions épithète, attribut, complément du nom (F633) ; antonyme, groupe verbal, niveau soutenu (F616, F736, F608) ; connecteurs d'opposition, de conséquence, de conclusion, de synthèse (F619) ; soigner la présentation de l'écrit (F780) ; réviser, puis corriger à l'aide d'une grille de vérification et des référentiels, dictionnaire en ligne compris (F809 à F812).
- **P6** (30 items) : mêmes savoirs qu'en P5 consolidés ; « toutes les marques de ponctuation apprises » (F870) ; préfixe et suffixe (F822) ; prise de notes (F916, F917) et jugement critique sur un document (F1008 à F1010), qui sortent de l'écriture d'un texte ; réviser (F1017 à F1019).
- **Déduit** : le saut P4 vers P5 est surtout grammatical (participe passé, fonctions, temps), le saut P5 vers P6 est surtout de consolidation. Les signaux sans analyse grammaticale ne couvriront donc pas l'essentiel de ce qui est attendu en P5 et P6 : il faudra annoncer cette limite clairement dans l'application et sur la page.
- **À décider avec vous avant de coder P5 et P6** : si l'app doit proposer des questions fixes de relecture sur l'accord et les temps (sans signal), ou rester sur la planification et la révision du contenu (structure textuelle, cohérence, intention), plus proches de ce que l'application sait bien soutenir.
