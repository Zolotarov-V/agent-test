from django.db import models
from django.contrib.auth.models import User

class Agent(models.Model):
    owner = models.ForeignKey(User, on_delete=models.CASCADE)
    name = models.CharField(max_length=255)
    system_prompt = models.TextField()
    tools = models.JSONField(default=list)
    created_at = models.DateTimeField(auto_now_add=True)