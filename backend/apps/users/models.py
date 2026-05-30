"""
CustomUser model — UUID primary key, email-based auth.
Extends Django's AbstractBaseUser for full control.
"""
import uuid
from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin
from django.db import models
from django.utils import timezone
from django.utils.translation import gettext_lazy as _
from .managers import CustomUserManager


class CustomUser(AbstractBaseUser, PermissionsMixin):
    """
    Core user entity.
    - UUID primary key (never exposes sequential IDs in URLs)
    - Email is the login identifier, not username
    - Soft delete via deleted_at (GDPR compliance)
    - MFA flag for TOTP / FIDO2 support (Phase 4)
    """

    # ── Primary key ───────────────────────────────────────────────────────────
    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
        help_text=_("Unique identifier (UUID4)."),
    )

    # ── Identity ──────────────────────────────────────────────────────────────
    email = models.EmailField(
        _("email address"),
        unique=True,
        db_index=True,
    )
    username = models.CharField(
        _("username"),
        max_length=50,
        unique=True,
        db_index=True,
        help_text=_("Public display handle. Letters, digits, underscores only."),
    )
    first_name = models.CharField(_("first name"), max_length=64, blank=True)
    last_name = models.CharField(_("last name"), max_length=64, blank=True)

    # ── Status flags ──────────────────────────────────────────────────────────
    is_active = models.BooleanField(
        _("active"),
        default=True,
        help_text=_("Uncheck to deactivate without deleting."),
    )
    is_staff = models.BooleanField(
        _("staff status"),
        default=False,
        help_text=_("Grants access to the Django admin."),
    )
    is_verified = models.BooleanField(
        _("email verified"),
        default=False,
        help_text=_("True after email verification link is clicked."),
    )

    # ── MFA ───────────────────────────────────────────────────────────────────
    mfa_enabled = models.BooleanField(
        _("MFA enabled"),
        default=False,
        help_text=_("True when TOTP or FIDO2 MFA is active."),
    )

    # ── Security tracking ─────────────────────────────────────────────────────
    failed_login_count = models.PositiveIntegerField(
        _("failed login count"),
        default=0,
        help_text=_("Consecutive failed logins — reset on success."),
    )
    last_login_ip = models.GenericIPAddressField(
        _("last login IP"),
        null=True,
        blank=True,
        help_text=_("Stored for security audit. Encrypted in production."),
    )

    # ── Timestamps ────────────────────────────────────────────────────────────
    date_joined = models.DateTimeField(_("date joined"), default=timezone.now)
    updated_at = models.DateTimeField(_("updated at"), auto_now=True)
    deleted_at = models.DateTimeField(
        _("deleted at"),
        null=True,
        blank=True,
        help_text=_("Soft delete timestamp. GDPR erasure scheduled 30 days after."),
    )

    # ── Manager ───────────────────────────────────────────────────────────────
    objects = CustomUserManager()

    # ── Auth config ───────────────────────────────────────────────────────────
    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["username"]

    class Meta:
        verbose_name = _("user")
        verbose_name_plural = _("users")
        ordering = ["-date_joined"]
        indexes = [
            models.Index(fields=["email"]),
            models.Index(fields=["username"]),
            models.Index(fields=["date_joined"]),
            models.Index(fields=["deleted_at"]),
        ]

    def __str__(self):
        return f"{self.email} ({self.username})"

    def get_full_name(self):
        full_name = f"{self.first_name} {self.last_name}".strip()
        return full_name or self.username

    def get_short_name(self):
        return self.first_name or self.username

    @property
    def is_deleted(self):
        return self.deleted_at is not None

    def soft_delete(self):
        """GDPR right to erasure — marks for deletion, does not purge immediately."""
        self.deleted_at = timezone.now()
        self.is_active = False
        self.save(update_fields=["deleted_at", "is_active", "updated_at"])

    def reset_failed_logins(self):
        self.failed_login_count = 0
        self.save(update_fields=["failed_login_count"])

    def increment_failed_logins(self):
        self.failed_login_count += 1
        self.save(update_fields=["failed_login_count"])


class UserProfile(models.Model):
    """
    Extended profile data — separated from auth model for clean separation.
    Created automatically via post_save signal when CustomUser is created.
    """

    user = models.OneToOneField(
        CustomUser,
        on_delete=models.CASCADE,
        related_name="profile",
        primary_key=True,
    )
    avatar = models.ImageField(
        upload_to="avatars/%Y/%m/",
        null=True,
        blank=True,
    )
    bio = models.TextField(blank=True, max_length=500)
    timezone = models.CharField(
        max_length=64,
        default="UTC",
        help_text=_("IANA timezone string e.g. America/New_York"),
    )
    locale = models.CharField(
        max_length=10,
        default="en-US",
        help_text=_("BCP 47 locale tag e.g. en-US, fr-FR"),
    )
    onboarding_complete = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = _("user profile")
        verbose_name_plural = _("user profiles")

    def __str__(self):
        return f"Profile({self.user.email})"
