-- CRANETRACK: System Branding / Appearance
-- Run once in Supabase SQL Editor.

create table if not exists public.system_settings (
    id bigint primary key default 1 check (id = 1),
    system_name text not null default 'CRANETRACK',
    system_tagline text not null default 'TIME | PROJECT | TEAM',
    welcome_title text not null default 'Good Afternoon,',
    welcome_message text not null default 'Track time. Deliver projects. Build a better tomorrow.',
    primary_color text not null default '#1d4ed8',
    accent_color text not null default '#0ea5e9',
    logo_url text,
    favicon_url text,
    dashboard_banner_url text,
    login_background_url text,
    updated_at timestamptz not null default now()
);

insert into public.system_settings (id, dashboard_banner_url)
values (1, 'https://gevftxdqyrejnjovurjt.supabase.co/storage/v1/object/public/cranetrack-assets/dashboard/crane-banner.jpg')
on conflict (id) do nothing;

alter table public.system_settings enable row level security;

drop policy if exists "branding_read_authenticated" on public.system_settings;
create policy "branding_read_authenticated"
on public.system_settings for select
to authenticated
using (true);

drop policy if exists "branding_admin_insert" on public.system_settings;
create policy "branding_admin_insert"
on public.system_settings for insert
to authenticated
with check (exists (select 1 from public.employees e where lower(e.email)=lower(auth.jwt()->>'email') and lower(e.system_role)='admin'));

drop policy if exists "branding_admin_update" on public.system_settings;
create policy "branding_admin_update"
on public.system_settings for update
to authenticated
using (exists (select 1 from public.employees e where lower(e.email)=lower(auth.jwt()->>'email') and lower(e.system_role)='admin'))
with check (exists (select 1 from public.employees e where lower(e.email)=lower(auth.jwt()->>'email') and lower(e.system_role)='admin'));

-- Storage: the bucket is already created by the user as cranetrack-assets.
-- Public SELECT is handled by the bucket being public. These policies allow authenticated admins to upload/update/delete branding assets.
drop policy if exists "cranetrack_branding_admin_insert" on storage.objects;
create policy "cranetrack_branding_admin_insert"
on storage.objects for insert to authenticated
with check (
  bucket_id='cranetrack-assets' and
  (name like 'branding/%' or name like 'dashboard/%' or name like 'login/%') and
  exists (select 1 from public.employees e where lower(e.email)=lower(auth.jwt()->>'email') and lower(e.system_role)='admin')
);

drop policy if exists "cranetrack_branding_admin_update" on storage.objects;
create policy "cranetrack_branding_admin_update"
on storage.objects for update to authenticated
using (
  bucket_id='cranetrack-assets' and
  exists (select 1 from public.employees e where lower(e.email)=lower(auth.jwt()->>'email') and lower(e.system_role)='admin'
))
with check (bucket_id='cranetrack-assets');

drop policy if exists "cranetrack_branding_admin_delete" on storage.objects;
create policy "cranetrack_branding_admin_delete"
on storage.objects for delete to authenticated
using (
  bucket_id='cranetrack-assets' and
  exists (select 1 from public.employees e where lower(e.email)=lower(auth.jwt()->>'email') and lower(e.system_role)='admin'
));
