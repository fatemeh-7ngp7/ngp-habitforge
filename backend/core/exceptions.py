import logging
from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework import status

logger = logging.getLogger(__name__)


def custom_exception_handler(exc, context):
    response = exception_handler(exc, context)

    if response is not None:
        return Response({
            "success": False,
            "error": {
                "status_code": response.status_code,
                "detail": response.data,
            }
        }, status=response.status_code)

    logger.exception("Unhandled exception: %s", exc)
    return Response({
        "success": False,
        "error": {
            "status_code": 500,
            "detail": "Internal server error.",
        }
    }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
