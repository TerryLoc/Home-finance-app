from django.db import models
from django.conf import settings
from django.core.validators import MinValueValidator, MaxValueValidator
from django.core.exceptions import ValidationError
from django.utils import timezone
from decimal import Decimal
import datetime


class Household(models.Model):
    """A household groups multiple users sharing one budget."""

    name = models.CharField(max_length=100)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name

    class Meta:
        ordering = ["name"]


class UserProfile(models.Model):
    """Extends Django User with finance-specific fields."""

    CURRENCY_CHOICES = [
        ("USD", "US Dollar ($)"),
        ("EUR", "Euro (€)"),
        ("GBP", "British Pound (£)"),
        ("AUD", "Australian Dollar (A$)"),
        ("CAD", "Canadian Dollar (C$)"),
        ("JPY", "Japanese Yen (¥)"),
        ("NZD", "New Zealand Dollar (NZ$)"),
    ]

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="profile"
    )
    household = models.ForeignKey(
        Household,
        on_delete=models.CASCADE,
        related_name="members",
        null=True,
        blank=True,
    )
    monthly_net_income = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=0,
        validators=[MinValueValidator(Decimal("0.00"))],
    )
    currency = models.CharField(max_length=3, choices=CURRENCY_CHOICES, default="EUR")

    def __str__(self):
        return f"{self.user.get_full_name() or self.user.username} — {self.currency} {self.monthly_net_income}/mo"

    @property
    def household_income(self):
        """Total monthly income across household members."""
        if self.household:
            from django.db.models import Sum

            return (
                self.household.members.aggregate(total=Sum("monthly_net_income"))[
                    "total"
                ]
                or self.monthly_net_income
            )
        return self.monthly_net_income


class BudgetCategory(models.Model):
    """A spending/saving category linked to one of the 4 budget buckets."""

    BUCKET_CHOICES = [
        ("fixed", "Fixed Costs"),
        ("investments", "Investments"),
        ("savings", "Savings"),
        ("guilt_free", "Guilt-Free Spending"),
    ]

    BUCKET_DEFAULTS = {
        "fixed": {"min": 50, "max": 60},
        "investments": {"min": 10, "max": 100},
        "savings": {"min": 5, "max": 10},
        "guilt_free": {"min": 20, "max": 35},
    }

    household = models.ForeignKey(
        Household, on_delete=models.CASCADE, related_name="categories"
    )
    name = models.CharField(max_length=100)
    bucket = models.CharField(max_length=20, choices=BUCKET_CHOICES)
    target_percentage = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=0,
        validators=[MinValueValidator(Decimal("0")), MaxValueValidator(Decimal("100"))],
    )
    monthly_cap = models.DecimalField(
        max_digits=12, decimal_places=2, default=0, editable=False
    )
    keywords = models.TextField(
        blank=True,
        help_text='Comma-separated keywords for auto-tagging (e.g. "spotify,netflix,hulu")',
    )
    icon = models.CharField(
        max_length=50, blank=True, default="bi-tag", help_text="Bootstrap icon class"
    )

    class Meta:
        verbose_name_plural = "Budget categories"
        ordering = ["bucket", "name"]
        unique_together = ["household", "name"]

    def __str__(self):
        return f"{self.name} ({self.get_bucket_display()}) — {self.target_percentage}%"

    def calculate_monthly_cap(self):
        """Calculate the monthly cap from household income. Returns 0 if missing data."""
        if not self.household_id:
            return Decimal("0")
        from django.db.models import Sum

        income = self.household.members.aggregate(total=Sum("monthly_net_income"))[
            "total"
        ]
        if not income:
            return Decimal("0")
        return (self.target_percentage / Decimal("100")) * income

    def save(self, *args, **kwargs):
        try:
            self.monthly_cap = self.calculate_monthly_cap()
        except Exception:
            self.monthly_cap = Decimal("0")
        super().save(*args, **kwargs)

    def clean(self):
        super().clean()
        defaults = self.BUCKET_DEFAULTS.get(self.bucket, {})
        if defaults:
            min_pct = defaults["min"]
            max_pct = defaults["max"]
            if self.target_percentage and not (
                min_pct <= self.target_percentage <= max_pct
            ):
                raise ValidationError(
                    f"Target % for {self.get_bucket_display()} should be between "
                    f"{min_pct}% and {max_pct}%."
                )

    @classmethod
    def validate_household_allocations(cls, household):
        """Warn if bucket-level allocations don't sum to ~100%."""
        from django.db.models import Sum

        buckets = (
            cls.objects.filter(household=household)
            .values("bucket")
            .annotate(total_pct=Sum("target_percentage"))
        )
        total = sum(b["total_pct"] for b in buckets)
        if total < 95 or total > 105:
            return False, f"Total allocation is {total}% (should be ~100%)"
        return True, f"Total allocation: {total}%"


class Transaction(models.Model):
    """Individual income or expense entry."""

    TRANSACTION_TYPES = [
        ("income", "Income"),
        ("expense", "Expense"),
    ]

    household = models.ForeignKey(
        Household, on_delete=models.CASCADE, related_name="transactions"
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="transactions"
    )
    amount = models.DecimalField(
        max_digits=12, decimal_places=2, validators=[MinValueValidator(Decimal("0.01"))]
    )
    date = models.DateField(default=datetime.date.today, db_index=True)
    description = models.CharField(max_length=255)
    category = models.ForeignKey(
        BudgetCategory,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="transactions",
    )
    transaction_type = models.CharField(
        max_length=7, choices=TRANSACTION_TYPES, default="expense"
    )
    receipt_notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-date", "-created_at"]

    def __str__(self):
        sign = "+" if self.transaction_type == "income" else "-"
        return f"{sign}{self.amount} — {self.description} ({self.date})"

    def save(self, *args, **kwargs):
        # Auto-tag category based on keywords if not set
        if not self.category and self.description and self.household:
            self.category = self.auto_tag_category()
        super().save(*args, **kwargs)

    def auto_tag_category(self):
        """Match description against category keywords."""
        desc_lower = self.description.lower()
        for cat in BudgetCategory.objects.filter(household=self.household):
            if cat.keywords:
                keywords = [k.strip().lower() for k in cat.keywords.split(",")]
                for kw in keywords:
                    if kw and kw in desc_lower:
                        return cat
        return None


class MonthlySnapshot(models.Model):
    """Monthly summary of spending vs budget per bucket."""

    household = models.ForeignKey(
        Household, on_delete=models.CASCADE, related_name="snapshots"
    )
    month = models.DateField(help_text="First day of the month")
    total_income = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    total_expenses = models.DecimalField(max_digits=12, decimal_places=2, default=0)

    # Per-bucket spending
    fixed_spent = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    investments_spent = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    savings_spent = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    guilt_free_spent = models.DecimalField(max_digits=12, decimal_places=2, default=0)

    # Per-bucket target
    fixed_target = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    investments_target = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    savings_target = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    guilt_free_target = models.DecimalField(max_digits=12, decimal_places=2, default=0)

    # Budget health score (0-100)
    health_score = models.IntegerField(
        default=0, validators=[MinValueValidator(0), MaxValueValidator(100)]
    )

    # Savings rollover from previous month
    savings_rollover = models.DecimalField(max_digits=12, decimal_places=2, default=0)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ["household", "month"]
        ordering = ["-month"]

    def __str__(self):
        return f"{self.household.name} — {self.month.strftime('%B %Y')}"

    @property
    def fixed_pct(self):
        if self.total_income:
            return round((self.fixed_spent / self.total_income) * 100, 1)
        return 0

    @property
    def investments_pct(self):
        if self.total_income:
            return round((self.investments_spent / self.total_income) * 100, 1)
        return 0

    @property
    def savings_pct(self):
        if self.total_income:
            return round((self.savings_spent / self.total_income) * 100, 1)
        return 0

    @property
    def guilt_free_pct(self):
        if self.total_income:
            return round((self.guilt_free_spent / self.total_income) * 100, 1)
        return 0

    def calculate_health_score(self):
        """0-100 score based on how well spending matches target allocations."""
        if not self.total_income or self.total_income == 0:
            return 50

        buckets = [
            (self.fixed_spent, self.fixed_target),
            (self.investments_spent, self.investments_target),
            (self.savings_spent, self.savings_target),
            (self.guilt_free_spent, self.guilt_free_target),
        ]

        total_score = 0
        for spent, target in buckets:
            if target == 0:
                total_score += 25  # No target = neutral
                continue
            ratio = float(spent) / float(target) if target else 0
            # Perfect = 25 pts, penalty for deviation
            deviation = abs(1.0 - ratio)
            bucket_score = max(0, 25 - (deviation * 25))
            total_score += bucket_score

        return min(100, max(0, int(total_score)))

    def recalculate(self):
        """Recalculate snapshot from transactions."""
        from django.db.models import Sum, Q

        month_start = self.month.replace(day=1)
        if month_start.month == 12:
            month_end = month_start.replace(year=month_start.year + 1, month=1)
        else:
            month_end = month_start.replace(month=month_start.month + 1)

        txns = Transaction.objects.filter(
            household=self.household, date__gte=month_start, date__lt=month_end
        )

        self.total_income = txns.filter(transaction_type="income").aggregate(
            t=Sum("amount")
        )["t"] or Decimal("0")
        self.total_expenses = txns.filter(transaction_type="expense").aggregate(
            t=Sum("amount")
        )["t"] or Decimal("0")

        # Per-bucket spending
        expense_txns = txns.filter(transaction_type="expense", category__isnull=False)
        for bucket_key in ["fixed", "investments", "savings", "guilt_free"]:
            spent = expense_txns.filter(category__bucket=bucket_key).aggregate(
                t=Sum("amount")
            )["t"] or Decimal("0")
            setattr(self, f"{bucket_key}_spent", spent)

        # Calculate targets from actual income transactions this month
        # (falls back to static profile income if no income transactions yet)
        if self.total_income > 0:
            income_base = self.total_income
        else:
            income_base = sum(
                m.monthly_net_income for m in self.household.members.all()
            )
        cats = BudgetCategory.objects.filter(household=self.household)
        for bucket_key in ["fixed", "investments", "savings", "guilt_free"]:
            bucket_cats = cats.filter(bucket=bucket_key)
            total_pct = bucket_cats.aggregate(t=Sum("target_percentage"))[
                "t"
            ] or Decimal("0")
            target = (total_pct / Decimal("100")) * income_base
            setattr(self, f"{bucket_key}_target", target)

        # Rollover logic: unused savings from previous month rolls over
        prev_month = month_start - datetime.timedelta(days=1)
        prev_snapshot = MonthlySnapshot.objects.filter(
            household=self.household,
            month__year=prev_month.year,
            month__month=prev_month.month,
        ).first()
        if prev_snapshot:
            unused_savings = max(
                Decimal("0"), prev_snapshot.savings_target - prev_snapshot.savings_spent
            )
            self.savings_rollover = unused_savings + prev_snapshot.savings_rollover
        else:
            self.savings_rollover = Decimal("0")

        self.health_score = self.calculate_health_score()


class SavingsGoal(models.Model):
    """A specific savings goal with target amount and progress tracking."""

    household = models.ForeignKey(
        Household, on_delete=models.CASCADE, related_name="savings_goals"
    )
    name = models.CharField(max_length=100)
    target_amount = models.DecimalField(
        max_digits=12, decimal_places=2, validators=[MinValueValidator(Decimal("0.01"))]
    )
    current_amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=0,
        validators=[MinValueValidator(Decimal("0"))],
    )
    target_date = models.DateField(null=True, blank=True)
    linked_category = models.ForeignKey(
        BudgetCategory,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="savings_goals",
        help_text="Link to a savings category to auto-track contributions",
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["target_date", "name"]

    def __str__(self):
        return f"{self.name} — {self.current_amount}/{self.target_amount}"

    @property
    def progress_percentage(self):
        if self.target_amount and self.target_amount > 0:
            return min(100, round((self.current_amount / self.target_amount) * 100, 1))
        return 0

    @property
    def remaining(self):
        return max(Decimal("0"), self.target_amount - self.current_amount)

    @property
    def monthly_contribution_avg(self):
        """Average monthly contribution over the last 3 months."""
        if not self.linked_category:
            return Decimal("0")
        three_months_ago = datetime.date.today() - datetime.timedelta(days=90)
        from django.db.models import Sum

        total = Transaction.objects.filter(
            category=self.linked_category,
            transaction_type="expense",
            date__gte=three_months_ago,
        ).aggregate(t=Sum("amount"))["t"] or Decimal("0")
        return total / 3

    @property
    def projected_completion_date(self):
        """Estimate completion based on average monthly contributions."""
        if self.current_amount >= self.target_amount:
            return datetime.date.today()

        monthly_avg = self.monthly_contribution_avg
        if monthly_avg > 0:
            months_remaining = float(self.remaining) / float(monthly_avg)
            return datetime.date.today() + datetime.timedelta(
                days=int(months_remaining * 30)
            )
        elif self.target_date:
            return self.target_date
        return None

    @property
    def on_track(self):
        """Check if goal is on track to meet target date."""
        if not self.target_date:
            return None
        projected = self.projected_completion_date
        if projected and projected <= self.target_date:
            return True
        return False


class RecurringTransaction(models.Model):
    """A template for transactions that repeat on a schedule."""

    FREQUENCY_CHOICES = [
        ("weekly", "Weekly"),
        ("fortnightly", "Fortnightly"),
        ("monthly", "Monthly"),
        ("quarterly", "Quarterly"),
        ("yearly", "Yearly"),
    ]

    household = models.ForeignKey(
        Household, on_delete=models.CASCADE, related_name="recurring_transactions"
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="recurring_transactions",
    )
    description = models.CharField(max_length=255)
    amount = models.DecimalField(
        max_digits=12, decimal_places=2, validators=[MinValueValidator(Decimal("0.01"))]
    )
    category = models.ForeignKey(
        BudgetCategory,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="recurring_transactions",
    )
    transaction_type = models.CharField(
        max_length=7, choices=Transaction.TRANSACTION_TYPES, default="expense"
    )
    frequency = models.CharField(
        max_length=12, choices=FREQUENCY_CHOICES, default="monthly"
    )
    next_date = models.DateField(
        help_text="Next date this transaction should be created"
    )
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["next_date"]

    def __str__(self):
        return f"{self.description} — {self.amount} ({self.get_frequency_display()})"

    def create_transaction(self):
        """Create the actual transaction and advance the next_date."""
        txn = Transaction.objects.create(
            household=self.household,
            user=self.user,
            amount=self.amount,
            date=self.next_date,
            description=self.description,
            category=self.category,
            transaction_type=self.transaction_type,
            receipt_notes=f"Auto-created from recurring: {self.description}",
        )
        self._advance_next_date()
        return txn

    def _advance_next_date(self):
        """Move next_date forward based on frequency."""
        if self.frequency == "weekly":
            self.next_date += datetime.timedelta(weeks=1)
        elif self.frequency == "fortnightly":
            self.next_date += datetime.timedelta(weeks=2)
        elif self.frequency == "monthly":
            month = self.next_date.month % 12 + 1
            year = self.next_date.year + (1 if month == 1 else 0)
            day = min(self.next_date.day, 28)  # safe day
            self.next_date = datetime.date(year, month, day)
        elif self.frequency == "quarterly":
            month = self.next_date.month
            for _ in range(3):
                month = month % 12 + 1
            year = self.next_date.year + ((self.next_date.month + 2) // 12)
            day = min(self.next_date.day, 28)
            self.next_date = datetime.date(year, month, day)
        elif self.frequency == "yearly":
            self.next_date = datetime.date(
                self.next_date.year + 1,
                self.next_date.month,
                min(self.next_date.day, 28),
            )
        self.save()
