from django.urls import path

from .views import (
    BadgeListView,
    LeaderboardView,
    MyBadgesView,
    SeedBadgesView,
    UserXPView,
)

urlpatterns = [
    path("badges/",       BadgeListView.as_view(),  name="gamification-badges"),
    path("badges/mine/",  MyBadgesView.as_view(),   name="gamification-my-badges"),
    path("badges/seed/",  SeedBadgesView.as_view(), name="gamification-seed"),
    path("xp/",           UserXPView.as_view(),     name="gamification-xp"),
    path("leaderboard/",  LeaderboardView.as_view(),name="gamification-leaderboard"),
]
