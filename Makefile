# Makefile for Hopes & Sorrows - Interactive Emotional Voice Analysis

.PHONY: help install install-dev clean test lint format run-web run-cli setup-db setup-env docs

# Default target
help:
	@echo "🎭 Hopes & Sorrows - Development Commands"
	@echo ""
	@echo "Setup Commands:"
	@echo "  install      - Install production dependencies"
	@echo "  install-dev  - Install development dependencies"
	@echo "  setup-env    - Set up environment file from template"
	@echo "  setup-db     - Initialize database"
	@echo "  setup        - Complete setup (env + dependencies + db)"
	@echo ""
	@echo "Development Commands:"
	@echo "  clean        - Clean up build artifacts and cache"
	@echo "  test         - Run test suite"
	@echo "  lint         - Run linting checks"
	@echo "  format       - Format code with black"
	@echo ""
	@echo "Run Commands:"
	@echo "  run-web      - Start web application"
	@echo "  run-cli      - Start CLI sentiment analysis"
	@echo "  run-audio    - Start audio analysis"
	@echo ""
	@echo "Other Commands:"
	@echo "  docs         - Generate documentation"
	@echo "  docker-build - Build Docker image"
	@echo "  docker-run   - Run Docker container"

# Installation
install:
	@echo "📦 Installing production dependencies..."
	pip3 install -r requirements.txt

install-dev: install
	@echo "🛠️  Installing development dependencies..."
	pip3 install -e ".[dev]"

# Environment setup
setup-env:
	@echo "🔧 Setting up environment file..."
	@if [ ! -f .env ]; then \
		cp env.template .env; \
		echo "✅ Created .env file from template"; \
		echo "⚠️  Please edit .env and add your API keys"; \
	else \
		echo "⚠️  .env file already exists"; \
	fi

setup-db:
	@echo "🗄️  Setting up database..."
	python3 scripts/setup_db.py

setup: setup-env install setup-db
	@echo "✅ Complete setup finished!"
	@echo "📝 Don't forget to edit .env with your API keys"

# Development
clean:
	@echo "🧹 Cleaning up..."
	find . -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
	find . -type f -name "*.pyc" -delete 2>/dev/null || true
	find . -type f -name "*.pyo" -delete 2>/dev/null || true
	find . -type d -name "*.egg-info" -exec rm -rf {} + 2>/dev/null || true
	rm -rf build/ dist/ .coverage htmlcov/ .pytest_cache/ .mypy_cache/
	@echo "✅ Cleanup complete"

test:
	@echo "🧪 Running tests..."
	python3 -m pytest tests/ -v --cov=src/hopes_sorrows --cov-report=html --cov-report=term

lint:
	@echo "🔍 Running linting checks..."
	python3 -m flake8 src/ scripts/ tests/
	python3 -m mypy src/hopes_sorrows --ignore-missing-imports

format:
	@echo "✨ Formatting code..."
	python3 -m black src/ scripts/ tests/ *.py

# Run commands
run-web:
	@echo "🎭 Starting web application..."
	@echo "🌐 Once started, visit: http://localhost:8080"
	python3 scripts/run_web.py

run-cli:
	@echo "🤖 Starting CLI sentiment analysis..."
	python3 scripts/analyze_sentiment.py -i

run-audio:
	@echo "🎤 Starting audio analysis..."
	python3 main.py audio

# Documentation
docs:
	@echo "📚 Generating documentation..."
	@echo "Documentation available in docs/ directory"

# Docker commands
docker-build:
	@echo "🐳 Building Docker image..."
	docker build -t hopes-sorrows:latest .

docker-run:
	@echo "🐳 Running Docker container..."
	docker run -p 8080:8080 -v $(PWD)/data:/app/data hopes-sorrows:latest

# Development server with auto-reload
dev-server:
	@echo "🔥 Starting development server with auto-reload..."
	FLASK_ENV=development python3 scripts/run_web.py 