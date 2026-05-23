from django.contrib import admin

from .models import Agent, AgentRun, RestAPIKey, UserAPIKey


@admin.register(Agent)
class AgentAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "role", "owner", "created_at")
    search_fields = ("name", "role", "owner__username")


@admin.register(AgentRun)
class AgentRunAdmin(admin.ModelAdmin):
    list_display = ("id", "agent", "owner", "status", "created_at")
    list_filter = ("status",)


@admin.register(RestAPIKey)
class RestAPIKeyAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "prefix", "user", "is_active", "last_used_at", "created_at")
    list_filter = ("is_active",)
    search_fields = ("name", "prefix", "user__username")


@admin.register(UserAPIKey)
class UserAPIKeyAdmin(admin.ModelAdmin):
    list_display = ("user", "gemini_configured", "serper_configured", "updated_at")

    @admin.display(boolean=True)
    def gemini_configured(self, obj):
        return obj.gemini_configured

    @admin.display(boolean=True)
    def serper_configured(self, obj):
        return obj.serper_configured
