"""
Token generation for email verification links.

Reuses Django's battle-tested PasswordResetTokenGenerator machinery instead of
introducing a new DB model/migration. The hash incorporates `is_verified` so a
token automatically becomes invalid the moment it's used (mirrors how the
built-in generator invalidates password-reset tokens after `last_login` changes).
"""
from django.contrib.auth.tokens import PasswordResetTokenGenerator


class EmailVerificationTokenGenerator(PasswordResetTokenGenerator):
    def _make_hash_value(self, user, timestamp):
        return (
            f"{user.pk}{timestamp}{user.is_verified}"
        )


email_verification_token = EmailVerificationTokenGenerator()