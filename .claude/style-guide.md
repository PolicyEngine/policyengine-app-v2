# PolicyEngine App v2 - Style Guide

## Design Tokens

The app uses a centralised design token system located in `app/src/designTokens/`. Always import and use these tokens instead of hardcoding values.

```typescript
import { colors, spacing, typography } from '@/designTokens';
```

## Table Styling

When creating tables, follow this pattern from `IngredientReadView.tsx`:

### Table Container
```typescript
<Paper withBorder style={{ border: `1px solid ${colors.border.light}`, overflow: 'hidden' }}>
  <Table>
    {/* ... */}
  </Table>
</Paper>
```

### Table Header
```typescript
<Table.Thead style={{ backgroundColor: colors.gray[50] }}>
  <Table.Tr>
    <Table.Th
      style={{
        fontSize: typography.fontSize.xs,
        fontWeight: typography.fontWeight.medium,
        color: colors.text.secondary,
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        padding: `${spacing.md} ${spacing.lg}`,
      }}
    >
      Header Text
    </Table.Th>
  </Table.Tr>
</Table.Thead>
```

### Table Body
```typescript
<Table.Tbody>
  {data.map((item) => (
    <Table.Tr key={item.id}>
      <Table.Td style={{ padding: `${spacing.md} ${spacing.lg}` }}>
        <Text size="sm" style={{ color: colors.text.primary }}>
          {item.value}
        </Text>
      </Table.Td>
    </Table.Tr>
  ))}
</Table.Tbody>
```

## Key Design Principles

1. **Consistent spacing**: Use `spacing.md` and `spacing.lg` for padding (12px and 16px)
2. **Typography hierarchy**:
   - Headers: `fontSize.xs` (12px), `fontWeight.medium` (500), uppercase, letter-spacing
   - Body: `fontSize.sm` (14px), `fontWeight.normal` (400)
   - Monospace: Use `typography.fontFamily.mono` for IDs and technical values
3. **Colors**:
   - Gray backgrounds: `colors.gray[50]` (#F9FAFB)
   - Borders: `colors.border.light` (#E2E8F0)
   - Primary text: `colors.text.primary` (#000000)
   - Secondary text: `colors.text.secondary` (#5A5A5A)
   - Dimmed text: Use Mantine's `c="dimmed"` prop
4. **Borders**: Always use `1px solid ${colors.border.light}`

## Common Patterns

### Loading State
```typescript
{isLoading ? (
  <Center p="md">
    <Loader size="sm" />
  </Center>
) : /* content */}
```

### Empty State
```typescript
{data.length === 0 ? (
  <Text size="sm" c="dimmed">No items found</Text>
) : /* content */}
```

### Monospace Text (IDs, technical values)
```typescript
<Text size="sm" style={{ fontFamily: typography.fontFamily.mono, color: colors.text.primary }}>
  {technicalValue}
</Text>
```

## Visual design principles (CRITICAL)

1. **Clean and minimal** - not overloaded with information or UI elements
2. **Visual consistency is SUPER important** - follow existing patterns throughout the app
3. **Sentence case EVERYWHERE** - never use title case for headings, labels, buttons
4. **Professional but accessible** - Resolution Foundation style, British English
5. **Concise prose over excessive formatting** - avoid overuse of headers and bullet points

## Modals and flows

- Use existing FlowView components for multi-step processes
- Keep modal content clean and focused - don't clutter
- Follow the card-based layout pattern used in existing flows
- Modal size should be appropriate - use `size="xl"` for flows
- Modals should be centered

## Don't

- Don't hardcode color values like `#E2E8F0` - use `colors.border.light`
- Don't hardcode spacing like `12px` - use `spacing.md`
- Don't use different font sizes/weights - stick to the design tokens
- Don't create tables without proper styling - they should match `IngredientReadView.tsx`
- **Don't add excessive headers or markdown formatting**
- **Don't use title case - sentence case only**
- **Don't create overly verbose UI text**
- **Don't add unnecessary decorative elements**
- **Don't deviate from existing visual patterns**
