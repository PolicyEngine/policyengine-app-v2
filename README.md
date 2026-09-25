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

## License

Code in this repository is released under the [MIT License](LICENSE). Original text and figures are released under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) with attribution to PolicyEngine. Third-party data and materials keep their own terms, including third-party logos, screenshots and photos in `app/public/assets/` and the congressional district boundaries in `app/public/data/geojson/`.

`app/scripts/build-parameter-dependency-map.py` imports `policyengine-core` and `policyengine-us`, which are licensed under [AGPL-3.0](https://www.gnu.org/licenses/agpl-3.0.html). The MIT License applies to that script on its own. Running it combines it with those packages, and that combination is subject to AGPL-3.0 as a whole. The web applications in this repository do not include either package.
