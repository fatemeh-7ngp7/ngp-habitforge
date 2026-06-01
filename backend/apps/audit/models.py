"""
Audit log — append-only, immutable record of every state-changing action.
INSERT only. No UPDATE, no DELETE — ever.
"""
import uuid

from django.conf import settings
from django.db import models
from django.utils import timezone


class AuditLog(models.Model):

    class Action(models.TextChoices):
        CREATE = "CREATE", "Create"
        UPDATE = "UPDATE", "Update"
        DELETE = "DELETE", "Delete"
        LOGIN  = "LOGIN",  "Login"
        LOGOUT = "LOGOUT", "Logout"
        EXPORT = "EXPORT", "Data Export"
        OTHER  = "OTHER",  "Other"

    id            = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    actor         = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True, blank=True,
        on_delete=models.SET_NULL,
        related_name="audit_logs",
    )
    action        = models.CharField(max_length=10, choices=Action.choices)
    resource_type = models.CharField(max_length=100, db_index=True)
    resource_id   = models.CharField(max_length=100, blank=True)
    old_value     = models.JSONField(null=True, blank=True)
    new_value     = models.JSONField(null=True, blank=True)
    ip_address    = models.GenericIPAddressField(null=True, blank=True)
    user_agent    = models.CharField(max_length=500, blank=True)
    extra         = models.JSONField(default=dict, blank=True)
    timestamp     = models.DateTimeField(default=timezone.now, db_index=True)

    class Meta:
        ordering  = ["-timestamp"]
        indexes   = [
            models.Index(fields=["actor", "timestamp"]),
            models.Index(fields=["resource_type", "resource_id"]),
            models.Index(fields=["action", "timestamp"]),
        ]
        # Signal intent: this table is append-only
        verbose_name      = "Audit Log Entry"
        verbose_name_plural = "Audit Log"

    def __str__(self):
        actor = self.actor.username if self.actor else "system"
        return f"[{self.timestamp:%Y-%m-%d %H:%M}] {actor} {self.action} {self.resource_type}"

    def save(self, *args, **kwargs):
        """Enforce immutability — only allow INSERT, never UPDATE."""
        if self.pk and AuditLog.objects.filter(pk=self.pk).exists():
            raise PermissionError("AuditLog entries are immutable — no updates allowed.")
        super().save(*args, **kwargs)

    @classmethod
    def log(cls, actor, action, resource_type, resource_id="",
            old_value=None, new_value=None, request=None, extra=None):
        """
        Convenience factory — call this everywhere instead of .create() directly.
        """
        ip = None
        ua = ""
        if request:
            forwarded = request.META.get("HTTP_X_FORWARDED_FOR", "")
            ip = forwarded.split(",")[0].strip() if forwarded else request.META.get("REMOTE_ADDR")
            ua = request.META.get("HTTP_USER_AGENT", "")[:500]

        return cls.objects.create(
            actor=actor,
            action=action,
            resource_type=resource_type,
            resource_id=str(resource_id),
            old_value=old_value,
            new_value=new_value,
            ip_address=ip,
            user_agent=ua,
            extra=extra or {},
        )
