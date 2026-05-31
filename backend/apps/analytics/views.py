"""
Analytics views — dashboard, heatmap, per-habit stats, insights.
"""
import logging

from drf_spectacular.utils import extend_schema
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import UserInsight
from .serializers import UserInsightSerializer
from .services import (
    get_dashboard_metrics,
    get_habit_stats,
    get_heatmap_data,
    get_weekly_breakdown,
)

logger = logging.getLogger(__name__)


def ok(data, meta=None):
    payload = {"success": True, "data": data}
    if meta:
        payload["meta"] = meta
    return Response(payload)


class DashboardView(APIView):
    """GET /api/v2/analytics/dashboard/"""
    permission_classes = [IsAuthenticated]

    @extend_schema(tags=["analytics"], summary="Main dashboard metrics")
    def get(self, request):
        metrics = get_dashboard_metrics(request.user)
        return ok(metrics)


class HeatmapView(APIView):
    """GET /api/v2/analytics/heatmap/?year=2026&habit_id=uuid"""
    permission_classes = [IsAuthenticated]

    @extend_schema(tags=["analytics"], summary="Calendar heatmap data")
    def get(self, request):
        year     = request.query_params.get("year")
        habit_id = request.query_params.get("habit_id")

        year = int(year) if year and year.isdigit() else None
        data = get_heatmap_data(request.user, year=year, habit_id=habit_id)
        return ok(data)


class HabitStatsView(APIView):
    """GET /api/v2/analytics/habits/{habit_id}/"""
    permission_classes = [IsAuthenticated]

    @extend_schema(tags=["analytics"], summary="Per-habit statistics")
    def get(self, request, habit_id):
        data = get_habit_stats(request.user, habit_id)
        if data is None:
            return Response(
                {"success": False, "error": {"detail": "Habit not found."}},
                status=404,
            )
        return ok(data)


class WeeklyBreakdownView(APIView):
    """GET /api/v2/analytics/weekly/"""
    permission_classes = [IsAuthenticated]

    @extend_schema(tags=["analytics"], summary="Completions by day of week")
    def get(self, request):
        data = get_weekly_breakdown(request.user)
        return ok(data)


class InsightsView(APIView):
    """GET /api/v2/analytics/insights/ — AI-generated insights for user"""
    permission_classes = [IsAuthenticated]

    @extend_schema(tags=["analytics"], summary="AI-generated behavioral insights")
    def get(self, request):
        insights = UserInsight.objects.filter(
            user=request.user,
            is_read=False,
        ).order_by("-generated_at")[:10]
        return ok(UserInsightSerializer(insights, many=True).data)

    def post(self, request):
        """Mark an insight as read."""
        insight_id = request.data.get("insight_id")
        try:
            insight = UserInsight.objects.get(id=insight_id, user=request.user)
            insight.is_read = True
            insight.save(update_fields=["is_read"])
            return ok({"message": "Marked as read."})
        except UserInsight.DoesNotExist:
            return Response(
                {"success": False, "error": {"detail": "Insight not found."}},
                status=404,
            )


class SeedInsightView(APIView):
    """
    POST /api/v2/analytics/insights/seed/
    Dev-only endpoint — seeds a sample AI insight for testing.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        insight = UserInsight.objects.create(
            user=request.user,
            insight_type="peak_time",
            title="Your peak completion window",
            body=(
                "You complete habits most consistently between 7–9 AM on weekdays. "
                "Consider scheduling your hardest habits in this window."
            ),
        )
        return ok(UserInsightSerializer(insight).data)
