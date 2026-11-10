.PHONY: help install dev build typecheck test-all test lint format clean deploy

help:
	@echo "Available commands:"
	@echo "  make install    - Install dependencies"
	@echo "  make dev        - Start Next.js website + calculator dev servers"
	@echo "  make build      - Build the website and calculator"
	@echo "  make typecheck  - Run type checks (app, website, calculator, packages)"
	@echo "  make test       - Run tests (app, website, packages)"
	@echo "  make lint       - Run linters and Prettier checks"
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
	cd website && bun run typecheck
	cd calculator-app && bun run typecheck
	cd packages/public-api-forwarding && bun run typecheck
	cd packages/api-client && bun run typecheck

test-all:
	cd app && bun run test-all

test:
	cd app && bun run test
	cd website && bun run test
	cd packages/public-api-forwarding && bun run test
	cd packages/api-client && bun run test

lint:
	cd app && bun run lint && bun run prettier
	cd website && bun run lint && bun run format:check
	cd calculator-app && bun run lint && bun run format:check
	cd packages/public-api-forwarding && bun run format:check
	cd packages/api-client && bun run format:check

format:
	cd app && bun run prettier:write
	cd website && bun run format
	cd calculator-app && bun run format
	cd packages/public-api-forwarding && bun run format
	cd packages/api-client && bun run format

clean:
	rm -rf website/.next calculator-app/.next app/node_modules node_modules packages/*/node_modules

deploy: build
	@echo "Build complete. Vercel deploys website/ and calculator-app/ from main"
