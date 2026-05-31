# 🔥 NGP HabitForge

> **Enterprise-grade habit tracking platform** — built on Django 5.1 + DRF 3.15  
> Production-ready backend with JWT auth, PostgreSQL, Redis, Celery, and a full test suite.

```
╔══════════════════════════════════════════════════════════════╗
║   NGP HABITFORGE  ·  v5.0.0  ·  Django 5.1 + DRF 3.15      ║
║   PostgreSQL 16  ·  Redis 7  ·  Celery 5.4  ·  Python 3.12 ║
║   56 tests passing  ·  89% coverage  ·  0 lint errors       ║
╚══════════════════════════════════════════════════════════════╝
```

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Tech Stack](#tech-stack)
4. [Project Structure](#project-structure)
5. [Getting Started](#getting-started)
6. [Environment Variables](#environment-variables)
7. [API Reference](#api-reference)
8. [Running Tests](#running-tests)
9. [Celery & Async Tasks](#celery--async-tasks)
10. [Development Workflow](#development-workflow)
11. [Roadmap](#roadmap)
12. [Contributing](#contributing)

---

## Overview

NGP HabitForge is a production-grade habit tracking backend. It is not a tutorial project — every decision was made for real-world scale, security, and maintainability.

**What it does:**
- Full habit CRUD with type system (binary, measurable, time-based)
- Automatic streak tracking via database signals
- XP and gamification system
- Social layer — friends, group challenges, activity feed
- Analytics — dashboard metrics, calendar heatmap, weekly breakdown, AI insights
- JWT authentication with refresh token rotation and blacklisting
- Async task processing via Celery (reminders, streak checks, weekly digest)
- GDPR-compliant soft deletes and data export

**What makes it production-ready:**
- UUID primary keys everywhere (no sequential ID exposure)
- Soft delete on users and habits (GDPR right to erasure)
- Split settings per environment (base / development / production / testing)
- Full test suite with `pytest` + `factory-boy` fixtures
- Structured logging to rotating file handler
- OpenAPI 3.0 schema auto-generated via `drf-spectacular`
- Standard response envelope on every endpoint

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     API Clients                          │
│         (Web · Mobile · Third-party integrations)        │
└───────────────────────┬─────────────────────────────────┘
                        │ HTTPS
┌───────────────────────▼─────────────────────────────────┐
│              Django REST Framework                        │
│     /api/v1/  ·  /api/v2/  ·  /api/docs/  /admin/       │
├──────────┬──────────┬──────────┬───────────┬────────────┤
│  users   │  habits  │analytics │  social   │   auth     │
│          │          │          │           │            │
│CustomUser│  Habit   │Dashboard │Friendship │JWT tokens  │
│UserProfile│HabitCompl│ Heatmap  │Challenge  │Blacklist   │
│          │HabitStreak│Insights  │Feed items │Brute-force │
└──────────┴──────────┴──────────┴───────────┴────────────┘
                        │
         ┌──────────────┼──────────────┐
         ▼              ▼              ▼
    PostgreSQL 16     Redis 7       Celery 5.4
    (primary DB)    (cache +      (async tasks:
                     broker)     reminders, streaks,
                                  digest, analytics)
```

### Django Apps

| App | Responsibility |
|-----|---------------|
| `apps.users` | `CustomUser` (UUID PK, email auth), `UserProfile` (1:1, auto-signal) |
| `apps.authentication` | JWT register/login/refresh/logout, brute-force guard, IP tracking |
| `apps.habits` | `Habit`, `HabitCompletion`, `HabitStreak`, `HabitReminder`, `HabitCategory` |
| `apps.analytics` | Dashboard metrics, heatmap, weekly breakdown, AI insights (service layer) |
| `apps.social` | `Friendship`, `GroupChallenge`, `ChallengeParticipant`, `SocialFeedItem` |
| `apps.notifications` | Celery tasks for push/email reminders (FCM/APNs in Phase 2) |
| `apps.gamification` | Badges, XP levels, leaderboard *(in progress)* |
| `apps.audit` | Immutable append-only audit log *(planned)* |
| `core` | Shared pagination, exception handler, health check endpoints |

---

## Tech Stack

| Category | Technology | Version |
|----------|-----------|---------|
| Language | Python | 3.12.3 |
| Framework | Django | 5.1.x |
| API | Django REST Framework | 3.15.x |
| Auth | djangorestframework-simplejwt | 5.x |
| Database | PostgreSQL | 16 |
| Cache / Broker | Redis | 7.x |
| Task Queue | Celery + celery-beat | 5.4.x |
| Dependency Mgmt | Poetry | 2.x |
| Testing | pytest + pytest-django | 8.x / 4.x |
| Fixtures | factory-boy + Faker | 3.x / 26.x |
| Linting | ruff | 0.5.x |
| Formatting | black | 24.x |
| API Schema | drf-spectacular | 0.27.x |
| Static files | whitenoise | 6.x |
| CORS | django-cors-headers | 4.x |
| Env vars | django-environ | 0.11.x |

---

## Project Structure

```
ngp-habitforge/
├── Makefile                    # developer commands
├── pyproject.toml              # Poetry deps + ruff/black config
├── poetry.lock                 # committed, pinned versions
├── .python-version             # 3.12.3 (pyenv)
├── .gitignore
├── logs/                       # django.log (rotating, 10MB x5)
│
└── backend/
    ├── manage.py
    ├── conftest.py             # pytest fixtures (root level)
    ├── pytest.ini
    ├── .env.example            # safe template — copy to .env
    │
    ├── config/
    │   ├── celery.py           # Celery app + beat schedule
    │   ├── urls.py             # root URL config
    │   ├── admin_config.py     # admin branding
    │   └── settings/
    │       ├── base.py         # shared (reads .env)
    │       ├── development.py  # local dev overrides
    │       ├── production.py   # hardened security headers
    │       └── testing.py      # fast hashing, eager Celery
    │
    ├── core/
    │   ├── pagination.py       # StandardResultsPagination
    │   ├── exceptions.py       # custom_exception_handler
    │   └── urls.py             # /healthz/ /healthz/ready/
    │
    ├── api/
    │   ├── v1/urls.py
    │   └── v2/urls.py
    │
    └── apps/
        ├── users/
        ├── authentication/
        ├── habits/
        ├── analytics/
        ├── social/
        ├── notifications/
        ├── gamification/
        └── audit/
```

---

## Getting Started

### Prerequisites

- Ubuntu 22.04+ / macOS 13+
- pyenv
- Python 3.12.3 (via pyenv)
- Poetry 2.x
- PostgreSQL 16
- Redis 7.x

### 1. Clone the repository

```bash
git clone https://github.com/your-org/ngp-habitforge.git
cd ngp-habitforge
```

### 2. Set Python version

```bash
pyenv install 3.12.3    # if not already installed
pyenv local 3.12.3
python --version        # Python 3.12.3
```

### 3. Install dependencies

```bash
poetry config virtualenvs.in-project true
poetry install
```

### 4. Set up PostgreSQL

```bash
sudo -u postgres psql << 'EOF'
CREATE USER ngp_user WITH PASSWORD 'ngp_dev_password';
ALTER USER ngp_user CREATEDB;
CREATE DATABASE ngp_habitforge OWNER ngp_user;
CREATE DATABASE ngp_habitforge_test OWNER ngp_user;
GRANT ALL PRIVILEGES ON DATABASE ngp_habitforge TO ngp_user;
GRANT ALL PRIVILEGES ON DATABASE ngp_habitforge_test TO ngp_user;
\q
EOF
```

### 5. Configure environment

```bash
cp backend/.env.example backend/.env
# Edit backend/.env with your values
```

### 6. Run migrations and seed

```bash
make migrate
make seed
```

### 7. Create a superuser

```bash
make superuser
```

### 8. Start the development server

```bash
make run
```

Visit:
- API docs: http://127.0.0.1:8000/api/docs/
- Admin: http://127.0.0.1:8000/admin/
- Health: http://127.0.0.1:8000/healthz/

---

## Environment Variables

Copy `backend/.env.example` to `backend/.env` and fill in:

```env
# Django
DJANGO_SETTINGS_MODULE=config.settings.development
SECRET_KEY=your-secret-key-minimum-50-characters-long
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

# Database
DATABASE_URL=postgres://ngp_user:your_password@127.0.0.1:5432/ngp_habitforge

# Redis
REDIS_URL=redis://127.0.0.1:6379/0

# CORS
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
```

**Never commit `.env`.** Only `.env.example` is committed.

---

## API Reference

### Base URLs

| Version | URL |
|---------|-----|
| REST v1 | `http://localhost:8000/api/v1/` |
| REST v2 | `http://localhost:8000/api/v2/` |
| Swagger | `http://localhost:8000/api/docs/` |
| ReDoc | `http://localhost:8000/api/redoc/` |

### Standard Response Envelope

Every endpoint returns this shape:

```json
{
  "success": true,
  "data": { "..." },
  "meta": { "message": "optional context" },
  "pagination": {
    "count": 100,
    "next": "https://...?page=2",
    "previous": null
  }
}
```

Error responses:

```json
{
  "success": false,
  "error": { "detail": "Human-readable error message." }
}
```

### Authentication

```bash
# Register
POST /api/v2/auth/register/
{ "email", "username", "password", "password_confirm" }

# Login
POST /api/v2/auth/login/
{ "email", "password" }
→ returns { "access": "eyJ...", "refresh": "eyJ..." }

# Use Bearer token on all protected endpoints
Authorization: Bearer eyJ...

# Refresh token
POST /api/v2/auth/token/refresh/
{ "refresh": "eyJ..." }

# Logout (blacklists token)
POST /api/v2/auth/logout/
{ "refresh": "eyJ..." }
```

### Key Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v2/habits/` | List user's active habits |
| POST | `/api/v2/habits/` | Create a habit |
| POST | `/api/v2/habits/{id}/complete/` | Mark habit done, updates streak |
| GET | `/api/v2/habits/{id}/streak/` | Streak details |
| GET | `/api/v2/analytics/dashboard/` | Dashboard metrics |
| GET | `/api/v2/analytics/heatmap/?year=2026` | Calendar heatmap |
| GET | `/api/v2/social/friends/` | Accepted friends |
| POST | `/api/v2/social/friends/invite/` | Send friend request |
| GET | `/api/v2/social/challenges/` | Group challenges |
| POST | `/api/v2/social/challenges/{id}/join/` | Join a challenge |
| GET | `/api/v2/social/feed/` | Activity feed |
| GET | `/api/v2/users/me/` | Current user profile |
| DELETE | `/api/v2/users/me/` | GDPR account deletion |
| GET | `/api/v2/users/me/export/` | GDPR data export |

Full interactive documentation at `/api/docs/`.

---

## Running Tests

```bash
# Full test suite
make test

# With coverage report
make coverage

# Single file
cd backend && poetry run pytest apps/habits/tests/ -v

# Single test
cd backend && poetry run pytest apps/habits/tests/test_habits.py::TestHabitAPI::test_complete_habit -v
```

Current status:

```
56 tests passing
89% coverage
0 failures
```

### Test structure

```
backend/
├── conftest.py                          # shared fixtures (root)
└── apps/
    ├── users/tests/test_models.py       # 9 tests
    ├── authentication/tests/            # 17 tests
    ├── habits/tests/test_habits.py      # 17 tests
    ├── analytics/tests/                 # 13 tests
    └── social/tests/test_social.py      # 21 tests
```

### Available fixtures

| Fixture | Description |
|---------|-------------|
| `api_client` | Unauthenticated DRF client |
| `user` | A ready-made `CustomUser` |
| `auth_client` | DRF client authenticated as `user` |
| `second_user` | A second user (ownership isolation tests) |
| `second_auth_client` | DRF client authenticated as `second_user` |
| `create_user` | Factory function with defaults |

---

## Celery & Async Tasks

### Start workers

```bash
# Terminal 1 — Django server
make run

# Terminal 2 — Celery worker
make worker

# Terminal 3 — Celery beat (periodic tasks)
make beat
```

### Periodic tasks (beat schedule)

| Task | Schedule | Description |
|------|----------|-------------|
| `check_broken_streaks` | Daily 00:05 UTC | Resets current streak for missed habits |
| `send_morning_reminders` | Daily 07:00 UTC | Sends pending reminders via FCM/APNs |
| `send_weekly_digest` | Monday 08:00 UTC | Per-user weekly summary email |
| `aggregate_hourly_stats` | Every hour | Analytics aggregation heartbeat |

### Task queues

| Queue | Tasks |
|-------|-------|
| `habits` | `check_broken_streaks`, `calculate_user_xp` |
| `notifications` | `send_morning_reminders`, `send_weekly_digest` |
| `analytics` | `aggregate_hourly_stats` |
| `default` | Everything else |

---

## Development Workflow

```bash
make help       # show all available commands

make check      # Django system check
make test       # run full test suite
make lint       # ruff linter
make format     # black + ruff --fix
make coverage   # test + HTML coverage report

make migrate    # apply pending migrations
make migrations # create new migrations
make seed       # seed development data (8 habit categories)
make shell      # Django shell_plus

make run        # dev server :8000
make worker     # Celery worker
make beat       # Celery beat scheduler
```

### Git commit convention

```
feat(app): short description

- detail 1
- detail 2
```

Examples:
- `feat(habits): add habit archiving endpoint`
- `fix(analytics): use TruncDate instead of extra() SQL`
- `test(social): add challenge capacity limit tests`
- `refactor(auth): extract token helpers to utils.py`

---

## Roadmap

### Done ✅

- [x] Phase 1 — System foundation (pyenv, Poetry, PostgreSQL, Redis)
- [x] Phase 2 — Django scaffold (split settings, Celery, API routing)
- [x] Phase 3 — CustomUser model (UUID PK, soft delete, signals)
- [x] Phase 4 — JWT auth (register, login, refresh, logout, GDPR)
- [x] Phase 5 — Habits domain (CRUD, streaks, completions, XP, signals)
- [x] Phase 6 — Analytics (dashboard, heatmap, weekly, insights, service layer)
- [x] Phase 7 — Test suite (56 tests, 89% coverage)
- [x] Phase 8 — Developer workflow (Makefile, Celery tasks, admin branding)
- [x] Phase 9 — Social app (friends, challenges, feed)

### In Progress 🔄

- [ ] Phase 10 — Gamification (badges, XP levels, leaderboard)
- [ ] Phase 11 — Docker + production config
- [ ] Phase 12 — Audit log, rate limiting, full seed data, 95% coverage

### Planned 📋

- [ ] SAML 2.0 / OIDC enterprise SSO
- [ ] Multi-tenancy (Organizations, Teams, Workspaces)
- [ ] GraphQL API layer (Strawberry)
- [ ] WebSocket real-time feed (Django Channels)
- [ ] FCM / APNs push notification delivery
- [ ] SendGrid transactional email
- [ ] NGP BehaviorEngine™ AI integration

---

## Contributing

This is a proprietary platform under active development.

For bug reports, use the issue tracker.  
For security vulnerabilities, see `SECURITY.md`.  
For enterprise licensing, contact `enterprise@ngp.com`.

---

## License

© 2026 NGP (Next Generation Platform). All rights reserved.

Third-party dependencies retain their original licenses.  
See `security/sbom/sbom.spdx.json` for the full Software Bill of Materials.

---

<div align="center">

**NGP HabitForge** — *Behavioral infrastructure for the next generation*

`v5.0.0` · Django 5.1 · PostgreSQL 16 · Python 3.12

</div>
