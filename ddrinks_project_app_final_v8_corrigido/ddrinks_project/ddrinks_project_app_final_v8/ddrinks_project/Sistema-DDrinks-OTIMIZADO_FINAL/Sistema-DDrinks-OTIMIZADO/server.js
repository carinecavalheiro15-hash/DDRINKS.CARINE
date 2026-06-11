// Servidor simples para Single Page Application
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

// Servir arquivos estáticos (CSS, JS, etc.)
app.use(express.static(__dirname));

// Rota principal - serve o app.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'app.html'));
});

// Rota para qualquer outra URL - redireciona para o app
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'app.html'));
});

// Inicia o servidor
app.listen(PORT, () => {
  console.log(`🚀 DDrinks App rodando em: http://localhost:${PORT}`);
  console.log(`✨ Sistema completo em uma única URL!`);
  console.log(`\n📱 Funcionalidades disponíveis:`);
  console.log(`   🔐 Login/Cadastro`);
  console.log(`   📋 Criação de Orçamentos`);
  console.log(`   📊 Dashboard com Estatísticas`);
  console.log(`   📅 Calendário de Eventos`);
  console.log(`   💾 Dados salvos no localStorage`);
});
