"""
Analytics models.
Designed for time-series queries — optimised indexes on timestamp fields.
"""
import uuid

from django.conf import settings
from django.db import models
from django.utils import timezone


class AnalyticsEvent(models.Model):
    """
    Append-only event log. Every significant user action lands here.
    In production this goes into TimescaleDB hypertables.
    """
    EVENT_TYPES = [
        ("habit.created",    "Habit Created"),
        ("habit.completed",  "Habit Completed"),
        ("habit.streak",     "Streak Milestone"),
        ("habit.deleted",    "Habit Deleted"),
        ("user.login",       "User Login"),
        ("user.registered",  "User Registered"),
        ("challenge.joined", "Challenge Joined"),
    ]

    id         = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user       = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="events",
    )
    event_type = models.CharField(max_length=50, choices=EVENT_TYPES, db_index=True)
    payload    = models.JSONField(default=dict)
    ts         = models.DateTimeField(default=timezone.now, db_index=True)

    class Meta:
        ordering = ["-ts"]
        indexes  = [
            models.Index(fields=["user", "ts"]),
            models.Index(fields=["user", "event_type"]),
            models.Index(fields=["ts"]),
        ]

    def __str__(self):
        return f"{self.user.username} — {self.event_type} @ {self.ts:%Y-%m-%d %H:%M}"


class UserInsight(models.Model):
    """
    AI-generated insight for a user — stored after BehaviorEngine inference.
    Read-only from the user's perspective.
    """
    INSIGHT_TYPES = [
        ("peak_time",        "Peak Completion Time"),
        ("streak_risk",      "Streak at Risk"),
        ("recommendation",   "Habit Recommendation"),
        ("weekly_summary",   "Weekly Summary"),
        ("milestone",        "Milestone Reached"),
    ]

    id           = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user         = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="insights",
    )
    insight_type = models.CharField(max_length=30, choices=INSIGHT_TYPES)
    title        = models.CharField(max_length=200)
    body         = models.TextField()
    is_read      = models.BooleanField(default=False)
    generated_at = models.DateTimeField(default=timezone.now)
    expires_at   = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-generated_at"]
        indexes  = [
            models.Index(fields=["user", "is_read"]),
            models.Index(fields=["user", "generated_at"]),
        ]

    def __str__(self):
        return f"{self.user.username} — {self.title}"
