# Moteur de colorisation : licence et crédits

Décision de JF (2026-10-25) : « utilise en mentionnant la licence ». Les fichiers de ce dossier sont copiés de `Colorization OnlyOffice\scripts\` (`phonemes`, `word-lists`, `rule-filters`, `automat`, `dictionary`, `syllables`, `config`) sans modification de leur contenu.

## Origine

- Port JavaScript de Jean-François Beguin (adaptation pour OnlyOffice, puis pour cette app).
- Il porte le projet **Colorization** de **Pierre-Alain Etique** (C#, GPL-3.0) : https://github.com/paColor/Colorization. Le dépôt contient `License_gpl-3.0.txt` à sa racine (constaté le 2026-10-25).
- Colorization est « profondément inspiré par LireCouleur » (README du dépôt) : https://lirecouleur.arkaline.fr/. La licence de LireCouleur n'a pas été vérifiée.

## Points non résolus (à garder visibles)

- Les en-têtes de ces fichiers indiquent GPL-3.0, tandis que `Colorization OnlyOffice\LICENSE` est PolyForm Noncommercial 1.0.0. Les deux se contredisent ; la structure de licence du code autour de ce module reste à décider.
- Le texte complet de la GPL-3.0 n'est pas joint ici (https://www.gnu.org/licenses/gpl-3.0.html). Il devra l'être si l'app est distribuée avec ce module.
- Mentionner la licence ne remplace pas d'en respecter les conditions. Ce n'est pas un avis juridique.
