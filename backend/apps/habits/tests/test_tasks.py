"""
Tests for the Habits domain — Celery tasks.
"""
import pytest
from datetime import timedelta

from django.utils import timezone

from apps.habits.enums import DifficultyLevel, HabitType
from apps.habits.models import Habit, HabitCompletion
from apps.habits.tasks import calculate_user_xp, check_broken_streaks


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
class TestCheckBrokenStreaks:

    def test_streak_reset_when_last_completion_before_yesterday(self, user):
        habit = make_habit(user)
        habit.streak.current_streak = 5
        habit.streak.last_completion_date = timezone.now().date() - timedelta(days=3)
        habit.streak.save()

        result = check_broken_streaks()

        habit.streak.refresh_from_db()
        assert habit.streak.current_streak == 0
        assert result["broken_streaks_reset"] == 1

    def test_streak_untouched_when_completed_yesterday(self, user):
        habit = make_habit(user)
        habit.streak.current_streak = 5
        habit.streak.last_completion_date = timezone.now().date() - timedelta(days=1)
        habit.streak.save()

        result = check_broken_streaks()

        habit.streak.refresh_from_db()
        assert habit.streak.current_streak == 5
        assert result["broken_streaks_reset"] == 0

    def test_streak_untouched_when_completed_today(self, user):
        habit = make_habit(user)
        habit.streak.current_streak = 3
        habit.streak.last_completion_date = timezone.now().date()
        habit.streak.save()

        result = check_broken_streaks()

        habit.streak.refresh_from_db()
        assert habit.streak.current_streak == 3

    def test_zero_streaks_not_touched(self, user):
        habit = make_habit(user)
        # streak.current_streak defaults to 0 via signal
        result = check_broken_streaks()
        assert result["broken_streaks_reset"] == 0

    def test_archived_habit_excluded(self, user):
        habit = make_habit(user, is_archived=True)
        habit.streak.current_streak = 5
        habit.streak.last_completion_date = timezone.now().date() - timedelta(days=3)
        habit.streak.save()

        result = check_broken_streaks()

        habit.streak.refresh_from_db()
        assert habit.streak.current_streak == 5  # untouched — excluded
        assert result["broken_streaks_reset"] == 0

    def test_deleted_habit_excluded(self, user):
        habit = make_habit(user)
        habit.streak.current_streak = 5
        habit.streak.last_completion_date = timezone.now().date() - timedelta(days=3)
        habit.streak.save()
        habit.soft_delete()

        result = check_broken_streaks()

        habit.streak.refresh_from_db()
        assert habit.streak.current_streak == 5  # untouched — excluded
        assert result["broken_streaks_reset"] == 0


@pytest.mark.django_db
class TestCalculateUserXp:

    def test_recalculates_total_xp_from_completions(self, user):
        habit = make_habit(user)
        HabitCompletion.objects.create(habit=habit, xp_earned=25)
        HabitCompletion.objects.create(habit=habit, xp_earned=10)

        result = calculate_user_xp(user_id=user.id)

        assert result["total_xp"] == 35
        assert result["user_id"] == str(user.id)

    def test_zero_xp_when_no_completions(self, user):
        make_habit(user)
        result = calculate_user_xp(user_id=user.id)
        assert result["total_xp"] == 0

    def test_only_counts_own_completions(self, user, second_user):
        habit = make_habit(user)
        other_habit = make_habit(second_user)
        HabitCompletion.objects.create(habit=habit, xp_earned=25)
        HabitCompletion.objects.create(habit=other_habit, xp_earned=100)

        result = calculate_user_xp(user_id=user.id)

        assert result["total_xp"] == 25

    def test_nonexistent_user_returns_none(self):
        import uuid
        result = calculate_user_xp(user_id=uuid.uuid4())
        assert result is None