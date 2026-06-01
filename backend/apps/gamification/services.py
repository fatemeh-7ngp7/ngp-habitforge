"""
Gamification service layer.
"""
import logging
from datetime import timedelta

from django.db.models import Count, Sum
from django.utils import timezone

logger = logging.getLogger(__name__)


def refresh_leaderboard(period="WEEKLY"):
    """
    Rebuild the current leaderboard for the given period.
    Called by Celery task — safe to run multiple times (idempotent).
    """
    from apps.gamification.models import Leaderboard, LeaderboardEntry
    from apps.habits.models import HabitCompletion

    today = timezone.now().date()

    if period == "WEEKLY":
        started_at = today - timedelta(days=today.weekday())  # Monday
        qs_filter  = {"completed_at__date__gte": started_at}
    elif period == "MONTHLY":
        started_at = today.replace(day=1)
        qs_filter  = {"completed_at__date__gte": started_at}
    else:  # ALL_TIME
        started_at = timezone.datetime(2025, 1, 1, tzinfo=timezone.utc).date()
        qs_filter  = {}

    # Get or create the leaderboard for this period
    leaderboard, _ = Leaderboard.objects.get_or_create(
        period=period,
        started_at=started_at,
        defaults={"is_current": True},
    )

    # Aggregate XP per user for the period
    user_scores = (
        HabitCompletion.objects
        .filter(**qs_filter)
        .values("habit__user", "habit__user__username")
        .annotate(
            total_xp=Sum("xp_earned"),
            completions=Count("id"),
        )
        .order_by("-total_xp")
    )

    # Rebuild entries
    LeaderboardEntry.objects.filter(leaderboard=leaderboard).delete()

    entries = []
    for rank, row in enumerate(user_scores, start=1):
        entries.append(LeaderboardEntry(
            leaderboard=leaderboard,
            user_id=row["habit__user"],
            rank=rank,
            score=row["total_xp"] or 0,
            completions=row["completions"],
        ))

    LeaderboardEntry.objects.bulk_create(entries)
    logger.info(
        "Leaderboard refreshed: %s — %d entries",
        period, len(entries),
    )
    return len(entries)
