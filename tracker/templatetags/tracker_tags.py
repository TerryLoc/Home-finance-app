from django import template

register = template.Library()

# Canonical currency-symbol map — imported by context_processors.py too
CURRENCY_SYMBOLS = {
    "USD": "$",
    "EUR": "€",
    "GBP": "£",
    "AUD": "A$",
    "CAD": "C$",
    "JPY": "¥",
    "NZD": "NZ$",
}


@register.filter
def currency_symbol(currency_code):
    """Return currency symbol for a currency code."""
    return CURRENCY_SYMBOLS.get(currency_code, "€")


@register.filter
def bucket_color(bucket_key):
    """Map bucket key to a Bootstrap color class."""
    colors = {
        "fixed": "primary",
        "investments": "success",
        "savings": "info",
        "guilt_free": "warning",
    }
    return colors.get(bucket_key, "secondary")


@register.filter
def bucket_icon(bucket_key):
    """Map bucket key to a Bootstrap icon."""
    icons = {
        "fixed": "bi-house-fill",
        "investments": "bi-graph-up-arrow",
        "savings": "bi-piggy-bank-fill",
        "guilt_free": "bi-emoji-smile-fill",
    }
    return icons.get(bucket_key, "bi-tag")


@register.filter
def status_color(pct_of_target):
    """Return color class based on percentage of target spent."""
    try:
        pct = float(pct_of_target)
    except (ValueError, TypeError):
        return "secondary"
    if pct <= 80:
        return "success"
    elif pct <= 100:
        return "warning"
    else:
        return "danger"


@register.filter
def health_color(score):
    """Return color class based on health score."""
    try:
        s = int(score)
    except (ValueError, TypeError):
        return "secondary"
    if s >= 75:
        return "success"
    elif s >= 50:
        return "warning"
    else:
        return "danger"


@register.filter
def subtract(value, arg):
    """Subtract arg from value."""
    try:
        return float(value) - float(arg)
    except (ValueError, TypeError):
        return 0


@register.filter
def percentage_of(value, total):
    """Calculate percentage of value relative to total."""
    try:
        if float(total) == 0:
            return 0
        return round((float(value) / float(total)) * 100, 1)
    except (ValueError, TypeError):
        return 0


@register.filter
def dict_get(d, key):
    """Look up a key in a dictionary."""
    if isinstance(d, dict):
        return d.get(key, 0)
    return 0
