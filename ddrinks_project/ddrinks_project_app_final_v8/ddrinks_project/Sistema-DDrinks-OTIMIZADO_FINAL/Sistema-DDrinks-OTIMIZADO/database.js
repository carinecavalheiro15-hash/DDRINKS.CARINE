import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

// Carrega as variáveis de ambiente
dotenv.config({ path: './config.env' });

// Configuração da conexão com o MySQL
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'ddrinks_db',
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

// Cria o pool de conexões
const pool = mysql.createPool(dbConfig);

// Função para executar queries
export const executeQuery = async (query, params = []) => {
  try {
    const [results] = await pool.execute(query, params);
    return results;
  } catch (error) {
    console.error('Erro na query:', error);
    throw error;
  }
};

// Função para inicializar o banco de dados
export const initializeDatabase = async () => {
  try {
    // Cria o banco de dados se não existir
    await executeQuery(`CREATE DATABASE IF NOT EXISTS ${dbConfig.database}`);
    await executeQuery(`USE ${dbConfig.database}`);

    // Cria a tabela de usuários
    await executeQuery(`
      CREATE TABLE IF NOT EXISTS usuarios (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nome VARCHAR(255) NOT NULL,
        username VARCHAR(100) UNIQUE NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    // Cria a tabela de orçamentos
    await executeQuery(`
      CREATE TABLE IF NOT EXISTS orcamentos (
        id INT AUTO_INCREMENT PRIMARY KEY,
        cliente VARCHAR(255) NOT NULL,
        telefone VARCHAR(50) NOT NULL,
        cidade VARCHAR(255) NOT NULL,
        data_evento DATE NOT NULL,
        quantidade_convidados INT NOT NULL,
        descricao TEXT,
        valor DECIMAL(10,2) NOT NULL,
        valor_base DECIMAL(10,2) NOT NULL,
        taxa_servico DECIMAL(10,2) DEFAULT 0,
        incluir_taxa_servico BOOLEAN DEFAULT FALSE,
        status ENUM('pendente', 'aceito', 'recusado') DEFAULT 'pendente',
        drinks JSON,
        user_id INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES usuarios(id) ON DELETE CASCADE
      )
    `);

    console.log('✅ Banco de dados inicializado com sucesso!');
    return true;
  } catch (error) {
    console.error('❌ Erro ao inicializar banco de dados:', error);
    throw error;
  }
};

// Função para testar a conexão
export const testConnection = async () => {
  try {
    const result = await executeQuery('SELECT 1 as test');
    console.log('✅ Conexão com MySQL estabelecida com sucesso!');
    return true;
  } catch (error) {
    console.error('❌ Erro ao conectar com MySQL:', error);
    return false;
  }
};

export default pool;
