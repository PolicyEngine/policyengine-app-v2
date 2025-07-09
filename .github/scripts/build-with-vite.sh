#!/bin/bash

echo "Starting build process with Vite..."
npm run build
echo "Build completed. Contents of dist/:"
ls -la dist/
echo "Verifying index.html exists:"
test -f dist/index.html && echo "✓ index.html found" || echo "✗ index.html missing"