from django.urls import path
from django.http import JsonResponse
from django.db import connection


def healthz(request):
    return JsonResponse({"status": "ok"})


def readyz(request):
    try:
        connection.ensure_connection()
        return JsonResponse({"status": "ok", "db": "connected"})
    except Exception as e:
        return JsonResponse({"status": "error", "db": str(e)}, status=503)


urlpatterns = [
    path("", healthz),
    path("ready/", readyz),
]
