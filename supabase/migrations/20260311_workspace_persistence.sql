create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.user_owns_organization(target_organization_id uuid)
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.organizations
    where organizations.id = target_organization_id
      and organizations.owner_user_id = auth.uid()
  );
$$;

create table if not exists public.organization_settings (
  organization_id uuid primary key references public.organizations(id) on delete cascade,
  accent text,
  brand_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.organization_branding (
  organization_id uuid primary key references public.organizations(id) on delete cascade,
  logo_storage_path text null,
  logo_file_name text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.pro_cases (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  created_by uuid not null references auth.users(id) on delete cascade,
  title text,
  status text,
  site_name text,
  activity_type text,
  case_data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.pro_reports (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  case_id uuid null references public.pro_cases(id) on delete set null,
  created_by uuid not null references auth.users(id) on delete cascade,
  report_name text,
  report_payload jsonb not null default '{}'::jsonb,
  report_summary jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.user_workspace_state (
  user_id uuid primary key references auth.users(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  draft_payload jsonb not null default '{}'::jsonb,
  ui_state jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists pro_cases_organization_updated_idx
  on public.pro_cases (organization_id, updated_at desc);

create index if not exists pro_reports_organization_updated_idx
  on public.pro_reports (organization_id, updated_at desc);

create index if not exists pro_reports_case_id_idx
  on public.pro_reports (case_id);

create index if not exists user_workspace_state_organization_idx
  on public.user_workspace_state (organization_id);

drop trigger if exists set_organization_settings_updated_at on public.organization_settings;
create trigger set_organization_settings_updated_at
before update on public.organization_settings
for each row
execute function public.set_updated_at();

drop trigger if exists set_organization_branding_updated_at on public.organization_branding;
create trigger set_organization_branding_updated_at
before update on public.organization_branding
for each row
execute function public.set_updated_at();

drop trigger if exists set_pro_cases_updated_at on public.pro_cases;
create trigger set_pro_cases_updated_at
before update on public.pro_cases
for each row
execute function public.set_updated_at();

drop trigger if exists set_pro_reports_updated_at on public.pro_reports;
create trigger set_pro_reports_updated_at
before update on public.pro_reports
for each row
execute function public.set_updated_at();

drop trigger if exists set_user_workspace_state_updated_at on public.user_workspace_state;
create trigger set_user_workspace_state_updated_at
before update on public.user_workspace_state
for each row
execute function public.set_updated_at();

alter table public.organization_settings enable row level security;
alter table public.organization_branding enable row level security;
alter table public.pro_cases enable row level security;
alter table public.pro_reports enable row level security;
alter table public.user_workspace_state enable row level security;

drop policy if exists "organization_settings_select_own" on public.organization_settings;
create policy "organization_settings_select_own"
on public.organization_settings
for select
using (public.user_owns_organization(organization_id));

drop policy if exists "organization_settings_insert_own" on public.organization_settings;
create policy "organization_settings_insert_own"
on public.organization_settings
for insert
with check (public.user_owns_organization(organization_id));

drop policy if exists "organization_settings_update_own" on public.organization_settings;
create policy "organization_settings_update_own"
on public.organization_settings
for update
using (public.user_owns_organization(organization_id))
with check (public.user_owns_organization(organization_id));

drop policy if exists "organization_settings_delete_own" on public.organization_settings;
create policy "organization_settings_delete_own"
on public.organization_settings
for delete
using (public.user_owns_organization(organization_id));

drop policy if exists "organization_branding_select_own" on public.organization_branding;
create policy "organization_branding_select_own"
on public.organization_branding
for select
using (public.user_owns_organization(organization_id));

drop policy if exists "organization_branding_insert_own" on public.organization_branding;
create policy "organization_branding_insert_own"
on public.organization_branding
for insert
with check (public.user_owns_organization(organization_id));

drop policy if exists "organization_branding_update_own" on public.organization_branding;
create policy "organization_branding_update_own"
on public.organization_branding
for update
using (public.user_owns_organization(organization_id))
with check (public.user_owns_organization(organization_id));

drop policy if exists "organization_branding_delete_own" on public.organization_branding;
create policy "organization_branding_delete_own"
on public.organization_branding
for delete
using (public.user_owns_organization(organization_id));

drop policy if exists "pro_cases_select_own_org" on public.pro_cases;
create policy "pro_cases_select_own_org"
on public.pro_cases
for select
using (public.user_owns_organization(organization_id));

drop policy if exists "pro_cases_insert_own_org" on public.pro_cases;
create policy "pro_cases_insert_own_org"
on public.pro_cases
for insert
with check (
  public.user_owns_organization(organization_id)
  and created_by = auth.uid()
);

drop policy if exists "pro_cases_update_own_org" on public.pro_cases;
create policy "pro_cases_update_own_org"
on public.pro_cases
for update
using (public.user_owns_organization(organization_id))
with check (
  public.user_owns_organization(organization_id)
  and created_by = auth.uid()
);

drop policy if exists "pro_cases_delete_own_org" on public.pro_cases;
create policy "pro_cases_delete_own_org"
on public.pro_cases
for delete
using (public.user_owns_organization(organization_id));

drop policy if exists "pro_reports_select_own_org" on public.pro_reports;
create policy "pro_reports_select_own_org"
on public.pro_reports
for select
using (public.user_owns_organization(organization_id));

drop policy if exists "pro_reports_insert_own_org" on public.pro_reports;
create policy "pro_reports_insert_own_org"
on public.pro_reports
for insert
with check (
  public.user_owns_organization(organization_id)
  and created_by = auth.uid()
);

drop policy if exists "pro_reports_update_own_org" on public.pro_reports;
create policy "pro_reports_update_own_org"
on public.pro_reports
for update
using (public.user_owns_organization(organization_id))
with check (
  public.user_owns_organization(organization_id)
  and created_by = auth.uid()
);

drop policy if exists "pro_reports_delete_own_org" on public.pro_reports;
create policy "pro_reports_delete_own_org"
on public.pro_reports
for delete
using (public.user_owns_organization(organization_id));

drop policy if exists "user_workspace_state_select_own" on public.user_workspace_state;
create policy "user_workspace_state_select_own"
on public.user_workspace_state
for select
using (
  user_id = auth.uid()
  and public.user_owns_organization(organization_id)
);

drop policy if exists "user_workspace_state_insert_own" on public.user_workspace_state;
create policy "user_workspace_state_insert_own"
on public.user_workspace_state
for insert
with check (
  user_id = auth.uid()
  and public.user_owns_organization(organization_id)
);

drop policy if exists "user_workspace_state_update_own" on public.user_workspace_state;
create policy "user_workspace_state_update_own"
on public.user_workspace_state
for update
using (
  user_id = auth.uid()
  and public.user_owns_organization(organization_id)
)
with check (
  user_id = auth.uid()
  and public.user_owns_organization(organization_id)
);

drop policy if exists "user_workspace_state_delete_own" on public.user_workspace_state;
create policy "user_workspace_state_delete_own"
on public.user_workspace_state
for delete
using (
  user_id = auth.uid()
  and public.user_owns_organization(organization_id)
);
