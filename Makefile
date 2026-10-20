.PHONY: help install dev build test lint format clean deploy

help:
	@echo "Available commands:"
	@echo "  make install    - Install dependencies"
	@echo "  make dev        - Start Next.js website + calculator dev servers"
	@echo "  make build      - Build the website and calculator"
	@echo "  make typecheck  - Run type checks"
	@echo "  make test       - Run tests"
	@echo "  make lint       - Run linters"
	@echo "  make format     - Format code"
	@echo "  make clean      - Clean build artifacts"
	@echo "  make deploy     - Build; Vercel deploys from main"

install:
	bun install

dev:
	bun run dev

build:
	bun run build

typecheck:
	cd app && bun run typecheck

test-all:
	cd app && bun run test-all

test:
	cd app && bun run test

lint:
	cd app && bun run lint

format:
	cd app && bun run prettier:write

clean:
	rm -rf website/.next calculator-app/.next app/node_modules node_modules packages/*/node_modules

deploy: build
	@echo "Build complete. Vercel deploys website/ and calculator-app/ from main"
