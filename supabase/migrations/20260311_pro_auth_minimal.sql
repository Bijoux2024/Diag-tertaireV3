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

create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  owner_user_id uuid not null unique references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  organization_id uuid not null unique references public.organizations(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists set_organizations_updated_at on public.organizations;
create trigger set_organizations_updated_at
before update on public.organizations
for each row
execute function public.set_updated_at();

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
before update on public.profiles
for each row
execute function public.set_updated_at();

alter table public.organizations enable row level security;
alter table public.profiles enable row level security;

drop policy if exists "organizations_select_own" on public.organizations;
create policy "organizations_select_own"
on public.organizations
for select
using (owner_user_id = auth.uid());

drop policy if exists "organizations_insert_own" on public.organizations;
create policy "organizations_insert_own"
on public.organizations
for insert
with check (owner_user_id = auth.uid());

drop policy if exists "organizations_update_own" on public.organizations;
create policy "organizations_update_own"
on public.organizations
for update
using (owner_user_id = auth.uid())
with check (owner_user_id = auth.uid());

drop policy if exists "organizations_delete_own" on public.organizations;
create policy "organizations_delete_own"
on public.organizations
for delete
using (owner_user_id = auth.uid());

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
on public.profiles
for select
using (id = auth.uid());

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
on public.profiles
for insert
with check (
  id = auth.uid()
  and exists (
    select 1
    from public.organizations
    where organizations.id = profiles.organization_id
      and organizations.owner_user_id = auth.uid()
  )
);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
on public.profiles
for update
using (id = auth.uid())
with check (
  id = auth.uid()
  and exists (
    select 1
    from public.organizations
    where organizations.id = profiles.organization_id
      and organizations.owner_user_id = auth.uid()
  )
);

drop policy if exists "profiles_delete_own" on public.profiles;
create policy "profiles_delete_own"
on public.profiles
for delete
using (id = auth.uid());
