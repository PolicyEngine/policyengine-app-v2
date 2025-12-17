# @policyengine/design-system

Shared design tokens for PolicyEngine applications.

## Installation

```bash
npm install @policyengine/design-system
```

## Usage

### JavaScript/TypeScript

```typescript
import { colors, typography, spacing } from '@policyengine/design-system/tokens';
import { chartColors, chartLayout } from '@policyengine/design-system/charts';

// Access tokens
const teal = colors.primary[500]; // "#319795"
const fontFamily = typography.fontFamily.primary;
```

### Python

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
CHART_LAYOUT = tokens["charts"]["layout"]
```

### Direct JSON URL

```
https://unpkg.com/@policyengine/design-system/dist/tokens.json
```

## Available Tokens

- **colors** - Brand colors, semantic colors, backgrounds, borders
- **typography** - Font families, sizes, weights, line heights
- **spacing** - Component spacing, layout dimensions, border radii
- **charts** - Plotly chart colors, layout config, dimensions

## License

MIT
