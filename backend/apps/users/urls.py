from django.urls import path

from .views import UserExportView, UserMeView

urlpatterns = [
    path("me/",        UserMeView.as_view(),    name="users-me"),
    path("me/export/", UserExportView.as_view(), name="users-export"),
]

# Audit log (personal trail)
from apps.audit.views import MyAuditLogView  # noqa: E402
urlpatterns += [
    path("me/audit-log/", MyAuditLogView.as_view(), name="users-audit-log"),
]
