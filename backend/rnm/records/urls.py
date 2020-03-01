from django.contrib import admin
from django.urls import path
import records.views as views

urlpatterns = [
    path('read_xlsx/', views.ReadXlsxAPI.as_view()),
    path('export_xlsx/', views.ExportXlsxAPI.as_view()),
    path('confirm_import/', views.ConfirmImportAPI.as_view()),
    path('search/', views.SearchAPI.as_view()),
    path('record/add', views.AddRecordAPI.as_view()),
    path('record/update', views.UpdateRecordAPI.as_view()),
    path('record/save', views.SaveRecordChangesAPI.as_view()),
    path('record/remove', views.RemoveRecordAPI.as_view()),
    path('record/event', views.RecordEventAPI.as_view()),
    path('record/image', views.RecordImageAPI.as_view()),
    path('record/add-event', views.RecordAddEventAPI.as_view()),
]
