"""
BadgeAwardEngine — evaluates badge conditions and awards badges.

Called after every HabitCompletion via signal.
Runs all active badge checks for the user and awards any newly qualifying badges.
Designed to be fast: only queries what it needs, skips already-earned badges.
"""
import logging

from django.db.models import Count, Sum

logger = logging.getLogger(__name__)


class BadgeAwardEngine:

    def __init__(self, user):
        self.user = user
        self._already_earned = None

    @property
    def already_earned_ids(self):
        if self._already_earned is None:
            from apps.gamification.models import UserBadge
            self._already_earned = set(
                UserBadge.objects.filter(user=self.user)
                .values_list("badge_id", flat=True)
            )
        return self._already_earned

    def evaluate(self):
        """
        Check all active badges the user hasn't earned yet.
        Award any that now qualify. Returns list of newly awarded UserBadge objects.
        """
        from apps.gamification.models import Badge, UserBadge, UserXP

        active_badges = Badge.objects.filter(is_active=True).exclude(
            id__in=self.already_earned_ids
        )

        newly_awarded = []

        for badge in active_badges:
            if self._qualifies(badge):
                user_badge = UserBadge.objects.create(
                    user=self.user,
                    badge=badge,
                )
                newly_awarded.append(user_badge)
                logger.info(
                    "Badge awarded: '%s' → %s",
                    badge.name, self.user.username,
                )

                # Award badge XP
                user_xp, _ = UserXP.objects.get_or_create(user=self.user)
                user_xp.add_xp(badge.xp_reward)

        return newly_awarded

    def _qualifies(self, badge):
        """Dispatch to the correct condition checker."""
        checkers = {
            "STREAK_DAYS":       self._check_streak_days,
            "TOTAL_COMPLETIONS": self._check_total_completions,
            "HABITS_CREATED":    self._check_habits_created,
            "CHALLENGE_JOINED":  self._check_challenge_joined,
            "PERFECT_WEEK":      self._check_perfect_week,
            "EARLY_BIRD":        self._check_early_bird,
        }
        checker = checkers.get(badge.condition_type)
        if not checker:
            return False
        return checker(badge.condition_value)

    # ── Condition checkers ────────────────────────────────────────────────────

    def _check_streak_days(self, n):
        """User has any habit with current_streak >= n."""
        from apps.habits.models import HabitStreak
        return HabitStreak.objects.filter(
            habit__user=self.user,
            current_streak__gte=n,
        ).exists()

    def _check_total_completions(self, n):
        """User's total completion count >= n."""
        from apps.habits.models import HabitCompletion
        total = HabitCompletion.objects.filter(habit__user=self.user).count()
        return total >= n

    def _check_habits_created(self, n):
        """User has created >= n habits (including deleted)."""
        from apps.habits.models import Habit
        return Habit.objects.filter(user=self.user).count() >= n

    def _check_challenge_joined(self, n):
        """User has joined >= n challenges."""
        from apps.social.models import ChallengeParticipant
        return ChallengeParticipant.objects.filter(user=self.user).count() >= n

    def _check_perfect_week(self, n):
        """
        User completed ALL active habits every day for the last 7 days.
        n is unused (condition is boolean) — kept for interface consistency.
        """
        from datetime import timedelta
        from django.utils import timezone
        from apps.habits.models import Habit, HabitCompletion

        today     = timezone.now().date()
        week_ago  = today - timedelta(days=6)
        active    = Habit.objects.filter(
            user=self.user, deleted_at__isnull=True, is_archived=False
        )
        if not active.exists():
            return False

        habit_count = active.count()
        for i in range(7):
            day = week_ago + timedelta(days=i)
            completions = HabitCompletion.objects.filter(
                habit__user=self.user,
                completed_at__date=day,
            ).values("habit").distinct().count()
            if completions < habit_count:
                return False
        return True

    def _check_early_bird(self, n):
        """User completed a habit before 7 AM at least n times."""
        from apps.habits.models import HabitCompletion
        early = HabitCompletion.objects.filter(
            habit__user=self.user,
            completed_at__hour__lt=7,
        ).count()
        return early >= n
