from rest_framework import serializers
from .models import UserInsight, AnalyticsEvent


class UserInsightSerializer(serializers.ModelSerializer):
    class Meta:
        model  = UserInsight
        fields = [
            "id", "insight_type", "title", "body",
            "is_read", "generated_at", "expires_at",
        ]
        read_only_fields = ["id", "insight_type", "title", "body", "generated_at"]


class AnalyticsEventSerializer(serializers.ModelSerializer):
    class Meta:
        model  = AnalyticsEvent
        fields = ["id", "event_type", "payload", "ts"]
        read_only_fields = fields


class DashboardSerializer(serializers.Serializer):
    active_habits           = serializers.IntegerField()
    completed_today         = serializers.IntegerField()
    remaining_today         = serializers.IntegerField()
    completions_this_week   = serializers.IntegerField()
    completion_rate_7d      = serializers.FloatField()
    week_delta_pct          = serializers.FloatField()
    total_completions       = serializers.IntegerField()
    total_xp                = serializers.IntegerField()
    best_streak             = serializers.DictField(allow_null=True)
    as_of                   = serializers.CharField()
