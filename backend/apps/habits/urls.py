from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import HabitViewSet, HabitCategoryListView

router = DefaultRouter()
router.register(r"", HabitViewSet, basename="habits")

urlpatterns = [
    path("categories/", HabitCategoryListView.as_view(), name="habit-categories"),
    path("", include(router.urls)),
]
