from rest_framework import serializers

class ChatbotInputSerializer(serializers.Serializer):
    input_text = serializers.CharField(max_length=255)