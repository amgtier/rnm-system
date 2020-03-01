from rest_framework import serializers
from rest_framework_jwt.settings import api_settings
from .models import Record, UploadXlsxBuffer
from .utils import Cleaned

class UploadXlsxBufferSerializer(serializers.ModelSerializer):
    event_date = serializers.CharField(required=False)
    event_type = serializers.CharField(required=False)
    file = serializers.FileField()
    def create(self, data):
        return UploadXlsxBuffer.objects.create(file=data['file'])

    class Meta:
        model = UploadXlsxBuffer
        fields = ('file', 'event_date', 'event_type',)

class UploadRecordImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = Record
        fields = ('name', 'phone1', 'img',)
    
class AddRecordSerializer(serializers.ModelSerializer):
    gender = serializers.CharField()
    class Meta:
        model = Record
        fields = ('name', 'phone1', 'phone2', 'gender', 'connection', 
        'email', 'city', 'township', 'village', 'address', 
        'building', 'res_address', 'birthday', 'introducer_name',
        'introducer_phone', 'spouse_name', 'spouse_phone',
        'memo')

    def validate_gender(self, value):
        value = value.strip()
        if value[0].lower() == "m":
            return "m"
        elif value[0].lower() == "f":
            return "f"
        raise serializers.ValidationError("Unknown gender.")
    
class UpdateRecordSerializer(serializers.ModelSerializer):
    gender = serializers.CharField()
    class Meta:
        model = Record
        fields = ('phone1', 'phone2', 'gender', 'connection', 
        'email', 'city', 'township', 'village', 'address', 
        'building', 'res_address', 'birthday', 'introducer_name',
        'introducer_phone', 'spouse_name', 'spouse_phone',
        'memo', 'conflict')

    def validate_gender(self, value):
        value = value.strip()
        if value[0].lower() in ["m"]:
            return "m"
        elif value[0].lower() in ["f"]:
            return "f"
        elif value.find("undefined") != -1:
            return None
        raise serializers.ValidationError("Unknown gender.")

class UpdateGenderSerializer(serializers.ModelSerializer):
    gender = serializers.CharField()
    class Meta:
        model = Record
        fields = ('gender')

    def validate_gender(self, value):
        value = value.strip()
        if value[0].lower() in ["m"]:
            return "m"
        elif value[0].lower() in ["f"]:
            return "f"
        elif value.find("undefined") != -1:
            return None
        raise serializers.ValidationError("Unknown gender.")
