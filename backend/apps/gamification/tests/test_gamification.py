"""
Tests for the Gamification domain — badges, XP, engine, leaderboard.
"""
import pytest
from django.utils import timezone

from apps.gamification.engine import BadgeAwardEngine
from apps.gamification.models import Badge, Leaderboard, UserBadge, UserXP, XPLevel
from apps.habits.enums import HabitType
from apps.habits.models import Habit, HabitCompletion

BADGES_URL      = "/api/v2/gamification/badges/"
MY_BADGES_URL   = "/api/v2/gamification/badges/mine/"
XP_URL          = "/api/v2/gamification/xp/"
LEADERBOARD_URL = "/api/v2/gamification/leaderboard/"
SEED_URL        = "/api/v2/gamification/badges/seed/"


def make_badge(**kwargs):
    defaults = {
        "name":            "Test Badge",
        "description":     "A test badge",
        "icon":            "🏆",
        "condition_type":  "TOTAL_COMPLETIONS",
        "condition_value": 1,
        "xp_reward":       100,
    }
    defaults.update(kwargs)
    return Badge.objects.create(**defaults)


def make_habit(user, title="Test Habit", **kwargs):
    """
    Explicit title parameter — avoids double-keyword conflicts
    when callers pass title as a keyword argument.
    """
    return Habit.objects.create(
        user=user,
        title=title,
        habit_type=HabitType.BINARY,
        frequency_type="DAILY",
        difficulty="MEDIUM",
        **kwargs,
    )


def make_xp_levels():
    levels = [
        (1, 0,    "Beginner", "🌱", "#95A5A6"),
        (2, 500,  "Bronze",   "🥉", "#CD7F32"),
        (3, 1500, "Silver",   "🥈", "#C0C0C0"),
        (4, 3500, "Gold",     "🥇", "#FFD700"),
    ]
    for level, xp, title, icon, color in levels:
        XPLevel.objects.get_or_create(
            level=level,
            defaults={"xp_required": xp, "title": title, "icon": icon, "color": color},
        )


@pytest.mark.django_db
class TestBadgeModel:

    def test_badge_creation(self):
        badge = make_badge(name="First Step", condition_value=1)
        assert badge.name == "First Step"
        assert badge.is_active is True
        assert badge.xp_reward == 100

    def test_user_badge_unique(self, user):
        badge = make_badge()
        UserBadge.objects.create(user=user, badge=badge)
        with pytest.raises(Exception):
            UserBadge.objects.create(user=user, badge=badge)


@pytest.mark.django_db
class TestUserXP:

    def test_xp_starts_at_zero(self, user):
        user_xp, created = UserXP.objects.get_or_create(user=user)
        assert user_xp.total_xp == 0
        assert created is True

    def test_add_xp(self, user):
        make_xp_levels()
        user_xp, _ = UserXP.objects.get_or_create(user=user)
        new_total, leveled_up = user_xp.add_xp(250)
        assert new_total == 250
        assert user_xp.total_xp == 250

    def test_level_up_on_xp_threshold(self, user):
        make_xp_levels()
        user_xp, _ = UserXP.objects.get_or_create(user=user)
        user_xp.add_xp(600)  # crosses level 2 threshold (500 XP)
        assert user_xp.current_level is not None
        assert user_xp.current_level.level == 2

    def test_xp_to_next_level(self, user):
        make_xp_levels()
        user_xp, _ = UserXP.objects.get_or_create(user=user)
        user_xp.add_xp(100)
        # Need 500 for Bronze, have 100 → 400 remaining
        assert user_xp.xp_to_next_level == 400

    def test_level_progress_pct(self, user):
        make_xp_levels()
        user_xp, _ = UserXP.objects.get_or_create(user=user)
        user_xp.add_xp(500)   # exactly at Bronze threshold
        user_xp.add_xp(500)   # 1000 XP — halfway to Silver (1500)
        pct = user_xp.level_progress_pct
        assert 0 < pct <= 100


@pytest.mark.django_db
class TestBadgeAwardEngine:

    def test_awards_first_completion_badge(self, user):
        """
        The signal fires automatically on HabitCompletion creation.
        We verify the badge was awarded via the signal — not by calling engine manually.
        """
        make_xp_levels()
        badge = make_badge(
            name="First Step",
            condition_type="TOTAL_COMPLETIONS",
            condition_value=1,
            xp_reward=50,
        )
        habit = make_habit(user)

        # Creating the completion triggers the signal → engine → badge awarded
        HabitCompletion.objects.create(habit=habit, xp_earned=25)

        # Verify badge was awarded via signal chain
        assert UserBadge.objects.filter(user=user, badge=badge).exists()

    def test_does_not_award_badge_twice(self, user):
        """Badge already earned — engine skips it on second evaluation."""
        make_xp_levels()
        badge = make_badge(
            condition_type="TOTAL_COMPLETIONS",
            condition_value=1,
        )
        habit = make_habit(user)

        # First completion — signal fires, badge awarded
        HabitCompletion.objects.create(habit=habit, xp_earned=25)
        assert UserBadge.objects.filter(user=user, badge=badge).count() == 1

        # Run engine manually a second time — should NOT award again
        engine = BadgeAwardEngine(user)
        awarded = engine.evaluate()
        assert len(awarded) == 0
        assert UserBadge.objects.filter(user=user, badge=badge).count() == 1

    def test_streak_badge_condition(self, user):
        """Badge requires 3-day streak — build it directly on the streak model."""
        make_xp_levels()
        from datetime import date, timedelta
        badge = make_badge(
            name="3-Day Streak",
            condition_type="STREAK_DAYS",
            condition_value=3,
        )
        habit = make_habit(user)
        # Build 3-day streak directly
        streak = habit.streak
        today = date.today()
        for i in range(2, -1, -1):
            streak.record_completion(today - timedelta(days=i))

        engine = BadgeAwardEngine(user)
        awarded = engine.evaluate()
        assert any(a.badge == badge for a in awarded)

    def test_habits_created_badge(self, user):
        """Badge requires 2 habits — create them with distinct titles."""
        make_xp_levels()
        badge = make_badge(
            name="Habit Builder",
            condition_type="HABITS_CREATED",
            condition_value=2,
        )
        # Use explicit distinct titles — no conflict with make_habit defaults
        make_habit(user, title="Morning Run")
        make_habit(user, title="Evening Walk")

        engine = BadgeAwardEngine(user)
        awarded = engine.evaluate()
        assert any(a.badge == badge for a in awarded)

    def test_inactive_badge_not_awarded(self, user):
        """Inactive badges are skipped by the engine."""
        make_xp_levels()
        make_badge(
            condition_type="TOTAL_COMPLETIONS",
            condition_value=1,
            is_active=False,
        )
        habit = make_habit(user)
        HabitCompletion.objects.create(habit=habit, xp_earned=25)

        # Only inactive badge exists — nothing should be awarded
        awarded_count = UserBadge.objects.filter(user=user).count()
        assert awarded_count == 0

    def test_xp_includes_both_completion_and_badge_xp(self, user):
        """
        Total XP = completion XP (25) + badge XP (200) = 225.
        Both are added: completion XP via signal, badge XP via engine.
        """
        make_xp_levels()
        make_badge(
            name="First Step",
            condition_type="TOTAL_COMPLETIONS",
            condition_value=1,
            xp_reward=200,
        )
        habit = make_habit(user)

        # Signal fires: adds 25 XP (completion) + 200 XP (badge) = 225
        HabitCompletion.objects.create(habit=habit, xp_earned=25)

        user_xp = UserXP.objects.get(user=user)
        assert user_xp.total_xp == 225  # 25 completion + 200 badge

    def test_challenge_joined_badge(self, user):
        """Badge requires joining 1 challenge."""
        make_xp_levels()
        from datetime import date, timedelta

        from apps.social.models import ChallengeParticipant, GroupChallenge

        badge = make_badge(
            name="Social Butterfly",
            condition_type="CHALLENGE_JOINED",
            condition_value=1,
        )
        today = date.today()
        challenge = GroupChallenge.objects.create(
            title="Test Challenge",
            created_by=user,
            start_date=today,
            end_date=today + timedelta(days=7),
        )
        ChallengeParticipant.objects.create(challenge=challenge, user=user)

        engine = BadgeAwardEngine(user)
        awarded = engine.evaluate()
        assert any(a.badge == badge for a in awarded)


@pytest.mark.django_db
class TestGamificationAPI:

    def test_badges_list_requires_auth(self, api_client):
        response = api_client.get(BADGES_URL)
        assert response.status_code == 401

    def test_badges_list_authenticated(self, auth_client):
        make_badge(name="Badge A")
        make_badge(name="Badge B")
        response = auth_client.get(BADGES_URL)
        assert response.status_code == 200
        assert response.json()["meta"]["count"] == 2

    def test_badge_shows_not_earned_initially(self, auth_client):
        make_badge()
        response = auth_client.get(BADGES_URL)
        assert response.json()["data"][0]["earned"] is False

    def test_badge_shows_earned_after_award(self, auth_client, user):
        badge = make_badge()
        UserBadge.objects.create(user=user, badge=badge)
        response = auth_client.get(BADGES_URL)
        assert response.json()["data"][0]["earned"] is True

    def test_my_badges_empty_initially(self, auth_client):
        response = auth_client.get(MY_BADGES_URL)
        assert response.status_code == 200
        assert response.json()["data"] == []

    def test_my_badges_shows_earned(self, auth_client, user):
        badge = make_badge()
        UserBadge.objects.create(user=user, badge=badge)
        response = auth_client.get(MY_BADGES_URL)
        assert len(response.json()["data"]) == 1
        assert response.json()["data"][0]["badge"]["name"] == badge.name

    def test_xp_endpoint_returns_correct_shape(self, auth_client):
        make_xp_levels()
        response = auth_client.get(XP_URL)
        assert response.status_code == 200
        data = response.json()["data"]
        assert "total_xp" in data
        assert "xp_to_next_level" in data
        assert "level_progress_pct" in data
        assert "badges_earned" in data

    def test_xp_increases_after_completion(self, auth_client, user):
        make_xp_levels()
        habit = make_habit(user)
        # Create completion — signal adds XP automatically
        HabitCompletion.objects.create(habit=habit, xp_earned=50)
        response = auth_client.get(XP_URL)
        assert response.json()["data"]["total_xp"] >= 50

    def test_leaderboard_returns_200(self, auth_client):
        response = auth_client.get(LEADERBOARD_URL)
        assert response.status_code == 200

    def test_leaderboard_invalid_period(self, auth_client):
        response = auth_client.get(f"{LEADERBOARD_URL}?period=INVALID")
        assert response.status_code == 400

    def test_seed_badges(self, auth_client):
        response = auth_client.post(SEED_URL, format="json")
        assert response.status_code == 200
        data = response.json()["data"]
        assert data["created"] == 12
        assert data["total"] == 12

    def test_seed_badges_idempotent(self, auth_client):
        auth_client.post(SEED_URL, format="json")
        response = auth_client.post(SEED_URL, format="json")
        assert response.json()["data"]["created"] == 0
        assert response.json()["data"]["total"] == 12
