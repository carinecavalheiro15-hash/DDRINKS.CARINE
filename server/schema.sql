-- ============================================================
-- Banco de dados do sistema DDrinks
-- Como usar: abra este arquivo no MySQL Workbench (conectado no
-- seu MySQL Server 8.0 local) e execute tudo (raio amarelo / Ctrl+Shift+Enter).
-- ============================================================

CREATE DATABASE IF NOT EXISTS ddrinks
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE ddrinks;

-- Usuário dedicado do app (não usa o root). Troque 'TROQUE_ESSA_SENHA' por uma
-- senha sua antes de rodar — essa senha é só sua, não precisa me contar.
CREATE USER IF NOT EXISTS 'ddrinks_app'@'localhost' IDENTIFIED BY 'TROQUE_ESSA_SENHA';
GRANT ALL PRIVILEGES ON ddrinks.* TO 'ddrinks_app'@'localhost';
FLUSH PRIVILEGES;

-- ------------------------------------------------------------
-- Orçamentos / Eventos (o coração do sistema)
-- Guarda o objeto completo em JSON (nada se perde, mesmo campos novos que o
-- app venha a criar no futuro) + colunas extraídas pra permitir filtrar e
-- fazer relatório direto em SQL sem precisar abrir o JSON.
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS orcamentos (
    id              BIGINT PRIMARY KEY,
    cliente         VARCHAR(255),
    telefone        VARCHAR(50),
    cidade          VARCHAR(255),
    data_evento     DATE NULL,
    status          VARCHAR(50),
    pacote          VARCHAR(50),
    valor           DECIMAL(12,2),
    dados           JSON NOT NULL,
    criado_em       DATETIME DEFAULT CURRENT_TIMESTAMP,
    atualizado_em   DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_orcamentos_status (status),
    INDEX idx_orcamentos_data_evento (data_evento)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS fornecedores (
    id              BIGINT PRIMARY KEY,
    nome            VARCHAR(255),
    servico         VARCHAR(255),
    telefone        VARCHAR(50),
    email           VARCHAR(255),
    dados           JSON NOT NULL,
    criado_em       DATETIME DEFAULT CURRENT_TIMESTAMP,
    atualizado_em   DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS vouchers (
    id              BIGINT PRIMARY KEY,
    codigo          VARCHAR(50),
    tipo            VARCHAR(50),
    status          VARCHAR(50),
    dados           JSON NOT NULL,
    criado_em       DATETIME DEFAULT CURRENT_TIMESTAMP,
    atualizado_em   DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS cerimonialistas (
    id              BIGINT PRIMARY KEY,
    nome            VARCHAR(255),
    dados           JSON NOT NULL,
    criado_em       DATETIME DEFAULT CURRENT_TIMESTAMP,
    atualizado_em   DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS pacotes_promocionais (
    id              BIGINT PRIMARY KEY,
    nome            VARCHAR(255),
    dados           JSON NOT NULL,
    criado_em       DATETIME DEFAULT CURRENT_TIMESTAMP,
    atualizado_em   DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS drinks_customizados (
    id              VARCHAR(100) PRIMARY KEY,
    nome            VARCHAR(255),
    sabor           VARCHAR(50),
    dados           JSON NOT NULL,
    criado_em       DATETIME DEFAULT CURRENT_TIMESTAMP,
    atualizado_em   DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS fichas_tecnicas (
    id              VARCHAR(100) PRIMARY KEY,
    nome            VARCHAR(255),
    categoria       VARCHAR(100),
    dados           JSON NOT NULL,
    criado_em       DATETIME DEFAULT CURRENT_TIMESTAMP,
    atualizado_em   DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS estoque_itens (
    id              VARCHAR(100) PRIMARY KEY,
    nome            VARCHAR(255),
    unidade         VARCHAR(20),
    quantidade      DECIMAL(12,3),
    dados           JSON NOT NULL,
    criado_em       DATETIME DEFAULT CURRENT_TIMESTAMP,
    atualizado_em   DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Configurações e valores avulsos (foto de login, usuário logado, config do
-- cardápio digital, histórico do estoque etc.) — cada linha é uma chave.
CREATE TABLE IF NOT EXISTS app_config (
    chave           VARCHAR(100) PRIMARY KEY,
    valor           LONGTEXT,
    atualizado_em   DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
