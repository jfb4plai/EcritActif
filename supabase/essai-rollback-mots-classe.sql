-- ESSAI de la migration 20261029_ecrit_classes_mots_acceptes.sql : RIEN N'EST ÉCRIT.
-- À coller en une fois dans le SQL editor du projet Supabase « Flashfwb » (otiorljbujqzruulmqrs), puis cliquer sur Run.
-- Le script se termine par une ERREUR VOLONTAIRE dont le message est le rapport : elle annule toute la transaction.
-- Lire le rapport dans la zone Results : chaque ligne doit commencer par OK.

begin;

-- B. LA MIGRATION (copie exacte du fichier supabase/migrations/20261029_ecrit_classes_mots_acceptes.sql)
alter table public.ecrit_classes add column if not exists mots_acceptes text[] not null default '{}';

-- C. Contrôles APRÈS la migration, avec une ligne d'essai (jamais enregistrée).
do $$
declare
  rapport text := '';
  u uuid;
  autre uuid := gen_random_uuid();
  c uuid;
  n integer;
  m text[];
begin
  select count(*) into n from information_schema.columns
    where table_schema = 'public' and table_name = 'ecrit_classes' and column_name = 'mots_acceptes';
  rapport := rapport || case when n = 1 then 'OK : la colonne mots_acceptes existe sur ecrit_classes' else 'ÉCHEC : colonne mots_acceptes absente' end;

  select id into u from auth.users limit 1;
  if u is null then
    rapport := rapport || E'\nSAUTÉ : aucun utilisateur dans auth.users, l''essai d''insertion n''a pas pu se faire';
  else
    insert into public.ecrit_classes (user_id, nom, code_classe, niveau) values (u, 'ESSAI', 'ESSAIZ', 'P4') returning id into c;
    select mots_acceptes into m from public.ecrit_classes where id = c;
    rapport := rapport || E'\n' || case when m = '{}' then 'OK : une classe existante ou nouvelle a une liste vide par défaut' else 'ÉCHEC : valeur par défaut inattendue' end;

    begin
      perform set_config('request.jwt.claims', json_build_object('sub', u, 'role', 'authenticated')::text, true);
      perform set_config('request.jwt.claim.sub', u::text, true);
      execute 'set local role authenticated';
      update public.ecrit_classes set mots_acceptes = array['Cointe', 'Outremeuse'] where id = c;
      get diagnostics n = row_count;
      rapport := rapport || E'\n' || case when n = 1 then 'OK : le propriétaire modifie la liste de sa classe' else 'ÉCHEC : le propriétaire ne peut pas modifier la liste' end;

      perform set_config('request.jwt.claims', json_build_object('sub', autre, 'role', 'authenticated')::text, true);
      perform set_config('request.jwt.claim.sub', autre::text, true);
      update public.ecrit_classes set mots_acceptes = array['intrus'] where id = c;
      get diagnostics n = row_count;
      rapport := rapport || E'\n' || case when n = 0 then 'OK : un autre enseignant ne peut pas modifier la liste' else 'ÉCHEC : un autre enseignant a modifié la liste' end;
      execute 'reset role';
    exception when others then
      execute 'reset role';
      rapport := rapport || E'\nÉCHEC du contrôle de droits : ' || sqlerrm;
    end;
  end if;

  -- Erreur volontaire : elle annule la transaction et affiche le rapport dans la zone Results.
  raise exception E'RAPPORT DE L''ESSAI (rien n''est enregistré) :\n%', rapport;
end
$$;

rollback;
