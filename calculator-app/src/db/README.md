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

## Supabase setup (beat 1 of storage unification)

Two env vars light up the central store and the live bill feed; without
them the app runs on localStorage + sample bills, unchanged.

1. **Flagship project** (user artifacts — reforms + reports):
   Supabase dashboard → New project (PolicyEngine org) → Settings →
   Database → "Connection string" (transaction pooler). Set as:

   ```
   DATABASE_URL=postgresql://...pooler.supabase.com:6543/postgres
   ```

   Then run migrations: `bun run db:migrate` (from calculator-app/).

2. **Tracker feed** (read-only bills from the state legislative
   tracker's project): its Settings → API → anon public key.

   ```
   NEXT_PUBLIC_TRACKER_SUPABASE_URL=https://ffgngqlgfsvqartilful.supabase.co
   NEXT_PUBLIC_TRACKER_SUPABASE_ANON_KEY=<anon key>
   ```

Set all three in `.env.local` for dev and `vercel env add` for the
deployment. Beat 2 (at native-tracker cutover) repoints the tracker
pipeline's writes into the flagship project and retires the dual
source — the seam is `app/src/api/billFeed.ts`.
