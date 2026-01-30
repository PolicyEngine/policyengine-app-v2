# Publishing @policyengine/design-system to npm

This document describes how the design system package is published to npm.

## Prerequisites

### 1. npm Organization

The `@policyengine` organization must exist on npmjs.com.

**To check:**
```bash
npm view @policyengine/design-system
# If 404, org may not exist or package not published yet
```

**To create org (if needed):**
1. Go to https://www.npmjs.com/org/create
2. Create organization named `policyengine`
3. Add team members with appropriate access

### 2. Link package to GitHub repo (OIDC provenance)

Publishing uses GitHub Actions OIDC — no npm tokens or secrets needed. For this to work, the package must be linked to the GitHub repo on npmjs.com:

1. Go to https://www.npmjs.com/package/@policyengine/design-system/access
2. Under "Publishing access", link to the `PolicyEngine/policyengine-app-v2` GitHub repository

This allows GitHub Actions to authenticate with npm using a short-lived OIDC token, and published versions get a verified provenance badge.

## Publishing

### Automatic (Recommended)

Publishing is handled automatically by [semantic-release](https://github.com/semantic-release/semantic-release) via the `publish-design-system.yaml` workflow. It triggers on:

- Push to `main` with changes in `packages/design-system/**`
- Manual `workflow_dispatch`

Version bumps are determined from **conventional commit messages** — no manual version changes needed:

- `fix: ...` → patch (0.1.0 → 0.1.1)
- `feat: ...` → minor (0.1.0 → 0.2.0)
- `feat!: ...` or `BREAKING CHANGE:` → major (0.1.0 → 1.0.0)

### Manual (Development)

```bash
# Login to npm (one-time)
npm login

# Build
npm run build --workspace=@policyengine/design-system

# Publish (requires npm org access)
npm publish --workspace=@policyengine/design-system --access public
```

## Consuming the Package

### JavaScript/TypeScript

```bash
npm install @policyengine/design-system
```

```typescript
import { colors, typography, spacing } from '@policyengine/design-system';
import { chartColors, chartLayout } from '@policyengine/design-system/charts';

const teal = colors.primary[500]; // "#319795"
```

### Python (via JSON)

```python
import json
import urllib.request

# Fetch from CDN
tokens = json.loads(
    urllib.request.urlopen(
        "https://unpkg.com/@policyengine/design-system/dist/tokens.json"
    ).read()
)

TEAL_PRIMARY = tokens["colors"]["primary"]["500"]
```

### Direct JSON URL

```
https://unpkg.com/@policyengine/design-system/dist/tokens.json
```

## Troubleshooting

### "npm ERR! 404 Not Found"
- Organization may not exist on npm
- You may not have publish access to the org

### "npm ERR! 403 Forbidden"
- OIDC provenance may not be configured (see Prerequisites step 2)
- The workflow may be missing `id-token: write` permission

### "npm ERR! 402 Payment Required"
- Trying to publish private package without paid npm account
- Ensure `publishConfig.access` is `"public"` in package.json

## Package Contents

When published, the package includes:

```
@policyengine/design-system/
├── dist/
│   ├── index.js          # Main entry
│   ├── index.d.ts        # TypeScript types
│   ├── tokens/           # Token modules
│   ├── charts/           # Chart utilities
│   └── tokens.json       # JSON for Python/other consumers
├── src/                  # Source files (for reference)
└── package.json
```
