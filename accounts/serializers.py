from django.contrib.auth.models import User
from rest_framework import serializers

from .models import Agent, AgentRun, RestAPIKey
from .tool_utils import validate_tools_list


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ["username", "password"]

    def create(self, validated_data):
        return User.objects.create_user(**validated_data)


class UserAPIKeySerializer(serializers.Serializer):
    gemini_api_key = serializers.CharField(
        required=False,
        allow_blank=True,
        write_only=True,
        trim_whitespace=True,
    )
    serper_api_key = serializers.CharField(
        required=False,
        allow_blank=True,
        write_only=True,
        trim_whitespace=True,
    )
    github_token = serializers.CharField(
        required=False,
        allow_blank=True,
        write_only=True,
        trim_whitespace=True,
    )
    gemini_configured = serializers.BooleanField(read_only=True)
    gemini_key_hint = serializers.CharField(read_only=True)
    serper_configured = serializers.BooleanField(read_only=True)
    serper_key_hint = serializers.CharField(read_only=True)
    github_configured = serializers.BooleanField(read_only=True)
    github_status = serializers.CharField(read_only=True)
    github_key_hint = serializers.CharField(read_only=True)


class AgentSerializer(serializers.ModelSerializer):
    system_prompt = serializers.SerializerMethodField()

    class Meta:
        model = Agent
        fields = [
            "id",
            "name",
            "role",
            "backstory",
            "additional_context",
            "max_iterations",
            "forbidden_topics",
            "tools",
            "system_prompt",
            "created_at",
        ]
        read_only_fields = ["id", "system_prompt", "created_at"]
        extra_kwargs = {
            "role": {"required": True},
            "backstory": {"required": True},
        }

    def get_system_prompt(self, obj: Agent) -> str:
        return obj.build_system_prompt()

    def validate(self, attrs):
        legacy = self.initial_data.get("system_prompt")
        if legacy and not attrs.get("backstory"):
            attrs["backstory"] = str(legacy).strip()
            attrs.setdefault("role", "AI Assistant")
        return attrs

    def validate_max_iterations(self, value):
        if value < 1 or value > 20:
            raise serializers.ValidationError("max_iterations must be between 1 and 20.")
        return value

    def validate_tools(self, value):
        if value is None:
            return []
        try:
            return validate_tools_list(value)
        except ValueError as exc:
            raise serializers.ValidationError(str(exc)) from exc

    def create(self, validated_data):
        validated_data.setdefault("tools", [])
        return super().create(validated_data)


class RestAPIKeySerializer(serializers.ModelSerializer):
    class Meta:
        model = RestAPIKey
        fields = [
            "id",
            "name",
            "prefix",
            "is_active",
            "created_at",
            "last_used_at",
        ]
        read_only_fields = fields


class RestAPIKeyCreateSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=100, trim_whitespace=True)


class AgentRunSerializer(serializers.ModelSerializer):
    class Meta:
        model = AgentRun
        fields = [
            "id",
            "agent",
            "message",
            "status",
            "steps",
            "result",
            "error",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "agent",
            "message",
            "status",
            "steps",
            "result",
            "error",
            "created_at",
            "updated_at",
        ]
