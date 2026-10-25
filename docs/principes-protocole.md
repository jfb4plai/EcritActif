# Protocole des principes (questions fixes)

Un principe = une question courte posée à l'élève dans l'un des quatre temps, rattachée à un ou plusieurs codes CECP.

1. **Brouillon** : Claude propose le principe dans `src/data/principes.json` avec `statut: "brouillon"`. Les codes proviennent des items « écrire » P1 à P3 (`src/data/cecp-ecrire.json`) ; le test `principes.test.ts` refuse un code inexistant.
2. **Source** : chaque principe porte une source. `riss` seulement si l'identifiant a été lu avec `mcp__RISS__search_articles` ou `get_article` ; sinon `hors-riss` (réel, hors corpus) ou `non-etaye`.
3. **Validation** : JF lit chaque principe et passe `statut` à `"valide"`. L'app n'affiche que les principes validés (sauf mode brouillon, réservé à l'enseignant qui prépare).
4. **Formulation** : une phrase, 14 mots au plus, une seule action, adaptée à P1-P3 (à tester avec des enfants de ces classes).

## État au 2026-10-25

10 principes en brouillon. Le programme CECP lui-même nomme les quatre temps en P3 : « planification ; mise en texte ; révision ; correction » (codes F282 à F284). Les sources RISS déclarées reposent sur hal-04120344 (autorégulation de la rédaction, relecture avec objectifs) ; les trois principes de « corriger » sont `non-etaye` : ils découlent d'un item du programme (majuscule, point), pas d'une étude RISS lue.
