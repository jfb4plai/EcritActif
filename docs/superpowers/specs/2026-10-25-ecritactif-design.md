# EcritActif (nom provisoire) : document de conception

Date : 2026-10-25, mis à jour après les réponses de JF aux trois décisions (licence, périmètre, IA). Statut : **brouillon pour validation de JF**. Rien n'est construit.
Statuts utilisés : **[JF]** décidé par JF, **[C]** constaté (fichier ou RISS lu), **[D]** déduit par Claude, **[Appel]** choix de Claude à confirmer, **[À trancher]** décision de JF requise.

## 1. Intention

Apprendre à tout élève du primaire les réflexes de l'écriture : réfléchir, écrire, relire, corriger. L'élève travaille en semi-autonomie ; l'app le guide par des questions et des indices, jamais en écrivant ou en corrigeant à sa place. L'enseignant fixe ce qui est travaillé à partir du programme CECP et lit les traces dans un tableau de bord. [JF]

Pourquoi : un élève dont le trouble ou la difficulté bloque la transcription (graphisme, orthographe, langue seconde, attention) ne montre pas sa capacité de planifier, d'organiser, de s'adresser à un lecteur. L'app lève l'obstacle par des aides choisies, sans fausser la compétence visée. [JF]

## 2. Objectifs, non-objectifs, anti-objectifs

**Objectifs** [JF] : base scientifique ; ancrage CECP ; adaptée à toutes les difficultés rencontrées par un élève ; gratuite, intuitive, efficace.

**Périmètre de la v1** [JF] : français, **P1 à P3**. Les années P4 à P6 viennent ensuite avec le même socle.

**Non-objectifs (v1)** [Appel] : autres matières que le français ; P4 à P6 ; secondaire ; correction automatique des textes ; notes ou évaluation certificative ; diagnostic de trouble ; collaboration entre élèves ; connexion GAR ou équivalent.

**Anti-objectifs** (échec même si ça fonctionne) :
- Un look qui n'engage ni élèves ni enseignants. [JF] Le design est reporté après validation du rôle pédagogique ; il sera testé avec de vrais élèves et enseignants.
- Une app qui écrit ou corrige à la place de l'élève. [D, principe PLAI IA = amplificateur]
- Des aides ou conseils présentés comme efficaces sans source (neuromythes). [JF]
- Un tableau de bord qui décide seul qu'une compétence est acquise. [D, règle PLAI]

## 3. Parcours de l'élève [JF pour la boucle, D/Appel pour le détail]

Accès par lien ou code de classe, élève identifié par un code anonyme. [Appel]

1. **Réfléchir.** L'app pose des questions tirées des principes choisis par l'enseignant (qui lira ? pour dire quoi ? dans quel ordre ?). L'élève répond ou organise ses idées dans un brouillon (texte, voix, pictogrammes). Aucune correction.
2. **Écrire.** Éditeur simple, aides activées pour cet élève. Sauvegarde automatique. Aucune correction pendant l'écriture. [C : RISS, la correction pendant la génération surcharge la mémoire de travail ; hal-04120344, dumas-05497857]
3. **Relire.** L'élève réécoute son texte. L'app pose des questions sur les critères retenus. Elle ne dit pas la réponse.
4. **Corriger.** L'app signale des catégories d'erreurs choisies par l'enseignant, sans donner la forme correcte. L'élève corrige.
5. **Décider.** L'élève choisit : continuer, réécrire, rendre. [JF]

P1 à P3 (environ 6 à 9 ans) [D] : l'élève lit encore peu seul. Toute question, consigne et retour est donc **lu à voix haute par défaut** et accompagné de pictogrammes ou d'images ; la dictée vocale est proposée dès P1 pour dire ses idées ; en P1, « relire » veut surtout dire réécouter son texte. Les formulations de §5 sont à adapter à cet âge (phrases très courtes, consignes à l'infinitif, une action par puce) et à tester avec des enfants de ces classes.

Un seul critère mis en avant à la fois par défaut. [C : les stratégies récentes concurrencent graphisme et orthographe ; hal-04120344] L'aide diminue au fil des textes (étayage décroissant, inspiré de SRSD). [D]

## 4. Parcours de l'enseignant [JF]

- **Créer une activité** : une consigne, les contraintes (longueur, genre, ressources). L'enseignant écrit sa consigne : c'est sa part singulière. L'app propose les items CECP « écrire » correspondants ; l'enseignant garde ou change. [JF pour le flux ; Appel pour la suggestion d'items]
- **Choisir les principes et les catégories d'erreurs** parmi ceux que l'app propose pour ces items. [JF]
- **Retirer une aide pour l'activité** quand elle fausserait la compétence vérifiée ; l'élève voit pourquoi. [JF]
- **Tableau de bord** : par élève, où il bloque dans les quatre temps, quelles aides il utilise, ses versions successives ; par programme, les items CECP travaillés, à travailler, non vus. L'enseignant valide « acquis » ; l'app présente des traces, ne décide pas. [JF pour le but ; Appel pour l'affichage]

## 5. Aides et réglages

Principe [JF] : un réglage, deux décideurs possibles (l'élève ou l'enseignant). Aucune aide n'est liée à un niveau, à un diagnostic ou à une étiquette. L'élève nomme ce qui le gêne ; l'app propose des aides. [Appel pour les formulations ci-dessous, à tester]

| Ce qui me gêne | Aides proposées | Appui |
|---|---|---|
| Je ne trouve pas d'idées / je ne sais pas par où commencer | Questions de départ, organisateur graphique du genre de texte, dictée de ses idées | [C] hal-04120344 (planification et organisateur, SRSD) |
| Écrire est lent ou fatigant | Dictée vocale (le clavier est le mode d’écriture de base de l’app) | [C] dumas-05497857 (dictée vocale, limites : syntaxe correcte et articulation précise requises) |
| Je me trompe dans les mots | Retiré du catalogue le 2026-10-26 (prédiction de mots non construite) ; l’écoute du texte à la relecture reste proposée | [C] dumas-05497857 |
| Je ne vois pas mes erreurs en relisant | Réécoute du texte, une catégorie d'erreur à la fois | [C] dumas-05497857 (retour vocal aide à l'autocorrection) |
| Les sons et les lettres se mélangent à la lecture | Colorisation phonémique ou syllabique, **proposée comme option** | [C] dumas-03282114 : n=65 dyslexiques CE1-CE2, colorisation sans effet sur la vitesse de lecture, meilleure précision de lecture, préférée par les enfants. Mémoire d'orthophonie, **lecture** et non écriture : l'effet sur l'écriture est [D] non étayé |
| Le français est ma deuxième langue | Consigne découpée et lue à voix haute, pictogrammes Arasaac, brouillon | [C] hal-03194300 (coût cognitif plus élevé en L2) ; Arasaac : [D] à étayer |
| Je perds le fil / je n’arrive pas à rester concentré | Retiré du catalogue le 2026-10-26 (« séances courtes » sans fondement ni comportement) ; la sauvegarde automatique et une seule question à la fois restent | [D] hal-04120344, dumas-01357755 ; effet sur l’écriture du TDAH non étayé dans le RISS |
| Je ne sais pas ce que le lecteur doit comprendre | Questions sur le destinataire, relecture « avec les yeux du lecteur » | [C] hal-04120344 ; TSA : dumas-02108358 (récits courts, informations inadaptées au contexte), écrit [D] |
| J'ai peur de me tromper / je me décourage | Retours centrés sur ce qui est réussi, choix de continuer, de réécrire ou de rendre | [C] dumas-05110873 (sentiment de compétence), dumas-05497857 (anxiété de performance) |
| Je trouve les mots difficilement | Banque de mots écrite par l’enseignant (insertion d’un clic), pictogrammes, dictée | [C] dumas-03246050 (élaborer un récit, dénommer) pour le trouble du langage ; lexique [D] |

Réglages d'affichage (police, taille, interligne, contraste) : Arial par défaut, **sans promouvoir de police spéciale**. [Appel, voir §8] Aucun réglage n'est présenté comme « pour dyslexique » ou « pour visuel ».

**Singularité de l'enseignant (ajouté le 2026-10-26)** : en plus des questions fixes, l'enseignant écrit une question par temps (réfléchir, relire, corriger) et sa propre banque de mots pour chaque activité. Ces ajouts ne passent pas par le RISS : ce sont ses mots. [JF, amélioration 4]
**Collage** : l'élève ne peut coller que du texte qu'il a lui-même écrit ; un refus est tracé (`collage-refuse`) et expliqué à l'enfant. [JF, amélioration 3]

## 6. Ancrage CECP [C pour les données, D/Appel pour l'usage]

Données : `referentiels-fwb\P1..P6\francais.json`. Items « écrire » (tag) : **P1 24, P2 25, P3 33 (82 pour la v1)**, P4 32, P5 37, P6 30 (hors v1). Chaque item porte un code (ex. F600, F601), un type (Savoir, Savoir-faire, Compétence), des attendus, une page PDF. Le rapport de preuve établit que le texte du JSON est égal au texte du PDF, avec 6 pages corrigées de façon déclarée ; il ne couvre pas les images ni le rattachement des attendus dans les cellules fusionnées.

Points d'attention [C] :
- Plusieurs items « écrire » ont `rubrique` = null (P3 17, P4 14, P5 20, P6 13). Le lien aux principes ne peut pas reposer sur la rubrique seule : utiliser les codes et le contenu.
- Rubriques utiles : « Vérifier et ajuster sa production » et « Réviser sa production écrite » (P4, F600/F601, attendus : relire et vérifier le contenu des idées et leur organisation ; ajuster d'après les pistes issues d'un échange avec les pairs) correspondent aux temps « relire » et « corriger ».
- Les séquences du programme donnent des activités d'écriture modèles (P4 : autoportrait, critique d'album, règles d'un jeu, texte poétique).

Usage [Appel] : un principe de l'app = une formulation d'élève rattachée à un ou plusieurs codes CECP. L'enseignant coche des principes ; la carte du programme se calcule à partir des codes. L'app ne réécrit jamais le texte officiel ; elle le cite.

## 7. Retour à l'élève

**Par défaut, sans IA** [JF] : tout le retour est déterministe, local et gratuit. Longueur, présence des éléments demandés, majuscules et points, colorisation, réécoute, catégories d'erreurs par règles (correcteur ou dictionnaire local, **choix à évaluer**). Les questions de planification et de relecture sont des **questions fixes rattachées aux codes CECP** et écrites avec l'enseignant ; chacune est vérifiée dans le RISS avant d'être publiée. [Appel]
**IA en option de l'enseignant** [JF] : désactivée tant que l'enseignant ne l'active pas, activation par activité ou par classe (reformulation simple de la consigne, conseil qualitatif en plus des questions fixes). Derrière une couche unique à deux fournisseurs, local ou API, au choix de l'établissement [JF pour le principe] : modèle local (Ollama, qwen2.5:7b est installé chez JF [C]) ou API Claude (Haiku 5.5 par défaut) [Appel]. La couche IA n'est pas livrée avec la v1 sans test préalable sur des textes d'élèves. [Appel]

Limites constatées [C, essais de JF du 2026-10-23, autre tâche : courriers] : avec qwen2.5:7b les faits tenus par le code sont fiables, le sens réécrit ne l'est pas, les sorties ne sont pas reproductibles même à température 0. Conséquences [D] :
- l'IA ne produit jamais de forme correcte à l'élève ; un filtre vérifie que la sortie ne contient pas de réécriture du texte ;
- chaque retour est présenté comme une question ou un indice ;
- le comportement sur l'écriture d'élèves reste **à tester** avant tout usage en classe ; rien n'est testé à ce jour.
Un modèle de 7 milliards de paramètres tourne sur le poste de l'enseignant ou un petit serveur, pas sur chaque appareil d'élève. [D]

## 8. Base scientifique et neuromythes

- Noyau [C] : trois processus (planification, mise en texte, révision), coût de la transcription, enseignement explicite de l'autorégulation (SRSD, effet moyen 1,17 contre 0,59 selon Graham et al. 2012, **cité dans hal-04120344, non lu directement** : « réel, hors lecture directe »).
- Règle : chaque aide, conseil ou réglage affiche sa source RISS ou la mention « hors corpus RISS » ou « non étayé ».
- Neuromythes à ne pas encoder [C pour l'existence du biais] : styles d'apprentissage et intelligences multiples sont cités comme croyances erronées fréquentes chez les enseignants (hal-03375571). L'app ne propose donc pas de « profil visuel, auditif, kinesthésique ».
- Police : le RISS rapporte une absence d'effet significatif de la police Dyslexie par rapport à Arial (cité dans dumas-03282114). Pour OpenDyslexic, une étude de 2016 est citée dans dumas-04002152 ; **son résultat n'a pas été lu**. [Appel] Arial par défaut ; aucune police spéciale promue comme efficace ; toute police ajoutée devra être un réglage neutre.
- Lacunes RISS [C] : aucune source directe sur l'écriture de texte chez le TDAH ni chez le TSA (hors récit), pas de source sur l'efficacité de l'IA générative pour apprendre à écrire, pas de source sur Arasaac pour l'écriture. Ces cases restent « non étayé » dans l'app.
- Type de sources [C] : le RISS retourne surtout des mémoires et des thèses ; peu d'articles empiriques sur l'écriture. L'app ne doit pas affirmer plus que ce que ces sources établissent.

## 9. Données et vie privée [Appel]

Élèves identifiés par un code anonyme, aucun nom, aucun diagnostic stocké. Les textes d'élèves restent dans la base du projet ; l'option IA est désactivée par défaut. Avec le mode API, les textes quittent l'établissement : l'enseignant en est averti avant de l'activer. RLS actif, préfixe de tables `ecrit_` (à vérifier par le grep des tables existantes avant tout `create table`), grants Data API dans la même migration. Aucune clé côté frontend.

## 10. Licences

- **Moteur de colorisation** [JF : « mentionne simplement la licence »] : l'app **mentionne** la licence et les crédits du moteur (page « À propos » et en-tête du module) : port JS de JF du projet C# de Pierre-Alain Etique, sous GPL-3.0 [C : `License_gpl-3.0.txt` à la racine du dépôt], lui-même « profondément inspiré par LireCouleur » [C : README]. La licence exacte de LireCouleur **n'est pas vérifiée**. La structure du code et la licence de l'app autour du module ne sont pas décidées ici : à reprendre au plan, avant d'intégrer du code. Note : mentionner la licence ne dispense pas d'en respecter les conditions (code source du module, texte de la licence, conditions de redistribution), ce n'est pas un avis juridique.
- **Arasaac** : JF indique que ce n'est pas un problème. [JF]
- **Dépôts PLAI** en PolyForm NC : incompatible avec une réutilisation de code GPL-3.0 dans le même dépôt. [D]

## 11. Technique par défaut [Appel]

React 18, Vite 5, Tailwind 3, Supabase partagé, Vercel (fonctions serveur `/api/*`), repo GitHub `main`, build local avant push. Tester les fonctions serveur avec `vercel dev`. Éditeur de texte maison dans le navigateur ; **OnlyOffice n'est pas utilisé comme moteur** (serveur de documents à héberger, contradictoire avec gratuit et simple ; non vérifié ici). Audio : synthèse vocale du navigateur à évaluer pour la qualité en français belge [D, non testé] ; dictée vocale : à évaluer (le micro exige un contexte HTTPS).

## 12. Réussite et test

La réussite n'est pas « l'app marche » : elle se mesure auprès de vrais utilisateurs. [D, règle de conduite]
- Critères à fixer avec JF **avant** les premiers essais et à ne plus modifier après (méthode utilisée pour le projet courrier) : par exemple, des élèves de profils variés terminent-ils les quatre temps seuls ? Les textes réécrits s'améliorent-ils sur les critères choisis ? Les enseignants lisent-ils le tableau de bord sans aide ?
- Tests à faire : un parcours réel d'élève, en `file://` si exportable et à l'URL publique, sur tablette ; un parcours enseignant ; chaque aide testée avec un élève qui en a besoin.
- Ne jamais écrire « marche pour tout élève » ; écrire ce qui est testé, par qui, et ce qui ne l'est pas.

## 13. Ce que l'app ne fait pas bien (à dire à l'utilisateur) [D]

- Elle ne remplace ni l'enseignement explicite par l'enseignant, ni une rééducation.
- Elle ne détecte pas une difficulté qui n'apparaît pas dans les traces.
- Le retour IA peut se tromper ; l'enseignant reste juge.
- Certaines aides n'ont pas de preuve pour l'écriture (voir §8) ; elles sont proposées comme options.

## 14. Extensions (coût et bénéfice) [Appel]

| Extension | Bénéfice | Coût |
|---|---|---|
| P4 à P6 | Complète le primaire ; 99 items « écrire » de plus | Principes et questions fixes à écrire et à vérifier dans le RISS pour chaque année |
| Autres matières (sciences, histoire, éveil) | L'écriture est transversale dans le CECP | Items CECP à rattacher matière par matière ; JSON déjà extraits |
| Secondaire (CE1D, CESS) | Même boucle, public plus large | Référentiels secondaires à extraire et à prouver |
| Tableau de bord inter-classes ou lien AménagActif | Suivi des aménagements | Données sensibles, accord DPO |
| Collaboration entre élèves | Demande des enseignants (idée vue ailleurs, non évaluée) | Conception, modération |

## 15bis. Qualité de la rétroaction et littératie à la rétroaction (ajouté le 2026-10-26)

Origine : les deux articles co-écrits par JF (« Développer la littératie à la rétroaction dans l'enseignement obligatoire en FWB » ; « La littératie de la rétroaction avant l'esprit critique et l'usage de l'IA »), lus en entier le 2026-10-26. [JF]

**Deux notions distinctes, toutes deux construites :**
1. **Qualité de ce que l'app dit à l'élève** (`src/lib/qualite.ts`). Un retour sur le travail est accepté seulement s'il est : centré sur la tâche et le processus, pas sur la personne ; précis (dit où) ; actionnable (propose quoi faire) ; sans note chiffrée ; sans louange vide ni validation complaisante. Un test applique ces critères à tous les messages produits par l'app (indices des signaux, retours sur la longueur, bilan du texte rendu, explications). Un constat sans action est admis pour un bilan, pas pour un retour correctif. [C] sources : hal-05348650 (Hattie & Timperley 2007 résumé : rétroaction sur la tâche, le processus, l'autorégulation, la personne ; la rétroaction descriptive a le plus de potentiel ; une note seule est inefficace et diminue la motivation), hal-04646895 (Calone & Lafontaine 2023, ULiège : la qualité du feedback est primordiale, la note est un feedback pauvre) lus dans le RISS. Louange vide et complaisance : article de JF, **hors corpus RISS**.
2. **Littératie à la rétroaction de l'élève** : l'élève apprend à lire et à utiliser les retours.
   - « Je ne comprends pas » sur chaque signal et chaque question de relecture : explication simple de la règle, sans la forme corrigée, et trace pour l'enseignant. Demander de l'aide est présenté comme apprendre. (Disposition « je peux demander de l'aide », article de JF.)
   - « Deux étoiles et un souhait » avant de rendre : facultatif, enregistré, visible dans le tableau de bord. (Black et al. 2004, cité dans l'article de JF : **réel, hors corpus RISS**.)
   - « Essayer autrement : une nouvelle version » : la version d'avant reste visible à côté, et l'élève dit ce qui est mieux. (Appropriation : comparaison avant-après, article de JF.)
   - Bilan du texte rendu : un fait sur le travail (mots, versions), jamais « Bravo ».

**Contrainte pour toute IA activée plus tard par l'enseignant** : sa rétroaction doit passer `evaluerQualite` avant d'être montrée à l'élève, et elle doit pouvoir dire « pas encore ». Une IA réglée pour être « bienveillante » sans ancrage dans le texte est refusée par construction. [article de JF « GPT-4o est mort »]

**Deux points à vérifier par JF avant publication (non tranchés par Claude) :**
- **Tranché par JF le 2026-10-26** : l'app retient le découpage vérifié dans le RISS (1118375ar, Hausman et al. 2025, ULiège, qui résume Carless & Boud 2018) : comprendre la rétroaction, porter un jugement évaluatif, gérer l'affect (les émotions), agir. Correspondance avec ce qui est construit : comprendre = « Je ne comprends pas » ; juger = « Deux étoiles et un souhait » ; agir = « Essayer autrement » et la version d'avant ; **gérer ses émotions = version minimale construite le 2026-10-26** : un mot sur l'erreur (« Se tromper, c'est normal : on apprend en essayant autrement ») visible aux temps Relire et Corriger, et un temps pour respirer facultatif, fermé par défaut, tracé (`respiration:faite`) sans jamais bloquer. Sources lues dans le RISS : hal-04646895 (les erreurs font partie de l'apprentissage et sont des occasions d'apprendre) ; W4412804449 (Coppini 2025, régulation des émotions à l'école primaire : la réévaluation limite l'effet négatif des émotions sur la performance) ; dumas-05337696 (Lemaire 2025, CP et CM1 : une respiration guidée régulière, menée par l'enseignant, réduit l'agitation ; rien de conclu sur les apprentissages ; petit mémoire) ; 1118375ar (certaines émotions désagréables remobilisent : il s'agit de les comprendre, pas de les éviter). **Non étayé** : un bouton de respiration ponctuel dans une app (la source porte sur une pratique régulière encadrée) ; dumas-04013664 (extrait seul lu) avertit que les retours au calme ne développent pas à eux seuls la gestion émotionnelle. La page À propos dit que l'essai avec des élèves reste à faire. Non construit : nommer ses émotions (donnée sensible sur des enfants, non stockée). Les quatre « dimensions » de l'article de JF (dispositions, conception, littératie au sens strict, appropriation) restent son cadre de programme pour l'enseignement : l'article est à relire pour ne pas les attribuer telles quelles à Carless & Boud. Le même document du RISS nuance la recommandation d'éviter tout affect négatif : certaines émotions désagréables remobilisent l'élève.
- Le code couleur vert / orange / rouge de l'article de JF (réussi / presque / à retravailler) n'est pas repris : dans l'app, vert, orange et bleu désignent déjà les temps Écrire, Relire et Corriger. Reprendre ces couleurs pour une évaluation créerait un conflit de sens. Une auto-évaluation en trois niveaux devra passer par des mots et des symboles, ou par une autre palette.

Non construit : tableau de bord de la qualité des commentaires de l'enseignant (il n'y a pas encore de commentaire enseignant dans l'app), instrument SFLI-S (Weidlich et al. 2025, **non vérifié** dans le RISS), évaluation par les pairs.

## 15quater. Singularité : l'ancrage dans la FWB, par deux textes combinés (2026-10-26)

Exigence de JF : l'ancrage dans la Fédération Wallonie-Bruxelles et le programme CECP est une singularité de l'app ; elle doit s'y conformer et y faire référence. Les deux textes sont **à combiner** (JF, 2026-10-26).

**Les deux sources** (dossier `referentiels-fwb`, texte cité tel quel, jamais reformulé) :
1. Le **référentiel de français et langues anciennes, tronc commun FWB**, section français (`francais/P1.json` à `P3.json`, pages 37-52, 53-69, 70-87) : ce que l'élève doit pouvoir faire à l'écrit, palier de scripteur attendu, composantes de la production d'écrit. Généré par `scripts/build-referentiel.mjs` dans `src/data/referentiel-ecrire.json`.
2. Le **programme d'études de l'enseignement primaire (CECP, Wallonie-Bruxelles Enseignement)** (`P1..P3/francais.json`) : 82 items « écrire » avec leurs codes. Généré par `scripts/build-cecp.mjs`.

**Ce que le référentiel apporte, constaté dans les fichiers** :
- Les composantes de la production d'écrit à verbaliser : planification, mise en texte, révision en **P1** ; la **correction s'ajoute en P2** (P2 et P3 : quatre composantes). Les quatre temps de l'app les reprennent ; le programme CECP les nomme aussi (F282, P3).
- Palier de scripteur attendu : « scripteur émergent vers scripteur débutant » (P1), « scripteur débutant » (P2), « scripteur en transition » (P3). **50 % de formes correctes en fin de P2** (seul chiffre présent dans les fichiers pour P1 à P3). Le rapport d'extraction annonce 60 % pour P3, mais le champ du fichier P3 est vide : **à vérifier dans le PDF**, non repris dans l'app. L'app ne mesure pas les formes correctes et ne l'affirme nulle part.
- L'attendu officiel de l'écrit : rester dans le sujet ; tenir compte de l'intention et du destinataire ; structure textuelle simple donnée ; majuscule et point ; segmentation en mots (P1, P2) ; mots connus correctement orthographiés ; ressources de la classe ; organisateurs textuels et substituts lexicaux (P3).

**Où l'app le montre** : page d'accueil (pour quel programme elle est faite) ; page « À propos » (les deux textes, les fichiers sources, les composantes par année) ; écran de l'élève, rubrique fermée « Dans le programme (pour les adultes) » (attendu du référentiel + items CECP de l'activité, texte tel quel) ; formulaire de l'enseignant (attendu du référentiel, terme du programme à côté de chaque temps, codes de chaque principe) ; tableau de bord (fichier source et palier de scripteur).

**Ce qui le garantit (tests)** : chaque terme de vocabulaire est relié à un code d'item et vérifié contre les données ; chaque temps correspond à un terme de F282 ; chaque principe cite des codes existants ; un test refuse tout repère de l'école française (collège, lycée, CE1, CM2, cycle 3, GAR, ENT…) dans ce que lisent l'élève et l'enseignant.

**Décisions en attente de JF** (non tranchées par Claude) :
- **P1 et la correction** : le référentiel ne nomme que trois composantes en P1. L'app propose quatre temps dès P1. À décider : fusionner « Relire » et « Corriger » en P1 (trois temps), ou garder quatre temps partout. Source : référentiel P1, « Verbaliser les composantes de la production d'écrits ».
- **Nouveaux principes tirés de l'attendu officiel** (en brouillon, à valider avec sources) : « Ton texte reste-t-il dans le sujet ? » ; « As-tu séparé chaque mot par un espace ? » (P1, P2) ; « As-tu relié tes phrases avec des mots comme « puis » ou « ensuite » ? » (organisateurs textuels, P3).

## 15ter. Adapter l'approche au niveau des élèves (2026-10-26)

Demande de JF : « il faudra de toute façon adapter l'approche avec le niveau des élèves ».

**Construit (points 1 et 2, validés par JF)**
1. Le niveau (P1, P2, P3) est enregistré avec l'activité (`ecrit_activites.annee`, migration non appliquée) et transmis à l'écran de l'élève.
2. Les messages de l'app n'emploient que le vocabulaire que le programme CECP fait nommer à l'élève cette année-là (`src/lib/vocabulaire.ts`, chaque terme relié à un code d'item et vérifié par test contre `cecp-ecrire.json`). Exemple : la fin de phrase s'explique par le point en P1 (F40), le point, le point d'interrogation et le point d'exclamation en P2 (F156), avec le terme « signe de ponctuation » en P3 (F255). Les voyelles, consonnes, accents, virgule, apostrophe et parenthèses (P3, F254, F295) ne sont pas employés avant P3.

**Correction d'une affirmation de Claude** : il avait écrit que « majuscule » et « ponctuation » n'apparaissaient qu'en P3. C'est faux : le CECP nomme déjà la majuscule, le point, le point d'interrogation et « les signes de ponctuation » en P1 (F10, F39, F40). Le tableau de vocabulaire a été construit sur les attendus lus.

**Non construit : hypothèses à tester avec des enseignants de P1 à P3** (aucune source ne fixe ces seuils d'âge)
- une seule réussite et un souhait en P1, deux réussites et un souhait en P2 et P3 ;
- explications plus courtes en P1 ;
- deux respirations en P1 au lieu de trois.
Les aides (dictée, pictogrammes, colorisation, etc.) restent liées au profil de l'élève et non à son niveau, comme JF l'a décidé.

**Limite** : seuls les messages sur la fin de phrase changent selon l'année aujourd'hui, car ce sont les seuls qui employaient un mot technique du programme. Le mécanisme est en place pour les prochains messages (règle : tout nouveau message passe le test de vocabulaire de son année).

## 15. Questions ouvertes

Tranchées par JF le 2026-10-25 : licence mentionnée simplement ; v1 = P1 à P3 ; IA désactivée par défaut, option de l'enseignant.
Restent ouvertes, non bloquantes pour le plan : critères de réussite des premiers essais (§12) ; choix du correcteur local (§7) ; qualité de la voix de synthèse en français belge (§11) ; licence de LireCouleur (§10) ; structure du code autour du module GPL-3.0 (§10, à reprendre avant d'intégrer du code).
