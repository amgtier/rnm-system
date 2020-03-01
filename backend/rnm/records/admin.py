from django.contrib import admin
from django.apps import apps
from .models import Record, Label, RecordExp

models = apps.get_models()
for model in models:
	try:
		class T(admin.ModelAdmin):
			list_display = [field.name for field in model._meta.fields] 
		admin.site.register(model, T)
	except: pass