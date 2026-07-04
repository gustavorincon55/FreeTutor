from django.db import models
from django.contrib.auth.models import User

class Profile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    bio = models.TextField(blank=True, null=True)
    photo = models.TextField(blank=True, null=True)  # base64 data URL
    tutor_subjects = models.JSONField(default=list, blank=True)
    learner_subjects = models.JSONField(default=list, blank=True)
    is_tutor = models.BooleanField(default=False)
    is_learner = models.BooleanField(default=False)
    timezone = models.CharField(max_length=100, default='UTC')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user.username} Profile"


class Availability(models.Model):
    ROLE_CHOICES = [('tutor', 'Tutor'), ('learner', 'Learner')]
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='availabilities')
    role = models.CharField(max_length=10, choices=ROLE_CHOICES)
    topic = models.CharField(max_length=200)
    time_windows = models.JSONField(default=list)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user.username} ({self.role}) — {self.topic}"


class Post(models.Model):
    TYPE_CHOICES = [('offer', 'Offer'), ('request', 'Request')]
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='posts')
    type = models.CharField(max_length=10, choices=TYPE_CHOICES)
    topic = models.CharField(max_length=200)
    notes = models.TextField(blank=True, default='')
    time_slots = models.JSONField(default=list, blank=True)  # [{day, start, end}]
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.user.username} {self.type}: {self.topic}"


class Session(models.Model):
    STATUS_CHOICES = [
        ('open', 'Open'),                        # learner request waiting for a tutor to accept
        ('pending_tutor', 'Pending Tutor'),      # learner connected to offer, tutor must confirm
        ('pending_learner', 'Pending Learner'),  # tutor accepted a request, learner must confirm
        ('confirmed', 'Confirmed'),
        ('cancelled', 'Cancelled'),
    ]
    # tutor is null until a tutor accepts an open request
    tutor = models.ForeignKey(
        User, on_delete=models.SET_NULL,
        null=True, blank=True, related_name='tutor_sessions'
    )
    learner = models.ForeignKey(User, on_delete=models.CASCADE, related_name='learner_sessions')
    topic = models.CharField(max_length=200)
    day = models.CharField(max_length=20)
    start_time = models.TimeField()
    end_time = models.TimeField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='open')
    post = models.ForeignKey(
        'Post', on_delete=models.SET_NULL,
        null=True, blank=True, related_name='sessions'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        tutor_name = self.tutor.username if self.tutor else '(open)'
        return f"{tutor_name} → {self.learner.username}: {self.topic} ({self.day})"
