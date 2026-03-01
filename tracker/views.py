import csv
import datetime
from decimal import Decimal

from django.contrib.auth import login
from django.contrib.auth.mixins import LoginRequiredMixin
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from django.db.models import Sum, Q
from django.http import HttpResponse
from django.shortcuts import render, redirect, get_object_or_404
from django.utils import timezone
from django.views import View
from django.views.generic import (
    ListView,
    CreateView,
    UpdateView,
    DeleteView,
    TemplateView,
    DetailView,
)
from django.urls import reverse_lazy

from .models import (
    Household,
    UserProfile,
    BudgetCategory,
    Transaction,
    MonthlySnapshot,
    SavingsGoal,
    RecurringTransaction,
)
from .forms import (
    UserProfileForm,
    TransactionForm,
    QuickTransactionForm,
    BudgetCategoryForm,
    SavingsGoalForm,
    SignUpForm,
    HouseholdForm,
    RecurringTransactionForm,
)


# ─── Mixins ──────────────────────────────────────────────────────
class HouseholdMixin:
    """Mixin that provides household lookup + redirects if missing."""

    def get_household(self):
        try:
            return self.request.user.profile.household
        except (UserProfile.DoesNotExist, AttributeError):
            return None

    def require_household(self):
        household = self.get_household()
        if not household:
            messages.error(self.request, "Please set up your profile first.")
        return household


# Keep the standalone helper for function-based views
def get_household(user):
    try:
        return user.profile.household
    except (UserProfile.DoesNotExist, AttributeError):
        return None


def get_current_month():
    return datetime.date.today().replace(day=1)


# ─── Auth / Signup ───────────────────────────────────────────────
class SignUpView(View):
    def get(self, request):
        return render(
            request,
            "tracker/signup.html",
            {
                "form": SignUpForm(),
                "household_form": HouseholdForm(),
            },
        )

    def post(self, request):
        form = SignUpForm(request.POST)
        household_form = HouseholdForm(request.POST)

        if form.is_valid():
            user = form.save()
            # Handle household (create new or join by code)
            join_code = request.POST.get("join_household", "").strip()
            if join_code:
                try:
                    household = Household.objects.get(pk=int(join_code))
                except (Household.DoesNotExist, ValueError):
                    household = None
            elif household_form.is_valid():
                household = household_form.save()
            else:
                household = Household.objects.create(
                    name=f"{user.username}'s Household"
                )

            profile = user.profile
            profile.household = household
            profile.save()

            login(request, user)
            messages.success(request, "Welcome! Set up your income to get started.")
            return redirect("tracker:setup")

        return render(
            request,
            "tracker/signup.html",
            {
                "form": form,
                "household_form": household_form,
            },
        )


class SetupView(LoginRequiredMixin, View):
    """Initial setup — set income and create default categories."""

    def get(self, request):
        form = UserProfileForm(instance=request.user.profile)
        return render(request, "tracker/setup.html", {"form": form})

    def post(self, request):
        form = UserProfileForm(request.POST, instance=request.user.profile)
        if form.is_valid():
            profile = form.save(commit=False)
            # Auto-create a household if user doesn't have one
            if not profile.household:
                household = Household.objects.create(
                    name=f"{request.user.get_full_name() or request.user.username}'s Household"
                )
                profile.household = household
            profile.save()
            household = profile.household
            if not household.categories.exists():
                self._create_default_categories(household)
            messages.success(request, "Profile updated!")
            return redirect("tracker:dashboard")
        return render(request, "tracker/setup.html", {"form": form})

    def _create_default_categories(self, household):
        """Seed default budget categories."""
        defaults = [
            ("Rent/Mortgage", "fixed", 25, "rent,mortgage,housing"),
            ("Utilities", "fixed", 8, "electric,gas,water,internet,phone"),
            (
                "Groceries",
                "fixed",
                10,
                "grocery,groceries,supermarket,aldi,tesco,walmart",
            ),
            (
                "Subscriptions",
                "fixed",
                5,
                "spotify,netflix,hulu,disney,amazon prime,youtube",
            ),
            ("Debt Payments", "fixed", 7, "loan,credit card,debt,student loan"),
            ("Retirement", "investments", 5, "retirement,401k,pension,superannuation"),
            ("Brokerage", "investments", 3, "vanguard,fidelity,schwab,index fund,etf"),
            ("Real Estate", "investments", 2, "real estate,reit,property investment"),
            ("Emergency Fund", "savings", 5, "emergency,rainy day"),
            ("Goal Savings", "savings", 3, "savings,goal,down payment,holiday fund"),
            (
                "Dining Out",
                "guilt_free",
                8,
                "restaurant,dining,takeaway,uber eats,deliveroo",
            ),
            ("Travel", "guilt_free", 5, "travel,flight,hotel,airbnb,vacation"),
            ("Hobbies", "guilt_free", 5, "hobby,gym,sport,game,book"),
            ("Fun Money", "guilt_free", 9, "fun,entertainment,shopping,clothes"),
        ]
        for name, bucket, pct, keywords in defaults:
            BudgetCategory.objects.create(
                household=household,
                name=name,
                bucket=bucket,
                target_percentage=pct,
                keywords=keywords,
            )


# ─── Dashboard ───────────────────────────────────────────────────
class DashboardView(LoginRequiredMixin, HouseholdMixin, TemplateView):
    template_name = "tracker/dashboard.html"

    def _get_greeting(self):
        hour = datetime.datetime.now().hour
        name = self.request.user.first_name or self.request.user.username
        if hour < 12:
            return f"Good morning, {name}"
        elif hour < 17:
            return f"Good afternoon, {name}"
        return f"Good evening, {name}"

    def _get_insights(self, snapshot, household_income, buckets):
        """Generate smart human-readable insights."""
        insights = []
        if snapshot.total_expenses == 0:
            insights.append(
                {
                    "icon": "bi-lightbulb",
                    "color": "info",
                    "text": "No spending logged yet this month — add your first transaction!",
                }
            )
            return insights

        # Savings rate
        if household_income and household_income > 0:
            savings_rate = (
                (household_income - snapshot.total_expenses) / household_income
            ) * 100
            if savings_rate >= 20:
                insights.append(
                    {
                        "icon": "bi-trophy",
                        "color": "success",
                        "text": f"You're saving {savings_rate:.0f}% of your income this month. Brilliant!",
                    }
                )
            elif savings_rate >= 0:
                insights.append(
                    {
                        "icon": "bi-info-circle",
                        "color": "primary",
                        "text": f"Savings rate is {savings_rate:.0f}% — aim for 20%+ to build wealth.",
                    }
                )
            else:
                insights.append(
                    {
                        "icon": "bi-exclamation-triangle",
                        "color": "danger",
                        "text": f"You've overspent by {abs(savings_rate):.0f}% of income. Time to review.",
                    }
                )

        # Check for overspent buckets
        for b in buckets:
            if b["pct_spent"] > 100:
                insights.append(
                    {
                        "icon": "bi-exclamation-circle",
                        "color": "warning",
                        "text": f"{b['label']} is {b['pct_spent']:.0f}% spent — over budget by {b['spent'] - b['target']:.0f}.",
                    }
                )

        # Upcoming recurring transactions
        upcoming = RecurringTransaction.objects.filter(
            household=self.get_household(),
            is_active=True,
            next_date__lte=datetime.date.today() + datetime.timedelta(days=7),
        ).count()
        if upcoming:
            insights.append(
                {
                    "icon": "bi-arrow-repeat",
                    "color": "info",
                    "text": f"{upcoming} recurring transaction{'s' if upcoming != 1 else ''} due in the next 7 days.",
                }
            )

        return insights[:4]  # Cap at 4 insights

    def get_context_data(self, **kwargs):
        ctx = super().get_context_data(**kwargs)
        household = self.get_household()
        if not household:
            ctx["no_household"] = True
            return ctx

        today = datetime.date.today()
        month_start = today.replace(day=1)

        # Get or create snapshot
        snapshot, _ = MonthlySnapshot.objects.get_or_create(
            household=household, month=month_start
        )
        snapshot.recalculate()
        snapshot.save()

        # Household income — use actual income from transactions this month
        household_income = snapshot.total_income

        # Budget data for charts
        buckets = []
        for key, label in BudgetCategory.BUCKET_CHOICES:
            spent = getattr(snapshot, f"{key}_spent", 0)
            target = getattr(snapshot, f"{key}_target", 0)
            pct_spent = round((float(spent) / float(target) * 100), 1) if target else 0
            if pct_spent <= 80:
                status = "success"
            elif pct_spent <= 100:
                status = "warning"
            else:
                status = "danger"
            buckets.append(
                {
                    "key": key,
                    "label": label,
                    "spent": spent,
                    "target": target,
                    "pct_spent": pct_spent,
                    "remaining": max(Decimal("0"), target - spent),
                    "status": status,
                }
            )

        # Recent transactions
        recent_txns = Transaction.objects.filter(
            household=household, date__gte=month_start
        ).select_related("category", "user")[:10]

        # Monthly trend (last 6 months)
        trend_data = []
        for i in range(5, -1, -1):
            m = today.month - i
            y = today.year
            while m <= 0:
                m += 12
                y -= 1
            m_date = datetime.date(y, m, 1)
            snap = MonthlySnapshot.objects.filter(
                household=household, month=m_date
            ).first()
            trend_data.append(
                {
                    "label": m_date.strftime("%b %Y"),
                    "income": float(snap.total_income) if snap else 0,
                    "expenses": float(snap.total_expenses) if snap else 0,
                    "health": snap.health_score if snap else 0,
                }
            )

        # Savings goals
        goals = SavingsGoal.objects.filter(household=household)

        # Quick form
        quick_form = QuickTransactionForm()

        # Days remaining in month
        if month_start.month == 12:
            next_month = month_start.replace(year=month_start.year + 1, month=1)
        else:
            next_month = month_start.replace(month=month_start.month + 1)
        days_remaining = (next_month - today).days

        # Smart insights
        insights = self._get_insights(snapshot, household_income, buckets)

        ctx.update(
            {
                "greeting": self._get_greeting(),
                "household": household,
                "snapshot": snapshot,
                "household_income": household_income,
                "buckets": buckets,
                "recent_txns": recent_txns,
                "trend_data": trend_data,
                "goals": goals,
                "quick_form": quick_form,
                "today": today,
                "days_remaining": days_remaining,
                "insights": insights,
            }
        )
        return ctx


class QuickTransactionView(LoginRequiredMixin, View):
    """Handle quick transaction form from dashboard."""

    def post(self, request):
        household = get_household(request.user)
        if not household:
            messages.error(request, "Please set up your profile first.")
            return redirect("tracker:setup")
        form = QuickTransactionForm(request.POST)
        if form.is_valid():
            txn = Transaction(
                household=household,
                user=request.user,
                amount=form.cleaned_data["amount"],
                description=form.cleaned_data["description"],
                transaction_type=form.cleaned_data["transaction_type"],
                date=datetime.date.today(),
            )
            txn.save()  # auto-tags category in model save
            messages.success(request, f"Transaction added: {txn.description}")
        else:
            messages.error(request, "Could not add transaction. Check the form.")
        return redirect("tracker:dashboard")


# ─── Transactions ────────────────────────────────────────────────
class TransactionListView(LoginRequiredMixin, ListView):
    model = Transaction
    template_name = "tracker/transactions.html"
    context_object_name = "transactions"
    paginate_by = 25

    def get_queryset(self):
        household = get_household(self.request.user)
        if not household:
            return Transaction.objects.none()

        qs = Transaction.objects.filter(household=household).select_related(
            "category", "user"
        )

        # Filter by type
        txn_type = self.request.GET.get("type")
        if txn_type in ("income", "expense"):
            qs = qs.filter(transaction_type=txn_type)

        # Filter by bucket
        bucket = self.request.GET.get("bucket")
        if bucket:
            qs = qs.filter(category__bucket=bucket)

        # Filter by search
        search = self.request.GET.get("q")
        if search:
            qs = qs.filter(
                Q(description__icontains=search) | Q(receipt_notes__icontains=search)
            )

        # Filter by date range
        start = self.request.GET.get("start")
        end = self.request.GET.get("end")
        if start:
            qs = qs.filter(date__gte=start)
        if end:
            qs = qs.filter(date__lte=end)

        return qs

    def get_context_data(self, **kwargs):
        ctx = super().get_context_data(**kwargs)
        household = get_household(self.request.user)
        ctx["form"] = TransactionForm(household=household)
        ctx["household"] = household
        ctx["bucket_choices"] = BudgetCategory.BUCKET_CHOICES
        ctx["current_filters"] = {
            "type": self.request.GET.get("type", ""),
            "bucket": self.request.GET.get("bucket", ""),
            "q": self.request.GET.get("q", ""),
            "start": self.request.GET.get("start", ""),
            "end": self.request.GET.get("end", ""),
        }
        return ctx


class TransactionCreateView(LoginRequiredMixin, View):
    def post(self, request):
        household = get_household(request.user)
        if not household:
            messages.error(request, "Please set up your profile first.")
            return redirect("tracker:setup")
        form = TransactionForm(request.POST, household=household)
        if form.is_valid():
            txn = form.save(commit=False)
            txn.household = household
            txn.user = request.user
            txn.save()
            messages.success(request, f'Transaction "{txn.description}" added.')
        else:
            messages.error(request, "Could not save transaction. Check the form.")
        return redirect("tracker:transactions")


class TransactionUpdateView(LoginRequiredMixin, UpdateView):
    model = Transaction
    template_name = "tracker/transaction_edit.html"
    fields = [
        "amount",
        "date",
        "description",
        "category",
        "transaction_type",
        "receipt_notes",
    ]
    success_url = reverse_lazy("tracker:transactions")

    def get_queryset(self):
        household = get_household(self.request.user)
        return Transaction.objects.filter(household=household)

    def form_valid(self, form):
        messages.success(self.request, "Transaction updated.")
        return super().form_valid(form)


class TransactionDeleteView(LoginRequiredMixin, DeleteView):
    model = Transaction
    success_url = reverse_lazy("tracker:transactions")

    def get_queryset(self):
        household = get_household(self.request.user)
        return Transaction.objects.filter(household=household)

    def form_valid(self, form):
        messages.success(self.request, "Transaction deleted.")
        return super().form_valid(form)


# ─── Budget Categories ───────────────────────────────────────────
class CategoryListView(LoginRequiredMixin, ListView):
    model = BudgetCategory
    template_name = "tracker/categories.html"
    context_object_name = "categories"

    def get_queryset(self):
        household = get_household(self.request.user)
        if not household:
            return BudgetCategory.objects.none()
        return BudgetCategory.objects.filter(household=household)

    def get_context_data(self, **kwargs):
        ctx = super().get_context_data(**kwargs)
        household = get_household(self.request.user)
        ctx["form"] = BudgetCategoryForm()
        ctx["household"] = household
        if household:
            valid, msg = BudgetCategory.validate_household_allocations(household)
            ctx["allocation_valid"] = valid
            ctx["allocation_message"] = msg
        return ctx


class CategoryCreateView(LoginRequiredMixin, View):
    def post(self, request):
        household = get_household(request.user)
        form = BudgetCategoryForm(request.POST)
        if form.is_valid() and household:
            cat = form.save(commit=False)
            cat.household = household
            cat.save()
            messages.success(request, f'Category "{cat.name}" created.')
        else:
            messages.error(request, "Could not create category.")
        return redirect("tracker:categories")


class CategoryUpdateView(LoginRequiredMixin, UpdateView):
    model = BudgetCategory
    form_class = BudgetCategoryForm
    template_name = "tracker/category_edit.html"
    success_url = reverse_lazy("tracker:categories")

    def get_queryset(self):
        household = get_household(self.request.user)
        return BudgetCategory.objects.filter(household=household)


class CategoryDeleteView(LoginRequiredMixin, DeleteView):
    model = BudgetCategory
    success_url = reverse_lazy("tracker:categories")

    def get_queryset(self):
        household = get_household(self.request.user)
        return BudgetCategory.objects.filter(household=household)


# ─── Savings Goals ───────────────────────────────────────────────
class GoalListView(LoginRequiredMixin, ListView):
    model = SavingsGoal
    template_name = "tracker/goals.html"
    context_object_name = "goals"

    def get_queryset(self):
        household = get_household(self.request.user)
        if not household:
            return SavingsGoal.objects.none()
        return SavingsGoal.objects.filter(household=household)

    def get_context_data(self, **kwargs):
        ctx = super().get_context_data(**kwargs)
        household = get_household(self.request.user)
        ctx["form"] = SavingsGoalForm(household=household)
        ctx["household"] = household
        return ctx


class GoalCreateView(LoginRequiredMixin, View):
    def post(self, request):
        household = get_household(request.user)
        form = SavingsGoalForm(request.POST, household=household)
        if form.is_valid() and household:
            goal = form.save(commit=False)
            goal.household = household
            goal.save()
            messages.success(request, f'Goal "{goal.name}" created.')
        else:
            messages.error(request, "Could not create goal.")
        return redirect("tracker:goals")


class GoalUpdateView(LoginRequiredMixin, UpdateView):
    model = SavingsGoal
    form_class = SavingsGoalForm
    template_name = "tracker/goal_edit.html"
    success_url = reverse_lazy("tracker:goals")

    def get_queryset(self):
        household = get_household(self.request.user)
        return SavingsGoal.objects.filter(household=household)

    def get_form_kwargs(self):
        kwargs = super().get_form_kwargs()
        kwargs["household"] = get_household(self.request.user)
        return kwargs


class GoalDeleteView(LoginRequiredMixin, DeleteView):
    model = SavingsGoal
    success_url = reverse_lazy("tracker:goals")

    def get_queryset(self):
        household = get_household(self.request.user)
        return SavingsGoal.objects.filter(household=household)


# ─── Reports ─────────────────────────────────────────────────────
class ReportsView(LoginRequiredMixin, TemplateView):
    template_name = "tracker/reports.html"

    def get_context_data(self, **kwargs):
        ctx = super().get_context_data(**kwargs)
        household = get_household(self.request.user)
        if not household:
            return ctx

        today = datetime.date.today()
        year_start = today.replace(month=1, day=1)

        # Monthly snapshots for the year
        snapshots = MonthlySnapshot.objects.filter(
            household=household, month__gte=year_start
        ).order_by("month")

        # YTD totals
        ytd_income = sum(s.total_income for s in snapshots)
        ytd_expenses = sum(s.total_expenses for s in snapshots)
        ytd_fixed = sum(s.fixed_spent for s in snapshots)
        ytd_investments = sum(s.investments_spent for s in snapshots)
        ytd_savings = sum(s.savings_spent for s in snapshots)
        ytd_guilt_free = sum(s.guilt_free_spent for s in snapshots)

        # Average health score
        health_scores = [s.health_score for s in snapshots if s.health_score > 0]
        avg_health = (
            round(sum(health_scores) / len(health_scores)) if health_scores else 0
        )

        # Chart data
        monthly_labels = [s.month.strftime("%b") for s in snapshots]
        monthly_income = [float(s.total_income) for s in snapshots]
        monthly_expenses = [float(s.total_expenses) for s in snapshots]
        monthly_health = [s.health_score for s in snapshots]

        ctx.update(
            {
                "household": household,
                "snapshots": snapshots,
                "ytd_income": ytd_income,
                "ytd_expenses": ytd_expenses,
                "ytd_net": ytd_income - ytd_expenses,
                "ytd_fixed": ytd_fixed,
                "ytd_investments": ytd_investments,
                "ytd_savings": ytd_savings,
                "ytd_guilt_free": ytd_guilt_free,
                "avg_health": avg_health,
                "monthly_labels": monthly_labels,
                "monthly_income": monthly_income,
                "monthly_expenses": monthly_expenses,
                "monthly_health": monthly_health,
                "year": today.year,
            }
        )
        return ctx


@login_required
def export_transactions_csv(request):
    """Export transactions to CSV."""
    household = get_household(request.user)
    if not household:
        return HttpResponse("No household found", status=400)

    start = request.GET.get("start")
    end = request.GET.get("end")

    txns = Transaction.objects.filter(household=household).select_related(
        "category", "user"
    )
    if start:
        txns = txns.filter(date__gte=start)
    if end:
        txns = txns.filter(date__lte=end)

    response = HttpResponse(content_type="text/csv")
    response["Content-Disposition"] = (
        f'attachment; filename="transactions_{datetime.date.today()}.csv"'
    )

    writer = csv.writer(response)
    writer.writerow(
        ["Date", "Description", "Amount", "Type", "Category", "Bucket", "User", "Notes"]
    )

    for t in txns:
        writer.writerow(
            [
                t.date,
                t.description,
                t.amount,
                t.transaction_type,
                t.category.name if t.category else "",
                t.category.get_bucket_display() if t.category else "",
                t.user.get_full_name() or t.user.username,
                t.receipt_notes,
            ]
        )

    return response


# ─── Recurring Transactions ──────────────────────────────────────
class RecurringListView(LoginRequiredMixin, HouseholdMixin, ListView):
    model = RecurringTransaction
    template_name = "tracker/recurring.html"
    context_object_name = "recurring_transactions"

    def get_queryset(self):
        household = self.get_household()
        if not household:
            return RecurringTransaction.objects.none()
        return RecurringTransaction.objects.filter(household=household).select_related(
            "category", "user"
        )

    def get_context_data(self, **kwargs):
        ctx = super().get_context_data(**kwargs)
        household = self.get_household()
        ctx["form"] = RecurringTransactionForm(household=household)
        ctx["household"] = household
        return ctx


class RecurringCreateView(LoginRequiredMixin, HouseholdMixin, View):
    def post(self, request):
        household = self.require_household()
        if not household:
            return redirect("tracker:setup")
        form = RecurringTransactionForm(request.POST, household=household)
        if form.is_valid():
            obj = form.save(commit=False)
            obj.household = household
            obj.user = request.user
            obj.save()
            messages.success(request, f'Recurring "{obj.description}" created.')
        else:
            messages.error(request, "Could not create recurring transaction.")
        return redirect("tracker:recurring")


class RecurringUpdateView(LoginRequiredMixin, HouseholdMixin, UpdateView):
    model = RecurringTransaction
    form_class = RecurringTransactionForm
    template_name = "tracker/recurring_edit.html"
    success_url = reverse_lazy("tracker:recurring")

    def get_queryset(self):
        household = self.get_household()
        return RecurringTransaction.objects.filter(household=household)

    def get_form_kwargs(self):
        kwargs = super().get_form_kwargs()
        kwargs["household"] = self.get_household()
        return kwargs

    def form_valid(self, form):
        messages.success(self.request, "Recurring transaction updated.")
        return super().form_valid(form)


class RecurringDeleteView(LoginRequiredMixin, HouseholdMixin, DeleteView):
    model = RecurringTransaction
    success_url = reverse_lazy("tracker:recurring")

    def get_queryset(self):
        household = self.get_household()
        return RecurringTransaction.objects.filter(household=household)

    def form_valid(self, form):
        messages.success(self.request, "Recurring transaction deleted.")
        return super().form_valid(form)


# ─── Profile / Settings ─────────────────────────────────────────
class ProfileView(LoginRequiredMixin, View):
    def get(self, request):
        form = UserProfileForm(instance=request.user.profile)
        household = get_household(request.user)
        members = household.members.select_related("user").all() if household else []
        return render(
            request,
            "tracker/profile.html",
            {
                "form": form,
                "household": household,
                "members": members,
            },
        )

    def post(self, request):
        form = UserProfileForm(request.POST, instance=request.user.profile)
        if form.is_valid():
            form.save()
            # Recalculate category caps
            household = get_household(request.user)
            if household:
                for cat in household.categories.all():
                    cat.save()  # triggers cap recalculation
            messages.success(request, "Profile updated.")
            return redirect("tracker:profile")
        household = get_household(request.user)
        members = household.members.select_related("user").all() if household else []
        return render(
            request,
            "tracker/profile.html",
            {
                "form": form,
                "household": household,
                "members": members,
            },
        )
