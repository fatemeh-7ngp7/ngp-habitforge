from django.urls import path

from apps.audit.views import MyAuditLogView

from .views import UserExportView, UserMeView

urlpatterns = [
    path("me/",            UserMeView.as_view(),    name="users-me"),
    path("me/export/",     UserExportView.as_view(), name="users-export"),
    path("me/audit-log/",  MyAuditLogView.as_view(), name="users-audit-log"),
]
