"""
Authentication views.
All responses follow the standard envelope:
  { "success": true/false, "data": {...}, "meta": {...} }
"""
import logging

from django.utils import timezone
from drf_spectacular.utils import OpenApiResponse, extend_schema
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.tokens import RefreshToken

from .serializers import (
    ChangePasswordSerializer,
    LoginSerializer,
    RegisterSerializer,
    UserSummarySerializer,
)

logger = logging.getLogger(__name__)


def success_response(data, status_code=status.HTTP_200_OK, meta=None):
    """Consistent success envelope used across all auth views."""
    payload = {"success": True, "data": data}
    if meta:
        payload["meta"] = meta
    return Response(payload, status=status_code)


def error_response(detail, status_code=status.HTTP_400_BAD_REQUEST):
    """Consistent error envelope."""
    return Response(
        {"success": False, "error": {"detail": detail}},
        status=status_code,
    )


class RegisterView(APIView):
    """
    POST /api/v2/auth/register/
    Register a new user. Returns user data + JWT tokens.
    """
    permission_classes = [AllowAny]
    throttle_scope = "anon"

    @extend_schema(
        tags=["auth"],
        summary="Register a new user",
        request=RegisterSerializer,
        responses={201: OpenApiResponse(description="User registered + tokens returned")},
    )
    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(
                {"success": False, "error": {"detail": serializer.errors}},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user = serializer.save()

        # Generate tokens immediately after registration
        refresh = RefreshToken.for_user(user)

        return success_response(
            data={
                "user": UserSummarySerializer(user).data,
                "tokens": {
                    "access": str(refresh.access_token),
                    "refresh": str(refresh),
                    "token_type": "Bearer",
                },
            },
            status_code=status.HTTP_201_CREATED,
            meta={"message": "Account created. Please verify your email."},
        )


class LoginView(APIView):
    """
    POST /api/v2/auth/login/
    Authenticate with email + password. Returns JWT tokens.
    """
    permission_classes = [AllowAny]
    throttle_scope = "anon"

    @extend_schema(
        tags=["auth"],
        summary="Login with email and password",
        request=LoginSerializer,
        responses={200: OpenApiResponse(description="JWT tokens returned")},
    )
    def post(self, request):
        serializer = LoginSerializer(data=request.data, context={"request": request})
        if not serializer.is_valid():
            return Response(
                {"success": False, "error": {"detail": serializer.errors}},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user = serializer.validated_data["user"]

        # Record login IP
        ip = request.META.get("HTTP_X_FORWARDED_FOR", request.META.get("REMOTE_ADDR", ""))
        ip = ip.split(",")[0].strip() if ip else None
        if ip:
            user.last_login_ip = ip
            user.save(update_fields=["last_login_ip"])

        return success_response(
            data={
                "user": UserSummarySerializer(user).data,
                "tokens": {
                    "access": serializer.validated_data["access"],
                    "refresh": serializer.validated_data["refresh"],
                    "token_type": "Bearer",
                },
                "mfa_required": user.mfa_enabled,
            }
        )


class LogoutView(APIView):
    """
    POST /api/v2/auth/logout/
    Blacklist the refresh token — invalidates the entire session.
    """
    permission_classes = [IsAuthenticated]

    @extend_schema(
        tags=["auth"],
        summary="Logout and blacklist refresh token",
        responses={200: OpenApiResponse(description="Token blacklisted")},
    )
    def post(self, request):
        refresh_token = request.data.get("refresh")
        if not refresh_token:
            return error_response("Refresh token is required.")

        try:
            token = RefreshToken(refresh_token)
            token.blacklist()
            logger.info("User logged out: %s", request.user.email)
        except TokenError as e:
            return error_response(str(e))

        return success_response(
            data={"message": "Successfully logged out. Token invalidated."}
        )


class TokenRefreshView(APIView):
    """
    POST /api/v2/auth/token/refresh/
    Exchange a valid refresh token for a new access token.
    Refresh token is rotated on each call (ROTATE_REFRESH_TOKENS=True).
    """
    permission_classes = [AllowAny]

    @extend_schema(
        tags=["auth"],
        summary="Refresh JWT access token",
        responses={200: OpenApiResponse(description="New token pair returned")},
    )
    def post(self, request):
        refresh_token = request.data.get("refresh")
        if not refresh_token:
            return error_response("Refresh token is required.")

        try:
            token = RefreshToken(refresh_token)
            new_access = str(token.access_token)

            # ROTATE_REFRESH_TOKENS=True means we also return a new refresh token
            token.blacklist()
            new_refresh = RefreshToken.for_user(token.payload)

        except TokenError as e:
            return error_response(str(e), status.HTTP_401_UNAUTHORIZED)

        return success_response(
            data={
                "access": new_access,
                "refresh": str(new_refresh),
                "token_type": "Bearer",
            }
        )


class ChangePasswordView(APIView):
    """
    POST /api/v2/auth/password/change/
    Change password for the authenticated user.
    """
    permission_classes = [IsAuthenticated]

    @extend_schema(
        tags=["auth"],
        summary="Change authenticated user password",
        request=ChangePasswordSerializer,
        responses={200: OpenApiResponse(description="Password changed")},
    )
    def post(self, request):
        serializer = ChangePasswordSerializer(
            data=request.data,
            context={"request": request},
        )
        if not serializer.is_valid():
            return Response(
                {"success": False, "error": {"detail": serializer.errors}},
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer.save()
        return success_response(
            data={"message": "Password updated successfully. Please log in again."}
        )


class MeView(APIView):
    """
    GET /api/v2/auth/me/
    Return the currently authenticated user's profile.
    """
    permission_classes = [IsAuthenticated]

    @extend_schema(
        tags=["auth"],
        summary="Get current authenticated user",
        responses={200: UserSummarySerializer},
    )
    def get(self, request):
        return success_response(
            data=UserSummarySerializer(request.user).data
        )
