# Central reform database

Postgres store for the flagship app's reform objects, served by the route
handlers in `src/app/api/reforms/`. Schema is managed with Drizzle; checked-in
migrations live in `migrations/`.

## One-time provisioning (Neon via Vercel marketplace)

```bash
cd calculator-app
vercel link                      # link to the calculator Vercel project
vercel integration add neon      # provisions DB + sets DATABASE_URL
vercel env pull .env.local --yes # bring DATABASE_URL down for local dev
```

## Applying migrations

`drizzle-kit` does not auto-load `.env.local`, so source it first:

```bash
source <(grep -v '^#' .env.local | sed 's/^/export /') && bun run db:migrate
```

## Day-to-day

- Change `schema.ts`, then `bun run db:generate` to emit a new migration.
- Never edit generated SQL in `migrations/` by hand.
- Route handlers return 503 when `DATABASE_URL` is unset, so environments
  without the database (including current prod) degrade cleanly; the client
  falls back via `VITE_STORE_BACKEND=localStorage` if needed.

## Storage backend (frozen — coordinate with the storage owner)

The flagship's user-artifact storage (reforms + reports tables in this
schema) is owned by the org storage workstream. To connect it, the
owner provides a Postgres connection string from the existing shared
Supabase infrastructure:

```
DATABASE_URL=postgresql://...pooler.supabase.com:6543/postgres
```

Then run migrations from calculator-app/: `bun run db:migrate`.

Without DATABASE_URL, the app runs fully on localStorage fallbacks —
no behavior change. (A temporary `policyengine-app` project used for
beat-1 verification was deleted on 2026-08-06 to avoid parallel
infrastructure; its one-row export lives outside the repo.)

The tracker bill feed is separate (read-only, public anon key) and
stays configured:

```
NEXT_PUBLIC_TRACKER_SUPABASE_URL=https://ffgngqlgfsvqartilful.supabase.co
NEXT_PUBLIC_TRACKER_SUPABASE_ANON_KEY=<anon key>
```

The beat-2 seam (repointing bills into the unified project) is
`app/src/api/billFeed.ts`.
