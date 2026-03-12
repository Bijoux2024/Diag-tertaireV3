create extension if not exists pgcrypto;

alter table public.pro_cases
  add column if not exists lifecycle_status text,
  add column if not exists deleted_at timestamptz null;

update public.pro_cases
set lifecycle_status = 'active'
where lifecycle_status is null;

alter table public.pro_cases
  alter column lifecycle_status set default 'active';

alter table public.pro_cases
  alter column lifecycle_status set not null;

alter table public.pro_reports
  add column if not exists status text,
  add column if not exists deleted_at timestamptz null;

update public.pro_reports
set status = 'active'
where status is null;

alter table public.pro_reports
  alter column status set default 'active';

alter table public.pro_reports
  alter column status set not null;

alter table public.organization_files
  add column if not exists status text,
  add column if not exists deleted_at timestamptz null;

update public.organization_files
set status = 'active'
where status is null;

alter table public.organization_files
  alter column status set default 'active';

alter table public.organization_files
  alter column status set not null;

create index if not exists pro_cases_lifecycle_status_updated_idx
  on public.pro_cases (organization_id, lifecycle_status, updated_at desc);

create index if not exists pro_reports_status_updated_idx
  on public.pro_reports (organization_id, status, updated_at desc);

create index if not exists organization_files_status_updated_idx
  on public.organization_files (organization_id, status, kind, updated_at desc);

drop policy if exists "pro_cases_delete_own_org" on public.pro_cases;
drop policy if exists "pro_reports_delete_own_org" on public.pro_reports;

create or replace function public.soft_delete_case_bundle(target_case_id uuid, actor_user_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_now timestamptz := now();
  v_org_id uuid;
  v_case_id uuid;
  v_report_ids uuid[] := array[]::uuid[];
  v_report_id_texts text[] := array[]::text[];
  v_latest_pdf_file_ids uuid[] := array[]::uuid[];
  v_file_ids uuid[] := array[]::uuid[];
  v_storage_paths text[] := array[]::text[];
  v_files jsonb := '[]'::jsonb;
begin
  if target_case_id is null then
    raise exception 'Missing target_case_id' using errcode = '22023';
  end if;

  if actor_user_id is null then
    raise exception 'Missing actor_user_id' using errcode = '22023';
  end if;

  select profiles.organization_id
  into v_org_id
  from public.profiles
  where profiles.id = actor_user_id
  limit 1;

  if v_org_id is null then
    raise exception 'Profile organization not found' using errcode = '42501';
  end if;

  select pro_cases.id
  into v_case_id
  from public.pro_cases
  where pro_cases.id = target_case_id
    and pro_cases.organization_id = v_org_id
    and coalesce(pro_cases.lifecycle_status, 'active') = 'active'
  limit 1;

  if v_case_id is null then
    raise exception 'Case not found' using errcode = 'P0002';
  end if;

  select
    coalesce(array_agg(pro_reports.id order by pro_reports.updated_at desc), array[]::uuid[]),
    coalesce(array_agg(pro_reports.id::text order by pro_reports.updated_at desc), array[]::text[]),
    coalesce(
      array_agg(pro_reports.latest_pdf_file_id) filter (where pro_reports.latest_pdf_file_id is not null),
      array[]::uuid[]
    )
  into
    v_report_ids,
    v_report_id_texts,
    v_latest_pdf_file_ids
  from public.pro_reports
  where pro_reports.organization_id = v_org_id
    and pro_reports.case_id = target_case_id
    and coalesce(pro_reports.status, 'active') = 'active';

  select
    coalesce(array_agg(file_rows.id), array[]::uuid[]),
    coalesce(
      array_agg(file_rows.storage_path) filter (where coalesce(file_rows.storage_path, '') <> ''),
      array[]::text[]
    ),
    coalesce(
      jsonb_agg(
        jsonb_build_object(
          'id', file_rows.id,
          'bucket_name', file_rows.bucket_name,
          'storage_path', file_rows.storage_path,
          'kind', file_rows.kind
        )
      ),
      '[]'::jsonb
    )
  into
    v_file_ids,
    v_storage_paths,
    v_files
  from (
    select distinct
      organization_files.id,
      organization_files.bucket_name,
      organization_files.storage_path,
      organization_files.kind
    from public.organization_files
    where organization_files.organization_id = v_org_id
      and organization_files.kind = 'report_pdf'
      and coalesce(organization_files.status, 'active') = 'active'
      and (
        coalesce(organization_files.metadata->>'case_id', '') = target_case_id::text
        or (
          coalesce(array_length(v_latest_pdf_file_ids, 1), 0) > 0
          and organization_files.id = any(v_latest_pdf_file_ids)
        )
        or (
          coalesce(array_length(v_report_id_texts, 1), 0) > 0
          and coalesce(organization_files.metadata->>'report_id', '') = any(v_report_id_texts)
        )
        or exists (
          select 1
          from unnest(v_report_ids) as report_id
          where coalesce(organization_files.storage_path, '') like format(
            'org/%s/reports/%s/%%',
            v_org_id::text,
            report_id::text
          )
        )
      )
    order by organization_files.storage_path, organization_files.id
  ) as file_rows;

  update public.pro_cases
  set lifecycle_status = 'deleted',
      deleted_at = v_now
  where pro_cases.id = target_case_id
    and pro_cases.organization_id = v_org_id;

  if coalesce(array_length(v_report_ids, 1), 0) > 0 then
    update public.pro_reports
    set status = 'deleted',
        deleted_at = v_now,
        pdf_status = case
          when pro_reports.latest_pdf_file_id is not null then 'deleted'
          when pro_reports.pdf_status = 'generating' then 'deleted'
          else pro_reports.pdf_status
        end
    where pro_reports.id = any(v_report_ids);
  end if;

  if coalesce(array_length(v_file_ids, 1), 0) > 0 then
    update public.organization_files
    set status = case
          when coalesce(organization_files.storage_path, '') <> '' then 'pending_cleanup'
          else 'deleted'
        end,
        deleted_at = v_now
    where organization_files.id = any(v_file_ids);
  end if;

  return jsonb_build_object(
    'ok', true,
    'organization_id', v_org_id,
    'case_id', target_case_id,
    'report_ids', to_jsonb(v_report_ids),
    'organization_file_ids', to_jsonb(v_file_ids),
    'storage_paths', to_jsonb(v_storage_paths),
    'files', v_files
  );
end;
$$;

revoke all on function public.soft_delete_case_bundle(uuid, uuid) from public;
revoke all on function public.soft_delete_case_bundle(uuid, uuid) from anon;
revoke all on function public.soft_delete_case_bundle(uuid, uuid) from authenticated;
grant execute on function public.soft_delete_case_bundle(uuid, uuid) to service_role;
