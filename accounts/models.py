from django.db import models

class Ponto(models.Model):
    nome = models.CharField(max_length=100, default="Posto Sem Nome")
    latitude = models.FloatField()
    longitude = models.FloatField()
    consumo = models.FloatField(default=0)
    valor = models.FloatField(default=0)
    criado_em = models.DateTimeField(auto_now_add=True)