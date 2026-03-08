# CS Shift Tracker — Setup Guide

Follow these steps once to get the app live for your whole team.

---

## Step 1 — Create a Supabase project (free)

1. Go to https://supabase.com and sign up / log in
2. Click **New Project**, give it a name (e.g. `shift-tracker`), set a password, choose a region close to you
3. Wait ~2 minutes for it to be ready

---

## Step 2 — Create the database table

1. In your Supabase project, click **SQL Editor** in the left sidebar
2. Paste the following SQL and click **Run**:

```sql
create table schedules (
  id          uuid default gen_random_uuid() primary key,
  start_date  text,
  end_date    text,
  assignments jsonb,
  is_active   boolean default false,
  created_at  timestamp with time zone default now()
);

alter table schedules enable row level security;

create policy "Public read"   on schedules for select using (true);
create policy "Public insert" on schedules for insert with check (true);
create policy "Public update" on schedules for update using (true);
```

---

## Step 3 — Get your Supabase keys

1. In your Supabase project, go to **Settings → API**
2. Copy your **Project URL** (looks like `https://xyzxyz.supabase.co`)
3. Copy your **anon / public** key (the long string under "Project API keys")

---

## Step 4 — Push the project to GitHub

1. Create a new **empty** repository on https://github.com (no README, no .gitignore)
2. Open a terminal in the `shift-tracker` folder and run:

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
git branch -M main
git push -u origin main
```

---

## Step 5 — Deploy to Vercel

1. Go to https://vercel.com and log in
2. Click **Add New → Project**
3. Import your GitHub repository
4. Under **Environment Variables**, add these three:

| Name                    | Value                                  |
|-------------------------|----------------------------------------|
| `VITE_SUPABASE_URL`     | Your Supabase Project URL              |
| `VITE_SUPABASE_ANON_KEY`| Your Supabase anon key                 |
| `VITE_ADMIN_PIN`        | A PIN of your choice (e.g. `7291`)     |

5. Click **Deploy** — Vercel builds and gives you a live URL

---

## Step 6 — Share with the team

- Share the Vercel URL with everyone on the team
- They open it and see the latest published schedule automatically
- You log in with your Admin PIN to generate, edit, and publish schedules
- Every time you publish, the team sees it instantly on refresh

---

## How it works day-to-day

| Who          | What they do                                                   |
|--------------|----------------------------------------------------------------|
| **Team**     | Open the link → see the current schedule → done               |
| **Admin**    | Click "Admin Login" → enter PIN → generate/edit → Publish     |

---

## Updating the app later

If you make changes to the code, just push to GitHub — Vercel redeploys automatically.

To change the admin PIN: update `VITE_ADMIN_PIN` in Vercel → Settings → Environment Variables → Redeploy.
