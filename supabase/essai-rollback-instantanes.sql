-- ESSAI de la migration 20261028_ecrit_instantanes_colorisation.sql : RIEN N'EST ÉCRIT.
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
    'AVANT, table ecrit_instantanes : ' ||
      case when to_regclass('public.ecrit_instantanes') is null then 'absente' else 'présente' end ||
      E'\nAVANT, colonnes de ecrit_eleves : ' ||
      coalesce((select string_agg(column_name, ', ' order by ordinal_position) from information_schema.columns where table_schema = 'public' and table_name = 'ecrit_eleves'), '?'),
    true
  );
end
$$;

-- B. LA MIGRATION (copie exacte du fichier supabase/migrations/20261028_ecrit_instantanes_colorisation.sql)
-- EcritActif : instantanés du texte de l'élève (premier jet, relecture, rendu) et réglages de colorisation par élève.
-- À appliquer seulement avec l'accord de JF, d'abord dans une transaction annulée (voir supabase/essai-rollback-instantanes.sql).

-- 1. Instantanés du texte. ecrit_textes ne garde que la dernière valeur de chaque version (le premier jet y est écrasé) :
-- cette table garde le texte tel qu'il était à trois moments clés. Pas de capture d'écran : le texte suffit pour lire,
-- comparer le premier jet à la version finale et relever les traces.
create table if not exists public.ecrit_instantanes (
  id uuid primary key default gen_random_uuid(),
  activite_id uuid not null references public.ecrit_activites(id) on delete cascade,
  eleve_id uuid not null references public.ecrit_eleves(id) on delete cascade,
  version int not null,
  moment text not null check (moment in ('premier-jet', 'relecture', 'rendu')),
  texte text not null,
  created_at timestamptz not null default now(),
  unique (activite_id, eleve_id, version, moment)
);

-- Les élèves n'ont pas de compte : seul le serveur (service_role) écrit. L'enseignant lit les instantanés de ses activités.
alter table public.ecrit_instantanes enable row level security;

drop policy if exists ecrit_instantanes_lecture on public.ecrit_instantanes;
create policy ecrit_instantanes_lecture on public.ecrit_instantanes
  for select to authenticated using (public.ecrit_est_mon_activite(activite_id));

-- Supabase accorde par défaut tous les droits aux rôles anon et authenticated sur une nouvelle table : on les retire d'abord.
revoke all on public.ecrit_instantanes from anon, authenticated;
grant select on public.ecrit_instantanes to authenticated;
grant select, insert, update, delete on public.ecrit_instantanes to service_role;

-- 2. Réglages de colorisation par élève, choisis par l'enseignant.
-- Format : {"defaut": "syllabes", "permis": ["sons", "syllabes"]}. Vide : l'élève garde le comportement actuel.
alter table public.ecrit_eleves add column if not exists colorisation jsonb;

-- C. Contrôles APRÈS la migration, avec des lignes d'essai (jamais enregistrées), puis rapport sous forme d'erreur volontaire.
do $$
declare
  rapport text := '';
  u uuid;
  autre uuid := gen_random_uuid();
  c uuid;
  a uuid;
  e uuid;
  n integer;
  rls boolean;
begin
  rapport := current_setting('essai.avant') || E'\n';

  rapport := rapport || E'\nAPRÈS, colonnes de ecrit_eleves : ' ||
    coalesce((select string_agg(column_name, ', ' order by ordinal_position) from information_schema.columns where table_schema = 'public' and table_name = 'ecrit_eleves'), '?');

  select relrowsecurity into rls from pg_class where oid = 'public.ecrit_instantanes'::regclass;
  rapport := rapport || E'\n' || case when rls then 'OK : la sécurité par ligne (RLS) est active sur ecrit_instantanes' else 'ÉCHEC : RLS inactive sur ecrit_instantanes' end;

  select count(*) into n from information_schema.columns
    where table_schema = 'public' and table_name = 'ecrit_eleves' and column_name = 'colorisation';
  rapport := rapport || E'\n' || case when n = 1 then 'OK : la colonne colorisation existe sur ecrit_eleves' else 'ÉCHEC : colonne colorisation absente' end;

  rapport := rapport || E'\n' || case
    when has_table_privilege('authenticated', 'public.ecrit_instantanes', 'select')
     and not has_table_privilege('authenticated', 'public.ecrit_instantanes', 'insert')
     and not has_table_privilege('authenticated', 'public.ecrit_instantanes', 'update')
     and not has_table_privilege('authenticated', 'public.ecrit_instantanes', 'delete')
     and not has_table_privilege('anon', 'public.ecrit_instantanes', 'select')
     and has_table_privilege('service_role', 'public.ecrit_instantanes', 'insert')
    then 'OK : authenticated lit seulement, service_role écrit'
    else 'ÉCHEC : droits (authenticated doit lire seulement, service_role écrire)' end;

  select id into u from auth.users limit 1;
  if u is null then
    rapport := rapport || E'\nSAUTÉ : aucun utilisateur dans auth.users, l''essai d''insertion n''a pas pu se faire';
  else
    insert into public.ecrit_classes (user_id, nom, code_classe) values (u, 'ESSAI', 'ESSAIZ') returning id into c;
    insert into public.ecrit_eleves (classe_id, code_eleve) values (c, 'ESSAI1') returning id into e;
    insert into public.ecrit_activites (classe_id, user_id, annee, consigne) values (c, u, 'P4', 'essai') returning id into a;

    insert into public.ecrit_instantanes (activite_id, eleve_id, version, moment, texte) values (a, e, 1, 'premier-jet', 'Les élèves prépare.');
    insert into public.ecrit_instantanes (activite_id, eleve_id, version, moment, texte) values (a, e, 1, 'rendu', 'Les élèves préparent.');
    rapport := rapport || E'\nOK : deux instantanés (premier-jet et rendu) de la même version sont acceptés';

    begin
      insert into public.ecrit_instantanes (activite_id, eleve_id, version, moment, texte) values (a, e, 1, 'premier-jet', 'doublon');
      rapport := rapport || E'\nÉCHEC : un doublon (même version, même moment) a été accepté';
    exception when unique_violation then
      rapport := rapport || E'\nOK : un doublon (même version, même moment) est refusé';
    end;

    begin
      insert into public.ecrit_instantanes (activite_id, eleve_id, version, moment, texte) values (a, e, 2, 'inconnu', 'x');
      rapport := rapport || E'\nÉCHEC : un moment inconnu a été accepté';
    exception when check_violation then
      rapport := rapport || E'\nOK : un moment inconnu est refusé';
    end;

    update public.ecrit_eleves set colorisation = '{"defaut":"syllabes","permis":["sons","syllabes"]}'::jsonb where id = e;
    rapport := rapport || E'\nOK : colorisation accepte du jsonb';

    -- Lecture par l'enseignant propriétaire, puis par un autre enseignant (politique RLS), en rôle authenticated.
    begin
      perform set_config('request.jwt.claims', json_build_object('sub', u, 'role', 'authenticated')::text, true);
      perform set_config('request.jwt.claim.sub', u::text, true);
      execute 'set local role authenticated';
      select count(*) into n from public.ecrit_instantanes where activite_id = a;
      rapport := rapport || E'\n' || case when n = 2 then 'OK : l''enseignant propriétaire lit ses 2 instantanés' else 'ÉCHEC : le propriétaire lit ' || n || ' instantané(s) au lieu de 2' end;

      perform set_config('request.jwt.claims', json_build_object('sub', autre, 'role', 'authenticated')::text, true);
      perform set_config('request.jwt.claim.sub', autre::text, true);
      select count(*) into n from public.ecrit_instantanes where activite_id = a;
      rapport := rapport || E'\n' || case when n = 0 then 'OK : un autre enseignant ne lit aucun instantané' else 'ÉCHEC : un autre enseignant lit ' || n || ' instantané(s)' end;
      execute 'reset role';
    exception when others then
      execute 'reset role';
      rapport := rapport || E'\nÉCHEC du contrôle de lecture : ' || sqlerrm;
    end;
  end if;

  -- Erreur volontaire : elle annule la transaction et affiche le rapport dans la zone Results.
  raise exception E'RAPPORT DE L''ESSAI (erreur volontaire, RIEN N''EST ÉCRIT)\n%', rapport;
end
$$;

rollback;
-- Pour appliquer réellement : exécuter le contenu de supabase/migrations/20261028_ecrit_instantanes_colorisation.sql seul.
