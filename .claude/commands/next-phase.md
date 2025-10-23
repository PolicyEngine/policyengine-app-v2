---
description: Move to and execute the next phase of the development plan
---

Read the current plan from `.claude-plans/calculation-system-refactor.md` and do the following:

1. Identify the current phase and move to the next phase
2. Execute all tasks in the next phase
3. Write or update unit tests for the code changes made in this phase, following the conventions in `app/src/tests/CLAUDE.md`:
   - Place tests in `app/src/tests/unit/` mirroring the source structure
   - Use Given-When-Then naming pattern
   - Import from `@test-utils` not `@testing-library/react`
   - Use accessibility selectors (getByRole, etc.)
   - Mock Plotly if needed
4. Ensure all mocks and test data have been moved to `app/src/tests/fixtures/` following the structure in CLAUDE.md
5. Update the plan file to mark this phase as complete
6. Provide a brief summary of:
   - What was completed in this phase
   - Current progress (e.g., "Phase 2 of 5 complete")
   - What the next phase will involve
7. Ask if I want to proceed to the next phase

If the plan file doesn't exist, inform me and suggest using `/save-plan` first.
