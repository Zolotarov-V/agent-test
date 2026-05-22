from django.contrib import admin
from django.urls import include, path
from django.urls import path, include

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/", include("api.urls")),
    path('admin/', admin.site.urls),
    path('', include('accounts.urls')),
]