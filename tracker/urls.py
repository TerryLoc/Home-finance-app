from django.urls import path
from . import views

app_name = "tracker"

urlpatterns = [
    # Dashboard
    path("", views.DashboardView.as_view(), name="dashboard"),
    # Auth
    path("signup/", views.SignUpView.as_view(), name="signup"),
    path("setup/", views.SetupView.as_view(), name="setup"),
    path("profile/", views.ProfileView.as_view(), name="profile"),
    # Transactions
    path("transactions/", views.TransactionListView.as_view(), name="transactions"),
    path(
        "transactions/add/",
        views.TransactionCreateView.as_view(),
        name="transaction_add",
    ),
    path(
        "transactions/<int:pk>/edit/",
        views.TransactionUpdateView.as_view(),
        name="transaction_edit",
    ),
    path(
        "transactions/<int:pk>/delete/",
        views.TransactionDeleteView.as_view(),
        name="transaction_delete",
    ),
    path(
        "transactions/quick/",
        views.QuickTransactionView.as_view(),
        name="quick_transaction",
    ),
    # Categories
    path("categories/", views.CategoryListView.as_view(), name="categories"),
    path("categories/add/", views.CategoryCreateView.as_view(), name="category_add"),
    path(
        "categories/<int:pk>/edit/",
        views.CategoryUpdateView.as_view(),
        name="category_edit",
    ),
    path(
        "categories/<int:pk>/delete/",
        views.CategoryDeleteView.as_view(),
        name="category_delete",
    ),
    # Savings Goals
    path("goals/", views.GoalListView.as_view(), name="goals"),
    path("goals/add/", views.GoalCreateView.as_view(), name="goal_add"),
    path("goals/<int:pk>/edit/", views.GoalUpdateView.as_view(), name="goal_edit"),
    path("goals/<int:pk>/delete/", views.GoalDeleteView.as_view(), name="goal_delete"),
    # Recurring Transactions
    path("recurring/", views.RecurringListView.as_view(), name="recurring"),
    path(
        "recurring/add/",
        views.RecurringCreateView.as_view(),
        name="recurring_add",
    ),
    path(
        "recurring/<int:pk>/edit/",
        views.RecurringUpdateView.as_view(),
        name="recurring_edit",
    ),
    path(
        "recurring/<int:pk>/delete/",
        views.RecurringDeleteView.as_view(),
        name="recurring_delete",
    ),
    # Reports
    path("reports/", views.ReportsView.as_view(), name="reports"),
    path("reports/export/", views.export_transactions_csv, name="export_csv"),
]
