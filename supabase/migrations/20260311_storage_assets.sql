create extension if not exists pgcrypto;

create table if not exists public.organization_files (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  created_by uuid not null references auth.users(id) on delete cascade,
  kind text not null,
  bucket_name text not null,
  storage_path text not null unique,
  file_name text,
  mime_type text,
  size_bytes bigint,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists organization_files_organization_kind_updated_idx
  on public.organization_files (organization_id, kind, updated_at desc);

create index if not exists organization_files_bucket_path_idx
  on public.organization_files (bucket_name, storage_path);

drop trigger if exists set_organization_files_updated_at on public.organization_files;
create trigger set_organization_files_updated_at
before update on public.organization_files
for each row
execute function public.set_updated_at();

alter table public.organization_files enable row level security;

drop policy if exists "organization_files_select_own_org" on public.organization_files;
create policy "organization_files_select_own_org"
on public.organization_files
for select
using (public.user_owns_organization(organization_id));

drop policy if exists "organization_files_insert_own_org" on public.organization_files;
create policy "organization_files_insert_own_org"
on public.organization_files
for insert
with check (
  public.user_owns_organization(organization_id)
  and created_by = auth.uid()
);

drop policy if exists "organization_files_update_own_org" on public.organization_files;
create policy "organization_files_update_own_org"
on public.organization_files
for update
using (public.user_owns_organization(organization_id))
with check (
  public.user_owns_organization(organization_id)
  and created_by = auth.uid()
);

drop policy if exists "organization_files_delete_own_org" on public.organization_files;
create policy "organization_files_delete_own_org"
on public.organization_files
for delete
using (public.user_owns_organization(organization_id));

create or replace function public.user_can_access_organization_storage_object(target_bucket text, object_name text)
returns boolean
language sql
stable
as $$
  select
    target_bucket = 'organization-assets'
    and split_part(coalesce(object_name, ''), '/', 1) = 'org'
    and exists (
      select 1
      from public.organizations
      where organizations.id::text = split_part(coalesce(object_name, ''), '/', 2)
        and organizations.owner_user_id = auth.uid()
    )
    and (
      (
        split_part(coalesce(object_name, ''), '/', 3) = 'branding'
        and split_part(coalesce(object_name, ''), '/', 4) = 'logo'
        and split_part(coalesce(object_name, ''), '/', 5) <> ''
      )
      or (
        split_part(coalesce(object_name, ''), '/', 3) = 'reports'
        and split_part(coalesce(object_name, ''), '/', 4) <> ''
        and split_part(coalesce(object_name, ''), '/', 5) <> ''
      )
      or (
        split_part(coalesce(object_name, ''), '/', 3) = 'assets'
        and split_part(coalesce(object_name, ''), '/', 4) <> ''
      )
    );
$$;

insert into storage.buckets (id, name, public)
values ('organization-assets', 'organization-assets', false)
on conflict (id) do update
set
  name = excluded.name,
  public = excluded.public;

drop policy if exists "organization_assets_select_own_prefix" on storage.objects;
create policy "organization_assets_select_own_prefix"
on storage.objects
for select
to authenticated
using (public.user_can_access_organization_storage_object(bucket_id, name));

drop policy if exists "organization_assets_insert_own_prefix" on storage.objects;
create policy "organization_assets_insert_own_prefix"
on storage.objects
for insert
to authenticated
with check (public.user_can_access_organization_storage_object(bucket_id, name));

drop policy if exists "organization_assets_update_own_prefix" on storage.objects;
create policy "organization_assets_update_own_prefix"
on storage.objects
for update
to authenticated
using (public.user_can_access_organization_storage_object(bucket_id, name))
with check (public.user_can_access_organization_storage_object(bucket_id, name));

drop policy if exists "organization_assets_delete_own_prefix" on storage.objects;
create policy "organization_assets_delete_own_prefix"
on storage.objects
for delete
to authenticated
using (public.user_can_access_organization_storage_object(bucket_id, name));
