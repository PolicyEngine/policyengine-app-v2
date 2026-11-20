#!/usr/bin/env bash
# Requires a changelog fragment when a pull request changes anything in
# packages/api-client, and rejects files in changelog.d that a release could not
# use. Changes elsewhere in the repository need no fragment. Run from the
# repository root. On a pull request, HEAD is GitHub's merge commit and HEAD^1
# is the base branch, so the difference is what merging would change.
set -euo pipefail

PACKAGE_DIRECTORY="packages/api-client"
FRAGMENT_DIRECTORY="${PACKAGE_DIRECTORY}/changelog.d"
FRAGMENT_NAME="^${FRAGMENT_DIRECTORY}/[^/]+\.(added|changed|fixed|removed|breaking)\.md$"
BASE_COMMIT="HEAD^1"
HEAD_COMMIT="HEAD"

CHANGED_FILES=$(git diff --name-only --no-renames "$BASE_COMMIT" "$HEAD_COMMIT" -- "$PACKAGE_DIRECTORY")
ADDED_FRAGMENTS=$(
  git diff --name-only --no-renames --diff-filter=AM "$BASE_COMMIT" "$HEAD_COMMIT" -- "$FRAGMENT_DIRECTORY" \
    | grep -v "^${FRAGMENT_DIRECTORY}/\.gitkeep$" \
    || true
)

INVALID=0
while IFS= read -r FRAGMENT; do
  [ -n "$FRAGMENT" ] || continue
  if ! [[ "$FRAGMENT" =~ $FRAGMENT_NAME ]]; then
    echo "::error file=${FRAGMENT}::Invalid changelog fragment. Use ${FRAGMENT_DIRECTORY}/<name>.<type>.md, where <type> is added, changed, fixed, removed or breaking."
    INVALID=1
  elif [ -z "$(git show "${HEAD_COMMIT}:${FRAGMENT}" | tr -d '[:space:]')" ]; then
    echo "::error file=${FRAGMENT}::This changelog fragment is empty."
    INVALID=1
  fi
done <<< "$ADDED_FRAGMENTS"
if [ "$INVALID" -ne 0 ]; then
  exit 1
fi

if [ -z "$CHANGED_FILES" ]; then
  echo "This pull request does not change ${PACKAGE_DIRECTORY}; no changelog fragment is needed."
  exit 0
fi

if [ -z "$ADDED_FRAGMENTS" ]; then
  echo "::error::This pull request changes ${PACKAGE_DIRECTORY} but adds no changelog fragment."
  echo "Add a fragment: echo 'Your change description' > ${FRAGMENT_DIRECTORY}/<name>.<type>.md"
  echo "Valid types: added, changed, fixed, removed, breaking"
  exit 1
fi

echo "Found changelog fragment(s):"
echo "$ADDED_FRAGMENTS"
