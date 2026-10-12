# PolicyEngine app v2

A modern web application for policy analysis and simulation, built with React, TypeScript, and Mantine.

## Getting started

### Prerequisites

- Bun 1.0 or higher (https://bun.sh)

### Installation

```bash
make install
```

### Development

Start the development server:

```bash
make dev
```

The application will be available at http://localhost:5173

### Building

Build for production:

```bash
make build
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

## Sign-in and saved work (calculator)

The calculator can sign users in with social sign-on (Auth0) and save their
policies, households, simulations, reports and reforms to their PolicyEngine
account through the PolicyEngine API (`/v2/me` and `/v2/user-*`). It is off
unless all of these are set at build time (see `calculator-app/.env.example`):

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_AUTH_ENABLED` | `true` turns sign-in on |
| `NEXT_PUBLIC_AUTH0_DOMAIN` | Auth0 (custom) domain |
| `NEXT_PUBLIC_AUTH0_CLIENT_ID` | SPA application for the environment |
| `NEXT_PUBLIC_AUTH0_AUDIENCE` | PolicyEngine API resource server identifier |
| `NEXT_PUBLIC_API_URL` | PolicyEngine API origin (default `https://api.policyengine.org`); set to the staging API on staging |

The legacy Vite build reads the same settings as `VITE_AUTH_ENABLED`,
`VITE_AUTH0_*` and `VITE_API_URL`, but does not mount the sign-in provider.

- Signed out, and in every country without account storage (Canada,
  Nigeria, Israel), saved work stays in the browser's localStorage, as before.
- Signed in on the US or UK calculator, saved work goes to the account. The
  first sign-in offers to copy this browser's saved work to the account;
  nothing is deleted from the device.
- Saved geographies always stay in localStorage.

## Project structure

```
.
├── app/                  # Main application code
│   ├── src/             # Source files
│   ├── public/          # Static assets
│   └── package.json     # Dependencies
├── .github/             # GitHub Actions workflows
└── Makefile            # Build commands
```

## Deployment

The application automatically deploys to GitHub Pages when changes are pushed to the main branch.

## Development workflow

1. Create a new branch from main
2. Make your changes
3. Run tests and linting: `make test && make lint`
4. Create a pull request
5. Once approved and merged, changes deploy automatically

## Technologies

- React 19
- TypeScript
- Mantine UI
- Vite
- Redux Toolkit
- React Query
- React Router
- Plotly.js for visualisations