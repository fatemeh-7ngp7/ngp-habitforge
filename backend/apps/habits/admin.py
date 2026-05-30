from django.contrib import admin
from .models import Habit, HabitCategory, HabitCompletion, HabitStreak, HabitReminder


@admin.register(HabitCategory)
class HabitCategoryAdmin(admin.ModelAdmin):
    list_display = ["name", "icon", "color", "order"]
    ordering = ["order"]


class HabitCompletionInline(admin.TabularInline):
    model = HabitCompletion
    extra = 0
    readonly_fields = ["id", "completed_at", "value", "xp_earned"]


class HabitStreakInline(admin.StackedInline):
    model = HabitStreak
    can_delete = False
    readonly_fields = ["current_streak", "longest_streak", "total_completions", "updated_at"]


@admin.register(Habit)
class HabitAdmin(admin.ModelAdmin):
    list_display  = ["title", "user", "habit_type", "frequency_type", "difficulty", "is_archived", "created_at"]
    list_filter   = ["habit_type", "frequency_type", "difficulty", "is_archived"]
    search_fields = ["title", "user__email", "user__username"]
    readonly_fields = ["id", "created_at", "updated_at", "deleted_at"]
    inlines = [HabitStreakInline, HabitCompletionInline]


@admin.register(HabitCompletion)
class HabitCompletionAdmin(admin.ModelAdmin):
    list_display  = ["habit", "completed_at", "value", "xp_earned", "verified_by"]
    list_filter   = ["verified_by"]
    readonly_fields = ["id"]
