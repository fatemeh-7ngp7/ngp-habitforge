"""
Social domain serializers.
"""
from django.contrib.auth import get_user_model
from rest_framework import serializers

from .models import ChallengeParticipant, Friendship, GroupChallenge, SocialFeedItem

User = get_user_model()


class UserMiniSerializer(serializers.ModelSerializer):
    """Minimal user representation for social contexts."""

    class Meta:
        model  = User
        fields = ["id", "username", "first_name", "last_name"]
        read_only_fields = fields


class FriendshipSerializer(serializers.ModelSerializer):
    requester = UserMiniSerializer(read_only=True)
    addressee = UserMiniSerializer(read_only=True)

    class Meta:
        model  = Friendship
        fields = ["id", "requester", "addressee", "status", "created_at"]
        read_only_fields = fields


class FriendInviteSerializer(serializers.Serializer):
    """POST /social/friends/invite/ — send a friend request by username."""
    username = serializers.CharField(max_length=50)

    def validate_username(self, value):
        request_user = self.context["request"].user
        try:
            target = User.objects.get(username__iexact=value)
        except User.DoesNotExist:
            raise serializers.ValidationError("User not found.")

        if target == request_user:
            raise serializers.ValidationError("You cannot add yourself.")

        already = Friendship.objects.filter(
            requester=request_user, addressee=target
        ).exists() or Friendship.objects.filter(
            requester=target, addressee=request_user
        ).exists()

        if already:
            raise serializers.ValidationError("Friend request already exists.")

        self.context["target"] = target
        return value


class ChallengeParticipantSerializer(serializers.ModelSerializer):
    user = UserMiniSerializer(read_only=True)

    class Meta:
        model  = ChallengeParticipant
        fields = ["user", "score", "completions", "joined_at", "last_active"]


class GroupChallengeListSerializer(serializers.ModelSerializer):
    """Lightweight — for list views."""
    created_by       = UserMiniSerializer(read_only=True)
    participant_count = serializers.IntegerField(read_only=True)
    is_ongoing        = serializers.BooleanField(read_only=True)

    class Meta:
        model  = GroupChallenge
        fields = [
            "id", "title", "privacy", "habit_type",
            "start_date", "end_date", "is_active",
            "created_by", "participant_count", "is_ongoing",
            "invite_code", "created_at",
        ]


class GroupChallengeDetailSerializer(serializers.ModelSerializer):
    """Full detail with leaderboard."""
    created_by   = UserMiniSerializer(read_only=True)
    participants = ChallengeParticipantSerializer(many=True, read_only=True)
    is_ongoing   = serializers.BooleanField(read_only=True)

    class Meta:
        model  = GroupChallenge
        fields = [
            "id", "title", "description", "privacy",
            "habit_type", "target_value", "target_unit",
            "start_date", "end_date", "max_participants",
            "is_active", "is_ongoing", "invite_code",
            "created_by", "participants", "created_at",
        ]


class GroupChallengeCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model  = GroupChallenge
        fields = [
            "title", "description", "privacy",
            "habit_type", "target_value", "target_unit",
            "start_date", "end_date", "max_participants",
        ]

    def validate(self, attrs):
        if attrs["start_date"] >= attrs["end_date"]:
            raise serializers.ValidationError(
                {"end_date": "end_date must be after start_date."}
            )
        return attrs

    def create(self, validated_data):
        validated_data["created_by"] = self.context["request"].user
        challenge = super().create(validated_data)
        # Creator auto-joins their own challenge
        ChallengeParticipant.objects.create(
            challenge=challenge,
            user=self.context["request"].user,
        )
        return challenge


class SocialFeedItemSerializer(serializers.ModelSerializer):
    user = UserMiniSerializer(read_only=True)

    class Meta:
        model  = SocialFeedItem
        fields = ["id", "user", "event_type", "title", "body", "payload", "created_at"]
        read_only_fields = fields
