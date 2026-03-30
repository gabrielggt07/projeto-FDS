from django.db import models
from django.contrib.auth.models import User
from django.core.validators import MinValueValidator, MaxValueValidator

TIPOS_CARREGADOR_CHOICES = [
    ('tipo1',    'Tipo 1 (J1772)'),
    ('tipo2',    'Tipo 2 (Mennekes)'),
    ('ccs1',     'CCS Combo 1'),
    ('ccs2',     'CCS Combo 2'),
    ('chademo',  'CHAdeMO'),
    ('gbdc',     'GB/T DC'),
    ('tesla',    'Tesla (NACS)'),
    ('schuko',   'Schuko (doméstico)'),
]

class Ponto(models.Model):
    nome             = models.CharField(max_length=100, default="Posto Sem Nome")
    latitude         = models.FloatField()
    longitude        = models.FloatField()
    consumo          = models.FloatField(default=0)
    preco_start      = models.FloatField(default=0)
    preco_kwh        = models.FloatField(default=0)
    preco_ociosidade = models.FloatField(default=0)
    tipos_carregador = models.CharField(max_length=200, default='', blank=True)
    criado_em        = models.DateTimeField(auto_now_add=True)

    def tipos_lista(self):
        return [t.strip() for t in self.tipos_carregador.split(',') if t.strip()]

    def media_avaliacoes(self):
        avals = self.avaliacoes.all()
        if not avals.exists():
            return None
        return round(sum(a.estrelas for a in avals) / avals.count(), 1)

    def total_avaliacoes(self):
        return self.avaliacoes.count()

    def __str__(self):
        return self.nome


class Avaliacao(models.Model):
    ponto      = models.ForeignKey(Ponto, on_delete=models.CASCADE, related_name='avaliacoes')
    usuario    = models.ForeignKey(User,  on_delete=models.CASCADE, related_name='avaliacoes')
    estrelas   = models.IntegerField(validators=[MinValueValidator(1), MaxValueValidator(5)])
    comentario = models.TextField(blank=True, default='')
    criado_em  = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('ponto', 'usuario')
        ordering = ['-criado_em']

    def __str__(self):
        return f'{self.usuario.username} → {self.ponto.nome} ({self.estrelas}★)'