# serializers.py
from rest_framework import serializers

class BandwidthReportRequestSerializer(serializers.Serializer):
    message = serializers.CharField(max_length=500)  # Adjust max_length as needed
