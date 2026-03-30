#!/usr/bin/env bash

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"

cd "$REPO_ROOT/packages/design-system"
bun run build

cd "$REPO_ROOT/calculator-app"
bun run build
