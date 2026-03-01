from .models import UserProfile
from .templatetags.tracker_tags import CURRENCY_SYMBOLS


def currency_context(request):
    """Add currency symbol to all templates."""
    if request.user.is_authenticated:
        try:
            currency_code = request.user.profile.currency
        except (UserProfile.DoesNotExist, AttributeError):
            currency_code = "EUR"
    else:
        currency_code = "EUR"

    return {
        "currency_code": currency_code,
        "cs": CURRENCY_SYMBOLS.get(currency_code, "€"),
    }
