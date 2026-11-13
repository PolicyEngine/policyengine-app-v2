## Styling conventions

1. **No CSS modules**: Don't use `.module.css` files. Use Tailwind CSS with the `tw:` prefix and shadcn/ui components.

2. **Use design tokens**: Import colors, spacing, and typography from `@/designTokens` for consistency.

3. **Tailwind classes**: Use Tailwind utility classes with `tw:` prefix for styling. Use shadcn/ui components from `@/components/ui` for common UI patterns.

4. **Write sizes out**: Don't give `w-`, `min-w-`, `max-w-`, `basis-` or the `inline-` size utilities a size named `xs` to `5xl`. Both apps' themes have spacing keys with those names (`--spacing-sm` is 8px), and Tailwind reads them before its own container sizes (`--container-sm` is 24rem), so `tw:max-w-sm` is 8px wide in both apps. Write the size out instead: `tw:max-w-[24rem]`. `website/src/__tests__/config/tailwind-size-classes.test.ts` fails on such a class in the website or the calculator. Tailwind's other container sizes, `3xs`, `2xs`, `6xl` and `7xl`, have no spacing key, so they keep Tailwind's sizes.

5. **Component structure**: Split complex components into smaller, modular files for better maintainability. For example, a sidebar should have separate files for logo, nav items, sections, etc.

## File organisation

- Components should be modular and split into logical sub-components
- Group related components in folders (e.g., `sidebar/` folder for all sidebar-related components)
- Keep component files focused and single-purpose

## shadcn/ui usage

- Use shadcn/ui components from `@/components/ui` for common patterns (Button, Input, Label, Tooltip, etc.)
- Use Tailwind utility classes with `tw:` prefix for custom styling
- Use design tokens from `@/designTokens` for custom values
