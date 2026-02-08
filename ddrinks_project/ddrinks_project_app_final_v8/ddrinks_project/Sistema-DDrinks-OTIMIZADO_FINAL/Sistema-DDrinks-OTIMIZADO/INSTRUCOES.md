# 🚀 Instruções Rápidas - Sistema DDrinks

## ⚡ Setup Rápido (5 minutos)

### 1. Instalar Dependências
```bash
npm install
```

### 2. Configurar MySQL
- Instale o MySQL se não tiver
- Crie um banco chamado `ddrinks_db`
- Ou altere no arquivo `config.env`

### 3. Configurar Banco
Edite o arquivo `config.env`:
```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=sua_senha
DB_NAME=ddrinks_db
```

### 4. Inicializar Sistema
```bash
npm run setup
```

### 5. Executar
```bash
npm run dev
```

### 6. Acessar
- Abra: http://localhost:3000
- Cadastre-se e comece a usar!

## 🔧 Comandos Úteis

- `npm run setup` - Configura banco de dados
- `npm run dev` - Executa em desenvolvimento  
- `npm run build` - Compila o projeto
- `npm start` - Executa em produção

## 📱 Páginas

- **/** - Criar orçamentos
- **/login** - Login/Cadastro
- **/agenda** - Ver eventos
- **/datas** - Calendário

## ❗ Problemas Comuns

**Erro MySQL**: Verifique se está rodando
**Porta ocupada**: Altere no config.env
**Erro setup**: Execute `npm run setup` novamente

---
**Sistema pronto para usar! 🎉**
