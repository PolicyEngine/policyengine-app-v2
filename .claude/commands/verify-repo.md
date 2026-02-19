---
description: Run verification suite for one or more repos
---

Run the verification suite for the repo(s) specified in $ARGUMENTS. If no argument is given, run verification for all three repos.

Valid arguments: `py`, `api`, `app`, or `all` (default).

**For `py` (policyengine.py):**
```bash
cd ~/Documents/PolicyEngine/policyengine.py && python -m pytest
```

**For `api` (policyengine-api-v2-alpha):**
```bash
cd ~/Documents/PolicyEngine/policyengine-api-v2-alpha && python -m pytest
```

**For `app` (policyengine-app-v2):**
Run these sequentially from the app directory:
1. `cd /Users/administrator/Documents/PolicyEngine/policyengine-app-v2/app && npx tsc --noEmit` — TypeScript type checking
2. `npm run lint` — ESLint (must pass with 0 warnings)
3. `npx prettier --check .` — Formatting check
4. `npm test` — Unit tests

**Report results** as a table:

| Check | Status | Details |
|-------|--------|---------|
| py: pytest | PASS/FAIL | X passed, Y failed |
| api: pytest | PASS/FAIL | X passed, Y failed |
| app: typecheck | PASS/FAIL | X errors |
| app: eslint | PASS/FAIL | X warnings |
| app: prettier | PASS/FAIL | X files need formatting |
| app: tests | PASS/FAIL | X passed, Y failed |

If any check fails, show the error output. Do NOT attempt to fix anything — just report.
