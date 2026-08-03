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
