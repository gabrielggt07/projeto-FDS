let map;
let markers    = {};
let dadosPontos = [];
let usuarioLogadoEhAdmin = false;
let tiposFiltroAtivos  = ['todos'];
let dispFiltroAtivo    = 'todos';

// ID do ponto sendo editado
let pontoEditandoDisp = null;
let estrelasEscolhidas  = 0;

// Contador de linhas de conector no formulário
let conectorFormCount = 0;

const TIPOS_LABEL = {
    tipo1:'Tipo 1 (J1772)', tipo2:'Tipo 2 (Mennekes)',
    ccs1:'CCS Combo 1', ccs2:'CCS Combo 2',
    chademo:'CHAdeMO', gbdc:'GB/T DC',
    tesla:'Tesla (NACS)', schuko:'Schuko',
};

// ─────────────────────────────────────────
// INICIALIZAÇÃO
// ─────────────────────────────────────────
function initDashboard(pontosIniciais, ehAdmin) {
    usuarioLogadoEhAdmin = ehAdmin;

    map = L.map('map').setView([-8.0476, -34.8770], 13);
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        attribution: '© OpenStreetMap contributors © CARTO',
        subdomains: 'abcd',
        maxZoom: 20
    }).addTo(map);

    pontosIniciais.forEach(p => {
        const tipos = p.tipos_carregador
            ? p.tipos_carregador.split(',').map(t => t.trim()).filter(Boolean)
            : [];
        // Garante valores padrão se não definidos
        p.vagas_livres = p.vagas_livres ?? ((p.conectores || []).filter(c => c.status === 'livre').length || 0);
        p.total_vagas = p.total_vagas ?? ((p.conectores || []).length || 0);
        processarNovoPonto({ ...p, tipos });
    });

    iniciarStarPicker();
    iniciarPolling();
}

// ─────────────────────────────────────────
// ADICIONAR / ATUALIZAR PONTO
// ─────────────────────────────────────────
function processarNovoPonto(p) {
    // Garante valores padrão para vagas se vazias
    if (!p.vagas_livres && !p.total_vagas) {
        p.total_vagas = (p.conectores || []).length || 0;
        p.vagas_livres = (p.conectores || []).filter(c => c.status === 'livre').length || 0;
    }
    
    const idx = dadosPontos.findIndex(x => x.id === p.id);
    if (idx >= 0) {
        dadosPontos[idx] = { ...dadosPontos[idx], ...p };
    } else {
        dadosPontos.push(p);
    }

    // Recria marcador
    if (markers[p.id]) {
        map.removeLayer(markers[p.id]);
        delete markers[p.id];
    }

    const iconHtml  = buildIconHtml(p);
    const iconRaio  = L.divIcon({
        html: iconHtml,
        className: 'custom-div-icon',
        iconSize:  [36, 50],
        iconAnchor:[18, 50],
    });

    const m = L.marker([p.lat, p.lng], { icon: iconRaio }).addTo(map);
    m.bindPopup(buildPopupHtml(p), { maxWidth: 240 });
    markers[p.id] = m;

    atualizarListaLateral();
}

// ─────────────────────────────────────────
// ÍCONE DO MARCADOR
// ─────────────────────────────────────────
function buildIconHtml(p) {
    const livres = p.vagas_livres ?? 0;
    const total  = p.total_vagas  ?? 0;
    const cor    = livres > 0 ? '#00e676' : '#ff3d5a';
    const emoji  = livres > 0 ? '⚡' : '🔴';

    return `
        <div style="text-align:center;position:relative;">
            <div style="font-size:26px;filter:drop-shadow(0 0 6px ${cor});">${emoji}</div>
            <div style="
                background:${cor};color:#04080f;
                font-size:9px;font-weight:800;
                border-radius:999px;padding:1px 5px;
                margin-top:-4px;display:inline-block;
                white-space:nowrap;line-height:1.4;">
                ${livres}/${total}
            </div>
            ${p.media ? `<div style="font-size:9px;color:#f59e0b;margin-top:1px;">${p.media}★</div>` : ''}
        </div>`;
}

// ─────────────────────────────────────────
// POPUP DO MAPA
// ─────────────────────────────────────────
function buildPopupHtml(p) {
    const livres = p.vagas_livres ?? 0;
    const total  = p.total_vagas  ?? 0;
    const corStatus = livres > 0 ? '#00e676' : '#ff3d5a';
    const txtStatus = livres > 0
        ? `🟢 <strong>${livres} vaga${livres !== 1 ? 's' : ''} livre${livres !== 1 ? 's' : ''}</strong>`
        : '🔴 <strong>Todas as vagas ocupadas</strong>';

    const conectoresHtml = (p.conectores || []).map(c => {
        const cor = c.status === 'livre' ? '#00e676' : c.status === 'ocupado' ? '#ff3d5a' : '#94a3b8';
        const dot = `<span style="display:inline-block;width:7px;height:7px;border-radius:50%;background:${cor};margin-right:5px;"></span>`;
        return `<div style="font-size:11px;color:#94a3b8;margin:2px 0;">${dot}${TIPOS_LABEL[c.tipo] || c.tipo} · ${c.potencia} kW</div>`;
    }).join('');

    const mediaHtml = p.media
        ? `${'★'.repeat(Math.round(p.media))}${'☆'.repeat(5 - Math.round(p.media))} <span style="font-size:11px;color:#7a91b0;">${p.media} (${p.total_aval})</span>`
        : '<span style="color:#3d5470;font-size:11px;">Sem avaliações</span>';

    // Link Google Maps
    const gmUrl = `https://www.google.com/maps/dir/?api=1&destination=${p.lat},${p.lng}&travelmode=driving`;

    return `
        <div style="min-width:200px;font-family:'DM Sans',sans-serif;">
            <strong style="font-size:14px;color:#e8f4fd;">${p.nome}</strong>

            <div style="margin:8px 0 4px;font-size:12px;color:${corStatus};">${txtStatus}</div>

            ${conectoresHtml
                ? `<div style="background:rgba(0,0,0,0.2);border-radius:8px;padding:8px;margin:6px 0;">${conectoresHtml}</div>`
                : ''}

            <hr style="border-color:rgba(0,230,118,0.15);margin:8px 0;">

            <div style="font-size:12px;color:#94a3b8;margin-bottom:4px;">
                💰 R$ ${p.preco_start.toFixed(2)} início &nbsp;·&nbsp;
                R$ ${p.preco_kwh.toFixed(2)}/kWh &nbsp;·&nbsp;
                R$ ${p.preco_ociosidade.toFixed(2)}/min
            </div>

            <div style="font-size:13px;color:#f59e0b;margin-bottom:10px;">${mediaHtml}</div>

            <div style="display:flex;gap:7px;">
                <button onclick="abrirAvaliacao(${p.id})"
                    style="flex:1;padding:8px;background:rgba(0,230,118,0.12);
                           border:1px solid rgba(0,230,118,0.3);border-radius:8px;
                           color:#00e676;font-weight:700;font-size:11px;cursor:pointer;">
                    ★ Avaliar
                </button>
                <a href="${gmUrl}" target="_blank" rel="noopener"
                    style="flex:1;padding:8px;background:rgba(66,133,244,0.15);
                           border:1px solid rgba(66,133,244,0.35);border-radius:8px;
                           color:#6ba3f5;font-weight:700;font-size:11px;cursor:pointer;
                           text-decoration:none;text-align:center;display:flex;
                           align-items:center;justify-content:center;gap:4px;">
                    🗺️ Rota
                </a>
            </div>
        </div>`;
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
        const livres    = p.vagas_livres ?? 0;
        const total     = p.total_vagas  ?? 0;
        const corStatus = livres > 0 ? 'var(--accent)' : 'var(--danger)';
        const txtStatus = livres > 0
            ? `🟢 ${livres} de ${total} vaga${total !== 1 ? 's' : ''} livre${livres !== 1 ? 's' : ''}`
            : `🔴 Todas ocupadas (${total} vaga${total !== 1 ? 's' : ''})`;

        const mediaHtml = p.media
            ? `${'★'.repeat(Math.round(p.media))}${'☆'.repeat(5 - Math.round(p.media))}
               <span style="color:var(--text-muted);font-size:11px;margin-left:4px;">(${p.total_aval})</span>`
            : `<span style="color:var(--text-muted);font-size:11px;">Sem avaliações</span>`;

        const gmUrl = `https://www.google.com/maps/dir/?api=1&destination=${p.lat},${p.lng}&travelmode=driving`;

        const div = document.createElement('div');
        div.className = 'item-ponto';
        div.dataset.id = p.id;
        div.innerHTML = `
            <div class="ponto-info">
                <span class="ponto-id">${p.nome}</span>

                <div class="status-badge" style="color:${corStatus};font-size:12px;font-weight:600;margin:4px 0;">
                    ${txtStatus}
                </div>

                <div style="font-size:13px;color:#f59e0b;margin:3px 0;">${mediaHtml}</div>

                <div class="preco-tags">
                    <span class="preco-tag">🟢 R$ ${p.preco_start.toFixed(2)} início</span>
                    <span class="preco-tag">⚡ R$ ${p.preco_kwh.toFixed(2)}/kWh</span>
                    <span class="preco-tag">⏱ R$ ${p.preco_ociosidade.toFixed(2)}/min</span>
                </div>

                <!-- Conectores individuais -->
                <div class="conectores-lista" id="conectores-${p.id}">
                    ${buildConectoresListHtml(p.conectores || [])}
                </div>
            </div>
            <div class="ponto-actions">
                <button class="btn btn-small" onclick="focarPonto(${p.lat},${p.lng},${p.id})">Ver</button>
                <button class="btn btn-small btn-ghost" onclick="abrirAvaliacao(${p.id})" style="width:auto;">★ Avaliar</button>
                <a href="${gmUrl}" target="_blank" rel="noopener" class="btn btn-small btn-maps">🗺️ Rota</a>
                ${usuarioLogadoEhAdmin
                    ? `<button class="btn btn-small" onclick="abrirEditarDisp(${p.id})" style="width:auto;">⚙️ Vagas</button>
                       <button class="btn btn-small btn-danger" onclick="removerPonto(${p.id})">Deletar</button>`
                    : ''}
            </div>
        `;
        container.appendChild(div);
    });
}

function buildConectoresListHtml(conectores) {
    if (!conectores.length) return '';
    return `<div class="conectores-grid">
        ${conectores.map(c => {
            const cor   = c.status === 'livre' ? '#00e676' : c.status === 'ocupado' ? '#ff3d5a' : '#94a3b8';
            const label = c.status === 'livre' ? 'Livre' : c.status === 'ocupado' ? 'Ocupado' : 'Inativo';
            return `
                <div class="conector-row">
                    <span class="conector-dot" style="background:${cor};box-shadow:0 0 5px ${cor};"></span>
                    <span class="conector-tipo">${TIPOS_LABEL[c.tipo] || c.tipo}</span>
                    <span class="conector-kw">${c.potencia} kW</span>
                    <span class="conector-status" style="color:${cor};">${label}</span>
                </div>`;
        }).join('')}
    </div>`;
}

// ─────────────────────────────────────────
// POLLING — status a cada 15s
// ─────────────────────────────────────────
function iniciarPolling() {
    setInterval(atualizarStatus, 15000);
}

function atualizarStatus() {
    fetch('/status-pontos/')
        .then(r => r.json())
        .then(data => {
            data.pontos.forEach(s => {
                const ponto = dadosPontos.find(p => p.id === s.id);
                if (!ponto) return;

                ponto.vagas_livres = s.vagas_livres;
                ponto.total_vagas  = s.total_vagas;
                ponto.conectores   = s.conectores;

                // Atualiza ícone no mapa
                if (markers[ponto.id]) {
                    markers[ponto.id].setIcon(L.divIcon({
                        html:      buildIconHtml(ponto),
                        className: 'custom-div-icon',
                        iconSize:  [36, 50],
                        iconAnchor:[18, 50],
                    }));
                    // Atualiza popup se estiver aberto
                    if (markers[ponto.id].isPopupOpen()) {
                        markers[ponto.id].setPopupContent(buildPopupHtml(ponto));
                    }
                }

                // Atualiza conectores na lista lateral (sem re-render completo)
                const conEl = document.getElementById(`conectores-${ponto.id}`);
                if (conEl) conEl.innerHTML = buildConectoresListHtml(ponto.conectores);

                // Atualiza badge de status na lista
                const itemEl = document.querySelector(`.item-ponto[data-id="${ponto.id}"] .status-badge`);
                if (itemEl) {
                    const livres = ponto.vagas_livres;
                    const total  = ponto.total_vagas;
                    const cor    = livres > 0 ? 'var(--accent)' : 'var(--danger)';
                    const txt    = livres > 0
                        ? `🟢 ${livres} de ${total} vaga${total !== 1 ? 's' : ''} livre${livres !== 1 ? 's' : ''}`
                        : `🔴 Todas ocupadas (${total} vaga${total !== 1 ? 's' : ''})`;
                    itemEl.style.color    = cor;
                    itemEl.textContent    = txt;
                }
            });
        })
        .catch(err => console.warn('Polling falhou:', err));
}

// ─────────────────────────────────────────
// FORMULÁRIO — CONECTORES DINÂMICOS
// ─────────────────────────────────────────
window.adicionarConectorForm = function () {
    conectorFormCount++;
    const idx = conectorFormCount;
    const div = document.createElement('div');
    div.className = 'conector-form-row';
    div.id = `conector-row-${idx}`;
    div.innerHTML = `
        <select class="form-control conector-tipo-sel" style="flex:2;">
            <option value="">Tipo de conector...</option>
            ${Object.entries(TIPOS_LABEL).map(([v, l]) =>
                `<option value="${v}">${l}</option>`
            ).join('')}
        </select>
        <input type="number" step="0.1" class="form-control conector-kw-inp" placeholder="kW" style="flex:1;">
        <button type="button" class="btn btn-small btn-danger" onclick="removerConectorForm(${idx})" style="flex-shrink:0;">✕</button>
    `;
    document.getElementById('listaConectoresForm').appendChild(div);
};

window.removerConectorForm = function (idx) {
    document.getElementById(`conector-row-${idx}`)?.remove();
};

function getConectoresDoForm() {
    const rows = document.querySelectorAll('#listaConectoresForm .conector-form-row');
    const result = [];
    rows.forEach(row => {
        const tipo     = row.querySelector('.conector-tipo-sel').value;
        const potencia = row.querySelector('.conector-kw-inp').value;
        if (tipo) result.push({ tipo, potencia: parseFloat(potencia) || 0 });
    });
    return result;
}

// ─────────────────────────────────────────
// FILTROS
// ─────────────────────────────────────────
function getPontosFiltrados() {
    const termo  = (document.getElementById('inputBusca')?.value || '').toLowerCase();
    const maxKwh = parseFloat(document.getElementById('inputKwh')?.value ?? 5);
    const minKw  = parseFloat(document.getElementById('inputKw')?.value ?? 0);

    return dadosPontos.filter(p => {
        const nomeBate  = p.nome.toLowerCase().includes(termo);
        const kwhBate   = p.preco_kwh <= maxKwh;
        const kwBate    = p.consumo >= minKw;
        const tipoBate  = tiposFiltroAtivos.includes('todos') ||
                          tiposFiltroAtivos.some(t => (p.tipos || []).includes(t));
        const dispBate  = dispFiltroAtivo === 'todos'   ? true
                        : dispFiltroAtivo === 'livres'  ? (p.vagas_livres > 0)
                        : dispFiltroAtivo === 'ocupado' ? (p.vagas_livres === 0 && p.total_vagas > 0)
                        : true;
        return nomeBate && kwhBate && kwBate && tipoBate && dispBate;
    });
}

function aplicarFiltros() {
    const kwh = parseFloat(document.getElementById('inputKwh')?.value ?? 5);
    const kw  = parseFloat(document.getElementById('inputKw')?.value ?? 0);
    const lKwh = document.getElementById('labelKwh');
    const lKw  = document.getElementById('labelKw');
    if (lKwh) lKwh.textContent = `R$ ${kwh.toFixed(2).replace('.', ',')}`;
    if (lKw)  lKw.textContent  = `${kw} kW`;

    const filtradosIds = new Set(getPontosFiltrados().map(p => p.id));
    dadosPontos.forEach(p => {
        if (filtradosIds.has(p.id)) {
            if (!map.hasLayer(markers[p.id])) markers[p.id]?.addTo(map);
        } else {
            if (map.hasLayer(markers[p.id])) map.removeLayer(markers[p.id]);
        }
    });
    atualizarListaLateral();
}

function resetarFiltros() {
    document.getElementById('inputBusca').value = '';
    document.getElementById('inputKwh').value   = document.getElementById('inputKwh').max;
    document.getElementById('inputKw').value    = 0;
    tiposFiltroAtivos = ['todos'];
    dispFiltroAtivo   = 'todos';
    document.querySelectorAll('#chipsConector .chip').forEach(c =>
        c.classList.toggle('chip--active', c.dataset.tipo === 'todos'));
    document.querySelectorAll('[data-disp]').forEach(c =>
        c.classList.toggle('chip--active', c.dataset.disp === 'todos'));
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

window.toggleDisp = function(el) {
    document.querySelectorAll('[data-disp]').forEach(c => c.classList.remove('chip--active'));
    el.classList.add('chip--active');
    dispFiltroAtivo = el.dataset.disp;
    aplicarFiltros();
};

// ─────────────────────────────────────────
// MODAIS
// ─────────────────────────────────────────
window.abrirFormulario = function () {
    document.getElementById('formPonto').style.display = 'flex';
};

window.fecharFormulario = function () {
    const modal = document.getElementById('formPonto');
    if (!modal) return;
    modal.style.display = 'none';
    document.querySelectorAll('#formPonto input, #formPonto textarea').forEach(i => i.value = '');
    document.getElementById('listaConectoresForm').innerHTML = '';
    conectorFormCount = 0;
};

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
    const conectores       = getConectoresDoForm();

    // tipos_carregador = tipos únicos dos conectores
    const tipos_carregador = [...new Set(conectores.map(c => c.tipo))];

    if (!nome || !lat || !lng) { alert('Preencha Nome, Latitude e Longitude!'); return; }

    fetch('/salvar-ponto/', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', 'X-CSRFToken': getCSRFToken() },
        body: JSON.stringify({
            nome, lat, lng, consumo,
            preco_start, preco_kwh, preco_ociosidade,
            tipos_carregador, conectores
        })
    })
    .then(r => r.json())
    .then(data => {
        if (data.id) {
            // Calcula vagas baseado nos conectores adicionados
            const vagasTotal = conectores.length;
            const vagasLivres = vagasTotal;

            const novoPonto = {
                id:               data.id,
                lat:              parseFloat(lat),
                lng:              parseFloat(lng),
                consumo:          parseFloat(consumo) || 0,
                nome,
                preco_start:      parseFloat(preco_start) || 0,
                preco_kwh:        parseFloat(preco_kwh) || 0,
                preco_ociosidade: parseFloat(preco_ociosidade) || 0,
                tipos:            tipos_carregador,
                media:            null,
                total_aval:       0,
                vagas_livres:     vagasLivres,
                total_vagas:      vagasTotal,
                conectores:       conectores.map((c, i) => ({
                    id: i, tipo: c.tipo, potencia: c.potencia, status: 'livre'
                })),
            };
            processarNovoPonto(novoPonto);
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
        method:  'POST',
        headers: { 'X-CSRFToken': getCSRFToken() }
    })
    .then(r => {
        if (r.ok) {
            map.removeLayer(markers[id]);
            delete markers[id];
            dadosPontos = dadosPontos.filter(p => p.id !== id);
            atualizarListaLateral();
        }
    });
};

// ─────────────────────────────────────────
// AVALIAÇÃO
// ─────────────────────────────────────────
window.abrirAvaliacao = function (id) {
    pontoAvaliacaoAtual = id;
    estrelasEscolhidas  = 0;
    atualizarStars(0);

    const ponto = dadosPontos.find(p => p.id === id);
    document.getElementById('avalNomePosto').textContent  = ponto?.nome || '—';
    document.getElementById('avalComentario').value       = '';
    document.getElementById('avalLista').innerHTML        = '<div class="aval-empty">Carregando...</div>';
    atualizarMediaHeader(ponto?.media, ponto?.total_aval);

    map.closePopup();
    document.getElementById('modalAvaliacao').style.display = 'flex';

    fetch(`/avaliacoes/${id}/`)
        .then(r => r.json())
        .then(data => {
            atualizarMediaHeader(data.media, data.total);
            renderListaAvaliacoes(data.avaliacoes);
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

window.fecharAvaliacao = function () {
    document.getElementById('modalAvaliacao').style.display = 'none';
    pontoAvaliacaoAtual = null;
};

window.enviarAvaliacao = function () {
    if (!estrelasEscolhidas) { alert('Selecione pelo menos 1 estrela!'); return; }
    const comentario = document.getElementById('avalComentario').value.trim();

    fetch(`/avaliar-ponto/${pontoAvaliacaoAtual}/`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', 'X-CSRFToken': getCSRFToken() },
        body:    JSON.stringify({ estrelas: estrelasEscolhidas, comentario })
    })
    .then(r => r.json())
    .then(data => {
        if (data.error) { alert('Erro: ' + data.error); return; }
        const ponto = dadosPontos.find(p => p.id === pontoAvaliacaoAtual);
        if (ponto) { ponto.media = data.media; ponto.total_aval = data.total; }
        atualizarMediaHeader(data.media, data.total);
        fetch(`/avaliacoes/${pontoAvaliacaoAtual}/`)
            .then(r => r.json())
            .then(d => renderListaAvaliacoes(d.avaliacoes));
        if (markers[pontoAvaliacaoAtual]) {
            markers[pontoAvaliacaoAtual].setIcon(L.divIcon({
                html: buildIconHtml(ponto),
                className: 'custom-div-icon',
                iconSize: [36, 50], iconAnchor: [18, 50],
            }));
        }
        atualizarListaLateral();
    });
};

function iniciarStarPicker() {
    document.querySelectorAll('#starPicker .star').forEach(star => {
        star.addEventListener('mouseover', () => atualizarStars(parseInt(star.dataset.val)));
        star.addEventListener('mouseout',  () => atualizarStars(estrelasEscolhidas));
        star.addEventListener('click',     () => { estrelasEscolhidas = parseInt(star.dataset.val); atualizarStars(estrelasEscolhidas); });
    });
}

function atualizarStars(val) {
    document.querySelectorAll('#starPicker .star').forEach(s =>
        s.classList.toggle('star--on', parseInt(s.dataset.val) <= val));
}

function atualizarMediaHeader(media, total) {
    const sEl = document.getElementById('avalMediaStars');
    const nEl = document.getElementById('avalMediaNum');
    if (!sEl || !nEl) return;
    if (media) {
        sEl.textContent = '★'.repeat(Math.round(media)) + '☆'.repeat(5 - Math.round(media));
        nEl.textContent = `${media} de 5 · ${total} avaliação${total !== 1 ? 'ões' : ''}`;
    } else {
        sEl.textContent = '☆☆☆☆☆';
        nEl.textContent = 'Sem avaliações ainda';
    }
}

function renderListaAvaliacoes(avals) {
    const el = document.getElementById('avalLista');
    if (!avals?.length) {
        el.innerHTML = '<div class="aval-empty">Nenhuma avaliação ainda. Seja o primeiro!</div>';
        return;
    }
    el.innerHTML = avals.map(a => `
        <div class="aval-item">
            <div class="aval-item-header">
                <span class="aval-usuario">👤 ${a.usuario}</span>
                <span class="aval-stars-sm">${'★'.repeat(a.estrelas)}${'☆'.repeat(5 - a.estrelas)}</span>
                <span class="aval-data">${a.data}</span>
            </div>
            ${a.comentario
                ? `<div class="aval-comentario">${a.comentario}</div>`
                : '<div class="aval-comentario" style="opacity:0.4;font-style:italic;">Sem comentário</div>'}
        </div>`).join('');
}

// ─────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────
function getCSRFToken() {
    const v = `; ${document.cookie}`;
    const p = v.split('; csrftoken=');
    if (p.length === 2) return p.pop().split(';').shift();
}

// ─────────────────────────────────────────
// EDITAR DISPONIBILIDADE DE CARREGADORES
// ─────────────────────────────────────────
window.abrirEditarDisp = function(id) {
    pontoEditandoDisp = id;
    const ponto = dadosPontos.find(p => p.id === id);
    if (!ponto) return;

    document.getElementById('modalDispTitle').textContent = `⚙️ Editar: ${ponto.nome}`;
    document.getElementById('modalDispSubtitle').textContent = 
        `${ponto.vagas_livres} de ${ponto.total_vagas} vaga${ponto.total_vagas !== 1 ? 's' : ''} disponível${ponto.vagas_livres !== 1 ? 's' : ''}`;

    // Renderiza conectores com checkboxes
    const listEl = document.getElementById('conectoresEditList');
    listEl.innerHTML = (ponto.conectores || []).map((c, idx) => `
        <div style="display:flex;align-items:center;gap:12px;padding:12px;background:var(--bg-item);border-radius:8px;margin-bottom:8px;">
            <input type="checkbox" id="conector-${idx}" class="conector-checkbox" 
                   ${c.status === 'livre' ? 'checked' : ''} 
                   data-idx="${idx}">
            <label for="conector-${idx}" style="flex:1;cursor:pointer;margin:0;">
                <div style="font-weight:600;color:var(--text-primary);">${TIPOS_LABEL[c.tipo] || c.tipo}</div>
                <div style="font-size:11px;color:var(--text-muted);">${c.potencia} kW</div>
            </label>
            <span style="font-size:12px;padding:4px 8px;border-radius:4px;${c.status === 'livre' ? 'background:rgba(0,230,118,0.15);color:var(--accent);' : 'background:rgba(255,61,90,0.15);color:var(--danger);'}">
                ${c.status === 'livre' ? '🟢 Livre' : c.status === 'ocupado' ? '🔴 Ocupado' : '⚫ Inativo'}
            </span>
        </div>
    `).join('');

    document.getElementById('modalEditarDisp').style.display = 'flex';
};

window.fecharEditarDisp = function() {
    document.getElementById('modalEditarDisp').style.display = 'none';
    pontoEditandoDisp = null;
};

window.salvarDisponibilidade = function() {
    if (!pontoEditandoDisp) return;
    
    const ponto = dadosPontos.find(p => p.id === pontoEditandoDisp);
    if (!ponto) return;

    // Lê os checkboxes
    const checkboxes = document.querySelectorAll('.conector-checkbox');
    const novosCronectores = (ponto.conectores || []).map((c, idx) => ({
        ...c,
        status: checkboxes[idx].checked ? 'livre' : 'ocupado'
    }));

    // Calcula vagas livres
    const novasVagasLivres = novosCronectores.filter(c => c.status === 'livre').length;
    const novasVagasTotal = novosCronectores.length;

    // Envia para servidor
    fetch(`/atualizar-disponibilidade/${pontoEditandoDisp}/`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', 'X-CSRFToken': getCSRFToken() },
        body: JSON.stringify({
            conectores: novosCronectores,
            vagas_livres: novasVagasLivres,
            total_vagas: novasVagasTotal
        })
    })
    .then(r => r.json())
    .then(data => {
        if (data.success) {
            // Atualiza dados locais
            ponto.conectores = novosCronectores;
            ponto.vagas_livres = novasVagasLivres;
            ponto.total_vagas = novasVagasTotal;

            // Atualiza marcador no mapa
            if (markers[pontoEditandoDisp]) {
                markers[pontoEditandoDisp].setIcon(L.divIcon({
                    html: buildIconHtml(ponto),
                    className: 'custom-div-icon',
                    iconSize: [36, 50],
                    iconAnchor: [18, 50],
                }));
                if (markers[pontoEditandoDisp].isPopupOpen()) {
                    markers[pontoEditandoDisp].setPopupContent(buildPopupHtml(ponto));
                }
            }

            // Atualiza lista
            atualizarListaLateral();
            fecharEditarDisp();
        } else {
            alert('Erro: ' + (data.error || 'Erro ao atualizar'));
        }
    })
    .catch(err => {
        console.error('Erro ao salvar disponibilidade:', err);
        alert('Erro ao salvar disponibilidade');
    });
};