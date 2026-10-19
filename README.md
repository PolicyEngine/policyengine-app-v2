# PolicyEngine app v2

A modern web application for policy analysis and simulation, built with React, TypeScript, and Next.js.

## Getting started

### Prerequisites

- Bun 1.0 or higher (https://bun.sh)

### Installation

```bash
make install
```

### Development

Start the website and calculator dev servers:

```bash
make dev
```

The website runs on the first free port from 3000 (http://localhost:3000) and the calculator on the next free port after it. Set `WEBSITE_PORT` or `CALCULATOR_PORT` to pin either one.

### Building

Build the website and the calculator:

```bash
make build
```

### Storybook

```bash
cd app && bun run storybook
```

### Testing

Run tests:

```bash
make test
```

Run linters:

```bash
make lint
```

Format code:

```bash
make format
```

## Sign-in and saved work (v3 workspace)

The v3 workspace (the flagship shell: Ask, Build, Reforms, reports and the
account page) can sign users in with social sign-on (Auth0) and save their
reforms and reports to their PolicyEngine account through the PolicyEngine
API (`/v2/me` and `/v2/user-*`). It is off unless all of these are set at
build time (see `calculator-app/.env.example`), alongside
`NEXT_PUBLIC_FLAGSHIP_SHELL=true`:

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_AUTH_ENABLED` | `true` turns sign-in on |
| `NEXT_PUBLIC_AUTH0_DOMAIN` | Auth0 (custom) domain |
| `NEXT_PUBLIC_AUTH0_CLIENT_ID` | SPA application for the environment |
| `NEXT_PUBLIC_AUTH0_AUDIENCE` | PolicyEngine API resource server identifier |
| `NEXT_PUBLIC_API_URL` | PolicyEngine API origin (default `https://api.policyengine.org`); set to the staging API on staging |

- On the US and UK workspace, saved reforms and reports always go to the
  PolicyEngine API. Signed in, they belong to the account. Signed out, they
  belong to this browser's unauthenticated user: a random UUID made on the
  first visit, kept in localStorage (`pe-browser-user-id`) with no expiry,
  and sent as the `PolicyEngine-Unauthenticated-User` header. It is the
  credential for that work, so it never goes in a URL or a log.
- A saved reform is a pointer to its PolicyEngine API policy (with its
  name, baseline and origin); its changes are read back from the policy.
  Running a report creates its policy, simulations and report in the API.
- Signing in upgrades the browser's unauthenticated user
  (`POST /v2/me/upgrade`): on a first sign-in it becomes the account, so
  everything saved stays; for an existing account its work moves into that
  account. The browser then starts over with a new UUID. A failed upgrade
  keeps the UUID, so the next sign-in tries again.
- With sign-in off, and outside the US and UK, saved work stays in this
  browser, in v3's own keys.
- The legacy calculator (policies, households, simulations and reports
  built outside the workspace) has no sign-in and keeps its saved work in
  localStorage, as before. v3 never reads or writes that storage.

## Project structure

```
.
├── website/             # Next.js website (policyengine.org)
├── calculator-app/      # Next.js calculator (app.policyengine.org)
├── app/                 # Calculator source shared by calculator-app, Storybook and Vitest
│   ├── src/             # Source files and the data files the website reads
│   └── public/          # Static files (calculator-app/public links here)
├── .github/             # GitHub Actions workflows
└── Makefile             # Build commands
```

## Deployment

Vercel builds and deploys two projects from this repository: `policyengine-website` (root `website/`, serving policyengine.org) and `policyengine-calculator-next` (root `calculator-app/`, serving app.policyengine.org). Pushes to main deploy to production, and pull requests get preview deployments.

## Development workflow

1. Create a new branch from main
2. Make your changes
3. Run tests and linting: `make test && make lint`
4. Create a pull request
5. Once approved and merged, changes deploy automatically

## Technologies

- React 19
- TypeScript
- Next.js
- Vite (Storybook and Vitest only)
- Redux Toolkit
- React Query
- React Router
- Plotly.js for visualisations