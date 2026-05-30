"""
Root conftest — fixtures available to every test in the project.
Must live at backend/ root (same level as manage.py and pytest.ini).
"""
import pytest
from rest_framework.test import APIClient
from django.contrib.auth import get_user_model

User = get_user_model()


@pytest.fixture
def api_client():
    """Unauthenticated DRF test client."""
    return APIClient()


@pytest.fixture
def create_user(db):
    """Factory fixture — create a CustomUser with sensible defaults."""
    def _create(
        email="test@ngp.com",
        username="testuser",
        password="TestPass123!",
        **kwargs,
    ):
        return User.objects.create_user(
            email=email,
            username=username,
            password=password,
            **kwargs,
        )
    return _create


@pytest.fixture
def user(create_user):
    """A single ready-made authenticated user."""
    return create_user()


@pytest.fixture
def auth_client(user):
    """APIClient pre-authenticated as `user` via JWT Bearer token."""
    from rest_framework_simplejwt.tokens import RefreshToken
    client = APIClient()
    refresh = RefreshToken.for_user(user)
    client.credentials(HTTP_AUTHORIZATION=f"Bearer {str(refresh.access_token)}")
    return client


@pytest.fixture
def second_user(create_user):
    """A second user — for testing ownership and data isolation."""
    return create_user(email="other@ngp.com", username="otheruser")


@pytest.fixture
def second_auth_client(second_user):
    """APIClient authenticated as the second user."""
    from rest_framework_simplejwt.tokens import RefreshToken
    client = APIClient()
    refresh = RefreshToken.for_user(second_user)
    client.credentials(HTTP_AUTHORIZATION=f"Bearer {str(refresh.access_token)}")
    return client
