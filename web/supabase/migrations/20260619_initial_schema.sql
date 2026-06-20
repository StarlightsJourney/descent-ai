create extension if not exists "pgcrypto";

create type public.tree_role as enum ('contributor', 'editor', 'admin');
create type public.membership_status as enum ('active', 'invited', 'disabled');
create type public.invite_type as enum ('guest', 'member');
create type public.invite_role as enum ('guest', 'contributor', 'editor');
create type public.relationship_type as enum (
  'biological_parent',
  'adoptive_parent',
  'step_parent',
  'guardian',
  'spouse'
);
create type public.relationship_status as enum (
  'active',
  'divorced',
  'separated',
  'inactive'
);
create type public.suggested_edit_status as enum (
  'pending',
  'approved',
  'rejected'
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'display_name', new.email)
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

create or replace function public.handle_new_family_tree()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.memberships (family_tree_id, user_id, role, status)
  values (new.id, new.created_by_user_id, 'admin', 'active')
  on conflict (family_tree_id, user_id) do nothing;

  return new;
end;
$$;

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  avatar_url text,
  preferred_language text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.family_trees (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  created_by_user_id uuid not null references public.profiles (id),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.memberships (
  id uuid primary key default gen_random_uuid(),
  family_tree_id uuid not null references public.family_trees (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  role public.tree_role not null,
  status public.membership_status not null default 'active',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (family_tree_id, user_id)
);

create table public.invites (
  id uuid primary key default gen_random_uuid(),
  family_tree_id uuid not null references public.family_trees (id) on delete cascade,
  token text not null unique,
  invite_type public.invite_type not null,
  intended_role public.invite_role not null,
  expires_at timestamptz,
  created_by_user_id uuid not null references public.profiles (id),
  created_at timestamptz not null default timezone('utc', now())
);

create table public.people (
  id uuid primary key default gen_random_uuid(),
  family_tree_id uuid not null references public.family_trees (id) on delete cascade,
  primary_name text not null,
  alternative_names_json jsonb,
  gender text,
  birth_date date,
  death_date date,
  is_living boolean not null default true,
  photo_url text,
  bio text,
  generation_index integer,
  birth_place text,
  current_place text,
  created_by_user_id uuid references public.profiles (id),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

alter table public.memberships
add column person_id uuid references public.people (id) on delete set null;

create or replace function public.is_tree_member(target_tree_id uuid)
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select exists (
    select 1
    from public.memberships membership
    where membership.family_tree_id = target_tree_id
      and membership.user_id = auth.uid()
      and membership.status = 'active'
  );
$$;

create or replace function public.has_tree_role(
  target_tree_id uuid,
  allowed_roles public.tree_role[]
)
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select exists (
    select 1
    from public.memberships membership
    where membership.family_tree_id = target_tree_id
      and membership.user_id = auth.uid()
      and membership.status = 'active'
      and membership.role = any (allowed_roles)
  );
$$;

create table public.relationships (
  id uuid primary key default gen_random_uuid(),
  family_tree_id uuid not null references public.family_trees (id) on delete cascade,
  from_person_id uuid not null references public.people (id) on delete cascade,
  to_person_id uuid not null references public.people (id) on delete cascade,
  relationship_type public.relationship_type not null,
  status public.relationship_status not null default 'active',
  metadata_json jsonb,
  start_date date,
  end_date date,
  created_by_user_id uuid references public.profiles (id),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  check (from_person_id <> to_person_id)
);

create table public.person_title_overrides (
  id uuid primary key default gen_random_uuid(),
  family_tree_id uuid not null references public.family_trees (id) on delete cascade,
  viewer_person_id uuid not null references public.people (id) on delete cascade,
  target_person_id uuid not null references public.people (id) on delete cascade,
  locale text not null default 'zh-Hans',
  title_text text not null,
  explanation_text text,
  created_by_user_id uuid not null references public.profiles (id),
  created_at timestamptz not null default timezone('utc', now()),
  unique (family_tree_id, viewer_person_id, target_person_id, locale)
);

create table public.suggested_edits (
  id uuid primary key default gen_random_uuid(),
  family_tree_id uuid not null references public.family_trees (id) on delete cascade,
  proposed_by_user_id uuid not null references public.profiles (id),
  target_entity_type text not null,
  target_entity_id uuid,
  action_type text not null,
  proposed_change_json jsonb not null,
  status public.suggested_edit_status not null default 'pending',
  reviewed_by_user_id uuid references public.profiles (id),
  review_notes text,
  created_at timestamptz not null default timezone('utc', now()),
  reviewed_at timestamptz
);

create table public.activity_logs (
  id uuid primary key default gen_random_uuid(),
  family_tree_id uuid not null references public.family_trees (id) on delete cascade,
  actor_user_id uuid references public.profiles (id),
  entity_type text not null,
  entity_id uuid,
  action text not null,
  summary text not null,
  before_json jsonb,
  after_json jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create index memberships_user_id_idx on public.memberships (user_id);
create index memberships_person_id_idx on public.memberships (person_id);
create index people_family_tree_id_idx on public.people (family_tree_id);
create index relationships_family_tree_id_idx on public.relationships (family_tree_id);
create index relationships_from_person_id_idx on public.relationships (from_person_id);
create index relationships_to_person_id_idx on public.relationships (to_person_id);
create index suggested_edits_family_tree_id_idx on public.suggested_edits (family_tree_id);
create index activity_logs_family_tree_id_idx on public.activity_logs (family_tree_id);

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

create trigger family_trees_set_updated_at
before update on public.family_trees
for each row execute function public.set_updated_at();

create trigger family_trees_create_admin_membership
after insert on public.family_trees
for each row execute function public.handle_new_family_tree();

create trigger memberships_set_updated_at
before update on public.memberships
for each row execute function public.set_updated_at();

create trigger people_set_updated_at
before update on public.people
for each row execute function public.set_updated_at();

create trigger relationships_set_updated_at
before update on public.relationships
for each row execute function public.set_updated_at();

alter table public.profiles enable row level security;
alter table public.family_trees enable row level security;
alter table public.memberships enable row level security;
alter table public.invites enable row level security;
alter table public.people enable row level security;
alter table public.relationships enable row level security;
alter table public.person_title_overrides enable row level security;
alter table public.suggested_edits enable row level security;
alter table public.activity_logs enable row level security;

create policy "profiles are readable by shared tree members"
on public.profiles
for select
to authenticated
using (
  id = auth.uid()
  or exists (
    select 1
    from public.memberships current_member
    join public.memberships target_member
      on target_member.family_tree_id = current_member.family_tree_id
    where current_member.user_id = auth.uid()
      and current_member.status = 'active'
      and target_member.user_id = profiles.id
      and target_member.status = 'active'
  )
);

create policy "profiles are editable by the owner"
on public.profiles
for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid());

create policy "family trees are readable by active members"
on public.family_trees
for select
to authenticated
using (public.is_tree_member(id));

create policy "family trees are insertable by authenticated users"
on public.family_trees
for insert
to authenticated
with check (created_by_user_id = auth.uid());

create policy "family trees are editable by editors and admins"
on public.family_trees
for update
to authenticated
using (public.has_tree_role(id, array['editor', 'admin']::public.tree_role[]))
with check (public.has_tree_role(id, array['editor', 'admin']::public.tree_role[]));

create policy "memberships are readable by active members"
on public.memberships
for select
to authenticated
using (public.is_tree_member(family_tree_id));

create policy "memberships are manageable by admins"
on public.memberships
for all
to authenticated
using (public.has_tree_role(family_tree_id, array['admin']::public.tree_role[]))
with check (public.has_tree_role(family_tree_id, array['admin']::public.tree_role[]));

create policy "invites are readable by editors and admins"
on public.invites
for select
to authenticated
using (public.has_tree_role(family_tree_id, array['editor', 'admin']::public.tree_role[]));

create policy "invites are manageable by editors and admins"
on public.invites
for all
to authenticated
using (public.has_tree_role(family_tree_id, array['editor', 'admin']::public.tree_role[]))
with check (public.has_tree_role(family_tree_id, array['editor', 'admin']::public.tree_role[]));

create policy "people are readable by active members"
on public.people
for select
to authenticated
using (public.is_tree_member(family_tree_id));

create policy "people are insertable by editors and admins"
on public.people
for insert
to authenticated
with check (
  public.has_tree_role(family_tree_id, array['editor', 'admin']::public.tree_role[])
  and coalesce(created_by_user_id, auth.uid()) = auth.uid()
);

create policy "people are editable by editors and admins"
on public.people
for update
to authenticated
using (public.has_tree_role(family_tree_id, array['editor', 'admin']::public.tree_role[]))
with check (public.has_tree_role(family_tree_id, array['editor', 'admin']::public.tree_role[]));

create policy "relationships are readable by active members"
on public.relationships
for select
to authenticated
using (public.is_tree_member(family_tree_id));

create policy "relationships are insertable by editors and admins"
on public.relationships
for insert
to authenticated
with check (
  public.has_tree_role(family_tree_id, array['editor', 'admin']::public.tree_role[])
  and coalesce(created_by_user_id, auth.uid()) = auth.uid()
);

create policy "relationships are editable by editors and admins"
on public.relationships
for update
to authenticated
using (public.has_tree_role(family_tree_id, array['editor', 'admin']::public.tree_role[]))
with check (public.has_tree_role(family_tree_id, array['editor', 'admin']::public.tree_role[]));

create policy "relationships are deletable by editors and admins"
on public.relationships
for delete
to authenticated
using (public.has_tree_role(family_tree_id, array['editor', 'admin']::public.tree_role[]));

create policy "title overrides are readable by active members"
on public.person_title_overrides
for select
to authenticated
using (public.is_tree_member(family_tree_id));

create policy "title overrides are manageable by editors and admins"
on public.person_title_overrides
for all
to authenticated
using (public.has_tree_role(family_tree_id, array['editor', 'admin']::public.tree_role[]))
with check (public.has_tree_role(family_tree_id, array['editor', 'admin']::public.tree_role[]));

create policy "suggestions are readable by active members"
on public.suggested_edits
for select
to authenticated
using (public.is_tree_member(family_tree_id));

create policy "contributors can create suggestions"
on public.suggested_edits
for insert
to authenticated
with check (
  public.has_tree_role(
    family_tree_id,
    array['contributor', 'editor', 'admin']::public.tree_role[]
  )
  and proposed_by_user_id = auth.uid()
);

create policy "editors and admins can review suggestions"
on public.suggested_edits
for update
to authenticated
using (public.has_tree_role(family_tree_id, array['editor', 'admin']::public.tree_role[]))
with check (public.has_tree_role(family_tree_id, array['editor', 'admin']::public.tree_role[]));

create policy "activity logs are readable by active members"
on public.activity_logs
for select
to authenticated
using (public.is_tree_member(family_tree_id));

create policy "activity logs are insertable by editors and admins"
on public.activity_logs
for insert
to authenticated
with check (public.has_tree_role(family_tree_id, array['editor', 'admin']::public.tree_role[]));
