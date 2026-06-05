-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Users/profiles
create table profiles (
  id uuid references auth.users on delete cascade primary key,
  email text,
  full_name text,
  role text default 'admin', -- 'admin' or 'client'
  client_id text, -- for client role, which client they belong to
  avatar_url text,
  created_at timestamptz default now()
);

-- Clients (Irish SMB businesses)
create table clients (
  id text primary key, -- e.g. 'murphy-plumbing'
  name text not null,
  handle text,
  city text,
  niche text,
  plan text default 'Domination',
  mrr integer default 0,
  since text,
  onboarded integer default 0,
  health integer default 0,
  owner text,
  avatar text,
  color text default '#CFFF3A',
  leads30 integer default 0,
  leads_delta float default 0,
  bookings30 integer default 0,
  bookings_delta float default 0,
  revenue30 integer default 0,
  revenue_delta float default 0,
  roas float default 0,
  missed_calls integer default 0,
  reviews_count integer default 0,
  reviews_rating float default 0,
  reviews_new30 integer default 0,
  ad_spend integer default 0,
  website_visits30 integer default 0,
  website_visits_delta float default 0,
  website_conv float default 0,
  followers_ig integer default 0,
  followers_fb integer default 0,
  followers_tt integer default 0,
  pending_tasks integer default 0,
  last_touch text,
  next_due text,
  flag text,
  services text[] default '{}',
  sparkline integer[] default '{}',
  connected text[] default '{}',
  memory jsonb default '{}',
  onboarding_active boolean default false,
  onboarding_done text[] default '{}',
  onboarding_started text,
  created_at timestamptz default now()
);

-- Leads
create table leads (
  id uuid default uuid_generate_v4() primary key,
  business_name text not null,
  contact_name text,
  email text,
  phone text,
  meeting_time text,
  booking_link text,
  niche text,
  area text,
  current_process text,
  google_url text,
  social_urls text,
  services text,
  dream_client text,
  blockers text,
  scale_priority integer default 5,
  what_changes text,
  why_now text,
  status text default 'New lead',
  telegram_status text default 'pending',
  intro_sent boolean default false,
  research_status text default 'pending',
  research_data jsonb,
  created_at timestamptz default now()
);

-- Tasks
create table tasks (
  id uuid default uuid_generate_v4() primary key,
  title text not null,
  description text,
  status text default 'todo',
  priority text default 'normal',
  category text default 'General',
  client_id text references clients(id),
  assignee text,
  due_date text,
  objective_id uuid,
  archived boolean default false,
  created_at timestamptz default now()
);

-- Objectives
create table objectives (
  id uuid default uuid_generate_v4() primary key,
  title text not null,
  owner text,
  current_value float default 0,
  target_value float default 100,
  progress float default 0,
  progress_mode text default 'krs',
  key_results jsonb default '[]',
  linked_tasks uuid[] default '{}',
  created_at timestamptz default now()
);

-- Pages (Notion-style)
create table pages (
  id uuid default uuid_generate_v4() primary key,
  title text not null,
  parent_id uuid references pages(id),
  content_blocks jsonb default '[]',
  theme text default 'dark',
  tags text[] default '{}',
  icon text default '📄',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Resources
create table resources (
  id uuid default uuid_generate_v4() primary key,
  title text not null,
  type text default 'Doc',
  tag text,
  body text,
  created_at timestamptz default now()
);

-- Automations
create table automations (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  trigger_type text,
  trigger_source text,
  steps jsonb default '[]',
  nodes jsonb default '[]',
  edges jsonb default '[]',
  is_enabled boolean default true,
  client_id text references clients(id),
  run_count integer default 0,
  last_run timestamptz,
  created_at timestamptz default now()
);

-- Agents
create table agents (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  role text,
  type text default 'ai', -- 'ai' or 'person'
  tools text[] default '{}',
  capabilities text,
  status text default 'idle',
  run_count integer default 0,
  avatar text,
  is_active boolean default true,
  created_at timestamptz default now()
);

-- Integrations per client
create table integrations (
  id uuid default uuid_generate_v4() primary key,
  client_id text references clients(id),
  provider text not null,
  is_connected boolean default false,
  connected_at timestamptz,
  created_at timestamptz default now(),
  unique(client_id, provider)
);

-- Activity feed
create table activity_feed (
  id uuid default uuid_generate_v4() primary key,
  type text,
  client_id text references clients(id),
  message text,
  metadata jsonb,
  created_at timestamptz default now()
);

-- Marketing data per client
create table marketing_data (
  id uuid default uuid_generate_v4() primary key,
  client_id text references clients(id),
  date date,
  leads integer default 0,
  spend float default 0,
  revenue float default 0,
  roas float default 0,
  created_at timestamptz default now()
);

-- Row Level Security
alter table profiles enable row level security;
alter table clients enable row level security;
alter table leads enable row level security;
alter table tasks enable row level security;
alter table objectives enable row level security;
alter table pages enable row level security;
alter table resources enable row level security;
alter table automations enable row level security;
alter table agents enable row level security;
alter table integrations enable row level security;
alter table activity_feed enable row level security;
alter table marketing_data enable row level security;

-- RLS policies (admins see everything, clients see their own)
create policy "Admin full access" on clients for all using (
  exists (select 1 from profiles where id = auth.uid() and role = 'admin')
);
create policy "Admin full access leads" on leads for all using (
  exists (select 1 from profiles where id = auth.uid() and role = 'admin')
);
create policy "Admin full access tasks" on tasks for all using (
  exists (select 1 from profiles where id = auth.uid() and role = 'admin')
);
create policy "Admin full access objectives" on objectives for all using (
  exists (select 1 from profiles where id = auth.uid() and role = 'admin')
);
create policy "Admin full access pages" on pages for all using (
  exists (select 1 from profiles where id = auth.uid() and role = 'admin')
);
create policy "Admin full access resources" on resources for all using (
  exists (select 1 from profiles where id = auth.uid() and role = 'admin')
);
create policy "Admin full access automations" on automations for all using (
  exists (select 1 from profiles where id = auth.uid() and role = 'admin')
);
create policy "Admin full access agents" on agents for all using (
  exists (select 1 from profiles where id = auth.uid() and role = 'admin')
);
create policy "Admin full access integrations" on integrations for all using (
  exists (select 1 from profiles where id = auth.uid() and role = 'admin')
);
create policy "Admin full access activity" on activity_feed for all using (
  exists (select 1 from profiles where id = auth.uid() and role = 'admin')
);
create policy "Admin full access marketing" on marketing_data for all using (
  exists (select 1 from profiles where id = auth.uid() and role = 'admin')
);

-- Client portal access (clients see their own data)
create policy "Clients see own profile" on clients for select using (
  id = (select client_id from profiles where id = auth.uid())
);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name',
    coalesce(new.raw_user_meta_data->>'role', 'admin'));
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
