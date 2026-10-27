-- EcritActif : P4 à P6, atelier de raisonnement grammatical, chasse aux erreurs.
-- À appliquer seulement avec l'accord de JF, d'abord dans une transaction annulée (voir supabase/essai-rollback-annees.sql).

-- 1. Une activité peut porter sur P4, P5 ou P6 (en plus de P1 à P3).
-- La contrainte d'origine est celle que Postgres a nommée automatiquement pour la colonne annee de ecrit_activites.
alter table public.ecrit_activites drop constraint if exists ecrit_activites_annee_check;
alter table public.ecrit_activites add constraint ecrit_activites_annee_check
  check (annee in ('P1', 'P2', 'P3', 'P4', 'P5', 'P6'));

-- 2. Atelier de raisonnement grammatical : activé par l'enseignant, activité par activité (P4 à P6).
alter table public.ecrit_activites add column if not exists atelier boolean not null default false;
