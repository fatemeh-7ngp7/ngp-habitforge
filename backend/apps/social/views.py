"""
Social views — friends, challenges, feed.
"""
import logging

from django.db.models import Q
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import ChallengeParticipant, Friendship, GroupChallenge, SocialFeedItem
from .serializers import (
    FriendInviteSerializer,
    FriendshipSerializer,
    GroupChallengeCreateSerializer,
    GroupChallengeDetailSerializer,
    GroupChallengeListSerializer,
    SocialFeedItemSerializer,
)

logger = logging.getLogger(__name__)


def ok(data, status_code=status.HTTP_200_OK, meta=None):
    payload = {"success": True, "data": data}
    if meta:
        payload["meta"] = meta
    return Response(payload, status=status_code)


def err(detail, status_code=status.HTTP_400_BAD_REQUEST):
    return Response(
        {"success": False, "error": {"detail": detail}},
        status=status_code,
    )


# ── Friends ───────────────────────────────────────────────────────────────────

class FriendListView(APIView):
    """GET /social/friends/ — list accepted friends."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        friendships = Friendship.objects.filter(
            Q(requester=request.user) | Q(addressee=request.user),
            status=Friendship.Status.ACCEPTED,
        ).select_related("requester", "addressee")
        return ok(FriendshipSerializer(friendships, many=True).data)


class FriendInviteView(APIView):
    """POST /social/friends/invite/ — send a friend request."""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = FriendInviteSerializer(
            data=request.data,
            context={"request": request},
        )
        if not serializer.is_valid():
            return Response(
                {"success": False, "error": {"detail": serializer.errors}},
                status=status.HTTP_400_BAD_REQUEST,
            )

        target = serializer.context["target"]
        friendship = Friendship.objects.create(
            requester=request.user,
            addressee=target,
        )
        logger.info("%s sent friend request to %s", request.user.username, target.username)
        return ok(
            FriendshipSerializer(friendship).data,
            status_code=status.HTTP_201_CREATED,
        )


class FriendRequestView(APIView):
    """
    GET  /social/friends/requests/ — list incoming pending requests.
    POST /social/friends/requests/{id}/accept/
    POST /social/friends/requests/{id}/decline/
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        pending = Friendship.objects.filter(
            addressee=request.user,
            status=Friendship.Status.PENDING,
        ).select_related("requester")
        return ok(FriendshipSerializer(pending, many=True).data)


class FriendRequestActionView(APIView):
    """POST /social/friends/requests/{id}/{action}/"""
    permission_classes = [IsAuthenticated]

    def post(self, request, pk, action):
        try:
            friendship = Friendship.objects.get(id=pk, addressee=request.user)
        except Friendship.DoesNotExist:
            return err("Friend request not found.", status.HTTP_404_NOT_FOUND)

        if friendship.status != Friendship.Status.PENDING:
            return err("This request is no longer pending.")

        if action == "accept":
            friendship.accept()
            logger.info("%s accepted friend request from %s",
                        request.user.username, friendship.requester.username)
        elif action == "decline":
            friendship.decline()
        else:
            return err("Invalid action. Use 'accept' or 'decline'.")

        return ok(FriendshipSerializer(friendship).data)


# ── Challenges ────────────────────────────────────────────────────────────────

class ChallengeListView(APIView):
    """
    GET  /social/challenges/       — list public + user's own challenges.
    POST /social/challenges/       — create a new challenge.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        challenges = GroupChallenge.objects.filter(
            Q(privacy=GroupChallenge.Privacy.PUBLIC) |
            Q(created_by=request.user) |
            Q(participants__user=request.user),
            is_active=True,
        ).distinct().select_related("created_by").prefetch_related("participants")
        return ok(GroupChallengeListSerializer(challenges, many=True).data)

    def post(self, request):
        serializer = GroupChallengeCreateSerializer(
            data=request.data,
            context={"request": request},
        )
        if not serializer.is_valid():
            return Response(
                {"success": False, "error": {"detail": serializer.errors}},
                status=status.HTTP_400_BAD_REQUEST,
            )
        challenge = serializer.save()
        logger.info("Challenge '%s' created by %s", challenge.title, request.user.username)
        return ok(
            GroupChallengeDetailSerializer(challenge).data,
            status_code=status.HTTP_201_CREATED,
        )


class ChallengeDetailView(APIView):
    """GET /social/challenges/{id}/ — full detail with leaderboard."""
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        try:
            challenge = GroupChallenge.objects.select_related("created_by") \
                .prefetch_related("participants__user").get(id=pk)
        except GroupChallenge.DoesNotExist:
            return err("Challenge not found.", status.HTTP_404_NOT_FOUND)
        return ok(GroupChallengeDetailSerializer(challenge).data)


class ChallengeJoinView(APIView):
    """POST /social/challenges/{id}/join/ — join by ID or invite code."""
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        try:
            challenge = GroupChallenge.objects.get(id=pk, is_active=True)
        except GroupChallenge.DoesNotExist:
            return err("Challenge not found.", status.HTTP_404_NOT_FOUND)

        if challenge.participants.count() >= challenge.max_participants:
            return err("Challenge is full.")

        participant, created = ChallengeParticipant.objects.get_or_create(
            challenge=challenge,
            user=request.user,
        )
        if not created:
            return err("You are already in this challenge.")

        logger.info("%s joined challenge '%s'", request.user.username, challenge.title)
        return ok({"message": f"Joined '{challenge.title}' successfully!"})


# ── Feed ──────────────────────────────────────────────────────────────────────

class SocialFeedView(APIView):
    """
    GET /social/feed/ — activity feed from friends + self.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        # Get IDs of accepted friends
        friend_ids = list(
            Friendship.objects.filter(
                Q(requester=request.user) | Q(addressee=request.user),
                status=Friendship.Status.ACCEPTED,
            ).values_list(
                "addressee_id", "requester_id"
            ).distinct()
        )
        # Flatten friend ID pairs into a set
        all_ids = {request.user.id}
        for pair in friend_ids:
            all_ids.update(pair)

        feed = SocialFeedItem.objects.filter(
            user_id__in=all_ids,
            is_public=True,
        ).select_related("user").order_by("-created_at")[:50]

        return ok(SocialFeedItemSerializer(feed, many=True).data)
