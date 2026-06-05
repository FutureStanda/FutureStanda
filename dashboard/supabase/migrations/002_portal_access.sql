-- ─── Portal access + profile RLS ────────────────────────────────────────────
-- 001 enabled RLS on `profiles` but added no SELECT policy, which would make
-- role lookups return nothing. This migration fixes that and grants clients
-- read access to their own data so the portal can render under RLS.

-- Profiles: a user can always read and update their own row.
create policy "Users read own profile" on profiles
  for select using (id = auth.uid());
create policy "Users update own profile" on profiles
  for update using (id = auth.uid());

-- Admins can read every profile (needed for admin tooling).
create policy "Admins read all profiles" on profiles
  for select using (
    exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin')
  );

-- Helper: the client_id attached to the current user (null for admins).
create or replace function public.current_client_id()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select client_id from profiles where id = auth.uid()
$$;

-- Clients may read their own related records.
create policy "Clients read own tasks" on tasks
  for select using (client_id = public.current_client_id());

create policy "Clients read own marketing" on marketing_data
  for select using (client_id = public.current_client_id());

create policy "Clients read own activity" on activity_feed
  for select using (client_id = public.current_client_id());

create policy "Clients read own integrations" on integrations
  for select using (client_id = public.current_client_id());

-- Keep the client_id on the profile in sync when an admin creates a client login.
-- (The admin server action also sets this explicitly; this trigger covers the
--  case where role/client_id arrive via auth metadata.)
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, role, client_id)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    coalesce(new.raw_user_meta_data->>'role', 'admin'),
    new.raw_user_meta_data->>'client_id'
  );
  return new;
end;
$$ language plpgsql security definer;
