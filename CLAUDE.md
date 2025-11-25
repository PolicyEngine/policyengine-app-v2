# PolicyEngine App v2 Development Guidelines

## Branding & Logos

### Color Palette
- **Teal** is the current brand color (not blue)
- Old blue assets from `policyengine-app` should be updated to teal

### Logo Assets Location
All logos are in `app/public/assets/logos/policyengine/`:

| File | Type | Description |
|------|------|-------------|
| `teal.png` | Wide | Teal "POLICY ENGINE" logo |
| `teal.svg` | Wide | SVG version |
| `teal-square.png` | Square | Teal PE icon (trimmed) |
| `teal-square.svg` | Square | SVG version |
| `white.png` | Wide | White logo (for dark backgrounds) |
| `white.svg` | Wide | SVG version |
| `white-square.svg` | Square | White PE icon SVG |

### Favicon
- Located at `app/src/favicon.svg`
- Uses the teal-square logo

### Chart Watermarks in Research Posts
- Posts reference logos via URL path (e.g., `/assets/logos/policyengine/teal-square.png`)
- Chart watermarks need public URLs, so logos must be in `public/`
- Legacy posts may use `/logo512.png` or GitHub raw URLs - these should be updated to the standard path

### Component Logo Usage
Components reference logos from public path:
```tsx
const PolicyEngineLogo = '/assets/logos/policyengine/white.svg';
```

## Project Structure

- `app/` is the Vite project root
- `app/public/` - Static assets served at exact URLs
- `app/src/` - Source code processed by bundler

## Before Committing

1. Run `cd app && npm run prettier -- --write .` to format
2. Run `npm run lint` to check for errors
3. CI uses `--max-warnings 0` so fix all warnings
