// Servidor local do sistema DDrinks — conecta o app (index.html) ao MySQL.
// Rode com start.bat (ou "npm start" nesta pasta) antes de abrir o app.
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
const https = require('https');
const { exec } = require('child_process');
const selfsigned = require('selfsigned');

// Caminho completo do git.exe — necessário porque, rodando como Serviço do Windows
// (conta LocalSystem), o PATH não inclui o Git instalado só no perfil do usuário.
const GIT_BIN = process.env.GIT_BIN || 'C:\\Users\\CarineCavalheiro\\AppData\\Local\\Programs\\Git\\cmd\\git.exe';

// Arquivo de credenciais do GitHub (usuário:token), só pra esse servidor usar no "git push".
// Rodando como Serviço do Windows (conta LocalSystem), o login do GitHub salvo na sua conta
// de usuário não fica visível pra esse processo — por isso usamos um arquivo à parte, criado
// manualmente (nunca commitado, ver .gitignore). Veja server/COMO_CONFIGURAR_GIT_TOKEN.md.
const GIT_CREDENTIALS_FILE = (process.env.GIT_CREDENTIALS_FILE || path.join(__dirname, '.git-credentials')).replace(/\\/g, '/');

const PORT = process.env.PORT || 3300;
const PORTA_HTTPS = process.env.PORTA_HTTPS || 3301;
// IPs/nomes que o certificado precisa cobrir — adicione aqui se o IP da rede mudar.
const HOSTS_CERTIFICADO = (process.env.HOSTS_CERTIFICADO || 'localhost,127.0.0.1,192.168.3.20').split(',');

const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'ddrinks_app',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'ddrinks',
    waitForConnections: true,
    connectionLimit: 10,
    dateStrings: true
});

// Coleções (arrays de objetos com id) e as colunas extras que cada uma extrai do
// JSON pra permitir filtrar/consultar direto em SQL, além de guardar tudo em "dados".
const COLLECTIONS = {
    orcamentos: {
        table: 'orcamentos', idField: 'id',
        columns: (item) => ({
            cliente: item.cliente || null,
            telefone: item.telefone || null,
            cidade: item.cidade || null,
            data_evento: extrairDataISO(item.data),
            status: item.status || null,
            pacote: item.pacote || null,
            valor: item.valor != null && item.valor !== '' ? item.valor : null
        })
    },
    fornecedores: {
        table: 'fornecedores', idField: 'id',
        columns: (item) => ({
            nome: item.nome || null,
            servico: item.servico || null,
            telefone: item.telefone || null,
            email: item.email || null
        })
    },
    vouchers: {
        table: 'vouchers', idField: 'id',
        columns: (item) => ({
            codigo: item.codigo || null,
            tipo: item.tipo || null,
            status: item.status || null
        })
    },
    cerimonialistas: {
        table: 'cerimonialistas', idField: 'id',
        columns: (item) => ({ nome: item.nome || null })
    },
    'pacotes-promocionais': {
        table: 'pacotes_promocionais', idField: 'id',
        columns: (item) => ({ nome: item.nome || null })
    },
    'drinks-customizados': {
        table: 'drinks_customizados', idField: 'id',
        columns: (item) => ({
            nome: item.nome || null,
            sabor: item.sabor || null,
            bronze: item.bronze != null && item.bronze !== '' ? item.bronze : null,
            prata: item.prata != null && item.prata !== '' ? item.prata : null,
            ouro: item.ouro != null && item.ouro !== '' ? item.ouro : null
        })
    },
    'fichas-tecnicas': {
        table: 'fichas_tecnicas', idField: 'id',
        columns: (item) => ({
            nome: item.nome || null,
            categoria: item.categoria || null,
            bronze: item.bronze != null && item.bronze !== '' ? item.bronze : null,
            prata: item.prata != null && item.prata !== '' ? item.prata : null,
            ouro: item.ouro != null && item.ouro !== '' ? item.ouro : null
        })
    },
    'estoque-itens': {
        table: 'estoque_itens', idField: 'id',
        columns: (item) => ({
            nome: item.nome || null,
            unidade: item.unidade || null,
            quantidade: item.quantidade != null && item.quantidade !== '' ? item.quantidade : null
        })
    }
};

function extrairDataISO(raw) {
    if (!raw || typeof raw !== 'string') return null;
    if (/^\d{4}-\d{2}-\d{2}/.test(raw)) return raw.slice(0, 10);
    const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(raw);
    if (m) return `${m[3]}-${m[2]}-${m[1]}`;
    return null;
}

const app = express();
app.use(cors({ origin: true }));
app.use(express.json({ limit: '25mb' }));

// Serve o próprio app (index.html, db-sync.js, cardapio/ etc.) junto com a API, no mesmo
// endereço e protocolo (http://<ip-da-rede>:3300/). Importante pra quem acessa por um link
// https (ex: GitHub Pages): o navegador bloqueia uma página https tentando falar com uma API
// http ("conteúdo misto") — servindo tudo daqui, não tem mistura de protocolo.
// A pasta server/ fica de fora: tem a chave privada do certificado HTTPS (certs/key.pem),
// logs e o schema, que não podem ser baixados por qualquer um na rede.
app.use('/server', (req, res) => res.status(404).end());
app.use(express.static(path.join(__dirname, '..')));

app.get('/api/health', async (req, res) => {
    try {
        await pool.query('SELECT 1');
        res.json({ ok: true });
    } catch (e) {
        res.status(500).json({ ok: false, error: e.message });
    }
});

// ---- Fotos do cardápio digital (casal e drinks) ----
// Salva a imagem como arquivo de verdade dentro de cardapio/ (em vez de embutir a foto no
// link do QR Code, o que deixaria o QR grande demais pra escanear) e tenta publicar no
// GitHub automaticamente — se não conseguir (sem internet, repo não configurado etc.), a
// foto continua funcionando normalmente neste computador, só não fica visível pra quem
// escanear o QR Code longe daqui até alguém publicar manualmente.
//
// Trocar a foto mantém o MESMO nome de arquivo (assim os QR Codes já impressos continuam
// apontando pra ela), mas navegador e GitHub Pages guardam a versão antiga em cache. Por
// isso cada troca grava em cardapio/fotos/versoes.json o caminho atual + "?v=<timestamp>";
// a página do cardápio lê esse arquivo (sem cache) e usa sempre a versão mais nova.
const VERSOES_FOTOS_REL = ['cardapio', 'fotos', 'versoes.json'];

function registrarVersaoFoto(repoDir, chave, caminhoComVersao) {
    const arquivo = path.join(repoDir, ...VERSOES_FOTOS_REL);
    let versoes = {};
    try { versoes = JSON.parse(fs.readFileSync(arquivo, 'utf8')) || {}; } catch (e) { versoes = {}; }
    versoes[chave] = caminhoComVersao;
    fs.writeFileSync(arquivo, JSON.stringify(versoes, null, 2));
}

// Publicações em fila: duas fotos enviadas em seguida disputavam o .git/index.lock e a
// segunda ficava sem publicar. "add -A cardapio/fotos" também leva qualquer foto que tenha
// ficado pendente de uma tentativa anterior que falhou (ex: sem internet).
let filaPublicacao = Promise.resolve();
function publicarFotosNoGit(repoDir, mensagemCommit, rotulo) {
    // "-c credential.helper=" (vazio) zera qualquer helper herdado (ex: o "manager" da sua
    // conta, que tentaria abrir uma janela/navegador e travaria rodando como serviço) antes
    // de usar só o arquivo de token dedicado, pra essa chamada de push especificamente.
    // -c user.name/user.email: rodando como LocalSystem não existe gitconfig de usuário com
    // esses dados preenchidos, e o git recusa o commit sem eles ("Author identity unknown").
    const comandoAdd = `"${GIT_BIN}" add -A cardapio/fotos`;
    const comandoCommit = `"${GIT_BIN}" -c user.name="DDrinks Servidor" -c user.email="ddrinks-servidor@local" commit -m "${mensagemCommit}"`;
    const comandoPush = `"${GIT_BIN}" -c credential.helper= -c credential.helper="store --file=${GIT_CREDENTIALS_FILE}" push origin main`;
    filaPublicacao = filaPublicacao.then(() => new Promise(resolve => {
        exec(`${comandoAdd} && ${comandoCommit} && ${comandoPush}`, { cwd: repoDir }, (err, stdout, stderr) => {
            if (err) console.warn('⚠️  Não consegui publicar a foto automaticamente no GitHub (ela continua funcionando neste computador):', ((stderr || '').trim() || (stdout || '').trim() || err.message).split('\n')[0]);
            else console.log('✓ Foto publicada no GitHub:', rotulo);
            resolve();
        });
    }));
}

function salvarFotoEPublicar({ dataUrl, subpasta, nomeBase, mensagemCommit }, res) {
    const match = /^data:image\/(png|jpe?g|webp);base64,(.+)$/i.exec(dataUrl);
    if (!match) {
        res.status(400).json({ error: 'Formato de imagem não suportado (use JPG, PNG ou WEBP).' });
        return;
    }
    // nomeBase vem do navegador e vira nome de arquivo e parte de um comando de shell:
    // só letras, números, "_" e "-" (evita sair da pasta ou injetar comando).
    const base = String(nomeBase).replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 80);
    if (!base) {
        res.status(400).json({ error: 'Identificador inválido.' });
        return;
    }
    const ext = match[1].toLowerCase() === 'jpeg' ? 'jpg' : match[1].toLowerCase();
    const buffer = Buffer.from(match[2], 'base64');

    const repoDir = path.join(__dirname, '..');
    const destDir = path.join(repoDir, 'cardapio', ...subpasta);
    fs.mkdirSync(destDir, { recursive: true });

    // Se a foto anterior tinha outra extensão (ex: .jpg e agora .png), apaga a antiga pra
    // não ficarem duas versões do mesmo drink/evento.
    for (const outraExt of ['png', 'jpg', 'webp']) {
        if (outraExt === ext) continue;
        const antiga = path.join(destDir, `${base}.${outraExt}`);
        if (fs.existsSync(antiga)) fs.unlinkSync(antiga);
    }

    const filename = `${base}.${ext}`;
    fs.writeFileSync(path.join(destDir, filename), buffer);
    const caminhoRelativo = [...subpasta, filename].join('/');
    const versao = Date.now();
    registrarVersaoFoto(repoDir, [...subpasta, base].join('/'), `${caminhoRelativo}?v=${versao}`);

    res.json({ ok: true, caminho: caminhoRelativo, versao });

    publicarFotosNoGit(repoDir, mensagemCommit.replace(/[^\w\s().-]/g, '_'), filename);
}

app.post('/api/cardapio/foto', (req, res) => {
    try {
        const { orcamentoId, dataUrl } = req.body || {};
        if (!orcamentoId || !dataUrl) {
            return res.status(400).json({ error: 'orcamentoId e dataUrl são obrigatórios.' });
        }
        salvarFotoEPublicar({
            dataUrl,
            subpasta: ['fotos'],
            nomeBase: String(orcamentoId),
            mensagemCommit: `Adiciona foto do casal (evento ${orcamentoId})`
        }, res);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.post('/api/cardapio/foto-drink', (req, res) => {
    try {
        const { drinkId, dataUrl } = req.body || {};
        if (!drinkId || !dataUrl) {
            return res.status(400).json({ error: 'drinkId e dataUrl são obrigatórios.' });
        }
        salvarFotoEPublicar({
            dataUrl,
            subpasta: ['fotos', 'drinks'],
            nomeBase: String(drinkId),
            mensagemCommit: `Adiciona foto do drink (${drinkId})`
        }, res);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// ---- Documentos anexados aos eventos (tabela orcamento_documentos) ----

// Mesmo documento = mesmo orçamento + nome + tamanho (evita duplicar ao migrar anexos antigos)
async function inserirDocumentoSeNaoExistir(conn, orcamentoId, d) {
    const [existe] = await conn.query(
        'SELECT id FROM orcamento_documentos WHERE orcamento_id = ? AND nome <=> ? AND tamanho <=> ? LIMIT 1',
        [orcamentoId, d.nome || null, d.tamanho || null]
    );
    if (existe.length) return existe[0].id;
    const [r] = await conn.query(
        'INSERT INTO orcamento_documentos (orcamento_id, nome, tipo, tamanho, dados, data_upload) VALUES (?,?,?,?,?,?)',
        [orcamentoId, d.nome || null, d.tipo || null, d.tamanho || null, d.dados, d.dataUpload ? new Date(d.dataUpload) : new Date()]
    );
    return r.insertId;
}

app.post('/api/orcamentos/:id/documentos', async (req, res) => {
    const d = req.body || {};
    if (typeof d.dados !== 'string' || !d.dados.startsWith('data:')) {
        return res.status(400).json({ error: 'Arquivo inválido.' });
    }
    try {
        const docId = await inserirDocumentoSeNaoExistir(pool, req.params.id, d);
        res.json({ ok: true, docId });
    } catch (e) {
        if (e.code === 'ER_NO_REFERENCED_ROW_2') {
            return res.status(409).json({ error: 'o evento ainda não foi salvo no banco; aguarde alguns segundos e tente de novo.' });
        }
        res.status(500).json({ error: e.message });
    }
});

app.get('/api/documentos/:docId', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT nome, tipo, dados FROM orcamento_documentos WHERE id = ?', [req.params.docId]);
        if (!rows.length) return res.status(404).json({ error: 'Documento não encontrado.' });
        res.json(rows[0]);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.delete('/api/documentos/:docId', async (req, res) => {
    try {
        const [r] = await pool.query('DELETE FROM orcamento_documentos WHERE id = ?', [req.params.docId]);
        if (!r.affectedRows) return res.status(404).json({ error: 'Documento não encontrado.' });
        res.json({ ok: true });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// ---- Coleções (orçamentos, fornecedores, vouchers, etc.) ----

app.get('/api/collections/:name', async (req, res) => {
    const cfg = COLLECTIONS[req.params.name];
    if (!cfg) return res.status(404).json({ error: 'coleção desconhecida: ' + req.params.name });
    try {
        const [rows] = await pool.query(`SELECT dados FROM ${cfg.table}`);
        res.json(rows.map(r => (typeof r.dados === 'string' ? JSON.parse(r.dados) : r.dados)));
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.put('/api/collections/:name', async (req, res) => {
    const cfg = COLLECTIONS[req.params.name];
    if (!cfg) return res.status(404).json({ error: 'coleção desconhecida: ' + req.params.name });
    const items = Array.isArray(req.body) ? req.body : [];

    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();

        const ids = items.map(it => String(it[cfg.idField]));
        if (ids.length) {
            await conn.query(`DELETE FROM ${cfg.table} WHERE ${cfg.idField} NOT IN (?)`, [ids]);
        } else {
            await conn.query(`DELETE FROM ${cfg.table}`);
        }

        for (const item of items) {
            if (item[cfg.idField] == null) continue; // sem id não dá pra salvar/atualizar com segurança
            const extra = cfg.columns(item);
            const cols = [cfg.idField, ...Object.keys(extra), 'dados'];
            const vals = [item[cfg.idField], ...Object.values(extra), JSON.stringify(item)];
            const placeholders = cols.map(() => '?').join(',');
            const updates = cols.filter(c => c !== cfg.idField).map(c => `${c}=VALUES(${c})`).join(',');
            await conn.query(
                `INSERT INTO ${cfg.table} (${cols.join(',')}) VALUES (${placeholders}) ON DUPLICATE KEY UPDATE ${updates}`,
                vals
            );

            // Orçamentos (tela "Eventos"): além do JSON completo em "dados", explode
            // pagamentos e documentos anexados em tabelas próprias, pra dar pra ver e
            // consultar direto no MySQL Workbench sem abrir o JSON.
            if (req.params.name === 'orcamentos') {
                await conn.query('DELETE FROM orcamento_pagamentos WHERE orcamento_id = ?', [item.id]);
                const pagamentos = Array.isArray(item.pagamentos)
                    ? item.pagamentos
                    : (item.pagamentos && item.pagamentos.valor ? [item.pagamentos] : []);
                for (const p of pagamentos) {
                    await conn.query(
                        'INSERT INTO orcamento_pagamentos (orcamento_id, valor, forma, data_pagamento, observacoes) VALUES (?,?,?,?,?)',
                        [item.id, p.valor != null ? p.valor : null, p.forma || null, extrairDataISO(p.data || p.dataPagamento), p.observacoes || null]
                    );
                }

                // Documentos: os novos já entram direto pelo POST /api/orcamentos/:id/documentos
                // (o orçamento só guarda a referência docId) e saem pelo DELETE /api/documentos/:id.
                // Aqui não apaga nada (um aparelho com dados desatualizados apagaria anexos de
                // outro); só grava anexos antigos ainda em base64, se ainda não estiverem no banco.
                const documentos = Array.isArray(item.contratos)
                    ? item.contratos
                    : (item.contratoAnexo ? [item.contratoAnexo] : []);
                for (const d of documentos) {
                    if (!d || d.docId || !d.dados) continue;
                    await inserirDocumentoSeNaoExistir(conn, item.id, d);
                }
            }
        }

        await conn.commit();
        res.json({ ok: true, total: items.length });
    } catch (e) {
        await conn.rollback();
        res.status(500).json({ error: e.message });
    } finally {
        conn.release();
    }
});

// ---- Config (valores avulsos: foto de login, usuário, config do cardápio, etc.) ----

app.get('/api/config/:key', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT valor FROM app_config WHERE chave = ?', [req.params.key]);
        res.json({ exists: rows.length > 0, valor: rows.length ? rows[0].valor : null });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.put('/api/config/:key', async (req, res) => {
    try {
        const valor = req.body && typeof req.body.valor === 'string' ? req.body.valor : null;
        await pool.query(
            'INSERT INTO app_config (chave, valor) VALUES (?, ?) ON DUPLICATE KEY UPDATE valor = VALUES(valor)',
            [req.params.key, valor]
        );
        res.json({ ok: true });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Gera (uma vez só, e reaproveita depois) um certificado HTTPS "caseiro" — necessário pra
// quem acessa o app por um link https (ex: GitHub Pages) conseguir falar com esse servidor
// sem o navegador bloquear por "conteúdo misto". Como não é de uma autoridade reconhecida,
// o navegador pede confirmação ("avançado > continuar mesmo assim") na primeira vez, por
// endereço — depois disso fica lembrado.
async function obterCertificadoHttps() {
    const certDir = path.join(__dirname, 'certs');
    const certPath = path.join(certDir, 'cert.pem');
    const keyPath = path.join(certDir, 'key.pem');
    if (fs.existsSync(certPath) && fs.existsSync(keyPath)) {
        return { cert: fs.readFileSync(certPath), key: fs.readFileSync(keyPath) };
    }
    fs.mkdirSync(certDir, { recursive: true });
    const pems = await selfsigned.generate(
        [{ name: 'commonName', value: HOSTS_CERTIFICADO[0] }],
        {
            days: 3650,
            keySize: 2048,
            algorithm: 'sha256',
            extensions: [{
                name: 'subjectAltName',
                altNames: HOSTS_CERTIFICADO.map(h =>
                    /^\d{1,3}(\.\d{1,3}){3}$/.test(h) ? { type: 7, ip: h } : { type: 2, value: h }
                )
            }]
        }
    );
    fs.writeFileSync(certPath, pems.cert);
    fs.writeFileSync(keyPath, pems.private);
    return { cert: pems.cert, key: pems.private };
}

// Bancos criados antes de uma coluna nova entrar no schema.sql não a recebem sozinhos
// ("CREATE TABLE IF NOT EXISTS" não altera tabela existente). Sem a coluna, TODA gravação da
// coleção falha (ex: fichas técnicas com bronze/prata/ouro -> "Unknown column 'bronze'"), e as
// fotos/edições de drinks nunca chegavam ao banco nem aos outros aparelhos. Aqui só ADICIONA
// o que falta; nunca apaga nem altera coluna existente.
const COLUNAS_OBRIGATORIAS = {
    fichas_tecnicas: { bronze: 'DECIMAL(10,2) NULL', prata: 'DECIMAL(10,2) NULL', ouro: 'DECIMAL(10,2) NULL' }
};
async function garantirColunas() {
    for (const [tabela, colunas] of Object.entries(COLUNAS_OBRIGATORIAS)) {
        try {
            const [rows] = await pool.query(
                'SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?',
                [tabela]
            );
            if (!rows.length) continue; // tabela ainda não existe: o schema.sql cria completa
            const existentes = new Set(rows.map(r => r.COLUMN_NAME));
            for (const [coluna, tipo] of Object.entries(colunas)) {
                if (existentes.has(coluna)) continue;
                await pool.query(`ALTER TABLE ${tabela} ADD COLUMN ${coluna} ${tipo}`);
                console.log(`✓ Coluna ${tabela}.${coluna} adicionada ao banco.`);
            }
        } catch (e) {
            console.error(`⚠️  Não consegui conferir/ajustar as colunas de ${tabela}:`, e.message);
        }
    }
}

garantirColunas().finally(() => {
    app.listen(PORT, () => {
        console.log(`\n  DDrinks + MySQL rodando em http://localhost:${PORT}`);
    });
});

obterCertificadoHttps()
    .then(({ cert, key }) => {
        https.createServer({ cert, key }, app).listen(PORTA_HTTPS, () => {
            console.log(`  Também em https://localhost:${PORTA_HTTPS} (certificado próprio — confirme "continuar mesmo assim" na 1ª vez em cada aparelho).`);
            console.log('  Deixe esta janela aberta enquanto usa o app. Pra fechar, feche esta janela ou Ctrl+C.\n');
        });
    })
    .catch((e) => {
        console.warn('⚠️  Não consegui iniciar o HTTPS (o app continua funcionando por HTTP):', e.message);
    });
