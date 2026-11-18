#!/usr/bin/env bash
#
# Multi-zone asset scoping check
#
# When external Next.js apps are served via Vercel rewrites on policyengine.org,
# their CSS/JS assets must be scoped under a basePath or assetPrefix.
# Otherwise, the browser loads the host website's assets instead — breaking styles.
#
# This script fetches each external app and checks for bare /_next/ asset paths.
#
# Usage: bash scripts/check-multizone-assets.sh

set -euo pipefail

CONFIG="website/next.config.ts"
FAILURES=0
COUNTRIES="us uk"
CHECKED_DOMAINS=""

# --- Step 1: Extract rewrite destination URLs from next.config.ts ---
#
# We want concrete URLs to curl, so we:
#   - Skip /_zones/* rewrites (these are asset proxies, not app pages)
#   - Skip :path* wildcards (can't curl a wildcard)
#   - Replace :countryId with real country codes (us, uk) to get testable URLs

get_rewrite_urls() {
  local raw
  raw=$(grep -oE 'destination:\s*"https://[^"]+' "$CONFIG" \
    | sed 's/destination: *"//' \
    | grep -v '/_zones/' \
    | grep -v ':path\*')

  # For URLs with :countryId, expand to one URL per country.
  # For URLs without, pass through as-is.
  echo "$raw" | while read -r url; do
    if echo "$url" | grep -q ':countryId'; then
      for country in $COUNTRIES; do
        echo "$url" | sed "s/:countryId/$country/"
      done
    else
      echo "$url"
    fi
  done | sort -u
}

# --- Step 2: For a given URL, fetch the HTML and check asset paths ---

check_app() {
  local url="$1"
  local domain
  domain=$(echo "$url" | sed 's|https://||;s|/.*||')

  # Skip if we already checked this domain (e.g. /us/model and /uk/model are the same app)
  if echo "$CHECKED_DOMAINS" | grep -q "$domain"; then
    return
  fi
  CHECKED_DOMAINS="$CHECKED_DOMAINS $domain"

  # Fetch the page to a temp file (large HTML can break echo piping in bash)
  local tmpfile
  tmpfile=$(mktemp)
  curl -sL --max-time 10 "$url" > "$tmpfile" 2>/dev/null || true

  if [ ! -s "$tmpfile" ]; then
    echo "  SKIP $domain (unreachable)"
    rm -f "$tmpfile"
    return
  fi

  # Is this a Next.js app? (non-Next.js apps don't have _next in their HTML)
  if ! grep -q '_next' "$tmpfile"; then
    echo "  SKIP $domain (not Next.js)"
    rm -f "$tmpfile"
    return
  fi

  # Check asset path patterns in src="" or href="" attributes:
  #
  # Good:  src="/us/keep-your-pay-act/_next/static/chunks/abc.js"  (basePath scoped)
  # Good:  href="/_zones/household-api-docs/_next/static/css/abc.css"  (assetPrefix scoped)
  # Bad:   src="/_next/static/chunks/abc.js"  (bare — will collide with host)
  # Warn:  src="https://some-app.vercel.app/_next/..."  (absolute — works but not ideal)

  local bare_refs
  bare_refs=$(grep -oE '(src|href)="/_next/[^"]*"' "$tmpfile" || true)

  local absolute_refs
  absolute_refs=$(grep -oE '(src|href)="https://[^"]*/_next/[^"]*"' "$tmpfile" || true)

  if [ -n "$bare_refs" ]; then
    echo "  FAIL $domain"
    echo ""
    echo "       WHAT'S WRONG:"
    echo "       This app's CSS/JS loads from bare /_next/ which will break when served"
    echo "       through policyengine.org (its assets collide with the main website's)."
    echo ""
    echo "       Examples of bad asset paths found:"
    echo "$bare_refs" | head -2 | sed 's/^/         /'
    echo ""
    echo "       HOW TO FIX (in the external app's repo, not this one):"
    echo "       If the app uses 'output: export' in next.config (static site):"
    echo "         1. Add assetPrefix: '/_zones/<repo-name>' to the app's next.config"
    echo "         2. Add a rewrite in the app's vercel.json:"
    echo "            { \"source\": \"/_zones/<repo-name>/_next/:path*\", \"destination\": \"/_next/:path*\" }"
    echo "         3. Add a zone proxy rewrite in this repo's website/next.config.ts:"
    echo "            { source: \"/_zones/<repo-name>/:path*\", destination: \"https://$domain/_zones/<repo-name>/:path*\" }"
    echo "         Reference: see household-api-docs repo for a working example."
    echo ""
    echo "       If the app is server-rendered (no 'output: export'):"
    echo "         Add basePath: '/<route-path>' to the app's next.config"
    echo "         (e.g., basePath: '/us/my-tool')"
    echo "         Reference: see keep-your-pay-act repo for a working example."
    echo ""
    FAILURES=$((FAILURES + 1))
  elif [ -n "$absolute_refs" ]; then
    echo "  WARN $domain"
    echo "       Assets load from absolute URL (https://$domain/...) instead of through policyengine.org."
    echo "       This works but is not ideal. Consider using a relative /_zones/ assetPrefix instead."
  else
    echo "  OK   $domain"
  fi

  rm -f "$tmpfile"
}

# --- Main ---

echo "Checking asset scoping for external apps..."
echo ""

for url in $(get_rewrite_urls); do
  check_app "$url"
done

echo ""
if [ "$FAILURES" -gt 0 ]; then
  echo "FAILED: $FAILURES app(s) have unscoped assets."
  echo "Docs: https://nextjs.org/docs/app/guides/multi-zones"
  exit 1
fi
echo "PASSED: All external apps have properly scoped assets."
