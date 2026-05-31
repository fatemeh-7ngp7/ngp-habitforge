"""
Celery tasks for the notifications domain.
"""
import logging

from celery import shared_task
from django.utils import timezone

logger = logging.getLogger(__name__)


@shared_task(name="apps.notifications.tasks.send_morning_reminders")
def send_morning_reminders():
    """
    Runs daily at 07:00 UTC.
    Sends reminders for habits scheduled for today that aren't yet complete.
    Phase 2 will integrate FCM/APNs — for now we log.
    """
    from apps.habits.models import HabitCompletion, HabitReminder

    today     = timezone.now().date()
    weekday   = today.weekday()  # 0=Mon … 6=Sun
    sent      = 0
    skipped   = 0

    reminders = HabitReminder.objects.filter(
        is_enabled=True,
        habit__deleted_at__isnull=True,
        habit__is_archived=False,
    ).select_related("habit", "habit__user")

    for reminder in reminders:
        # Check if scheduled for today
        if reminder.days and weekday not in reminder.days:
            skipped += 1
            continue

        # Check if already completed today
        already_done = HabitCompletion.objects.filter(
            habit=reminder.habit,
            completed_at__date=today,
        ).exists()

        if already_done:
            skipped += 1
            continue

        # TODO Phase 9: push via FCM/APNs
        logger.info(
            "REMINDER → %s: '%s'",
            reminder.habit.user.email,
            reminder.habit.title,
        )
        sent += 1

    logger.info("send_morning_reminders: sent=%d skipped=%d", sent, skipped)
    return {"sent": sent, "skipped": skipped}


@shared_task(name="apps.notifications.tasks.send_weekly_digest")
def send_weekly_digest():
    """
    Runs every Monday at 08:00 UTC.
    Sends a weekly summary email to all active users.
    Phase 2 will integrate SendGrid — for now we log.
    """
    from django.contrib.auth import get_user_model

    from apps.analytics.services import get_dashboard_metrics

    User = get_user_model()
    users = User.objects.filter(is_active=True, deleted_at__isnull=True)
    sent  = 0

    for user in users:
        metrics = get_dashboard_metrics(user)
        # TODO Phase 9: send via SendGrid
        logger.info(
            "DIGEST → %s | completions: %d | rate: %s%% | xp: %d",
            user.email,
            metrics["completions_this_week"],
            metrics["completion_rate_7d"],
            metrics["total_xp"],
        )
        sent += 1

    logger.info("send_weekly_digest: sent to %d users", sent)
    return {"users_notified": sent}
