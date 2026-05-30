"""
Authentication serializers.
Handles registration, login, token refresh, and password validation.
"""
import logging
from django.contrib.auth import authenticate
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from rest_framework import serializers
from rest_framework_simplejwt.tokens import RefreshToken
from apps.users.models import CustomUser

logger = logging.getLogger(__name__)


class RegisterSerializer(serializers.ModelSerializer):
    """
    User registration.
    Validates password strength, confirms match, creates user + profile via signal.
    """
    password = serializers.CharField(
        write_only=True,
        min_length=10,
        style={"input_type": "password"},
    )
    password_confirm = serializers.CharField(
        write_only=True,
        style={"input_type": "password"},
    )

    class Meta:
        model = CustomUser
        fields = ["email", "username", "first_name", "last_name", "password", "password_confirm"]

    def validate_email(self, value):
        value = value.lower().strip()
        if CustomUser.objects.filter(email=value).exists():
            raise serializers.ValidationError("A user with this email already exists.")
        return value

    def validate_username(self, value):
        value = value.strip()
        if not value.replace("_", "").isalnum():
            raise serializers.ValidationError(
                "Username may only contain letters, digits, and underscores."
            )
        if CustomUser.objects.filter(username__iexact=value).exists():
            raise serializers.ValidationError("This username is already taken.")
        return value

    def validate(self, attrs):
        if attrs["password"] != attrs["password_confirm"]:
            raise serializers.ValidationError({"password_confirm": "Passwords do not match."})
        try:
            validate_password(attrs["password"])
        except ValidationError as e:
            raise serializers.ValidationError({"password": list(e.messages)})
        return attrs

    def create(self, validated_data):
        validated_data.pop("password_confirm")
        password = validated_data.pop("password")
        user = CustomUser.objects.create_user(password=password, **validated_data)
        logger.info("New user registered: %s", user.email)
        return user


class LoginSerializer(serializers.Serializer):
    """
    Email + password login.
    Returns JWT access + refresh tokens on success.
    """
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, style={"input_type": "password"})

    def validate(self, attrs):
        email = attrs["email"].lower().strip()
        password = attrs["password"]

        # Fetch user first so we can track failed attempts
        try:
            user = CustomUser.objects.get(email=email)
        except CustomUser.DoesNotExist:
            raise serializers.ValidationError({"email": "Invalid credentials."})

        # Check soft-deleted
        if user.is_deleted:
            raise serializers.ValidationError({"email": "This account has been deactivated."})

        # Brute-force guard
        if user.failed_login_count >= 10:
            raise serializers.ValidationError({
                "email": "Account temporarily locked. Contact support."
            })

        # Authenticate
        authenticated = authenticate(
            request=self.context.get("request"),
            username=email,
            password=password,
        )

        if not authenticated:
            user.increment_failed_logins()
            logger.warning("Failed login attempt for: %s (attempt %d)", email, user.failed_login_count)
            raise serializers.ValidationError({"password": "Invalid credentials."})

        # Success — reset counter
        user.reset_failed_logins()

        # Generate JWT tokens
        refresh = RefreshToken.for_user(authenticated)
        logger.info("User logged in: %s", email)

        attrs["user"] = authenticated
        attrs["refresh"] = str(refresh)
        attrs["access"] = str(refresh.access_token)
        return attrs


class TokenResponseSerializer(serializers.Serializer):
    """Shapes the token response envelope."""
    access = serializers.CharField()
    refresh = serializers.CharField()
    token_type = serializers.CharField(default="Bearer")
    mfa_required = serializers.BooleanField(default=False)


class UserSummarySerializer(serializers.ModelSerializer):
    """Minimal user data returned after registration/login."""
    full_name = serializers.SerializerMethodField()

    class Meta:
        model = CustomUser
        fields = [
            "id", "email", "username",
            "first_name", "last_name", "full_name",
            "is_verified", "mfa_enabled", "date_joined",
        ]
        read_only_fields = fields

    def get_full_name(self, obj):
        return obj.get_full_name()


class ChangePasswordSerializer(serializers.Serializer):
    """Authenticated password change."""
    current_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(write_only=True, min_length=10)
    new_password_confirm = serializers.CharField(write_only=True)

    def validate_current_password(self, value):
        user = self.context["request"].user
        if not user.check_password(value):
            raise serializers.ValidationError("Current password is incorrect.")
        return value

    def validate(self, attrs):
        if attrs["new_password"] != attrs["new_password_confirm"]:
            raise serializers.ValidationError({
                "new_password_confirm": "Passwords do not match."
            })
        try:
            validate_password(attrs["new_password"], user=self.context["request"].user)
        except ValidationError as e:
            raise serializers.ValidationError({"new_password": list(e.messages)})
        return attrs

    def save(self):
        user = self.context["request"].user
        user.set_password(self.validated_data["new_password"])
        user.save(update_fields=["password", "updated_at"])
        logger.info("Password changed for user: %s", user.email)
        return user
