"""
Tests for the Analytics domain — Celery tasks.
"""
import pytest
from django.utils import timezone

from apps.analytics.tasks import aggregate_hourly_stats
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
class TestAggregateHourlyStats:

    def test_counts_completions_in_current_hour(self, user):
        habit = make_habit(user)
        HabitCompletion.objects.create(habit=habit, completed_at=timezone.now())

        result = aggregate_hourly_stats()

        assert result["completions_this_hour"] == 1

    def test_zero_when_no_completions(self, user):
        make_habit(user)
        result = aggregate_hourly_stats()
        assert result["completions_this_hour"] == 0

    def test_excludes_completions_from_other_hours(self, user):
        from datetime import timedelta
        habit = make_habit(user)
        # A completion 3 hours ago should not count toward "this hour"
        HabitCompletion.objects.create(
            habit=habit, completed_at=timezone.now() - timedelta(hours=3)
        )

        result = aggregate_hourly_stats()

        assert result["completions_this_hour"] == 0

    def test_counts_across_multiple_users(self, user, second_user):
        habit_a = make_habit(user)
        habit_b = make_habit(second_user)
        HabitCompletion.objects.create(habit=habit_a, completed_at=timezone.now())
        HabitCompletion.objects.create(habit=habit_b, completed_at=timezone.now())

        result = aggregate_hourly_stats()

        assert result["completions_this_hour"] == 2