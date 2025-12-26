# Design Token Enforcement

This skill ensures consistent use of PolicyEngine's design system tokens. **Never use hardcoded colors, spacing, or typography values.**

## Text Casing: SENTENCE CASE IS THE STANDARD

**CRITICAL: Almost all text in the app must use sentence case.**

Sentence case means: Capitalize only the first letter of the first word (and proper nouns).

| Text Type | Correct | Wrong |
|-----------|---------|-------|
| Page titles | "Your saved policies" | "Your Saved Policies" |
| Button labels | "New simulation" | "New Simulation" |
| Column headers | "Date created" | "Date Created" |
| Tab labels | "Budgetary impact" | "Budgetary Impact" |
| Menu items | "Rename" | "RENAME" |
| Descriptions | "Configure your household settings" | "Configure Your Household Settings" |
| Chart titles | "This reform would increase income by $500" | "This Reform Would Increase Income By $500" |

### Exceptions (Title Case or Special Casing Allowed)
- **Proper nouns**: "PolicyEngine", "United States", "California"
- **Acronyms**: "IRS", "UK", "API", "CSV"
- **Official program names**: "Child Tax Credit", "Universal Credit"
- **Table header row**: May use UPPERCASE with `textTransform: 'uppercase'` (this is a styling choice, not the actual text)

### Examples
```tsx
// CORRECT - Sentence case
title="Your saved simulations"
subtitle="Build and save tax policy scenarios for quick access."
buttonLabel="New household"
header="Parameter changes"

// WRONG - Title Case
title="Your Saved Simulations"
subtitle="Build And Save Tax Policy Scenarios For Quick Access."
buttonLabel="New Household"
header="Parameter Changes"
```

## Import Pattern

Always import from `@/designTokens`:

```tsx
import { colors, spacing, typography } from '@/designTokens';
```

## Color Tokens

### Brand Colors (Teal - Primary)
| Token | Value | Use For |
|-------|-------|---------|
| `colors.primary[500]` | `#319795` | Main brand color, primary buttons, links |
| `colors.primary[600]` | `#2C7A7B` | Hover states |
| `colors.primary[700]` | `#285E61` | Active/pressed states |
| `colors.primary[50]` | `#E6FFFA` | Light teal backgrounds |

### Text Colors
| Token | Use For |
|-------|---------|
| `colors.text.primary` | Main body text, headings |
| `colors.text.secondary` | Helper text, descriptions, labels |
| `colors.text.tertiary` | Disabled text, placeholders |
| `colors.text.title` | Page titles (same as primary) |
| `colors.text.inverse` | Text on dark backgrounds |

### Semantic Colors
| Token | Use For |
|-------|---------|
| `colors.success` (`#22C55E`) | Positive changes, gains, winners |
| `colors.error` (`#EF4444`) | Negative changes, losses, errors |
| `colors.warning` (`#FEC601`) | Warnings, cautions |
| `colors.info` (`#1890FF`) | Informational highlights |

### Background Colors
| Token | Use For |
|-------|---------|
| `colors.background.primary` | Main content area (white) |
| `colors.background.secondary` | Sidebar, secondary panels |
| `colors.background.tertiary` | Tertiary backgrounds |
| `colors.gray[50]` | Table headers, subtle backgrounds |
| `colors.blue[50]` | Selected row highlights |

### Border Colors
| Token | Use For |
|-------|---------|
| `colors.border.light` | Standard borders, dividers |
| `colors.border.medium` | Emphasized borders |
| `colors.border.dark` | Strong contrast borders |

## Spacing Tokens

### Base Scale
```tsx
spacing.xs   // 4px  - Tight spacing (icon gaps)
spacing.sm   // 8px  - Small gaps
spacing.md   // 12px - Medium gaps
spacing.lg   // 16px - Standard component gaps
spacing.xl   // 20px - Section gaps
spacing['2xl'] // 24px - Large section gaps
spacing['3xl'] // 32px - Major sections
spacing['4xl'] // 48px - Page sections
```

### Border Radius
```tsx
spacing.radius.sm  // 4px  - Buttons, inputs
spacing.radius.md  // 6px  - Cards, small panels
spacing.radius.lg  // 8px  - Standard panels
spacing.radius.xl  // 12px - Large cards
```

## Typography Tokens

### Font Families
```tsx
typography.fontFamily.primary  // Inter - UI elements
typography.fontFamily.body     // Roboto - Body text
typography.fontFamily.chart    // Roboto Serif - Charts
typography.fontFamily.mono     // JetBrains Mono - Code
```

### Font Weights
```tsx
typography.fontWeight.normal    // 400 - Body text
typography.fontWeight.medium    // 500 - Emphasized text
typography.fontWeight.semibold  // 600 - Subheadings
typography.fontWeight.bold      // 700 - Headings
```

### Font Sizes
```tsx
typography.fontSize.xs   // 12px - Small labels
typography.fontSize.sm   // 14px - Body text
typography.fontSize.base // 16px - Large body
typography.fontSize.lg   // 18px - Subheadings
typography.fontSize.xl   // 20px - Section titles
typography.fontSize['2xl'] // 24px - Page titles
```

## Anti-Patterns to Avoid

### Never Do This
```tsx
// WRONG - Hardcoded values
<Box style={{ color: '#319795' }}>
<Text style={{ marginBottom: '16px' }}>
<Paper style={{ borderRadius: '8px', border: '1px solid #E2E8F0' }}>
```

### Always Do This
```tsx
// CORRECT - Token usage
<Box style={{ color: colors.primary[500] }}>
<Text style={{ marginBottom: spacing.lg }}>
<Paper radius={spacing.radius.lg} style={{ border: `1px solid ${colors.border.light}` }}>
```

## Common Patterns

### Page Title
```tsx
<Title
  order={1}
  size="2xl"
  fw={typography.fontWeight.semibold}
  c={colors.text.title}
  mb={spacing.sm}
>
  {title}
</Title>
```

### Subtitle/Description
```tsx
<Text size="md" c={colors.text.secondary}>
  {description}
</Text>
```

### Card/Panel Container
```tsx
<Paper
  radius={spacing.radius.lg}
  style={{
    border: `1px solid ${colors.border.light}`,
    overflow: 'hidden',
  }}
>
```

### Table Header
```tsx
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
```

### Selected State
```tsx
style={{
  backgroundColor: selected ? colors.blue[50] : 'transparent',
  borderLeft: selected
    ? `3px solid ${colors.primary[500]}`
    : '3px solid transparent',
}}
```
