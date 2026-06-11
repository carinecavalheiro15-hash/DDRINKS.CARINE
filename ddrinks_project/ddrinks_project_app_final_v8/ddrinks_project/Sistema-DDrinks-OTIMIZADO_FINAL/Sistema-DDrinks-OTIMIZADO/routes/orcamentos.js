import express from 'express';
import { executeQuery } from '../database.js';
import { requireAuth } from './auth.js';

const router = express.Router();

// Aplica o middleware de autenticação em todas as rotas
router.use(requireAuth);

// Rota para listar todos os orçamentos do usuário
router.get('/', async (req, res) => {
  try {
    const orcamentos = await executeQuery(
      'SELECT * FROM orcamentos WHERE user_id = ? ORDER BY data_evento DESC',
      [req.session.userId]
    );

    res.json({ orcamentos });
  } catch (error) {
    console.error('Erro ao buscar orçamentos:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// Rota para buscar um orçamento específico
router.get('/:id', async (req, res) => {
  try {
    const orcamentos = await executeQuery(
      'SELECT * FROM orcamentos WHERE id = ? AND user_id = ?',
      [req.params.id, req.session.userId]
    );

    if (orcamentos.length === 0) {
      return res.status(404).json({ message: 'Orçamento não encontrado' });
    }

    res.json({ orcamento: orcamentos[0] });
  } catch (error) {
    console.error('Erro ao buscar orçamento:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// Rota para criar um novo orçamento
router.post('/', async (req, res) => {
  try {
    const {
      cliente,
      telefone,
      cidade,
      data_evento,
      quantidade_convidados,
      descricao,
      valor,
      valor_base,
      taxa_servico,
      incluir_taxa_servico,
      drinks
    } = req.body;

    // Validações básicas
    if (!cliente || !telefone || !cidade || !data_evento || !quantidade_convidados || !descricao) {
      return res.status(400).json({ message: 'Todos os campos obrigatórios devem ser preenchidos' });
    }

    // Verifica se já existe um evento na mesma data para o mesmo usuário
    const existingEvent = await executeQuery(
      'SELECT id FROM orcamentos WHERE data_evento = ? AND user_id = ?',
      [data_evento, req.session.userId]
    );

    if (existingEvent.length > 0) {
      return res.status(400).json({ message: 'Já existe um evento cadastrado para esta data!' });
    }

    // Insere o novo orçamento
    const result = await executeQuery(
      `INSERT INTO orcamentos (
        cliente, telefone, cidade, data_evento, quantidade_convidados, 
        descricao, valor, valor_base, taxa_servico, incluir_taxa_servico, 
        drinks, user_id, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pendente')`,
      [
        cliente, telefone, cidade, data_evento, quantidade_convidados,
        descricao, valor, valor_base, taxa_servico || 0, incluir_taxa_servico || false,
        JSON.stringify(drinks || {}), req.session.userId
      ]
    );

    // Busca o orçamento criado
    const newOrcamento = await executeQuery(
      'SELECT * FROM orcamentos WHERE id = ?',
      [result.insertId]
    );

    res.status(201).json({
      message: 'Orçamento criado com sucesso',
      orcamento: newOrcamento[0]
    });

  } catch (error) {
    console.error('Erro ao criar orçamento:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// Rota para atualizar um orçamento
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      cliente,
      telefone,
      cidade,
      data_evento,
      quantidade_convidados,
      descricao,
      valor,
      status
    } = req.body;

    // Verifica se o orçamento existe e pertence ao usuário
    const existingOrcamento = await executeQuery(
      'SELECT id FROM orcamentos WHERE id = ? AND user_id = ?',
      [id, req.session.userId]
    );

    if (existingOrcamento.length === 0) {
      return res.status(404).json({ message: 'Orçamento não encontrado' });
    }

    // Atualiza o orçamento
    await executeQuery(
      `UPDATE orcamentos SET 
        cliente = ?, telefone = ?, cidade = ?, data_evento = ?, 
        quantidade_convidados = ?, descricao = ?, valor = ?, status = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND user_id = ?`,
      [cliente, telefone, cidade, data_evento, quantidade_convidados, descricao, valor, status, id, req.session.userId]
    );

    // Busca o orçamento atualizado
    const updatedOrcamento = await executeQuery(
      'SELECT * FROM orcamentos WHERE id = ?',
      [id]
    );

    res.json({
      message: 'Orçamento atualizado com sucesso',
      orcamento: updatedOrcamento[0]
    });

  } catch (error) {
    console.error('Erro ao atualizar orçamento:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// Rota para atualizar status do orçamento
router.patch('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['pendente', 'aceito', 'recusado'].includes(status)) {
      return res.status(400).json({ message: 'Status inválido' });
    }

    // Verifica se o orçamento existe e pertence ao usuário
    const existingOrcamento = await executeQuery(
      'SELECT id FROM orcamentos WHERE id = ? AND user_id = ?',
      [id, req.session.userId]
    );

    if (existingOrcamento.length === 0) {
      return res.status(404).json({ message: 'Orçamento não encontrado' });
    }

    // Atualiza o status
    await executeQuery(
      'UPDATE orcamentos SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?',
      [status, id, req.session.userId]
    );

    res.json({ message: 'Status atualizado com sucesso' });

  } catch (error) {
    console.error('Erro ao atualizar status:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// Rota para excluir um orçamento
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Verifica se o orçamento existe e pertence ao usuário
    const existingOrcamento = await executeQuery(
      'SELECT id FROM orcamentos WHERE id = ? AND user_id = ?',
      [id, req.session.userId]
    );

    if (existingOrcamento.length === 0) {
      return res.status(404).json({ message: 'Orçamento não encontrado' });
    }

    // Exclui o orçamento
    await executeQuery(
      'DELETE FROM orcamentos WHERE id = ? AND user_id = ?',
      [id, req.session.userId]
    );

    res.json({ message: 'Orçamento excluído com sucesso' });

  } catch (error) {
    console.error('Erro ao excluir orçamento:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// Rota para obter estatísticas do dashboard
router.get('/dashboard/stats', async (req, res) => {
  try {
    // Total de orçamentos
    const totalOrcamentos = await executeQuery(
      'SELECT COUNT(*) as total FROM orcamentos WHERE user_id = ?',
      [req.session.userId]
    );

    // Orçamentos aceitos
    const orcamentosAceitos = await executeQuery(
      'SELECT COUNT(*) as aceitos FROM orcamentos WHERE user_id = ? AND status = "aceito"',
      [req.session.userId]
    );

    // Orçamentos pendentes
    const orcamentosPendentes = await executeQuery(
      'SELECT COUNT(*) as pendentes FROM orcamentos WHERE user_id = ? AND status = "pendente"',
      [req.session.userId]
    );

    // Valor total dos orçamentos
    const valorTotal = await executeQuery(
      'SELECT SUM(valor) as total FROM orcamentos WHERE user_id = ?',
      [req.session.userId]
    );

    // Valor total dos orçamentos aceitos
    const valorTotalAceito = await executeQuery(
      'SELECT SUM(valor) as total FROM orcamentos WHERE user_id = ? AND status = "aceito"',
      [req.session.userId]
    );

    // Eventos por mês
    const eventosPorMes = await executeQuery(
      `SELECT 
        MONTH(data_evento) as mes,
        COUNT(*) as quantidade
      FROM orcamentos 
      WHERE user_id = ? AND YEAR(data_evento) = YEAR(CURRENT_DATE())
      GROUP BY MONTH(data_evento)
      ORDER BY mes`,
      [req.session.userId]
    );

    res.json({
      totalOrcamentos: totalOrcamentos[0].total || 0,
      orcamentosAceitos: orcamentosAceitos[0].aceitos || 0,
      orcamentosPendentes: orcamentosPendentes[0].pendentes || 0,
      valorTotal: valorTotal[0].total || 0,
      valorTotalAceito: valorTotalAceito[0].total || 0,
      eventosPorMes: eventosPorMes
    });

  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

export default router;
