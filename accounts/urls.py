from django.urls import path
from .views import CustomLoginView, RegisterView, home, salvar_ponto, remover_ponto # Adicione remover_ponto aqui
from django.contrib.auth.views import LogoutView

urlpatterns = [
    path('', CustomLoginView.as_view(), name='root'),  
    path('login/', CustomLoginView.as_view(), name='login'),
    path('register/', RegisterView.as_view(), name='register'),
    path('home/', home, name='home'),
    path('logout/', LogoutView.as_view(), name='logout'),
    path('salvar-ponto/', salvar_ponto, name='salvar_ponto'),
    
    # NOVA ROTA: O <int:id> captura o ID que o JavaScript envia na URL
    path('remover-ponto/<int:id>/', remover_ponto, name='remover_ponto'),
]