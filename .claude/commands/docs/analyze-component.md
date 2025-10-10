---
description: Analyze React component and generate documentation
allowed-tools: Read, Write, Edit, Grep, Glob, Bash, Task
argument-hint: [component-path]
---

# Component Documentation Generator

Analyze and document a React component from the policyengine-app-v2 codebase.

**Component to analyze:** `$ARGUMENTS`

## Analysis Steps

Use the Task tool with a general-purpose agent to perform the following analysis:

1. **Read the component file** at the provided path
2. **Extract component information:**
   - Component name
   - Props (with types from TypeScript)
   - State variables (useState, useReducer)
   - Effects and lifecycle hooks
   - Dependencies (imports)
   - Exported functions/types

3. **Identify design patterns used:**
   - **Compound Components** - Parent component with specialized children (e.g., Sidebar + SidebarNavItem)
   - **Render Props** - Function-as-child pattern
   - **Higher-Order Components** - Component wrappers
   - **Custom Hooks** - Usage of custom hooks (use*)
   - **Provider Pattern** - Context API usage
   - **Adapter Pattern** - Data transformation between interfaces
   - **Reducer Pattern** - useReducer or external reducer usage
   - **State Machine** - Step-based state transitions
   - **Observer Pattern** - Event subscriptions, useEffect dependencies

4. **Find related components:**
   - Components that import this component
   - Components that this component imports
   - Child components in the same directory

5. **Generate a 1-4 sentence summary** that:
   - Describes what the component does
   - Mentions the design patterns it employs
   - Notes its role in the application architecture

## Documentation Generation

Create an MDX file at: `../docusaurus/docs/components/[ComponentName].mdx`

The documentation should include:

### Header
```markdown
---
title: [ComponentName]
sidebar_position: [auto]
---

# [ComponentName]

[1-4 sentence summary with design pattern references]
```

### Design Pattern Badges
Show badges for identified patterns (use emoji + text):
- 🏭 Factory
- 👀 Observer
- 🎭 Adapter
- 🔄 Reducer
- 🧩 Compound
- etc.

### Props Table
Generate from TypeScript interface:
```markdown
## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| ... | ... | ... | ... |
```

### Usage Example
```markdown
## Usage

\`\`\`tsx
import { [ComponentName] } from './components/[path]';

// Example usage
<[ComponentName]
  prop1="value"
  prop2={value}
/>
\`\`\`
```

### Related Components
```markdown
## Related Components

- [`ComponentA`](./ComponentA.mdx) - Brief description
- [`ComponentB`](./ComponentB.mdx) - Brief description
```

### Implementation Notes
```markdown
## Implementation Details

- Uses [pattern name] pattern for [reason]
- Manages [state/data] via [approach]
- Integrates with [other systems]
```

## Output

After generating the documentation:
1. Confirm the MDX file path
2. Show the generated summary
3. List identified design patterns
4. Provide the file path reference for the user
