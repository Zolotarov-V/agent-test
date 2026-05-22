from django.urls import path
from .views import register, login, agents

urlpatterns = [
    path('api/register/', register),
    path('api/login/', login),
    path('api/agents/', agents),
]