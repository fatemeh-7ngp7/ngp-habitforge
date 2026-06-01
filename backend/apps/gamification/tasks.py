"""
Gamification Celery tasks.
"""
import logging

from celery import shared_task

logger = logging.getLogger(__name__)


@shared_task(name="apps.gamification.tasks.refresh_leaderboards")
def refresh_leaderboards():
    """
    Refresh all leaderboard periods.
    Scheduled via Celery beat — runs every hour.
    """
    from apps.gamification.services import refresh_leaderboard

    results = {}
    for period in ["WEEKLY", "MONTHLY", "ALL_TIME"]:
        count = refresh_leaderboard(period)
        results[period] = count
        logger.info("Leaderboard %s: %d entries", period, count)

    return results
