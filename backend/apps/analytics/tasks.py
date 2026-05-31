"""
Celery tasks for analytics aggregation.
"""
import logging
from celery import shared_task

logger = logging.getLogger(__name__)


@shared_task(name="apps.analytics.tasks.aggregate_hourly_stats")
def aggregate_hourly_stats():
    """
    Runs every hour.
    In production this would materialise TimescaleDB continuous aggregates.
    For now — log a heartbeat to confirm Celery beat is running.
    """
    from django.utils import timezone
    from apps.habits.models import HabitCompletion

    hour_completions = HabitCompletion.objects.filter(
        completed_at__hour=timezone.now().hour,
        completed_at__date=timezone.now().date(),
    ).count()

    logger.info(
        "aggregate_hourly_stats @ %s — completions this hour: %d",
        timezone.now().strftime("%H:%M"),
        hour_completions,
    )
    return {"completions_this_hour": hour_completions}
