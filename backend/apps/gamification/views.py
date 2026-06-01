"""
Gamification views — badges, XP, leaderboard.
"""
import logging

from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Badge, Leaderboard, UserBadge, UserXP
from .serializers import (
    BadgeWithStatusSerializer,
    LeaderboardSerializer,
    UserBadgeSerializer,
    UserXPSerializer,
)

logger = logging.getLogger(__name__)


def ok(data, meta=None):
    payload = {"success": True, "data": data}
    if meta:
        payload["meta"] = meta
    return Response(payload)


def err(detail, status_code=status.HTTP_400_BAD_REQUEST):
    return Response(
        {"success": False, "error": {"detail": detail}},
        status=status_code,
    )


class BadgeListView(APIView):
    """
    GET /gamification/badges/
    All available badges with earned status for the requesting user.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        badges = Badge.objects.filter(is_active=True).prefetch_related("earners")
        serializer = BadgeWithStatusSerializer(
            badges, many=True, context={"request": request}
        )
        return ok(serializer.data, meta={"count": badges.count()})


class MyBadgesView(APIView):
    """
    GET /gamification/badges/mine/
    Badges earned by the authenticated user.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user_badges = (
            UserBadge.objects
            .filter(user=request.user)
            .select_related("badge")
            .order_by("-earned_at")
        )
        return ok(
            UserBadgeSerializer(user_badges, many=True).data,
            meta={"count": user_badges.count()},
        )


class UserXPView(APIView):
    """
    GET /gamification/xp/
    Current user's XP total, level, progress to next level.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user_xp, _ = UserXP.objects.get_or_create(user=request.user)
        user_xp._recalculate_level()
        user_xp.save()
        return ok(UserXPSerializer(user_xp).data)


class LeaderboardView(APIView):
    """
    GET /gamification/leaderboard/?period=WEEKLY
    Current leaderboard for the given period.
    period options: WEEKLY (default) | MONTHLY | ALL_TIME
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        period = request.query_params.get("period", "WEEKLY").upper()
        if period not in ["WEEKLY", "MONTHLY", "ALL_TIME"]:
            return err("period must be WEEKLY, MONTHLY, or ALL_TIME.")

        leaderboard = (
            Leaderboard.objects
            .filter(period=period, is_current=True)
            .prefetch_related("entries__user")
            .order_by("-started_at")
            .first()
        )

        if not leaderboard:
            # Trigger a fresh build if none exists
            from apps.gamification.services import refresh_leaderboard
            refresh_leaderboard(period)
            leaderboard = Leaderboard.objects.filter(
                period=period, is_current=True
            ).order_by("-started_at").first()

        if not leaderboard:
            return ok([], meta={"message": "No leaderboard data yet."})

        return ok(LeaderboardSerializer(leaderboard).data)


class SeedBadgesView(APIView):
    """
    POST /gamification/badges/seed/
    Dev-only: seed the default badge catalogue.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        from apps.gamification.models import Badge

        catalogue = [
            {"name": "First Step",       "icon": "👣", "color": "#27AE60", "condition_type": "TOTAL_COMPLETIONS", "condition_value": 1,   "xp_reward": 50,  "description": "Complete your first habit.", "order": 1},
            {"name": "Getting Started",  "icon": "🌱", "color": "#27AE60", "condition_type": "TOTAL_COMPLETIONS", "condition_value": 10,  "xp_reward": 100, "description": "Complete 10 habits.", "order": 2},
            {"name": "On a Roll",        "icon": "🎯", "color": "#2D9CDB", "condition_type": "TOTAL_COMPLETIONS", "condition_value": 50,  "xp_reward": 200, "description": "Complete 50 habits.", "order": 3},
            {"name": "Century Club",     "icon": "💯", "color": "#E8400C", "condition_type": "TOTAL_COMPLETIONS", "condition_value": 100, "xp_reward": 500, "description": "Complete 100 habits.", "order": 4},
            {"name": "Week Warrior",     "icon": "🔥", "color": "#E8400C", "condition_type": "STREAK_DAYS",       "condition_value": 7,   "xp_reward": 150, "description": "Maintain a 7-day streak.", "order": 5},
            {"name": "Fortnight Force",  "icon": "⚡", "color": "#F2994A", "condition_type": "STREAK_DAYS",       "condition_value": 14,  "xp_reward": 300, "description": "Maintain a 14-day streak.", "order": 6},
            {"name": "Monthly Master",   "icon": "🏆", "color": "#9B51E0", "condition_type": "STREAK_DAYS",       "condition_value": 30,  "xp_reward": 750, "description": "Maintain a 30-day streak.", "order": 7},
            {"name": "Iron Will",        "icon": "💎", "color": "#56CCF2", "condition_type": "STREAK_DAYS",       "condition_value": 100, "xp_reward": 2000,"description": "Maintain a 100-day streak.", "order": 8},
            {"name": "Habit Builder",    "icon": "🏗️", "color": "#F2994A", "condition_type": "HABITS_CREATED",    "condition_value": 3,   "xp_reward": 75,  "description": "Create 3 habits.", "order": 9},
            {"name": "Perfect Week",     "icon": "🌟", "color": "#F2C94C", "condition_type": "PERFECT_WEEK",      "condition_value": 1,   "xp_reward": 500, "description": "Complete all habits every day for 7 days.", "order": 10},
            {"name": "Early Bird",       "icon": "🌅", "color": "#F2994A", "condition_type": "EARLY_BIRD",        "condition_value": 5,   "xp_reward": 200, "description": "Complete a habit before 7 AM five times.", "order": 11},
            {"name": "Social Butterfly", "icon": "🦋", "color": "#9B51E0", "condition_type": "CHALLENGE_JOINED",  "condition_value": 3,   "xp_reward": 250, "description": "Join 3 group challenges.", "order": 12},
        ]

        created = 0
        for item in catalogue:
            _, was_created = Badge.objects.get_or_create(
                name=item["name"], defaults=item
            )
            if was_created:
                created += 1

        return ok(
            {"created": created, "total": Badge.objects.count()},
            meta={"message": f"Seeded {created} new badges."},
        )
