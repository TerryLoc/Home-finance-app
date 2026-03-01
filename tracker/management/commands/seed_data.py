"""
Management command to populate demo data for testing.
Usage: python manage.py seed_data
"""

import random
import datetime
from decimal import Decimal

from django.core.management.base import BaseCommand
from django.contrib.auth.models import User

from tracker.models import (
    Household,
    UserProfile,
    BudgetCategory,
    Transaction,
    MonthlySnapshot,
    SavingsGoal,
)


class Command(BaseCommand):
    help = (
        "Seed database with demo household, users, categories, transactions, and goals"
    )

    def add_arguments(self, parser):
        parser.add_argument(
            "--clear",
            action="store_true",
            help="Clear all existing tracker data before seeding",
        )

    def handle(self, *args, **options):
        if options["clear"]:
            self.stdout.write("Clearing existing data...")
            Transaction.objects.all().delete()
            MonthlySnapshot.objects.all().delete()
            SavingsGoal.objects.all().delete()
            BudgetCategory.objects.all().delete()
            UserProfile.objects.all().delete()
            Household.objects.all().delete()
            User.objects.filter(is_superuser=False).delete()

        self.stdout.write("Creating demo household and users...")

        # ── Household ──
        household, _ = Household.objects.get_or_create(name="The Demo Family")

        # ── Users ──
        user1, created1 = User.objects.get_or_create(
            username="alex",
            defaults={
                "first_name": "Alex",
                "last_name": "Demo",
                "email": "alex@demo.com",
            },
        )
        if created1:
            user1.set_password("demo1234")
            user1.save()

        user2, created2 = User.objects.get_or_create(
            username="jordan",
            defaults={
                "first_name": "Jordan",
                "last_name": "Demo",
                "email": "jordan@demo.com",
            },
        )
        if created2:
            user2.set_password("demo1234")
            user2.save()

        # ── Profiles ──
        profile1, _ = UserProfile.objects.get_or_create(user=user1)
        profile1.household = household
        profile1.monthly_net_income = Decimal("5000.00")
        profile1.currency = "EUR"
        profile1.save()

        profile2, _ = UserProfile.objects.get_or_create(user=user2)
        profile2.household = household
        profile2.monthly_net_income = Decimal("4000.00")
        profile2.currency = "EUR"
        profile2.save()

        self.stdout.write(
            self.style.SUCCESS(f"  Household: {household.name} (ID: {household.pk})")
        )
        self.stdout.write(
            self.style.SUCCESS(
                f"  Users: alex/demo1234, jordan/demo1234  ($9,000/mo combined)"
            )
        )

        # ── Categories ──
        self.stdout.write("Creating budget categories...")
        categories_data = [
            ("Rent/Mortgage", "fixed", 25, "rent,mortgage,housing", "bi-house-fill"),
            (
                "Utilities",
                "fixed",
                8,
                "electric,gas,water,internet,phone",
                "bi-lightning-charge",
            ),
            (
                "Groceries",
                "fixed",
                10,
                "grocery,groceries,supermarket,aldi,walmart,tesco",
                "bi-cart",
            ),
            (
                "Subscriptions",
                "fixed",
                5,
                "spotify,netflix,hulu,disney,amazon prime,youtube",
                "bi-tv",
            ),
            (
                "Debt Payments",
                "fixed",
                7,
                "loan,credit card,debt,student loan",
                "bi-credit-card",
            ),
            (
                "Retirement",
                "investments",
                5,
                "retirement,401k,pension,super",
                "bi-graph-up-arrow",
            ),
            (
                "Brokerage",
                "investments",
                3,
                "vanguard,fidelity,schwab,index fund,etf",
                "bi-bar-chart",
            ),
            (
                "Real Estate",
                "investments",
                2,
                "real estate,reit,property investment",
                "bi-building",
            ),
            ("Emergency Fund", "savings", 5, "emergency,rainy day", "bi-shield-check"),
            (
                "Goal Savings",
                "savings",
                3,
                "savings,goal,down payment,holiday fund",
                "bi-piggy-bank",
            ),
            (
                "Dining Out",
                "guilt_free",
                8,
                "restaurant,dining,takeaway,uber eats,deliveroo,doordash",
                "bi-cup-hot",
            ),
            (
                "Travel",
                "guilt_free",
                5,
                "travel,flight,hotel,airbnb,vacation",
                "bi-airplane",
            ),
            (
                "Hobbies",
                "guilt_free",
                5,
                "hobby,gym,sport,game,book,cinema",
                "bi-controller",
            ),
            (
                "Fun Money",
                "guilt_free",
                9,
                "fun,entertainment,shopping,clothes,amazon",
                "bi-emoji-smile",
            ),
        ]

        cats = {}
        for name, bucket, pct, keywords, icon in categories_data:
            cat, _ = BudgetCategory.objects.get_or_create(
                household=household,
                name=name,
                defaults={
                    "bucket": bucket,
                    "target_percentage": pct,
                    "keywords": keywords,
                    "icon": icon,
                },
            )
            cats[name] = cat

        self.stdout.write(self.style.SUCCESS(f"  Created {len(cats)} categories"))

        # ── Transactions (last 6 months) ──
        self.stdout.write("Creating demo transactions...")
        today = datetime.date.today()
        txn_count = 0

        # Transaction templates (description, category_name, min_amount, max_amount)
        expense_templates = [
            ("Rent payment", "Rent/Mortgage", 2200, 2200),
            ("Electric bill", "Utilities", 80, 150),
            ("Gas bill", "Utilities", 40, 80),
            ("Internet bill", "Utilities", 60, 60),
            ("Phone bill", "Utilities", 45, 45),
            ("Walmart groceries", "Groceries", 80, 200),
            ("Aldi weekly shop", "Groceries", 50, 120),
            ("Grocery run", "Groceries", 30, 80),
            ("Spotify subscription", "Subscriptions", 11, 11),
            ("Netflix subscription", "Subscriptions", 15, 15),
            ("Disney+ subscription", "Subscriptions", 8, 8),
            ("Student loan payment", "Debt Payments", 350, 350),
            ("Credit card payment", "Debt Payments", 100, 300),
            ("401k contribution", "Retirement", 400, 400),
            ("Vanguard index fund", "Brokerage", 200, 300),
            ("REIT investment", "Real Estate", 150, 150),
            ("Emergency fund deposit", "Emergency Fund", 200, 400),
            ("Holiday fund", "Goal Savings", 100, 200),
            ("Restaurant dinner", "Dining Out", 40, 120),
            ("Uber Eats order", "Dining Out", 20, 50),
            ("Coffee shop", "Dining Out", 5, 12),
            ("Weekend brunch", "Dining Out", 30, 60),
            ("Gym membership", "Hobbies", 40, 40),
            ("Book purchase", "Hobbies", 10, 25),
            ("Cinema tickets", "Hobbies", 15, 30),
            ("Amazon shopping", "Fun Money", 20, 100),
            ("Clothes shopping", "Fun Money", 30, 150),
            ("Haircut", "Fun Money", 25, 50),
            ("Airbnb weekend trip", "Travel", 150, 400),
            ("Flight tickets", "Travel", 200, 500),
        ]

        users = [user1, user2]

        for months_ago in range(5, -1, -1):
            m = today.month - months_ago
            y = today.year
            while m <= 0:
                m += 12
                y -= 1
            month_date = datetime.date(y, m, 1)

            # Add salary income
            for u, salary in [(user1, 5000), (user2, 4000)]:
                Transaction.objects.get_or_create(
                    household=household,
                    user=u,
                    description=f'Salary - {month_date.strftime("%B")}',
                    date=month_date.replace(day=1),
                    defaults={
                        "amount": Decimal(str(salary)),
                        "transaction_type": "income",
                    },
                )
                txn_count += 1

            # Add expenses
            for desc, cat_name, min_amt, max_amt in expense_templates:
                # Not every expense happens every month
                if random.random() < 0.15 and cat_name not in (
                    "Rent/Mortgage",
                    "Subscriptions",
                    "Retirement",
                    "Debt Payments",
                ):
                    continue

                # Random day in month
                if m == today.month and y == today.year:
                    max_day = min(today.day, 28)
                else:
                    max_day = 28
                day = random.randint(1, max_day)
                txn_date = datetime.date(y, m, day)

                amount = Decimal(str(random.randint(min_amt, max_amt)))
                user = random.choice(users)

                Transaction.objects.create(
                    household=household,
                    user=user,
                    amount=amount,
                    date=txn_date,
                    description=desc,
                    category=cats.get(cat_name),
                    transaction_type="expense",
                )
                txn_count += 1

        self.stdout.write(self.style.SUCCESS(f"  Created {txn_count} transactions"))

        # ── Savings Goals ──
        self.stdout.write("Creating savings goals...")
        goals_data = [
            (
                "Emergency Fund",
                15000,
                8500,
                datetime.date(today.year + 1, 6, 1),
                "Emergency Fund",
            ),
            (
                "Down Payment",
                50000,
                12000,
                datetime.date(today.year + 2, 1, 1),
                "Goal Savings",
            ),
            (
                "Holiday to Japan",
                5000,
                2200,
                datetime.date(today.year, 12, 1),
                "Goal Savings",
            ),
        ]

        for name, target, current, target_date, cat_name in goals_data:
            SavingsGoal.objects.get_or_create(
                household=household,
                name=name,
                defaults={
                    "target_amount": Decimal(str(target)),
                    "current_amount": Decimal(str(current)),
                    "target_date": target_date,
                    "linked_category": cats.get(cat_name),
                },
            )

        self.stdout.write(
            self.style.SUCCESS(f"  Created {len(goals_data)} savings goals")
        )

        # ── Recalculate snapshots ──
        self.stdout.write("Recalculating monthly snapshots...")
        for months_ago in range(5, -1, -1):
            m = today.month - months_ago
            y = today.year
            while m <= 0:
                m += 12
                y -= 1
            month_date = datetime.date(y, m, 1)
            snapshot, _ = MonthlySnapshot.objects.get_or_create(
                household=household, month=month_date
            )
            snapshot.recalculate()
            snapshot.save()

        self.stdout.write("")
        self.stdout.write(self.style.SUCCESS("=" * 50))
        self.stdout.write(self.style.SUCCESS("Demo data seeded successfully!"))
        self.stdout.write(self.style.SUCCESS("=" * 50))
        self.stdout.write(f"  Login: alex / demo1234")
        self.stdout.write(f"  Login: jordan / demo1234")
        self.stdout.write(f"  Household ID: {household.pk}")
        self.stdout.write(f"  Admin: Create a superuser with manage.py createsuperuser")
