from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone
import uuid

def makeHash(l=10):
    hash = uuid.uuid1().hex
    return hash[:l]

GENDER = (('m', 'Male'), ('f', 'Female'))
class Record(models.Model):
    name             = models.CharField(max_length=20)
    gender           = models.CharField(max_length=6, choices=GENDER, blank=True, null=True)
    phone1           = models.CharField(max_length=10, blank=True, null=True)
    phone2           = models.CharField(max_length=10, blank=True, null=True)
    landline         = models.CharField(max_length=10, blank=True, null=True)
    connection       = models.CharField(max_length=10, blank=True, null=True)
    email            = models.EmailField(blank=True, null=True, max_length=100)
    city             = models.CharField(max_length=10, blank=True, null=True)
    township         = models.CharField(max_length=10, blank=True, null=True)
    village          = models.CharField(max_length=10, blank=True, null=True)
    address          = models.CharField(max_length=100, blank=True, null=True)
    building         = models.CharField(max_length=50, blank=True, null=True)
    res_address      = models.CharField(max_length=100, blank=True, null=True)
    birthday         = models.DateField(blank=True, null=True)
    introducer_name  = models.CharField(max_length=20, blank=True, null=True)
    introducer_phone = models.CharField(max_length=10, blank=True, null=True)
    introducer_link  = models.ForeignKey("Record", related_name="introducer", on_delete=models.SET_NULL, blank=True, null=True)
    spouse_name      = models.CharField(max_length=20, blank=True, null=True)
    spouse_phone     = models.CharField(max_length=10, blank=True, null=True)
    spouse_link      = models.ForeignKey("Record", related_name="spouse", on_delete=models.SET_NULL, blank=True, null=True)
    memo             = models.TextField(blank=True, null=True)
    conflict         = models.TextField(blank=True, null=True)
    img              = models.ImageField(upload_to="record_img", blank=True, null=True)
    created_by       = models.ForeignKey(User, on_delete=models.SET_NULL, blank=True, null=True)
    create_time      = models.DateTimeField(default=timezone.now)
    
    def __str__(self):
        return "{} {} {}".format(self.id, self.name, self.phone1)

class RecordLabel(models.Model):
    record      = models.ForeignKey("Record", on_delete=models.CASCADE)
    label       = models.ForeignKey("Label", on_delete=models.CASCADE)
    create_time = models.DateTimeField(default=timezone.now)
    class Meta:
        unique_together = ('record', 'label')

class RecordExp(models.Model):
    record      = models.ForeignKey("Record", on_delete=models.CASCADE)
    exp         = models.CharField(max_length=50)
    year        = models.PositiveSmallIntegerField(default=None, blank=True, null=True)
    create_time = models.DateTimeField(default=timezone.now)
    class Meta:
        unique_together = ('record', 'exp', 'year')

class RecordNetworking(models.Model):
    record       = models.ForeignKey("Record", on_delete=models.CASCADE, related_name="record")
    name         = models.CharField(max_length=20)
    phone        = models.CharField(max_length=10, blank=True, null=True)
    relationship = models.CharField(max_length=20, blank=True, null=True)
    link         = models.ForeignKey("Record", on_delete=models.SET_NULL, blank=True, null=True, related_name="link")
    create_time  = models.DateTimeField(default=timezone.now)
    class Meta:
        unique_together = ('record', 'link')

class Label(models.Model):
    name        = models.CharField(max_length=20)
    create_time = models.DateTimeField(default=timezone.now)
    
    def __str__(self):
        return self.name

class UploadXlsxBuffer(models.Model):
    file        = models.FileField(upload_to='buffered_xlsx')
    json        = models.TextField(blank=True, null=True)
    hash        = models.CharField(max_length=10, default=makeHash, unique=True)
    create_time = models.DateTimeField(default=timezone.now)

class EventType(models.Model):
    name        = models.CharField(max_length=20)
    create_time = models.DateTimeField(default=timezone.now)

class RecordEvent(models.Model):
    record      = models.ForeignKey("Record", on_delete=models.CASCADE)
    event_type  = models.ForeignKey("EventType", on_delete=models.SET_NULL, blank=True, null=True)
    event_date  = models.DateField(default=timezone.now)
    create_time = models.DateTimeField(default=timezone.now)
    class Meta:
        unique_together = ('record', 'event_type', 'event_date')
