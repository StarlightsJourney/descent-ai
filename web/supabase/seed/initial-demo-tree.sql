do $$
declare
  target_email text := 'replace-me@example.com';
  target_slug text := 'lim-tan-family';
  target_tree_name text := 'Lim Tan Family';
  target_tree_description text := 'Seeded family tree for the first Supabase-backed Descent workspace.';
  target_user_id uuid;
  target_tree_id uuid;
  viewer_person_id uuid;
  spouse_person_id uuid;
  sibling_person_id uuid;
  father_person_id uuid;
  mother_person_id uuid;
  grandparent_person_id uuid;
  child_person_id uuid;
begin
  select id
  into target_user_id
  from auth.users
  where email = target_email;

  if target_user_id is null then
    raise exception 'No auth user found for email %', target_email;
  end if;

  insert into public.profiles (id, display_name)
  select
    auth_user.id,
    coalesce(auth_user.raw_user_meta_data ->> 'display_name', auth_user.email)
  from auth.users auth_user
  where auth_user.id = target_user_id
  on conflict (id) do nothing;

  insert into public.family_trees (
    slug,
    name,
    description,
    created_by_user_id
  )
  values (
    target_slug,
    target_tree_name,
    target_tree_description,
    target_user_id
  )
  on conflict (slug) do update
    set name = excluded.name,
        description = excluded.description
  returning id into target_tree_id;

  if target_tree_id is null then
    select id
    into target_tree_id
    from public.family_trees
    where slug = target_slug;
  end if;

  insert into public.people (
    family_tree_id,
    primary_name,
    gender,
    birth_date,
    is_living,
    generation_index,
    bio,
    created_by_user_id
  )
  select
    target_tree_id,
    seed.primary_name,
    seed.gender,
    seed.birth_date,
    seed.is_living,
    seed.generation_index,
    seed.bio,
    target_user_id
  from (
    values
      ('Alex Tan', 'male', '2001-01-01'::date, true, 2, 'Current viewer node used as the kinship reference point for the seeded live tree.'),
      ('Rachel Lee', 'female', '1999-07-16'::date, true, 2, 'Alex''s spouse, kept in the live seed so marriage and child edges can be checked together.'),
      ('Grace Tan', 'female', '1998-03-08'::date, true, 2, 'Alex''s older sister and a sibling-path check for Chinese and English kinship labels.'),
      ('Daniel Tan', 'male', '1972-05-11'::date, true, 1, 'Alex''s father and the main parent bridge to the grandparent generation.'),
      ('Mei Chen', 'female', '1974-02-18'::date, true, 1, 'Alex''s mother and the second direct parent in the seeded family.'),
      ('Tan Boon Kiat', 'male', '1941-10-02'::date, false, 0, 'Paternal grandfather whose branch anchors the older ancestry line.'),
      ('Chloe Tan', 'female', '2024-04-02'::date, true, 3, 'Child of Alex and Rachel, included so descendant layout reads clearly.')
  ) as seed(primary_name, gender, birth_date, is_living, generation_index, bio)
  where not exists (
    select 1
    from public.people existing
    where existing.family_tree_id = target_tree_id
      and existing.primary_name = seed.primary_name
  );

  select id
  into viewer_person_id
  from public.people
  where family_tree_id = target_tree_id
    and primary_name = 'Alex Tan'
  limit 1;

  select id
  into spouse_person_id
  from public.people
  where family_tree_id = target_tree_id
    and primary_name = 'Rachel Lee'
  limit 1;

  select id
  into sibling_person_id
  from public.people
  where family_tree_id = target_tree_id
    and primary_name = 'Grace Tan'
  limit 1;

  select id
  into father_person_id
  from public.people
  where family_tree_id = target_tree_id
    and primary_name = 'Daniel Tan'
  limit 1;

  select id
  into mother_person_id
  from public.people
  where family_tree_id = target_tree_id
    and primary_name = 'Mei Chen'
  limit 1;

  select id
  into grandparent_person_id
  from public.people
  where family_tree_id = target_tree_id
    and primary_name = 'Tan Boon Kiat'
  limit 1;

  select id
  into child_person_id
  from public.people
  where family_tree_id = target_tree_id
    and primary_name = 'Chloe Tan'
  limit 1;

  update public.memberships
  set person_id = viewer_person_id,
      role = 'admin',
      status = 'active'
  where family_tree_id = target_tree_id
    and user_id = target_user_id;

  insert into public.relationships (
    family_tree_id,
    from_person_id,
    to_person_id,
    relationship_type,
    status,
    created_by_user_id
  )
  select
    target_tree_id,
    seed.from_person_id,
    seed.to_person_id,
    seed.relationship_type,
    seed.status,
    target_user_id
  from (
    values
      (grandparent_person_id, father_person_id, 'biological_parent'::public.relationship_type, 'active'::public.relationship_status),
      (father_person_id, mother_person_id, 'spouse'::public.relationship_type, 'active'::public.relationship_status),
      (father_person_id, viewer_person_id, 'biological_parent'::public.relationship_type, 'active'::public.relationship_status),
      (mother_person_id, viewer_person_id, 'biological_parent'::public.relationship_type, 'active'::public.relationship_status),
      (father_person_id, sibling_person_id, 'biological_parent'::public.relationship_type, 'active'::public.relationship_status),
      (mother_person_id, sibling_person_id, 'biological_parent'::public.relationship_type, 'active'::public.relationship_status),
      (viewer_person_id, spouse_person_id, 'spouse'::public.relationship_type, 'active'::public.relationship_status),
      (viewer_person_id, child_person_id, 'biological_parent'::public.relationship_type, 'active'::public.relationship_status),
      (spouse_person_id, child_person_id, 'biological_parent'::public.relationship_type, 'active'::public.relationship_status)
  ) as seed(from_person_id, to_person_id, relationship_type, status)
  where not exists (
    select 1
    from public.relationships existing
    where existing.family_tree_id = target_tree_id
      and existing.from_person_id = seed.from_person_id
      and existing.to_person_id = seed.to_person_id
      and existing.relationship_type = seed.relationship_type
  );

  insert into public.suggested_edits (
    family_tree_id,
    proposed_by_user_id,
    target_entity_type,
    action_type,
    proposed_change_json,
    status
  )
  select
    target_tree_id,
    target_user_id,
    seed.target_entity_type,
    seed.action_type,
    seed.proposed_change_json,
    'pending'::public.suggested_edit_status
  from (
    values
      ('person', 'update_title_override', '{"targetName":"Grace Tan","requestedTitle":"姐姐"}'::jsonb),
      ('person', 'add_photo', '{"personName":"Tan Boon Kiat"}'::jsonb)
  ) as seed(target_entity_type, action_type, proposed_change_json)
  where not exists (
    select 1
    from public.suggested_edits existing
    where existing.family_tree_id = target_tree_id
      and existing.proposed_by_user_id = target_user_id
      and existing.target_entity_type = seed.target_entity_type
      and existing.action_type = seed.action_type
  );

  insert into public.activity_logs (
    family_tree_id,
    actor_user_id,
    entity_type,
    entity_id,
    action,
    summary
  )
  select
    target_tree_id,
    target_user_id,
    seed.entity_type,
    seed.entity_id,
    seed.action,
    seed.summary
  from (
    values
      ('family_tree', target_tree_id, 'seeded', 'Initial Supabase seed applied'),
      ('membership', viewer_person_id, 'linked', 'Viewer membership linked to person node'),
      ('relationship', child_person_id, 'created', 'Initial family relationships seeded')
  ) as seed(entity_type, entity_id, action, summary)
  where not exists (
    select 1
    from public.activity_logs existing
    where existing.family_tree_id = target_tree_id
      and existing.action = seed.action
      and existing.summary = seed.summary
  );
end $$;
