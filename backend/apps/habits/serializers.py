"""
Habit serializers — full CRUD + completion + streak.
"""
from django.utils import timezone
from rest_framework import serializers
from .models import Habit, HabitCategory, HabitCompletion, HabitStreak, HabitReminder
from .enums import HabitType


class HabitCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = HabitCategory
        fields = ["id", "name", "icon", "color", "order"]


class HabitStreakSerializer(serializers.ModelSerializer):
    class Meta:
        model = HabitStreak
        fields = [
            "current_streak", "longest_streak",
            "last_completion_date", "streak_start_date",
            "total_completions", "updated_at",
        ]


class HabitReminderSerializer(serializers.ModelSerializer):
    class Meta:
        model = HabitReminder
        fields = ["id", "time", "days", "is_enabled", "is_smart_timed"]


class HabitListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for list views."""
    streak         = HabitStreakSerializer(read_only=True)
    category_name  = serializers.CharField(source="category.name", read_only=True, default=None)
    completed_today = serializers.SerializerMethodField()

    class Meta:
        model = Habit
        fields = [
            "id", "title", "icon", "color",
            "habit_type", "target_value", "target_unit",
            "frequency_type", "difficulty",
            "is_public", "is_archived",
            "streak", "category_name", "completed_today",
            "created_at",
        ]

    def get_completed_today(self, obj):
        today = timezone.now().date()
        return obj.completions.filter(completed_at__date=today).exists()


class HabitDetailSerializer(serializers.ModelSerializer):
    """Full detail including streak, reminders, and category."""
    streak    = HabitStreakSerializer(read_only=True)
    reminders = HabitReminderSerializer(many=True, read_only=True)
    category  = HabitCategorySerializer(read_only=True)
    completed_today = serializers.SerializerMethodField()
    xp_per_completion = serializers.SerializerMethodField()

    class Meta:
        model = Habit
        fields = [
            "id", "title", "description", "icon", "color",
            "habit_type", "target_value", "target_unit",
            "frequency_type", "frequency_days", "frequency_interval",
            "difficulty", "is_public", "is_archived", "order",
            "category", "streak", "reminders",
            "completed_today", "xp_per_completion",
            "created_at", "updated_at",
        ]

    def get_completed_today(self, obj):
        today = timezone.now().date()
        return obj.completions.filter(completed_at__date=today).exists()

    def get_xp_per_completion(self, obj):
        return obj.get_xp_value()


class HabitCreateSerializer(serializers.ModelSerializer):
    """Used for POST /habits/ — user is set from request."""
    class Meta:
        model = Habit
        fields = [
            "title", "description", "icon", "color",
            "habit_type", "target_value", "target_unit",
            "frequency_type", "frequency_days", "frequency_interval",
            "difficulty", "is_public", "category", "order",
        ]

    def validate_frequency_days(self, value):
        if not isinstance(value, list):
            raise serializers.ValidationError("frequency_days must be a list.")
        for day in value:
            if day not in range(7):
                raise serializers.ValidationError("Days must be integers 0 (Mon) to 6 (Sun).")
        return value

    def validate(self, attrs):
        habit_type = attrs.get("habit_type", HabitType.BINARY)
        if habit_type == HabitType.MEASURABLE:
            if not attrs.get("target_value"):
                raise serializers.ValidationError(
                    {"target_value": "Required for MEASURABLE habits."}
                )
            if not attrs.get("target_unit"):
                raise serializers.ValidationError(
                    {"target_unit": "Required for MEASURABLE habits."}
                )
        return attrs

    def create(self, validated_data):
        validated_data["user"] = self.context["request"].user
        return super().create(validated_data)


class HabitUpdateSerializer(serializers.ModelSerializer):
    """PATCH /habits/{id}/ — partial updates."""
    class Meta:
        model = Habit
        fields = [
            "title", "description", "icon", "color",
            "habit_type", "target_value", "target_unit",
            "frequency_type", "frequency_days",
            "difficulty", "is_public", "is_archived",
            "category", "order",
        ]


class HabitCompletionSerializer(serializers.ModelSerializer):
    """For listing completion history."""
    class Meta:
        model = HabitCompletion
        fields = [
            "id", "completed_at", "value",
            "note", "sentiment", "verified_by", "xp_earned",
        ]
        read_only_fields = ["id", "xp_earned"]


class CompleteHabitSerializer(serializers.Serializer):
    """
    POST /habits/{id}/complete/
    Body is optional for BINARY habits, required value for MEASURABLE.
    """
    value = serializers.DecimalField(
        max_digits=10, decimal_places=2,
        required=False, allow_null=True,
    )
    note          = serializers.CharField(required=False, allow_blank=True, max_length=500)
    completed_at  = serializers.DateTimeField(required=False, default=timezone.now)

    def validate(self, attrs):
        habit = self.context["habit"]
        if habit.habit_type == HabitType.MEASURABLE and not attrs.get("value"):
            raise serializers.ValidationError(
                {"value": "value is required for MEASURABLE habits."}
            )
        return attrs
