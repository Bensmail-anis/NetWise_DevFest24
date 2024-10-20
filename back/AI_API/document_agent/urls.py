# urls.py
from django.urls import path
from .views import BandwidthReportView

urlpatterns = [
    path('download-report/', BandwidthReportView.as_view(), name='download_report'),
]
