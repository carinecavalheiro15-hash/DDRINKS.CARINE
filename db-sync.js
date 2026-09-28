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
    var API_BASE = 'http://localhost:3300/api';

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
        ddrinks_ev_proc: { type: 'config', endpoint: 'ddrinks_ev_proc' }
    };

    function syncRequest(method, url, body) {
        var xhr = new XMLHttpRequest();
        xhr.open(method, url, false); // síncrono, de propósito (ver comentário acima)
        if (body !== undefined) xhr.setRequestHeader('Content-Type', 'application/json');
        xhr.send(body !== undefined ? JSON.stringify(body) : null);
        if (xhr.status < 200 || xhr.status >= 300) throw new Error('HTTP ' + xhr.status + ' em ' + url);
        return xhr.responseText ? JSON.parse(xhr.responseText) : null;
    }

    var online = false;
    try {
        syncRequest('GET', API_BASE + '/health');
        online = true;
    } catch (e) {
        online = false;
    }
    window.__ddrinksDbOnline = online;

    if (online) {
        Object.keys(SYNC_KEYS).forEach(function (key) {
            var cfg = SYNC_KEYS[key];
            try {
                if (cfg.type === 'collection') {
                    var remoto = syncRequest('GET', API_BASE + '/collections/' + cfg.endpoint) || [];
                    var localRaw = localStorage.getItem(key);
                    var local = localRaw ? JSON.parse(localRaw) : [];
                    if (!remoto.length && local.length) {
                        // banco vazio + já existe dado no navegador -> primeira sincronização,
                        // manda o que já existe pro banco em vez de apagar tudo
                        syncRequest('PUT', API_BASE + '/collections/' + cfg.endpoint, local);
                    } else {
                        localStorage.setItem(key, JSON.stringify(remoto));
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
        console.warn('DDrinks: servidor do banco (http://localhost:3300) não respondeu — rodando só com este navegador, como antes. Abra server/start.bat pra salvar no MySQL.');
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
        _setItem(key, value);
        if (SYNC_KEYS[key]) agendarEnvio(key);
    };
    localStorage.removeItem = function (key) {
        _removeItem(key);
        if (SYNC_KEYS[key]) agendarEnvio(key);
    };
})();
