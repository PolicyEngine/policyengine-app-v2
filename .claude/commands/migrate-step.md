---
description: Execute the next migration task from the simulation/report spec
---

You are executing the simulation/report V2 migration workflow. Follow this process exactly.

## Step 1: Read state

Read the following files:
- `.claude-plan/SIMULATION_REPORT_SPEC.md` — the full spec and gap analysis
- `.claude-plan/MIGRATION_PROGRESS.md` — current progress

Identify the **current task** — the first line marked `- [ ]` (unchecked) under the current phase. If all tasks in the current phase are checked, advance to the next phase and identify its first unchecked task.

Tell me:
- Current phase and task number
- What the task requires (from the spec's gap analysis)
- Which repo(s) are involved

## Step 2: Ensure feature branches

For each repo involved in this task, ensure it is on the correct feature branch. The branch naming convention is `feat/sim-report-migration/phase-N` based on the current phase number.

**Base branches:**
- `policyengine.py` → base: `app-v2-migration`
- `policyengine-api-v2-alpha` → base: `app-v2-migration`
- `policyengine-app-v2` → base: `move-to-api-v2`

**Repo paths:**
- `~/Documents/PolicyEngine/policyengine.py`
- `~/Documents/PolicyEngine/policyengine-api-v2-alpha`
- `~/Documents/PolicyEngine/policyengine-app-v2`

For each repo involved, run these checks in order:

1. **Check for uncommitted changes** (`git status` in that repo). If there are any, stop and ask me how to handle them before doing anything else.

2. **Check if the feature branch exists** (`git branch --list 'feat/sim-report-migration/phase-N'`).

3. **If the branch does NOT exist**, ask me for approval to create it:
   - Tell me: "I need to create `feat/sim-report-migration/phase-N` from `<base-branch>` in `<repo-name>`. Approve?"
   - After I approve, run: `git checkout -b feat/sim-report-migration/phase-N <base-branch>` in that repo
   - Update the "Active Branches" table in `MIGRATION_PROGRESS.md`

4. **If the branch exists but the repo is on a different branch**, ask me before switching:
   - Tell me: "`<repo-name>` is on `<current-branch>`. Switch to `feat/sim-report-migration/phase-N`?"
   - After I approve, run: `git checkout feat/sim-report-migration/phase-N` in that repo

5. **If the branch exists and the repo is already on it**, confirm and proceed.

Only proceed once each involved repo is on its correct feature branch with a clean working tree.

## Step 3: Decompose into sub-tasks

Break the task into concrete implementation sub-tasks. For cross-repo tasks, order them by dependency:
1. policyengine.py changes first (if any)
2. policyengine-api-v2-alpha changes second (if any)
3. policyengine-app-v2 changes last (if any)

Create task list entries for each sub-task using TaskCreate so progress is visible in the UI.

## Step 4: Explain why this task is needed

Before presenting any plan, write a short paragraph (3-5 sentences) explaining **why** this task matters. What's currently broken, missing, or misaligned? What does this unblock? What would happen if we skipped it? This gives the user context to evaluate whether the task is worth doing and whether the approach makes sense.

## Step 5: Plan the implementation

For each repo involved:
- Read the relevant source files
- Understand existing patterns
- Design the implementation approach

Present the plan and wait for my approval before writing any code.

## Step 6: Implement

After I approve the plan, implement the changes. For each sub-task:
- Mark it in_progress in the task list when starting
- Write the code
- Mark it completed when done

If the task involves multiple repos, complete all sub-tasks for one repo before moving to the next.

**Alembic migrations:** If the task involves database schema changes in `policyengine-api-v2-alpha`, you MUST follow the `/alembic` skill. In short: verify the database is running, use `alembic revision --autogenerate`, clean up false positives, and verify with `alembic upgrade head`. NEVER hand-write migration files.

## Step 7: Verify

After implementation, run **only the new/changed tests** for this task — NOT the full test suite.

**IMPORTANT:** Do NOT run the full test suite, ESLint, Prettier, ruff, or any other linting/formatting tools at this stage. Those are all handled in a separate final step at the end of the entire phase.

For example, if you created `tests/test_module_registry.py`, run just that file:
```bash
cd ~/Documents/PolicyEngine/policyengine-api-v2-alpha && python -m pytest tests/test_module_registry.py -v
```

If the new tests fail:
1. Show me the errors
2. Fix them
3. Re-run the failing tests
4. Repeat until they pass

Do NOT proceed past this step until the new tests pass.

## Step 8: Present for approval

Once verification passes, present me with:

1. **Summary** — What was done (files changed per repo, what each change does)
2. **Diffs** — Show `git diff` for each repo that was changed
3. **Verification results** — Confirmation that all checks passed
4. **Progress** — Overall progress (e.g., "Phase 1: 3/8 tasks complete")

Then ask: **"Ready to commit these changes?"**

Wait for my explicit approval. Do NOT commit, push, or do any git operations until I say so.

## Step 9: Commit (only after approval)

After I approve:

1. For each repo with changes, stage and commit:
   - Stage specific files (not `git add -A`)
   - Write a descriptive commit message following the repo's conventions
   - Include `Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>`
2. Update `.claude-plan/MIGRATION_PROGRESS.md`:
   - Check off the completed task: `- [ ]` becomes `- [x]` with today's date
   - Check off completed sub-tasks
   - Update the "Current" line at the top to point to the next task
3. Commit the progress file update to the app-v2 repo

**NEVER** do any of the following without my explicit instruction:
- `git push` (to any remote)
- `git merge` (any branch)
- `git rebase`
- `git reset --hard`
- `git checkout .` or `git restore .`
- `git branch -D`
- Create a pull request

If I ask you to push, confirm which repo and remote before doing so.

## Step 10: Full test suite, lint, and format (end of phase only)

This step runs **only once at the end of the entire phase**, after ALL implementation tasks AND test writing are complete. Do NOT run the full test suite, ESLint, Prettier, ruff, or any other linting/formatting tools during individual task work.

When the user explicitly requests it (typically after all phase tasks and tests are done):

**1. Full test suites:**

```bash
cd ~/Documents/PolicyEngine/policyengine.py && python -m pytest
cd ~/Documents/PolicyEngine/policyengine-api-v2-alpha && python -m pytest
cd ~/Documents/PolicyEngine/policyengine-app-v2/app && npx tsc --noEmit && npm test
```

**2. Lint and format:**

```bash
cd ~/Documents/PolicyEngine/policyengine.py && ruff check --fix . && ruff format .
cd ~/Documents/PolicyEngine/policyengine-api-v2-alpha && ruff check --fix . && ruff format .
cd ~/Documents/PolicyEngine/policyengine-app-v2/app && npm run lint -- --fix && npx prettier --write .
```

Commit any formatting fixes separately from feature commits.

## Important rules

- Never skip verification. Every task must pass all checks before being marked complete.
- Never commit without my explicit approval.
- Never do destructive git operations without my explicit instruction.
- If you encounter a blocker (missing dependency, unclear requirement, design decision needed), stop and ask me rather than guessing.
- If a task turns out to be larger than expected, tell me and suggest breaking it into smaller pieces.
- Always show what you're about to do before doing it.
- When starting a new phase, ask me before creating new feature branches.
