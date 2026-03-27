let map;
let markers = {};
let dadosPontos = [];
let usuarioLogadoEhAdmin = false; // DEFINIDO NO TOPO PARA NÃO DAR ERRO

// Inicialização
function initDashboard(pontosIniciais, ehAdmin) {
    usuarioLogadoEhAdmin = ehAdmin; // Recebe o valor do Django
    
    map = L.map('map').setView([-8.0476, -34.8770], 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap'
    }).addTo(map);

    pontosIniciais.forEach(p => {
        processarNovoPonto(p.lat, p.lng, p.id, p.consumo, p.nome, p.valor);
    });
}

// Interface do Modal
window.abrirFormulario = function() {
    const modal = document.getElementById('formPonto');
    if (modal) modal.style.display = 'flex';
};

window.fecharFormulario = function() {
    const modal = document.getElementById('formPonto');
    if (modal) {
        modal.style.display = 'none';
        // Limpa os campos ao fechar
        document.querySelectorAll('#formPonto input').forEach(i => i.value = '');
    }
};

function processarNovoPonto(lat, lng, id, consumo, nome, valor) {
    const iconRaio = L.divIcon({
        html: '<div style="font-size: 24px; filter: drop-shadow(0 0 5px #22c55e);">⚡</div>',
        className: 'custom-div-icon',
        iconSize: [30, 30],
        iconAnchor: [15, 30]
    });

    let m = L.marker([lat, lng], { icon: iconRaio }).addTo(map);
    m.bindPopup(`<strong>${nome}</strong><br>Preço: R$ ${valor}<br>Consumo: ${consumo}kW`);
    markers[id] = m;

    dadosPontos.push({ lat, lng, id, consumo, nome, valor: parseFloat(valor) });
    atualizarListaLateral();
}

function atualizarListaLateral() {
    const container = document.getElementById('itens-lista');
    if (!container) return;
    container.innerHTML = '';

    let limitePreco = parseFloat(document.getElementById('inputPreco').value);

    dadosPontos.forEach(p => {
        const div = document.createElement('div');
        div.className = 'item-ponto';
        div.style.display = p.valor <= limitePreco ? "" : "none";

        div.innerHTML = `
            <div class="ponto-info">
                <span class="ponto-id">${p.nome}</span><br>
                <span class="ponto-kw" style="font-size: 11px;">R$ ${p.valor.toFixed(2)} | ${p.consumo} kW</span>
            </div>
            <div style="display: flex;">
                <button class="btn btn-small" onclick="focarPonto(${p.lat}, ${p.lng}, ${p.id})">VER</button>
                ${usuarioLogadoEhAdmin ? 
                    `<button class="btn btn-small btn-danger" onclick="removerPonto(${p.id})">DELETAR</button>` 
                    : '' 
                }
            </div>
        `;
        container.appendChild(div);
    });
}

// Funções de Filtro e Foco (Mantidas)
function filtrarPorPreco() {
    let limitePreco = parseFloat(document.getElementById('inputPreco').value);
    document.getElementById('valorFiltroLabel').innerText = `R$ ${limitePreco.toFixed(2)}`;
    let itensHTML = document.getElementsByClassName('item-ponto');

    dadosPontos.forEach((p, index) => {
        let deveExibir = p.valor <= limitePreco;
        if (deveExibir) { markers[p.id].addTo(map); } 
        else { map.removeLayer(markers[p.id]); }
        if (itensHTML[index]) itensHTML[index].style.display = deveExibir ? "" : "none";
    });
}

function focarPonto(lat, lng, id) {
    map.setView([lat, lng], 16);
    markers[id].openPopup();
}

function filtrarLista() {
    let termo = document.getElementById('inputBusca').value.toLowerCase();
    let itens = document.getElementsByClassName('item-ponto');
    let limitePreco = parseFloat(document.getElementById('inputPreco').value);

    dadosPontos.forEach((p, i) => {
        let nomeBate = p.nome.toLowerCase().includes(termo);
        let precoBate = p.valor <= limitePreco;
        if (itens[i]) itens[i].style.display = (nomeBate && precoBate) ? "" : "none";
    });
}

// BACKEND: Salvar e Remover
window.salvarPonto = function() {
    let nome = document.getElementById('nome_posto').value;
    let lat = document.getElementById('lat').value;
    let lng = document.getElementById('lng').value;
    let consumo = document.getElementById('consumo').value;
    let valor = document.getElementById('valor').value;

    if (!nome || !lat || !lng) { alert("Preencha Nome, Latitude e Longitude!"); return; }

    fetch('/salvar-ponto/', {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json', 
            'X-CSRFToken': getCSRFToken() 
        },
        body: JSON.stringify({ nome, lat, lng, consumo, valor })
    })
    .then(response => response.json())
    .then(data => {
        if (data.id) {
            processarNovoPonto(lat, lng, data.id, consumo, nome, valor);
            fecharFormulario(); // Usa a função de fechar que limpa tudo
        } else {
            alert("Erro ao salvar: " + (data.error || "Erro desconhecido"));
        }
    })
    .catch(error => console.error('Erro no Fetch:', error));
}

window.removerPonto = function(id) {
    if (!confirm("Confirmar exclusão?")) return;
    fetch(`/remover-ponto/${id}/`, {
        method: 'POST',
        headers: { 'X-CSRFToken': getCSRFToken() }
    })
    .then(response => {
        if (response.ok) {
            map.removeLayer(markers[id]);
            delete markers[id];
            dadosPontos = dadosPontos.filter(p => p.id !== id);
            atualizarListaLateral();
        }
    });
}

function getCSRFToken() {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; csrftoken=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
}