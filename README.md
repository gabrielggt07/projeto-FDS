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
