"""
Gamification serializers.
"""
from rest_framework import serializers

from .models import Badge, Leaderboard, LeaderboardEntry, UserBadge, UserXP, XPLevel


class BadgeSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Badge
        fields = [
            "id", "name", "description", "icon", "color",
            "condition_type", "condition_value", "xp_reward", "order",
        ]


class UserBadgeSerializer(serializers.ModelSerializer):
    badge = BadgeSerializer(read_only=True)

    class Meta:
        model  = UserBadge
        fields = ["id", "badge", "earned_at", "notified"]


class XPLevelSerializer(serializers.ModelSerializer):
    class Meta:
        model  = XPLevel
        fields = ["level", "xp_required", "title", "icon", "color"]


class UserXPSerializer(serializers.ModelSerializer):
    current_level    = XPLevelSerializer(read_only=True)
    xp_to_next_level = serializers.IntegerField(read_only=True)
    level_progress_pct = serializers.FloatField(read_only=True)
    badges_earned    = serializers.SerializerMethodField()

    class Meta:
        model  = UserXP
        fields = [
            "total_xp", "current_level",
            "xp_to_next_level", "level_progress_pct",
            "badges_earned", "updated_at",
        ]

    def get_badges_earned(self, obj):
        return obj.user.badges.count()


class BadgeWithStatusSerializer(serializers.ModelSerializer):
    """Badge + whether the requesting user has earned it."""
    earned    = serializers.SerializerMethodField()
    earned_at = serializers.SerializerMethodField()

    class Meta:
        model  = Badge
        fields = [
            "id", "name", "description", "icon", "color",
            "condition_type", "condition_value", "xp_reward",
            "earned", "earned_at",
        ]

    def get_earned(self, obj):
        user = self.context["request"].user
        return obj.earners.filter(user=user).exists()

    def get_earned_at(self, obj):
        user = self.context["request"].user
        ub = obj.earners.filter(user=user).first()
        return ub.earned_at if ub else None


class LeaderboardEntrySerializer(serializers.ModelSerializer):
    username   = serializers.CharField(source="user.username", read_only=True)
    first_name = serializers.CharField(source="user.first_name", read_only=True)

    class Meta:
        model  = LeaderboardEntry
        fields = ["rank", "username", "first_name", "score", "completions"]


class LeaderboardSerializer(serializers.ModelSerializer):
    entries = LeaderboardEntrySerializer(many=True, read_only=True)

    class Meta:
        model  = Leaderboard
        fields = ["id", "period", "started_at", "ended_at", "entries"]
