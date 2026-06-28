from django.db import models
from django.contrib.auth.models import User

class Profile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    bio = models.TextField(blank=True, null=True)
    photo = models.ImageField(upload_to='profile_pics/', blank=True, null=True)
    tutor_subjects = models.JSONField(default=list, blank=True)
    learner_subjects = models.JSONField(default=list, blank=True)
    is_tutor = models.BooleanField(default=False)
    is_learner = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user.username} Profile"
