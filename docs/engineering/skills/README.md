# Engineering skills

This directory is the canonical source for durable AI-facing engineering guidance in this repository.

Tool-specific entry points such as `AGENTS.md`, `CLAUDE.md`, and `GEMINI.md` must point here instead of duplicating engineering rules. When a rule changes, update the relevant document here first and keep the adapters thin.

Model-specific executable configuration remains in its tool-specific directory. For example, Claude commands, agents, and settings remain under `.claude/`; reusable engineering guidance does not.

Current guidance:

- `repository-guidance.md`: application ownership, repository structure, assets, embedded-site architecture, and pre-commit commands.
- `design-tokens.md`: sentence case, design tokens, colors, spacing, and typography.
- `chart-standards.md`: supported chart libraries, shared chart components, responsive sizing, tooltips, and exports.
- `ingredient-patterns.md`: reusable list-page and rename patterns for policies, reports, simulations, households, and geographies.
- `styling.md`: component styling, file organization, Tailwind conventions, and shared interface components.
- `testing.md`: test commands, file layout, fixtures, mocks, accessibility queries, and coverage expectations.
