# Sistema DDrinks - Orçamento de Drinks para Eventos

Sistema completo para gerenciamento de orçamentos de drinks para eventos, desenvolvido com Node.js, Express e MySQL.

## 🚀 Funcionalidades

- ✅ Sistema de autenticação (login/cadastro)
- ✅ Criação de orçamentos de drinks
- ✅ Agenda de eventos
- ✅ Calendário visual
- ✅ Dashboard com estatísticas
- ✅ Geração de PDF
- ✅ Gerenciamento de status dos eventos
- ✅ Interface responsiva e moderna

## 📋 Pré-requisitos

- Node.js (versão 16 ou superior)
- MySQL (versão 5.7 ou superior)
- npm ou yarn

## 🔧 Instalação

1. **Clone ou baixe o projeto**
   ```bash
   cd "DDrinks Carine/DDrinks Carine/DDrinks Carine/Sistema DDrinks"
   ```

2. **Instale as dependências**
   ```bash
   npm install
   ```

3. **Configure o banco de dados MySQL**
   - Crie um banco de dados chamado `ddrinks_db`
   - Ou altere o nome no arquivo `config.env`

4. **Configure as variáveis de ambiente**
   - Edite o arquivo `config.env` com suas configurações:
   ```env
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=sua_senha_mysql
   DB_NAME=ddrinks_db
   DB_PORT=3306
   PORT=3000
   SESSION_SECRET=sua_chave_secreta
   ```

5. **Execute o servidor**
   ```bash
   npm run dev
   ```

6. **Acesse o sistema**
   - Abra seu navegador em: `http://localhost:3000`
   - Para login: `http://localhost:3000/login`

## 🗄️ Estrutura do Banco de Dados

O sistema criará automaticamente as seguintes tabelas:

### `usuarios`
- id (INT, AUTO_INCREMENT, PRIMARY KEY)
- nome (VARCHAR)
- username (VARCHAR, UNIQUE)
- email (VARCHAR, UNIQUE)
- password (VARCHAR - hash bcrypt)
- created_at, updated_at (TIMESTAMP)

### `orcamentos`
- id (INT, AUTO_INCREMENT, PRIMARY KEY)
- cliente (VARCHAR)
- telefone (VARCHAR)
- cidade (VARCHAR)
- data_evento (DATE)
- quantidade_convidados (INT)
- descricao (TEXT)
- valor (DECIMAL)
- valor_base (DECIMAL)
- taxa_servico (DECIMAL)
- incluir_taxa_servico (BOOLEAN)
- status (ENUM: 'pendente', 'aceito', 'recusado')
- drinks (JSON)
- user_id (INT, FOREIGN KEY)
- created_at, updated_at (TIMESTAMP)

## 🎯 Como Usar

1. **Primeiro acesso**: Faça o cadastro de um usuário
2. **Login**: Entre com suas credenciais
3. **Criar orçamento**: 
   - Preencha as informações do cliente
   - Selecione os drinks desejados
   - Configure outros gastos
   - Opcionalmente inclua taxa de serviço (40%)
   - Clique em "Calcular Orçamento"
4. **Visualizar**: Acesse a agenda para ver todos os eventos
5. **Gerenciar**: Edite, aceite ou exclua eventos conforme necessário

## 📱 Páginas do Sistema

- **/** - Página principal (criação de orçamentos)
- **/login** - Login e cadastro
- **/agenda** - Dashboard e lista de eventos
- **/datas** - Calendário visual
- **/resultado** - Resultado do orçamento

## 🔧 Scripts Disponíveis

- `npm run dev` - Executa em modo desenvolvimento
- `npm run build` - Compila o TypeScript
- `npm start` - Executa em modo produção
- `npm run check` - Verifica tipos TypeScript

## 🛠️ Tecnologias Utilizadas

- **Backend**: Node.js, Express.js
- **Banco de Dados**: MySQL
- **Autenticação**: bcryptjs, express-session
- **Frontend**: HTML5, CSS3, JavaScript (Vanilla)
- **Relatórios**: jsPDF, html2canvas
- **Gráficos**: Chart.js

## 📊 Funcionalidades do Sistema

### Dashboard
- Total de orçamentos
- Valor total dos orçamentos
- Eventos aceitos vs pendentes
- Gráficos de eventos por mês

### Orçamentos
- 3 pacotes de preços (Bronze, Prata, Ouro)
- 16 tipos de drinks diferentes
- Outros gastos (gelo, copos, decoração, etc.)
- Taxa de serviço opcional (40%)
- Geração de PDF profissional

### Agenda
- Lista completa de eventos
- Filtros por status
- Edição de eventos
- Exclusão de eventos
- Atualização de status

## 🔒 Segurança

- Senhas criptografadas com bcrypt
- Sessões seguras com express-session
- Validação de dados no backend
- Middleware de autenticação
- Proteção contra SQL injection

## 📝 Notas Importantes

1. **MySQL**: Certifique-se de que o MySQL está rodando
2. **Porta**: O sistema roda na porta 3000 por padrão
3. **Sessões**: As sessões são mantidas em memória (para produção, considere usar Redis)
4. **Uploads**: O sistema não possui upload de arquivos
5. **Email**: Não há sistema de recuperação de senha por email
6. **Preços**: Os preços dos pacotes estão em `precos/precos.json` (gerados a partir de `precos/bronze.json`). Edite `precos/bronze.json` se quiser alterar os valores Bronze; execute `node scripts/generate-precos.cjs` para regenerar `precos/precos.json` e `data/precos.json`.

   - Observação: alguns drinks não-alcoólicos devem manter o mesmo preço em Bronze/Prata/Ouro (por exemplo, `conton_fire`, `mojito_sem_alcool`, `moscow_mule_sem_alcool`, `pina_colada_sem_alcool`, `sex_on_the_beach_sem_alcool`, `soda_italiana_limao_siciliano_e_morango`). Esses estão listados na variável `nonAlcoholicSame` em `scripts/generate-precos.cjs` — se quiser adicionar mais, atualize essa lista e regenere os preços.

   - Note: itens não relacionados a drinks (por exemplo: `gelo`, `copos`, `decoracao`, `carretinha`, `flores`, `papelaria`, `funcionarios`, `alimentacao`, `canudos`, `gasolina`, `estrutura_bar`) não têm preços pré-definidos — o sistema utilizará o valor que você digitar para esses itens no formulário.

## 🐛 Solução de Problemas

### Erro de conexão com MySQL
- Verifique se o MySQL está rodando
- Confirme as credenciais no `config.env`
- Verifique se o banco `ddrinks_db` existe

### Erro de porta em uso
- Altere a porta no `config.env`
- Ou termine o processo que está usando a porta 3000

### Problemas de sessão
- Limpe os cookies do navegador
- Reinicie o servidor

## 📞 Suporte

Para dúvidas ou problemas:
1. Verifique os logs do console
2. Confirme se todas as dependências estão instaladas
3. Verifique a configuração do MySQL
4. Reinicie o servidor se necessário

---

**Desenvolvido com ❤️ para DDrinks**
