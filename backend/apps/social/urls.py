from django.urls import path

from .views import (
    ChallengeDetailView,
    ChallengeJoinView,
    ChallengeListView,
    FriendInviteView,
    FriendListView,
    FriendRequestActionView,
    FriendRequestView,
    SocialFeedView,
)

urlpatterns = [
    # Friends
    path("friends/",                              FriendListView.as_view(),          name="social-friends"),
    path("friends/invite/",                       FriendInviteView.as_view(),        name="social-friend-invite"),
    path("friends/requests/",                     FriendRequestView.as_view(),       name="social-friend-requests"),
    path("friends/requests/<uuid:pk>/<str:action>/", FriendRequestActionView.as_view(), name="social-friend-action"),

    # Challenges
    path("challenges/",              ChallengeListView.as_view(),   name="social-challenges"),
    path("challenges/<uuid:pk>/",    ChallengeDetailView.as_view(), name="social-challenge-detail"),
    path("challenges/<uuid:pk>/join/", ChallengeJoinView.as_view(), name="social-challenge-join"),

    # Feed
    path("feed/", SocialFeedView.as_view(), name="social-feed"),
]
