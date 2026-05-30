"""
Tests for CustomUser and UserProfile models.
"""
import pytest
from django.contrib.auth import get_user_model
from apps.users.models import UserProfile

User = get_user_model()


@pytest.mark.django_db
class TestCustomUser:

    def test_create_user_with_email(self):
        user = User.objects.create_user(
            email="alice@ngp.com",
            username="alice",
            password="StrongPass99!",
        )
        assert user.email == "alice@ngp.com"
        assert user.username == "alice"
        assert user.is_active is True
        assert user.is_staff is False
        assert user.is_superuser is False

    def test_uuid_primary_key(self):
        user = User.objects.create_user(
            email="bob@ngp.com", username="bob", password="StrongPass99!"
        )
        import uuid
        assert isinstance(user.id, uuid.UUID)

    def test_profile_auto_created_via_signal(self):
        user = User.objects.create_user(
            email="carol@ngp.com", username="carol", password="StrongPass99!"
        )
        assert hasattr(user, "profile")
        assert isinstance(user.profile, UserProfile)

    def test_email_is_username_field(self):
        assert User.USERNAME_FIELD == "email"

    def test_soft_delete(self):
        user = User.objects.create_user(
            email="dave@ngp.com", username="dave", password="StrongPass99!"
        )
        assert user.is_deleted is False
        user.soft_delete()
        assert user.is_deleted is True
        assert user.is_active is False
        assert user.deleted_at is not None

    def test_failed_login_tracking(self):
        user = User.objects.create_user(
            email="eve@ngp.com", username="eve", password="StrongPass99!"
        )
        assert user.failed_login_count == 0
        user.increment_failed_logins()
        user.increment_failed_logins()
        assert user.failed_login_count == 2
        user.reset_failed_logins()
        assert user.failed_login_count == 0

    def test_get_full_name(self):
        user = User.objects.create_user(
            email="frank@ngp.com", username="frank",
            password="StrongPass99!",
            first_name="Frank", last_name="Forge",
        )
        assert user.get_full_name() == "Frank Forge"

    def test_create_superuser(self):
        admin = User.objects.create_superuser(
            email="admin@ngp.com", password="AdminPass99!"
        )
        assert admin.is_staff is True
        assert admin.is_superuser is True
        assert admin.is_verified is True

    def test_str_representation(self):
        user = User.objects.create_user(
            email="george@ngp.com", username="george", password="StrongPass99!"
        )
        assert "george@ngp.com" in str(user)
        assert "george" in str(user)
