from datetime import timedelta
from datetime import timezone as dt_timezone

from django.db.models import Avg, Count, Sum
from django.db.models.functions import ExtractWeekDay, TruncDate
from django.utils import timezone

from apps.habits.models import Habit, HabitCompletion, HabitStreak


def get_dashboard_metrics(user):
    now       = timezone.now()
    today     = now.date()
    week_ago  = today - timedelta(days=7)
    two_weeks_ago = today - timedelta(days=14)

    active_habits = Habit.objects.filter(
        user=user, deleted_at__isnull=True, is_archived=False
    )
    total_active = active_habits.count()

    completions_this_week = HabitCompletion.objects.filter(
        habit__user=user, completed_at__date__gte=week_ago,
    ).count()

    completions_last_week = HabitCompletion.objects.filter(
        habit__user=user,
        completed_at__date__gte=two_weeks_ago,
        completed_at__date__lt=week_ago,
    ).count()

    possible_this_week = total_active * 7
    completion_rate_7d = (
        round((completions_this_week / possible_this_week) * 100, 1)
        if possible_this_week > 0 else 0
    )

    total_completions = HabitCompletion.objects.filter(habit__user=user).count()
    total_xp = (
        HabitCompletion.objects
        .filter(habit__user=user)
        .aggregate(total=Sum("xp_earned"))["total"] or 0
    )

    best_streak = (
        HabitStreak.objects
        .filter(habit__user=user)
        .order_by("-current_streak")
        .select_related("habit")
        .first()
    )

    completed_today = (
        HabitCompletion.objects
        .filter(habit__user=user, completed_at__date=today)
        .values("habit")
        .distinct()
        .count()
    )

    week_delta = completions_this_week - completions_last_week
    week_delta_pct = (
        round((week_delta / completions_last_week) * 100, 1)
        if completions_last_week > 0 else 0
    )

    return {
        "active_habits":         total_active,
        "completed_today":       completed_today,
        "remaining_today":       max(0, total_active - completed_today),
        "completions_this_week": completions_this_week,
        "completion_rate_7d":    completion_rate_7d,
        "week_delta_pct":        week_delta_pct,
        "total_completions":     total_completions,
        "total_xp":              total_xp,
        "best_streak": {
            "current": best_streak.current_streak,
            "longest": best_streak.longest_streak,
            "habit":   best_streak.habit.title,
        } if best_streak else None,
        "as_of": now.isoformat(),
    }


def get_heatmap_data(user, year=None, habit_id=None):
    today = timezone.now().date()
    year  = year or today.year

    start = timezone.datetime(year, 1,  1,  0, 0, 0, tzinfo=dt_timezone.utc)
    end   = timezone.datetime(year, 12, 31, 23, 59, 59, tzinfo=dt_timezone.utc)

    qs = HabitCompletion.objects.filter(
        habit__user=user,
        completed_at__gte=start,
        completed_at__lte=end,
    )

    if habit_id:
        qs = qs.filter(habit_id=habit_id)

    daily = (
        qs
        .annotate(day=TruncDate("completed_at"))
        .values("day")
        .annotate(count=Count("id"))
        .order_by("day")
    )

    heatmap = {}
    for row in daily:
        if row["day"] is not None:
            heatmap[str(row["day"])] = row["count"]

    return {
        "year":    year,
        "heatmap": heatmap,
        "total":   sum(heatmap.values()),
    }


def get_habit_stats(user, habit_id):
    try:
        habit = Habit.objects.get(
            id=habit_id, user=user, deleted_at__isnull=True
        )
    except Habit.DoesNotExist:
        return None

    completions = HabitCompletion.objects.filter(habit=habit)
    total       = completions.count()
    month_ago   = timezone.now().date() - timedelta(days=30)
    last_30     = completions.filter(completed_at__date__gte=month_ago).count()
    rate_30d    = round((last_30 / 30) * 100, 1)
    avg_value   = completions.aggregate(avg=Avg("value"))["avg"]
    streak      = getattr(habit, "streak", None)

    return {
        "habit_id":             str(habit.id),
        "title":                habit.title,
        "total_completions":    total,
        "completions_last_30d": last_30,
        "completion_rate_30d":  rate_30d,
        "avg_value":            round(float(avg_value), 2) if avg_value else None,
        "target_value":         float(habit.target_value) if habit.target_value else None,
        "target_unit":          habit.target_unit,
        "current_streak":       streak.current_streak if streak else 0,
        "longest_streak":       streak.longest_streak if streak else 0,
    }


def get_weekly_breakdown(user):
    results = (
        HabitCompletion.objects
        .filter(habit__user=user)
        .annotate(weekday=ExtractWeekDay("completed_at"))
        .values("weekday")
        .annotate(count=Count("id"))
        .order_by("weekday")
    )

    # Django: 1=Sun, 2=Mon, 3=Tue, 4=Wed, 5=Thu, 6=Fri, 7=Sat
    day_names = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
    breakdown = {day: 0 for day in day_names}

    for row in results:
        idx = row["weekday"] - 1
        if 0 <= idx < 7:
            breakdown[day_names[idx]] = row["count"]

    best_day = (
        max(breakdown, key=breakdown.get)
        if any(breakdown.values()) else None
    )

    return {"breakdown": breakdown, "best_day": best_day}
