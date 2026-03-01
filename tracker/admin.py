from django.contrib import admin
from import_export.admin import ImportExportModelAdmin
from .models import (
    Household,
    UserProfile,
    BudgetCategory,
    Transaction,
    MonthlySnapshot,
    SavingsGoal,
    RecurringTransaction,
)


@admin.register(Household)
class HouseholdAdmin(admin.ModelAdmin):
    list_display = ["name", "member_count", "created_at"]
    search_fields = ["name"]

    def member_count(self, obj):
        return obj.members.count()

    member_count.short_description = "Members"


@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ["user", "household", "monthly_net_income", "currency"]
    list_filter = ["currency", "household"]
    search_fields = ["user__username", "user__first_name", "user__last_name"]


@admin.register(BudgetCategory)
class BudgetCategoryAdmin(admin.ModelAdmin):
    list_display = ["name", "household", "bucket", "target_percentage", "monthly_cap"]
    list_filter = ["bucket", "household"]
    search_fields = ["name"]


@admin.register(Transaction)
class TransactionAdmin(ImportExportModelAdmin):
    list_display = [
        "date",
        "description",
        "amount",
        "transaction_type",
        "category",
        "user",
        "household",
    ]
    list_filter = ["transaction_type", "category__bucket", "date", "household"]
    search_fields = ["description", "receipt_notes"]
    date_hierarchy = "date"
    ordering = ["-date"]


@admin.register(MonthlySnapshot)
class MonthlySnapshotAdmin(admin.ModelAdmin):
    list_display = [
        "household",
        "month",
        "total_income",
        "total_expenses",
        "health_score",
        "savings_rollover",
    ]
    list_filter = ["household", "month"]
    readonly_fields = [
        "total_income",
        "total_expenses",
        "fixed_spent",
        "investments_spent",
        "savings_spent",
        "guilt_free_spent",
        "fixed_target",
        "investments_target",
        "savings_target",
        "guilt_free_target",
        "health_score",
        "savings_rollover",
    ]


@admin.register(SavingsGoal)
class SavingsGoalAdmin(admin.ModelAdmin):
    list_display = [
        "name",
        "household",
        "current_amount",
        "target_amount",
        "target_date",
        "progress_percentage",
    ]
    list_filter = ["household", "target_date"]
    search_fields = ["name"]


@admin.register(RecurringTransaction)
class RecurringTransactionAdmin(admin.ModelAdmin):
    list_display = [
        "description",
        "amount",
        "frequency",
        "next_date",
        "is_active",
        "household",
        "user",
    ]
    list_filter = ["frequency", "is_active", "household", "transaction_type"]
    search_fields = ["description"]
