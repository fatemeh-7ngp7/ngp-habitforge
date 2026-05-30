from django.apps import AppConfig


class HabitsConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "apps.habits"
    verbose_name = "Habits"

    def ready(self):
        import apps.habits.signals  # noqa: F401
