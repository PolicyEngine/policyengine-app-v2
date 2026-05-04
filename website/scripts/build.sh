#!/usr/bin/env bash

set -euo pipefail

WEBSITE_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
APP_ASSETS_DIR="$WEBSITE_ROOT/../app/public/assets"
WEBSITE_ASSETS_DIR="$WEBSITE_ROOT/public/assets"

ORIGINAL_ASSETS_LINK=""
if [ -L "$WEBSITE_ASSETS_DIR" ]; then
  ORIGINAL_ASSETS_LINK="$(readlink "$WEBSITE_ASSETS_DIR")"
fi

restore_assets_link() {
  if [ -n "$ORIGINAL_ASSETS_LINK" ]; then
    rm -rf "$WEBSITE_ASSETS_DIR"
    ln -s "$ORIGINAL_ASSETS_LINK" "$WEBSITE_ASSETS_DIR"
  fi
}

if [ -z "${VERCEL:-}" ] && [ -z "${CI:-}" ]; then
  trap restore_assets_link EXIT
fi

rm -rf "$WEBSITE_ASSETS_DIR"
mkdir -p "$WEBSITE_ROOT/public"
cp -R "$APP_ASSETS_DIR" "$WEBSITE_ASSETS_DIR"

echo "[build.sh] Copied assets. Verifying citation images:"
ls "$WEBSITE_ASSETS_DIR/citations/" | grep -E "uhero|vermont|booker" || echo "[build.sh] no matching citation images found"

cd "$WEBSITE_ROOT"
bun run build:next
