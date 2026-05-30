"""
User profile serializers.
"""
from rest_framework import serializers
from .models import CustomUser, UserProfile


class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserProfile
        fields = ["bio", "timezone", "locale", "onboarding_complete", "avatar"]


class UserDetailSerializer(serializers.ModelSerializer):
    """Full user detail including nested profile."""
    profile = UserProfileSerializer(read_only=True)
    full_name = serializers.SerializerMethodField()

    class Meta:
        model = CustomUser
        fields = [
            "id", "email", "username",
            "first_name", "last_name", "full_name",
            "is_verified", "mfa_enabled",
            "date_joined", "updated_at",
            "profile",
        ]
        read_only_fields = ["id", "email", "is_verified", "mfa_enabled", "date_joined", "updated_at"]

    def get_full_name(self, obj):
        return obj.get_full_name()


class UserUpdateSerializer(serializers.ModelSerializer):
    """Partial update — username, name fields only. Email requires separate flow."""
    profile = UserProfileSerializer(required=False)

    class Meta:
        model = CustomUser
        fields = ["username", "first_name", "last_name", "profile"]

    def update(self, instance, validated_data):
        profile_data = validated_data.pop("profile", {})

        # Update user fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        # Update nested profile
        if profile_data:
            profile = instance.profile
            for attr, value in profile_data.items():
                setattr(profile, attr, value)
            profile.save()

        return instance
