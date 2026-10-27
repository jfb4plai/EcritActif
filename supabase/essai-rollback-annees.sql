-- ESSAI de la migration 20261027_ecrit_annees_p4_p6.sql : RIEN N'EST ÉCRIT.
-- À coller en une fois dans le SQL editor du projet Supabase « Flashfwb » (otiorljbujqzruulmqrs), puis cliquer sur Run.
--
-- L'éditeur n'affiche que le résultat de la dernière instruction. Le script se termine donc par une ERREUR VOLONTAIRE
-- dont le message est le rapport complet de l'essai. Cette erreur annule toute la transaction : rien n'est enregistré.
-- Lire le rapport dans la zone Results : chaque ligne doit commencer par OK.

begin;

-- A. Photographie AVANT la migration (gardée dans une variable de la transaction).
do $$
begin
  perform set_config(
    'essai.avant',
    'AVANT, contraintes : ' ||
      coalesce((select string_agg(conrelid::regclass::text || ' ' || conname || ' ' || pg_get_constraintdef(oid), E'\n    ')
                from pg_constraint
                where conrelid in ('public.ecrit_activites'::regclass, 'public.ecrit_classes'::regclass) and contype = 'c'), 'aucune') ||
      E'\nAVANT, colonnes de ecrit_activites : ' ||
      coalesce((select string_agg(column_name, ', ' order by ordinal_position) from information_schema.columns where table_schema = 'public' and table_name = 'ecrit_activites'), '?') ||
      E'\nAVANT, colonnes de ecrit_classes : ' ||
      coalesce((select string_agg(column_name, ', ' order by ordinal_position) from information_schema.columns where table_schema = 'public' and table_name = 'ecrit_classes'), '?'),
    true
  );
end
$$;

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

-- 6. Année scolaire de la classe : valeur de départ des nouvelles activités. Obligatoire pour les classes créées par
-- l'application (contrôle dans l'application) ; vide pour les classes créées avant ce champ, qui demandent de la choisir.
alter table public.ecrit_classes add column if not exists niveau text;
alter table public.ecrit_classes drop constraint if exists ecrit_classes_niveau_check;
alter table public.ecrit_classes add constraint ecrit_classes_niveau_check
  check (niveau is null or niveau in ('P1', 'P2', 'P3', 'P4', 'P5', 'P6'));

-- C. Contrôles APRÈS la migration, avec des lignes d'essai (jamais enregistrées), puis rapport sous forme d'erreur volontaire.
do $$
declare
  rapport text := '';
  u uuid;
  c uuid;
  a uuid;
  v_atelier boolean;
  v_g3d boolean;
  n integer;
begin
  rapport := current_setting('essai.avant') || E'\n';

  rapport := rapport || E'\nAPRÈS, contraintes : ' ||
    coalesce((select string_agg(conrelid::regclass::text || ' ' || conname || ' ' || pg_get_constraintdef(oid), E'\n    ')
              from pg_constraint
              where conrelid in ('public.ecrit_activites'::regclass, 'public.ecrit_classes'::regclass) and contype = 'c'), 'aucune');

  select count(*) into n from information_schema.columns
    where table_schema = 'public' and table_name = 'ecrit_activites' and column_name in ('atelier', 'atelier_perso', 'chasse', 'grammaire_3d');
  rapport := rapport || E'\n' || case when n = 4 then 'OK : les 4 colonnes atelier, atelier_perso, chasse et grammaire_3d existent sur ecrit_activites' else 'ÉCHEC : colonnes de ecrit_activites manquantes (' || n || ' sur 4)' end;

  select count(*) into n from information_schema.columns
    where table_schema = 'public' and table_name = 'ecrit_classes' and column_name = 'niveau';
  rapport := rapport || E'\n' || case when n = 1 then 'OK : la colonne niveau existe sur ecrit_classes' else 'ÉCHEC : colonne niveau absente de ecrit_classes' end;

  select id into u from auth.users limit 1;
  if u is null then
    rapport := rapport || E'\nSAUTÉ : aucun utilisateur dans auth.users, l''essai d''insertion n''a pas pu se faire';
  else
    insert into public.ecrit_classes (user_id, nom, code_classe) values (u, 'ESSAI', 'ESSAIZ') returning id into c;
    rapport := rapport || E'\nOK : une classe sans année scolaire reste possible (classes créées avant le champ niveau)';

    update public.ecrit_classes set niveau = 'P4' where id = c;
    rapport := rapport || E'\nOK : le niveau P4 est accepté pour une classe';

    begin
      update public.ecrit_classes set niveau = 'P7' where id = c;
      rapport := rapport || E'\nÉCHEC : le niveau P7 a été accepté pour une classe';
    exception when check_violation then
      rapport := rapport || E'\nOK : le niveau P7 est refusé pour une classe';
    end;

    insert into public.ecrit_activites (classe_id, user_id, annee, consigne) values (c, u, 'P6', 'essai') returning id into a;
    rapport := rapport || E'\nOK : une activité de P6 est acceptée';

    select atelier, grammaire_3d into v_atelier, v_g3d from public.ecrit_activites where id = a;
    rapport := rapport || E'\n' || case when v_atelier = false and v_g3d = false then 'OK : atelier et grammaire_3d valent false par défaut' else 'ÉCHEC : valeurs par défaut de atelier et grammaire_3d' end;

    begin
      insert into public.ecrit_activites (classe_id, user_id, annee, consigne) values (c, u, 'P7', 'essai');
      rapport := rapport || E'\nÉCHEC : une activité de P7 a été acceptée';
    exception when check_violation then
      rapport := rapport || E'\nOK : une activité de P7 est refusée';
    end;

    update public.ecrit_activites
      set chasse = '{"texte":"Ils mange.","erreurs":[]}'::jsonb, atelier_perso = '{"verbe-sujet":{"verbe":["Cliquer."]}}'::jsonb
      where id = a;
    rapport := rapport || E'\nOK : chasse et atelier_perso acceptent du jsonb';
  end if;

  -- Erreur volontaire : elle annule la transaction et affiche le rapport dans la zone Results.
  raise exception E'RAPPORT DE L''ESSAI (erreur volontaire, RIEN N''EST ÉCRIT)\n%', rapport;
end
$$;

rollback;
-- Pour appliquer réellement : exécuter le contenu de supabase/migrations/20261027_ecrit_annees_p4_p6.sql seul.
