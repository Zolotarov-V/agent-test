from django.contrib.auth.models import User
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from .models import Agent


@api_view(['POST'])
@permission_classes([AllowAny])
def register(request):
    user = User.objects.create_user(
        username=request.data['username'],
        password=request.data['password']
    )
    token = RefreshToken.for_user(user)
    return Response({'access': str(token.access_token)})


@api_view(['POST'])
@permission_classes([AllowAny])
def login(request):
    from django.contrib.auth import authenticate
    user = authenticate(
        username=request.data['username'],
        password=request.data['password']
    )
    if not user:
        return Response({'error': 'Wrong credentials'}, status=400)
    token = RefreshToken.for_user(user)
    return Response({'access': str(token.access_token)})


@api_view(['GET', 'POST'])
def agents(request):
    if request.method == 'POST':
        Agent.objects.create(owner=request.user, **request.data)
        return Response({'ok': True})

    data = Agent.objects.filter(owner=request.user).values()
    return Response(list(data))