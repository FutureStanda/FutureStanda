-- ════════════════════════════════════════════════════════════════════════
-- BizBoost Command Centre — full setup (paste this whole file into the
-- Supabase SQL Editor and click Run). Safe to run once on a fresh project.
-- ════════════════════════════════════════════════════════════════════════

-- ─── 1. Schema + base RLS ───────────────────────────────────────────────
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

-- ─── 2. Portal access + profile RLS ─────────────────────────────────────
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

-- ─── 3. Seed: 9 clients + default data ──────────────────────────────────
-- ─── BizBoost Command Centre — Seed Data ─────────────────────────────────────
-- All 9 Irish SMB clients + default data

-- ─── Clients ──────────────────────────────────────────────────────────────────

INSERT INTO clients (
  id, name, handle, city, niche, plan, mrr, since,
  onboarded, health, owner, avatar, color,
  leads30, leads_delta, bookings30, bookings_delta,
  revenue30, revenue_delta, roas, missed_calls,
  reviews_count, reviews_rating, reviews_new30,
  ad_spend, website_visits30, website_visits_delta, website_conv,
  followers_ig, followers_fb, followers_tt,
  pending_tasks, last_touch, next_due, flag,
  services, sparkline, connected,
  memory, onboarding_active, onboarding_done, onboarding_started
) VALUES

-- 1. Tobin Tiling & Stone
(
  'tobin-tiling',
  'Tobin Tiling & Stone',
  'tobintiling.ie',
  'Ennis',
  'Tiling',
  'Domination',
  998,
  'Jun 2026',
  2, 70,
  'Gerry Tobin', 'T', '#4FE3C1',
  0, 0, 0, 0,
  0, 0, 0, 0,
  0, 0, 0,
  0, 0, 0, 0,
  0, 0, 0,
  5, 'today', 'Onboarding', 'Onboarding',
  ARRAY['Bathroom tiling', 'Natural stone', 'Wet rooms'],
  ARRAY[0, 0, 0, 0, 0],
  ARRAY['meta', 'gbp'],
  '{"why": "20 years on the tools, obsessive about a clean grout line — does the jobs cowboys won''t touch.", "ideal": "Full bathroom & wet-room renovations for homeowners who care about finish, €6k+ jobs.", "vibe": "Premium & clean", "competitor": "Clare Tile Co"}',
  true,
  ARRAY['k1', 'k2'],
  '2 days ago'
),

-- 2. Murphy & Sons Plumbing
(
  'murphy-plumbing',
  'Murphy & Sons Plumbing',
  'murphyplumbing.ie',
  'Galway',
  'Plumbing',
  'Domination',
  998,
  'Jan 2026',
  142, 92,
  'Liam Murphy', 'M', '#3FE0A8',
  47, 0.32, 31, 0.18,
  28400, 0.21, 6.4, 2,
  187, 4.9, 22,
  2400, 8120, 0.41, 4.2,
  2840, 1620, 0,
  3, '2h ago', 'Weekly call · Thu', NULL,
  ARRAY['Emergency callouts', 'Boiler install', 'Bathroom fitouts'],
  ARRAY[12, 14, 11, 18, 21, 19, 24, 22, 26, 29, 31, 35, 38, 41, 47],
  ARRAY['meta', 'google_ads', 'ga4', 'gbp', 'website', 'whatsapp', 'calendar'],
  '{"why": "Family business, Liam and his two sons. Built reputation on never missing an emergency callout — 60-min response in Galway city.", "ideal": "Homeowners needing emergency plumbing, boiler installs, and full bathroom fitouts. €1k–€8k jobs.", "vibe": "Trusted & reliable", "competitor": "Connacht Plumbing"}',
  false,
  ARRAY[]::text[],
  NULL
),

-- 3. Coastal Roofing Ltd
(
  'coastal-roofing',
  'Coastal Roofing Ltd',
  'coastalroofing.ie',
  'Cork',
  'Roofing',
  'Domination',
  998,
  'Nov 2025',
  198, 88,
  'Declan Walsh', 'C', '#CFFF3A',
  39, 0.12, 22, 0.04,
  41200, 0.09, 5.1, 0,
  96, 4.8, 11,
  3100, 5240, 0.18, 5.8,
  1840, 2210, 410,
  1, 'yesterday', 'Content batch · Mon', NULL,
  ARRAY['Slate roofing', 'Flat roofs', 'Gutter repair'],
  ARRAY[22, 26, 24, 28, 31, 29, 33, 30, 34, 32, 35, 38, 36, 39, 39],
  ARRAY['meta', 'google_ads', 'ga4', 'gbp', 'website', 'stripe', 'whatsapp'],
  '{"why": "20+ years doing proper slate and heritage work — won''t touch cheap felt jobs.", "ideal": "Homeowners and property managers needing quality slate roofing, flat roofs, guttering. €3k–€25k jobs in Cork and surrounds.", "vibe": "Quality & heritage", "competitor": "Cork Roofing Solutions"}',
  false,
  ARRAY[]::text[],
  NULL
),

-- 4. Kelly Auto Detailing
(
  'kelly-detailing',
  'Kelly Auto Detailing',
  'kellydetailing.ie',
  'Dublin',
  'Auto Detailing',
  'Growth',
  698,
  'Mar 2026',
  78, 71,
  'Aoife Kelly', 'K', '#FFB547',
  84, 0.58, 51, 0.44,
  16800, 0.39, 4.2, 5,
  64, 4.7, 18,
  1800, 11200, 0.62, 3.1,
  6210, 980, 14200,
  6, '3d ago', 'Ads review · today', 'Needs ad approval',
  ARRAY['Full detail', 'Ceramic coating', 'Headlight restoration'],
  ARRAY[18, 22, 31, 28, 36, 42, 48, 51, 58, 63, 68, 72, 76, 80, 84],
  ARRAY['meta', 'ga4', 'gbp', 'website', 'whatsapp', 'calendar'],
  '{"why": "Aoife turned a passion for cars into a thriving business — known for ceramic coating and TikTok-worthy results.", "ideal": "Car enthusiasts and professionals wanting premium detailing and ceramic protection. €150–€2k jobs.", "vibe": "Premium & visual", "competitor": "Dublin Auto Spa"}',
  false,
  ARRAY[]::text[],
  NULL
),

-- 5. Burke Landscaping
(
  'burke-landscaping',
  'Burke Landscaping',
  'burkelandscapes.ie',
  'Limerick',
  'Landscaping',
  'Growth',
  698,
  'Feb 2026',
  102, 84,
  'Seán Burke', 'B', '#4FE3C1',
  28, 0.08, 19, 0.11,
  22600, 0.14, 5.8, 1,
  41, 4.9, 8,
  1200, 3210, 0.09, 4.8,
  1240, 760, 0,
  2, '5h ago', 'Review request batch', NULL,
  ARRAY['Garden design', 'Turf laying', 'Maintenance'],
  ARRAY[18, 19, 22, 20, 24, 23, 26, 24, 27, 25, 28, 26, 29, 27, 28],
  ARRAY['meta', 'ga4', 'gbp', 'website', 'stripe', 'whatsapp'],
  '{"why": "Seán has a design eye that sets him apart — clients come back every season for maintenance.", "ideal": "Homeowners in Limerick and surrounds wanting garden design, landscaping, and ongoing maintenance. €2k–€15k projects.", "vibe": "Natural & dependable", "competitor": "Limerick Garden Centre"}',
  false,
  ARRAY[]::text[],
  NULL
),

-- 6. Boyne Valley Joinery
(
  'boyne-joinery',
  'Boyne Valley Joinery',
  'boynejoinery.ie',
  'Drogheda',
  'Joinery',
  'Starter',
  0,
  'Apr 2026',
  41, 64,
  'Tomás Reilly', 'B', '#8B7CFF',
  14, -0.04, 9, 0.02,
  11400, 0.06, 3.8, 3,
  22, 4.6, 4,
  600, 1840, -0.02, 3.4,
  480, 320, 0,
  4, '6d ago', 'Upsell call · Wed', 'Upsell opportunity',
  ARRAY['Bespoke kitchens', 'Staircases', 'Wardrobes'],
  ARRAY[8, 9, 10, 10, 11, 10, 12, 11, 12, 13, 12, 14, 13, 14, 14],
  ARRAY['gbp', 'website'],
  '{"why": "Tomás is a master craftsman — every piece is bespoke and hand-fitted. Word-of-mouth mostly.", "ideal": "Homeowners building or renovating who want custom kitchens, staircases, and fitted wardrobes. €5k–€40k projects.", "vibe": "Craftsmanship & tradition", "competitor": "Navan Kitchens"}',
  false,
  ARRAY[]::text[],
  NULL
),

-- 7. O'Sullivan Electrical
(
  'osullivan-electrical',
  'O''Sullivan Electrical',
  'osullivanelectric.ie',
  'Waterford',
  'Electrical',
  'Domination',
  998,
  'Sep 2025',
  248, 95,
  'Mick O''Sullivan', 'O', '#FF7A8A',
  61, 0.22, 44, 0.19,
  38200, 0.16, 7.2, 0,
  312, 4.95, 28,
  2200, 9420, 0.24, 5.4,
  1980, 3400, 0,
  0, 'today', 'QBR · next Tue', 'Top performer',
  ARRAY['EV chargers', 'Rewiring', 'Commercial fitouts'],
  ARRAY[28, 32, 30, 35, 38, 40, 42, 45, 48, 50, 52, 55, 57, 59, 61],
  ARRAY['meta', 'google_ads', 'ga4', 'gbp', 'website', 'stripe', 'whatsapp', 'calendar'],
  '{"why": "Mick has built a team of 6 — Waterford''s go-to for EV charger installs and commercial rewiring.", "ideal": "Homeowners needing EV chargers, full rewires, and businesses wanting commercial fitouts. €500–€30k jobs.", "vibe": "Professional & future-focused", "competitor": "Waterford Electrics"}',
  false,
  ARRAY[]::text[],
  NULL
),

-- 8. Atlantic Dental Clinic
(
  'atlantic-dental',
  'Atlantic Dental Clinic',
  'atlanticdental.ie',
  'Sligo',
  'Dental',
  'Domination',
  998,
  'Dec 2025',
  168, 81,
  'Dr. Niamh O''Connor', 'A', '#5BCEFA',
  52, 0.14, 38, 0.21,
  47800, 0.12, 5.6, 1,
  142, 4.85, 14,
  2800, 6420, 0.07, 5.1,
  3210, 1820, 0,
  2, '1d ago', 'Campaign launch · Fri', NULL,
  ARRAY['Invisalign', 'Implants', 'Hygiene'],
  ARRAY[30, 33, 35, 38, 36, 40, 42, 44, 43, 46, 48, 49, 50, 51, 52],
  ARRAY['meta', 'google_ads', 'ga4', 'gbp', 'website', 'stripe', 'whatsapp', 'calendar'],
  '{"why": "Dr. O''Connor built Atlantic Dental from scratch — private practice focused on cosmetic and restorative work.", "ideal": "Adults in Sligo and Donegal seeking Invisalign, dental implants, and hygiene. €200–€8k treatments.", "vibe": "Clinical & trustworthy", "competitor": "Sligo Dental Clinic"}',
  false,
  ARRAY[]::text[],
  NULL
),

-- 9. Greenway Fitness
(
  'greenway-fitness',
  'Greenway Fitness',
  'greenwayfit.ie',
  'Kildare',
  'Fitness Studio',
  'Growth',
  698,
  'Feb 2026',
  108, 58,
  'Conor Doyle', 'G', '#FF6B5C',
  22, -0.18, 11, -0.24,
  7400, -0.12, 2.4, 7,
  38, 4.5, 2,
  1400, 4210, -0.08, 2.1,
  1820, 410, 980,
  8, '8d ago', 'Retention call · today', 'At risk',
  ARRAY['6-week challenge', 'Personal training', 'Group classes'],
  ARRAY[28, 26, 24, 22, 18, 16, 18, 16, 20, 18, 22, 20, 24, 22, 22],
  ARRAY['meta', 'ga4', 'gbp', 'website', 'whatsapp'],
  '{"why": "Conor built Greenway around his 6-week body-transformation challenge — strong in person, struggling online.", "ideal": "Adults in Kildare and Naas wanting structured fitness programmes, personal training, and group classes. €50–€600/mo.", "vibe": "Energetic & results-driven", "competitor": "FLYEfit Naas"}',
  false,
  ARRAY[]::text[],
  NULL
),

-- 10. Riverside Café
(
  'riverside-cafe',
  'Riverside Café',
  'riversidecafe.ie',
  'Kilkenny',
  'Hospitality',
  'Growth',
  698,
  'Mar 2026',
  84, 78,
  'Orla Hennessy', 'R', '#FFD66B',
  38, 0.28, 0, 0,
  18900, 0.18, 0, 0,
  218, 4.7, 32,
  800, 7820, 0.34, 0,
  8420, 2240, 4120,
  2, 'today', 'Content batch · Thu', NULL,
  ARRAY['Brunch', 'Events', 'Private hire'],
  ARRAY[18, 20, 22, 24, 24, 26, 28, 28, 30, 32, 32, 34, 36, 36, 38],
  ARRAY['meta', 'ga4', 'gbp', 'website', 'whatsapp'],
  '{"why": "Orla created a destination brunch spot on the Nore — Instagram-first and known for seasonal menus and private events.", "ideal": "Kilkenny locals and visitors wanting brunch, private hire, and event catering. €20–€3k per booking.", "vibe": "Warm & inviting", "competitor": "Kilkenny Design Centre Café"}',
  false,
  ARRAY[]::text[],
  NULL
);


-- ─── Integrations (default set per client) ────────────────────────────────────

INSERT INTO integrations (client_id, provider, is_connected, connected_at)
SELECT c.id, p.provider, p.is_connected, CASE WHEN p.is_connected THEN now() - (random() * interval '60 days') ELSE NULL END
FROM clients c
CROSS JOIN (VALUES
  ('meta',        true),
  ('google_ads',  true),
  ('ga4',         true),
  ('gbp',         true),
  ('website',     true),
  ('stripe',      true),
  ('whatsapp',    true),
  ('calendar',    true)
) AS p(provider, is_connected)
ON CONFLICT (client_id, provider) DO NOTHING;


-- ─── Tasks ────────────────────────────────────────────────────────────────────

INSERT INTO tasks (id, title, status, priority, category, client_id, assignee, due_date) VALUES
  ('00000000-0000-0000-0000-000000000001', 'Approve Q4 ad creative — Kelly Detailing',     'doing', 'P0', 'Ads',        'kelly-detailing',     'Bartek', 'Today'),
  ('00000000-0000-0000-0000-000000000002', 'Greenway Fitness retention call',               'todo',  'P0', 'Account',    'greenway-fitness',    'Bartek', 'Today'),
  ('00000000-0000-0000-0000-000000000003', 'Publish weekly content batch — Coastal Roofing','todo',  'P1', 'Content',    'coastal-roofing',     'Niamh',  'Mon'),
  ('00000000-0000-0000-0000-000000000004', 'Launch Invisalign campaign — Atlantic Dental',  'doing', 'P0', 'Ads',        'atlantic-dental',     'Bartek', 'Fri'),
  ('00000000-0000-0000-0000-000000000005', 'Boyne Joinery — upsell to Growth tier',         'todo',  'P1', 'Sales',      'boyne-joinery',       'Bartek', 'Wed'),
  ('00000000-0000-0000-0000-000000000006', 'Weekly call · Murphy Plumbing',                 'todo',  'P2', 'Account',    'murphy-plumbing',     'Bartek', 'Thu'),
  ('00000000-0000-0000-0000-000000000007', 'Send review-request batch — Burke Landscaping', 'todo',  'P2', 'Reputation', 'burke-landscaping',   'Auto',   'Tue'),
  ('00000000-0000-0000-0000-000000000008', 'QBR deck — O''Sullivan Electrical',             'todo',  'P1', 'Account',    'osullivan-electrical','Bartek', 'Next Tue'),
  ('00000000-0000-0000-0000-000000000009', 'Riverside Café — Christmas menu landing page',  'doing', 'P2', 'Web',        'riverside-cafe',      'Niamh',  'Thu'),
  ('00000000-0000-0000-0000-000000000010', 'New starter onboarding video v2',               'todo',  'P2', 'Internal',   NULL,                  'Bartek', 'Fri'),
  ('00000000-0000-0000-0000-000000000011', 'Audit competitor — Greenway Fitness',           'todo',  'P0', 'Strategy',   'greenway-fitness',    'Bartek', 'Today'),
  ('00000000-0000-0000-0000-000000000012', 'Reply to Murphy 5★ reviews (8)',               'doing', 'P2', 'Reputation', 'murphy-plumbing',     'Auto',   'Today');


-- ─── Objectives ───────────────────────────────────────────────────────────────

INSERT INTO objectives (id, title, owner, current_value, target_value, progress, progress_mode, key_results) VALUES
(
  '00000000-0000-0000-0001-000000000001',
  'Grow MRR to €15k/mo by end of Q3',
  'Bartek',
  7800, 15000, 0.72, 'krs',
  '[
    {
      "kr": "Grow total MRR to €15k/mo",
      "measure": "metric",
      "metric": "mrr",
      "start_num": 3000,
      "target_num": 15000,
      "task_ids": [],
      "checkpoints": [{"at": "2 weeks ago", "value": "€5.8k", "note": "Closed O''Sullivan on Domination — big jump."}]
    },
    {
      "kr": "Upsell 3 Growth → Domination",
      "measure": "tasks",
      "task_ids": ["00000000-0000-0000-0000-000000000005", "00000000-0000-0000-0000-000000000008"],
      "current": "1",
      "target": "3",
      "checkpoints": []
    },
    {
      "kr": "Reduce churn below 3%",
      "measure": "manual",
      "progress": 1.0,
      "current": "2.1%",
      "target": "<3%",
      "checkpoints": []
    }
  ]'::jsonb
),
(
  '00000000-0000-0000-0001-000000000002',
  'Every client live & ranking inside 14 days',
  'Bartek',
  81, 100, 0.81, 'krs',
  '[
    {"kr": "Average launch time < 7 days", "measure": "manual", "progress": 0.9, "current": "6.2d", "target": "<7d"},
    {"kr": "Day-14 leads landing for 100% clients", "measure": "manual", "progress": 0.78, "current": "7/9", "target": "9/9"},
    {"kr": "Onboarding NPS > 60", "measure": "manual", "progress": 0.94, "current": "72", "target": ">60"}
  ]'::jsonb
),
(
  '00000000-0000-0000-0001-000000000003',
  'Build out the Command Centre to replace Notion',
  'Bartek',
  45, 100, 0.45, 'krs',
  '[
    {"kr": "Migrate all 9 clients off Notion", "measure": "manual", "progress": 0.55, "current": "5/9", "target": "9/9"},
    {"kr": "Ship master databases (Resources, Pages)", "measure": "manual", "progress": 0.6, "current": "2/3", "target": "3/3"},
    {"kr": "Integrations live: Meta, Google, Stripe", "measure": "manual", "progress": 0.33, "current": "1/3", "target": "3/3"}
  ]'::jsonb
);

-- Link tasks to objectives
UPDATE tasks SET objective_id = '00000000-0000-0000-0001-000000000001'
WHERE id IN ('00000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000008');

UPDATE tasks SET objective_id = '00000000-0000-0000-0001-000000000002'
WHERE id IN ('00000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000011');


-- ─── Pages ────────────────────────────────────────────────────────────────────

INSERT INTO pages (id, title, icon, tags, content_blocks) VALUES
(
  '00000000-0000-0000-0002-000000000001',
  'BizBoost Cold Call Script',
  '📞',
  ARRAY['Sales', 'Script'],
  '[
    {"id": "b1", "type": "h1", "content": "BizBoost Cold Call Script"},
    {"id": "b2", "type": "callout", "content": "Up tone, fast pace — project energy and confidence from the first word."},
    {"id": "b3", "type": "h2", "content": "INTRO"},
    {"id": "b4", "type": "paragraph", "content": "Hi [Name], it''s Bartek from BizBoost — how''s everything going today?"},
    {"id": "b5", "type": "paragraph", "content": "I can see you''ve got great reviews and people love the service. Quick question — could you handle an extra 5 clients a month, or would that be too much?"},
    {"id": "b6", "type": "paragraph", "content": "We''re Ireland''s leading full-scale agency and we''re finalising our last partnership spots for the year — taking just one [niche] business in [area]."},
    {"id": "b7", "type": "h2", "content": "QUALIFY"},
    {"id": "b8", "type": "bullet", "content": "What does your current process for getting clients look like?"},
    {"id": "b9", "type": "bullet", "content": "When you get your perfect job, what does that look like?"},
    {"id": "b10", "type": "bullet", "content": "What''s the biggest thing slowing your growth?"},
    {"id": "b11", "type": "h2", "content": "HOW IT WORKS"},
    {"id": "b12", "type": "paragraph", "content": "Step 1: your own dashboard — the command centre for your business. Every lead, review, missed call and booking in real time, a lot of it handled automatically."},
    {"id": "b13", "type": "h2", "content": "CLOSE"},
    {"id": "b14", "type": "paragraph", "content": "Let me lock you in for 30 minutes this week where I show you exactly what I''d build for you."}
  ]'::jsonb
),
(
  '00000000-0000-0000-0002-000000000002',
  'Website Launch SOP',
  '🛠',
  ARRAY['Ops', 'SOP'],
  '[
    {"id": "b1", "type": "h1", "content": "Website Launch SOP"},
    {"id": "b2", "type": "h2", "content": "Pre-Launch Checklist"},
    {"id": "b3", "type": "todo", "content": "Domain connected + SSL live", "checked": false},
    {"id": "b4", "type": "todo", "content": "Mobile pass (all breakpoints)", "checked": false},
    {"id": "b5", "type": "todo", "content": "Booking widget tested end-to-end", "checked": false},
    {"id": "b6", "type": "todo", "content": "Missed-call text-back wired", "checked": false},
    {"id": "b7", "type": "todo", "content": "GA4 + Pixel firing", "checked": false},
    {"id": "b8", "type": "todo", "content": "Google Business Profile linked", "checked": false},
    {"id": "b9", "type": "todo", "content": "Reviews widget pulling live", "checked": false},
    {"id": "b10", "type": "todo", "content": "Page speed > 90", "checked": false},
    {"id": "b11", "type": "h2", "content": "Launch Day"},
    {"id": "b12", "type": "todo", "content": "DNS flip + cache clear", "checked": false},
    {"id": "b13", "type": "todo", "content": "Submit sitemap", "checked": false},
    {"id": "b14", "type": "todo", "content": "Test every form → lead lands", "checked": false},
    {"id": "b15", "type": "todo", "content": "Confirm client login works", "checked": false},
    {"id": "b16", "type": "h2", "content": "Post-Launch"},
    {"id": "b17", "type": "todo", "content": "Day-7 performance check", "checked": false},
    {"id": "b18", "type": "todo", "content": "First review-request batch sent", "checked": false}
  ]'::jsonb
),
(
  '00000000-0000-0000-0002-000000000003',
  'How BizBoost Actually Works',
  '📘',
  ARRAY['Wiki'],
  '[
    {"id": "b1", "type": "h1", "content": "How BizBoost Actually Works"},
    {"id": "b2", "type": "paragraph", "content": "BizBoost is a full-stack growth agency for Irish SMBs. We handle everything from lead generation and paid ads to reputation management and automation."},
    {"id": "b3", "type": "h2", "content": "The Three Pillars"},
    {"id": "b4", "type": "bullet", "content": "Attract — paid ads, SEO, social content"},
    {"id": "b5", "type": "bullet", "content": "Convert — website, booking system, missed-call handling"},
    {"id": "b6", "type": "bullet", "content": "Retain — reviews, email/SMS, reporting dashboard"},
    {"id": "b7", "type": "h2", "content": "Plans"},
    {"id": "b8", "type": "bullet", "content": "Starter — free tier, dashboard access only"},
    {"id": "b9", "type": "bullet", "content": "Growth — €698/mo, ads + content + automation"},
    {"id": "b10", "type": "bullet", "content": "Domination — €998/mo, full stack, priority support"}
  ]'::jsonb
),
(
  '00000000-0000-0000-0002-000000000004',
  'Pricing & Guarantees',
  '💷',
  ARRAY['Sales'],
  '[
    {"id": "b1", "type": "h1", "content": "Pricing & Guarantees"},
    {"id": "b2", "type": "h2", "content": "Plans & Pricing"},
    {"id": "b3", "type": "bullet", "content": "Starter — Free | Dashboard access, GBP setup, 1 automation"},
    {"id": "b4", "type": "bullet", "content": "Growth — €698/mo | Everything in Starter + Meta ads, content, reviews"},
    {"id": "b5", "type": "bullet", "content": "Domination — €998/mo | Full stack — ads, SEO, content, automation, priority support"},
    {"id": "b6", "type": "h2", "content": "Our Guarantee"},
    {"id": "b7", "type": "callout", "content": "If you don''t get leads in the first 14 days, we work free until you do."},
    {"id": "b8", "type": "paragraph", "content": "No long-term contracts. Month-to-month after the initial 3-month onboarding period."}
  ]'::jsonb
);


-- ─── Resources ────────────────────────────────────────────────────────────────

INSERT INTO resources (id, title, type, tag, body) VALUES
(
  '00000000-0000-0000-0003-000000000001',
  'Cold-call script · master v4.2',
  'Script', 'Sales',
  'INTRO (up tone, fast pace)
Hi [Name], it''s Bartek from BizBoost — how''s everything going today?

I can see you''ve got great reviews and people love the service. Quick question — could you handle an extra 5 clients a month, or would that be too much?

We''re Ireland''s leading full-scale agency and we''re finalising our last partnership spots for the year — taking just one [niche] business in [area].

QUALIFY
- What does your current process for getting clients look like?
- When you get your perfect job, what does that look like?
- What''s the biggest thing slowing your growth?

HOW IT WORKS
Step 1: your own dashboard — the command centre for your business. Every lead, review, missed call and booking in real time, a lot of it handled automatically.

CLOSE
Let me lock you in for 30 minutes this week where I show you exactly what I''d build for you.'
),
(
  '00000000-0000-0000-0003-000000000002',
  'Meta ad creative — plumbing pack',
  'Creative', 'Ads',
  'Plumbing creative pack — 6 angles that consistently win:

1. Emergency / urgency — "Burst pipe? We''re there in 60 mins."
2. Trust / reviews — hero the 5★ count + a real testimonial.
3. Before/after — leak → fixed, clean job photo.
4. Offer — "Free callout this week only."
5. Local — "Galway''s most-booked plumber."
6. Guarantee — "Done right or we come back free."

Format: 1:1 + 9:16. Bold caption top-third, logo bottom-right, CTA "Book in 30 seconds".'
),
(
  '00000000-0000-0000-0003-000000000003',
  'Website launch checklist',
  'SOP', 'Ops',
  'Pre-launch:
- Domain connected + SSL live
- Mobile pass (all breakpoints)
- Booking widget tested end-to-end
- Missed-call text-back wired
- GA4 + Pixel firing
- Google Business Profile linked
- Reviews widget pulling live
- Page speed > 90

Launch day:
- DNS flip + cache clear
- Submit sitemap
- Test every form → lead lands
- Confirm client login works

Post-launch:
- Day-7 performance check
- First review-request batch sent'
),
(
  '00000000-0000-0000-0003-000000000004',
  'Onboarding email sequence',
  'Sequence', 'Ops',
  'Email 1 (Day 0 — Welcome): Subject: Welcome to BizBoost — your command centre is live
Body: Here''s your login, here''s what happens next, here''s your onboarding call link.

Email 2 (Day 3 — Progress): Subject: First 3 days — here''s what we''ve built
Body: GBP optimised, pixel installed, first ad live. Here''s a screenshot of your dashboard.

Email 3 (Day 7 — First leads): Subject: Your first leads are coming in
Body: Screenshot of leads in dashboard. How to respond. Review request automation is armed.

Email 4 (Day 14 — Check-in): Subject: 2 weeks in — results so far
Body: Leads, bookings, ad spend summary. What''s coming next month.'
),
(
  '00000000-0000-0000-0003-000000000005',
  'Objection handling cheat sheet',
  'Doc', 'Sales',
  '"I already have someone doing my marketing"
→ Great, that means you know the value. What results are you getting? [listen] Most of our clients come to us after being burned by agencies that ran ads but never tracked leads. We show you every euro in, every lead out.

"It''s too expensive"
→ What''s one job worth to you? [€X] Our average client gets 15–20 new jobs per month. At €X each, that''s [€Y/mo]. Our fee is €698–€998. The maths works.

"I''ll think about it"
→ Totally understand. One question — what would need to be true for this to be a yes? [handle specific objection] How about we book a 15-minute call next week and I show you what I''d specifically build for [business name]?

"I don''t have time"
→ That''s exactly why you need us. You focus on the work, we bring you the customers. The whole system is automated.'
),
(
  '00000000-0000-0000-0003-000000000006',
  'Review-request SMS templates',
  'Templates', 'Reputation',
  'Template 1 (post-job, same day):
"Hi [Name], brilliant having you as a customer today! If you''re happy with the work, a quick Google review would mean the world to us — takes 30 seconds: [link] Thanks, [Business]"

Template 2 (follow-up, 48h later):
"Hi [Name], just following up — did everything go well with the [service]? If you have a moment, a Google review really helps us: [link] Thanks again!"

Template 3 (review reply prompt):
"Great news — [Name] left you a 5★ review! Click to reply and thank them: [link]"

Notes:
- Send within 2 hours of job completion for best conversion
- Personalise with job type where possible
- 41% conversion rate achieved for Riverside Café with template 1'
);


-- ─── Agents ───────────────────────────────────────────────────────────────────

INSERT INTO agents (id, name, role, type, tools, capabilities, status, avatar, is_active) VALUES
(
  '00000000-0000-0000-0004-000000000001',
  'Research Agent',
  'Lead researcher',
  'ai',
  ARRAY['web_search', 'google_maps', 'screenshot', 'data_extract'],
  'Researches potential leads — finds Google review count, rating, website quality, social presence, estimated ad spend. Outputs structured prospect profile ready for outreach.',
  'idle',
  '🔍',
  true
),
(
  '00000000-0000-0000-0004-000000000002',
  'Content Agent',
  'Social content writer',
  'ai',
  ARRAY['write', 'image_prompt', 'schedule', 'publish'],
  'Writes and schedules social content for client accounts. Given a brief and brand voice, produces Facebook + Instagram captions, TikTok hooks, and Google post copy.',
  'idle',
  '✍️',
  true
),
(
  '00000000-0000-0000-0004-000000000003',
  'Outreach Agent',
  'Automated outreach',
  'ai',
  ARRAY['telegram', 'sms', 'email', 'crm_update'],
  'Sends personalised intro messages to new leads via Telegram and SMS. Monitors replies and updates lead status. Escalates hot leads to human.',
  'idle',
  '📤',
  true
),
(
  '00000000-0000-0000-0004-000000000004',
  'Reputation Agent',
  'Review manager',
  'ai',
  ARRAY['gbp_api', 'review_monitor', 'sms', 'email'],
  'Monitors Google Business Profile for new reviews. Sends review-request SMS after confirmed jobs. Drafts reply suggestions for negative reviews.',
  'idle',
  '⭐',
  true
);


-- ─── Activity Feed (sample) ───────────────────────────────────────────────────

INSERT INTO activity_feed (type, client_id, message, metadata, created_at) VALUES
  ('lead',    'murphy-plumbing',     'New lead — emergency boiler, Salthill',                '{"source": "google_ads"}',        now() - interval '2 minutes'),
  ('review',  'osullivan-electrical','★★★★★ review left by Sarah O''Brien',                  '{"rating": 5, "platform": "gbp"}',now() - interval '8 minutes'),
  ('booking', 'kelly-detailing',     'Booking confirmed — Ceramic coating · Sat',            '{"service": "Ceramic coating"}',  now() - interval '14 minutes'),
  ('ad',      'atlantic-dental',     'Ad set ''Invisalign-Sligo'' hit 4.2 ROAS',             '{"roas": 4.2}',                   now() - interval '23 minutes'),
  ('missed',  'greenway-fitness',    'Missed call auto-replied — booking pending',           '{"auto_replied": true}',          now() - interval '41 minutes'),
  ('lead',    'coastal-roofing',     'New lead — slate roof, Bandon',                        '{"source": "meta"}',              now() - interval '1 hour'),
  ('review',  'riverside-cafe',      '★★★★★ Google review (32 this month)',                  '{"rating": 5, "count_mtd": 32}',  now() - interval '1 hour'),
  ('booking', 'burke-landscaping',   'Site survey booked — Castletroy',                      '{"type": "survey"}',              now() - interval '2 hours'),
  ('ai',      NULL,                  'AI: Greenway ad spend pacing 14% under target',        '{"alert": true}',                 now() - interval '3 hours'),
  ('lead',    'kelly-detailing',     'New lead — full detail, Stillorgan',                   '{"source": "tiktok"}',            now() - interval '4 hours');


-- ─── Marketing Data (6-month sample for key clients) ─────────────────────────

INSERT INTO marketing_data (client_id, date, leads, spend, revenue, roas)
SELECT
  c.id,
  (now() - (s.n || ' months')::interval)::date as date,
  CASE c.id
    WHEN 'murphy-plumbing'     THEN (35 + s.n * 2)::integer
    WHEN 'coastal-roofing'     THEN (30 + s.n)::integer
    WHEN 'osullivan-electrical'THEN (45 + s.n * 3)::integer
    WHEN 'atlantic-dental'     THEN (40 + s.n * 2)::integer
    ELSE (20 + s.n)::integer
  END,
  CASE c.id
    WHEN 'murphy-plumbing'     THEN 2400 - s.n * 50
    WHEN 'coastal-roofing'     THEN 3100 - s.n * 80
    WHEN 'osullivan-electrical'THEN 2200 - s.n * 40
    WHEN 'atlantic-dental'     THEN 2800 - s.n * 60
    ELSE 1200 - s.n * 30
  END,
  CASE c.id
    WHEN 'murphy-plumbing'     THEN (22000 + s.n * 1200)
    WHEN 'coastal-roofing'     THEN (35000 + s.n * 1500)
    WHEN 'osullivan-electrical'THEN (30000 + s.n * 1800)
    WHEN 'atlantic-dental'     THEN (38000 + s.n * 2000)
    ELSE (10000 + s.n * 500)
  END,
  CASE c.id
    WHEN 'murphy-plumbing'     THEN 6.4 - s.n * 0.1
    WHEN 'coastal-roofing'     THEN 5.1 - s.n * 0.08
    WHEN 'osullivan-electrical'THEN 7.2 - s.n * 0.12
    WHEN 'atlantic-dental'     THEN 5.6 - s.n * 0.09
    ELSE 3.8 - s.n * 0.05
  END
FROM clients c
CROSS JOIN generate_series(0, 5) AS s(n)
WHERE c.id IN ('murphy-plumbing', 'coastal-roofing', 'osullivan-electrical', 'atlantic-dental', 'burke-landscaping');
