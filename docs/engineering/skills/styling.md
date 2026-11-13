## Styling conventions

1. **No CSS modules**: Don't use `.module.css` files. Use Tailwind CSS with the `tw:` prefix and shadcn/ui components.

2. **Use design tokens**: Import colors, spacing, and typography from `@/designTokens` for consistency.

3. **Tailwind classes**: Use Tailwind utility classes with `tw:` prefix for styling. Use shadcn/ui components from `@/components/ui` for common UI patterns.

4. **Write sizes out**: Don't give `w-`, `min-w-`, `max-w-`, `basis-` or the `inline-` size utilities a named size such as `sm` or `2xl`. Tailwind reads those names from the theme's spacing keys (`--spacing-sm` is 8px) before its own container sizes (`--container-sm` is 24rem), so `tw:max-w-sm` is 8px wide in both apps. Write the size out instead: `tw:max-w-[24rem]`. `website/src/__tests__/config/tailwind-size-classes.test.ts` fails on such a class in the website or the calculator.

5. **Component structure**: Split complex components into smaller, modular files for better maintainability. For example, a sidebar should have separate files for logo, nav items, sections, etc.

## File organisation

- Components should be modular and split into logical sub-components
- Group related components in folders (e.g., `sidebar/` folder for all sidebar-related components)
- Keep component files focused and single-purpose

## shadcn/ui usage

- Use shadcn/ui components from `@/components/ui` for common patterns (Button, Input, Label, Tooltip, etc.)
- Use Tailwind utility classes with `tw:` prefix for custom styling
- Use design tokens from `@/designTokens` for custom values
