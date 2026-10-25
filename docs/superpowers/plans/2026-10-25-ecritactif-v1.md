# EcritActif v1 (P1 à P3) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Une web app gratuite où l'élève de P1 à P3 apprend les réflexes réfléchir, écrire, relire, corriger en semi-autonomie, avec des aides choisies selon ce qui le gêne, et où l'enseignant fixe les principes à partir des items CECP et lit les traces.

**Architecture:** SPA React/Vite. Élèves sans compte (code de classe + code élève) qui passent par des fonctions serveur Vercel ; enseignants authentifiés Supabase (RLS). Retour 100 % déterministe en v1 (aucune IA). Données CECP figées en JSON dérivé de `referentiels-fwb`. Module de colorisation isolé derrière une seule interface.

**Tech Stack:** React 18, TypeScript, Vite 5, Tailwind 3, Vitest + Testing Library, Supabase v2, Vercel Functions (`api/*.ts`).

**Spec:** `C:\Users\jfbeg\OneDrive\claude-workspace\ecritactif\docs\superpowers\specs\2026-10-25-ecritactif-design.md` (lire en entier avant la tâche 1).

## Global Constraints

- Dossier du projet : `C:\Users\jfbeg\OneDrive\claude-workspace\ecritactif\`. Dépôt git local, branche `main`. Aucun `git push` ni création de dépôt GitHub sans accord de JF.
- `npx vite build` et `npx vitest run` passent avant chaque commit qui touche `src/` ou `api/`.
- Chaque message de commit se termine par `Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>`.
- Imports dans `api/*.ts` : extension `.js` obligatoire (sinon FUNCTION_INVOCATION_FAILED sur Vercel).
- Tester les fonctions serveur avec `vercel dev`, jamais `vite dev` seul.
- Tables Supabase : préfixe `ecrit_`, `grant` explicites dans la même migration, RLS actif, `profiles` et trigger `updated_at` réutilisés, jamais recréés. Avant tout `create table` : `grep -rIn "create table" --include=*.sql --exclude-dir=node_modules ..` depuis la racine du workspace.
- Application d'une migration sur la base partagée (`dfoaumjleqtxjeaplnna`) : seulement avec l'accord explicite de JF ; essais dans une transaction annulée.
- Aucune clé dans le frontend ni dans un `console.log`. Aucun log de texte d'élève.
- Élèves : code anonyme uniquement, aucun nom, aucun diagnostic stocké.
- Interface : Arial par défaut, 16 px minimum, contraste suffisant, un seul critère mis en avant à la fois, consignes aux élèves à l'infinitif, une action par puce, exemples FWB (jamais « collège/lycée » ni exemples français).
- Chaque champ de formulaire enseignant : label précis, placeholder concret, texte d'aide sous le champ sur l'effet de la saisie.
- Branding PLAI : teal `#0f6e56`, orange `#f97316`, DM Sans + DM Serif Display ; `C:\Users\jfbeg\OneDrive\claude-workspace\shared\css\plai-style.css` copié dans `src/` ; logo `public/plai-logo.jpg` à `height: 32px; width: auto` (ratio 2,56:1, jamais `width` = `height`).
- Aucune aide, aucun conseil ni principe n'est présenté comme efficace sans source RISS vérifiée par `mcp__RISS__search_articles`, ou mention « hors corpus RISS » ou « non étayé ».
- Pas de profil « visuel/auditif/kinesthésique », pas de police spéciale promue.
- Périmètre v1 : français, P1 à P3 (82 items « écrire » : 24, 25, 33). IA : hors v1.
- Retour à l'élève : jamais de forme corrigée, jamais de réécriture du texte.

## Review Focus

1. Élève qui ferme l'onglet ou perd le réseau en écrivant : le texte revient au rouvrir (Tâche 14).
2. Texte vide, d'un mot, ou de plus de 5 000 caractères avec apostrophes typographiques `’` : aucun plantage, message gentil (Tâches 5 et 9).
3. Navigateur sans synthèse ni reconnaissance vocale : l'aide est masquée avec une phrase d'explication, pas d'erreur (Tâche 7).
4. Code élève mal recopié (0/O, 1/I/l) : alphabet sans caractères ambigus ; même message pour code de classe ou d'élève erroné (Tâches 10 et 11).
5. L'enseignant retire une aide pendant que l'élève écrit : l'aide disparaît au prochain enregistrement avec la raison affichée, sans perdre le texte (Tâche 14).

---

### Task 1: Squelette, branding, outillage

**Files:**
- Create: `package.json`, `vite.config.ts`, `tailwind.config.js`, `postcss.config.js` (avec `import.meta.url`), `index.html` (polices Google DM Serif Display + DM Sans), `src/main.tsx`, `src/App.tsx`, `src/plai-style.css`, `public/plai-logo.jpg`, `src/test/setup.ts`
- Test: `src/App.test.tsx`

**Interfaces:** Produces : `App` (composant par défaut) ; script `npm test` = `vitest run`.

- [ ] **Step 1:** `git init -b main` dans le dossier ; copier `shared\css\plai-style.css` et `projets\portail-plai\public\plai-logo.jpg`.
- [ ] **Step 2:** Test `App.test.tsx` : `render(<App/>)` ; `getByRole('img', {name: /PLAI/i})` a `style.height === '32px'` et pas d'attribut `width` égal à `32` ; la page contient un `<nav>` et un `<footer>`.
- [ ] **Step 3:** Lancer `npx vitest run` : attendu FAIL (App absente).
- [ ] **Step 4:** Créer le squelette Vite React TS + Tailwind 3 avec nav, conteneur et footer PLAI.
- [ ] **Step 5:** `npx vitest run && npx vite build` : attendu PASS.
- [ ] **Step 6:** Commit `chore: squelette EcritActif avec branding PLAI`.

### Task 2: Données CECP P1 à P3

**Files:**
- Create: `scripts/build-cecp.mjs`, `src/types.ts`, `src/data/cecp-ecrire.json` (généré), `src/lib/cecp.ts`
- Test: `src/lib/cecp.test.ts`

**Interfaces:** Produces :
```ts
export type Annee = 'P1' | 'P2' | 'P3';
export interface ItemCecp { id: string; annee: Annee; codes: string[]; type: 'Savoir'|'Savoir-faire'|'Compétence'; rubrique: string|null; contenu: string; attendus: string[]; pagePdf: number }
// cecp.ts
export function itemsParAnnee(a: Annee): ItemCecp[];
export function itemParCode(code: string): ItemCecp | undefined; // code ex. 'F600'
```
`id` = `${annee}:${codes.join('+')}`. Source : `referentiels-fwb\P{1,2,3}\francais.json`, items dont `tags` contient `"écrire"`.

- [ ] **Step 1:** Tests : `itemsParAnnee('P1').length === 24`, `'P2' === 25`, `'P3' === 33` ; tous les `id` uniques ; chaque item a ≥ 1 code et ≥ 1 attendu ; `itemParCode(c)` retrouve l'item pour chaque code (161 codes uniques sur les 82 items).
- [ ] **Step 2:** `npx vitest run src/lib/cecp.test.ts` : FAIL.
- [ ] **Step 3:** Implémenter `build-cecp.mjs` (lit les 3 JSON, écrit `cecp-ecrire.json`, ne reformule jamais le texte) et `cecp.ts`. `rubrique` reste `null` quand elle l'est dans la source.
- [ ] **Step 4:** `node scripts/build-cecp.mjs && npx vitest run src/lib/cecp.test.ts` : PASS.
- [ ] **Step 5:** Commit `feat: donnees CECP ecrire P1-P3`.

### Task 3: Principes (questions fixes) avec sources

**Files:**
- Create: `src/data/principes.json`, `src/lib/principes.ts`, `docs/principes-protocole.md`
- Test: `src/lib/principes.test.ts`

**Interfaces:** Consumes : `itemParCode`. Produces :
```ts
export type Phase = 'reflechir'|'ecrire'|'relire'|'corriger';
export type Source = { kind:'riss'; ids:string[] } | { kind:'hors-riss' } | { kind:'non-etaye' };
export interface Principe { id: string; phase: Phase; question: string; codes: string[]; source: Source; statut: 'brouillon'|'valide' }
export function principesPour(codes: string[], phase: Phase, opts?: { brouillons?: boolean }): Principe[];
```
Par défaut `principesPour` ne renvoie que `statut === 'valide'`.

- [ ] **Step 1:** Tests : chaque `code` de chaque principe existe (`itemParCode`) ; chaque principe a une `source` ; une `question` fait ≤ 14 mots et une seule phrase ; `principesPour([...], 'relire')` exclut les brouillons ; aucun principe ne contient `visuel`, `auditif`, `kinesth`, `OpenDyslexic`.
- [ ] **Step 2:** FAIL.
- [ ] **Step 3:** Implémenter `principes.ts`.
- [ ] **Step 4:** Rédiger dans `principes-protocole.md` la procédure : Claude propose des brouillons pour les items « Construire un message significatif », « Vérifier et ajuster sa production », « Dégager et assurer la cohérence », « Assurer la présentation », « Apprendre le code » (P1 à P3) ; chaque source est vérifiée avec `mcp__RISS__search_articles` ; JF passe chaque principe à `valide`. Écrire les brouillons dans `principes.json` (`statut: 'brouillon'`).
- [ ] **Step 5:** `npx vitest run src/lib/principes.test.ts` : PASS ; commit `feat: principes en brouillon avec sources`.

### Task 4: Catalogue d'aides et résolution

**Files:**
- Create: `src/lib/aides.ts`
- Test: `src/lib/aides.test.ts`

**Interfaces:** Consumes : `Source`. Produces :
```ts
export type AideId = 'audio-consigne'|'audio-relecture'|'dictee-vocale'|'clavier'|'prediction'|'pictogrammes'|'colorisation'|'organisateur'|'seances-courtes'|'banque-mots';
export interface Aide { id: AideId; libelle: string; gene: string; source: Source }
export const AIDES: Aide[];                       // une entrée par ligne du §5 de la spec
export interface AideActive { id: AideId; active: boolean; raison?: string }
export function resoudreAides(choisies: AideId[], retirees: {id: AideId; raison: string}[]): AideActive[];
```
`gene` = formulation d'élève (ex. « Je ne trouve pas d'idées »), reprise de la table du §5 de la spec.

- [ ] **Step 1:** Tests : une aide retirée → `active:false` avec sa `raison` ; une aide choisie non retirée → `active:true` ; chaque `Aide` a une `source` ; `colorisation.source` est `{kind:'riss', ids:['dumas-03282114']}` ; aucun `libelle` ne contient `dyslex`, `visuel`, `auditif`.
- [ ] **Step 2:** FAIL ; **Step 3:** implémenter ; **Step 4:** PASS.
- [ ] **Step 5:** Commit `feat: catalogue d'aides`.

### Task 5: Retour déterministe

**Files:**
- Create: `src/lib/retour.ts`
- Test: `src/lib/retour.test.ts`

**Interfaces:** Produces :
```ts
export type CategorieErreur = 'majuscule_debut_phrase' | 'point_fin_phrase' | 'mot_repete';
export interface Signal { categorie: CategorieErreur; debut: number; fin: number; indice: string } // jamais de champ de correction
export function detecterSignaux(texte: string, categories: CategorieErreur[]): Signal[];
export interface Contraintes { minMots?: number; maxMots?: number }
export interface Verification { contrainte: keyof Contraintes; atteinte: boolean; question: string }
export function verifierContraintes(texte: string, c: Contraintes): Verification[];
export function compterMots(texte: string): number; // « l’école » = 1 mot, apostrophes ' et ’
```
Le correcteur orthographique local n'est pas dans la v1 (décision ouverte, spec §7) ; `detecterSignaux` est le point d'extension.

- [ ] **Step 1:** Tests exacts : `compterMots("l’école est belle")===3` ; `detecterSignaux("il pleut. elle rit.", ['majuscule_debut_phrase'])` renvoie 2 signaux aux positions 0 et 10 ; `detecterSignaux("Il pleut", ['point_fin_phrase'])` renvoie 1 signal ; `detecterSignaux("le le chat", ['mot_repete'])` renvoie 1 signal ; texte `""` et texte d'un mot ne lèvent pas d'exception ; texte de 5 000 caractères avec `’` traité en < 200 ms ; aucun `Signal` n'a de propriété autre que `categorie, debut, fin, indice`.
- [ ] **Step 2:** FAIL ; **Step 3:** implémenter (regex, pas de dictionnaire) ; **Step 4:** PASS ; **Step 5:** commit `feat: retour deterministe`.

### Task 6: Boucle des quatre temps

**Files:**
- Create: `src/lib/boucle.ts`
- Test: `src/lib/boucle.test.ts`

**Interfaces:** Consumes : `Phase`. Produces :
```ts
export interface EtatBoucle { phase: Phase; critereActif: string|null; versions: number }
export function initial(): EtatBoucle;                       // phase 'reflechir'
export function suivant(e: EtatBoucle): EtatBoucle;          // reflechir→ecrire→relire→corriger ; corriger reste corriger
export type Choix = 'continuer' | 'reecrire' | 'rendre';
export function decider(e: EtatBoucle, choix: Choix): { etat: EtatBoucle; rendu: boolean };
export function retourAutorise(phase: Phase): boolean;       // false pour 'reflechir' et 'ecrire'
export function choisirCritere(criteres: string[], deja: string[]): string|null; // un seul à la fois
```
- [ ] **Step 1:** Tests : ordre des phases ; `retourAutorise('ecrire') === false` ; `decider(corriger, 'reecrire')` → phase `ecrire`, `versions` +1, `rendu:false` ; `decider(..., 'rendre')` → `rendu:true` ; `choisirCritere(['a','b'],['a'])==='b'` et `choisirCritere(['a'],['a'])===null`.
- [ ] **Step 2 à 4:** FAIL, implémenter, PASS. **Step 5:** commit `feat: machine a etats de la boucle`.

### Task 7: Audio (synthèse et dictée vocale)

**Files:**
- Create: `src/lib/audio.ts`
- Test: `src/lib/audio.test.ts`

**Interfaces:** Produces :
```ts
export function synthesePossible(): boolean;
export function lire(texte: string, opts?: { langue?: 'fr-BE'|'fr-FR' }): void;   // préfère fr-BE, repli fr
export function arreter(): void;
export function dicteePossible(): boolean;
export function dicter(onTexte: (t: string) => void, onFin: () => void): () => void; // renvoie stop()
```
- [ ] **Step 1:** Tests avec `window.speechSynthesis` / `SpeechRecognition` simulés : sans ces API, `synthesePossible()` et `dicteePossible()` renvoient `false` et `lire`, `dicter` ne lèvent pas ; avec une voix `fr-BE` disponible elle est choisie, sinon une voix `fr-*`.
- [ ] **Step 2 à 4:** FAIL, implémenter, PASS.
- [ ] **Step 5:** Noter dans `docs/verifications-manuelles.md` : à écouter par JF sur tablette (qualité de voix en français belge, micro exigeant HTTPS) ; statut « non vérifié » tant que non fait. Commit `feat: audio avec detection de support`.

### Task 8: Pictogrammes Arasaac

**Files:**
- Create: `src/lib/pictos.ts`, `src/components/Picto.tsx`
- Test: `src/lib/pictos.test.ts`

**Interfaces:** Produces :
```ts
export function urlPicto(mot: string): Promise<string | null>; // cache mémoire ; null si aucun résultat ou erreur réseau
// Picto.tsx : <Picto mot="maison" /> affiche l'image + attribution « Pictogrammes : ARASAAC (CC BY-NC-SA) »
```
- [ ] **Step 1:** Avant de coder : dans le navigateur, ouvrir la documentation officielle d'ARASAAC et noter dans `docs/verifications-manuelles.md` l'URL exacte de recherche par mot en français, les conditions d'attribution et d'usage ; ne rien coder avant cette note (non vérifié à ce jour).
- [ ] **Step 2:** Test avec `fetch` simulé : succès → URL ; erreur réseau → `null` sans exception ; deux appels pour le même mot → un seul `fetch`.
- [ ] **Step 3 à 5:** FAIL, implémenter, PASS ; commit `feat: pictogrammes ARASAAC avec attribution`.

### Task 9: Module de colorisation (bloqué par la licence)

**Files:**
- Create: `src/vendor/colorisation/` (copie des `phonemes.js`, `automat.js`, `syllables.js`, `rule-filters.js`, `config.js`, `dictionary.js`, `word-lists.js` de `Colorization OnlyOffice\scripts\`), `src/vendor/colorisation/NOTICE.md`, `src/lib/colorisation.ts`, `src/components/TexteColore.tsx`
- Test: `src/lib/colorisation.test.ts`

**Interfaces:** Produces :
```ts
export type ModeColorisation = 'phonemes' | 'syllabes' | 'bpdq' | 'voyelles-consonnes';
export interface Segment { debut: number; fin: number; couleur: string }
export function colorise(texte: string, mode: ModeColorisation): Segment[];
// TexteColore : <TexteColore texte mode /> rend le texte avec <span style="color:…">, texte inchangé
```
Le reste de l'app n'importe que `colorise` et `TexteColore`. Le moteur existant expose `Colorization.Automat.analyzeText(text, config) → {word,start,phonemes}[]` et `Colorization.Syllables.syllabify(word, config) → {start,end,text}[]` sur un objet global `window.Colorization`.

- [ ] **Step 1 (point d'arrêt) :** ne rien copier avant que JF ait confirmé la structure de licence. Constat à lui présenter : les en-têtes des scripts indiquent GPL-3.0, tandis que `Colorization OnlyOffice\LICENSE` est PolyForm Noncommercial 1.0.0 ; LireCouleur non vérifiée. Noter sa décision en tête de `NOTICE.md`.
- [ ] **Step 2:** Tests : pour `"Les petits chapeaux"` et chaque mode, segments triés, sans chevauchement, `0 ≤ debut < fin ≤ texte.length`, aucun segment ne couvre un espace ; `syllabify('chapeau')` concaténé redonne `chapeau` ; `colorise("", mode)` renvoie `[]` ; texte de 5 000 caractères avec `’` colorisé en < 1 s.
- [ ] **Step 3:** FAIL ; **Step 4:** copier le moteur avec ses crédits (Pierre-Alain Etique, GPL-3.0 ; inspiré de LireCouleur ; adaptation JF), l'encapsuler pour qu'il s'initialise sans `window` au chargement du test, écrire `colorisation.ts` ; **Step 5:** PASS.
- [ ] **Step 6:** Ajouter la page « À propos » avec la mention de licence et les crédits ; commit `feat: colorisation derriere une interface unique`.

### Task 10: Schéma Supabase

**Files:**
- Create: `supabase/migrations/20261026_ecrit_init.sql`, `src/lib/codes.ts`
- Test: `src/lib/codes.test.ts`, `scripts/lint-sql.test.ts`

**Interfaces:** Produces :
```ts
export const ALPHABET_CODE: string;             // 'ABCDEFGHJKMNPQRSTUVWXYZ23456789' (sans 0 O 1 I L)
export function genererCode(longueur?: number): string; // défaut 6
```
Tables : `ecrit_classes(id, user_id, nom, code_classe unique)`, `ecrit_eleves(id, classe_id, code_eleve, aides jsonb, unique(classe_id, code_eleve))`, `ecrit_activites(id, classe_id, user_id, consigne, contraintes jsonb, item_ids text[], principe_ids text[], categories text[], aides_retirees jsonb)`, `ecrit_textes(id, activite_id, eleve_id, version int, texte, phase, created_at)`, `ecrit_traces(id, eleve_id, activite_id, phase, evenement, created_at)`, `ecrit_validations(id, eleve_id, item_id, user_id, created_at)`. Politiques : `auth.uid() = user_id` (ou via `classe_id` par fonction `security definer`, jamais d'`EXISTS` auto-joint sur la même table).

- [ ] **Step 1:** Tests : `genererCode()` n'utilise que `ALPHABET_CODE`, longueur 6 ; test de lint sur le SQL : chaque `create table` est préfixé `ecrit_`, a `enable row level security`, et un `grant` pour `authenticated` et `service_role` ; aucune table n'a de colonne `nom_eleve`.
- [ ] **Step 2 à 4:** FAIL, écrire `codes.ts` et la migration, PASS.
- [ ] **Step 5:** Lancer le grep de conflit de tables (voir contraintes) et coller la sortie vide dans le message de commit. Ne pas appliquer la migration. Commit `feat: schema ecrit_ (non applique)`.

### Task 11: API élève (sans compte)

**Files:**
- Create: `api/_lib/session.ts`, `api/_lib/limite.ts`, `api/eleve/ouvrir.ts`, `api/eleve/sauver.ts`
- Test: `api/eleve/eleve.test.ts`

**Interfaces:** Consumes : `AideActive` (tâche 4). Produces :
```ts
export interface ActiviteEleve { id: string; consigne: string; contraintes: Contraintes; itemIds: string[]; principeIds: string[]; categories: CategorieErreur[]; aides: AideActive[] } // Contraintes et CategorieErreur : tâche 5
// session.ts
export function signerJeton(p: { eleveId: string; classeId: string }, secret: string, ttlSec?: number): string;
export function verifierJeton(jeton: string, secret: string): { eleveId: string; classeId: string } | null;
// POST /api/eleve/ouvrir  { codeClasse, codeEleve } -> 200 { jeton, activites: ActiviteEleve[] } | 404 { erreur: 'Code inconnu' }
// POST /api/eleve/sauver  { jeton, activiteId, texte, phase, evenements: string[] } -> 200 { version: number, aides: AideActive[] } | 401
```
`sauver` renvoie les aides courantes (retraits de l'enseignant inclus). Clé de service et `ECRIT_SESSION_SECRET` côté serveur uniquement.

- [ ] **Step 1:** Tests avec Supabase simulé : mauvais code de classe et mauvais code d'élève donnent la même réponse 404 ; jeton falsifié ou expiré → `verifierJeton` renvoie `null` et `sauver` répond 401 ; > 10 appels/min à `ouvrir` depuis la même IP → 429 ; `sauver` incrémente `version` ; un texte de plus de 20 000 caractères est refusé (413).
- [ ] **Step 2 à 4:** FAIL, implémenter, PASS.
- [ ] **Step 5:** Vérifier avec `vercel dev` : `curl -X POST localhost:3000/api/eleve/ouvrir -d '{"codeClasse":"XXXXXX","codeEleve":"YYYYYY"}'` → 404 (sortie à coller dans le commit). Commit `feat: API eleve sans compte`.

### Task 12: Authentification enseignant

**Files:**
- Create: `src/auth/AuthContext.tsx`, `src/pages/Connexion.tsx`, `src/lib/supabase.ts`
- Test: `src/auth/AuthContext.test.tsx`

**Interfaces:** Produces : `useAuth(): { user: User | null; chargement: boolean; seConnecter(email, mdp): Promise<void>; creerCompte(email, mdp): Promise<void>; seDeconnecter(): Promise<void> }` ; route protégée `<RequiertEnseignant>`.

- [ ] **Step 1:** Tests : sans session, `<RequiertEnseignant>` redirige vers `/connexion` ; avec session, il rend ses enfants ; `creerCompte` passe `emailRedirectTo: window.location.origin + '/connexion'` ; le formulaire de connexion a label, placeholder et aide sous chaque champ.
- [ ] **Step 2 à 4:** FAIL, implémenter, PASS.
- [ ] **Step 5:** Commit `feat: authentification enseignant`. Le parcours complet inscription → e-mail → connexion est testé dans le navigateur à la tâche 16.

### Task 13: Création d'activité

**Files:**
- Create: `src/pages/NouvelleActivite.tsx`, `src/lib/suggestion.ts`
- Test: `src/lib/suggestion.test.ts`, `src/pages/NouvelleActivite.test.tsx`

**Interfaces:** Consumes : `ItemCecp`, `principesPour`, `AIDES`. Produces :
```ts
export function suggererItems(consigne: string, items: ItemCecp[], max?: number): ItemCecp[]; // recouvrement de mots-clés avec contenu et attendus, sans IA
```
- [ ] **Step 1:** Tests : avec des items de test (`contenu` « Écrire un court texte descriptif » et « Écrire des mots outils »), `suggererItems("Écrire un court texte descriptif sur mon animal", items)` met le premier en tête ; consigne vide → `[]` ; le formulaire contient consigne, longueur min/max, choix d'items, principes, catégories d'erreurs, aides à retirer (avec raison obligatoire), chacun avec label, placeholder FWB concret et aide ; retirer une aide sans raison désactive l'enregistrement.
- [ ] **Step 2 à 4:** FAIL, implémenter, PASS. **Step 5:** commit `feat: creation d'activite`.

### Task 14: Écran élève

**Files:**
- Create: `src/pages/Eleve.tsx`, `src/components/Phase*.tsx`, `src/components/AidesPanel.tsx`, `src/lib/brouillonLocal.ts`
- Test: `src/pages/Eleve.test.tsx`, `src/lib/brouillonLocal.test.ts`

**Interfaces:** Consumes : `boucle`, `retour`, `audio`, `colorisation`, `Picto`, `resoudreAides`, API élève. Produces :
```ts
export function sauverLocal(cle: string, texte: string): void;   // try/catch : ne lève jamais
export function lireLocal(cle: string): string | null;
```
Comportements : en P1 à P3, consignes et questions lues à voix haute par défaut ; « Ce qui me gêne » (colonne `gene` des aides) active les aides ; enregistrement serveur à chaque pause de frappe de 2 s, copie locale à chaque frappe.

- [ ] **Step 1:** Tests : `sauverLocal` ne lève pas quand `localStorage` lève ; au remontage de l'écran avec un texte local plus récent que le serveur, le texte local est restauré (Review Focus 1) ; en phase `ecrire`, aucun `Signal` n'est affiché ; en `corriger`, les signaux affichent `indice` sans forme corrigée ; la réponse de `sauver` qui retire une aide la masque avec sa `raison` sans toucher au texte (Review Focus 5) ; sans API vocale, le bouton « écouter » est absent et une phrase l'explique (Review Focus 3) ; texte vide en `relire` affiche une invitation à écrire, pas d'erreur (Review Focus 2).
- [ ] **Step 2 à 4:** FAIL, implémenter, PASS. **Step 5:** commit `feat: ecran eleve`.

### Task 15: Tableau de bord enseignant

**Files:**
- Create: `src/pages/Tableau.tsx`, `src/lib/statut.ts`
- Test: `src/lib/statut.test.ts`, `src/pages/Tableau.test.tsx`

**Interfaces:** Produces :
```ts
export type StatutItem = 'non-vu' | 'travaille' | 'valide';
export function statutParItem(items: ItemCecp[], activites: { id: string; itemIds: string[] }[], validations: { eleveId: string; itemId: string }[], eleveIds: string[]): Record<string, { statut: StatutItem; nbValides: number }>;
```
Règle : jamais `valide` sans enregistrement dans `ecrit_validations` par l'enseignant.

- [ ] **Step 1:** Tests : item absent de toute activité → `non-vu` ; présent dans une activité sans validation → `travaille` ; présent avec validation → `valide` avec `nbValides` correct ; la page affiche par élève la dernière phase atteinte et les aides utilisées, des codes anonymes seulement, et un bouton « Valider cet item pour cet élève ».
- [ ] **Step 2 à 4:** FAIL, implémenter, PASS. **Step 5:** commit `feat: tableau de bord`.

### Task 16: Déploiement, parcours réel, protocole d'essais

**Files:**
- Create: `vercel.json`, `docs/protocole-essais.md`, `docs/verifications-manuelles.md` (mis à jour)

- [ ] **Step 1:** `npx vitest run && npx vite build` : tout vert, sortie collée dans le compte rendu.
- [ ] **Step 2:** Avec l'accord de JF : appliquer la migration (d'abord en transaction annulée), créer le projet Vercel lié au dépôt `jfb4plai/EcritActif` (branche `main`), poser `ECRIT_SESSION_SECRET` et les clés Supabase avec `printf` (pas `echo`), relancer `vercel env pull` pour vérifier.
- [ ] **Step 3:** Parcours réel dans le navigateur, à l'URL publique : enseignant s'inscrit, crée une classe, une activité ; élève ouvre avec les codes, parcourt les quatre temps, ferme l'onglet puis rouvre ; enseignant voit la trace et valide un item. Noter pour chaque étape constaté ou non vérifié.
- [ ] **Step 4:** `protocole-essais.md` : critères de réussite proposés (parcours de 4 temps terminé seul, lisibilité du tableau de bord) que JF fixe avant les premiers essais et ne modifie plus ensuite ; liste des aides jamais testées avec un élève qui en a besoin.
- [ ] **Step 5:** Mettre à jour la vignette du portail (`projets\portail-plai\src\data\apps.ts`, dépôt séparé) seulement avec l'accord de JF ; toute référence ajoutée est vérifiée dans le RISS. Commit `docs: deploiement et protocole d'essais`.
