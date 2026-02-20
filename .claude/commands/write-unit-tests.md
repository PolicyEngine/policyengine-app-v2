---
description: Write unit tests, validate fixture organization, and run tests
allowed-tools: Bash, Read, Write, Edit, Glob, Grep, Task
---

Write unit tests for the files or features described by the user. Follow these steps:

## Step 1: Read the test guidelines

Read `app/src/tests/CLAUDE.md` in full. All tests MUST follow these conventions:
- Import `render`, `screen`, `userEvent` from `@test-utils` (not `@testing-library/react`)
- Import `describe`, `test`, `expect`, `vi` from `vitest`
- Use Given-When-Then naming: `test('given X then Y', ...)`
- Use `// Given`, `// When`, `// Then` comments in test bodies
- Use accessibility selectors (`getByRole`, `getByText`) over test IDs
- Place tests in `src/tests/unit/` mirroring the source structure
- Place ALL mocks, constants, helpers, and setup code in `src/tests/fixtures/` mirroring the source structure
- Use descriptive constants (no magic strings/numbers in test bodies)
- Use `vi` not `jest`; reset mocks with `vi.clearAllMocks()` in `beforeEach`

## Step 2: Explore existing patterns

Look at 1-2 existing test files and their corresponding fixture files to understand the codebase patterns before writing new tests. Pay attention to:
- How mocks are structured in fixture files
- Section separators and grouping conventions
- How `render` and providers are used
- Module mock patterns (`vi.mock`)

## Step 3: Write fixture files FIRST

Create fixture files in `src/tests/fixtures/` with:
- Descriptive named constants grouped with `as const`
- Mock data arrays typed to match source interfaces
- Factory/builder functions for complex objects
- Helper functions for common mock patterns
- Section separators with clear headers

## Step 4: Write test files

Write the actual test files in `src/tests/unit/`. Each test file should:
- Import all mock data and helpers from the corresponding fixture file
- Contain zero hardcoded magic values (all constants come from fixtures)
- Use `beforeEach` to reset mocks
- Have clear `describe` blocks grouping related tests
- Follow Given-When-Then structure

## Step 5: Validate fixture organization

Launch an agent to confirm ALL of the following:
1. Every test file has a corresponding fixture file in `src/tests/fixtures/`
2. No test file contains inline mock data, hardcoded constants, or setup helpers that should be in fixtures
3. All `vi.mock` module mocks reference functions defined in fixture files
4. No magic strings or numbers appear in test assertions (all come from named constants)

If any violations are found, fix them by moving the code to the appropriate fixture file.

## Step 6: Run ONLY the modified tests

Run the specific test files that were created or modified using:
```
cd app && npx vitest run <space-separated list of test file paths relative to app/>
```

Do NOT run the entire test suite. Only run the tests you wrote or modified.

If tests fail, fix them and re-run until all pass.
