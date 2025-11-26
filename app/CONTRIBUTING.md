# Contributing to PolicyEngine App V2

Welcome to our newest frontend project! We're excited to have you contribute. This guide will help you get started and understand our development workflow.

## Project Overview

This project is the next iteration of our application (app-v2), building upon the foundation of app-v1. We're creating a modern, component-based frontend that includes:

- Interactive calculator-related pages with dynamic functionality (Policy, Population, Simulation, etc)
- Static informational pages (About Us, Learning, API Playground, etc.)
- Improved user experience and performance

## Getting Started

Before you begin, please refer to the main README.md for development setup and helpful commands.

### Link to Figma Designs

🎨 **Figma Access**: [Design Files Link](https://www.figma.com/design/ZZLB3A5QNYy97d7dBEPpQ8/PE-App-Redesign---Final-Screens?m=auto&t=0MkV9on8ot5RR4Lv-6)

**To get access:**

1. Please visit the link and request access.
2. Alternatively, please sign up with your email and provide your Figma account email to maintenaners for access. You'll receive an invitation with instructions shortly.

### A Note On Design Availability

- ✅ **Calculator pages**: Full Figma designs available
- ⏳ **Static pages**: No Figma Designs available. For now - refer to app-v1 components. Use these as functional reference, but implement with modern patterns and our new design system.

### Design System Guidelines

- We follow Mantine's design system as our foundation. Documentation Link: [https://mantine.dev/](https://mantine.dev/)
- Custom styling should align with our defined design tokens. Check `/src/styles/` and `src/designTokens` directories for our styling constants
- **Component Patterns**: Refer to existing app-v2 components in `/src/components/` (Sample: `src/components/IngredientReadView.tsx`)
- **TypeScript Guidelines**: Follow strict TypeScript practice

## Development Workflow

### Finding Beginner-Friendly Issues

- For existing contributors: Issues have been or will be assigned to you.
- For new contributors, look for labels `good first issue` or `help wanted` in our issue tracker and assign yourself.
  These Issues have links and screenshots for the reference app-v1 component that is to be migrated over to app-v2.

### Recommended Progression Path

We recommend contributors follow this learning path:

1. **Start with Components** (Beginner)
   - Create individual UI components.
   - Focus on reusability and proper TypeScript types.
   - [Optionally] Write Storybook stories and tests.

2. **Move to Integration** (Intermediate)
   - Combine components into page sections
   - Handle component interactions and state management

### Branch Naming Conventions

Use the following format for branch names:

- `feat/[issue-number]-brief-description` (e.g., `feat/123-add-calculator-component`)
- `fix/[issue-number]-brief-description` (e.g., `fix/456-fix-navigation-bug`)
- `docs/brief-description` (e.g., `docs/update-contributing-guide`)

### Development Standards

Our project uses automated code quality tools:

- **ESLint**: `npm run lint` (with eslint-config-mantine)
- **Prettier**: `npm run prettier` and `npm run prettier:write`
- **TypeScript**: `npm run typecheck`

All checks must pass before merging.

### Testing Requirements (Optional for now)

- Write unit tests for new components using Vitest + React Testing Library
- Ensure all tests pass: `npm run test`
- Aim for good test coverage of component functionality
- Add Storybook stories for visual components

### Pull Request Process

1. Create a new branch from `master`
2. Make your changes with clear, atomic commits
3. Run the full test suite: `npm run test` (Skip this step until tests are added)
4. Push your branch and create a pull request
5. Fill out the PR template completely
6. Link the related issue(s) -> 'Fixes #IssueNumber'
7. Wait for code review and address feedback

### Review Process

- All PRs require at least one approval from a maintainer
- Automated checks must pass (tests, linting, type checking)
- Address all review comments before merging
- PRs will be merged by maintainers after approval

---

Thank you for contributing to our project! Your help makes this application better for everyone. 🚀
