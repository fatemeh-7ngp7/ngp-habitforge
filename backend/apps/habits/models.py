"""
Habit domain models.

Habit              — the habit definition
HabitCompletion    — each time a habit is completed (time-series)
HabitStreak        — current + longest streak per habit
HabitCategory      — taxonomy (Fitness, Mind, Sleep, etc.)
HabitReminder      — scheduled reminders per habit
"""
import uuid
from django.conf import settings
from django.core.validators import MinValueValidator, MaxValueValidator
from django.db import models
from django.utils import timezone
from django.utils.translation import gettext_lazy as _
from .enums import HabitType, FrequencyType, DifficultyLevel, VerificationMethod


class HabitCategory(models.Model):
    """Taxonomy for grouping habits — Fitness, Mind, Sleep, Nutrition, etc."""
    id    = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name  = models.CharField(max_length=64, unique=True)
    icon  = models.CharField(max_length=10, blank=True, help_text=_("Emoji icon"))
    color = models.CharField(max_length=7, default="#E8400C", help_text=_("Hex color"))
    order = models.PositiveSmallIntegerField(default=0, help_text=_("Display order"))

    class Meta:
        verbose_name_plural = "habit categories"
        ordering = ["order", "name"]

    def __str__(self):
        return f"{self.icon} {self.name}"


class Habit(models.Model):
    """
    Core habit entity.
    - UUID PK, soft delete, full type system
    - Owned by a user, optionally public for social feed
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    # ── Ownership ─────────────────────────────────────────────────────────────
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="habits",
    )

    # ── Definition ────────────────────────────────────────────────────────────
    title       = models.CharField(max_length=200)
    description = models.TextField(blank=True, max_length=1000)
    category    = models.ForeignKey(
        HabitCategory,
        null=True, blank=True,
        on_delete=models.SET_NULL,
        related_name="habits",
    )
    color = models.CharField(max_length=7, default="#E8400C")
    icon  = models.CharField(max_length=10, blank=True)

    # ── Type system ───────────────────────────────────────────────────────────
    habit_type = models.CharField(
        max_length=20,
        choices=HabitType.choices,
        default=HabitType.BINARY,
    )
    target_value = models.DecimalField(
        max_digits=10, decimal_places=2,
        null=True, blank=True,
        help_text=_("Target quantity e.g. 5 for '5 km'"),
    )
    target_unit = models.CharField(
        max_length=30, blank=True,
        help_text=_("Unit label e.g. km, pages, minutes"),
    )
    difficulty = models.CharField(
        max_length=10,
        choices=DifficultyLevel.choices,
        default=DifficultyLevel.MEDIUM,
    )

    # ── Frequency ─────────────────────────────────────────────────────────────
    frequency_type = models.CharField(
        max_length=10,
        choices=FrequencyType.choices,
        default=FrequencyType.DAILY,
    )
    frequency_days = models.JSONField(
        default=list,
        blank=True,
        help_text=_("List of weekday ints 0=Mon…6=Sun. Empty = every day."),
    )
    frequency_interval = models.PositiveSmallIntegerField(
        default=1,
        help_text=_("Every N days for CUSTOM frequency."),
    )

    # ── Visibility & state ────────────────────────────────────────────────────
    is_public   = models.BooleanField(default=False)
    is_archived = models.BooleanField(default=False)
    order       = models.PositiveSmallIntegerField(default=0)

    # ── Timestamps & soft delete ──────────────────────────────────────────────
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    deleted_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["order", "created_at"]
        indexes = [
            models.Index(fields=["user", "is_archived", "deleted_at"]),
            models.Index(fields=["user", "created_at"]),
            models.Index(fields=["is_public"]),
        ]

    def __str__(self):
        return f"{self.user.username} → {self.title}"

    @property
    def is_deleted(self):
        return self.deleted_at is not None

    def soft_delete(self):
        self.deleted_at = timezone.now()
        self.save(update_fields=["deleted_at", "updated_at"])

    def get_xp_value(self):
        """XP awarded per completion based on difficulty."""
        return {"EASY": 10, "MEDIUM": 25, "HARD": 50}.get(self.difficulty, 25)


class HabitStreak(models.Model):
    """
    Tracks current and longest streak for a single habit.
    Updated every time a completion is recorded or missed.
    One row per habit — upserted, never duplicated.
    """
    habit = models.OneToOneField(
        Habit,
        on_delete=models.CASCADE,
        related_name="streak",
        primary_key=True,
    )
    current_streak     = models.PositiveIntegerField(default=0)
    longest_streak     = models.PositiveIntegerField(default=0)
    last_completion_date = models.DateField(null=True, blank=True)
    streak_start_date  = models.DateField(null=True, blank=True)
    total_completions  = models.PositiveIntegerField(default=0)
    updated_at         = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.habit.title} — {self.current_streak}d streak"

    def record_completion(self, completion_date=None):
        """
        Called after every successful HabitCompletion save.
        Updates current streak, longest streak, and total count.
        """
        today = completion_date or timezone.now().date()

        if self.last_completion_date is None:
            # First ever completion
            self.current_streak = 1
            self.streak_start_date = today
        elif (today - self.last_completion_date).days == 1:
            # Consecutive day
            self.current_streak += 1
        elif (today - self.last_completion_date).days == 0:
            # Already completed today — no change to streak
            pass
        else:
            # Streak broken
            self.current_streak = 1
            self.streak_start_date = today

        self.last_completion_date = today
        self.total_completions += 1

        if self.current_streak > self.longest_streak:
            self.longest_streak = self.current_streak

        self.save()


class HabitCompletion(models.Model):
    """
    Immutable completion event — one row per habit per completion.
    This is the core time-series data. Never updated, only inserted.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    habit        = models.ForeignKey(Habit, on_delete=models.CASCADE, related_name="completions")
    completed_at = models.DateTimeField(default=timezone.now, db_index=True)
    value        = models.DecimalField(
        max_digits=10, decimal_places=2,
        null=True, blank=True,
        help_text=_("Measured value for MEASURABLE habits e.g. 5.2 km"),
    )
    note      = models.TextField(blank=True, max_length=500)
    sentiment = models.FloatField(
        null=True, blank=True,
        validators=[MinValueValidator(-1.0), MaxValueValidator(1.0)],
        help_text=_("JournalAnalyzer sentiment score -1.0 to 1.0"),
    )
    verified_by = models.CharField(
        max_length=20,
        choices=VerificationMethod.choices,
        default=VerificationMethod.USER,
    )
    xp_earned = models.PositiveSmallIntegerField(default=0)

    class Meta:
        ordering = ["-completed_at"]
        indexes = [
            models.Index(fields=["habit", "completed_at"]),
            models.Index(fields=["completed_at"]),
        ]
        # Prevent double-completion on the same day
        constraints = [
            models.UniqueConstraint(
                fields=["habit"],
                condition=models.Q(completed_at__date=timezone.now().date()),
                name="unique_completion_per_day",
            )
        ]

    def __str__(self):
        return f"{self.habit.title} @ {self.completed_at:%Y-%m-%d %H:%M}"


class HabitReminder(models.Model):
    """Scheduled reminder for a habit — supports smart AI timing."""
    id    = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    habit = models.ForeignKey(Habit, on_delete=models.CASCADE, related_name="reminders")
    time  = models.TimeField(help_text=_("Local time to send the reminder"))
    days  = models.JSONField(
        default=list,
        help_text=_("Weekday ints 0=Mon…6=Sun. Empty = every day."),
    )
    is_enabled    = models.BooleanField(default=True)
    is_smart_timed = models.BooleanField(
        default=False,
        help_text=_("If True, SmartScheduler overrides 'time' with ML-optimal timing"),
    )
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.habit.title} reminder @ {self.time}"
