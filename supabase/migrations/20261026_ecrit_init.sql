-- EcritActif : schéma initial. NON APPLIQUÉ : l'application sur la base partagée exige l'accord explicite de JF
-- (essai d'abord dans une transaction annulée). Toutes les tables sont préfixées ecrit_ ; profiles et le trigger
-- updated_at existent déjà dans le projet partagé et ne sont pas recréés.
-- Les élèves n'ont pas de compte : leurs écrans passent par /api/eleve/* avec la clé service_role côté serveur.

create table public.ecrit_classes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  nom text not null,
  code_classe text not null unique,
  created_at timestamptz not null default now()
);

create table public.ecrit_eleves (
  id uuid primary key default gen_random_uuid(),
  classe_id uuid not null references public.ecrit_classes(id) on delete cascade,
  code_eleve text not null,
  aides jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  unique (classe_id, code_eleve)
);

create table public.ecrit_activites (
  id uuid primary key default gen_random_uuid(),
  classe_id uuid not null references public.ecrit_classes(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  annee text not null check (annee in ('P1', 'P2', 'P3')),
  consigne text not null,
  contraintes jsonb not null default '{}'::jsonb,
  item_ids text[] not null default '{}',
  principe_ids text[] not null default '{}',
  categories text[] not null default '{}',
  aides_retirees jsonb not null default '[]'::jsonb,
  banque_mots text[] not null default '{}',
  principes_perso jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create table public.ecrit_textes (
  id uuid primary key default gen_random_uuid(),
  activite_id uuid not null references public.ecrit_activites(id) on delete cascade,
  eleve_id uuid not null references public.ecrit_eleves(id) on delete cascade,
  version int not null,
  texte text not null,
  phase text not null,
  auto_evaluation jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (activite_id, eleve_id, version)
);

create table public.ecrit_traces (
  id uuid primary key default gen_random_uuid(),
  eleve_id uuid not null references public.ecrit_eleves(id) on delete cascade,
  activite_id uuid not null references public.ecrit_activites(id) on delete cascade,
  phase text not null,
  evenement text not null,
  created_at timestamptz not null default now()
);

create table public.ecrit_validations (
  id uuid primary key default gen_random_uuid(),
  eleve_id uuid not null references public.ecrit_eleves(id) on delete cascade,
  item_id text not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (eleve_id, item_id)
);

-- Fonctions security definer : évitent toute récursion de RLS (pas d'EXISTS auto-joint dans les politiques).
create function public.ecrit_est_ma_classe(p_classe uuid) returns boolean
  language sql stable security definer set search_path = public as
  $$ select exists (select 1 from public.ecrit_classes c where c.id = p_classe and c.user_id = auth.uid()) $$;

create function public.ecrit_est_mon_activite(p_activite uuid) returns boolean
  language sql stable security definer set search_path = public as
  $$ select exists (select 1 from public.ecrit_activites a where a.id = p_activite and a.user_id = auth.uid()) $$;

create function public.ecrit_est_mon_eleve(p_eleve uuid) returns boolean
  language sql stable security definer set search_path = public as
  $$ select exists (
       select 1 from public.ecrit_eleves e join public.ecrit_classes c on c.id = e.classe_id
       where e.id = p_eleve and c.user_id = auth.uid()) $$;

alter table public.ecrit_classes enable row level security;
alter table public.ecrit_eleves enable row level security;
alter table public.ecrit_activites enable row level security;
alter table public.ecrit_textes enable row level security;
alter table public.ecrit_traces enable row level security;
alter table public.ecrit_validations enable row level security;

create policy ecrit_classes_proprietaire on public.ecrit_classes
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy ecrit_eleves_proprietaire on public.ecrit_eleves
  for all to authenticated using (public.ecrit_est_ma_classe(classe_id)) with check (public.ecrit_est_ma_classe(classe_id));

create policy ecrit_activites_proprietaire on public.ecrit_activites
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid() and public.ecrit_est_ma_classe(classe_id));

create policy ecrit_textes_lecture on public.ecrit_textes
  for select to authenticated using (public.ecrit_est_mon_activite(activite_id));

create policy ecrit_traces_lecture on public.ecrit_traces
  for select to authenticated using (public.ecrit_est_mon_activite(activite_id));

create policy ecrit_validations_proprietaire on public.ecrit_validations
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid() and public.ecrit_est_mon_eleve(eleve_id));

grant select, insert, update, delete on public.ecrit_classes to authenticated;
grant select, insert, update, delete on public.ecrit_classes to service_role;
grant select, insert, update, delete on public.ecrit_eleves to authenticated;
grant select, insert, update, delete on public.ecrit_eleves to service_role;
grant select, insert, update, delete on public.ecrit_activites to authenticated;
grant select, insert, update, delete on public.ecrit_activites to service_role;
grant select on public.ecrit_textes to authenticated;
grant select, insert, update, delete on public.ecrit_textes to service_role;
grant select on public.ecrit_traces to authenticated;
grant select, insert, update, delete on public.ecrit_traces to service_role;
grant select, insert, update, delete on public.ecrit_validations to authenticated;
grant select, insert, update, delete on public.ecrit_validations to service_role;
