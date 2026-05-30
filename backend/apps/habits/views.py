"""
Habits ViewSets and action views.
"""
import logging
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import status, filters
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.viewsets import ModelViewSet
from django_filters.rest_framework import DjangoFilterBackend
from drf_spectacular.utils import extend_schema

from .models import Habit, HabitCategory, HabitCompletion, HabitStreak
from .serializers import (
    HabitListSerializer,
    HabitDetailSerializer,
    HabitCreateSerializer,
    HabitUpdateSerializer,
    HabitCompletionSerializer,
    CompleteHabitSerializer,
    HabitCategorySerializer,
    HabitStreakSerializer,
)

logger = logging.getLogger(__name__)


def ok(data, status_code=status.HTTP_200_OK, meta=None):
    payload = {"success": True, "data": data}
    if meta:
        payload["meta"] = meta
    return Response(payload, status=status_code)


class HabitViewSet(ModelViewSet):
    """
    Full CRUD for habits owned by the authenticated user.

    GET    /habits/           — list (active, non-deleted)
    POST   /habits/           — create
    GET    /habits/{id}/      — detail
    PATCH  /habits/{id}/      — partial update
    DELETE /habits/{id}/      — soft delete
    POST   /habits/{id}/complete/  — mark complete
    GET    /habits/{id}/streak/    — streak detail
    GET    /habits/{id}/history/   — completion history
    """
    permission_classes = [IsAuthenticated]
    filter_backends    = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields   = ["is_archived", "habit_type", "frequency_type", "difficulty"]
    search_fields      = ["title", "description"]
    ordering_fields    = ["created_at", "title", "order"]
    ordering           = ["order", "created_at"]

    def get_queryset(self):
        """Always scope to the current user. Exclude soft-deleted."""
        return (
            Habit.objects
            .filter(user=self.request.user, deleted_at__isnull=True)
            .select_related("category", "streak")
            .prefetch_related("reminders")
        )

    def get_serializer_class(self):
        if self.action == "list":
            return HabitListSerializer
        if self.action == "create":
            return HabitCreateSerializer
        if self.action in ["update", "partial_update"]:
            return HabitUpdateSerializer
        return HabitDetailSerializer

    def list(self, request, *args, **kwargs):
        qs = self.filter_queryset(self.get_queryset())
        serializer = self.get_serializer(qs, many=True)
        return ok(serializer.data, meta={"count": qs.count()})

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        return ok(HabitDetailSerializer(instance).data)

    def create(self, request, *args, **kwargs):
        serializer = HabitCreateSerializer(
            data=request.data,
            context={"request": request},
        )
        serializer.is_valid(raise_exception=True)
        habit = serializer.save()
        logger.info("Habit created: '%s' by %s", habit.title, request.user.email)
        return ok(HabitDetailSerializer(habit).data, status.HTTP_201_CREATED)

    def partial_update(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = HabitUpdateSerializer(instance, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        habit = serializer.save()
        return ok(HabitDetailSerializer(habit).data)

    def destroy(self, request, *args, **kwargs):
        """Soft delete — sets deleted_at, does not purge from DB."""
        instance = self.get_object()
        instance.soft_delete()
        logger.info("Habit soft-deleted: '%s' by %s", instance.title, request.user.email)
        return Response(
            {"success": True, "data": {"message": "Habit deleted.", "id": str(instance.id)}},
            status=status.HTTP_200_OK,
        )

    @action(detail=True, methods=["post"], url_path="complete")
    def complete(self, request, pk=None):
        """
        POST /habits/{id}/complete/
        Mark a habit as done. Updates streak automatically via signal.
        """
        habit = self.get_object()
        today = timezone.now().date()

        # Idempotency — prevent double-completion on same day
        if habit.completions.filter(completed_at__date=today).exists():
            return Response(
                {"success": False, "error": {"detail": "Already completed today."}},
                status=status.HTTP_409_CONFLICT,
            )

        serializer = CompleteHabitSerializer(
            data=request.data,
            context={"habit": habit, "request": request},
        )
        serializer.is_valid(raise_exception=True)

        xp = habit.get_xp_value()
        completion = HabitCompletion.objects.create(
            habit=habit,
            value=serializer.validated_data.get("value"),
            note=serializer.validated_data.get("note", ""),
            completed_at=serializer.validated_data.get("completed_at", timezone.now()),
            xp_earned=xp,
        )

        # Streak is updated via signal (post_save → update_streak_on_completion)
        habit.refresh_from_db()
        streak = habit.streak

        logger.info(
            "Habit '%s' completed by %s — streak: %d",
            habit.title, request.user.email, streak.current_streak,
        )

        return ok(
            data={
                "completion": HabitCompletionSerializer(completion).data,
                "streak": HabitStreakSerializer(streak).data,
                "xp_earned": xp,
            },
            meta={"message": f"Great job! {streak.current_streak}-day streak! 🔥"},
        )

    @action(detail=True, methods=["get"], url_path="streak")
    def streak(self, request, pk=None):
        """GET /habits/{id}/streak/ — current streak data."""
        habit = self.get_object()
        streak, _ = HabitStreak.objects.get_or_create(habit=habit)
        return ok(HabitStreakSerializer(streak).data)

    @action(detail=True, methods=["get"], url_path="history")
    def history(self, request, pk=None):
        """GET /habits/{id}/history/ — paginated completion history."""
        habit = self.get_object()
        completions = habit.completions.all()
        page = self.paginate_queryset(completions)
        if page is not None:
            return self.get_paginated_response(
                HabitCompletionSerializer(page, many=True).data
            )
        return ok(HabitCompletionSerializer(completions, many=True).data)


class HabitCategoryListView(APIView):
    """GET /habits/categories/ — all available categories."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        categories = HabitCategory.objects.all()
        return ok(HabitCategorySerializer(categories, many=True).data)
