# Publishing @policyengine/design-system to npm

This document describes how to set up and publish the design system package to npm.

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

### 2. npm Access Token

Generate an automation token for CI/CD:

1. Log in to https://www.npmjs.com
2. Go to Access Tokens → Generate New Token
3. Select **"Automation"** type (bypasses 2FA for CI)
4. Copy the token (starts with `npm_...`)

### 3. GitHub Secret

Add the npm token as a repository secret:

1. Go to repo Settings → Secrets and variables → Actions
2. Click "New repository secret"
3. Name: `NPM_TOKEN`
4. Value: paste the npm token
5. Click "Add secret"

## Publishing

### Automatic (Recommended)

The package is automatically published when you create a GitHub Release:

1. Update version in `packages/design-system/package.json`
2. Commit and push to main
3. Create a new Release on GitHub
4. The `publish-design-system.yaml` workflow triggers automatically

### Manual

Trigger the workflow manually:

1. Go to Actions → "Publish Design System"
2. Click "Run workflow"
3. Optionally enable "Dry run" to test without publishing

### Local (Development)

```bash
# Login to npm (one-time)
npm login

# Build
npm run build --workspace=@policyengine/design-system

# Publish (requires npm org access)
npm publish --workspace=@policyengine/design-system --access public
```

## Version Bumping

Before publishing a new version:

```bash
cd packages/design-system

# Patch (0.1.0 → 0.1.1) - bug fixes
npm version patch

# Minor (0.1.0 → 0.2.0) - new features
npm version minor

# Major (0.1.0 → 1.0.0) - breaking changes
npm version major
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
- Token may be expired or invalid
- Token may not have publish permissions

### "npm ERR! 402 Payment Required"
- Trying to publish private package without paid npm account
- Ensure `--access public` flag is used

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
