from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.request import Request
from src.main import run_agent
@api_view(["GET"])
@permission_classes([AllowAny])
def check(request):
    message = request.data.get("message")
    origin = request.META.get("HTTP_ORIGIN")
    return Response(
        {
            "message": run_agent(message),
        }
    )