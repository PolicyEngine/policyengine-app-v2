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

## Testing conventions

### Test commands
- Run tests: `npm test` or `npm run vitest`
- Watch mode: `npm run vitest:watch`
- With coverage: `npm run vitest -- --coverage`
- Full check: `npm run test-all` (includes linting & typecheck)

### Writing tests
1. **Always use @test-utils**: Import `render` and other utilities from `@test-utils`, not `@testing-library/react`
   ```typescript
   import { render, screen, userEvent } from '@test-utils';
   ```

2. **File location**: Place tests in `src/tests/` mirroring the source structure
   - `src/components/Button.tsx` → `src/tests/components/Button.test.tsx`
   - `src/hooks/useAuth.ts` → `src/tests/hooks/useAuth.test.ts`

3. **Basic test structure**:
   ```typescript
   import { describe, test, expect, vi } from 'vitest';
   import { render, screen, userEvent } from '@test-utils';
   
   describe('ComponentName', () => {
     test('should handle user interaction', async () => {
       const user = userEvent.setup();
       const handleClick = vi.fn();
       
       render(<Component onClick={handleClick} />);
       await user.click(screen.getByText('Click me'));
       
       expect(handleClick).toHaveBeenCalled();
     });
   });
   ```

4. **Always mock Plotly**: Add to test file or setup
   ```typescript
   vi.mock('react-plotly.js', () => ({ default: vi.fn(() => null) }));
   ```

5. **Mock conventions**: 
   - Use `vi` not `jest`
   - Mock API calls at module level
   - Reset mocks with `vi.clearAllMocks()` in `beforeEach`

6. **Async patterns**: Use `userEvent.setup()` for interactions, `waitFor` for async updates

7. **Coverage targets**: Aim for 80% overall, 90% for critical paths (adapters, utils, hooks)

### What to test
- User interactions and state changes
- Props rendering correctly
- Error states and edge cases
- Data transformations in adapters
- Hook behavior and state management

### What NOT to test
- Mantine component internals
- Third-party library behavior
- Implementation details (focus on user-facing behavior)