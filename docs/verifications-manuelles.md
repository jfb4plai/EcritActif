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
| Critères de qualité de la rétroaction | constaté (tests) | `src/lib/qualite.ts` : contrôle par expressions régulières ; il détecte les formes (compliment, validation, note, constat sans action, imprécision), pas le sens. Un retour mal formulé mais qui passe les critères reste possible. |
| Rétroaction : essai avec des élèves | non vérifié | Aucun enfant n'a lu ces messages ; la lisibilité des explications « Je ne comprends pas » en P1 à P3 est à tester. |
| Lecture à voix haute des retours | non vérifié | Les explications se lisent à l'écran ; leur lecture par la synthèse vocale n'est pas encore branchée. |
