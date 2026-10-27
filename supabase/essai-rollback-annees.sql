begin;
-- EcritActif : une activité peut porter sur P4, P5 ou P6 (en plus de P1 à P3).
-- La contrainte d'origine est celle que Postgres a nommée automatiquement pour la colonne annee de ecrit_activites.
-- À appliquer seulement avec l'accord de JF, d'abord dans une transaction annulée (voir supabase/essai-rollback-annees.sql).
alter table public.ecrit_activites drop constraint if exists ecrit_activites_annee_check;
alter table public.ecrit_activites add constraint ecrit_activites_annee_check
  check (annee in ('P1', 'P2', 'P3', 'P4', 'P5', 'P6'));

-- Vérification dans la transaction : P6 accepté, P7 refusé
select conname, pg_get_constraintdef(oid) from pg_constraint where conrelid = 'public.ecrit_activites'::regclass and contype = 'c';  -- doit montrer UNE seule contrainte sur annee, P1 à P6
rollback;
