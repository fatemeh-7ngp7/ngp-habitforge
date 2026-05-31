"""
Celery application for NGP HabitForge.
Workers handle: habit reminders, streak calculations, email, analytics.
"""
import os
from celery import Celery
from celery.schedules import crontab

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings.development")

app = Celery("ngp_habitforge")
app.config_from_object("django.conf:settings", namespace="CELERY")

# Auto-discover tasks in all installed apps
app.autodiscover_tasks()

# ── Periodic tasks (Celery Beat schedule) ─────────────────────────────────────
app.conf.beat_schedule = {

    # Daily streak check — mark broken streaks at midnight UTC
    "check-broken-streaks-daily": {
        "task":     "apps.habits.tasks.check_broken_streaks",
        "schedule": crontab(hour=0, minute=5),
    },

    # Morning reminders batch — send at 7 AM UTC
    "send-morning-reminders": {
        "task":     "apps.notifications.tasks.send_morning_reminders",
        "schedule": crontab(hour=7, minute=0),
    },

    # Weekly digest email — every Monday 8 AM UTC
    "send-weekly-digest": {
        "task":     "apps.notifications.tasks.send_weekly_digest",
        "schedule": crontab(hour=8, minute=0, day_of_week=1),
    },

    # Analytics aggregation — every hour
    "aggregate-analytics-hourly": {
        "task":     "apps.analytics.tasks.aggregate_hourly_stats",
        "schedule": crontab(minute=0),
    },
}

app.conf.task_routes = {
    "apps.habits.*":        {"queue": "habits"},
    "apps.notifications.*": {"queue": "notifications"},
    "apps.analytics.*":     {"queue": "analytics"},
    "apps.*":               {"queue": "default"},
}


@app.task(bind=True, ignore_result=True)
def debug_task(self):
    print(f"Request: {self.request!r}")
