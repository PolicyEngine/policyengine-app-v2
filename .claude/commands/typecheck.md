---
description: Run TypeScript type checking and optionally fix errors
allowed-tools: Bash
---

Run `make typecheck` from the repository root. It runs `bun run typecheck` (`tsc --noEmit`) in `app/`, `website/` and `calculator-app/`, the same three checks as CI's Type checking job. `make` stops at the first project with errors, so after fixing them, run it again to check the projects after it.

If there are type errors, ask me if I should fix them. If I say yes, fix all the errors and keep running typecheck until there are no more errors. If I say no, do nothing.

After everything is done, return to the original directory.
