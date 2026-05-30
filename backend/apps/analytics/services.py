"""
Analytics service layer.
All database-heavy aggregation lives here — views stay thin.
"""
from datetime import timedelta
from django.db.models import Count, Avg, Sum, Q
from django.utils import timezone
from apps.habits.models import Habit, HabitCompletion, HabitStreak


def get_dashboard_metrics(user):
    """
    Aggregate the key metrics shown on the main dashboard.
    Returns a dict ready to serialize.
    """
    now   = timezone.now()
    today = now.date()
    week_ago  = today - timedelta(days=7)
    month_ago = today - timedelta(days=30)

    # Active habits (not deleted, not archived)
    active_habits = Habit.objects.filter(
        user=user, deleted_at__isnull=True, is_archived=False
    )
    total_active = active_habits.count()

    # Completions this week
    completions_this_week = HabitCompletion.objects.filter(
        habit__user=user,
        completed_at__date__gte=week_ago,
    ).count()

    # Completions last week (for delta)
    two_weeks_ago = today - timedelta(days=14)
    completions_last_week = HabitCompletion.objects.filter(
        habit__user=user,
        completed_at__date__gte=two_weeks_ago,
        completed_at__date__lt=week_ago,
    ).count()

    # 7-day completion rate
    possible_this_week = total_active * 7
    completion_rate_7d = (
        round((completions_this_week / possible_this_week) * 100, 1)
        if possible_this_week > 0 else 0
    )

    # Total completions all time
    total_completions = HabitCompletion.objects.filter(
        habit__user=user
    ).count()

    # Total XP
    total_xp = HabitCompletion.objects.filter(
        habit__user=user
    ).aggregate(total=Sum("xp_earned"))["total"] or 0

    # Best current streak across all habits
    best_streak = HabitStreak.objects.filter(
        habit__user=user
    ).order_by("-current_streak").first()

    # Habits completed today
    completed_today = HabitCompletion.objects.filter(
        habit__user=user,
        completed_at__date=today,
    ).values("habit").distinct().count()

    # Week delta
    week_delta = completions_this_week - completions_last_week
    week_delta_pct = (
        round((week_delta / completions_last_week) * 100, 1)
        if completions_last_week > 0 else 0
    )

    return {
        "active_habits":        total_active,
        "completed_today":      completed_today,
        "remaining_today":      max(0, total_active - completed_today),
        "completions_this_week": completions_this_week,
        "completion_rate_7d":   completion_rate_7d,
        "week_delta_pct":       week_delta_pct,
        "total_completions":    total_completions,
        "total_xp":             total_xp,
        "best_streak": {
            "current":  best_streak.current_streak if best_streak else 0,
            "longest":  best_streak.longest_streak if best_streak else 0,
            "habit":    best_streak.habit.title if best_streak else None,
        } if best_streak else None,
        "as_of": now.isoformat(),
    }


def get_heatmap_data(user, year=None, habit_id=None):
    """
    Returns calendar heatmap data — completion counts per day.
    Optionally filtered by year or specific habit.
    """
    today = timezone.now().date()
    year  = year or today.year

    start = timezone.datetime(year, 1, 1, tzinfo=timezone.utc)
    end   = timezone.datetime(year, 12, 31, 23, 59, 59, tzinfo=timezone.utc)

    qs = HabitCompletion.objects.filter(
        habit__user=user,
        completed_at__gte=start,
        completed_at__lte=end,
    )

    if habit_id:
        qs = qs.filter(habit_id=habit_id)

    # Group by date
    daily = (
        qs.extra(select={"day": "DATE(completed_at)"})
          .values("day")
          .annotate(count=Count("id"))
          .order_by("day")
    )

    # Build a dict {date_str: count}
    heatmap = {str(row["day"]): row["count"] for row in daily}

    return {
        "year":    year,
        "heatmap": heatmap,
        "total":   sum(heatmap.values()),
    }


def get_habit_stats(user, habit_id):
    """
    Per-habit statistics — completion rate, best/current streak, avg value.
    """
    try:
        habit = Habit.objects.get(id=habit_id, user=user, deleted_at__isnull=True)
    except Habit.DoesNotExist:
        return None

    completions = HabitCompletion.objects.filter(habit=habit)
    total = completions.count()

    # 30-day completion rate
    month_ago = timezone.now().date() - timedelta(days=30)
    last_30 = completions.filter(completed_at__date__gte=month_ago).count()
    rate_30d = round((last_30 / 30) * 100, 1)

    # Average value for MEASURABLE habits
    avg_value = completions.aggregate(avg=Avg("value"))["avg"]

    streak = getattr(habit, "streak", None)

    return {
        "habit_id":     str(habit.id),
        "title":        habit.title,
        "total_completions": total,
        "completions_last_30d": last_30,
        "completion_rate_30d": rate_30d,
        "avg_value":    round(float(avg_value), 2) if avg_value else None,
        "target_value": float(habit.target_value) if habit.target_value else None,
        "target_unit":  habit.target_unit,
        "current_streak": streak.current_streak if streak else 0,
        "longest_streak": streak.longest_streak if streak else 0,
    }


def get_weekly_breakdown(user):
    """
    Completion count broken down by day of the week (Mon–Sun).
    Used for the 'best day' insight.
    """
    from django.db.models.functions import ExtractWeekDay

    results = (
        HabitCompletion.objects
        .filter(habit__user=user)
        .annotate(weekday=ExtractWeekDay("completed_at"))
        .values("weekday")
        .annotate(count=Count("id"))
        .order_by("weekday")
    )

    day_names = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
    breakdown = {day: 0 for day in day_names}

    for row in results:
        # Django ExtractWeekDay: 1=Sun, 2=Mon, ..., 7=Sat
        day_name = day_names[row["weekday"] - 1]
        breakdown[day_name] = row["count"]

    best_day = max(breakdown, key=breakdown.get) if breakdown else None

    return {
        "breakdown": breakdown,
        "best_day":  best_day,
    }
