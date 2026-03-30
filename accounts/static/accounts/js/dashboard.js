let map;
let markers = {};
let dadosPontos = [];
let usuarioLogadoEhAdmin = false;
let tiposFiltroAtivos = ['todos'];

// ID do ponto sendo avaliado no momento
let pontoAvaliacaoAtual = null;
// Estrelas selecionadas no picker
let estrelasEscolhidas = 0;

// ─────────────────────────────────────────
// INICIALIZAÇÃO
// ─────────────────────────────────────────
function initDashboard(pontosIniciais, ehAdmin) {
    usuarioLogadoEhAdmin = ehAdmin;

    map = L.map('map').setView([-8.0476, -34.8770], 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap'
    }).addTo(map);

    pontosIniciais.forEach(p => {
        const tipos = p.tipos_carregador
            ? p.tipos_carregador.split(',').map(t => t.trim()).filter(Boolean)
            : [];
        processarNovoPonto(
            p.lat, p.lng, p.id, p.consumo, p.nome,
            p.preco_start, p.preco_kwh, p.preco_ociosidade,
            tipos, p.media, p.total_aval
        );
    });

    // Inicializa o star picker
    iniciarStarPicker();
}

// ─────────────────────────────────────────
// ADICIONAR PONTO
// ─────────────────────────────────────────
function processarNovoPonto(lat, lng, id, consumo, nome,
                             preco_start, preco_kwh, preco_ociosidade,
                             tipos, media, total_aval) {

    const mediaStr  = media ? `${media}★` : 'Sem aval.';
    const tiposLabel = tipos.length
        ? tipos.map(t => labelDoTipo(t)).join(', ')
        : 'Não informado';

    const iconHtml = `
        <div style="position:relative;text-align:center;">
            <div style="font-size:24px;filter:drop-shadow(0 0 5px #00e676);">⚡</div>
            ${media ? `<div style="font-size:9px;font-weight:700;color:#00e676;line-height:1;margin-top:-2px;">${media}★</div>` : ''}
        </div>`;

    const iconRaio = L.divIcon({
        html: iconHtml,
        className: 'custom-div-icon',
        iconSize: [30, 36],
        iconAnchor: [15, 36]
    });

    const popupHtml = `
        <div style="min-width:180px;">
            <strong style="font-size:14px;">${nome}</strong><br>
            <div style="margin:6px 0;color:#00e676;font-size:13px;">
                ${media ? renderEstrelinhas(media) + ` <span style="color:#7a91b0;font-size:11px;">(${total_aval} aval.)</span>` : '<span style="color:#3d5470;font-size:11px;">Sem avaliações ainda</span>'}
            </div>
            <hr style="border-color:rgba(0,230,118,0.2);margin:6px 0;">
            <span style="color:#00e676;">R$ ${preco_start.toFixed(2)}</span> início &nbsp;
            <span style="color:#00e676;">R$ ${preco_kwh.toFixed(2)}</span>/kWh &nbsp;
            <span style="color:#00e676;">R$ ${preco_ociosidade.toFixed(2)}</span>/min<br>
            <span style="color:#7a91b0;font-size:11px;">⚡ ${consumo} kW · 🔌 ${tiposLabel}</span><br>
            <button onclick="abrirAvaliacao(${id})"
                style="margin-top:10px;width:100%;padding:7px;background:linear-gradient(135deg,#00e676,#00c853);
                       border:none;border-radius:8px;color:#04080f;font-weight:700;font-size:12px;cursor:pointer;">
                ★ Ver / Avaliar
            </button>
        </div>`;

    const m = L.marker([lat, lng], { icon: iconRaio }).addTo(map);
    m.bindPopup(popupHtml, { maxWidth: 220 });
    markers[id] = m;

    dadosPontos.push({
        lat, lng, id, consumo, nome,
        preco_start, preco_kwh, preco_ociosidade,
        tipos, media, total_aval,
        valor: preco_kwh
    });

    atualizarListaLateral();
}

// ─────────────────────────────────────────
// LISTA LATERAL
// ─────────────────────────────────────────
function atualizarListaLateral() {
    const container = document.getElementById('itens-lista');
    if (!container) return;
    container.innerHTML = '';

    const filtrados = getPontosFiltrados();
    const countEl   = document.getElementById('listCount');
    if (countEl) countEl.textContent = filtrados.length;

    if (filtrados.length === 0) {
        container.innerHTML = `
            <div style="text-align:center;padding:32px 16px;color:var(--text-muted);">
                <div style="font-size:28px;margin-bottom:8px;">🔌</div>
                Nenhum posto encontrado.
            </div>`;
        return;
    }

    filtrados.forEach(p => {
        const tiposHtml = p.tipos.length
            ? p.tipos.map(t => `<span class="chip chip--mini">${labelDoTipo(t)}</span>`).join('')
            : `<span class="chip chip--mini" style="opacity:0.4;">Não informado</span>`;

        const mediaHtml = p.media
            ? `${renderEstrelinhas(p.media)} <span style="color:var(--text-muted);font-size:11px;">(${p.total_aval})</span>`
            : `<span style="color:var(--text-muted);font-size:11px;">Sem avaliações</span>`;

        const div = document.createElement('div');
        div.className = 'item-ponto';
        div.innerHTML = `
            <div class="ponto-info">
                <span class="ponto-id">${p.nome}</span>
                <div style="margin:4px 0 6px;">${mediaHtml}</div>
                <div class="preco-tags">
                    <span class="preco-tag">🟢 R$ ${p.preco_start.toFixed(2)} início</span>
                    <span class="preco-tag">⚡ R$ ${p.preco_kwh.toFixed(2)}/kWh</span>
                    <span class="preco-tag">⏱ R$ ${p.preco_ociosidade.toFixed(2)}/min</span>
                </div>
                <div class="chips-wrap chips-wrap--mini" style="margin-top:8px;">${tiposHtml}</div>
            </div>
            <div class="ponto-actions">
                <button class="btn btn-small" onclick="focarPonto(${p.lat},${p.lng},${p.id})">Ver</button>
                <button class="btn btn-small btn-ghost" onclick="abrirAvaliacao(${p.id})" style="width:auto;">★ Avaliar</button>
                ${usuarioLogadoEhAdmin
                    ? `<button class="btn btn-small btn-danger" onclick="removerPonto(${p.id})">Deletar</button>`
                    : ''}
            </div>
        `;
        container.appendChild(div);
    });
}

// ─────────────────────────────────────────
// MODAL DE AVALIAÇÃO
// ─────────────────────────────────────────
window.abrirAvaliacao = function(id) {
    pontoAvaliacaoAtual = id;
    estrelasEscolhidas  = 0;
    atualizarStars(0);

    const ponto = dadosPontos.find(p => p.id === id);
    document.getElementById('avalNomePosto').textContent = ponto ? ponto.nome : '—';
    document.getElementById('avalComentario').value = '';
    document.getElementById('avalLista').innerHTML = '<div class="aval-empty">Carregando...</div>';
    atualizarMediaHeader(ponto?.media, ponto?.total_aval);

    // Fecha popup do mapa se aberto
    map.closePopup();

    document.getElementById('modalAvaliacao').style.display = 'flex';

    // Busca avaliações e minha avaliação prévia
    fetch(`/avaliacoes/${id}/`)
        .then(r => r.json())
        .then(data => {
            atualizarMediaHeader(data.media, data.total);
            renderListaAvaliacoes(data.avaliacoes);

            // Preenche minha avaliação prévia se existir
            if (data.minha_avaliacao) {
                estrelasEscolhidas = data.minha_avaliacao.estrelas;
                atualizarStars(estrelasEscolhidas);
                document.getElementById('avalComentario').value = data.minha_avaliacao.comentario;
            }
        })
        .catch(() => {
            document.getElementById('avalLista').innerHTML =
                '<div class="aval-empty">Erro ao carregar avaliações.</div>';
        });
};

window.fecharAvaliacao = function() {
    document.getElementById('modalAvaliacao').style.display = 'none';
    pontoAvaliacaoAtual = null;
};

window.enviarAvaliacao = function() {
    if (!estrelasEscolhidas) {
        alert('Selecione pelo menos 1 estrela!');
        return;
    }

    const comentario = document.getElementById('avalComentario').value.trim();

    fetch(`/avaliar-ponto/${pontoAvaliacaoAtual}/`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', 'X-CSRFToken': getCSRFToken() },
        body:    JSON.stringify({ estrelas: estrelasEscolhidas, comentario })
    })
    .then(r => r.json())
    .then(data => {
        if (data.error) { alert('Erro: ' + data.error); return; }

        // Atualiza média localmente
        const ponto = dadosPontos.find(p => p.id === pontoAvaliacaoAtual);
        if (ponto) {
            ponto.media      = data.media;
            ponto.total_aval = data.total;
        }

        atualizarMediaHeader(data.media, data.total);

        // Recarrega lista de avaliações
        fetch(`/avaliacoes/${pontoAvaliacaoAtual}/`)
            .then(r => r.json())
            .then(d => renderListaAvaliacoes(d.avaliacoes));

        // Atualiza marcador no mapa
        atualizarIconeMarcador(pontoAvaliacaoAtual, data.media);
        atualizarListaLateral();
    })
    .catch(err => console.error(err));
};

// ─────────────────────────────────────────
// STAR PICKER
// ─────────────────────────────────────────
function iniciarStarPicker() {
    const stars = document.querySelectorAll('#starPicker .star');
    stars.forEach(star => {
        star.addEventListener('mouseover', () => atualizarStars(parseInt(star.dataset.val)));
        star.addEventListener('mouseout',  () => atualizarStars(estrelasEscolhidas));
        star.addEventListener('click',     () => {
            estrelasEscolhidas = parseInt(star.dataset.val);
            atualizarStars(estrelasEscolhidas);
        });
    });
}

function atualizarStars(valor) {
    document.querySelectorAll('#starPicker .star').forEach(s => {
        const v = parseInt(s.dataset.val);
        s.classList.toggle('star--on', v <= valor);
    });
}

// ─────────────────────────────────────────
// RENDER HELPERS
// ─────────────────────────────────────────
function renderEstrelinhas(media) {
    const cheia  = Math.floor(media);
    const meia   = media - cheia >= 0.3 && media - cheia < 0.8;
    const vazia  = 5 - cheia - (meia ? 1 : 0);
    return '★'.repeat(cheia) + (meia ? '½' : '') + '☆'.repeat(vazia);
}

function atualizarMediaHeader(media, total) {
    const starsEl = document.getElementById('avalMediaStars');
    const numEl   = document.getElementById('avalMediaNum');
    if (!starsEl || !numEl) return;
    if (media) {
        starsEl.textContent = renderEstrelinhas(media);
        numEl.textContent   = `${media} de 5 · ${total} avaliação${total !== 1 ? 'ões' : ''}`;
    } else {
        starsEl.textContent = '☆☆☆☆☆';
        numEl.textContent   = 'Sem avaliações ainda';
    }
}

function renderListaAvaliacoes(avaliacoes) {
    const container = document.getElementById('avalLista');
    if (!avaliacoes || avaliacoes.length === 0) {
        container.innerHTML = '<div class="aval-empty">Nenhuma avaliação ainda. Seja o primeiro!</div>';
        return;
    }
    container.innerHTML = avaliacoes.map(a => `
        <div class="aval-item">
            <div class="aval-item-header">
                <span class="aval-usuario">👤 ${a.usuario}</span>
                <span class="aval-stars-sm">${'★'.repeat(a.estrelas)}${'☆'.repeat(5 - a.estrelas)}</span>
                <span class="aval-data">${a.data}</span>
            </div>
            ${a.comentario
                ? `<div class="aval-comentario">${a.comentario}</div>`
                : '<div class="aval-comentario" style="opacity:0.4;font-style:italic;">Sem comentário</div>'}
        </div>
    `).join('');
}

function atualizarIconeMarcador(id, media) {
    if (!markers[id]) return;
    const iconHtml = `
        <div style="position:relative;text-align:center;">
            <div style="font-size:24px;filter:drop-shadow(0 0 5px #00e676);">⚡</div>
            ${media ? `<div style="font-size:9px;font-weight:700;color:#00e676;line-height:1;margin-top:-2px;">${media}★</div>` : ''}
        </div>`;
    markers[id].setIcon(L.divIcon({
        html: iconHtml,
        className: 'custom-div-icon',
        iconSize: [30, 36],
        iconAnchor: [15, 36]
    }));
}

// ─────────────────────────────────────────
// FILTROS
// ─────────────────────────────────────────
function getPontosFiltrados() {
    const termo  = (document.getElementById('inputBusca')?.value || '').toLowerCase();
    const maxKwh = parseFloat(document.getElementById('inputKwh')?.value ?? 5);
    const minKw  = parseFloat(document.getElementById('inputKw')?.value ?? 0);

    return dadosPontos.filter(p => {
        const nomeBate = p.nome.toLowerCase().includes(termo);
        const kwhBate  = p.preco_kwh <= maxKwh;
        const kwBate   = p.consumo >= minKw;
        const tipoBate = tiposFiltroAtivos.includes('todos') ||
                         tiposFiltroAtivos.some(t => p.tipos.includes(t));
        return nomeBate && kwhBate && kwBate && tipoBate;
    });
}

function aplicarFiltros() {
    const kwh = parseFloat(document.getElementById('inputKwh')?.value ?? 5);
    const kw  = parseFloat(document.getElementById('inputKw')?.value ?? 0);
    const labelKwh = document.getElementById('labelKwh');
    const labelKw  = document.getElementById('labelKw');
    if (labelKwh) labelKwh.textContent = `R$ ${kwh.toFixed(2).replace('.', ',')}`;
    if (labelKw)  labelKw.textContent  = `${kw} kW`;

    const filtradosIds = new Set(getPontosFiltrados().map(p => p.id));
    dadosPontos.forEach(p => {
        if (filtradosIds.has(p.id)) {
            if (!map.hasLayer(markers[p.id])) markers[p.id].addTo(map);
        } else {
            if (map.hasLayer(markers[p.id])) map.removeLayer(markers[p.id]);
        }
    });
    atualizarListaLateral();
}

function resetarFiltros() {
    const inputBusca = document.getElementById('inputBusca');
    const inputKwh   = document.getElementById('inputKwh');
    const inputKw    = document.getElementById('inputKw');
    if (inputBusca) inputBusca.value = '';
    if (inputKwh)   inputKwh.value   = inputKwh.max;
    if (inputKw)    inputKw.value    = 0;
    tiposFiltroAtivos = ['todos'];
    document.querySelectorAll('#chipsConector .chip').forEach(c => {
        c.classList.toggle('chip--active', c.dataset.tipo === 'todos');
    });
    aplicarFiltros();
}

function toggleChip(el) {
    const tipo = el.dataset.tipo;
    if (tipo === 'todos') {
        tiposFiltroAtivos = ['todos'];
        document.querySelectorAll('#chipsConector .chip').forEach(c =>
            c.classList.toggle('chip--active', c.dataset.tipo === 'todos'));
    } else {
        tiposFiltroAtivos = tiposFiltroAtivos.filter(t => t !== 'todos');
        document.querySelector('#chipsConector .chip[data-tipo="todos"]')?.classList.remove('chip--active');
        if (tiposFiltroAtivos.includes(tipo)) {
            tiposFiltroAtivos = tiposFiltroAtivos.filter(t => t !== tipo);
            el.classList.remove('chip--active');
        } else {
            tiposFiltroAtivos.push(tipo);
            el.classList.add('chip--active');
        }
        if (tiposFiltroAtivos.length === 0) {
            tiposFiltroAtivos = ['todos'];
            document.querySelector('#chipsConector .chip[data-tipo="todos"]')?.classList.add('chip--active');
        }
    }
    aplicarFiltros();
}

function toggleChipForm(el) { el.classList.toggle('chip--active'); }

function getTiposSelecionadosNoForm() {
    return [...document.querySelectorAll('#chipsFormConector .chip--active')].map(c => c.dataset.tipo);
}

// ─────────────────────────────────────────
// MODAL NOVO PONTO
// ─────────────────────────────────────────
window.abrirFormulario = function () {
    document.getElementById('formPonto').style.display = 'flex';
};

window.fecharFormulario = function () {
    const modal = document.getElementById('formPonto');
    if (modal) {
        modal.style.display = 'none';
        document.querySelectorAll('#formPonto input').forEach(i => i.value = '');
        document.querySelectorAll('#chipsFormConector .chip').forEach(c => c.classList.remove('chip--active'));
    }
};

// ─────────────────────────────────────────
// FOCO
// ─────────────────────────────────────────
function focarPonto(lat, lng, id) {
    map.setView([lat, lng], 16);
    markers[id].openPopup();
}

// ─────────────────────────────────────────
// SALVAR PONTO
// ─────────────────────────────────────────
window.salvarPonto = function () {
    const nome             = document.getElementById('nome_posto').value.trim();
    const lat              = document.getElementById('lat').value;
    const lng              = document.getElementById('lng').value;
    const consumo          = document.getElementById('consumo').value;
    const preco_start      = document.getElementById('preco_start').value;
    const preco_kwh        = document.getElementById('preco_kwh').value;
    const preco_ociosidade = document.getElementById('preco_ociosidade').value;
    const tipos_carregador = getTiposSelecionadosNoForm();

    if (!nome || !lat || !lng) { alert('Preencha Nome, Latitude e Longitude!'); return; }

    fetch('/salvar-ponto/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-CSRFToken': getCSRFToken() },
        body: JSON.stringify({ nome, lat, lng, consumo, preco_start, preco_kwh, preco_ociosidade, tipos_carregador })
    })
    .then(r => r.json())
    .then(data => {
        if (data.id) {
            processarNovoPonto(
                parseFloat(lat), parseFloat(lng), data.id,
                parseFloat(consumo) || 0, nome,
                parseFloat(preco_start) || 0,
                parseFloat(preco_kwh) || 0,
                parseFloat(preco_ociosidade) || 0,
                tipos_carregador, null, 0
            );
            fecharFormulario();
        } else {
            alert('Erro ao salvar: ' + (data.error || 'Erro desconhecido'));
        }
    });
};

// ─────────────────────────────────────────
// REMOVER PONTO
// ─────────────────────────────────────────
window.removerPonto = function (id) {
    if (!confirm('Confirmar exclusão?')) return;
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
};

// ─────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────
function getCSRFToken() {
    const value = `; ${document.cookie}`;
    const parts = value.split('; csrftoken=');
    if (parts.length === 2) return parts.pop().split(';').shift();
}

function labelDoTipo(tipo) {
    const mapa = {
        tipo1: 'Tipo 1', tipo2: 'Tipo 2', ccs1: 'CCS 1', ccs2: 'CCS 2',
        chademo: 'CHAdeMO', gbdc: 'GB/T DC', tesla: 'Tesla', schuko: 'Schuko',
    };
    return mapa[tipo] || tipo;
}