#!/usr/bin/env bash

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"

cd "$REPO_ROOT"
bun run --filter=@policyengine/calculator build
