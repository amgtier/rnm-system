from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone
import uuid

def makeHash(l=20):
    hash = uuid.uuid1().hex
    return hash[:l]

class ManagerJurisdiction(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    city = models.CharField(default="", max_length=10)
    township = models.CharField(default="", max_length=10, blank=True)
    village = models.CharField(default="", max_length=10, blank=True)
    create_time = models.DateTimeField(default=timezone.now)

class ResetPassword(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    hash = models.CharField(max_length=20, default=makeHash, unique=True)
    create_time = models.DateTimeField(default=timezone.now)
