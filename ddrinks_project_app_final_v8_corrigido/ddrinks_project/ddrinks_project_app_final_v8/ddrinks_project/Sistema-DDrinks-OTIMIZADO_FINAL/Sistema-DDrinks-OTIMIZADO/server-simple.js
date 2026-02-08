// Servidor simplificado para demonstração (sem banco de dados)
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir arquivos estáticos (HTML, CSS, JS)
app.use(express.static(__dirname));

// Rotas para servir as páginas
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'login.html'));
});

app.get('/agenda', (req, res) => {
  res.sendFile(path.join(__dirname, 'agenda.html'));
});

app.get('/resultado', (req, res) => {
  res.sendFile(path.join(__dirname, 'resultado.html'));
});

app.get('/datas', (req, res) => {
  res.sendFile(path.join(__dirname, 'datas.html'));
});

// API simulada para demonstração
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  
  // Simulação simples de login
  if (username && password) {
    res.json({
      success: true,
      user: { id: 1, username, email: 'demo@ddrinks.com' }
    });
  } else {
    res.status(400).json({
      success: false,
      message: 'Credenciais inválidas'
    });
  }
});

app.post('/api/auth/register', (req, res) => {
  const { nome, username, email, password } = req.body;
  
  // Simulação simples de cadastro
  if (nome && username && email && password) {
    res.json({
      success: true,
      user: { id: 1, username, email, nome }
    });
  } else {
    res.status(400).json({
      success: false,
      message: 'Dados inválidos'
    });
  }
});

app.get('/api/auth/check', (req, res) => {
  // Simulação - sempre retorna como não autenticado para demonstração
  res.json({
    authenticated: false,
    message: 'Usuário não autenticado'
  });
});

app.post('/api/orcamentos', (req, res) => {
  // Simulação de criação de orçamento
  const orcamento = {
    id: Math.floor(Math.random() * 1000),
    ...req.body,
    status: 'pendente',
    dataCriacao: new Date().toISOString()
  };
  
  res.json({
    success: true,
    orcamento
  });
});

// Inicia o servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor DDrinks rodando na porta ${PORT}`);
  console.log(`📱 Acesse: http://localhost:${PORT}`);
  console.log(`🔐 Login: http://localhost:${PORT}/login`);
  console.log(`📊 Agenda: http://localhost:${PORT}/agenda`);
  console.log(`\n✨ Sistema funcionando em modo de demonstração!`);
  console.log(`💡 Para funcionalidade completa, configure o MySQL.`);
});
