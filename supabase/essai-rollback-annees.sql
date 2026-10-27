begin;
-- EcritActif : P4 à P6, atelier de raisonnement grammatical, chasse aux erreurs.
-- À appliquer seulement avec l'accord de JF, d'abord dans une transaction annulée (voir supabase/essai-rollback-annees.sql).

-- 1. Une activité peut porter sur P4, P5 ou P6 (en plus de P1 à P3).
-- La contrainte d'origine est celle que Postgres a nommée automatiquement pour la colonne annee de ecrit_activites.
alter table public.ecrit_activites drop constraint if exists ecrit_activites_annee_check;
alter table public.ecrit_activites add constraint ecrit_activites_annee_check
  check (annee in ('P1', 'P2', 'P3', 'P4', 'P5', 'P6'));

-- 2. Atelier de raisonnement grammatical : activé par l'enseignant, activité par activité (P4 à P6).
alter table public.ecrit_activites add column if not exists atelier boolean not null default false;

-- 3. Chasse aux erreurs : texte, positions des mots, formes attendues et indices de l'enseignant.
-- Lecture réservée au serveur (service_role) ; l'élève n'en reçoit que le texte et le nombre d'erreurs.
alter table public.ecrit_activites add column if not exists chasse jsonb;

-- 4. Grammaire 3D : option pédagogique de l'atelier (noms et pronoms des fonctions). Le programme reste la référence.
alter table public.ecrit_activites add column if not exists grammaire_3d boolean not null default false;

select conname, pg_get_constraintdef(oid) from pg_constraint where conrelid = 'public.ecrit_activites'::regclass and contype = 'c';  -- UNE seule contrainte sur annee, P1 à P6
select column_name, data_type, column_default from information_schema.columns where table_name = 'ecrit_activites' and column_name in ('atelier', 'chasse', 'grammaire_3d') order by column_name;
rollback;
