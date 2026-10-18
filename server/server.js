// Servidor local do sistema DDrinks — conecta o app (index.html) ao MySQL.
// Rode com start.bat (ou "npm start" nesta pasta) antes de abrir o app.
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

// Caminho completo do git.exe — necessário porque, rodando como Serviço do Windows
// (conta LocalSystem), o PATH não inclui o Git instalado só no perfil do usuário.
const GIT_BIN = process.env.GIT_BIN || 'C:\\Users\\CarineCavalheiro\\AppData\\Local\\Programs\\Git\\cmd\\git.exe';

// Arquivo de credenciais do GitHub (usuário:token), só pra esse servidor usar no "git push".
// Rodando como Serviço do Windows (conta LocalSystem), o login do GitHub salvo na sua conta
// de usuário não fica visível pra esse processo — por isso usamos um arquivo à parte, criado
// manualmente (nunca commitado, ver .gitignore). Veja server/COMO_CONFIGURAR_GIT_TOKEN.md.
const GIT_CREDENTIALS_FILE = (process.env.GIT_CREDENTIALS_FILE || path.join(__dirname, '.git-credentials')).replace(/\\/g, '/');

const PORT = process.env.PORT || 3300;

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
        columns: (item) => ({ nome: item.nome || null, sabor: item.sabor || null })
    },
    'fichas-tecnicas': {
        table: 'fichas_tecnicas', idField: 'id',
        columns: (item) => ({ nome: item.nome || null, categoria: item.categoria || null })
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
function salvarFotoEPublicar({ dataUrl, subpasta, nomeBase, mensagemCommit }, res) {
    const match = /^data:image\/(png|jpe?g|webp);base64,(.+)$/i.exec(dataUrl);
    if (!match) {
        res.status(400).json({ error: 'Formato de imagem não suportado (use JPG, PNG ou WEBP).' });
        return;
    }
    const ext = match[1].toLowerCase() === 'jpeg' ? 'jpg' : match[1].toLowerCase();
    const buffer = Buffer.from(match[2], 'base64');

    const repoDir = path.join(__dirname, '..');
    const destDir = path.join(repoDir, 'cardapio', ...subpasta);
    fs.mkdirSync(destDir, { recursive: true });

    const filename = `${nomeBase}.${ext}`;
    fs.writeFileSync(path.join(destDir, filename), buffer);
    const caminhoRelativo = [...subpasta, filename].join('/');

    res.json({ ok: true, caminho: caminhoRelativo });

    const relPathGit = ['cardapio', ...subpasta, filename].join('/');
    // "-c credential.helper=" (vazio) zera qualquer helper herdado (ex: o "manager" da sua
    // conta, que tentaria abrir uma janela/navegador e travaria rodando como serviço) antes
    // de usar só o arquivo de token dedicado, pra essa chamada de push especificamente.
    // -c user.name/user.email: rodando como LocalSystem não existe gitconfig de usuário com
    // esses dados preenchidos, e o git recusa o commit sem eles ("Author identity unknown").
    const comandoAdd = `"${GIT_BIN}" add "${relPathGit}"`;
    const comandoCommit = `"${GIT_BIN}" -c user.name="DDrinks Servidor" -c user.email="ddrinks-servidor@local" commit -m "${mensagemCommit}"`;
    const comandoPush = `"${GIT_BIN}" -c credential.helper= -c credential.helper="store --file=${GIT_CREDENTIALS_FILE}" push origin main`;
    exec(`${comandoAdd} && ${comandoCommit} && ${comandoPush}`, { cwd: repoDir }, (err, stdout, stderr) => {
        if (err) console.warn('⚠️  Não consegui publicar a foto automaticamente no GitHub (ela continua funcionando neste computador):', (stderr || err.message).split('\n')[0]);
        else console.log('✓ Foto publicada no GitHub:', filename);
    });
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

app.listen(PORT, () => {
    console.log(`\n  DDrinks + MySQL rodando em http://localhost:${PORT}`);
    console.log('  Deixe esta janela aberta enquanto usa o app. Pra fechar, feche esta janela ou Ctrl+C.\n');
});
