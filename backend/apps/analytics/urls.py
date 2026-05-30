from django.urls import path
from .views import (
    DashboardView,
    HeatmapView,
    HabitStatsView,
    WeeklyBreakdownView,
    InsightsView,
    SeedInsightView,
)

urlpatterns = [
    path("dashboard/",          DashboardView.as_view(),      name="analytics-dashboard"),
    path("heatmap/",            HeatmapView.as_view(),         name="analytics-heatmap"),
    path("weekly/",             WeeklyBreakdownView.as_view(), name="analytics-weekly"),
    path("insights/",           InsightsView.as_view(),        name="analytics-insights"),
    path("insights/seed/",      SeedInsightView.as_view(),     name="analytics-seed"),
    path("habits/<uuid:habit_id>/", HabitStatsView.as_view(), name="analytics-habit-stats"),
]
