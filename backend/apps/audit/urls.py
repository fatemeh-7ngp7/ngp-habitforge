from django.urls import path

from .views import MyAuditLogView

urlpatterns = [
    path("me/audit-log/", MyAuditLogView.as_view(), name="audit-my-log"),
]
