from .demo_login import demo_login_view
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    csrf_view, register_view, login_view, logout_view, me_view, forgot_password_view, CustomerViewSet
)

router = DefaultRouter()
router.register(r'customers', CustomerViewSet, basename='customer')

urlpatterns = [
    path('demo-login/', demo_login_view, name='auth-demo-login'),
    path('csrf/', csrf_view, name='auth-csrf'),
    path('register/', register_view, name='auth-register'),
    path('login/', login_view, name='auth-login'),
    path('logout/', logout_view, name='auth-logout'),
    path('me/', me_view, name='auth-me'),
    path('forgot-password/', forgot_password_view, name='auth-forgot-password'),
    path('', include(router.urls)),
]

