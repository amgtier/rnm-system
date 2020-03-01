from django.contrib import admin
from django.urls import path
import admins.views as views

urlpatterns = [
    path('current_user/', views.current_user, name="current_user"),
    path('users/', views.UserList.as_view(), name="users"),
    path('login/', views.LoginAPI.as_view(), name="login"),
    path('event_type/', views.EventTypeAPI.as_view(), name="event_type"),
    path('g/event_type/', views.eventTypes, name="g/event_type"),
    path('g/label/', views.labels, name="g/label"),
    path('label/', views.LabelAPI.as_view(), name="label"),
    path('register/', views.RegisterAPI.as_view(), name="register"),
    path('reset_password/', views.ResetPasswordAPI.as_view(), name="reset_password"),
    path('reset_password_hash/', views.ResetPasswordHashAPI.as_view(), name="reset_password_has"),
    path('forget_password/', views.ForgetPasswordAPI.as_view(), name="forget_password"),
]
