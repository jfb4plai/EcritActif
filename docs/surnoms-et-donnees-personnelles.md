# Surnoms des élèves et données personnelles (décision de JF, 2026-10-27)

**Principe conservé :** l'application ne connaît pas le nom des élèves. Ils n'ont qu'un code.

**Ce qui est construit :** un champ « Surnom (facultatif) » par élève dans la page de la classe. Le surnom est mémorisé **dans le navigateur de l'enseignant seulement** (`localStorage`, clé `ecrit:surnoms:<classe>`, `src/lib/surnoms.ts`). Il n'est jamais envoyé au serveur ni lu par l'API. Il s'affiche à côté du code dans le tableau de classe (« KMNPQR (Léa) »).

**Avertissement affiché à l'enseignant** (`src/components/AvertissementSurnoms.tsx`) :
- le surnom est facultatif et reste dans ce navigateur, sur cet appareil ;
- il disparaît si l'enseignant change de navigateur ou d'appareil, ou vide les données du navigateur ;
- noter aussi sur papier qui a quel code, et garder la feuille en lieu sûr ;
- une liste qui relie un code à un enfant est une donnée personnelle (RGPD) dont l'enseignant reste responsable ; écrire un prénom ou des initiales, pas un nom complet, et rien sur la santé ou les difficultés de l'enfant.

**Ce que ce texte n'est pas :** un avis juridique. Le cadre RGPD de l'application (information des familles, durée de conservation des textes, hébergement sur Supabase et Vercel, rôle de l'école ou du pouvoir organisateur) **n'a pas été examiné** ; un délégué à la protection des données devrait le valider avant un usage à grande échelle. Ces points figurent aussi dans la page jfb4plai.com (« Données »).

**Non construit :** fiche à imprimer des codes ; sauvegarde ou export des surnoms ; stockage des prénoms en base (déconseillé sans cadre RGPD).
