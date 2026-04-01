# ⚡ EnerTech

Sistema web desenvolvido com Django com foco em gestão e visualização de dados de consumo energético.

---

## 🚀 Sobre o projeto

O **EnerTech** é uma aplicação web que tem como objetivo facilitar o monitoramento e análise de dados, possivelmente integrando funcionalidades como dashboards e visualizações semelhantes ao Google Maps para exibir informações em tempo real.

---

## 🛠️ Tecnologias utilizadas

* Python
* Django
* SQLite (ambiente de desenvolvimento)
* HTML5
* CSS3
* JavaScript

---

## 📁 Estrutura do projeto

```bash
enertech/
│
├── accounts/        # App responsável por autenticação de usuários
├── enertech/        # Configurações principais do projeto Django
├── static/          # Arquivos estáticos (CSS, JS, imagens)
├── templates/       # Templates HTML
├── manage.py        # Gerenciador do Django
└── db.sqlite3       # Banco de dados (desenvolvimento)
```

---

## ⚙️ Como rodar o projeto

### 1. Clone o repositório

```bash
git clone https://github.com/seu-usuario/enertech.git
```

### 2. Acesse a pasta do projeto

```bash
cd enertech
```

### 3. Crie um ambiente virtual

```bash
python -m venv venv
```

### 4. Ative o ambiente virtual

* Windows:

```bash
venv\Scripts\activate
```

* Linux/Mac:

```bash
source venv/bin/activate
```

### 5. Instale as dependências

```bash
pip install -r requirements.txt
```

*(caso ainda não tenha, você pode gerar com `pip freeze > requirements.txt`)*

---

### 6. Execute as migrações

```bash
python manage.py migrate
```

---

### 7. Rode o servidor

```bash
python manage.py runserver
```

Acesse no navegador:

```
http://127.0.0.1:8000/
```

---

## 🔐 Funcionalidades (atuais ou planejadas)

* Sistema de autenticação de usuários
* Dashboard com indicadores
* Visualização de dados
* Integração com mapas (estilo Google Maps)
* Monitoramento de consumo

---

## 📌 Melhorias futuras

* Integração com APIs externas
* Deploy em produção
* Banco de dados PostgreSQL
* Interface mais interativa
* Sistema de relatórios

---


## 📄 Licença

Este projeto está sob a licença MIT.
==============================================================
==============================================================
==============================================================
# PROJETO FUNDAMENTOS DE DESENVOLVIMENTO DE SOFTWARE:

## Entrega 01 - (16/03):
### Documento com as historias e cenarios BDD :
[Link para Docs](https://docs.google.com/document/d/17qf1O3JAC6Jr1MacRRqNku-bDXHiBcaBE9ix0eBqRLQ/edit?tab=t.0)

### Sprint Board (JIRA):
[Link para o Sprint Board](https://github.com/user-attachments/assets/580f6635-26c8-45b5-a276-24950ce4ddd1)
 
### Backlog (JIRA):
[Link para o Jira](https://cesar-team-fitr7l7q.atlassian.net/jira/software/projects/SCRUM/boards/34)

[Link para o Backlog](https://cesar-team-fitr7l7q.atlassian.net/jira/software/projects/SCRUM/boards/34/backlog)

* **SCRUM 1** - [Link para o scrum 1](https://cesar-team-fitr7l7q.atlassian.net/browse/SCRUM-1)
* **SCRUM 2** - [Link para o scrum 2](https://cesar-team-fitr7l7q.atlassian.net/browse/SCRUM-2)
* **SCRUM 3** - [Link para o scrum 3](https://cesar-team-fitr7l7q.atlassian.net/browse/SCRUM-3)
* **SCRUM 4** - [Link para o scrum 4](https://cesar-team-fitr7l7q.atlassian.net/browse/SCRUM-4)
* **SCRUM 5** - [Link para o scrum 5](https://cesar-team-fitr7l7q.atlassian.net/browse/SCRUM-5)
* **SCRUM 6** - [Link para o scrum 6](https://cesar-team-fitr7l7q.atlassian.net/browse/SCRUM-6)
* **SCRUM 7** - [Link para o scrum 7](https://cesar-team-fitr7l7q.atlassian.net/browse/SCRUM-7)

## Link para screencast: 
[Link para o screencast](https://youtu.be/kJDK5AWO-w8?si=KTadK9UZGcNILxKG)

-------------------------------------------------------------------------------------------------------------------

##Entrega 02 - (30/03):
## 🎯 Objetivo da Sprint 2
Implementar pelo menos 3 histórias selecionadas do backlog, garantindo:
- Versionamento ativo com commits semanais
- Uso do issue tracker no GitHub
- Deploy em produção
- Documentação completa no README
- Screencast demonstrativo até **30/03**

## 📌 Quadro da Sprint 2

[Print do Quadro da Sprint 2](<img width="1586" height="248" alt="print do quadro sprint2" src="https://github.com/user-attachments/assets/0d041a85-3820-4931-ad8f-ec49785dda56" />
)

Histórias selecionadas:
- SCRUM-2: Filtro
- SCRUM-3: Detalhamento do eletroposto
- SCRUM-5: Reportar problema em eletroposto

## 📋 Backlog

[Print do Backlog](https://github.com/user-attachments/assets/fd777505-eebe-474a-85c0-ab5b3f594c79)

- SCRUM-4: Avaliação
- SCRUM-6: Cadastro de usuário
- SCRUM-7: Login inválido
- SCRUM-8: Ranking de eletropostos
 
## 🔗 Repositório e Versionamento
- [Link para o repositório GitHub](URl)
- Commits semanais documentando progresso
- Issue tracker atualizado com bugs e melhorias

## 🚀 Link do Deploy
- https://enertech-b562.onrender.com

## 🎥 Screencast
[Link para o screencast](https://youtu.be/jMHKG2hMUsI?si=onBhtmm84sfaa9-f)

## Bug tracker

Status do Sistema: Estável (Fase de Autenticação Concluída)

1. Erro de Rota de Saída (NoReverseMatch)
Descrição: O sistema disparava um erro crítico ao tentar renderizar a página de login, alegando que a URL 'logout' não existia.

Causa Raiz: O template (provavelmente o base.html) continha uma tag {% url 'logout' %}, mas a rota correspondente não havia sido declarada no arquivo accounts/urls.py.

Resolução: Adição da rota path('logout/', auth_views.LogoutView.as_view(), name='logout') e configuração do LOGOUT_REDIRECT_URL no settings.py.

Severidade: Alta (Bloqueava o carregamento da página).
------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
2. Falha de Submissão Silenciosa (Formulário Inerte)
Descrição: O usuário preenchia os dados de login, clicava em "Entrar", mas a página apenas recarregava sem processar a autenticação (nenhum POST registrado no log do servidor).

Causa Raiz: Conflito de estrutura no HTML. Tags de formulário no base.html (como o botão de Logout) estavam interferindo ou "sobrepondo" o formulário de Login dentro do bloco de conteúdo, impedindo o disparo do evento de submit.

Resolução: Reestruturação do base.html utilizando condicionais {% if user.is_authenticated %} para isolar componentes da Dashboard (Sidebar/Topbar) do conteúdo de autenticação.

Severidade: Crítica (Impedia o acesso ao sistema).
------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
3. Duplicidade de Blocos de Template (TemplateSyntaxError)
Descrição: Erro de sintaxe: block tag with name 'content' appears more than once.

Causa Raiz: Tentativa de declarar o mesmo {% block content %} duas vezes dentro do arquivo base.html (uma para o layout logado e outra para o layout deslogado). O motor de templates do Django não permite nomes de blocos duplicados no mesmo arquivo pai.

Resolução: Unificação do bloco content. A lógica de "Logado vs Deslogado" passou a ser controlada por if/else ao redor dos elementos de UI (Sidebar), mantendo apenas uma declaração de bloco de conteúdo.

Severidade: Alta (Impedia o servidor de renderizar qualquer página).
-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
4. Mudança de Protocolo de Logout (Django 5.0+)
Descrição: Erros potenciais ao tentar deslogar via link simples (GET).

Causa Raiz: Nas versões mais recentes do Django, o LogoutView exige o método POST por questões de segurança contra ataques CSRF.

Resolução: Substituição de links <a> por pequenos formulários <form method="post"> com botões de submit para a ação de logout na Topbar.

Severidade: Média (Segurança e Conformidade).


##Programaçao em par experimentada: 
- Durante o desenvolvimento do projeto, optamos por não utilizar a técnica de programação em par. A decisão foi tomada em conjunto pelo grupo e se baseou em alguns fatores: organizaçao do tempo, as disponibilidades de horarios eram diferentes, o que acabava complicando, e divisao de tarefas, onde preferimos distribiuir os afazeres de forma individual , o que permitiu maior autonomia e produtividade individual.



 



