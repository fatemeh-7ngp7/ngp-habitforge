"""
Celery tasks for the authentication domain.
"""
import logging

from celery import shared_task
from django.conf import settings
from django.core.mail import send_mail
from django.utils.encoding import force_bytes
from django.utils.http import urlsafe_base64_encode

from .tokens import email_verification_token

logger = logging.getLogger(__name__)


@shared_task(name="apps.authentication.tasks.send_verification_email")
def send_verification_email(user_id):
    """
    Builds a signed verification link and emails it to the user.
    Triggered on registration and via the resend-verification endpoint.
    """
    from apps.users.models import CustomUser

    try:
        user = CustomUser.objects.get(pk=user_id)
    except CustomUser.DoesNotExist:
        logger.warning("send_verification_email: user %s not found", user_id)
        return {"sent": False}

    if user.is_verified:
        logger.info("send_verification_email: user %s already verified", user_id)
        return {"sent": False, "reason": "already_verified"}

    uid = urlsafe_base64_encode(force_bytes(user.pk))
    token = email_verification_token.make_token(user)
    verify_url = f"{settings.FRONTEND_URL}/verify-email?uid={uid}&token={token}"

    send_mail(
        subject="Verify your NGP HabitForge email",
        message=(
            f"Hi {user.username},\n\n"
            f"Please verify your email by clicking the link below:\n\n"
            f"{verify_url}\n\n"
            f"If you didn't create this account, you can ignore this email."
        ),
        from_email=None,  # uses DEFAULT_FROM_EMAIL
        recipient_list=[user.email],
    )

    logger.info("send_verification_email: sent to %s", user.email)
    return {"sent": True, "user_id": str(user.pk)}