# Testing Conventions

## Test commands
- Run tests: `npm test` or `npm run vitest`
- Watch mode: `npm run vitest:watch`
- With coverage: `npm run vitest -- --coverage`
- Full check: `npm run test-all` (includes linting & typecheck)

## Writing tests
1. **Always use @test-utils**: Import `render` and other utilities from `@test-utils`, not `@testing-library/react`
   ```typescript
   import { render, screen, userEvent } from '@test-utils';
   ```

2. **File location**: Place tests in `src/tests/` mirroring the source structure
   - `src/components/Button.tsx` → `src/tests/components/Button.test.tsx`
   - `src/hooks/useAuth.ts` → `src/tests/hooks/useAuth.test.ts`

3. **Test naming**: Use Given-When-Then pattern for clear, descriptive test names
   ```typescript
   test('given user clicks button then callback is invoked', async () => {});
   test('given invalid props then error message displays', () => {});
   test('given loading state then spinner is visible', () => {});
   ```

4. **Basic test structure** with Given-When-Then code organization:
   ```typescript
   import { describe, test, expect, vi } from 'vitest';
   import { render, screen, userEvent } from '@test-utils';
   
   describe('ComponentName', () => {
     test('given user clicks button then callback is invoked', async () => {
       // Given
       const user = userEvent.setup();
       const handleClick = vi.fn();
       render(<Component onClick={handleClick} />);
       
       // When
       await user.click(screen.getByRole('button', { name: /click me/i }));
       
       // Then
       expect(handleClick).toHaveBeenCalled();
     });
   });
   ```

5. **Use accessibility selectors**: Test how users (including screen readers) interact with your app
   
   **Query priority** (most to least preferred):
   ```typescript
   // 1. Best - Tests if element is properly accessible
   screen.getByRole('button', { name: /submit/i })    // Ensures it's an actual button
   screen.getByRole('textbox', { name: /email/i })    // Ensures input is labeled
   
   // 2. Good - Form labels and visible text
   screen.getByLabelText('Email address')             // Ensures form has labels
   screen.getByText('Welcome back!')                  // Tests visible content
   
   // 3. Avoid - Implementation details that can break
   screen.getByTestId('submit-button')                // Breaks if test-id changes
   screen.getByClassName('btn-primary')               // Breaks if CSS changes
   screen.getById('email-input')                      // Breaks if ID changes
   ```
   
   **Why this matters**: If a screen reader can't find your element, your test shouldn't be able to either. This ensures both working tests and accessible components.

6. **Mocks and fixtures**: Place all mocks in `src/tests/fixtures/` mirroring the source structure
   ```
   src/tests/fixtures/
   ├── api/
   │   └── policyMocks.ts
   ├── components/
   │   └── ButtonMocks.ts
   └── hooks/
       └── useAuthMocks.ts
   ```

7. **Always mock Plotly**: Add to test file or setup
   ```typescript
   vi.mock('react-plotly.js', () => ({ default: vi.fn(() => null) }));
   ```

8. **Mock conventions**: 
   - Use `vi` not `jest`
   - Mock API calls at module level
   - Reset mocks with `vi.clearAllMocks()` in `beforeEach`
   - Import mocks from fixtures: `import { mockPolicyData } from '@/tests/fixtures/api/policyMocks';`

9. **Async patterns**: Use `userEvent.setup()` for interactions, `waitFor` for async updates

10. **Coverage targets**: Aim for 80% overall, 90% for critical paths (adapters, utils, hooks)

## What to test
- User interactions and state changes
- Props rendering correctly
- Error states and edge cases
- Data transformations in adapters
- Hook behavior and state management

## What NOT to test
- Mantine component internals
- Third-party library behavior
- Implementation details (focus on user-facing behavior)