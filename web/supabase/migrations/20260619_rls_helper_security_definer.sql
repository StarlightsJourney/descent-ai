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

revoke all on function public.is_tree_member(uuid) from public;
revoke all on function public.has_tree_role(uuid, public.tree_role[]) from public;

grant execute on function public.is_tree_member(uuid) to authenticated;
grant execute on function public.has_tree_role(uuid, public.tree_role[]) to authenticated;
