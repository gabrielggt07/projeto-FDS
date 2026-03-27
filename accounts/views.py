from django.contrib.auth.views import LoginView
from django.views import View
from django.contrib.auth.models import User
from django.contrib.admin.views.decorators import staff_member_required
from django.shortcuts import render, redirect, get_object_or_404
from django.contrib import messages
from django.contrib.auth.decorators import login_required
from django.urls import reverse_lazy
from django.http import JsonResponse
from .models import Ponto
import json

# 🔐 LOGIN
class CustomLoginView(LoginView):
    template_name = 'accounts/login.html'
    redirect_authenticated_user = True

    def get_success_url(self):
        return reverse_lazy('home')

    def form_invalid(self, form):
        messages.error(self.request, 'Usuário ou senha inválidos')
        return super().form_invalid(form)

# 🏠 HOME (Mapa e Listagem)
@login_required
def home(request):
    pontos = Ponto.objects.all()
    return render(request, 'accounts/home.html', {'pontos': pontos})

# 🧾 REGISTER
class RegisterView(View):
    template_name = 'accounts/register.html'

    def get(self, request):
        return render(request, self.template_name)

    def post(self, request):
        username = request.POST.get('username')
        email = request.POST.get('email')
        password = request.POST.get('password')
        confirm_password = request.POST.get('confirm_password')

        if password != confirm_password:
            messages.error(request, 'As senhas não coincidem')
            return render(request, self.template_name)

        if len(password) < 6:
            messages.error(request, 'A senha deve ter pelo menos 6 caracteres')
            return render(request, self.template_name)

        if User.objects.filter(username=username).exists():
            messages.error(request, 'Usuário já existe')
            return render(request, self.template_name)

        if User.objects.filter(email=email).exists():
            messages.error(request, 'Email já cadastrado')
            return render(request, self.template_name)

        User.objects.create_user(
            username=username,
            email=email,
            password=password
        )

        messages.success(request, 'Conta criada com sucesso!')
        return redirect('login')


# 📍 SALVAR PONTO (AJAX)
@staff_member_required  # Bloqueia usuários comuns no backend
def salvar_ponto(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            
            # Criando o registro no banco com os dados vindos do JS
            novo_ponto = Ponto.objects.create(
                nome=data.get('nome'),
                latitude=data.get('lat'),
                longitude=data.get('lng'),
                consumo=data.get('consumo') or 0,
                valor=data.get('valor') or 0
            )
            
            return JsonResponse({
                'id': novo_ponto.id,
                'status': 'sucesso',
                'nome': novo_ponto.nome
            })
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=400)
    
    return JsonResponse({'error': 'Método não permitido'}, status=405)

# 🗑️ REMOVER PONTO (AJAX)
@staff_member_required
def remover_ponto(request, id):
    if request.method == 'POST':
        try:
            ponto = get_object_or_404(Ponto, id=id)
            ponto.delete()
            return JsonResponse({'status': 'removido'})
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=400)
            
    return JsonResponse({'error': 'Método não permitido'}, status=405)