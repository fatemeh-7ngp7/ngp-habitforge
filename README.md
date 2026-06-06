<div align="center">

```
╔══════════════════════════════════════════════════════════════════════════════╗
║                                                                              ║
║     ███╗   ██╗ ██████╗ ██████╗     ██╗  ██╗ █████╗ ██████╗ ██╗████████╗   ║
║     ████╗  ██║██╔════╝ ██╔══██╗    ██║  ██║██╔══██╗██╔══██╗██║╚══██╔══╝   ║
║     ██╔██╗ ██║██║  ███╗██████╔╝    ███████║███████║██████╔╝██║   ██║      ║
║     ██║╚██╗██║██║   ██║██╔═══╝     ██╔══██║██╔══██║██╔══██╗██║   ██║      ║
║     ██║ ╚████║╚██████╔╝██║         ██║  ██║██║  ██║██████╔╝██║   ██║      ║
║     ╚═╝  ╚═══╝ ╚═════╝ ╚═╝         ╚═╝  ╚═╝╚═╝  ╚═╝╚═════╝ ╚═╝   ╚═╝      ║
║                                                                              ║
║              F O R G E                                                       ║
║     ──────────────────────────────────────────────────────────────────────  ║
║     Behavioral Infrastructure for the Next Generation of Human Performance  ║
║                                                                              ║
║   v5.0.0  ·  Django 5.1  ·  PostgreSQL 16  ·  Python 3.12  ·  Redis 7     ║
║   77 tests passing  ·  87%+ coverage  ·  0 lint errors  ·  Phase 10 ✅     ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝
```

**Built by NGP. Engineered to outperform.**

[![Python](https://img.shields.io/badge/Python-3.12.3-3776AB?style=flat-square&logo=python&logoColor=white)](https://python.org)
[![Django](https://img.shields.io/badge/Django-5.1-092E20?style=flat-square&logo=django&logoColor=white)](https://djangoproject.com)
[![DRF](https://img.shields.io/badge/DRF-3.15-ff1709?style=flat-square)](https://django-rest-framework.org)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791?style=flat-square&logo=postgresql&logoColor=white)](https://postgresql.org)
[![Redis](https://img.shields.io/badge/Redis-7.x-DC382D?style=flat-square&logo=redis&logoColor=white)](https://redis.io)
[![Celery](https://img.shields.io/badge/Celery-5.4-37814A?style=flat-square)](https://celeryproject.org)
[![Coverage](https://img.shields.io/badge/coverage-87%25-brightgreen?style=flat-square)](https://coverage.readthedocs.io)
[![Tests](https://img.shields.io/badge/tests-77%20passing-brightgreen?style=flat-square)](https://pytest.org)
[![License](https://img.shields.io/badge/license-Proprietary-red?style=flat-square)](./LICENSE)

</div>

---

## A Message from NGP Leadership

> *"I spent three decades at Meta watching us build systems that kept people scrolling. NGP exists to build systems that keep people growing. HabitForge is not a habit tracker. It is behavioral infrastructure — the kind of backend architecture we would have spent eighteen months designing in a team of forty. We built it in weeks, and we built it right. This is what happens when you take enterprise discipline and apply it to human potential."*
>
> — **NGP Founding Team**

---

## Table of Contents

1. [What Is NGP HabitForge?](#what-is-ngp-habitforge)
2. [Why NGP Wins](#why-ngp-wins)
3. [System Architecture](#system-architecture)
4. [Tech Stack — Every Decision Justified](#tech-stack--every-decision-justified)
5. [Complete File Structure](#complete-file-structure)
6. [Django Application Map](#django-application-map)
7. [API Reference](#api-reference)
8. [Authentication & Security](#authentication--security)
9. [Gamification Engine](#gamification-engine)
10. [Social Layer](#social-layer)
11. [Analytics Pipeline](#analytics-pipeline)
12. [Async Task System (Celery)](#async-task-system-celery)
13. [Getting Started — Local Development](#getting-started--local-development)
14. [Docker — Production Deployment](#docker--production-deployment)
15. [Environment Variables — Complete Reference](#environment-variables--complete-reference)
16. [Testing](#testing)
17. [Developer Workflow (Makefile)](#developer-workflow-makefile)
18. [Security Architecture](#security-architecture)
19. [Roadmap — Zero to One Hundred](#roadmap--zero-to-one-hundred)
20. [Contributing & Governance](#contributing--governance)
21. [License](#license)

---

## What Is NGP HabitForge?

NGP HabitForge is a **production-grade, enterprise-class behavioral tracking platform**. It is the backend spine of NGP's consumer and B2B product suite — designed from day one for scale, compliance, and extensibility.

### What It Does

- **Habit Management** — Full CRUD with three habit types: binary (did it or not), measurable (track a quantity), and time-based (duration goals).
- **Streak Intelligence** — Signal-driven streak tracking. Every completion fires a database signal that recalculates streak state atomically. No cron jobs needed for the core loop.
- **Gamification Engine** — XP accumulation, level thresholds, badge award engine, and a period-based leaderboard system. Real behavioral reinforcement, not cosmetic points.
- **Social Layer** — Bidirectional friendships, group challenges with capacity management, and an activity feed scoped by social graph.
- **Analytics Dashboard** — Service-layer analytics (thin views, fat services): heatmap data, weekly breakdown, streaks at a glance, and AI-powered behavioral insights.
- **Async Infrastructure** — Celery 5.4 with four named queues: `habits`, `analytics`, `notifications`, `default`. Beat scheduler for periodic tasks.
- **GDPR Compliance** — Soft delete everywhere. Right-to-erasure endpoint. Data export endpoint. All personally identifiable data stays auditable for 30 days before hard purge.

### What Makes It Different

This is not a tutorial project with production aspirations. Every architectural decision was made with explicit reasoning:

| Decision | Reasoning |
|----------|-----------|
| UUID primary keys everywhere | No sequential ID exposure, safe for distributed systems and external API consumers |
| Email as `USERNAME_FIELD` | Modern UX — users don't remember usernames, they remember emails |
| Soft delete (`deleted_at`) | GDPR Article 17 compliance with a 30-day purge window |
| Service layer in analytics | Keeps views thin and services independently testable |
| `TruncDate` not `extra()` SQL | ORM-native, database-agnostic, no raw SQL in the analytics hot path |
| JWT family rotation | Refresh token families prevent token replay attacks |
| Split settings (4 files) | Zero `if DEBUG:` branching in `base.py` — clean per-environment configs |
| `conftest.py` at `backend/` root | pytest shares fixtures strictly downward — architecture enforces correctness |
| `CELERY_TASK_ALWAYS_EAGER=True` in testing | Tasks run synchronously in tests, no worker process overhead |

---

## Why NGP Wins

The consumer behavioral software market is dominated by apps that optimize for engagement rather than outcomes. NGP HabitForge is designed around a different thesis: **deep behavioral data, enterprise security, and a platform API that third-party wellness apps, HR tools, and corporate coaching platforms can build on**.

The platform is positioned to compete with and displace:

- **Consumer habit trackers** (Habitica, Streaks, Fabulous) — on depth of analytics and social graph
- **Enterprise wellness platforms** (Virgin Pulse, Wellable) — on developer-first API design and open extensibility
- **Social fitness platforms** (Strava's social layer) — on habit generality beyond physical fitness

The moat is the **behavioral data layer** — a richly structured, time-series-friendly PostgreSQL schema that feeds the NGP BehaviorEngine™ AI module (Phase 14). Every completion, every streak break, every challenge result is a labeled training signal.

---

## System Architecture

```
┌──────────────────────────────────────────────────────────────────────────┐
│                           API Consumer Layer                              │
│       Web App (React/Next.js) · iOS (Swift) · Android (Kotlin)           │
│       B2B Partners · Third-party Wellness Integrations                    │
└──────────────────────────────┬───────────────────────────────────────────┘
                               │ HTTPS / TLS 1.3
┌──────────────────────────────▼───────────────────────────────────────────┐
│                         NGINX (Reverse Proxy)                             │
│          Rate limiting · Static file serving · SSL termination            │
└──────────────────────────────┬───────────────────────────────────────────┘
                               │
┌──────────────────────────────▼───────────────────────────────────────────┐
│                    Gunicorn (WSGI Application Server)                     │
│                     Workers: 2×CPU+1 · Timeout: 120s                     │
└──────────────────────────────┬───────────────────────────────────────────┘
                               │
┌──────────────────────────────▼───────────────────────────────────────────┐
│                   Django 5.1 + Django REST Framework 3.15                 │
│                                                                            │
│   /api/v1/ (legacy compat) ·  /api/v2/ (current) · /api/docs/ · /admin/ │
│                                                                            │
│  ┌──────────┬──────────┬──────────┬──────────┬────────────┬────────────┐ │
│  │  users   │  auth    │  habits  │ analytics│   social   │gamification│ │
│  ├──────────┼──────────┼──────────┼──────────┼────────────┼────────────┤ │
│  │CustomUser│ JWT Auth │  Habit   │Dashboard │ Friendship │   Badge    │ │
│  │UserProfile│ Brute-  │HabitCompl│ Heatmap  │GroupChallng│  UserXP    │ │
│  │          │ force    │HabitStreak│ Insights │SocialFeed  │Leaderboard │ │
│  │          │ guard    │HabitRemndr│ Service  │            │ XPLevel    │ │
│  └──────────┴──────────┴──────────┴──────────┴────────────┴────────────┘ │
│                                                                            │
│   core/ (pagination, exceptions, healthz)                                  │
│   audit/ (immutable append-only log — Phase 12)                            │
│   notifications/ (Celery tasks, FCM/APNs — Phase 13)                       │
└──────┬───────────────────────────────────────────────────────────┬────────┘
       │                                                           │
       ▼                                                           ▼
┌──────────────┐   ┌──────────────┐   ┌──────────────────────────────────┐
│ PostgreSQL 16│   │   Redis 7    │   │         Celery 5.4               │
│              │   │              │   │                                  │
│ Primary data │   │ Cache layer  │   │  Worker queues:                  │
│ UUID PKs     │   │ Celery broker│   │  - habits (streaks, XP)          │
│ JSONB fields │   │ Session data │   │  - analytics (aggregation)       │
│ Soft deletes │   │ Rate limit   │   │  - notifications (FCM/APNs)      │
│ Time-series  │   │ counters     │   │  - default                       │
│ ready schema │   │              │   │                                  │
└──────────────┘   └──────────────┘   │  Beat schedule:                  │
                                      │  - 00:05 UTC daily (streaks)     │
                                      │  - 07:00 UTC daily (reminders)   │
                                      │  - Mon 08:00 UTC (digest)        │
                                      │  - Hourly (analytics heartbeat)  │
                                      └──────────────────────────────────┘
```

### Request Lifecycle

```
Client Request
     │
     ▼
NGINX (rate limit check → 429 if exceeded)
     │
     ▼
Gunicorn (WSGI dispatch)
     │
     ▼
Django Middleware Stack:
  SecurityMiddleware → SessionMiddleware → CorsMiddleware
  → CommonMiddleware → CsrfViewMiddleware → AuthMiddleware
  → MessageMiddleware → XFrameOptionsMiddleware
     │
     ▼
JWT Authentication (SimpleJWT)
  → token valid? → extract user from payload
  → token invalid → 401 Unauthorized
     │
     ▼
DRF View → Serializer → Service Layer (if analytics)
     │
     ▼
PostgreSQL Query (queryset scoped to user, deleted_at__isnull=True)
     │
     ▼
Standard Response Envelope:
  { "success": true, "data": {...}, "meta": {...}, "pagination": {...} }
     │
     ▼
Async side effects → Celery task enqueued to Redis
```

---

## Tech Stack — Every Decision Justified

| Category | Technology | Version | Why This Choice |
|----------|-----------|---------|-----------------|
| **Language** | Python | 3.12.3 | Mature ecosystem, pyenv-pinned for reproducibility |
| **Framework** | Django | 5.1.x | Battle-tested ORM, admin, migrations, signals |
| **REST API** | Django REST Framework | 3.15.x | Industry standard; serializers, viewsets, routers |
| **Auth** | djangorestframework-simplejwt | 5.x | Token blacklist support, family rotation, minimal overhead |
| **Database** | PostgreSQL | 16 | JSONB, UUID native, `TruncDate`, full ACID compliance |
| **Cache / Broker** | Redis | 7.x | Sub-millisecond cache, battle-tested Celery broker |
| **Task Queue** | Celery + celery-beat | 5.4.x | Distributed async tasks, periodic scheduling without cron |
| **Dependency Mgmt** | Poetry | 2.x | Lockfile discipline, grouped dev deps, virtualenv in-project |
| **Testing** | pytest + pytest-django | 8.x / 4.x | Fixtures, parametrize, excellent DRF test client integration |
| **Test Factories** | factory-boy + Faker | 3.x / 26.x | Declarative test data without fixtures files |
| **Linting** | ruff | 0.5.x | 10–100× faster than flake8, isort integrated |
| **Formatting** | black | 24.x | Zero-config, non-negotiable formatting discipline |
| **API Schema** | drf-spectacular | 0.27.x | Auto-generates OpenAPI 3.0, powers Swagger UI + ReDoc |
| **Static Files** | whitenoise | 6.x | Serves static assets without a separate CDN in dev |
| **CORS** | django-cors-headers | 4.x | Granular per-origin control |
| **Env Vars** | django-environ | 0.11.x | `.env` loading with type casting, no raw `os.environ` |
| **WSGI Server** | Gunicorn | 22.x | Production-hardened, sync workers, graceful reload |
| **Reverse Proxy** | NGINX | 1.25 | Static file acceleration, SSL termination, upstream buffering |
| **Containerization** | Docker + Compose | 27.x | Reproducible dev + prod environments |

### Frontend (Phase 15 — React Web App)

| Category | Technology | Version |
|----------|-----------|---------|
| Framework | React + Next.js 15 | App Router |
| Language | TypeScript | 5.x |
| Styling | Tailwind CSS | 3.x |
| State Management | Zustand | 4.x |
| Data Fetching | TanStack Query | 5.x |
| Charts | Recharts | 2.x |
| Component Library | Radix UI primitives | — |

---

## Complete File Structure

```
ngp-habitforge/                              ← Git repository root
│
├── Makefile                                 ← All developer commands (see §Developer Workflow)
├── pyproject.toml                           ← Poetry deps + ruff/black config
├── poetry.lock                              ← Pinned versions — NEVER hand-edit
├── .python-version                          ← 3.12.3 (pyenv auto-selection)
├── .gitignore                               ← Excludes .env, .venv, __pycache__, *.pyc
├── docker-compose.yml                       ← Dev stack: django + postgres + redis + celery
├── docker-compose.prod.yml                  ← Prod stack: + nginx, gunicorn, hardened
├── ngp-habitforge.jsx                       ← React UI prototype / design reference
│
├── logs/                                    ← Runtime log directory
│   └── django.log                           ← Rotating: 10MB × 5 files
│
├── nginx/                                   ← NGINX configuration
│   └── nginx.conf                           ← Upstream proxy, static, SSL, gzip, headers
│
├── frontend/                                ← React/Next.js web application (Phase 15)
│   ├── package.json
│   ├── tsconfig.json
│   └── src/
│       ├── app/                             ← Next.js App Router pages
│       ├── components/                      ← Shared UI components
│       ├── hooks/                           ← Custom React hooks
│       ├── lib/                             ← API client, auth helpers
│       └── types/                           ← TypeScript type definitions
│
└── backend/                                 ← Django project root
    ├── manage.py                            ← DJANGO_SETTINGS_MODULE=config.settings.development
    ├── conftest.py                          ← pytest fixtures — ROOT level (critical placement)
    ├── pytest.ini                           ← Points to config.settings.testing
    ├── .env                                 ← Local secrets (NOT committed)
    ├── .env.example                         ← Committed safe template
    ├── Dockerfile                           ← Multi-stage build: builder → runtime, non-root user
    ├── Dockerfile.worker                    ← Celery worker image
    ├── gunicorn.conf.py                     ← Workers, timeout, bind, access log config
    ├── staticfiles/                         ← WhiteNoise-served static assets
    │
    ├── config/                              ← Django project config package
    │   ├── __init__.py                      ← Imports Celery app (enables autodiscovery)
    │   ├── celery.py                        ← Celery app definition + beat schedule
    │   ├── urls.py                          ← Root URL dispatcher
    │   ├── wsgi.py                          ← WSGI entrypoint (Gunicorn)
    │   ├── asgi.py                          ← ASGI entrypoint (Channels, Phase 13)
    │   ├── admin_config.py                  ← Admin site branding (NGP theme)
    │   └── settings/
    │       ├── __init__.py
    │       ├── base.py                      ← Shared settings (reads .env via django-environ)
    │       ├── development.py               ← DEBUG=True, console email backend
    │       ├── production.py                ← HTTPS, HSTS, CSP, hardened security headers
    │       └── testing.py                   ← Argon2 → MD5 hash, CELERY_TASK_ALWAYS_EAGER
    │
    ├── core/                                ← Shared utilities (no domain logic)
    │   ├── __init__.py
    │   ├── pagination.py                    ← StandardResultsPagination (envelope-aware)
    │   ├── exceptions.py                    ← custom_exception_handler (maps to error envelope)
    │   └── urls.py                          ← GET /healthz/ · GET /healthz/ready/
    │
    ├── api/                                 ← API version routing
    │   ├── v1/
    │   │   └── urls.py                      ← Mounts all app URLs under /api/v1/
    │   └── v2/
    │       └── urls.py                      ← Mounts all app URLs under /api/v2/ (current)
    │
    └── apps/                                ← Django application modules
        │
        ├── users/                           ← Custom user model + profiles
        │   ├── __init__.py
        │   ├── apps.py                      ← Wires users.signals on ready()
        │   ├── models.py                    ← CustomUser, UserProfile, CustomUserManager
        │   ├── serializers.py               ← UserSerializer, UserProfileSerializer
        │   ├── views.py                     ← /users/me/ GET·PATCH·DELETE, /users/me/export/
        │   ├── urls.py
        │   ├── signals.py                   ← post_save → auto-create UserProfile
        │   ├── admin.py                     ← CustomUserAdmin (email auth, soft delete display)
        │   ├── permissions.py               ← IsOwner, IsVerified
        │   └── migrations/
        │       └── 0001_initial.py
        │       └── tests/
        │           └── test_models.py       ← 9 tests: CustomUser + UserProfile lifecycle
        │
        ├── authentication/                  ← JWT auth views
        │   ├── __init__.py
        │   ├── apps.py
        │   ├── serializers.py               ← Register, Login, PasswordChange, TokenRefresh
        │   ├── views.py                     ← Register, Login, Logout, Me, PasswordChange
        │   ├── urls.py
        │   └── migrations/
        │       └── tests/
        │           └── test_auth.py         ← 17 tests: full auth lifecycle + brute-force
        │
        ├── habits/                          ← Core habit domain
        │   ├── __init__.py
        │   ├── apps.py                      ← Wires habits.signals on ready()
        │   ├── models.py                    ← Habit, HabitCompletion, HabitStreak,
        │   │                                   HabitReminder, HabitCategory
        │   ├── serializers.py               ← HabitSerializer, CompletionSerializer,
        │   │                                   StreakSerializer, ReminderSerializer
        │   ├── views.py                     ← HabitViewSet, CompletionViewSet,
        │   │                                   StreakView, ReminderViewSet
        │   ├── urls.py
        │   ├── signals.py                   ← post_save HabitCompletion → update streak + XP
        │   ├── admin.py
        │   └── migrations/
        │       └── tests/
        │           └── test_habits.py       ← 17 tests: CRUD, completion, streak, ownership
        │
        ├── analytics/                       ← Reporting and insight layer
        │   ├── __init__.py
        │   ├── apps.py
        │   ├── services.py                  ← AnalyticsService class (all aggregation logic)
        │   ├── serializers.py               ← DashboardSerializer, HeatmapSerializer,
        │   │                                   WeeklySerializer, InsightSerializer
        │   ├── views.py                     ← Thin views — delegates to AnalyticsService
        │   ├── urls.py
        │   └── migrations/
        │       └── tests/
        │           └── test_analytics.py    ← 13 tests: service-layer + endpoint coverage
        │
        ├── social/                          ← Social graph and challenges
        │   ├── __init__.py
        │   ├── apps.py
        │   ├── models.py                    ← Friendship, GroupChallenge,
        │   │                                   ChallengeParticipant, SocialFeedItem
        │   ├── serializers.py
        │   ├── views.py                     ← FriendshipViewSet, ChallengeViewSet, FeedView
        │   ├── urls.py
        │   ├── signals.py                   ← Badge/XP events → SocialFeedItem creation
        │   └── migrations/
        │       └── tests/
        │           └── test_social.py       ← 21 tests: friendship lifecycle, challenge CRUD,
        │                                       feed isolation, capacity guards
        │
        ├── gamification/                    ← Badges, XP, leaderboard ✅ Phase 10 Complete
        │   ├── __init__.py
        │   ├── apps.py                      ← Wires gamification.signals on ready()
        │   ├── models.py                    ← Badge, UserBadge, XPLevel, UserXP,
        │   │                                   Leaderboard, LeaderboardEntry
        │   ├── serializers.py               ← BadgeSerializer, UserXPSerializer,
        │   │                                   LeaderboardSerializer
        │   ├── views.py                     ← BadgeListView, MyBadgesView,
        │   │                                   UserXPView, LeaderboardView
        │   ├── urls.py
        │   ├── signals.py                   ← HabitCompletion / HabitStreak → award badges + XP
        │   ├── tasks.py                     ← refresh_leaderboard Celery task
        │   └── migrations/
        │       └── tests/
        │           └── test_gamification.py ← Badge award logic, XP accumulation, level crossing,
        │                                       leaderboard ranking
        │
        ├── notifications/                   ← Async notification tasks
        │   ├── __init__.py
        │   ├── apps.py
        │   ├── tasks.py                     ← send_morning_reminders, send_weekly_digest
        │   └── migrations/
        │
        └── audit/                           ← Immutable audit log (Phase 12)
            ├── __init__.py
            ├── apps.py
            ├── models.py                    ← AuditLog (planned: actor, action, target, payload)
            ├── middleware.py                ← Auto-capture writes to audit log (planned)
            └── migrations/
```

---

## Django Application Map

| App | Key Models | Endpoints | Tests |
|-----|-----------|-----------|-------|
| `apps.users` | `CustomUser` (UUID PK, email auth, soft delete, brute-force fields), `UserProfile` (timezone, locale, avatar, onboarding) | `/users/me/` GET·PATCH·DELETE, `/users/me/export/` | 9 |
| `apps.authentication` | Uses `CustomUser` | `/auth/register/` `/auth/login/` `/auth/logout/` `/auth/token/refresh/` `/auth/password/change/` `/auth/me/` | 17 |
| `apps.habits` | `Habit` (type, frequency, XP reward), `HabitCompletion` (XP earned), `HabitStreak` (current/longest), `HabitReminder`, `HabitCategory` | `/habits/` CRUD, `/habits/{id}/complete/` `/habits/{id}/streak/` `/habits/{id}/reminders/` | 17 |
| `apps.analytics` | No persistent models — pure service layer | `/analytics/dashboard/` `/analytics/heatmap/` `/analytics/weekly/` `/analytics/insights/` | 13 |
| `apps.social` | `Friendship` (state machine), `GroupChallenge` (capacity, dates), `ChallengeParticipant`, `SocialFeedItem` | `/social/friends/` `/social/friends/invite/` `/social/friends/requests/{id}/accept\|decline/` `/social/challenges/` CRUD `/social/feed/` | 21 |
| `apps.gamification` | `Badge`, `UserBadge`, `XPLevel`, `UserXP`, `Leaderboard`, `LeaderboardEntry` | `/gamification/badges/` `/gamification/badges/mine/` `/gamification/xp/` `/gamification/leaderboard/` | Phase 10 ✅ |
| `apps.notifications` | *(model planned Phase 13)* | *(endpoints planned)* | — |
| `apps.audit` | `AuditLog` *(planned)* | `/audit/` *(planned)* | — |
| `core` | — | `/healthz/` `/healthz/ready/` | — |

---

## API Reference

### Base URLs

| Version | Base URL | Status |
|---------|----------|--------|
| REST v1 | `https://api.ngp.com/api/v1/` | Legacy compat |
| REST v2 | `https://api.ngp.com/api/v2/` | **Current** |
| Swagger UI | `https://api.ngp.com/api/docs/` | Interactive |
| ReDoc | `https://api.ngp.com/api/redoc/` | Documentation |
| Admin | `https://api.ngp.com/admin/` | Internal |
| Health | `https://api.ngp.com/healthz/` | Monitoring |

### Standard Response Envelope

**Every single endpoint** returns this shape — no exceptions, no deviations:

```json
{
  "success": true,
  "data": { },
  "meta": { "message": "optional human-readable context" },
  "pagination": {
    "count": 100,
    "next": "https://api.ngp.com/api/v2/habits/?page=2",
    "previous": null
  }
}
```

Error shape:

```json
{
  "success": false,
  "error": {
    "detail": "Human-readable error message."
  }
}
```

### Complete Endpoint Reference

#### Authentication — `/api/v2/auth/`

| Method | Path | Auth Required | Description |
|--------|------|:---:|-------------|
| `POST` | `/auth/register/` | ✗ | Create account. Returns JWT pair. |
| `POST` | `/auth/login/` | ✗ | Brute-force tracked. Returns JWT pair. |
| `POST` | `/auth/token/refresh/` | ✗ | Rotate refresh token (blacklists old). |
| `POST` | `/auth/logout/` | ✓ | Blacklist refresh token family. |
| `POST` | `/auth/password/change/` | ✓ | Validated password change. |
| `GET` | `/auth/me/` | ✓ | Current user summary. |

#### Users — `/api/v2/users/`

| Method | Path | Auth | Description |
|--------|------|:---:|-------------|
| `GET` | `/users/me/` | ✓ | Full user + profile. |
| `PATCH` | `/users/me/` | ✓ | Update profile fields. |
| `DELETE` | `/users/me/` | ✓ | GDPR soft delete. |
| `GET` | `/users/me/export/` | ✓ | GDPR data export (JSON). |

#### Habits — `/api/v2/habits/`

| Method | Path | Auth | Description |
|--------|------|:---:|-------------|
| `GET` | `/habits/` | ✓ | List active habits (paginated). |
| `POST` | `/habits/` | ✓ | Create habit. |
| `GET` | `/habits/{id}/` | ✓ | Habit detail. |
| `PATCH` | `/habits/{id}/` | ✓ | Update habit. |
| `DELETE` | `/habits/{id}/` | ✓ | Soft delete habit. |
| `POST` | `/habits/{id}/complete/` | ✓ | Mark complete. Fires streak + XP signals. |
| `GET` | `/habits/{id}/streak/` | ✓ | Streak detail (current + longest). |
| `GET/POST` | `/habits/{id}/reminders/` | ✓ | List or create reminders. |

#### Analytics — `/api/v2/analytics/`

| Method | Path | Auth | Description |
|--------|------|:---:|-------------|
| `GET` | `/analytics/dashboard/` | ✓ | Aggregate metrics: streaks, completions, XP. |
| `GET` | `/analytics/heatmap/?year=2026` | ✓ | Calendar heatmap data (TruncDate). |
| `GET` | `/analytics/weekly/` | ✓ | Last-7-days breakdown by habit. |
| `GET` | `/analytics/insights/` | ✓ | AI-generated behavioral insights. |

#### Social — `/api/v2/social/`

| Method | Path | Auth | Description |
|--------|------|:---:|-------------|
| `GET` | `/social/friends/` | ✓ | Accepted friends only. |
| `POST` | `/social/friends/invite/` | ✓ | Send friend request by username. |
| `GET` | `/social/friends/requests/` | ✓ | Incoming pending requests. |
| `POST` | `/social/friends/requests/{id}/accept/` | ✓ | Accept request. |
| `POST` | `/social/friends/requests/{id}/decline/` | ✓ | Decline request. |
| `GET` | `/social/challenges/` | ✓ | Public + user's challenges. |
| `POST` | `/social/challenges/` | ✓ | Create challenge (creator auto-joins). |
| `GET` | `/social/challenges/{id}/` | ✓ | Full detail with leaderboard. |
| `POST` | `/social/challenges/{id}/join/` | ✓ | Join (duplicate guard, capacity check). |
| `GET` | `/social/feed/` | ✓ | Social feed (friend graph, 50 most recent). |

#### Gamification — `/api/v2/gamification/`

| Method | Path | Auth | Description |
|--------|------|:---:|-------------|
| `GET` | `/gamification/badges/` | ✓ | All badges with `earned: true/false` for user. |
| `GET` | `/gamification/badges/mine/` | ✓ | Only earned badges. |
| `GET` | `/gamification/xp/` | ✓ | Total XP, current level, progress to next. |
| `GET` | `/gamification/leaderboard/?period=weekly` | ✓ | Ranked list (weekly / monthly / all-time). |

---

## Authentication & Security

### JWT Configuration

```python
SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(minutes=15),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=7),
    "ROTATE_REFRESH_TOKENS": True,          # every refresh issues a new refresh token
    "BLACKLIST_AFTER_ROTATION": True,        # old refresh token is immediately invalid
    "ALGORITHM": "HS256",
    "AUTH_HEADER_TYPES": ("Bearer",),
}
```

### Brute-Force Protection

- `failed_login_count` field on `CustomUser` tracks consecutive failures
- Account locks after **10 failed attempts**
- Counter resets on successful login
- `last_login_ip` recorded for audit trail

### Token Lifecycle

```
Register/Login → { access (15min), refresh (7d) }
     │
     ▼ access expires
Client → POST /auth/token/refresh/ { refresh }
     → new { access, refresh }   ← old refresh is BLACKLISTED
     │
     ▼ explicit logout
Client → POST /auth/logout/ { refresh }
     → refresh token family BLACKLISTED
```

### Security Headers (Production)

```python
SECURE_HSTS_SECONDS = 31536000
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True
SECURE_SSL_REDIRECT = True
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
X_FRAME_OPTIONS = "DENY"
SECURE_CONTENT_TYPE_NOSNIFF = True
SECURE_BROWSER_XSS_FILTER = True
```

### GDPR Compliance

| Requirement | Implementation |
|-------------|----------------|
| Right to Erasure (Art. 17) | `DELETE /users/me/` → `soft_delete()` sets `deleted_at`. Celery purge task after 30 days. |
| Data Portability (Art. 20) | `GET /users/me/export/` → JSON dump of all user data. |
| Purpose Limitation | Querysets always scoped to `user=request.user`. No cross-user data leakage possible by construction. |
| Audit Trail | `last_login_ip` recorded. Full audit log in Phase 12. |

---

## Gamification Engine

The gamification system is **signal-driven** — no polling, no manual triggers. Every `HabitCompletion` save fires a chain:

```
HabitCompletion.save()
     │
     ▼ (Django signal)
gamification.signals.on_habit_completion()
     ├── Add XP to UserXP.total_xp
     ├── Recalculate level (XPLevel threshold check)
     ├── Check badge conditions:
     │     ├── STREAK_DAYS → current streak crosses threshold?
     │     ├── TOTAL_COMPLETIONS → cumulative completions crosses threshold?
     │     ├── HABITS_CREATED → habit count crosses threshold?
     │     └── CHALLENGE_WON → challenge marked complete?
     └── For each earned badge → UserBadge.objects.get_or_create()
                                → SocialFeedItem(BADGE_EARNED) created
```

### Badge Condition Types

| Condition | Trigger | Example |
|-----------|---------|---------|
| `STREAK_DAYS` | `HabitStreak.current_streak` crosses `condition_value` | "7-Day Streak" at 7 days |
| `TOTAL_COMPLETIONS` | `HabitCompletion` count crosses `condition_value` | "Century" at 100 completions |
| `HABITS_CREATED` | `Habit` count crosses `condition_value` | "Habit Builder" at 5 habits |
| `CHALLENGE_WON` | Challenge marked as user winner | "Champion" |

### XP and Levels

```
HabitCompletion.xp_earned → UserXP.total_xp accumulates
                          → XPLevel.objects.filter(xp_required__lte=total_xp).last()
                          → UserXP.current_level updated
```

Level titles example: Bronze → Silver → Gold → Platinum → Diamond → Legend

---

## Social Layer

### Friendship State Machine

```
User A sends request
     │
     ▼
Friendship(status=PENDING, from_user=A, to_user=B) created
     │
     ├── B accepts → status=ACCEPTED → both appear in each other's /friends/
     └── B declines → status=DECLINED → request closed
```

Duplicate prevention: `unique_together(from_user, to_user)` + reverse duplicate check in serializer.

### Group Challenges

- Creator auto-joins on creation
- `max_participants` capacity checked on every `join/` call
- `start_date` / `end_date` enforced
- `ChallengeParticipant.record_completion(points)` updates score
- Challenge detail endpoint returns full participant leaderboard

### Social Feed

- Events: `HABIT_COMPLETED`, `STREAK_REACHED`, `CHALLENGE_JOINED`, `CHALLENGE_WON`, `BADGE_EARNED`
- `is_public` flag on each item
- Feed scoped to: user's own events + accepted friends' public events
- 50 most recent items, newest first

---

## Analytics Pipeline

All analytics logic lives in `apps/analytics/services.py` — an `AnalyticsService` class with pure methods that are independently testable without HTTP.

### Dashboard Metrics

```python
AnalyticsService.get_dashboard(user) → {
    "total_habits": int,
    "active_streaks": int,
    "longest_streak": int,
    "total_completions": int,
    "completions_this_week": int,
    "total_xp": int,
    "current_level": str,
}
```

### Calendar Heatmap

```python
AnalyticsService.get_heatmap(user, year) → [
    { "date": "2026-01-01", "count": 3 },
    ...
]
```

Uses `TruncDate` — no raw SQL. Works correctly across PostgreSQL and test databases.

### Behavioral Insights

Pattern-based rule engine (Phase 6). NGP BehaviorEngine™ AI integration in Phase 14 will replace with ML-driven personalization.

---

## Async Task System (Celery)

### Queues and Tasks

| Queue | Task | Schedule | Description |
|-------|------|----------|-------------|
| `habits` | `check_broken_streaks` | Daily 00:05 UTC | Reset current streak for any habit missed yesterday |
| `habits` | `calculate_user_xp` | On demand | Recalculate XP total from completions (repair tool) |
| `analytics` | `aggregate_hourly_stats` | Every hour | Pre-aggregate analytics for fast dashboard loads |
| `analytics` | `refresh_leaderboard` | Daily 01:00 UTC | Rebuild leaderboard entries from completions |
| `notifications` | `send_morning_reminders` | Daily 07:00 UTC | FCM/APNs push for habits with active reminders |
| `notifications` | `send_weekly_digest` | Monday 08:00 UTC | Per-user email summary via SendGrid |
| `default` | Everything else | On demand | Badge awards, feed events, misc |

### Starting Workers

```bash
# Terminal 1 — Django server
make run

# Terminal 2 — Celery worker (all 4 queues)
make worker

# Terminal 3 — Celery beat scheduler
make beat
```

---

## Getting Started — Local Development

### Prerequisites

- Ubuntu 22.04+ or macOS 13+
- [pyenv](https://github.com/pyenv/pyenv)
- [Poetry 2.x](https://python-poetry.org)
- PostgreSQL 16
- Redis 7.x

### Step-by-Step Setup

**1. Clone and enter the repository:**

```bash
git clone https://github.com/fatemeh-7ngp7/ngp-habitforge.git
cd ngp-habitforge
```

**2. Pin Python version:**

```bash
pyenv install 3.12.3   # if not installed
pyenv local 3.12.3
python --version       # Python 3.12.3
```

**3. Install dependencies:**

```bash
poetry config virtualenvs.in-project true
poetry install
```

**4. Create PostgreSQL databases:**

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

**5. Configure environment:**

```bash
cp backend/.env.example backend/.env
# Edit backend/.env (see §Environment Variables)
```

**6. Run migrations and seed categories:**

```bash
make migrate
make seed
```

**7. Create a superuser:**

```bash
make superuser
```

**8. Start the server:**

```bash
make run
```

Visit:
- API Docs (Swagger): http://127.0.0.1:8000/api/docs/
- Admin Panel: http://127.0.0.1:8000/admin/
- Health Check: http://127.0.0.1:8000/healthz/

---

## Docker — Production Deployment

### Development Stack

```bash
docker compose up --build
```

Services started: `django` (port 8000) · `postgres` · `redis` · `celery-worker` · `celery-beat`

### Production Stack

```bash
docker compose -f docker-compose.prod.yml up --build -d
```

Additional services: `nginx` (port 80/443) · `gunicorn` (upstream from nginx)

### Docker Architecture

```
┌──────────────────────────────────────────────────────────┐
│                    docker-compose.prod.yml               │
│                                                          │
│  nginx:1.25                                              │
│    └── Upstream: django:8000                             │
│                                                          │
│  django (Dockerfile — multi-stage)                       │
│    Stage 1: builder  ← install Poetry deps               │
│    Stage 2: runtime  ← non-root user, copy .venv         │
│    CMD: gunicorn -c gunicorn.conf.py config.wsgi         │
│                                                          │
│  celery-worker (Dockerfile.worker)                       │
│    CMD: celery -A config worker -Q habits,analytics,...  │
│                                                          │
│  celery-beat                                             │
│    CMD: celery -A config beat                            │
│                                                          │
│  postgres:16-alpine   (volume: pgdata)                   │
│  redis:7-alpine       (volume: redisdata)                │
└──────────────────────────────────────────────────────────┘
```

### Gunicorn Configuration (`gunicorn.conf.py`)

```python
bind = "0.0.0.0:8000"
workers = multiprocessing.cpu_count() * 2 + 1
worker_class = "sync"
timeout = 120
keepalive = 5
accesslog = "-"
errorlog = "-"
loglevel = "info"
```

---

## Environment Variables — Complete Reference

Copy `backend/.env.example` to `backend/.env`:

```env
# ─── Django ───────────────────────────────────────────────────────────────────
DJANGO_SETTINGS_MODULE=config.settings.development
SECRET_KEY=your-secret-key-minimum-50-characters-random-string
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

# ─── Database ─────────────────────────────────────────────────────────────────
DATABASE_URL=postgres://ngp_user:ngp_dev_password@127.0.0.1:5432/ngp_habitforge

# ─── Redis ────────────────────────────────────────────────────────────────────
REDIS_URL=redis://127.0.0.1:6379/0

# ─── CORS ─────────────────────────────────────────────────────────────────────
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000

# ─── Email (production) ───────────────────────────────────────────────────────
# EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
# SENDGRID_API_KEY=your-sendgrid-api-key
# DEFAULT_FROM_EMAIL=noreply@ngp.com

# ─── Push Notifications (Phase 13) ───────────────────────────────────────────
# FCM_SERVER_KEY=your-firebase-server-key
# APNS_CERT_FILE=path/to/cert.pem

# ─── Monitoring (Phase 12) ────────────────────────────────────────────────────
# SENTRY_DSN=https://...@sentry.io/...
```

**Never commit `.env`.** Only `.env.example` is committed.

---

## Testing

### Run the Full Suite

```bash
make test         # pytest --tb=short -v
make coverage     # pytest + HTML coverage report at htmlcov/index.html
```

### Current Test Status

```
╔═══════════════════════════════════════════╗
║  77 tests passing                         ║
║  87%+ coverage                            ║
║  0 failures                               ║
║  0 lint errors (ruff clean)               ║
╚═══════════════════════════════════════════╝
```

### Test Structure

```
backend/
├── conftest.py                              ← Root-level shared fixtures (critical placement)
└── apps/
    ├── users/tests/test_models.py           ← 9 tests
    ├── authentication/tests/test_auth.py    ← 17 tests
    ├── habits/tests/test_habits.py          ← 17 tests
    ├── analytics/tests/test_analytics.py    ← 13 tests
    ├── social/tests/test_social.py          ← 21 tests
    └── gamification/tests/                  ← Phase 10 tests ✅
```

### Available Fixtures

| Fixture | Description |
|---------|-------------|
| `api_client` | Unauthenticated DRF test client |
| `user` | Ready-made `CustomUser` instance |
| `auth_client` | DRF client authenticated as `user` |
| `second_user` | Second user for ownership isolation tests |
| `second_auth_client` | DRF client authenticated as `second_user` |
| `create_user` | Factory function with sensible defaults |

### Key Test Patterns

```python
# Ownership isolation — always test cross-user access returns 404
def test_cannot_access_other_users_habit(auth_client, second_user_habit):
    response = auth_client.get(f"/api/v2/habits/{second_user_habit.id}/")
    assert response.status_code == 404

# Standard envelope assertion
def test_login_returns_tokens(api_client, user):
    response = api_client.post("/api/v2/auth/login/", {...})
    assert response.data["success"] is True
    assert "access" in response.data["data"]

# Signal-driven side effects
def test_completion_updates_streak(auth_client, habit):
    auth_client.post(f"/api/v2/habits/{habit.id}/complete/")
    streak = HabitStreak.objects.get(habit=habit)
    assert streak.current_streak == 1
```

---

## Developer Workflow (Makefile)

```bash
make help           # show all commands with descriptions

# ─── Code Quality ────────────────────────────────────────────────────────────
make check          # Django system check (0 issues expected)
make lint           # ruff check --config ../pyproject.toml
make format         # black + ruff --fix
make test           # pytest --tb=short -v
make coverage       # test + HTML coverage report

# ─── Database ────────────────────────────────────────────────────────────────
make migrate        # apply pending migrations
make migrations     # create new migrations (makemigrations)
make seed           # seed 8 habit categories
make reset-db       # ⚠️  drop + recreate ngp_habitforge (destructive)

# ─── Development Servers ─────────────────────────────────────────────────────
make run            # Django dev server on :8000
make worker         # Celery worker (habits, analytics, notifications, default)
make beat           # Celery beat scheduler
make shell          # Django shell_plus

# ─── Utilities ───────────────────────────────────────────────────────────────
make superuser      # create Django superuser
make clean          # remove .pyc, __pycache__, .coverage
```

### Git Commit Convention

```
feat(app): short description of the change

- Detail about what changed
- Why it changed
```

Examples:
```
feat(gamification): add badge award engine with signal-driven triggers
fix(analytics): migrate heatmap from extra() SQL to TruncDate
test(social): add challenge capacity limit boundary tests
refactor(auth): extract token helpers to utils.py
chore(docker): add multi-stage Dockerfile with non-root user
```

---

## Security Architecture

### Threat Model

| Threat | Mitigation |
|--------|-----------|
| Credential stuffing | Brute-force lock after 10 failures; `failed_login_count` per user |
| Token theft / replay | JWT family rotation; refresh token blacklisted on every use |
| Sequential ID enumeration | UUID primary keys on all models |
| Cross-user data access | Querysets always `filter(user=request.user)` — 404 on mismatch |
| Mass assignment | DRF serializers with explicit `fields` or `read_only_fields` |
| SQL injection | Django ORM only; zero raw SQL in business logic paths |
| CORS bypass | `CORS_ALLOWED_ORIGINS` allowlist enforced by `django-cors-headers` |
| MITM | HTTPS enforced, HSTS with preload, SSL redirect in production |
| Clickjacking | `X_FRAME_OPTIONS = "DENY"` |
| Content sniffing | `SECURE_CONTENT_TYPE_NOSNIFF = True` |
| Secrets exposure | `.env` never committed; environment-based config in all environments |

### Planned Security Enhancements (Phase 12+)

- [ ] `apps/audit/` — Immutable append-only audit log capturing all writes
- [ ] Rate limiting tuning: anon → 60/min, user → 1000/min, auth endpoints → 10/min
- [ ] Sentry integration for error monitoring and alerting
- [ ] Dependency vulnerability scanning (Dependabot or `pip-audit`)
- [ ] SOC 2 Type II compliance controls (Phase 16)
- [ ] SAML 2.0 / OIDC enterprise SSO (Phase 13)

---

## Roadmap — Zero to One Hundred

### ✅ Completed

| Phase | Deliverable | Status |
|-------|-------------|--------|
| 1 | System Foundation: pyenv, Poetry, PostgreSQL 16, Redis 7 | ✅ Done |
| 2 | Django Scaffold: split settings, Celery init, API routing, health checks | ✅ Done |
| 3 | CustomUser Model: UUID PK, email auth, soft delete, brute-force fields | ✅ Done |
| 4 | JWT Authentication: register, login, refresh, logout, GDPR endpoints | ✅ Done |
| 5 | Habits Domain: CRUD, streaks, completions, XP rewards, signals | ✅ Done |
| 6 | Analytics: dashboard, heatmap, weekly breakdown, AI insights, service layer | ✅ Done |
| 7 | Test Suite: 56→77 tests, 87%+ coverage, factory-boy fixtures | ✅ Done |
| 8 | Developer Workflow: Makefile, Celery tasks, admin branding | ✅ Done |
| 9 | Social App: friendships, group challenges, activity feed | ✅ Done |
| 10 | Gamification: badges, XP levels, leaderboard, signal-driven award engine | ✅ Done |
| 11 | Docker + Production Config: multi-stage Dockerfile, nginx, gunicorn | ✅ Done |

### 🔄 In Progress

| Phase | Deliverable | Target |
|-------|-------------|--------|
| 12 | Audit Log, Rate Limiting, Full Seed Data, 95% Coverage | Q3 2026 |

### 📋 Planned

| Phase | Deliverable | Timeline |
|-------|-------------|----------|
| 13 | FCM / APNs Push Notifications, SendGrid Email, WebSockets (Django Channels) | Q3 2026 |
| 14 | NGP BehaviorEngine™ — ML-driven behavioral insights and personalization | Q4 2026 |
| 15 | React / Next.js Web Application — full consumer-facing frontend | Q4 2026 |
| 16 | React Native Mobile App — iOS and Android | Q1 2027 |
| 17 | Multi-tenancy — Organizations, Teams, Workspaces, white-labeling | Q1 2027 |
| 18 | GraphQL API Layer (Strawberry) — for mobile and third-party partners | Q2 2027 |
| 19 | SAML 2.0 / OIDC Enterprise SSO — corporate HR system integrations | Q2 2027 |
| 20 | SOC 2 Type II Compliance — enterprise sales readiness | Q3 2027 |

---

## Contributing & Governance

NGP HabitForge is proprietary software under active development. External contributions are not accepted at this stage.

**For enterprise licensing:** enterprise@ngp.com  
**For security vulnerabilities:** security@ngp.com (see `SECURITY.md` for responsible disclosure policy)  
**For bug reports:** Use the GitHub issue tracker  
**For API partnership inquiries:** partnerships@ngp.com

---

## License

© 2026 NGP (Next Generation Platform). All rights reserved.

This software is proprietary and confidential. Unauthorized copying, modification, distribution, or use of this software, in whole or in part, is strictly prohibited without the express written permission of NGP.

Third-party open-source dependencies retain their original licenses.  
See `security/sbom/sbom.spdx.json` for the full Software Bill of Materials.

---

<div align="center">

```
 ╔═══════════════════════════════════════════════════════╗
 ║                                                       ║
 ║   NGP HABITFORGE                                      ║
 ║   Behavioral infrastructure for the next generation   ║
 ║                                                       ║
 ║   v5.0.0 · Django 5.1 · PostgreSQL 16 · Python 3.12  ║
 ║                                                       ║
 ╚═══════════════════════════════════════════════════════╝
```

**NGP** — *Building systems that help people grow.*

[Website](https://ngp.com) · [API Docs](https://api.ngp.com/api/docs/) · [Enterprise](https://ngp.com/enterprise) · [Security](https://ngp.com/security)

</div>