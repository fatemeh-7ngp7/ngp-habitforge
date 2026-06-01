# ─────────────────────────────────────────────────────────────────────────────
# NGP HabitForge — Developer Makefile
# Usage: make <target>
# ─────────────────────────────────────────────────────────────────────────────

.PHONY: help run worker beat shell migrate migrations test lint format \
        coverage check clean superuser seed urls reset-db

# Default target
help:
	@echo ""
	@echo "  NGP HabitForge — Available commands"
	@echo "  ────────────────────────────────────────────────────────"
	@echo "  make run          Start Django dev server (port 8000)"
	@echo "  make worker       Start Celery worker"
	@echo "  make beat         Start Celery beat scheduler"
	@echo "  make shell        Django interactive shell"
	@echo "  make migrate      Apply all pending migrations"
	@echo "  make migrations   Create new migrations (makemigrations)"
	@echo "  make test         Run full pytest suite"
	@echo "  make coverage     Run tests + coverage report"
	@echo "  make lint         Run ruff linter"
	@echo "  make format       Run black + ruff formatter"
	@echo "  make check        Django system check"
	@echo "  make superuser    Create a superuser"
	@echo "  make seed         Seed development data"
	@echo "  make urls         Print all registered URL patterns"
	@echo "  make clean        Remove .pyc, __pycache__, .coverage"
	@echo "  make reset-db     ⚠️  Drop + recreate dev database"
	@echo ""

# ── Server ────────────────────────────────────────────────────────────────────
run:
	cd backend && poetry run python manage.py runserver

# ── Celery ────────────────────────────────────────────────────────────────────
worker:
	cd backend && poetry run celery -A config worker \
		--loglevel=info \
		--concurrency=4 \
		-Q default,habits,notifications,analytics

beat:
	cd backend && poetry run celery -A config beat \
		--loglevel=info \
		--scheduler django_celery_beat.schedulers:DatabaseScheduler

# ── Django management ─────────────────────────────────────────────────────────
shell:
	cd backend && poetry run python manage.py shell_plus

migrate:
	cd backend && poetry run python manage.py migrate

migrations:
	cd backend && poetry run python manage.py makemigrations

check:
	cd backend && poetry run python manage.py check

superuser:
	cd backend && poetry run python manage.py createsuperuser

urls:
	cd backend && poetry run python manage.py show_urls

# ── Testing ───────────────────────────────────────────────────────────────────
test:
	cd backend && poetry run pytest --tb=short -v

coverage:
	cd backend && poetry run pytest \
		--cov=apps \
		--cov=core \
		--cov-report=term-missing \
		--cov-report=html:htmlcov \
		--tb=short -q
	@echo ""
	@echo "  HTML report: backend/htmlcov/index.html"

# ── Code quality ──────────────────────────────────────────────────────────────
lint:
	cd backend && poetry run ruff check apps/ core/ config/ --config ../pyproject.toml

format:
	cd backend && poetry run black apps/ core/ config/ && \
	poetry run ruff check --fix apps/ core/ config/

# ── Seed data ─────────────────────────────────────────────────────────────────
seed:
	cd backend && poetry run python scripts/seed_data.py

# ── Cleanup ───────────────────────────────────────────────────────────────────
clean:
	find . -type f -name "*.pyc" -delete
	find . -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
	find . -name ".coverage" -delete
	find . -name "*.egg-info" -exec rm -rf {} + 2>/dev/null || true
	@echo "✅ Cleaned"

# ── Database reset (DESTRUCTIVE) ──────────────────────────────────────────────
reset-db:
	@echo "⚠️  This will DROP and recreate ngp_habitforge. Are you sure?"
	@read -p "Type 'yes' to continue: " confirm && [ "$$confirm" = "yes" ]
	sudo -u postgres psql -c "DROP DATABASE IF EXISTS ngp_habitforge;"
	sudo -u postgres psql -c "CREATE DATABASE ngp_habitforge OWNER ngp_user;"
	cd backend && poetry run python manage.py migrate
	@echo "✅ Database reset complete"
