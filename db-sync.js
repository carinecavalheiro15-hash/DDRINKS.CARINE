// ============================================================
// Ponte entre o app (localStorage) e o banco MySQL, via o servidor local
// (server/server.js, precisa estar rodando em http://localhost:3300).
//
// Como funciona: na abertura da página, busca cada chave no banco ANTES do
// resto do app rodar (por isso a checagem é síncrona) e só então libera a
// execução — assim todo o código existente do app continua lendo/escrevendo
// no localStorage normalmente, sem precisar mudar nada nele. Toda escrita no
// localStorage é espelhada pro banco em segundo plano, com um pequeno atraso
// pra agrupar mudanças rápidas em seguida (ex: digitando um campo).
//
// Se o servidor não estiver rodando, o app continua funcionando normalmente,
// só que sem salvar no banco (como era antes) — nunca trava por causa disso.
// ============================================================
(function () {
    // Se a própria página foi aberta por um link https (ex: GitHub Pages), só dá pra usar o
    // servidor também em https — o navegador bloqueia uma página https chamando algo em http
    // ("conteúdo misto"). Se a página foi aberta local (file://) ou por http, usa http mesmo
    // (mais simples, sem aviso de certificado). Em qualquer um dos casos, tenta "localhost"
    // primeiro (quando quem abre é o próprio computador que roda o servidor) e cai pro IP da
    // rede Wi-Fi local, pra tablets/celulares/outros computadores NA MESMA REDE também
    // conseguirem. Isso só funciona dentro dessa rede; de fora (ex: dados móveis), ainda não
    // alcança. Se o IP da rede do computador mudar, essa lista precisa ser atualizada.
    var API_BASE_CANDIDATOS = window.location.protocol === 'https:'
        ? ['https://192.168.3.20:3301/api']
        : ['http://localhost:3300/api', 'http://192.168.3.20:3300/api'];
    var API_BASE = API_BASE_CANDIDATOS[0];

    // localStorage key -> onde isso vive na API
    var SYNC_KEYS = {
        orcamentos: { type: 'collection', endpoint: 'orcamentos' },
        fornecedores: { type: 'collection', endpoint: 'fornecedores' },
        ddrinks_vouchers: { type: 'collection', endpoint: 'vouchers' },
        ddrinks_cerimonialistas: { type: 'collection', endpoint: 'cerimonialistas' },
        ddrinks_pacotes_promo: { type: 'collection', endpoint: 'pacotes-promocionais' },
        drinksCustomizados: { type: 'collection', endpoint: 'drinks-customizados' },
        ddrinks_fichas: { type: 'collection', endpoint: 'fichas-tecnicas' },
        ddrinks_estoque: { type: 'collection', endpoint: 'estoque-itens' },
        loginFoto: { type: 'config', endpoint: 'loginFoto' },
        usuario: { type: 'config', endpoint: 'usuario' },
        ddrinksInstagramUrl: { type: 'config', endpoint: 'ddrinksInstagramUrl' },
        ddrinksCardapioDesconto: { type: 'config', endpoint: 'ddrinksCardapioDesconto' },
        ddrinksCardapioBaseUrl: { type: 'config', endpoint: 'ddrinksCardapioBaseUrl' },
        ddrinks_hist: { type: 'config', endpoint: 'ddrinks_hist' },
        ddrinks_ev_proc: { type: 'config', endpoint: 'ddrinks_ev_proc' },
        ddrinksPrecosOverride: { type: 'config', endpoint: 'ddrinksPrecosOverride' },
        ddrinksDrinksInativos: { type: 'config', endpoint: 'ddrinksDrinksInativos' },
        ddrinksDrinksExcluidos: { type: 'config', endpoint: 'ddrinksDrinksExcluidos' },
        ddrinks_marcas_pacotes: { type: 'config', endpoint: 'ddrinks_marcas_pacotes' }
    };

    function syncRequest(method, url, body) {
        var xhr = new XMLHttpRequest();
        xhr.open(method, url, false); // síncrono, de propósito (ver comentário acima)
        if (body !== undefined) xhr.setRequestHeader('Content-Type', 'application/json');
        xhr.send(body !== undefined ? JSON.stringify(body) : null);
        if (xhr.status < 200 || xhr.status >= 300) throw new Error('HTTP ' + xhr.status + ' em ' + url);
        return xhr.responseText ? JSON.parse(xhr.responseText) : null;
    }

    function carimbo(item) { return Number(item && item._atualizadoEm) || 0; }
    function ordenarPorId(lista) {
        return lista.slice().sort(function (a, b) { return String(a && a.id).localeCompare(String(b && b.id)); });
    }
    function semCarimbo(item) {
        var copia = {};
        Object.keys(item).forEach(function (k) { if (k !== '_atualizadoEm') copia[k] = item[k]; });
        return JSON.stringify(copia);
    }
    // Recebe o valor novo de uma coleção (texto JSON) e devolve o mesmo valor com
    // "_atualizadoEm" = agora nos itens que mudaram em relação ao que estava gravado; os que não
    // mudaram mantêm o carimbo anterior. É isso que permite saber, entre dois aparelhos, qual
    // versão de um evento/drink é a mais nova.
    function carimbarAlteracoes(valorNovo, valorAnterior) {
        try {
            var novos = JSON.parse(valorNovo);
            if (!Array.isArray(novos)) return valorNovo;
            var anteriores = {};
            try {
                (JSON.parse(valorAnterior || '[]') || []).forEach(function (it) { if (it && it.id != null) anteriores[it.id] = it; });
            } catch (e) { /* valor anterior ilegível: trata tudo como novo */ }
            var agora = Date.now();
            novos.forEach(function (it) {
                if (!it || typeof it !== 'object' || it.id == null) return;
                var antes = anteriores[it.id];
                if (antes && semCarimbo(antes) === semCarimbo(it)) {
                    if (antes._atualizadoEm) it._atualizadoEm = antes._atualizadoEm;
                } else {
                    it._atualizadoEm = agora;
                }
            });
            return JSON.stringify(novos);
        } catch (e) {
            return valorNovo;
        }
    }

    var online = false;
    for (var i = 0; i < API_BASE_CANDIDATOS.length; i++) {
        try {
            API_BASE = API_BASE_CANDIDATOS[i];
            syncRequest('GET', API_BASE + '/health');
            online = true;
            break;
        } catch (e) {
            online = false;
        }
    }
    window.__ddrinksDbOnline = online;
    // Pra outras partes do app (ex: upload de foto do cardápio digital) usarem o mesmo
    // endereço que funcionou aqui, em vez de um "localhost" fixo que só funciona neste PC.
    window.__ddrinksApiBase = API_BASE;

    if (online) {
        Object.keys(SYNC_KEYS).forEach(function (key) {
            var cfg = SYNC_KEYS[key];
            try {
                if (cfg.type === 'collection') {
                    var remoto = syncRequest('GET', API_BASE + '/collections/' + cfg.endpoint) || [];
                    var localRaw = localStorage.getItem(key);
                    var local = localRaw ? JSON.parse(localRaw) : [];
                    if (remoto.length && local.length) {
                        // Tem dado dos dois lados: junta tudo por id (não apaga itens que só
                        // existem num dos lados). Quando o mesmo id existe nos dois, vence a
                        // versão ALTERADA POR ÚLTIMO (campo _atualizadoEm, carimbado a cada
                        // gravação — ver carimbarAlteracoes). Antes vencia sempre a cópia deste
                        // aparelho: um aparelho com dados velhos sobrescrevia no banco o que
                        // tinha sido editado em outro, e cada um ficava vendo a sua versão.
                        //
                        // Transição: itens gravados antes do carimbo existir não têm data dos
                        // dois lados; nesse caso fica a cópia deste aparelho (comportamento
                        // antigo) e ela ganha o carimbo agora.
                        var agora = Date.now();
                        var porId = {};
                        remoto.forEach(function (item) { if (item && item.id != null) porId[item.id] = item; });
                        local.forEach(function (item) {
                            if (!item || item.id == null) return;
                            var r = porId[item.id];
                            if (!r) { porId[item.id] = item; return; }
                            var tl = carimbo(item), tr = carimbo(r);
                            if (!tl && !tr) { item._atualizadoEm = agora; porId[item.id] = item; }
                            else if (tl > tr) porId[item.id] = item;
                            // senão fica a do banco (mais nova)
                        });
                        var mesclado = Object.keys(porId).map(function (id) { return porId[id]; });
                        localStorage.setItem(key, JSON.stringify(mesclado));
                        // Só regrava no banco se a junção mudou alguma coisa em relação a ele.
                        if (JSON.stringify(ordenarPorId(mesclado)) !== JSON.stringify(ordenarPorId(remoto))) {
                            syncRequest('PUT', API_BASE + '/collections/' + cfg.endpoint, mesclado);
                        }
                    } else if (remoto.length) {
                        // banco tem dado, navegador não tem nada local -> banco manda
                        localStorage.setItem(key, JSON.stringify(remoto));
                    } else if (local.length) {
                        // banco vazio + já existe dado no navegador -> primeira sincronização,
                        // manda o que já existe pro banco em vez de apagar tudo
                        syncRequest('PUT', API_BASE + '/collections/' + cfg.endpoint, local);
                    } else if (localRaw !== null) {
                        // banco vazio e navegador "vazio" (ex: "[]") -> remove a chave em vez de
                        // deixar "[]" gravado. Algumas telas (fichas técnicas, drinks) usam a
                        // AUSÊNCIA da chave pra cair num catálogo padrão embutido no app; gravar
                        // "[]" aqui apaga esse catálogo padrão sem querer.
                        localStorage.removeItem(key);
                    }
                } else {
                    var resp = syncRequest('GET', API_BASE + '/config/' + cfg.endpoint);
                    var localValor = localStorage.getItem(key);
                    if (!resp.exists && localValor != null) {
                        syncRequest('PUT', API_BASE + '/config/' + cfg.endpoint, { valor: localValor });
                    } else if (resp.exists) {
                        if (resp.valor == null) localStorage.removeItem(key);
                        else localStorage.setItem(key, resp.valor);
                    }
                }
            } catch (e) {
                console.warn('DDrinks: falha ao sincronizar "' + key + '" com o banco:', e);
            }
        });
    } else {
        console.warn('DDrinks: servidor do banco não respondeu em nenhum endereço (' + API_BASE_CANDIDATOS.join(', ') + ') — rodando só com este navegador, como antes.');
    }

    // ---- A partir daqui, espelha toda escrita no localStorage pro banco ----
    var _setItem = localStorage.setItem.bind(localStorage);
    var _removeItem = localStorage.removeItem.bind(localStorage);
    var timers = {};

    function agendarEnvio(key) {
        if (!window.__ddrinksDbOnline) return;
        var cfg = SYNC_KEYS[key];
        if (!cfg) return;
        clearTimeout(timers[key]);
        timers[key] = setTimeout(function () {
            try {
                if (cfg.type === 'collection') {
                    var raw = localStorage.getItem(key);
                    var lista = raw ? JSON.parse(raw) : [];
                    fetch(API_BASE + '/collections/' + cfg.endpoint, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(lista)
                    }).catch(function (e) { console.warn('DDrinks: erro ao salvar "' + key + '" no banco:', e); });
                } else {
                    var valor = localStorage.getItem(key);
                    fetch(API_BASE + '/config/' + cfg.endpoint, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ valor: valor })
                    }).catch(function (e) { console.warn('DDrinks: erro ao salvar "' + key + '" no banco:', e); });
                }
            } catch (e) {
                console.warn('DDrinks: erro ao preparar sincronização de "' + key + '":', e);
            }
        }, 600);
    }

    localStorage.setItem = function (key, value) {
        if (SYNC_KEYS[key] && SYNC_KEYS[key].type === 'collection') {
            value = carimbarAlteracoes(String(value), localStorage.getItem(key));
        }
        _setItem(key, value);
        if (SYNC_KEYS[key]) agendarEnvio(key);
    };
    localStorage.removeItem = function (key) {
        _removeItem(key);
        if (SYNC_KEYS[key]) agendarEnvio(key);
    };
})();
