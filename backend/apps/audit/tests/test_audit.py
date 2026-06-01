"""
Tests for the Audit log.
"""
import pytest
from apps.audit.models import AuditLog


@pytest.mark.django_db
class TestAuditLog:

    def test_create_audit_log_entry(self, user):
        log = AuditLog.log(
            actor=user,
            action=AuditLog.Action.CREATE,
            resource_type="Habit",
            resource_id="some-uuid",
            new_value={"title": "Morning Run"},
        )
        assert log.pk is not None
        assert log.actor == user
        assert log.action == "CREATE"
        assert log.resource_type == "Habit"

    def test_audit_log_immutable(self, user):
        log = AuditLog.log(
            actor=user,
            action=AuditLog.Action.LOGIN,
            resource_type="auth",
        )
        with pytest.raises(PermissionError):
            log.action = "DELETE"
            log.save()

    def test_audit_log_without_actor(self):
        log = AuditLog.log(
            actor=None,
            action=AuditLog.Action.OTHER,
            resource_type="system",
        )
        assert log.actor is None
        assert log.pk is not None

    def test_my_audit_log_endpoint(self, auth_client, user):
        AuditLog.log(actor=user, action=AuditLog.Action.LOGIN, resource_type="auth")
        AuditLog.log(actor=user, action=AuditLog.Action.CREATE, resource_type="Habit")

        response = auth_client.get("/api/v2/users/me/audit-log/")
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert len(data["data"]) == 2

    def test_audit_log_requires_auth(self, api_client):
        response = api_client.get("/api/v2/users/me/audit-log/")
        assert response.status_code == 401

    def test_audit_log_scoped_to_user(self, auth_client, user, second_user):
        AuditLog.log(actor=second_user, action=AuditLog.Action.CREATE, resource_type="Habit")
        response = auth_client.get("/api/v2/users/me/audit-log/")
        assert len(response.json()["data"]) == 0

    def test_str_representation(self, user):
        log = AuditLog.log(actor=user, action=AuditLog.Action.UPDATE, resource_type="UserProfile")
        assert user.username in str(log)
        assert "UPDATE" in str(log)
