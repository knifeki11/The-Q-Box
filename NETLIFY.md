# Deploying Q-BOX to Netlify

## 1. Connect the repo

- In Netlify: **Add new site** → **Import an existing project** → choose your Git provider and the **The-Q-Box** repo.
- Branch to deploy: **main**.

## 2. Build settings (optional)

Netlify detects Next.js and sets these for you. The repo includes a `netlify.toml` that sets:

- **Build command:** `npm run build`
- **Publish directory:** `.next`
- **Node version:** 20

You can leave the Netlify UI defaults as-is; `netlify.toml` is used when present.

## 3. Environment variables (required)

In Netlify: **Site configuration** → **Environment variables** → **Add a variable** / **Import from .env**.

Add the same variables you use locally (from `.env`), at least:

| Variable                     | Description                    | Scopes   |
|-----------------------------|--------------------------------|----------|
| `NEXT_PUBLIC_SUPABASE_URL`   | Supabase project URL           | All      |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon (public) key  | All      |
| `SUPABASE_SERVICE_ROLE_KEY`  | Supabase service role key (secret) | Build & deploy |

- **Build & deploy** scope is enough for these so the build and server can use them.
- Do **not** commit `.env`; only set these in the Netlify UI (or via “Import from .env” without committing the file).

## 4. Deploy

- Push to **main** to trigger a new deploy.
- First deploy may take a few minutes. Check **Deploys** and the build log for errors.

## 5. If the build fails

- **“Module not found” or similar:** Ensure **Build command** is `npm run build` and **Node version** is 20 (or 18).
- **Supabase / auth errors at runtime:** Confirm all three env vars above are set in Netlify and that **Supabase** allows the Netlify site URL in **Authentication** → **URL configuration** (e.g. `https://your-site.netlify.app`).
