from django.contrib import admin
from .models import Ponto, Conector, Avaliacao


class ConectorInline(admin.TabularInline):
    model        = Conector
    extra        = 1
    fields       = ('tipo', 'potencia', 'status')
    show_change_link = True


@admin.register(Ponto)
class PontoAdmin(admin.ModelAdmin):
    list_display  = ('nome', 'vagas_livres', 'total_vagas', 'consumo', 'criado_em')
    search_fields = ('nome',)
    inlines       = [ConectorInline]


@admin.register(Conector)
class ConectorAdmin(admin.ModelAdmin):
    list_display  = ('ponto', 'tipo', 'potencia', 'status', 'atualizado')
    list_filter   = ('status', 'tipo')
    list_editable = ('status',)   # Admin pode mudar status direto na listagem
    search_fields = ('ponto__nome',)
    ordering      = ('ponto', 'tipo')


@admin.register(Avaliacao)
class AvaliacaoAdmin(admin.ModelAdmin):
    list_display  = ('ponto', 'usuario', 'estrelas', 'criado_em')
    list_filter   = ('estrelas',)
    search_fields = ('ponto__nome', 'usuario__username')