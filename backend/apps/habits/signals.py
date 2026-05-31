"""
Habit signals — auto-create streak row, update streak on completion.
"""
import logging

from django.db.models.signals import post_save
from django.dispatch import receiver

from .models import Habit, HabitCompletion, HabitStreak

logger = logging.getLogger(__name__)


@receiver(post_save, sender=Habit)
def create_habit_streak(sender, instance, created, **kwargs):
    """Create a HabitStreak row whenever a new Habit is saved."""
    if created:
        HabitStreak.objects.get_or_create(habit=instance)
        logger.debug("HabitStreak created for: %s", instance.title)


@receiver(post_save, sender=HabitCompletion)
def update_streak_on_completion(sender, instance, created, **kwargs):
    """Update streak counters every time a completion is recorded."""
    if created:
        streak, _ = HabitStreak.objects.get_or_create(habit=instance.habit)
        streak.record_completion(instance.completed_at.date())
        logger.info(
            "Streak updated: %s → %d days",
            instance.habit.title,
            streak.current_streak,
        )
