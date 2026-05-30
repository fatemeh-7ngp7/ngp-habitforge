from django.urls import path, include

urlpatterns = [
    path("auth/",          include("apps.authentication.urls")),
    path("habits/",        include("apps.habits.urls")),
    path("users/",         include("apps.users.urls")),
    path("analytics/",     include("apps.analytics.urls")),
    path("social/",        include("apps.social.urls")),
    path("notifications/", include("apps.notifications.urls")),
    path("gamification/",  include("apps.gamification.urls")),
]
