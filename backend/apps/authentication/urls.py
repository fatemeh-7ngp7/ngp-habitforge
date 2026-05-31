"""
Authentication URL patterns.
Mounted at /api/v1/auth/ and /api/v2/auth/
"""
from django.urls import path

from .views import (
    ChangePasswordView,
    LoginView,
    LogoutView,
    MeView,
    RegisterView,
    TokenRefreshView,
)

urlpatterns = [
    path("register/",         RegisterView.as_view(),       name="auth-register"),
    path("login/",            LoginView.as_view(),           name="auth-login"),
    path("logout/",           LogoutView.as_view(),          name="auth-logout"),
    path("token/refresh/",    TokenRefreshView.as_view(),    name="auth-token-refresh"),
    path("password/change/",  ChangePasswordView.as_view(),  name="auth-password-change"),
    path("me/",               MeView.as_view(),              name="auth-me"),
]
