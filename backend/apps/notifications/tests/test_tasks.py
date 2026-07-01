"""
Tests for the Notifications domain — Celery tasks.
"""
import pytest
from django.utils import timezone

from apps.habits.enums import DifficultyLevel, HabitType
from apps.habits.models import Habit, HabitCompletion, HabitReminder
from apps.notifications.tasks import send_morning_reminders, send_weekly_digest


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
class TestSendMorningReminders:

    def test_sends_reminder_for_incomplete_habit_today(self, user):
        habit = make_habit(user)
        HabitReminder.objects.create(habit=habit, time="08:00", is_enabled=True)

        result = send_morning_reminders()

        assert result["sent"] == 1
        assert result["skipped"] == 0

    def test_skips_disabled_reminder(self, user):
        habit = make_habit(user)
        HabitReminder.objects.create(habit=habit, time="08:00", is_enabled=False)

        result = send_morning_reminders()

        assert result["sent"] == 0

    def test_skips_reminder_not_scheduled_today(self, user):
        habit = make_habit(user)
        # weekday() gives 0=Mon..6=Sun; pick a day that is NOT today
        not_today = (timezone.now().date().weekday() + 1) % 7
        HabitReminder.objects.create(
            habit=habit, time="08:00", is_enabled=True, days=[not_today]
        )

        result = send_morning_reminders()

        assert result["sent"] == 0
        assert result["skipped"] == 1

    def test_skips_already_completed_habit(self, user):
        habit = make_habit(user)
        HabitReminder.objects.create(habit=habit, time="08:00", is_enabled=True)
        HabitCompletion.objects.create(habit=habit, completed_at=timezone.now())

        result = send_morning_reminders()

        assert result["sent"] == 0
        assert result["skipped"] == 1

    def test_skips_archived_habit_reminder(self, user):
        habit = make_habit(user, is_archived=True)
        HabitReminder.objects.create(habit=habit, time="08:00", is_enabled=True)

        result = send_morning_reminders()

        assert result["sent"] == 0
        assert result["skipped"] == 0  # excluded entirely at the queryset level

    def test_no_reminders_returns_zero_counts(self):
        result = send_morning_reminders()
        assert result == {"sent": 0, "skipped": 0}


@pytest.mark.django_db
class TestSendWeeklyDigest:

    def test_sends_to_active_users(self, user, second_user):
        result = send_weekly_digest()
        assert result["users_notified"] == 2

    def test_excludes_inactive_users(self, user, second_user):
        second_user.is_active = False
        second_user.save()

        result = send_weekly_digest()

        assert result["users_notified"] == 1

    def test_excludes_soft_deleted_users(self, user, second_user):
        second_user.deleted_at = timezone.now()
        second_user.save()

        result = send_weekly_digest()

        assert result["users_notified"] == 1

    def test_no_active_users_returns_zero(self, user):
        user.is_active = False
        user.save()

        result = send_weekly_digest()

        assert result["users_notified"] == 0