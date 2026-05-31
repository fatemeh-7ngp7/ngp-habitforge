"""
Tests for the Habits domain — models + API.
"""
import pytest
from django.utils import timezone

from apps.habits.enums import DifficultyLevel, HabitType
from apps.habits.models import Habit, HabitCompletion, HabitStreak

HABITS_URL  = "/api/v2/habits/"


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
class TestHabitModel:

    def test_habit_creation(self, user):
        habit = make_habit(user, title="Read 30 pages")
        assert habit.title == "Read 30 pages"
        assert habit.is_deleted is False
        assert habit.get_xp_value() == 25  # MEDIUM

    def test_streak_auto_created_via_signal(self, user):
        habit = make_habit(user)
        assert hasattr(habit, "streak")
        assert isinstance(habit.streak, HabitStreak)
        assert habit.streak.current_streak == 0

    def test_xp_values_by_difficulty(self, user):
        assert make_habit(user, difficulty="EASY").get_xp_value()   == 10
        assert make_habit(user, difficulty="MEDIUM").get_xp_value() == 25
        assert make_habit(user, difficulty="HARD").get_xp_value()   == 50

    def test_soft_delete(self, user):
        habit = make_habit(user)
        habit.soft_delete()
        assert habit.is_deleted is True
        assert habit.deleted_at is not None

    def test_soft_deleted_habit_hidden_from_queryset(self, user):
        habit = make_habit(user, title="Deleted Habit")
        habit.soft_delete()
        qs = Habit.objects.filter(user=user, deleted_at__isnull=True)
        assert habit not in qs


@pytest.mark.django_db
class TestHabitStreakLogic:

    def test_first_completion_starts_streak(self, user):
        habit = make_habit(user)
        streak = habit.streak
        streak.record_completion()
        assert streak.current_streak == 1
        assert streak.longest_streak == 1
        assert streak.total_completions == 1

    def test_consecutive_day_increments_streak(self, user):
        from datetime import date, timedelta
        habit = make_habit(user)
        streak = habit.streak
        today     = date.today()
        yesterday = today - timedelta(days=1)

        streak.record_completion(yesterday)
        streak.record_completion(today)

        assert streak.current_streak == 2
        assert streak.longest_streak == 2

    def test_broken_streak_resets_to_one(self, user):
        from datetime import date, timedelta
        habit = make_habit(user)
        streak = habit.streak
        five_days_ago = date.today() - timedelta(days=5)
        streak.record_completion(five_days_ago)
        assert streak.current_streak == 1
        # New completion after gap resets streak
        streak.record_completion(date.today())
        assert streak.current_streak == 1

    def test_longest_streak_never_decreases(self, user):
        from datetime import date, timedelta
        habit = make_habit(user)
        streak = habit.streak
        today = date.today()

        # Build a 3-day streak: 3 days ago, 2 days ago, 1 day ago
        for i in range(3, 0, -1):
            streak.record_completion(today - timedelta(days=i))

        assert streak.longest_streak == 3

        # Complete today — streak extends to 4 (still consecutive)
        streak.record_completion(today)
        assert streak.current_streak == 4
        assert streak.longest_streak == 4  # correctly grows

        # Now simulate a BROKEN streak — jump forward 5 days
        future_broken = today + timedelta(days=6)
        streak.record_completion(future_broken)
        assert streak.current_streak == 1          # streak reset
        assert streak.longest_streak == 4          # longest NEVER drops


@pytest.mark.django_db
class TestHabitAPI:

    def test_list_habits_authenticated(self, auth_client, user):
        make_habit(user, title="Habit A")
        make_habit(user, title="Habit B")
        response = auth_client.get(HABITS_URL)
        assert response.status_code == 200
        assert response.json()["meta"]["count"] == 2

    def test_list_habits_unauthenticated(self, api_client):
        response = api_client.get(HABITS_URL)
        assert response.status_code == 401

    def test_create_binary_habit(self, auth_client):
        payload = {
            "title":          "Meditate",
            "habit_type":     "BINARY",
            "frequency_type": "DAILY",
            "difficulty":     "EASY",
        }
        response = auth_client.post(HABITS_URL, payload, format="json")
        assert response.status_code == 201
        data = response.json()["data"]
        assert data["title"] == "Meditate"
        assert data["streak"]["current_streak"] == 0
        assert data["xp_per_completion"] == 10

    def test_create_measurable_habit_requires_target(self, auth_client):
        payload = {
            "title":          "Run",
            "habit_type":     "MEASURABLE",
            "frequency_type": "DAILY",
            "difficulty":     "HARD",
            # Missing target_value and target_unit
        }
        response = auth_client.post(HABITS_URL, payload, format="json")
        assert response.status_code == 400

    def test_user_cannot_see_other_users_habits(self, auth_client, second_user):
        make_habit(second_user, title="Private Habit")
        response = auth_client.get(HABITS_URL)
        titles = [h["title"] for h in response.json()["data"]]
        assert "Private Habit" not in titles

    def test_complete_habit(self, auth_client, user):
        habit = make_habit(user)
        url = f"{HABITS_URL}{habit.id}/complete/"
        response = auth_client.post(url, {}, format="json")
        assert response.status_code == 200
        data = response.json()["data"]
        assert data["streak"]["current_streak"] == 1
        assert data["xp_earned"] == 25  # MEDIUM

    def test_double_completion_same_day_rejected(self, auth_client, user):
        habit = make_habit(user)
        url = f"{HABITS_URL}{habit.id}/complete/"
        auth_client.post(url, {}, format="json")
        response = auth_client.post(url, {}, format="json")
        assert response.status_code == 409

    def test_soft_delete_via_api(self, auth_client, user):
        habit = make_habit(user)
        url = f"{HABITS_URL}{habit.id}/"
        response = auth_client.delete(url)
        assert response.status_code == 200
        habit.refresh_from_db()
        assert habit.is_deleted is True

    def test_deleted_habit_not_in_list(self, auth_client, user):
        habit = make_habit(user, title="Soon deleted")
        habit.soft_delete()
        response = auth_client.get(HABITS_URL)
        titles = [h["title"] for h in response.json()["data"]]
        assert "Soon deleted" not in titles

    def test_partial_update_habit(self, auth_client, user):
        habit = make_habit(user, title="Original Title")
        url = f"{HABITS_URL}{habit.id}/"
        response = auth_client.patch(url, {"title": "Updated Title"}, format="json")
        assert response.status_code == 200
        assert response.json()["data"]["title"] == "Updated Title"

    def test_streak_endpoint(self, auth_client, user):
        habit = make_habit(user)
        url = f"{HABITS_URL}{habit.id}/streak/"
        response = auth_client.get(url)
        assert response.status_code == 200
        data = response.json()["data"]
        assert "current_streak" in data
        assert "longest_streak" in data
        assert "total_completions" in data
