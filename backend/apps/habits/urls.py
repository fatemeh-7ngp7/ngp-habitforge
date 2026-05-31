from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import HabitCategoryListView, HabitViewSet

router = DefaultRouter()
router.register(r"", HabitViewSet, basename="habits")

urlpatterns = [
    path("categories/", HabitCategoryListView.as_view(), name="habit-categories"),
    path("", include(router.urls)),
]
