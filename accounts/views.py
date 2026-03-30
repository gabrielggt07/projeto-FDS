from django.contrib.auth.views import LoginView
from django.views import View
from django.contrib.auth.models import User
from django.contrib.admin.views.decorators import staff_member_required
from django.shortcuts import render, redirect, get_object_or_404
from django.contrib import messages
from django.contrib.auth.decorators import login_required
from django.urls import reverse_lazy
from django.http import JsonResponse
from .models import Ponto, Avaliacao
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


# 🏠 HOME
@login_required
def home(request):
    pontos = Ponto.objects.prefetch_related('avaliacoes').all()
    return render(request, 'accounts/home.html', {'pontos': pontos})


# 🧾 REGISTER
class RegisterView(View):
    template_name = 'accounts/register.html'

    def get(self, request):
        return render(request, self.template_name)

    def post(self, request):
        username         = request.POST.get('username')
        email            = request.POST.get('email')
        password         = request.POST.get('password')
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

        User.objects.create_user(username=username, email=email, password=password)
        messages.success(request, 'Conta criada com sucesso!')
        return redirect('login')


# 📍 SALVAR PONTO (AJAX)
@staff_member_required
def salvar_ponto(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            novo_ponto = Ponto.objects.create(
                nome             = data.get('nome', 'Posto Sem Nome'),
                latitude         = data.get('lat'),
                longitude        = data.get('lng'),
                consumo          = data.get('consumo') or 0,
                preco_start      = data.get('preco_start') or 0,
                preco_kwh        = data.get('preco_kwh') or 0,
                preco_ociosidade = data.get('preco_ociosidade') or 0,
                tipos_carregador = ','.join(data.get('tipos_carregador', [])),
            )
            return JsonResponse({'id': novo_ponto.id, 'status': 'sucesso', 'nome': novo_ponto.nome})
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


# ⭐ AVALIAR PONTO (AJAX) — cria ou atualiza a avaliação do usuário
@login_required
def avaliar_ponto(request, id):
    if request.method == 'POST':
        try:
            ponto = get_object_or_404(Ponto, id=id)
            data  = json.loads(request.body)

            estrelas   = int(data.get('estrelas', 0))
            comentario = data.get('comentario', '').strip()

            if not 1 <= estrelas <= 5:
                return JsonResponse({'error': 'Estrelas devem ser entre 1 e 5'}, status=400)

            avaliacao, criada = Avaliacao.objects.update_or_create(
                ponto=ponto,
                usuario=request.user,
                defaults={'estrelas': estrelas, 'comentario': comentario},
            )

            return JsonResponse({
                'status':  'criada' if criada else 'atualizada',
                'media':   ponto.media_avaliacoes(),
                'total':   ponto.total_avaliacoes(),
            })
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=400)
    return JsonResponse({'error': 'Método não permitido'}, status=405)


# 📋 LISTAR AVALIAÇÕES DE UM PONTO (AJAX)
@login_required
def get_avaliacoes(request, id):
    ponto    = get_object_or_404(Ponto, id=id)
    avals    = ponto.avaliacoes.select_related('usuario').all()
    minha    = avals.filter(usuario=request.user).first()

    return JsonResponse({
        'media': ponto.media_avaliacoes(),
        'total': ponto.total_avaliacoes(),
        'minha_avaliacao': {
            'estrelas':    minha.estrelas,
            'comentario':  minha.comentario,
        } if minha else None,
        'avaliacoes': [
            {
                'usuario':    a.usuario.username,
                'estrelas':   a.estrelas,
                'comentario': a.comentario,
                'data':       a.criado_em.strftime('%d/%m/%Y'),
            }
            for a in avals
        ],
    })