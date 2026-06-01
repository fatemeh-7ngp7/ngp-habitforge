# ─── Stage 1: Builder ─────────────────────────────────────────────────────────
FROM docker.arvancloud.ir/python:3.12-slim AS builder

WORKDIR /build

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install Poetry
RUN curl -sSL https://install.python-poetry.org | python3 - && \
    /root/.local/bin/poetry self add poetry-plugin-export
ENV PATH="/root/.local/bin:$PATH"

# Copy dependency files (now in build context = backend/)
COPY pyproject.toml poetry.lock ./

# Export to requirements.txt — no dev deps, no hashes (faster install)
RUN poetry export \
    --without dev \
    --no-interaction \
    --no-ansi \
    --without-hashes \
    -f requirements.txt \
    -o requirements.txt

# ─── Stage 2: Runtime ─────────────────────────────────────────────────────────
FROM docker.arvancloud.ir/python:3.12-slim AS runtime

RUN groupadd --gid 1000 appuser && \
    useradd --uid 1000 --gid appuser --shell /bin/bash --create-home appuser

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    python3-dev \
    libc6-dev \
    libpq5 \
    libpq-dev \
    gcc \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install Python deps from exported requirements
COPY --from=builder /build/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY --chown=appuser:appuser . .

# Create runtime directories
RUN mkdir -p /app/staticfiles /app/media /app/logs && \
    chown -R appuser:appuser /app

USER appuser

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:8000/healthz/ || exit 1

CMD ["gunicorn", "config.wsgi:application", \
     "--bind", "0.0.0.0:8000", \
     "--workers", "4", \
     "--worker-class", "sync", \
     "--worker-tmp-dir", "/dev/shm", \
     "--timeout", "60", \
     "--keep-alive", "5", \
     "--log-level", "info", \
     "--access-logfile", "-", \
     "--error-logfile", "-"]
