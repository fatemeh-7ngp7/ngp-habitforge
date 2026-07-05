"""
Tests for email verification — token generation, verify/resend endpoints,
and the send_verification_email Celery task.
"""
import pytest
from django.core import mail
from django.utils.encoding import force_bytes
from django.utils.http import urlsafe_base64_encode
from rest_framework import status

from apps.authentication.tasks import send_verification_email
from apps.authentication.tokens import email_verification_token

VERIFY_URL = "/api/v2/auth/email/verify/"
RESEND_URL = "/api/v2/auth/email/resend/"


def build_link_parts(user):
    uid = urlsafe_base64_encode(force_bytes(user.pk))
    token = email_verification_token.make_token(user)
    return uid, token


@pytest.mark.django_db
class TestEmailVerificationToken:

    def test_token_valid_for_unverified_user(self, user):
        token = email_verification_token.make_token(user)
        assert email_verification_token.check_token(user, token)

    def test_token_invalid_after_verification(self, user):
        token = email_verification_token.make_token(user)
        user.is_verified = True
        user.save(update_fields=["is_verified"])
        assert not email_verification_token.check_token(user, token)

    def test_garbage_token_rejected(self, user):
        assert not email_verification_token.check_token(user, "not-a-real-token")


@pytest.mark.django_db
class TestVerifyEmailView:

    def test_successful_verification(self, api_client, user):
        assert user.is_verified is False
        uid, token = build_link_parts(user)

        response = api_client.post(VERIFY_URL, {"uid": uid, "token": token}, format="json")

        assert response.status_code == status.HTTP_200_OK
        user.refresh_from_db()
        assert user.is_verified is True

    def test_already_verified_returns_friendly_message(self, api_client, user):
        user.is_verified = True
        user.save(update_fields=["is_verified"])
        uid, token = build_link_parts(user)

        response = api_client.post(VERIFY_URL, {"uid": uid, "token": token}, format="json")

        assert response.status_code == status.HTTP_200_OK
        assert "already verified" in response.json()["data"]["message"].lower()

    def test_invalid_token_rejected(self, api_client, user):
        uid, _ = build_link_parts(user)

        response = api_client.post(VERIFY_URL, {"uid": uid, "token": "bogus"}, format="json")

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        user.refresh_from_db()
        assert user.is_verified is False

    def test_invalid_uid_rejected(self, api_client, user):
        _, token = build_link_parts(user)

        response = api_client.post(
            VERIFY_URL, {"uid": "not-a-valid-uid", "token": token}, format="json"
        )

        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_missing_fields_rejected(self, api_client):
        response = api_client.post(VERIFY_URL, {}, format="json")
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_reuse_after_success_is_idempotent_not_a_leak(self, api_client, user):
        """
        Once verified, replaying the same (now-stale) token must not re-check
        the token at all — it should just report 'already verified' without
        revealing whether the old token would still validate.
        """
        uid, token = build_link_parts(user)

        first = api_client.post(VERIFY_URL, {"uid": uid, "token": token}, format="json")
        assert first.status_code == status.HTTP_200_OK

        second = api_client.post(VERIFY_URL, {"uid": uid, "token": token}, format="json")
        assert second.status_code == status.HTTP_200_OK
        assert "already verified" in second.json()["data"]["message"].lower()


@pytest.mark.django_db
class TestResendVerificationEmailView:

    def test_requires_authentication(self, api_client):
        response = api_client.post(RESEND_URL, {}, format="json")
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_sends_email_for_unverified_user(self, auth_client, user):
        assert user.is_verified is False
        response = auth_client.post(RESEND_URL, {}, format="json")

        assert response.status_code == status.HTTP_200_OK
        assert len(mail.outbox) == 1
        assert user.email in mail.outbox[0].to

    def test_rejected_if_already_verified(self, auth_client, user):
        user.is_verified = True
        user.save(update_fields=["is_verified"])

        response = auth_client.post(RESEND_URL, {}, format="json")

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert len(mail.outbox) == 0


@pytest.mark.django_db
class TestSendVerificationEmailTask:

    def test_sends_email_with_working_link(self, user):
        result = send_verification_email(str(user.pk))

        assert result["sent"] is True
        assert len(mail.outbox) == 1
        assert user.email in mail.outbox[0].to
        assert "/verify-email?uid=" in mail.outbox[0].body

    def test_skips_already_verified_user(self, user):
        user.is_verified = True
        user.save(update_fields=["is_verified"])

        result = send_verification_email(str(user.pk))

        assert result["sent"] is False
        assert len(mail.outbox) == 0

    def test_nonexistent_user_handled_gracefully(self):
        import uuid
        result = send_verification_email(str(uuid.uuid4()))
        assert result["sent"] is False
        assert len(mail.outbox) == 0

    def test_registration_triggers_email(self, api_client):
        payload = {
            "email":            "brandnew@ngp.com",
            "username":         "brandnew",
            "first_name":       "Brand",
            "last_name":        "New",
            "password":         "StrongPass99!",
            "password_confirm": "StrongPass99!",
        }
        response = api_client.post("/api/v2/auth/register/", payload, format="json")
        assert response.status_code == status.HTTP_201_CREATED
        assert len(mail.outbox) == 1
        assert "brandnew@ngp.com" in mail.outbox[0].to