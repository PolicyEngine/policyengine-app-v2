---
description: Run all code quality checks (type checks, ESLint and Stylelint, Prettier) with progress tracking
---

Run the following slash commands in order, showing progress after each:

1. Say "🚀 Starting PR finalization (0/3 tasks completed)"
2. Run `/typecheck`
3. Say "✅ Typecheck complete (1/3 tasks completed)"
4. Run `/eslint`
5. Say "✅ ESLint and Stylelint complete (2/3 tasks completed)"
6. Run `/prettier`
7. Say "✅ All tasks complete (3/3). CI also runs the tests (`make test`) and the build (`make build`)."
