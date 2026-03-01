from django.db.models.signals import post_save
from django.dispatch import receiver
from django.contrib.auth.models import User
from .models import UserProfile, Transaction, MonthlySnapshot
import datetime


@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    """Auto-create UserProfile when a User is created."""
    if created:
        UserProfile.objects.get_or_create(user=instance)


@receiver(post_save, sender=Transaction)
def update_monthly_snapshot(sender, instance, **kwargs):
    """Auto-update MonthlySnapshot when a Transaction is saved."""
    if not instance.household:
        return

    month_start = instance.date.replace(day=1)

    snapshot, created = MonthlySnapshot.objects.get_or_create(
        household=instance.household, month=month_start
    )
    snapshot.recalculate()
    snapshot.save()
