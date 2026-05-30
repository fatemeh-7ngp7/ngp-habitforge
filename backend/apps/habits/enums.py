"""
Habit domain enums — all choices defined once, used everywhere.
"""
from django.db import models
from django.utils.translation import gettext_lazy as _


class HabitType(models.TextChoices):
    BINARY      = "BINARY",      _("Binary (done / not done)")
    MEASURABLE  = "MEASURABLE",  _("Measurable (track a value)")
    TIME_BASED  = "TIME_BASED",  _("Time-based (track duration)")


class FrequencyType(models.TextChoices):
    DAILY   = "DAILY",   _("Every day")
    WEEKLY  = "WEEKLY",  _("Specific days of the week")
    CUSTOM  = "CUSTOM",  _("Custom interval")


class DifficultyLevel(models.TextChoices):
    EASY   = "EASY",   _("Easy")
    MEDIUM = "MEDIUM", _("Medium")
    HARD   = "HARD",   _("Hard")


class VerificationMethod(models.TextChoices):
    USER        = "USER",        _("Self-reported")
    AI_VISION   = "AI_VISION",   _("AI photo verification")
    INTEGRATION = "INTEGRATION", _("Third-party integration")
