from django.contrib import admin

from .models import ChallengeParticipant, Friendship, GroupChallenge, SocialFeedItem


@admin.register(Friendship)
class FriendshipAdmin(admin.ModelAdmin):
    list_display  = ["requester", "addressee", "status", "created_at"]
    list_filter   = ["status"]
    search_fields = ["requester__username", "addressee__username"]


class ParticipantInline(admin.TabularInline):
    model      = ChallengeParticipant
    extra      = 0
    readonly_fields = ["score", "completions", "joined_at"]


@admin.register(GroupChallenge)
class GroupChallengeAdmin(admin.ModelAdmin):
    list_display  = ["title", "created_by", "privacy", "start_date", "end_date", "is_active"]
    list_filter   = ["privacy", "is_active"]
    search_fields = ["title", "created_by__username"]
    readonly_fields = ["id", "invite_code", "created_at"]
    inlines       = [ParticipantInline]


@admin.register(SocialFeedItem)
class SocialFeedItemAdmin(admin.ModelAdmin):
    list_display  = ["user", "event_type", "title", "is_public", "created_at"]
    list_filter   = ["event_type", "is_public"]
    search_fields = ["user__username", "title"]
    readonly_fields = ["id", "created_at"]
