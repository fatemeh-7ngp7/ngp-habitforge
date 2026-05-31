from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.utils.translation import gettext_lazy as _

from .models import CustomUser, UserProfile


class UserProfileInline(admin.StackedInline):
    model = UserProfile
    can_delete = False
    verbose_name_plural = "Profile"
    fk_name = "user"


@admin.register(CustomUser)
class CustomUserAdmin(BaseUserAdmin):
    inlines = [UserProfileInline]

    list_display = [
        "email", "username", "is_verified",
        "is_active", "mfa_enabled", "date_joined",
    ]
    list_filter = ["is_active", "is_staff", "is_verified", "mfa_enabled"]
    search_fields = ["email", "username", "first_name", "last_name"]
    ordering = ["-date_joined"]
    readonly_fields = ["id", "date_joined", "updated_at", "last_login", "last_login_ip"]

    fieldsets = (
        (None, {"fields": ("id", "email", "password")}),
        (_("Personal info"), {"fields": ("username", "first_name", "last_name")}),
        (_("Status"), {"fields": ("is_active", "is_verified", "is_staff", "is_superuser")}),
        (_("Security"), {"fields": ("mfa_enabled", "failed_login_count", "last_login_ip")}),
        (_("Timestamps"), {"fields": ("date_joined", "updated_at", "last_login", "deleted_at")}),
        (_("Permissions"), {"fields": ("groups", "user_permissions")}),
    )

    add_fieldsets = (
        (None, {
            "classes": ("wide",),
            "fields": ("email", "username", "password1", "password2"),
        }),
    )
