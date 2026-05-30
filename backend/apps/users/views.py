"""
User profile views.
"""
import logging
from django.utils import timezone
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from drf_spectacular.utils import extend_schema
from .models import CustomUser
from .serializers import UserDetailSerializer, UserUpdateSerializer

logger = logging.getLogger(__name__)


class UserMeView(APIView):
    """
    GET  /api/v2/users/me/  — retrieve profile
    PUT  /api/v2/users/me/  — update profile
    DELETE /api/v2/users/me/ — GDPR soft delete
    """
    permission_classes = [IsAuthenticated]

    @extend_schema(tags=["users"], summary="Get current user profile")
    def get(self, request):
        serializer = UserDetailSerializer(request.user)
        return Response({"success": True, "data": serializer.data})

    @extend_schema(tags=["users"], summary="Update current user profile")
    def put(self, request):
        serializer = UserUpdateSerializer(
            request.user,
            data=request.data,
            partial=True,
        )
        if not serializer.is_valid():
            return Response(
                {"success": False, "error": {"detail": serializer.errors}},
                status=status.HTTP_400_BAD_REQUEST,
            )
        serializer.save()
        return Response({"success": True, "data": UserDetailSerializer(request.user).data})

    @extend_schema(tags=["users"], summary="GDPR soft delete — schedule account deletion")
    def delete(self, request):
        confirm = request.data.get("confirm_deletion", False)
        if not confirm:
            return Response(
                {"success": False, "error": {"detail": "Send confirm_deletion: true to proceed."}},
                status=status.HTTP_400_BAD_REQUEST,
            )
        request.user.soft_delete()
        logger.info("User soft-deleted: %s", request.user.email)
        return Response({
            "success": True,
            "data": {
                "message": "Account scheduled for deletion.",
                "deleted_at": request.user.deleted_at,
            }
        })


class UserExportView(APIView):
    """
    GET /api/v2/users/me/export/
    GDPR data portability — returns full user data as JSON.
    """
    permission_classes = [IsAuthenticated]

    @extend_schema(tags=["users"], summary="GDPR data export")
    def get(self, request):
        user = request.user
        data = {
            "account": UserDetailSerializer(user).data,
            "export_generated_at": timezone.now().isoformat(),
            "format": "json",
            "note": "Full habit and activity data export available via /analytics/export/",
        }
        return Response({"success": True, "data": data})
