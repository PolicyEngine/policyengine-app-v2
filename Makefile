.PHONY: help install dev build test lint format clean deploy

help:
	@echo "Available commands:"
	@echo "  make install    - Install dependencies"
	@echo "  make dev        - Start development server"
	@echo "  make build      - Build production version"
	@echo "  make test       - Run tests"
	@echo "  make lint       - Run linters"
	@echo "  make format     - Format code"
	@echo "  make clean      - Clean build artifacts"
	@echo "  make deploy     - Build and deploy to GitHub Pages"

install:
	cd app && npm install

dev:
	cd app && npm run dev

build:
	cd app && npm run build-with-types

typecheck:
	cd app && npm run typecheck

test:
	cd app && npm run test

lint:
	cd app && npm run lint

format:
	cd app && npm run prettier:write

clean:
	rm -rf app/dist app/node_modules

deploy: build
	@echo "Build complete. GitHub Actions will handle deployment"