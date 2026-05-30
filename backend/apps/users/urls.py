from django.urls import path
from .views import UserMeView, UserExportView

urlpatterns = [
    path("me/",        UserMeView.as_view(),    name="users-me"),
    path("me/export/", UserExportView.as_view(), name="users-export"),
]
