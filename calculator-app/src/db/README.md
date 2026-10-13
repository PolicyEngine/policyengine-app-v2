# Central reform database

Postgres store for the flagship app's reform objects and report records,
served by the route handlers in `src/app/api/reforms/` and
`src/app/api/reports/`. Schema is managed with Drizzle; checked-in migrations
live in `migrations/`.

## Ownership without sign-in

There is no sign-in yet, so the server stores no user identifier:

- Each row lives under a server-generated UUID. There is no list-by-user
  route; `GET ?ids=a,b,c` reads up to 100 rows whose ids the caller already
  knows. Reports cannot be looked up by `api_report_id`, because those ids are
  sequential.
- `POST` issues a random 256-bit edit token, returns it once as `edit_token`,
  and stores only its SHA-256 hash (`edit_token_hash`). `PATCH` and `DELETE`
  require the token in the `X-Edit-Token` header; a missing or wrong token gets 403. See `ownership.ts`.
- The browser keeps the ids it created, with their tokens, in localStorage
  (`app/src/libs/flagship/ownedItems.ts`). Lists read that index and fetch the
  rows by id. Clearing site data loses the index: the rows stay readable by id,
  but nobody can change them.
- Rows written before migration `0003_anonymous-ownership` keep their legacy
  `user_id` (never written now, never returned) and have no token hash, so
  they are read-only. No browser index holds their ids, so they also drop out
  of every list; they stay readable by id.

### Abuse limits

In code (`limits.ts`), with no client identifier:

- Request bodies over 256 KB get 413 (POST and PATCH).
- `label`, `title` and `source_note` must be strings of at most 500
  characters, or 400.
- Each table takes at most 120 new rows per minute across all visitors; a
  create over that gets 429 with `Retry-After: 60`. The client then saves that
  one item to its localStorage fallback and keeps using the central store.
  Edits are not counted.

Per-client rate limiting belongs at Vercel's edge, where the firewall keys on
the IP address and our handlers never see it. It is project configuration,
not code, so create it on the Vercel project that receives visitors' requests
for these routes. Roll it out in log mode first:

```bash
vercel firewall rules add "Flagship store writes" \
  --condition '{"type":"path","op":"pre","value":"/api/reforms"}' \
  --condition '{"type":"method","op":"inc","value":["POST","PATCH","DELETE"]}' \
  --or \
  --condition '{"type":"path","op":"pre","value":"/api/reports"}' \
  --condition '{"type":"method","op":"inc","value":["POST","PATCH","DELETE"]}' \
  --action rate_limit \
  --rate-limit-window 60 \
  --rate-limit-requests 30 \
  --rate-limit-keys ip \
  --rate-limit-action log \
  --yes
vercel firewall diff        # review, then publish from the dashboard or CLI
```

After a few days of traffic, check in the Firewall traffic view that the rule
sees distinct client addresses (not one proxy address), then switch
`--rate-limit-action` to `rate_limit` (429). Counters are per region.
(`vercel firewall` needs a recent Vercel CLI; the dashboard works too.)

### Privacy

- Rows hold no user identifier, IP address, or user agent, and the handlers
  read no request metadata other than `X-Edit-Token`. (The hosting platform's
  own request logs are outside this schema.)
- Households (income, ages, family details) are never stored here. Reforms hold
  policy parameters; report records hold a pointer to the API report and the
  policy provisions. Households stay in the browser.

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
