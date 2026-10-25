# Vérifications manuelles (statuts)

Statuts : **constaté** (vu, avec date), **non vérifié**.

| Point | Statut | Détail |
|---|---|---|
| ARASAAC : recherche par mot | constaté 2026-10-25 | `GET https://api.arasaac.org/v1/pictograms/fr/search/maison` renvoie un tableau JSON avec `_id` (6964 en tête). |
| ARASAAC : image | constaté 2026-10-25 | `https://static.arasaac.org/pictograms/6964/6964_300.png` s'ouvre (298×298). |
| ARASAAC : conditions | constaté 2026-10-25 | arasaac.org/terms-of-use : CC BY-NC-SA, usage non lucratif, attribution exacte (auteur Sergio Palao, origine ARASAAC, propriétaire Gouvernement d'Aragon), travaux dérivés sous la même licence. Texte repris dans `ATTRIBUTION_ARASAAC`. |
| Voix de synthèse en français belge | non vérifié | À écouter par JF sur tablette (fr-BE disponible ou repli fr-*). |
| Dictée vocale | non vérifié | Le micro exige HTTPS ; à tester sur l'URL publique. |
| Colorisation sur l'écriture | non étayé | Le RISS (dumas-03282114) porte sur la lecture. |
