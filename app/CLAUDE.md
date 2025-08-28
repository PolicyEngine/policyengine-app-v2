# PolicyEngine App v2 Development Guidelines

## Styling conventions

1. **No CSS modules**: Don't use `.module.css` files. Instead use Mantine's built-in styling system with inline styles, style props, and the theme.

2. **Use design tokens**: Import colors, spacing, and typography from `@/designTokens` for consistency.

3. **Inline styles with Mantine**: Use Mantine component props like `bg`, `c`, `p`, `m` for styling, and the `style` prop for custom CSS properties.

4. **Component structure**: Split complex components into smaller, modular files for better maintainability. For example, a sidebar should have separate files for logo, nav items, sections, etc.

## File organisation

- Components should be modular and split into logical sub-components
- Group related components in folders (e.g., `sidebar/` folder for all sidebar-related components)
- Keep component files focused and single-purpose

## Mantine usage

- Use Mantine's built-in components and props for styling
- Leverage the theme system for consistent colors and spacing
- Use design tokens from `@/designTokens` for custom values
