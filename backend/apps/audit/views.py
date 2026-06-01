"""
Audit log views — read-only for the requesting user.
"""
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import AuditLog
from .serializers import AuditLogSerializer


class MyAuditLogView(APIView):
    """GET /api/v2/users/me/audit-log/ — personal audit trail."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        logs = AuditLog.objects.filter(actor=request.user).order_by("-timestamp")[:100]
        return Response({
            "success": True,
            "data":    AuditLogSerializer(logs, many=True).data,
            "meta":    {"count": logs.count()},
        })
