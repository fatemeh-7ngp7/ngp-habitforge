"""
Gamification domain models.

Badge              — achievement definition
UserBadge          — a user earns a badge (M:M through table)
XPLevel            — level thresholds (Bronze → Diamond)
UserXP             — running XP total + current level per user
Leaderboard        — period snapshot (weekly / monthly / all-time)
LeaderboardEntry   — ranked row inside a leaderboard
"""
import uuid

from django.conf import settings
from django.db import models
from django.utils import timezone
from django.utils.translation import gettext_lazy as _


class Badge(models.Model):
    """
    Badge definition — what condition must be met to earn it.
    Conditions are evaluated by the BadgeAwardEngine after each completion.
    """

    class ConditionType(models.TextChoices):
        STREAK_DAYS        = "STREAK_DAYS",        _("Reach a streak of N days")
        TOTAL_COMPLETIONS  = "TOTAL_COMPLETIONS",  _("Complete habits N times total")
        HABITS_CREATED     = "HABITS_CREATED",     _("Create N habits")
        CHALLENGE_JOINED   = "CHALLENGE_JOINED",   _("Join N challenges")
        CHALLENGE_WON      = "CHALLENGE_WON",      _("Win N challenges")
        PERFECT_WEEK       = "PERFECT_WEEK",       _("Complete all habits 7 days in a row")
        EARLY_BIRD         = "EARLY_BIRD",         _("Complete a habit before 7 AM N times")

    id             = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name           = models.CharField(max_length=100, unique=True)
    description    = models.TextField(max_length=500)
    icon           = models.CharField(max_length=10, help_text=_("Emoji icon"))
    color          = models.CharField(max_length=7, default="#E8400C")
    condition_type = models.CharField(max_length=30, choices=ConditionType.choices)
    condition_value = models.PositiveIntegerField(
        help_text=_("The N in the condition e.g. streak of 7 days → 7")
    )
    xp_reward  = models.PositiveIntegerField(default=100)
    is_active  = models.BooleanField(default=True)
    order      = models.PositiveSmallIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["order", "name"]

    def __str__(self):
        return f"{self.icon} {self.name} ({self.condition_type}={self.condition_value})"


class UserBadge(models.Model):
    """A user has earned a specific badge."""
    id        = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user      = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="badges",
    )
    badge     = models.ForeignKey(Badge, on_delete=models.CASCADE, related_name="earners")
    earned_at = models.DateTimeField(default=timezone.now)
    notified  = models.BooleanField(default=False)

    class Meta:
        unique_together = [["user", "badge"]]
        ordering        = ["-earned_at"]

    def __str__(self):
        return f"{self.user.username} earned {self.badge.name}"


class XPLevel(models.Model):
    """
    Level threshold definition.
    e.g. Level 1 = 0 XP, Level 2 = 500 XP, Level 5 = 5000 XP
    """
    level       = models.PositiveSmallIntegerField(unique=True)
    xp_required = models.PositiveIntegerField()
    title       = models.CharField(max_length=50, help_text=_("e.g. Bronze, Silver, Gold, Diamond"))
    icon        = models.CharField(max_length=10, default="⭐")
    color       = models.CharField(max_length=7, default="#E8400C")

    class Meta:
        ordering = ["level"]

    def __str__(self):
        return f"Level {self.level} — {self.title} ({self.xp_required} XP)"


class UserXP(models.Model):
    """
    Running XP total and current level for a user.
    OneToOne — one row per user, updated on every completion.
    """
    user          = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="xp",
        primary_key=True,
    )
    total_xp      = models.PositiveIntegerField(default=0)
    current_level = models.ForeignKey(
        XPLevel,
        null=True, blank=True,
        on_delete=models.SET_NULL,
        related_name="users_at_level",
    )
    updated_at    = models.DateTimeField(auto_now=True)

    def __str__(self):
        level_str = self.current_level.title if self.current_level else "Unranked"
        return f"{self.user.username} — {self.total_xp} XP ({level_str})"

    def add_xp(self, amount):
        """Add XP and recalculate level. Returns (new_total, leveled_up)."""
        self.total_xp += amount
        old_level = self.current_level
        self._recalculate_level()
        self.save()
        leveled_up = self.current_level != old_level
        return self.total_xp, leveled_up

    def _recalculate_level(self):
        """Find the highest level the user qualifies for."""
        level = (
            XPLevel.objects
            .filter(xp_required__lte=self.total_xp)
            .order_by("-level")
            .first()
        )
        self.current_level = level

    @property
    def xp_to_next_level(self):
        if not self.current_level:
            next_level = XPLevel.objects.order_by("level").first()
        else:
            next_level = (
                XPLevel.objects
                .filter(level__gt=self.current_level.level)
                .order_by("level")
                .first()
            )
        if not next_level:
            return 0  # max level reached
        return next_level.xp_required - self.total_xp

    @property
    def level_progress_pct(self):
        """Progress percentage toward next level (0–100)."""
        if not self.current_level:
            return 0
        next_level = (
            XPLevel.objects
            .filter(level__gt=self.current_level.level)
            .order_by("level")
            .first()
        )
        if not next_level:
            return 100
        level_xp_start = self.current_level.xp_required
        level_xp_range = next_level.xp_required - level_xp_start
        user_progress  = self.total_xp - level_xp_start
        if level_xp_range == 0:
            return 100
        return min(100, round((user_progress / level_xp_range) * 100, 1))


class Leaderboard(models.Model):
    """A period snapshot — weekly, monthly, or all-time."""

    class Period(models.TextChoices):
        WEEKLY   = "WEEKLY",   _("Weekly")
        MONTHLY  = "MONTHLY",  _("Monthly")
        ALL_TIME = "ALL_TIME", _("All Time")

    id         = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    period     = models.CharField(max_length=10, choices=Period.choices)
    started_at = models.DateField()
    ended_at   = models.DateField(null=True, blank=True)
    is_current = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering           = ["-started_at"]
        unique_together    = [["period", "started_at"]]

    def __str__(self):
        return f"{self.period} leaderboard — {self.started_at}"


class LeaderboardEntry(models.Model):
    """A user's rank and score in a specific leaderboard period."""
    id          = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    leaderboard = models.ForeignKey(Leaderboard, on_delete=models.CASCADE, related_name="entries")
    user        = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="leaderboard_entries",
    )
    rank        = models.PositiveSmallIntegerField()
    score       = models.PositiveIntegerField(default=0)
    completions = models.PositiveIntegerField(default=0)

    class Meta:
        unique_together = [["leaderboard", "user"]]
        ordering        = ["rank"]

    def __str__(self):
        return f"#{self.rank} {self.user.username} — {self.score} XP"
