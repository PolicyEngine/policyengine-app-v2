#!/bin/bash
# Vercel build script for the Next.js website.
# Resolves symlinks by copying shared files before building.

set -e

cd ..
bun run design-system:build

# Copy symlinked content that Vercel can't follow
rm -f website/public/assets
cp -r app/public/assets website/public/assets
cp -f app/src/data/posts/posts.json website/src/data/posts/posts.json
cp -f app/src/data/posts/authors.json website/src/data/posts/authors.json

cd website
bun run build
