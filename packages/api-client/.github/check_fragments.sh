#!/usr/bin/env bash
# Check whether changelog.d/ contains any fragments (ignoring .gitkeep).
# Sets the GitHub Actions output "count" so later steps can skip if 0.
set -euo pipefail

FRAGMENTS=$(ls changelog.d/ | grep -cv .gitkeep || true)
echo "count=$FRAGMENTS" >> "$GITHUB_OUTPUT"

if [ "$FRAGMENTS" -eq 0 ]; then
  echo "No changelog fragments found — skipping release."
else
  echo "Found $FRAGMENTS changelog fragment(s)."
fi
