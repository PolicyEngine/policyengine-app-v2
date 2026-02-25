# Integration test stack

Spin up the full local PolicyEngine stack for manual integration testing. Follow every step in order. STOP and report errors clearly at each step.

## Repo paths and branches

| Repo | Path | Branch |
|------|------|--------|
| policyengine.py | `/Users/administrator/Documents/PolicyEngine/policyengine.py` | `app-v2-migration` |
| policyengine-api-v2-alpha | `/Users/administrator/Documents/PolicyEngine/policyengine-api-v2-alpha` | `app-v2-migration` |
| policyengine-app-v2 | `/Users/administrator/Documents/PolicyEngine/policyengine-app-v2` | `move-to-api-v2` |

## Safety rules

- **NEVER push** to any remote repository
- **NEVER drop the database** without explicit user confirmation
- **ALWAYS check for uncommitted changes** before switching branches
- **ALWAYS report errors clearly** — do not silently continue past failures
- **ALWAYS report PIDs** for background processes so user can stop them

## Step 1: Pre-flight checks

Run `docker info` to verify Docker is running. If it fails, tell the user "Docker is not running. Please start Docker Desktop and try again." and **STOP immediately** — do not proceed to any other step.

## Step 2: Branch management

For **each** of the 3 repos listed above, do the following **sequentially**:

1. `cd` into the repo directory
2. Run `git status` to check for uncommitted changes
3. **If the working tree is dirty** (uncommitted changes exist), ask the user: "The repo `<name>` has uncommitted changes. Should I stash them (`git stash`) or abort?" Wait for their answer. If they say abort, STOP.
4. Run `git fetch origin`
5. Run `git checkout <branch>` (using the branch from the table above)
6. Run `git pull origin <branch>`

Report success/failure for each repo before moving to the next.

## Step 3: Install dependencies

Run these commands:

**API repo** (`policyengine-api-v2-alpha`):
```bash
cd /Users/administrator/Documents/PolicyEngine/policyengine-api-v2-alpha
uv sync
uv pip install -e /Users/administrator/Documents/PolicyEngine/policyengine.py
```

**App repo** (`policyengine-app-v2`):
```bash
cd /Users/administrator/Documents/PolicyEngine/policyengine-app-v2/app
npm install
```

## Step 4: Start Supabase

```bash
cd /Users/administrator/Documents/PolicyEngine/policyengine-api-v2-alpha
supabase start
```

Wait for Supabase to report that all services are running. This may take a minute or two on first run.

## Step 5: Database setup

**Ask the user:** "OK to drop and recreate the local database? (This deletes all local Supabase data.)"

- If **yes**: run from the API repo root:
  ```bash
  cd /Users/administrator/Documents/PolicyEngine/policyengine-api-v2-alpha
  echo "yes" | uv run python scripts/init.py --reset
  ```
- If **no**: run the idempotent version:
  ```bash
  cd /Users/administrator/Documents/PolicyEngine/policyengine-api-v2-alpha
  uv run python scripts/init.py
  ```

Then seed with the testing preset:
```bash
cd /Users/administrator/Documents/PolicyEngine/policyengine-api-v2-alpha
uv run python scripts/seed.py --preset=testing
```

Report the seed output (number of variables, parameters, etc.).

## Step 6: Start API server (background)

Run in the background from the API repo:
```bash
cd /Users/administrator/Documents/PolicyEngine/policyengine-api-v2-alpha
uv run uvicorn src.policyengine_api.main:app --host 0.0.0.0 --port 8000 --reload
```

Record the PID. Wait a few seconds and verify the server responds at `http://localhost:8000/docs`.

## Step 7: Start App dev server (background)

Run in the background from the app directory:
```bash
cd /Users/administrator/Documents/PolicyEngine/policyengine-app-v2/app
VITE_API_V2_URL=http://localhost:8000 npm run dev
```

Record the PID.

## Step 8: Report status

Print a summary like this:

```
Integration test stack is running:

  API:  http://localhost:8000      (PID: <pid>)
  Docs: http://localhost:8000/docs
  App:  http://localhost:5173      (PID: <pid>)

  Supabase Studio: http://localhost:54323

To stop:
  kill <api_pid> <app_pid>
  cd /Users/administrator/Documents/PolicyEngine/policyengine-api-v2-alpha && supabase stop
```
