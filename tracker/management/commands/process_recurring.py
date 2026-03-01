"""
Management command to process due recurring transactions.

Run daily via cron or scheduler:
    python manage.py process_recurring

This creates actual Transaction entries for any RecurringTransaction
whose next_date is today or earlier, then advances the schedule.
"""

import datetime
from django.core.management.base import BaseCommand
from tracker.models import RecurringTransaction


class Command(BaseCommand):
    help = "Process all due recurring transactions and create actual entries."

    def add_arguments(self, parser):
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Show what would be created without actually creating transactions.",
        )

    def handle(self, *args, **options):
        today = datetime.date.today()
        dry_run = options["dry_run"]

        due = RecurringTransaction.objects.filter(
            is_active=True,
            next_date__lte=today,
        ).select_related("household", "user", "category")

        count = 0
        for rt in due:
            # Process all missed dates (e.g. if server was down)
            while rt.next_date <= today:
                if dry_run:
                    self.stdout.write(
                        self.style.WARNING(
                            f"  [DRY RUN] Would create: {rt.description} "
                            f"({rt.amount}) for {rt.next_date}"
                        )
                    )
                    # Still advance to avoid infinite loop in dry run
                    rt._advance_next_date()
                else:
                    txn = rt.create_transaction()
                    self.stdout.write(
                        self.style.SUCCESS(
                            f"  Created: {txn.description} ({txn.amount}) on {txn.date}"
                        )
                    )
                count += 1

        verb = "would create" if dry_run else "created"
        self.stdout.write(
            self.style.SUCCESS(f"\nDone — {verb} {count} transaction(s).")
        )
