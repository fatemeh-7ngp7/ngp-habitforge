from rest_framework import serializers
from .models import AuditLog


class AuditLogSerializer(serializers.ModelSerializer):
    class Meta:
        model  = AuditLog
        fields = [
            "id", "action", "resource_type", "resource_id",
            "ip_address", "extra", "timestamp",
        ]
        read_only_fields = fields
