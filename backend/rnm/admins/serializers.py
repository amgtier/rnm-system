from rest_framework import serializers
from rest_framework_jwt.settings import api_settings
from django.contrib.auth import authenticate, login
from django.contrib.auth.models import User
from records.models import EventType, Label
from .permissions import userRole

class UserSerializer(serializers.ModelSerializer):
    role = serializers.SerializerMethodField()

    def get_role(self, obj):
        return userRole(obj)

    class Meta:
        model = User
        fields = ('id', 'username', 'role')

class UserSerializerWithToken(serializers.ModelSerializer):
    token = serializers.SerializerMethodField()
    password = serializers.CharField(write_only=True)
    role = serializers.SerializerMethodField()

    def get_role(self, obj):
        return userRole(obj)

    def get_token(self, obj):
        jwt_payload_handler = api_settings.JWT_PAYLOAD_HANDLER
        jwt_encode_handler = api_settings.JWT_ENCODE_HANDLER
        payload = jwt_payload_handler(obj)
        token = jwt_encode_handler(payload)
        return token

    def create(self, validated_data):
        password = validated_data.pop('password', None)
        instance = self.Meta.model(**validated_data)
        if password is not None:
            instance.set_password(password)
        instance.save()
        return instance

    class Meta:
        model = User
        fields = ('id', 'token', 'username', 'password', 'role')

class EditUserSerializer(serializers.Serializer):
    uid = serializers.IntegerField()
    email = serializers.EmailField(required=False)
    role = serializers.ChoiceField(choices=('nobody', 'manager', 'reader', 'admin'), required=False)
    jid = serializers.ListField(required=False)
    city = serializers.ListField(required=False)
    township = serializers.ListField(required=False)
    village = serializers.ListField(required=False)

class ResetPasswordSerializer(serializers.Serializer):
    username = serializers.CharField()
    oldpassword = serializers.CharField(required=False)
    password = serializers.CharField()
    password2 = serializers.CharField()
    def validate_oldpassword(self, data):
        if authenticate(username=self.initial_data.get("username"), password=data) is None:
            raise serializers.ValidationError("old password incorrect")
        return data
    def validate_password2(self, data):
        if data != self.initial_data.get("password"):
            raise serializers.ValidationError("password2 incorrect")
        return data
    class Meta:
        model = User
        fields = ('username', 'password')

class ForgetPasswordSerializer(serializers.Serializer):
    email = serializers.EmailField()
    def validate_email(self, data):
        try:
            User.objects.get(email=data)
            return data
        except: raise serializers.ValidationError("email not found")

class LoginUserSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField(write_only=True)
    token = serializers.SerializerMethodField()
    role = serializers.SerializerMethodField()

    def get_role(self, obj):
        return userRole(obj)

    def get_token(self, obj):
        jwt_payload_handler = api_settings.JWT_PAYLOAD_HANDLER
        jwt_encode_handler = api_settings.JWT_ENCODE_HANDLER
        payload = jwt_payload_handler(obj)
        token = jwt_encode_handler(payload)
        return token
    
    def validate(self, data):
        user = authenticate(**data)
        if user is not None:
            return user
        raise serializers.ValidationError("Unable to log in with provided credentials.")

    class Meta:
        model = User
        fields = ('username', 'token', 'role')

class RegisterSerializer(serializers.ModelSerializer):
    def validate_email(self, data):
        try:
            User.objects.get(email=data)
        except:
            return data
        else: 
            raise serializers.ValidationError('Email exists.')

    class Meta:
        model = User
        fields = ('username', 'password', 'email')

class DeleteEventTypeSerializer(serializers.Serializer):
    id = serializers.IntegerField()

class DeleteLabelSerializer(serializers.Serializer):
    id = serializers.IntegerField()

class EventTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = EventType
        fields = ['name']

class LabelSerializer(serializers.ModelSerializer):
    class Meta:
        model = Label
        fields = ['name']