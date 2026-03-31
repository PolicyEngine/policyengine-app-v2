---
description: Open a GitHub issue describing the work, then open a PR referencing it with full commit analysis and reviewer test instructions
---

# Opening issue + PR for current branch

**IMPORTANT:** This command creates a GitHub issue summarizing what was done and why, then opens a PR that references it. It analyzes ALL commits on the branch (not just what's in local context), and specifies tests a reviewer should run.

## Step 1: Gather branch context

```bash
CURRENT_BRANCH=$(git branch --show-current)

if [[ "$CURRENT_BRANCH" == "main" || "$CURRENT_BRANCH" == "master" ]]; then
  echo "ERROR: You are on $CURRENT_BRANCH. Switch to a feature branch first."
  exit 1
fi

# Determine base branch
BASE_BRANCH=$(git remote show origin 2>/dev/null | grep 'HEAD branch' | cut -d' ' -f5)
if [ -z "$BASE_BRANCH" ]; then
  if git rev-parse --verify main >/dev/null 2>&1; then
    BASE_BRANCH="main"
  else
    BASE_BRANCH="master"
  fi
fi

echo "Branch: $CURRENT_BRANCH"
echo "Base:   $BASE_BRANCH"
```

## Step 2: Analyze ALL commits on the branch

**CRITICAL:** Do not rely only on your local conversation context. You MUST read every commit that will be part of this PR.

```bash
# Full commit log with bodies
git log --format='%H %s%n%b%n---' "$BASE_BRANCH"..HEAD

# Full diff stat
git diff --stat "$BASE_BRANCH"...HEAD

# Full diff (for understanding changes)
git diff "$BASE_BRANCH"...HEAD
```

Read ALL of this output. For large diffs, read in chunks. Do not skip any commits or files.

For each commit, note:
- What it changed and why
- Which files were affected
- Whether it introduces new functionality, fixes a bug, refactors, etc.

## Step 3: Determine the repo name

```bash
REPO_FULL=$(gh repo view --json nameWithOwner --jq '.nameWithOwner')
echo "Repo: $REPO_FULL"
```

## Step 4: Identify tests a reviewer should run

Based on the changes you analyzed in Step 2, determine which validation steps a reviewer needs:

1. **Type checking** — if any `.ts` or `.tsx` files changed: `make typecheck`
2. **Linting** — if any source files changed: `make lint`
3. **Formatting** — if any source files changed: `make format` (then check for diffs)
4. **Unit tests** — if test files were added or source logic changed: `make test`
5. **Build** — if imports, configs, or significant code changed: `make build`
6. **Manual verification** — describe specific UI flows or behaviors to check, if applicable

Be specific. Don't just say "run tests" — say which tests and what to look for.

## Step 5: Create the GitHub issue

Compose an issue body that explains:
- **What** was done (high-level summary)
- **Why** it was needed (motivation/context)
- **Key changes** (grouped logically, not just a file list)

```bash
gh issue create \
  --repo "$REPO_FULL" \
  --title "ISSUE_TITLE" \
  --body "$(cat <<'ISSUE_EOF'
## Summary

[1-3 sentence summary of what this work accomplishes]

## Motivation

[Why this work was needed — what problem it solves or what capability it adds]

## Key changes

- [Logical grouping 1]: [description]
- [Logical grouping 2]: [description]
- [Logical grouping 3]: [description]

## Validation

- [ ] [Specific test or check 1]
- [ ] [Specific test or check 2]
- [ ] [Specific test or check 3]
ISSUE_EOF
)"
```

Capture the issue number from the output URL.

## Step 6: Push the branch (if not already pushed)

```bash
git rev-parse --verify "origin/$CURRENT_BRANCH" >/dev/null 2>&1
if [ $? -ne 0 ]; then
  echo "Pushing branch to origin..."
  git push -u origin "$CURRENT_BRANCH"
else
  echo "Branch already pushed. Pushing latest..."
  git push
fi
```

## Step 7: Create the PR

Use the issue number from Step 5. The PR description must begin with `Fixes #ISSUE_NUMBER`.

```bash
gh pr create \
  --repo "$REPO_FULL" \
  --title "PR_TITLE" \
  --body "$(cat <<'PR_EOF'
Fixes #ISSUE_NUMBER

## Summary
- [Bullet point for each logical change group]

## Commits
- [List each commit subject with a brief note on what it does]

## Test plan
- [ ] [Specific test instruction 1 — e.g., "Run `make typecheck` and verify no errors"]
- [ ] [Specific test instruction 2 — e.g., "Run `make lint` with --max-warnings 0"]
- [ ] [Specific manual check if applicable]

🤖 Generated with [Claude Code](https://claude.com/claude-code)
PR_EOF
)" \
  --draft
```

## Step 8: Report

Print the issue URL and PR URL so the user can see them.
