from django.contrib.auth.models import Group
from rest_framework import permissions
from records.constants import *

def is_in_group(user, group_name):
	try:
		return Group.objects.get(name=group_name).user_set.filter(id=user.id).exists()
	except Group.DoesNotExist:
		return None

class HasGroupPermission(permissions.BasePermission):
	def has_permission(self, request, view):
		required_groups_mapping = getattr(view, "required_groups", {})
		required_groups = required_groups_mapping.get(request.method, [])
		return all([is_in_group(request.user, group_name) if group_name != "__all__" else True for group_name in required_groups]) or\
			(request.user and request.user.is_staff)

def get_user_permission(user):
	if user.is_superuser:
		return 'admin'
	else:
		if 'manager' in [i.name for i in user.groups.all()]:
			return 'manager'
		elif 'reader' in [i.name for i in user.groups.all()]:
			return 'reader'
		else:
			return 'nobody'

def userRole(user):
	manager = Group.objects.get(name=MANAGER)
	reader = Group.objects.get(name=READER)
	### should in one and only one role though :P
	if user.is_superuser: return SUPERUSER
	elif manager in user.groups.all(): return MANAGER
	elif reader in user.groups.all(): return READER
	return NOBODY