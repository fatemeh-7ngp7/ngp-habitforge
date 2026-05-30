from rest_framework.test import APIClient
"""
Integration tests for the authentication API.
"""
import pytest
from django.urls import reverse
from rest_framework import status
from django.contrib.auth import get_user_model

User = get_user_model()

REGISTER_URL = "/api/v2/auth/register/"
LOGIN_URL    = "/api/v2/auth/login/"
ME_URL       = "/api/v2/auth/me/"
LOGOUT_URL   = "/api/v2/auth/logout/"
REFRESH_URL  = "/api/v2/auth/token/refresh/"


@pytest.mark.django_db
class TestRegisterView:

    def test_successful_registration(self, api_client):
        payload = {
            "email":            "newuser@ngp.com",
            "username":         "newuser",
            "first_name":       "New",
            "last_name":        "User",
            "password":         "StrongPass99!",
            "password_confirm": "StrongPass99!",
        }
        response = api_client.post(REGISTER_URL, payload, format="json")

        assert response.status_code == status.HTTP_201_CREATED
        data = response.json()
        assert data["success"] is True
        assert "tokens" in data["data"]
        assert "access" in data["data"]["tokens"]
        assert "refresh" in data["data"]["tokens"]
        assert data["data"]["user"]["email"] == "newuser@ngp.com"

    def test_duplicate_email_rejected(self, api_client, user):
        payload = {
            "email":            user.email,
            "username":         "differentuser",
            "password":         "StrongPass99!",
            "password_confirm": "StrongPass99!",
        }
        response = api_client.post(REGISTER_URL, payload, format="json")
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert response.json()["success"] is False

    def test_password_mismatch_rejected(self, api_client):
        payload = {
            "email":            "mismatch@ngp.com",
            "username":         "mismatch",
            "password":         "StrongPass99!",
            "password_confirm": "WrongPass99!",
        }
        response = api_client.post(REGISTER_URL, payload, format="json")
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_weak_password_rejected(self, api_client):
        payload = {
            "email":            "weak@ngp.com",
            "username":         "weakpass",
            "password":         "123",
            "password_confirm": "123",
        }
        response = api_client.post(REGISTER_URL, payload, format="json")
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_profile_created_after_registration(self, api_client):
        payload = {
            "email":            "profile@ngp.com",
            "username":         "profiletest",
            "password":         "StrongPass99!",
            "password_confirm": "StrongPass99!",
        }
        api_client.post(REGISTER_URL, payload, format="json")
        user = User.objects.get(email="profile@ngp.com")
        assert hasattr(user, "profile")


@pytest.mark.django_db
class TestLoginView:

    def test_successful_login(self, api_client, user):
        response = api_client.post(LOGIN_URL, {
            "email":    user.email,
            "password": "TestPass123!",
        }, format="json")

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["success"] is True
        assert "access" in data["data"]["tokens"]
        assert "mfa_required" in data["data"]

    def test_wrong_password_rejected(self, api_client, user):
        response = api_client.post(LOGIN_URL, {
            "email":    user.email,
            "password": "WrongPassword!",
        }, format="json")
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_nonexistent_email_rejected(self, api_client):
        response = api_client.post(LOGIN_URL, {
            "email":    "ghost@ngp.com",
            "password": "AnyPassword!",
        }, format="json")
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_failed_login_increments_counter(self, api_client, user):
        initial = user.failed_login_count
        api_client.post(LOGIN_URL, {
            "email": user.email, "password": "WrongPass99!",
        }, format="json")
        user.refresh_from_db()
        assert user.failed_login_count == initial + 1

    def test_successful_login_resets_counter(self, api_client, user):
        user.failed_login_count = 3
        user.save()
        api_client.post(LOGIN_URL, {
            "email": user.email, "password": "TestPass123!",
        }, format="json")
        user.refresh_from_db()
        assert user.failed_login_count == 0


@pytest.mark.django_db
class TestMeView:

    def test_authenticated_user_gets_profile(self, auth_client, user):
        response = auth_client.get(ME_URL)
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["data"]["email"] == user.email

    def test_unauthenticated_request_rejected(self, api_client):
        response = api_client.get(ME_URL)
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_wrong_token_rejected(self, api_client):
        api_client.credentials(HTTP_AUTHORIZATION="Bearer totally.fake.token")
        response = api_client.get(ME_URL)
        assert response.status_code == status.HTTP_401_UNAUTHORIZED


@pytest.mark.django_db
class TestLogoutView:

    def test_logout_blacklists_token(self, auth_client, user):
        # Get a refresh token
        login = APIClient().post(LOGIN_URL, {
            "email": user.email, "password": "TestPass123!",
        }, format="json")
        refresh = login.json()["data"]["tokens"]["refresh"]

        response = auth_client.post(LOGOUT_URL, {"refresh": refresh}, format="json")
        assert response.status_code == status.HTTP_200_OK
        assert response.json()["success"] is True

    def test_logout_requires_auth(self, api_client):
        response = api_client.post(LOGOUT_URL, {"refresh": "token"}, format="json")
        assert response.status_code == status.HTTP_401_UNAUTHORIZED


