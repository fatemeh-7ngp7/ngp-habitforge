"""
Celery tasks for the habits domain.
"""
import logging
from datetime import timedelta

from celery import shared_task
from django.utils import timezone

logger = logging.getLogger(__name__)


@shared_task(name="apps.habits.tasks.check_broken_streaks", bind=True, max_retries=3)
def check_broken_streaks(self):
    """
    Runs nightly at 00:05 UTC.
    Finds habits not completed yesterday and resets their current streak to 0.
    """
    from apps.habits.models import Habit, HabitStreak

    yesterday = timezone.now().date() - timedelta(days=1)
    broken_count = 0

    active_streaks = HabitStreak.objects.filter(
        current_streak__gt=0,
        habit__deleted_at__isnull=True,
        habit__is_archived=False,
    ).select_related("habit")

    for streak in active_streaks:
        # If last completion wasn't yesterday or today — streak is broken
        if streak.last_completion_date and streak.last_completion_date < yesterday:
            streak.current_streak = 0
            streak.save(update_fields=["current_streak", "updated_at"])
            broken_count += 1
            logger.info(
                "Streak broken for habit '%s' (user: %s)",
                streak.habit.title,
                streak.habit.user.email,
            )

    logger.info("check_broken_streaks complete — %d streaks reset", broken_count)
    return {"broken_streaks_reset": broken_count}


@shared_task(name="apps.habits.tasks.calculate_user_xp", bind=True)
def calculate_user_xp(self, user_id):
    """
    Recalculate total XP for a user from all completions.
    Called after bulk imports or data corrections.
    """
    from django.contrib.auth import get_user_model
    from django.db.models import Sum

    from apps.habits.models import HabitCompletion

    User = get_user_model()
    try:
        user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        logger.warning("calculate_user_xp: user %s not found", user_id)
        return

    total_xp = (
        HabitCompletion.objects
        .filter(habit__user=user)
        .aggregate(total=Sum("xp_earned"))["total"] or 0
    )

    logger.info("User %s total XP recalculated: %d", user.email, total_xp)
    return {"user_id": str(user_id), "total_xp": total_xp}
