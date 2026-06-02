from django.contrib import admin

from .models import Badge, Leaderboard, LeaderboardEntry, UserBadge, UserXP, XPLevel


@admin.register(Badge)
class BadgeAdmin(admin.ModelAdmin):
    list_display  = ["icon", "name", "condition_type", "condition_value", "xp_reward", "is_active", "order"]
    list_filter   = ["condition_type", "is_active"]
    search_fields = ["name"]
    ordering      = ["order"]


@admin.register(UserBadge)
class UserBadgeAdmin(admin.ModelAdmin):
    list_display  = ["user", "badge", "earned_at", "notified"]
    list_filter   = ["notified"]
    search_fields = ["user__username", "badge__name"]
    readonly_fields = ["id", "earned_at"]


@admin.register(XPLevel)
class XPLevelAdmin(admin.ModelAdmin):
    list_display = ["level", "title", "xp_required", "icon", "color"]
    ordering     = ["level"]


@admin.register(UserXP)
class UserXPAdmin(admin.ModelAdmin):
    list_display  = ["user", "total_xp", "current_level", "updated_at"]
    search_fields = ["user__username", "user__email"]
    readonly_fields = ["updated_at"]


class LeaderboardEntryInline(admin.TabularInline):
    model       = LeaderboardEntry
    extra       = 0
    readonly_fields = ["rank", "score", "completions"]


@admin.register(Leaderboard)
class LeaderboardAdmin(admin.ModelAdmin):
    list_display = ["period", "started_at", "is_current", "created_at"]
    list_filter  = ["period", "is_current"]
    inlines      = [LeaderboardEntryInline]
