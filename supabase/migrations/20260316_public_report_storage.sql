insert into storage.buckets (id, name, public)
values ('public-diagnostic-assets', 'public-diagnostic-assets', false)
on conflict (id) do update
set public = excluded.public;
