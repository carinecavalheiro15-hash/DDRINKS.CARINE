import express from 'express';
import cors from 'cors';
import session from 'express-session';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Carrega variáveis de ambiente
dotenv.config({ path: './config.env' });

// Importa as rotas
import authRoutes from './routes/auth.js';
import orcamentoRoutes from './routes/orcamentos.js';
import { initializeDatabase, testConnection } from './database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors({
  origin: true,
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configuração de sessão
app.use(session({
  secret: process.env.SESSION_SECRET || 'ddrinks-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false, // Set to true in production with HTTPS
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    httpOnly: true
  }
}));

// Middleware de autenticação
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Rotas da API
app.use('/api/auth', authRoutes);
app.use('/api/orcamentos', orcamentoRoutes);

// Servir arquivos estáticos (HTML, CSS, JS)
app.use(express.static(__dirname));

// Rota para servir o index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Rota para servir o login.html
app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'login.html'));
});

// Rota para servir a agenda.html
app.get('/agenda', (req, res) => {
  res.sendFile(path.join(__dirname, 'agenda.html'));
});

// Rota para servir o resultado.html
app.get('/resultado', (req, res) => {
  res.sendFile(path.join(__dirname, 'resultado.html'));
});

// Rota para servir o datas.html
app.get('/datas', (req, res) => {
  res.sendFile(path.join(__dirname, 'datas.html'));
});

// Middleware de tratamento de erros
app.use((err, req, res, next) => {
  console.error('Erro:', err);
  res.status(500).json({ 
    message: 'Erro interno do servidor',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Rota 404
app.use('*', (req, res) => {
  res.status(404).json({ message: 'Rota não encontrada' });
});

// Inicialização do servidor
async function startServer() {
  try {
    // Testa conexão com o banco
    await testConnection();
    
    // Inicializa o banco de dados
    await initializeDatabase();
    
    // Inicia o servidor
    app.listen(PORT, () => {
      console.log(`🚀 Servidor rodando na porta ${PORT}`);
      console.log(`📱 Acesse: http://localhost:${PORT}`);
      console.log(`🔐 Login: http://localhost:${PORT}/login`);
    });
  } catch (error) {
    console.error('❌ Erro ao iniciar servidor:', error);
    process.exit(1);
  }
}

startServer();
