# BizBoost — Go Live

Two stages. Stage 1 puts your design on a public URL in ~2 minutes.
Stage 2 turns on real admin login + client portals.

## Stage 1 — Public URL (demo mode, no login yet)

In your Vercel project → **Settings**:

1. **Build and Deployment → Root Directory** → set to `dashboard` → Save.
2. **Git → Production Branch** → set to `bizboost-command-centre` → Save.
3. **Deployment Protection** → turn **Vercel Authentication** off.

Then **Deployments → Redeploy**. You get a public URL showing the real app
with demo data. (No login required yet — that's Stage 2.)

## Stage 2 — Real logins + client portals

### A. Create a Supabase project (free) — supabase.com
Project Settings → **API**, copy:
- Project URL
- `anon` `public` key
- `service_role` key (secret)

### B. Load the database
Supabase → **SQL Editor** → paste all of `dashboard/supabase/setup.sql` → **Run**.

### C. Add env vars in Vercel (Settings → Environment Variables)
```
NEXT_PUBLIC_SUPABASE_URL=<Project URL>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon public key>
SUPABASE_SERVICE_ROLE_KEY=<service_role key>
ANTHROPIC_API_KEY=<your Claude key>   # optional, powers the AI panels
```

### D. Create YOUR admin login
Supabase → **Authentication → Users → Add user** → your email + a password →
tick "Auto confirm". (Accounts created this way are admins automatically.)

### E. Redeploy
Vercel → Deployments → Redeploy. Now:
- visiting the site → **login**
- you log in → full command centre
- each client → open them → **Portal access** → create their login + share link
- clients log in → only their own portal; they can change their password
