"""
Social domain models.

Friendship         — bidirectional friend relationship with status
GroupChallenge     — shared habit challenge between multiple users
ChallengeParticipant — join table with score tracking
SocialFeedItem     — activity feed events (completions, streaks, milestones)
"""
import uuid

from django.conf import settings
from django.db import models
from django.utils import timezone
from django.utils.translation import gettext_lazy as _


class Friendship(models.Model):
    """
    Bidirectional friend relationship.
    One row per directed request — requester sends to addressee.
    Accepted = both directions are implied.
    """

    class Status(models.TextChoices):
        PENDING  = "PENDING",  _("Pending")
        ACCEPTED = "ACCEPTED", _("Accepted")
        DECLINED = "DECLINED", _("Declined")
        BLOCKED  = "BLOCKED",  _("Blocked")

    id        = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    requester = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="sent_friend_requests",
    )
    addressee = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="received_friend_requests",
    )
    status     = models.CharField(max_length=10, choices=Status.choices, default=Status.PENDING)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = [["requester", "addressee"]]
        indexes = [
            models.Index(fields=["requester", "status"]),
            models.Index(fields=["addressee", "status"]),
        ]

    def __str__(self):
        return f"{self.requester.username} → {self.addressee.username} [{self.status}]"

    def accept(self):
        self.status = self.Status.ACCEPTED
        self.save(update_fields=["status", "updated_at"])

    def decline(self):
        self.status = self.Status.DECLINED
        self.save(update_fields=["status", "updated_at"])


class GroupChallenge(models.Model):
    """
    A shared habit challenge that multiple users join.
    Tied to a specific habit category or template.
    """

    class Privacy(models.TextChoices):
        PUBLIC  = "PUBLIC",  _("Public — anyone can join")
        INVITE  = "INVITE",  _("Invite only")
        PRIVATE = "PRIVATE", _("Private — hidden from search")

    id          = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title       = models.CharField(max_length=200)
    description = models.TextField(blank=True, max_length=1000)
    created_by  = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="created_challenges",
    )
    habit_type     = models.CharField(max_length=20, default="BINARY")
    target_value   = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    target_unit    = models.CharField(max_length=30, blank=True)
    privacy        = models.CharField(max_length=10, choices=Privacy.choices, default=Privacy.PUBLIC)
    max_participants = models.PositiveSmallIntegerField(default=50)
    start_date     = models.DateField()
    end_date       = models.DateField()
    invite_code    = models.CharField(max_length=10, unique=True, blank=True)
    is_active      = models.BooleanField(default=True)
    created_at     = models.DateTimeField(auto_now_add=True)
    updated_at     = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        indexes  = [
            models.Index(fields=["is_active", "privacy"]),
            models.Index(fields=["start_date", "end_date"]),
        ]

    def __str__(self):
        return f"{self.title} ({self.start_date} → {self.end_date})"

    def save(self, *args, **kwargs):
        if not self.invite_code:
            import random
            import string
            self.invite_code = "".join(
                random.choices(string.ascii_uppercase + string.digits, k=8)
            )
        super().save(*args, **kwargs)

    @property
    def is_ongoing(self):
        today = timezone.now().date()
        return self.start_date <= today <= self.end_date

    @property
    def participant_count(self):
        return self.participants.count()


class ChallengeParticipant(models.Model):
    """Join table — user participates in a challenge with a running score."""
    id          = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    challenge   = models.ForeignKey(GroupChallenge, on_delete=models.CASCADE, related_name="participants")
    user        = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="challenge_participations")
    score       = models.PositiveIntegerField(default=0)
    completions = models.PositiveIntegerField(default=0)
    joined_at   = models.DateTimeField(auto_now_add=True)
    last_active = models.DateTimeField(null=True, blank=True)

    class Meta:
        unique_together = [["challenge", "user"]]
        ordering        = ["-score"]
        indexes         = [
            models.Index(fields=["challenge", "score"]),
        ]

    def __str__(self):
        return f"{self.user.username} in {self.challenge.title} (score: {self.score})"

    def record_completion(self, points=25):
        self.score += points
        self.completions += 1
        self.last_active = timezone.now()
        self.save(update_fields=["score", "completions", "last_active"])


class SocialFeedItem(models.Model):
    """
    Activity feed — one item per notable event (completion, streak, challenge join).
    Shown to friends on their social feed.
    """

    class EventType(models.TextChoices):
        HABIT_COMPLETED = "HABIT_COMPLETED", _("Habit Completed")
        STREAK_REACHED  = "STREAK_REACHED",  _("Streak Milestone")
        CHALLENGE_JOINED= "CHALLENGE_JOINED",_("Joined Challenge")
        CHALLENGE_WON   = "CHALLENGE_WON",   _("Won Challenge")
        BADGE_EARNED    = "BADGE_EARNED",    _("Badge Earned")

    id         = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user       = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="feed_items",
    )
    event_type = models.CharField(max_length=30, choices=EventType.choices)
    title      = models.CharField(max_length=200)
    body       = models.TextField(blank=True)
    payload    = models.JSONField(default=dict)
    is_public  = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        ordering = ["-created_at"]
        indexes  = [
            models.Index(fields=["user", "created_at"]),
            models.Index(fields=["is_public", "created_at"]),
        ]

    def __str__(self):
        return f"{self.user.username} — {self.event_type} @ {self.created_at:%Y-%m-%d}"
