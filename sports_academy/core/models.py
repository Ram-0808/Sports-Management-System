import uuid
from django.db import models
from django.contrib.auth.models import AbstractUser
from django.conf import settings
from django.db.models.signals import post_save
from django.dispatch import receiver

SPORT_CHOICES = [
    ('table_tennis','Table Tennis'),
    ('football','Football'),
    ('athletics','Athletics'),
    ('cricket','Cricket'),
    ('badminton','Badminton'),
    ('basketball','Basketball'),
    ('swimming','Swimming'),
    ('boxing','Boxing'),
    ('wrestling','Wrestling'),
    ('tennis','Tennis'),
    ('hockey','Hockey'),
    ('cycling','Cycling'),
]

ROLE_CHOICES = [
    ('management', 'Management'),
    ('coach', 'Coach'),
    ('player', 'Player'),
    ('parent', 'Parent'),
]

class User(AbstractUser):
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='player')
    photo = models.ImageField(upload_to='profiles/', null=True, blank=True)
    player_id = models.CharField(max_length=10, unique=True, blank=True, null=True, help_text="Unique ID for players")
    membership_start_date = models.DateField(null=True, blank=True)
    membership_end_date = models.DateField(null=True, blank=True)

class Academy(models.Model):
    name = models.CharField(max_length=200)
    location = models.CharField(max_length=200, blank=True)
    def __str__(self):
        return self.name

class Profile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    sport = models.CharField(max_length=50, choices=SPORT_CHOICES, null=True, blank=True)
    academy = models.ForeignKey(Academy, null=True, blank=True, on_delete=models.SET_NULL)
    study_details = models.TextField(blank=True)
    stats = models.JSONField(default=dict, blank=True)
    def __str__(self):
        return f"{self.user.username} profile"

class ParentChildLink(models.Model):
    parent = models.OneToOneField(User, on_delete=models.CASCADE, related_name='child_link', limit_choices_to={'role': 'parent'})
    child = models.OneToOneField(User, on_delete=models.CASCADE, related_name='parent_link', limit_choices_to={'role': 'player'})
    def __str__(self):
        return f"{self.parent.username} -> {self.child.username}"

class Task(models.Model):
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    assigned_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='assigned_tasks')
    created_at = models.DateTimeField(auto_now_add=True)
    due_date = models.DateField(null=True, blank=True)
    time_limit_minutes = models.PositiveIntegerField(null=True, blank=True, help_text="Time limit for the task in minutes")
    academy = models.ForeignKey(Academy, null=True, blank=True, on_delete=models.CASCADE)
    sport = models.CharField(max_length=50, choices=SPORT_CHOICES, null=True, blank=True)
    players = models.ManyToManyField(settings.AUTH_USER_MODEL, related_name='tasks', blank=True)
    def __str__(self):
        return self.title

class TaskCompletion(models.Model):
    task = models.ForeignKey(Task, on_delete=models.CASCADE, related_name='completions')
    player = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='completions')
    completed = models.BooleanField(default=False)
    started_at = models.DateTimeField(null=True, blank=True)
    time_taken_seconds = models.IntegerField(null=True, blank=True)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now=True)
    class Meta:
        unique_together = ('task','player')

@receiver(post_save, sender=User)
def create_user_profile_and_id(sender, instance, created, **kwargs):
    if created:
        Profile.objects.create(user=instance)
        if instance.role == 'player':
            instance.player_id = f"S3-{instance.id:04d}"
            instance.save()
