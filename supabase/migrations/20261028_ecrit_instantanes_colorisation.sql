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

grant select on public.ecrit_instantanes to authenticated;
grant select, insert, update, delete on public.ecrit_instantanes to service_role;

-- 2. Réglages de colorisation par élève, choisis par l'enseignant.
-- Format : {"defaut": "syllabes", "permis": ["sons", "syllabes"]}. Vide : l'élève garde le comportement actuel.
alter table public.ecrit_eleves add column if not exists colorisation jsonb;
