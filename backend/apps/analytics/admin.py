from django.contrib import admin
from .models import AnalyticsEvent, UserInsight


@admin.register(AnalyticsEvent)
class AnalyticsEventAdmin(admin.ModelAdmin):
    list_display  = ["user", "event_type", "ts"]
    list_filter   = ["event_type"]
    search_fields = ["user__email", "event_type"]
    readonly_fields = ["id", "ts"]


@admin.register(UserInsight)
class UserInsightAdmin(admin.ModelAdmin):
    list_display  = ["user", "insight_type", "title", "is_read", "generated_at"]
    list_filter   = ["insight_type", "is_read"]
    search_fields = ["user__email", "title"]
    readonly_fields = ["id", "generated_at"]
