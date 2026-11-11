---
description: Run ESLint and Stylelint and optionally fix errors
allowed-tools: Bash
---

Run `make lint` from the repository root. It runs ESLint in `app/`, `website/` and `calculator-app/`, and Stylelint on `app/`'s CSS, the same linters as CI's Lint and format job. ESLint fails on warnings as well as errors (`--max-warnings 0`). `make` stops at the first linter that fails, so after fixing its errors, run it again to check the rest.

If there are ESLint or Stylelint errors, ask me if I should fix them. If I say yes, fix all the errors and keep running `make lint` until there are no more errors. If I say no, do nothing.

After everything is done, return to the original directory.
