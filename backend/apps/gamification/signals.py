"""
Gamification signals — trigger badge evaluation and XP update
after every HabitCompletion.
"""
import logging

from django.db.models.signals import post_save
from django.dispatch import receiver

logger = logging.getLogger(__name__)


@receiver(post_save, sender="habits.HabitCompletion")
def on_habit_completed(sender, instance, created, **kwargs):
    """
    After every new completion:
    1. Add XP to UserXP (create if first time)
    2. Run badge engine for the habit's owner
    """
    if not created:
        return

    from apps.gamification.engine import BadgeAwardEngine
    from apps.gamification.models import UserXP

    user = instance.habit.user

    # 1. Add XP
    user_xp, _ = UserXP.objects.get_or_create(user=user)
    new_total, leveled_up = user_xp.add_xp(instance.xp_earned)

    if leveled_up:
        logger.info(
            "Level up! %s → Level %s (%d XP)",
            user.username,
            user_xp.current_level.title if user_xp.current_level else "?",
            new_total,
        )

    # 2. Evaluate badges
    engine = BadgeAwardEngine(user)
    awarded = engine.evaluate()

    if awarded:
        logger.info(
            "%d badge(s) awarded to %s: %s",
            len(awarded),
            user.username,
            [b.badge.name for b in awarded],
        )
