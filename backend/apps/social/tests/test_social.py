"""
Tests for the Social domain — friends, challenges, feed.
"""
import pytest
from django.utils import timezone
from datetime import date, timedelta

from apps.social.models import ChallengeParticipant, Friendship, GroupChallenge, SocialFeedItem

FRIENDS_URL    = "/api/v2/social/friends/"
INVITE_URL     = "/api/v2/social/friends/invite/"
REQUESTS_URL   = "/api/v2/social/friends/requests/"
CHALLENGES_URL = "/api/v2/social/challenges/"
FEED_URL       = "/api/v2/social/feed/"


def make_challenge(user, **kwargs):
    today = date.today()
    defaults = {
        "title":      "Test Challenge",
        "created_by": user,
        "start_date": today,
        "end_date":   today + timedelta(days=30),
        "privacy":    GroupChallenge.Privacy.PUBLIC,
    }
    defaults.update(kwargs)
    challenge = GroupChallenge.objects.create(**defaults)
    ChallengeParticipant.objects.get_or_create(challenge=challenge, user=user)
    return challenge


@pytest.mark.django_db
class TestFriendship:

    def test_send_friend_request(self, auth_client, second_user):
        response = auth_client.post(INVITE_URL, {"username": second_user.username}, format="json")
        assert response.status_code == 201
        assert response.json()["success"] is True
        assert response.json()["data"]["status"] == "PENDING"

    def test_cannot_add_self(self, auth_client, user):
        response = auth_client.post(INVITE_URL, {"username": user.username}, format="json")
        assert response.status_code == 400

    def test_cannot_add_nonexistent_user(self, auth_client):
        response = auth_client.post(INVITE_URL, {"username": "ghost_user_xyz"}, format="json")
        assert response.status_code == 400

    def test_duplicate_request_rejected(self, auth_client, user, second_user):
        Friendship.objects.create(requester=user, addressee=second_user)
        response = auth_client.post(INVITE_URL, {"username": second_user.username}, format="json")
        assert response.status_code == 400

    def test_accept_friend_request(self, auth_client, second_auth_client, user, second_user):
        friendship = Friendship.objects.create(requester=second_user, addressee=user)
        url = f"{REQUESTS_URL}{friendship.id}/accept/"
        response = auth_client.post(url, format="json")
        assert response.status_code == 200
        friendship.refresh_from_db()
        assert friendship.status == Friendship.Status.ACCEPTED

    def test_decline_friend_request(self, auth_client, second_user, user):
        friendship = Friendship.objects.create(requester=second_user, addressee=user)
        url = f"{REQUESTS_URL}{friendship.id}/decline/"
        response = auth_client.post(url, format="json")
        assert response.status_code == 200
        friendship.refresh_from_db()
        assert friendship.status == Friendship.Status.DECLINED

    def test_friend_list_shows_accepted_only(self, auth_client, user, second_user):
        Friendship.objects.create(
            requester=user, addressee=second_user, status=Friendship.Status.ACCEPTED
        )
        response = auth_client.get(FRIENDS_URL)
        assert response.status_code == 200
        assert len(response.json()["data"]) == 1

    def test_pending_requests_not_in_friend_list(self, auth_client, user, second_user):
        Friendship.objects.create(requester=user, addressee=second_user)
        response = auth_client.get(FRIENDS_URL)
        assert len(response.json()["data"]) == 0

    def test_unauthenticated_cannot_access_friends(self, api_client):
        response = api_client.get(FRIENDS_URL)
        assert response.status_code == 401


@pytest.mark.django_db
class TestGroupChallenge:

    def test_create_challenge(self, auth_client, user):
        today = date.today()
        payload = {
            "title":      "30-Day Run Club",
            "privacy":    "PUBLIC",
            "habit_type": "BINARY",
            "start_date": str(today),
            "end_date":   str(today + timedelta(days=30)),
        }
        response = auth_client.post(CHALLENGES_URL, payload, format="json")
        assert response.status_code == 201
        data = response.json()["data"]
        assert data["title"] == "30-Day Run Club"
        assert data["invite_code"] != ""
        # Creator auto-joined
        assert len(data["participants"]) == 1

    def test_end_date_must_be_after_start_date(self, auth_client):
        today = date.today()
        payload = {
            "title":      "Bad Challenge",
            "privacy":    "PUBLIC",
            "habit_type": "BINARY",
            "start_date": str(today),
            "end_date":   str(today),  # same day — invalid
        }
        response = auth_client.post(CHALLENGES_URL, payload, format="json")
        assert response.status_code == 400

    def test_list_public_challenges(self, auth_client, user, second_user):
        make_challenge(user)
        make_challenge(second_user)
        response = auth_client.get(CHALLENGES_URL)
        assert response.status_code == 200
        assert len(response.json()["data"]) >= 1

    def test_join_challenge(self, auth_client, user, second_user):
        challenge = make_challenge(second_user)
        url = f"{CHALLENGES_URL}{challenge.id}/join/"
        response = auth_client.post(url, format="json")
        assert response.status_code == 200
        assert ChallengeParticipant.objects.filter(challenge=challenge, user=user).exists()

    def test_cannot_join_twice(self, auth_client, user, second_user):
        challenge = make_challenge(second_user)
        ChallengeParticipant.objects.create(challenge=challenge, user=user)
        url = f"{CHALLENGES_URL}{challenge.id}/join/"
        response = auth_client.post(url, format="json")
        assert response.status_code == 400

    def test_challenge_detail(self, auth_client, user):
        challenge = make_challenge(user)
        url = f"{CHALLENGES_URL}{challenge.id}/"
        response = auth_client.get(url)
        assert response.status_code == 200
        data = response.json()["data"]
        assert "participants" in data
        assert "invite_code" in data

    def test_invite_code_auto_generated(self, user):
        challenge = make_challenge(user)
        assert len(challenge.invite_code) == 8


@pytest.mark.django_db
class TestSocialFeed:

    def test_feed_returns_200(self, auth_client):
        response = auth_client.get(FEED_URL)
        assert response.status_code == 200

    def test_feed_shows_own_items(self, auth_client, user):
        SocialFeedItem.objects.create(
            user=user,
            event_type=SocialFeedItem.EventType.HABIT_COMPLETED,
            title="Completed Morning Run",
            is_public=True,
        )
        response = auth_client.get(FEED_URL)
        assert len(response.json()["data"]) == 1

    def test_feed_shows_friend_items(self, auth_client, user, second_user):
        Friendship.objects.create(
            requester=user, addressee=second_user,
            status=Friendship.Status.ACCEPTED,
        )
        SocialFeedItem.objects.create(
            user=second_user,
            event_type=SocialFeedItem.EventType.STREAK_REACHED,
            title="30-day streak!",
            is_public=True,
        )
        response = auth_client.get(FEED_URL)
        assert len(response.json()["data"]) >= 1

    def test_feed_excludes_non_friends(self, auth_client, second_user):
        SocialFeedItem.objects.create(
            user=second_user,
            event_type=SocialFeedItem.EventType.HABIT_COMPLETED,
            title="Should not appear",
            is_public=True,
        )
        response = auth_client.get(FEED_URL)
        titles = [item["title"] for item in response.json()["data"]]
        assert "Should not appear" not in titles

    def test_private_items_excluded_from_feed(self, auth_client, user):
        SocialFeedItem.objects.create(
            user=user,
            event_type=SocialFeedItem.EventType.HABIT_COMPLETED,
            title="Private item",
            is_public=False,
        )
        response = auth_client.get(FEED_URL)
        titles = [item["title"] for item in response.json()["data"]]
        assert "Private item" not in titles
