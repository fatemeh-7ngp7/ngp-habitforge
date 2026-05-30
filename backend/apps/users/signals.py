"""
Signals for the users app.
"""
import logging
from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import CustomUser, UserProfile

logger = logging.getLogger(__name__)


@receiver(post_save, sender=CustomUser)
def create_user_profile(sender, instance, created, **kwargs):
    """Automatically create a UserProfile when a new CustomUser is saved."""
    if created:
        UserProfile.objects.create(user=instance)
        logger.info("UserProfile created for user: %s", instance.email)


@receiver(post_save, sender=CustomUser)
def save_user_profile(sender, instance, **kwargs):
    """Keep UserProfile in sync when CustomUser is saved."""
    if hasattr(instance, "profile"):
        instance.profile.save()
