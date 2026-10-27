-- ESSAI de la migration 20261027_ecrit_annees_p4_p6.sql : TOUT EST ANNULÉ à la fin (rollback).
-- À coller en une fois dans le SQL editor du projet Supabase « Flashfwb » (otiorljbujqzruulmqrs).
-- Résultat attendu : quatre tableaux dans l'onglet Results, dont le dernier dit « OK » sur chaque ligne.

begin;

-- A. AVANT : la contrainte d'année doit s'appeler ecrit_activites_annee_check et se limiter à P1, P2, P3.
select conname, pg_get_constraintdef(oid) as definition
from pg_constraint
where conrelid = 'public.ecrit_activites'::regclass and contype = 'c';

-- A bis. AVANT : colonnes de ecrit_activites (aucune de atelier, chasse, grammaire_3d, atelier_perso ne doit déjà y être).
select string_agg(column_name, ', ' order by ordinal_position) as colonnes_avant
from information_schema.columns
where table_schema = 'public' and table_name = 'ecrit_activites';

-- B. LA MIGRATION (copie exacte du fichier supabase/migrations/20261027_ecrit_annees_p4_p6.sql)
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

-- 5. « Ma formulation » : consignes de l'enseignant pour l'atelier, par démarche et par étape.
-- Format : {"verbe-sujet": {"verbe": ["consigne", ...]}}. Nettoyé côté serveur avant d'arriver à l'élève.
alter table public.ecrit_activites add column if not exists atelier_perso jsonb;

-- C. APRÈS : une seule contrainte sur l'année, qui va de P1 à P6 ; quatre colonnes ajoutées.
select conname, pg_get_constraintdef(oid) as definition
from pg_constraint
where conrelid = 'public.ecrit_activites'::regclass and contype = 'c';

select column_name, data_type, column_default, is_nullable
from information_schema.columns
where table_schema = 'public' and table_name = 'ecrit_activites'
  and column_name in ('atelier', 'atelier_perso', 'chasse', 'grammaire_3d')
order by column_name;

-- D. COMPORTEMENT, avec des lignes d'essai (annulées) : P6 accepté, P7 refusé, valeurs par défaut des colonnes.
create temp table essai_resultat (ligne text) on commit drop;

do $$
declare
  u uuid;
  c uuid;
  a uuid;
  v_atelier boolean;
  v_g3d boolean;
begin
  select id into u from auth.users limit 1;
  if u is null then
    insert into essai_resultat values ('SAUTÉ : aucun utilisateur dans auth.users, l''essai d''insertion n''a pas pu se faire');
    return;
  end if;
  insert into public.ecrit_classes (user_id, nom, code_classe) values (u, 'ESSAI', 'ESSAIZ') returning id into c;

  insert into public.ecrit_activites (classe_id, user_id, annee, consigne) values (c, u, 'P6', 'essai') returning id into a;
  insert into essai_resultat values ('OK : une activité de P6 est acceptée');

  select atelier, grammaire_3d into v_atelier, v_g3d from public.ecrit_activites where id = a;
  insert into essai_resultat values (case when v_atelier = false and v_g3d = false then 'OK : atelier et grammaire_3d valent false par défaut' else 'ÉCHEC : valeurs par défaut' end);

  begin
    insert into public.ecrit_activites (classe_id, user_id, annee, consigne) values (c, u, 'P7', 'essai');
    insert into essai_resultat values ('ÉCHEC : une activité de P7 a été acceptée');
  exception when check_violation then
    insert into essai_resultat values ('OK : une activité de P7 est refusée');
  end;

  update public.ecrit_activites set chasse = '{"texte":"Ils mange.","erreurs":[]}'::jsonb, atelier_perso = '{"verbe-sujet":{"verbe":["Cliquer."]}}'::jsonb where id = a;
  insert into essai_resultat values ('OK : chasse et atelier_perso acceptent du jsonb');
end
$$;

select ligne from essai_resultat;

rollback;
-- Rien n'a été écrit. Pour appliquer réellement : exécuter le contenu de supabase/migrations/20261027_ecrit_annees_p4_p6.sql seul.
