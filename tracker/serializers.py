from rest_framework import serializers
from .models import (
    Household,
    UserProfile,
    BudgetCategory,
    Transaction,
    MonthlySnapshot,
    SavingsGoal,
)


class HouseholdSerializer(serializers.ModelSerializer):
    class Meta:
        model = Household
        fields = ["id", "name", "created_at"]


class UserProfileSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source="user.username", read_only=True)
    full_name = serializers.CharField(source="user.get_full_name", read_only=True)

    class Meta:
        model = UserProfile
        fields = [
            "id",
            "username",
            "full_name",
            "monthly_net_income",
            "currency",
            "household",
        ]


class BudgetCategorySerializer(serializers.ModelSerializer):
    bucket_display = serializers.CharField(source="get_bucket_display", read_only=True)

    class Meta:
        model = BudgetCategory
        fields = [
            "id",
            "name",
            "bucket",
            "bucket_display",
            "target_percentage",
            "monthly_cap",
            "keywords",
            "icon",
        ]


class TransactionSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source="category.name", read_only=True)
    user_name = serializers.CharField(source="user.get_full_name", read_only=True)

    class Meta:
        model = Transaction
        fields = [
            "id",
            "amount",
            "date",
            "description",
            "category",
            "category_name",
            "transaction_type",
            "receipt_notes",
            "user",
            "user_name",
            "created_at",
        ]
        read_only_fields = ["user", "created_at"]


class MonthlySnapshotSerializer(serializers.ModelSerializer):
    fixed_pct = serializers.FloatField(read_only=True)
    investments_pct = serializers.FloatField(read_only=True)
    savings_pct = serializers.FloatField(read_only=True)
    guilt_free_pct = serializers.FloatField(read_only=True)

    class Meta:
        model = MonthlySnapshot
        fields = [
            "id",
            "month",
            "total_income",
            "total_expenses",
            "fixed_spent",
            "fixed_target",
            "fixed_pct",
            "investments_spent",
            "investments_target",
            "investments_pct",
            "savings_spent",
            "savings_target",
            "savings_pct",
            "guilt_free_spent",
            "guilt_free_target",
            "guilt_free_pct",
            "health_score",
            "savings_rollover",
        ]


class SavingsGoalSerializer(serializers.ModelSerializer):
    progress_percentage = serializers.FloatField(read_only=True)
    remaining = serializers.DecimalField(
        max_digits=12, decimal_places=2, read_only=True
    )
    projected_completion_date = serializers.DateField(read_only=True)
    on_track = serializers.BooleanField(read_only=True)

    class Meta:
        model = SavingsGoal
        fields = [
            "id",
            "name",
            "target_amount",
            "current_amount",
            "target_date",
            "linked_category",
            "progress_percentage",
            "remaining",
            "projected_completion_date",
            "on_track",
        ]
