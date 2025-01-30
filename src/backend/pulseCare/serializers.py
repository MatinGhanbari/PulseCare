from rest_framework import serializers
from .models import User, HeartRateData

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['username', 'password']
        extra_kwargs = {'password': {'write_only': True}}

    def create(self, validated_data):
        user = User.objects.create_user(**validated_data)
        return user

class HeartRateDataSerializer(serializers.ModelSerializer):
    class Meta:
        model = HeartRateData
        fields = ['heart_rate', 'timestamp']