from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import User, Profile

@receiver(post_save, sender=User)
def create_or_update_user_extras(sender, instance, created, **kwargs):
    """
    This signal creates a profile and player ID for new users.
    Using get_or_create makes it safe to run multiple times.
    """
    if created:
        # Get the profile if it exists, or create it if it doesn't.
        Profile.objects.get_or_create(user=instance)
        
        # If the new user is a player, assign their unique player ID.
        if instance.role == 'player':
            instance.player_id = f"S3-{instance.id:04d}"
            instance.save()
