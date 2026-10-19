# app

Calculator source shared by the Next.js calculator in `calculator-app/`, which compiles `app/src` through `externalDir` with `@/*` mapped to `app/src/*`. `app/` has no build or dev server of its own: run the website and calculator from the repository root with `bun run dev`. Vite here only runs Storybook (and Chromatic) and Vitest.

## Scripts

### Checks

- `typecheck` – checks TypeScript types
- `lint` – runs ESLint and Stylelint
- `prettier` – checks formatting with Prettier
- `prettier:write` – formats files with Prettier
- `check` – runs `typecheck`, `eslint` and `prettier`
- `test` / `vitest` – runs the Vitest suite
- `vitest:watch` – runs Vitest in watch mode
- `test-all` – runs `prettier`, `eslint`, `typecheck` and `vitest`

### Storybook

- `storybook` – starts the Storybook dev server on port 6006
- `storybook:build` – builds the static Storybook to `storybook-static`
- `chromatic` – publishes changed stories to Chromatic

### Data and search

- `generate-llms-txt` – writes the llms.txt files into `public/`
- `evaluate-search` – evaluates parameter search against its cases
- `refresh-search-eval-cases` – refreshes the parameter search evaluation cases
- `build-parameter-dependencies` – rebuilds the parameter dependency map
