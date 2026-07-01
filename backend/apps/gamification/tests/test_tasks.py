"""
Tests for the Gamification domain — Celery tasks.
"""
import pytest
from django.utils import timezone

from apps.gamification.models import Leaderboard
from apps.gamification.tasks import refresh_leaderboards
from apps.habits.enums import DifficultyLevel, HabitType
from apps.habits.models import Habit, HabitCompletion


def make_habit(user, **kwargs):
    defaults = {
        "title":          "Test Habit",
        "habit_type":     HabitType.BINARY,
        "frequency_type": "DAILY",
        "difficulty":     DifficultyLevel.MEDIUM,
        "user":           user,
    }
    defaults.update(kwargs)
    return Habit.objects.create(**defaults)


@pytest.mark.django_db
class TestRefreshLeaderboards:

    def test_refreshes_all_three_periods(self, user):
        result = refresh_leaderboards()
        assert set(result.keys()) == {"WEEKLY", "MONTHLY", "ALL_TIME"}

    def test_creates_leaderboard_rows_for_each_period(self, user):
        refresh_leaderboards()
        periods = set(Leaderboard.objects.values_list("period", flat=True))
        assert periods == {"WEEKLY", "MONTHLY", "ALL_TIME"}

    def test_counts_reflect_completions_with_xp(self, user):
        habit = make_habit(user)
        HabitCompletion.objects.create(
            habit=habit, completed_at=timezone.now(), xp_earned=25
        )

        result = refresh_leaderboards()

        assert result["ALL_TIME"] >= 1

    def test_idempotent_when_run_twice(self, user):
        habit = make_habit(user)
        HabitCompletion.objects.create(
            habit=habit, completed_at=timezone.now(), xp_earned=25
        )

        first  = refresh_leaderboards()
        second = refresh_leaderboards()

        assert first == second