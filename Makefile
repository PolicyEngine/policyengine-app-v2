.PHONY: help install dev build test lint format clean deploy

help:
	@echo "Available commands:"
	@echo "  make install    - Install dependencies"
	@echo "  make dev        - Start development server"
	@echo "  make build      - Build production version"
	@echo "  make typecheck  - Run type checks"
	@echo "  make test       - Run tests"
	@echo "  make lint       - Run linters"
	@echo "  make format     - Format code"
	@echo "  make clean      - Clean build artifacts"
	@echo "  make deploy     - Build and deploy to GitHub Pages"

install:
	bun install

dev:
	bun run dev

build:
	cd app && bun run build-with-types

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
	rm -rf app/dist app/node_modules node_modules packages/*/node_modules

deploy: build
	@echo "Build complete. GitHub Actions will handle deployment"
