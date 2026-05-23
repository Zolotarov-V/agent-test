from django.db import models
from django.contrib.auth.models import User

from .encryption import decrypt_value, encrypt_value
from .persona import build_system_prompt


class UserAPIKey(models.Model):
    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name="api_keys",
    )
    gemini_api_key_encrypted = models.TextField(blank=True, default="")
    serper_api_key_encrypted = models.TextField(blank=True, default="")
    github_token_encrypted = models.TextField(blank=True, default="")
    github_token_valid = models.BooleanField(null=True, blank=True)
    approval_allowlist = models.JSONField(default=list, blank=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "User API key"
        verbose_name_plural = "User API keys"

    def set_gemini_key(self, raw_key: str | None) -> None:
        key = (raw_key or "").strip()
        self.gemini_api_key_encrypted = encrypt_value(key) if key else ""

    def get_gemini_key(self) -> str:
        if not self.gemini_api_key_encrypted:
            return ""
        return decrypt_value(self.gemini_api_key_encrypted)

    def gemini_key_hint(self) -> str:
        key = self.get_gemini_key()
        if len(key) <= 8:
            return "••••••••" if key else ""
        return f"{key[:4]}…{key[-4:]}"

    @property
    def gemini_configured(self) -> bool:
        return bool(self.gemini_api_key_encrypted)

    def set_serper_key(self, raw_key: str | None) -> None:
        key = (raw_key or "").strip()
        self.serper_api_key_encrypted = encrypt_value(key) if key else ""

    def get_serper_key(self) -> str:
        if not self.serper_api_key_encrypted:
            return ""
        return decrypt_value(self.serper_api_key_encrypted)

    def serper_key_hint(self) -> str:
        key = self.get_serper_key()
        if len(key) <= 8:
            return "••••••••" if key else ""
        return f"{key[:4]}…{key[-4:]}"

    @property
    def serper_configured(self) -> bool:
        return bool(self.serper_api_key_encrypted)

    def set_github_token(self, raw_token: str | None) -> None:
        token = (raw_token or "").strip()
        self.github_token_encrypted = encrypt_value(token) if token else ""
        if not token:
            self.github_token_valid = None

    def get_github_token(self) -> str:
        if not self.github_token_encrypted:
            return ""
        return decrypt_value(self.github_token_encrypted)

    def github_key_hint(self) -> str:
        token = self.get_github_token()
        if len(token) <= 8:
            return "••••••••" if token else ""
        return f"{token[:4]}…{token[-4:]}"

    @property
    def github_configured(self) -> bool:
        return bool(self.github_token_encrypted)

    def github_status(self) -> str:
        if not self.github_configured:
            return "not_configured"
        if self.github_token_valid is True:
            return "connected"
        return "invalid"

    def add_approval_allow(self, tool_name: str) -> None:
        entry = (tool_name or "").strip()
        if not entry:
            return
        allowlist = list(self.approval_allowlist or [])
        if entry not in allowlist:
            allowlist.append(entry)
            self.approval_allowlist = allowlist


class Agent(models.Model):
    owner = models.ForeignKey(User, on_delete=models.CASCADE)
    name = models.CharField(max_length=255)
    role = models.CharField(max_length=255, default="AI Assistant")
    backstory = models.TextField(blank=True, default="")
    additional_context = models.TextField(blank=True, default="")
    tools = models.JSONField(default=list)
    max_iterations = models.PositiveSmallIntegerField(default=10)
    forbidden_topics = models.CharField(max_length=500, blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)

    def build_system_prompt(self) -> str:
        prompt = build_system_prompt(
            self.role,
            self.backstory,
            self.additional_context,
        )
        if self.forbidden_topics.strip():
            prompt += f"\n\nNever discuss these topics: {self.forbidden_topics.strip()}"
        return prompt


class RestAPIKey(models.Model):
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="rest_api_keys",
    )
    name = models.CharField(max_length=100)
    prefix = models.CharField(max_length=16, db_index=True)
    key_hash = models.CharField(max_length=64, unique=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    last_used_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["user", "is_active"]),
        ]

    def __str__(self) -> str:
        return f"{self.name} ({self.prefix}…)"


class AgentRun(models.Model):
    STATUS_RUNNING = "running"
    STATUS_DONE = "done"
    STATUS_ERROR = "error"

    STATUS_CHOICES = [
        (STATUS_RUNNING, "Running"),
        (STATUS_DONE, "Done"),
        (STATUS_ERROR, "Error"),
    ]

    agent = models.ForeignKey(Agent, on_delete=models.CASCADE, related_name="runs")
    owner = models.ForeignKey(User, on_delete=models.CASCADE, related_name="agent_runs")
    message = models.TextField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_RUNNING)
    steps = models.JSONField(default=list)
    result = models.TextField(blank=True, default="")
    error = models.TextField(blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
