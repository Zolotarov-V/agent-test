from rest_framework_simplejwt.tokens import RefreshToken

from .models import UserAPIKey


def issue_tokens(user) -> dict:
    refresh = RefreshToken.for_user(user)
    return {
        "access": str(refresh.access_token),
        "refresh": str(refresh),
    }


def get_api_keys_payload(user) -> dict:
    try:
        record = user.api_keys
    except UserAPIKey.DoesNotExist:
        return {
            "gemini_configured": False,
            "gemini_key_hint": "",
            "serper_configured": False,
            "serper_key_hint": "",
            "github_configured": False,
            "github_status": "not_configured",
            "github_key_hint": "",
        }

    return {
        "gemini_configured": record.gemini_configured,
        "gemini_key_hint": record.gemini_key_hint(),
        "serper_configured": record.serper_configured,
        "serper_key_hint": record.serper_key_hint(),
        "github_configured": record.github_configured,
        "github_status": record.github_status(),
        "github_key_hint": record.github_key_hint(),
    }


def auth_response(user) -> dict:
    payload = issue_tokens(user)
    payload["api_keys"] = get_api_keys_payload(user)
    return payload
