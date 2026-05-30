"""
Tests for analytics endpoints.
"""
import pytest
from apps.habits.models import Habit, HabitCompletion
from apps.habits.enums import HabitType

DASHBOARD_URL = "/api/v2/analytics/dashboard/"
HEATMAP_URL   = "/api/v2/analytics/heatmap/"
WEEKLY_URL    = "/api/v2/analytics/weekly/"


def make_habit(user, **kwargs):
    """
    Helper — caller controls all fields including difficulty.
    No defaults that could conflict with kwargs.
    """
    fields = {
        "user":           user,
        "title":          kwargs.pop("title", "Test Habit"),
        "habit_type":     kwargs.pop("habit_type", HabitType.BINARY),
        "frequency_type": kwargs.pop("frequency_type", "DAILY"),
        "difficulty":     kwargs.pop("difficulty", "MEDIUM"),
    }
    fields.update(kwargs)
    return Habit.objects.create(**fields)


@pytest.mark.django_db
class TestDashboardView:

    def test_returns_200_for_authenticated_user(self, auth_client):
        response = auth_client.get(DASHBOARD_URL)
        assert response.status_code == 200
        assert response.json()["success"] is True

    def test_unauthenticated_returns_401(self, api_client):
        response = api_client.get(DASHBOARD_URL)
        assert response.status_code == 401

    def test_dashboard_counts_active_habits(self, auth_client, user):
        make_habit(user)
        make_habit(user)
        response = auth_client.get(DASHBOARD_URL)
        assert response.json()["data"]["active_habits"] == 2

    def test_archived_habits_excluded(self, auth_client, user):
        make_habit(user)
        make_habit(user, is_archived=True)
        response = auth_client.get(DASHBOARD_URL)
        assert response.json()["data"]["active_habits"] == 1

    def test_completed_today_count(self, auth_client, user):
        habit = make_habit(user)
        HabitCompletion.objects.create(habit=habit)
        response = auth_client.get(DASHBOARD_URL)
        data = response.json()["data"]
        assert data["completed_today"] == 1
        assert data["remaining_today"] == 0

    def test_xp_totals_correctly(self, auth_client, user):
        # Pass difficulty explicitly — no conflict with make_habit defaults
        habit = make_habit(user, difficulty="HARD")
        HabitCompletion.objects.create(habit=habit, xp_earned=50)
        response = auth_client.get(DASHBOARD_URL)
        assert response.json()["data"]["total_xp"] == 50

    def test_dashboard_isolated_between_users(self, auth_client, second_user):
        make_habit(second_user)
        response = auth_client.get(DASHBOARD_URL)
        assert response.json()["data"]["active_habits"] == 0


@pytest.mark.django_db
class TestHeatmapView:

    def test_heatmap_returns_200(self, auth_client):
        response = auth_client.get(HEATMAP_URL)
        assert response.status_code == 200
        data = response.json()["data"]
        assert "year" in data
        assert "heatmap" in data
        assert "total" in data

    def test_heatmap_counts_completion(self, auth_client, user):
        habit = make_habit(user)
        HabitCompletion.objects.create(habit=habit)
        response = auth_client.get(f"{HEATMAP_URL}?year=2026")
        data = response.json()["data"]
        assert data["total"] >= 1

    def test_heatmap_year_filter(self, auth_client):
        response = auth_client.get(f"{HEATMAP_URL}?year=2025")
        data = response.json()["data"]
        assert data["year"] == 2025
        assert data["total"] == 0


@pytest.mark.django_db
class TestWeeklyBreakdownView:

    def test_weekly_returns_all_days(self, auth_client):
        response = auth_client.get(WEEKLY_URL)
        assert response.status_code == 200
        data = response.json()["data"]
        for day in ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]:
            assert day in data["breakdown"]

    def test_best_day_is_none_with_no_completions(self, auth_client):
        response = auth_client.get(WEEKLY_URL)
        assert response.status_code == 200
