from django.urls import path
from .views import CustomLoginView, RegisterView, home
from django.contrib.auth.views import LogoutView

urlpatterns = [
    path('login/', CustomLoginView.as_view(), name='login'),
    path('register/', RegisterView.as_view(), name='register'),
    path('home/', home, name='home'),
    path('logout/', LogoutView.as_view(), name='logout'),
]
