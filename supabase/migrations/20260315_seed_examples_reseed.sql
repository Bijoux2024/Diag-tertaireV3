alter table public.pro_cases
  add column if not exists is_example boolean default false;

create or replace function public.seed_example_cases(
  target_organization_id uuid,
  actor_user_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  already_has_examples boolean := false;
  actor_organization_id uuid;
  source_case record;
  source_report record;
  new_case_id uuid;
  next_case_payload jsonb;
  next_report_payload jsonb;
begin
  if target_organization_id is null then
    raise exception 'Missing target_organization_id' using errcode = '22023';
  end if;

  if actor_user_id is null then
    raise exception 'Missing actor_user_id' using errcode = '22023';
  end if;

  select profiles.organization_id
  into actor_organization_id
  from public.profiles
  where profiles.id = actor_user_id
  limit 1;

  if actor_organization_id is null or actor_organization_id <> target_organization_id then
    raise exception 'Actor is not allowed to seed this organization' using errcode = '42501';
  end if;

  select exists (
    select 1
    from public.pro_cases as existing_cases
    where existing_cases.organization_id = target_organization_id
      and coalesce(existing_cases.lifecycle_status, 'active') = 'active'
      and coalesce(existing_cases.is_example, false) = true
  )
  into already_has_examples;

  if already_has_examples then
    return;
  end if;

  for source_case in
    select pc.*
    from public.pro_cases as pc
    where pc.organization_id <> target_organization_id
      and coalesce(pc.title, pc.site_name, pc.case_data->>'projectName', pc.case_data->>'clientName', '') ilike 'EXEMPLE%'
      and coalesce(pc.lifecycle_status, 'active') = 'active'
      and pc.status = 'completed'
    order by pc.created_at asc, pc.id asc
  loop
    new_case_id := gen_random_uuid();
    next_case_payload := coalesce(source_case.case_data, '{}'::jsonb);

    if jsonb_typeof(next_case_payload) <> 'object' then
      next_case_payload := '{}'::jsonb;
    end if;

    next_case_payload := jsonb_set(
      jsonb_set(next_case_payload, '{id}', to_jsonb(new_case_id::text), true),
      '{caseId}',
      to_jsonb(new_case_id::text),
      true
    );
    next_case_payload := jsonb_set(next_case_payload, '{isExample}', 'true'::jsonb, true);

    insert into public.pro_cases (
      id,
      organization_id,
      created_by,
      title,
      status,
      site_name,
      activity_type,
      case_data,
      created_at,
      updated_at,
      lifecycle_status,
      deleted_at,
      is_example
    )
    values (
      new_case_id,
      target_organization_id,
      actor_user_id,
      source_case.title,
      source_case.status,
      source_case.site_name,
      source_case.activity_type,
      next_case_payload,
      now(),
      now(),
      'active',
      null,
      true
    );

    select pr.*
    into source_report
    from public.pro_reports as pr
    where pr.case_id = source_case.id
      and coalesce(pr.status, 'active') = 'active'
    order by pr.updated_at desc, pr.created_at desc
    limit 1;

    if found then
      next_report_payload := coalesce(source_report.report_payload, '{}'::jsonb);

      if jsonb_typeof(next_report_payload) <> 'object' then
        next_report_payload := '{}'::jsonb;
      end if;

      next_report_payload := jsonb_set(
        jsonb_set(next_report_payload, '{id}', to_jsonb(new_case_id::text), true),
        '{caseId}',
        to_jsonb(new_case_id::text),
        true
      );
      next_report_payload := jsonb_set(next_report_payload, '{isExample}', 'true'::jsonb, true);

      insert into public.pro_reports (
        id,
        organization_id,
        case_id,
        created_by,
        report_name,
        report_payload,
        report_summary,
        status,
        deleted_at,
        created_at,
        updated_at
      )
      values (
        gen_random_uuid(),
        target_organization_id,
        new_case_id,
        actor_user_id,
        source_report.report_name,
        next_report_payload,
        coalesce(source_report.report_summary, '{}'::jsonb),
        'active',
        null,
        now(),
        now()
      );
    end if;
  end loop;

  insert into public.user_workspace_state (
    user_id,
    organization_id,
    draft_payload,
    ui_state
  )
  values (
    actor_user_id,
    target_organization_id,
    '{}'::jsonb,
    jsonb_build_object('examples_seeded', true)
  )
  on conflict (user_id)
  do update
  set
    organization_id = excluded.organization_id,
    ui_state = coalesce(user_workspace_state.ui_state, '{}'::jsonb) || jsonb_build_object('examples_seeded', true);
end;
$$;

revoke all on function public.seed_example_cases(uuid, uuid) from public;
revoke all on function public.seed_example_cases(uuid, uuid) from anon;
grant execute on function public.seed_example_cases(uuid, uuid) to authenticated;
grant execute on function public.seed_example_cases(uuid, uuid) to service_role;
