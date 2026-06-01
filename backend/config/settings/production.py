"""
Production settings — hardened, no DEBUG, all secrets from environment.
"""
from .base import *  # noqa: F401, F403

DEBUG = False

# Security
SECURE_SSL_REDIRECT             = True
SECURE_HSTS_SECONDS             = 31536000
SECURE_HSTS_INCLUDE_SUBDOMAINS  = True
SECURE_HSTS_PRELOAD             = True
SECURE_CONTENT_TYPE_NOSNIFF     = True
SECURE_BROWSER_XSS_FILTER       = True
SESSION_COOKIE_SECURE           = True
SESSION_COOKIE_HTTPONLY         = True
CSRF_COOKIE_SECURE              = True
X_FRAME_OPTIONS                 = "DENY"

# Disable debug toolbar in production
INSTALLED_APPS = [app for app in INSTALLED_APPS  # noqa: F405
                  if app != "debug_toolbar"]
MIDDLEWARE = [mw for mw in MIDDLEWARE           # noqa: F405
              if "debug_toolbar" not in mw]

# Email — configure via env
EMAIL_BACKEND  = "django.core.mail.backends.smtp.EmailBackend"
EMAIL_HOST     = env("EMAIL_HOST", default="smtp.sendgrid.net")        # noqa: F405
EMAIL_PORT     = env.int("EMAIL_PORT", default=587)                    # noqa: F405
EMAIL_USE_TLS  = True
EMAIL_HOST_USER    = env("EMAIL_HOST_USER", default="")                # noqa: F405
EMAIL_HOST_PASSWORD= env("EMAIL_HOST_PASSWORD", default="")           # noqa: F405
DEFAULT_FROM_EMAIL = env("DEFAULT_FROM_EMAIL",                         # noqa: F405
                         default="noreply@ngp-habitforge.com")

# Logging — production: WARNING level, no debug noise
LOGGING["root"]["level"] = "WARNING"                                   # noqa: F405
