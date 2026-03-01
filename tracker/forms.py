from django import forms
from django.contrib.auth.models import User
from django.contrib.auth.forms import UserCreationForm
from .models import (
    UserProfile,
    BudgetCategory,
    Transaction,
    SavingsGoal,
    Household,
    RecurringTransaction,
)


class HouseholdForm(forms.ModelForm):
    class Meta:
        model = Household
        fields = ["name"]
        widgets = {
            "name": forms.TextInput(
                attrs={"class": "form-control", "placeholder": "e.g. The Smith Family"}
            ),
        }


class UserProfileForm(forms.ModelForm):
    class Meta:
        model = UserProfile
        fields = ["monthly_net_income", "currency"]
        widgets = {
            "monthly_net_income": forms.NumberInput(
                attrs={
                    "class": "form-control",
                    "step": "0.01",
                    "min": "0",
                    "placeholder": "Monthly take-home pay",
                }
            ),
            "currency": forms.Select(attrs={"class": "form-select"}),
        }


class SignUpForm(UserCreationForm):
    email = forms.EmailField(
        required=True, widget=forms.EmailInput(attrs={"class": "form-control"})
    )
    first_name = forms.CharField(
        max_length=30, widget=forms.TextInput(attrs={"class": "form-control"})
    )
    last_name = forms.CharField(
        max_length=30, widget=forms.TextInput(attrs={"class": "form-control"})
    )

    class Meta:
        model = User
        fields = [
            "username",
            "first_name",
            "last_name",
            "email",
            "password1",
            "password2",
        ]

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields["username"].widget.attrs.update({"class": "form-control"})
        self.fields["password1"].widget.attrs.update({"class": "form-control"})
        self.fields["password2"].widget.attrs.update({"class": "form-control"})


class TransactionForm(forms.ModelForm):
    class Meta:
        model = Transaction
        fields = [
            "amount",
            "date",
            "description",
            "category",
            "transaction_type",
            "receipt_notes",
        ]
        widgets = {
            "amount": forms.NumberInput(
                attrs={
                    "class": "form-control",
                    "step": "0.01",
                    "min": "0.01",
                    "placeholder": "0.00",
                }
            ),
            "date": forms.DateInput(attrs={"class": "form-control", "type": "date"}),
            "description": forms.TextInput(
                attrs={
                    "class": "form-control",
                    "placeholder": "e.g. Spotify subscription, Grocery run",
                }
            ),
            "category": forms.Select(attrs={"class": "form-select"}),
            "transaction_type": forms.Select(attrs={"class": "form-select"}),
            "receipt_notes": forms.Textarea(
                attrs={
                    "class": "form-control",
                    "rows": 2,
                    "placeholder": "Optional notes...",
                }
            ),
        }

    def __init__(self, *args, household=None, **kwargs):
        super().__init__(*args, **kwargs)
        if household:
            self.fields["category"].queryset = BudgetCategory.objects.filter(
                household=household
            )
        self.fields["category"].required = False
        self.fields["receipt_notes"].required = False


class QuickTransactionForm(forms.Form):
    """Simplified transaction form for quick entry."""

    amount = forms.DecimalField(
        max_digits=12,
        decimal_places=2,
        widget=forms.NumberInput(
            attrs={
                "class": "form-control form-control-lg",
                "step": "0.01",
                "placeholder": "Amount",
                "min": "0.01",
            }
        ),
    )
    description = forms.CharField(
        max_length=255,
        widget=forms.TextInput(
            attrs={
                "class": "form-control form-control-lg",
                "placeholder": "What was this for?",
            }
        ),
    )
    transaction_type = forms.ChoiceField(
        choices=Transaction.TRANSACTION_TYPES,
        initial="expense",
        widget=forms.Select(attrs={"class": "form-select form-select-lg"}),
    )


class BudgetCategoryForm(forms.ModelForm):
    class Meta:
        model = BudgetCategory
        fields = ["name", "bucket", "target_percentage", "keywords", "icon"]
        widgets = {
            "name": forms.TextInput(attrs={"class": "form-control"}),
            "bucket": forms.Select(attrs={"class": "form-select"}),
            "target_percentage": forms.NumberInput(
                attrs={
                    "class": "form-control",
                    "step": "0.01",
                    "min": "0",
                    "max": "100",
                }
            ),
            "keywords": forms.TextInput(
                attrs={"class": "form-control", "placeholder": "spotify,netflix,hulu"}
            ),
            "icon": forms.TextInput(
                attrs={"class": "form-control", "placeholder": "bi-house"}
            ),
        }
        help_texts = {
            "target_percentage": "This is a percentage of your household's total monthly income. The monthly cap is calculated automatically.",
        }


class DateRangeForm(forms.Form):
    """Simple form for date-range filtering on reports / exports."""

    start = forms.DateField(
        required=False,
        widget=forms.DateInput(attrs={"class": "form-control", "type": "date"}),
    )
    end = forms.DateField(
        required=False,
        widget=forms.DateInput(attrs={"class": "form-control", "type": "date"}),
    )


class SavingsGoalForm(forms.ModelForm):
    class Meta:
        model = SavingsGoal
        fields = [
            "name",
            "target_amount",
            "current_amount",
            "target_date",
            "linked_category",
        ]
        widgets = {
            "name": forms.TextInput(
                attrs={"class": "form-control", "placeholder": "e.g. Emergency Fund"}
            ),
            "target_amount": forms.NumberInput(
                attrs={"class": "form-control", "step": "0.01", "min": "0.01"}
            ),
            "current_amount": forms.NumberInput(
                attrs={"class": "form-control", "step": "0.01", "min": "0"}
            ),
            "target_date": forms.DateInput(
                attrs={"class": "form-control", "type": "date"}
            ),
            "linked_category": forms.Select(attrs={"class": "form-select"}),
        }

    def __init__(self, *args, household=None, **kwargs):
        super().__init__(*args, **kwargs)
        if household:
            self.fields["linked_category"].queryset = BudgetCategory.objects.filter(
                household=household, bucket="savings"
            )
        self.fields["linked_category"].required = False
        self.fields["target_date"].required = False


class RecurringTransactionForm(forms.ModelForm):
    class Meta:
        model = RecurringTransaction
        fields = [
            "description",
            "amount",
            "category",
            "transaction_type",
            "frequency",
            "next_date",
            "is_active",
        ]
        widgets = {
            "description": forms.TextInput(
                attrs={
                    "class": "form-control",
                    "placeholder": "e.g. Netflix, Rent, Salary",
                }
            ),
            "amount": forms.NumberInput(
                attrs={"class": "form-control", "step": "0.01", "min": "0.01"}
            ),
            "category": forms.Select(attrs={"class": "form-select"}),
            "transaction_type": forms.Select(attrs={"class": "form-select"}),
            "frequency": forms.Select(attrs={"class": "form-select"}),
            "next_date": forms.DateInput(
                attrs={"class": "form-control", "type": "date"}
            ),
            "is_active": forms.CheckboxInput(attrs={"class": "form-check-input"}),
        }

    def __init__(self, *args, household=None, **kwargs):
        super().__init__(*args, **kwargs)
        if household:
            self.fields["category"].queryset = BudgetCategory.objects.filter(
                household=household
            )
        self.fields["category"].required = False
