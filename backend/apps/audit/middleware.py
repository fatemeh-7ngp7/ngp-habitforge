"""
Audit middleware — automatically logs all state-changing API calls.
Fires on POST, PUT, PATCH, DELETE responses with 2xx status.
"""
import logging

logger = logging.getLogger(__name__)

WRITE_METHODS = {"POST", "PUT", "PATCH", "DELETE"}
SKIP_PATHS    = {"/healthz/", "/admin/", "/api/schema/", "/api/docs/", "/api/redoc/", "/__debug__/"}


class AuditMiddleware:

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)
        self._maybe_audit(request, response)
        return response

    def _maybe_audit(self, request, response):
        if request.method not in WRITE_METHODS:
            return
        if not (200 <= response.status_code < 300):
            return
        if not request.user or not request.user.is_authenticated:
            return
        for skip in SKIP_PATHS:
            if request.path.startswith(skip):
                return

        try:
            from apps.audit.models import AuditLog

            action_map = {
                "POST":   AuditLog.Action.CREATE,
                "PUT":    AuditLog.Action.UPDATE,
                "PATCH":  AuditLog.Action.UPDATE,
                "DELETE": AuditLog.Action.DELETE,
            }

            AuditLog.log(
                actor=request.user,
                action=action_map[request.method],
                resource_type=request.path,
                resource_id="",
                request=request,
                extra={"method": request.method, "status": response.status_code},
            )
        except Exception as e:
            # Never let audit logging crash the request
            logger.warning("AuditMiddleware failed: %s", e)
