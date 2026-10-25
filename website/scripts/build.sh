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

cd "$WEBSITE_ROOT"
# Production builds don't read webpack's cache (see next.config.ts). Drop the
# packs an older build left, so Vercel doesn't restore and re-upload them.
rm -rf .next/cache/webpack
bun run build:next
# Fail the build if its CSS lacks a class of a fresh compile of the source, or
# has a Tailwind utility the fresh compile lacks.
node ../scripts/check-built-css.mjs . src/app/globals.css
