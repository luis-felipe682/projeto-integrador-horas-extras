const express = require('express');
const cors = require('cors');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { db, inicializarBanco } = require('./database');

// Inicializa banco de dados e seed demo
inicializarBanco();

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'chave-secreta-projeto-integrador-clt-2026';

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ==========================================
// FUNÇÕES AUXILIARES DE CÁLCULO E VALIDAÇÃO
// ==========================================

function calcularDuracaoHoras(dataInicio, horaInicio, dataFim, horaFim) {
  try {
    const inicioStr = `${dataInicio}T${horaInicio}:00`;
    const fimStr = `${dataFim || dataInicio}T${horaFim}:00`;
    let dtInicio = new Date(inicioStr);
    let dtFim = new Date(fimStr);

    // Se no mesmo dia a hora de fim for menor que a de início, virou a noite (+24h)
    if (!dataFim || dataFim === dataInicio) {
      if (dtFim < dtInicio) {
        dtFim.setDate(dtFim.getDate() + 1);
      }
    }

    const diffMs = dtFim.getTime() - dtInicio.getTime();
    if (diffMs <= 0) return 0;
    const duracao = diffMs / (1000 * 60 * 60);
    return Math.round(duracao * 100) / 100;
  } catch (e) {
    return 0;
  }
}

function criarIntervaloRegistro(dataInicio, horaInicio, dataFim, horaFim) {
  const inicio = Date.parse(`${dataInicio}T${horaInicio}:00Z`);
  let fim = Date.parse(`${dataFim || dataInicio}T${horaFim}:00Z`);

  if (!Number.isFinite(inicio) || !Number.isFinite(fim)) return null;
  if (fim <= inicio && (!dataFim || dataFim === dataInicio)) fim += 24 * 60 * 60 * 1000;
  return fim > inicio ? { inicio, fim } : null;
}

function existeConflitoDeHorario(usuarioId, tipo, intervalo, registroIgnoradoId = null) {
  let sql = `
    SELECT data, hora_inicio, hora_fim, data_fim
    FROM registros
    WHERE usuario_id = ? AND tipo = ?
  `;
  const params = [usuarioId, tipo];

  if (registroIgnoradoId !== null) {
    sql += ' AND id != ?';
    params.push(registroIgnoradoId);
  }

  return db.prepare(sql).all(...params).some(registro => {
    const outroIntervalo = criarIntervaloRegistro(
      registro.data,
      registro.hora_inicio,
      registro.data_fim,
      registro.hora_fim
    );
    return outroIntervalo && intervalo.inicio < outroIntervalo.fim && outroIntervalo.inicio < intervalo.fim;
  });
}

function recalcularCompensacaoSobreaviso(usuarioId, data) {
  const sobreavisos = db.prepare(`
    SELECT id, COALESCE(duracao_original, duracao_horas) AS duracao_original
    FROM registros
    WHERE usuario_id = ? AND tipo = 'SOBREAVISO' AND data = ?
    ORDER BY id ASC
  `).all(usuarioId, data);
  let horasExtrasRestantes = Number(db.prepare(`
    SELECT COALESCE(SUM(duracao_horas), 0) AS total
    FROM registros
    WHERE usuario_id = ? AND tipo = 'HORA_EXTRA' AND data = ?
  `).get(usuarioId, data).total) || 0;

  const atualizarSobreaviso = db.prepare(`
    UPDATE registros
    SET duracao_horas = ?, duracao_original = ?, horas_deduzidas = ?
    WHERE id = ?
  `);

  for (const sobreaviso of sobreavisos) {
    const duracaoOriginal = Number(sobreaviso.duracao_original) || 0;
    const deducao = Math.min(duracaoOriginal, horasExtrasRestantes);
    atualizarSobreaviso.run(
      Math.round((duracaoOriginal - deducao) * 100) / 100,
      duracaoOriginal,
      Math.round(deducao * 100) / 100,
      sobreaviso.id
    );
    horasExtrasRestantes = Math.max(0, horasExtrasRestantes - deducao);
  }
}

// Middleware de Autenticação JWT
function autenticarToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Acesso não autorizado. Faça login para continuar.' });
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ error: 'Sessão expirada ou inválida. Por favor, entre novamente.' });
    }
    req.user = decoded;
    next();
  });
}

// Middleware de Autorização por Perfil (RBAC)
function autorizarPerfil(perfilPermitido) {
  return (req, res, next) => {
    if (!req.user || req.user.perfil !== perfilPermitido) {
      return res.status(403).json({
        error: `Acesso proibido. Esta funcionalidade é restrita ao perfil ${perfilPermitido}.`
      });
    }
    next();
  };
}

// ==========================================
// ROTAS DE AUTENTICAÇÃO E CONTA
// ==========================================

// Cadastro de usuário
app.post('/api/auth/cadastro', (req, res) => {
  try {
    const { nome, email, senha, cargo, perfil, salario, carga_horaria_mensal } = req.body;

    if (!nome || !email || !senha || !perfil) {
      return res.status(400).json({ error: 'Nome, e-mail, senha e perfil são obrigatórios.' });
    }

    const perfilNormalizado = perfil.toUpperCase();
    if (!['COLABORADOR', 'SUPERVISOR'].includes(perfilNormalizado)) {
      return res.status(400).json({ error: 'Perfil inválido. Escolha COLABORADOR ou SUPERVISOR.' });
    }

    // Verificar se o email já existe
    const usuarioExistente = db.prepare('SELECT id FROM usuarios WHERE email = ?').get(email.toLowerCase().trim());
    if (usuarioExistente) {
      return res.status(400).json({ error: 'Este e-mail já está cadastrado no sistema.' });
    }

    const salt = bcrypt.genSaltSync(10);
    const senhaHash = bcrypt.hashSync(senha, salt);

    // O supervisor nunca possui salário vinculado a si para este módulo
    const salarioValido = perfilNormalizado === 'COLABORADOR' ? Math.max(0, Number(salario) || 0) : 0;
    const cargaValida = Math.max(1, Number(carga_horaria_mensal) || 220);

    const stmt = db.prepare(`
      INSERT INTO usuarios (nome, email, senha, cargo, perfil, salario, carga_horaria_mensal)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      nome.trim(),
      email.toLowerCase().trim(),
      senhaHash,
      (cargo || '').trim(),
      perfilNormalizado,
      salarioValido,
      cargaValida
    );

    return res.status(201).json({
      message: 'Conta criada com sucesso! Faça login para continuar.',
      usuarioId: Number(result.lastInsertRowid)
    });
  } catch (error) {
    console.error('Erro no cadastro:', error);
    return res.status(500).json({ error: 'Erro interno ao criar conta.' });
  }
});

// Login
app.post('/api/auth/login', (req, res) => {
  try {
    const { email, senha } = req.body;

    if (!email || !senha) {
      return res.status(400).json({ error: 'Informe e-mail e senha.' });
    }

    const usuario = db.prepare('SELECT * FROM usuarios WHERE email = ?').get(email.toLowerCase().trim());

    if (!usuario) {
      return res.status(401).json({ error: 'E-mail ou senha incorretos.' });
    }

    const senhaCorreta = bcrypt.compareSync(senha, usuario.senha);
    if (!senhaCorreta) {
      return res.status(401).json({ error: 'E-mail ou senha incorretos.' });
    }

    const token = jwt.sign(
      {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        perfil: usuario.perfil,
        cargo: usuario.cargo
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Resposta sanitizada: se for supervisor, salário NUNCA é retornado!
    const dadosUsuario = {
      id: usuario.id,
      nome: usuario.nome,
      email: usuario.email,
      cargo: usuario.cargo,
      perfil: usuario.perfil
    };

    if (usuario.perfil === 'COLABORADOR') {
      dadosUsuario.salario = usuario.salario;
      dadosUsuario.carga_horaria_mensal = usuario.carga_horaria_mensal;
    }

    return res.json({
      message: `Bem-vindo(a), ${usuario.nome}!`,
      token,
      usuario: dadosUsuario
    });
  } catch (error) {
    console.error('Erro no login:', error);
    return res.status(500).json({ error: 'Erro ao realizar login.' });
  }
});

// Perfil atual logado
app.get('/api/auth/me', autenticarToken, (req, res) => {
  try {
    const usuario = db.prepare('SELECT id, nome, email, cargo, perfil, salario, carga_horaria_mensal FROM usuarios WHERE id = ?').get(req.user.id);
    if (!usuario) {
      return res.status(404).json({ error: 'Usuário não encontrado.' });
    }

    const dados = {
      id: usuario.id,
      nome: usuario.nome,
      email: usuario.email,
      cargo: usuario.cargo,
      perfil: usuario.perfil
    };

    // Privacidade estrita: supervisor não tem campo salário
    if (usuario.perfil === 'COLABORADOR') {
      dados.salario = usuario.salario;
      dados.carga_horaria_mensal = usuario.carga_horaria_mensal;
    }

    return res.json(dados);
  } catch (error) {
    return res.status(500).json({ error: 'Erro ao carregar dados do usuário.' });
  }
});

// ==========================================
// ROTAS DO COLABORADOR
// ==========================================

// Atualizar dados cadastrais e salário do próprio colaborador
app.put('/api/colaborador/perfil', autenticarToken, autorizarPerfil('COLABORADOR'), (req, res) => {
  try {
    const { cargo, salario, carga_horaria_mensal } = req.body;

    const salarioNum = Math.max(0, Number(salario) || 0);
    const cargaNum = Math.max(1, Number(carga_horaria_mensal) || 220);

    db.prepare(`
      UPDATE usuarios
      SET cargo = ?, salario = ?, carga_horaria_mensal = ?
      WHERE id = ?
    `).run((cargo || '').trim(), salarioNum, cargaNum, req.user.id);

    return res.json({
      message: 'Dados cadastrais e salário atualizados com sucesso!',
      salario: salarioNum,
      carga_horaria_mensal: cargaNum
    });
  } catch (error) {
    console.error('Erro ao atualizar perfil:', error);
    return res.status(500).json({ error: 'Erro ao atualizar dados cadastrais.' });
  }
});

// Endpoint auxiliar para verificar se já há horas cadastradas no dia (para compensação em tempo real)
app.get('/api/colaborador/checar-dia', autenticarToken, autorizarPerfil('COLABORADOR'), (req, res) => {
  try {
    const { data } = req.query;
    if (!data) return res.json({ total_extra: 0, total_sobreaviso: 0, total_sobreaviso_original: 0 });

    const extra = db.prepare(`
      SELECT COALESCE(SUM(duracao_horas), 0) AS total
      FROM registros
      WHERE usuario_id = ? AND tipo = 'HORA_EXTRA' AND data = ?
    `).get(req.user.id, data);

    const sob = db.prepare(`
      SELECT 
        COALESCE(SUM(duracao_horas), 0) AS total_liquido,
        COALESCE(SUM(COALESCE(duracao_original, duracao_horas)), 0) AS total_original,
        COALESCE(SUM(COALESCE(horas_deduzidas, 0)), 0) AS total_deduzidas
      FROM registros
      WHERE usuario_id = ? AND tipo = 'SOBREAVISO' AND data = ?
    `).get(req.user.id, data);

    return res.json({
      total_extra: Number(extra?.total) || 0,
      total_sobreaviso: Number(sob?.total_liquido) || 0,
      total_sobreaviso_original: Number(sob?.total_original) || 0,
      total_sobreaviso_deduzidas: Number(sob?.total_deduzidas) || 0
    });
  } catch (error) {
    return res.status(500).json({ error: 'Erro ao verificar dia.' });
  }
});

// Registrar hora extra ou sobreaviso (Sobreaviso auto-homologado sem necessidade de análise)
app.post('/api/colaborador/registros', autenticarToken, autorizarPerfil('COLABORADOR'), (req, res) => {
  try {
    const {
      tipo,
      data,
      hora_inicio,
      hora_fim,
      data_fim,
      porcentagem,
      justificativa
    } = req.body;

    if (!tipo || !data || !hora_inicio || !hora_fim || !justificativa) {
      return res.status(400).json({ error: 'Preencha todos os campos obrigatórios (data, horários e justificativa).' });
    }

    const tipoNormalizado = tipo.toUpperCase();
    if (!['PONTO', 'HORA_EXTRA', 'SOBREAVISO'].includes(tipoNormalizado)) {
      return res.status(400).json({ error: 'Tipo inválido. Escolha HORA_EXTRA ou SOBREAVISO.' });
    }

    const dataFinal = data_fim || data;
    const duracaoHoras = calcularDuracaoHoras(data, hora_inicio, dataFinal, hora_fim);

    if (duracaoHoras <= 0) {
      return res.status(400).json({ error: 'A duração calculada do período deve ser maior que zero.' });
    }

    const intervalo = criarIntervaloRegistro(data, hora_inicio, dataFinal, hora_fim);
    if (!intervalo) {
      return res.status(400).json({ error: 'Informe um período válido.' });
    }
    if (existeConflitoDeHorario(req.user.id, tipoNormalizado, intervalo)) {
      return res.status(409).json({ error: 'Já existe uma marcação deste tipo que se sobrepõe a esse horário.' });
    }

    let percFinal = 0;
    if (tipoNormalizado === 'HORA_EXTRA') {
      percFinal = Number(porcentagem) === 100 ? 100 : 50;
    }

    let duracaoEfetiva = duracaoHoras;
    let duracaoOriginal = duracaoHoras;
    let horasDeduzidas = 0;
    let mensagemExtra = '';

    // Status e parecer padrão: Sobreaviso é APROVADO de imediato (sem pendência/análise)
    let statusInicial = 'PENDENTE';
    let respostaInicial = '';

    if (tipoNormalizado === 'SOBREAVISO') {
      statusInicial = 'APROVADO';
      respostaInicial = 'Homologação automática (Sem necessidade de análise)';
    }

    // ============================================================
    // REGRA DE COMPENSAÇÃO CALCULADA NA HORA ENTRE H.E. E SOBREAVISO
    // ============================================================

    if (tipoNormalizado === 'HORA_EXTRA') {
      // 1. Abater horas extras do sobreaviso existente no mesmo dia
      const sobreavisosNoDia = db.prepare(`
        SELECT id, duracao_horas, duracao_original, horas_deduzidas
        FROM registros
        WHERE usuario_id = ? AND tipo = 'SOBREAVISO' AND data = ? AND duracao_horas > 0
        ORDER BY id ASC
      `).all(req.user.id, data);

      let horasRestantesParaDeduzir = duracaoHoras;
      let totalDeduzidoDoSobreaviso = 0;

      for (const sob of sobreavisosNoDia) {
        if (horasRestantesParaDeduzir <= 0) break;
        const deducao = Math.min(sob.duracao_horas, horasRestantesParaDeduzir);
        const novaDuracao = Math.round((sob.duracao_horas - deducao) * 100) / 100;
        const novasDeduzidas = Math.round(((sob.horas_deduzidas || 0) + deducao) * 100) / 100;
        const orig = sob.duracao_original || sob.duracao_horas;

        db.prepare(`
          UPDATE registros
          SET duracao_horas = ?,
              duracao_original = ?,
              horas_deduzidas = ?
          WHERE id = ?
        `).run(
          novaDuracao,
          orig,
          novasDeduzidas,
          sob.id
        );

        horasRestantesParaDeduzir -= deducao;
        totalDeduzidoDoSobreaviso += deducao;
      }

      if (totalDeduzidoDoSobreaviso > 0) {
        mensagemExtra = ` (Compensação: deduzidas ${totalDeduzidoDoSobreaviso}h do sobreaviso cadastrado nesta data)`;
      }
    } else if (tipoNormalizado === 'SOBREAVISO') {
      // 2. Se já existem horas extras na data, calcula a compensação na hora
      const extrasNoDia = db.prepare(`
        SELECT COALESCE(SUM(duracao_horas), 0) AS total_extras
        FROM registros
        WHERE usuario_id = ? AND tipo = 'HORA_EXTRA' AND data = ?
      `).get(req.user.id, data);

      const totalExtrasExistentes = Number(extrasNoDia?.total_extras) || 0;

      if (totalExtrasExistentes > 0) {
        horasDeduzidas = Math.min(duracaoHoras, totalExtrasExistentes);
        duracaoEfetiva = Math.max(0, Math.round((duracaoHoras - horasDeduzidas) * 100) / 100);
        mensagemExtra = ` (Compensação aplicada: deduzidas ${horasDeduzidas}h por horas extras realizadas no dia. Duração líquida: ${duracaoEfetiva}h)`;
      }
    }

    const justificativaFinal = justificativa.trim();

    const stmt = db.prepare(`
      INSERT INTO registros (
        usuario_id, tipo, data, hora_inicio, hora_fim, data_fim,
        duracao_horas, duracao_original, horas_deduzidas, porcentagem, justificativa, status, resposta_supervisor
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      req.user.id,
      tipoNormalizado,
      data,
      hora_inicio,
      hora_fim,
      dataFinal,
      duracaoEfetiva,
      duracaoOriginal,
      horasDeduzidas,
      percFinal,
      justificativaFinal,
      statusInicial,
      respostaInicial
    );

    const msgSucesso = tipoNormalizado === 'SOBREAVISO'
      ? `Sobreaviso homologado com sucesso! (Não necessita de aprovação).${mensagemExtra}`
      : `Hora Extra cadastrada com sucesso! Enviada para aprovação.${mensagemExtra}`;

    return res.status(201).json({
      message: msgSucesso,
      registroId: Number(result.lastInsertRowid),
      status: statusInicial,
      duracao_horas: duracaoEfetiva,
      duracao_original: duracaoOriginal,
      horas_deduzidas: horasDeduzidas
    });
  } catch (error) {
    console.error('Erro ao cadastrar registro:', error);
    return res.status(500).json({ error: 'Erro ao cadastrar o registro.' });
  }
});

// Editar uma hora extra enquanto ainda aguarda avaliação do supervisor
app.put('/api/colaborador/registros/:id', autenticarToken, autorizarPerfil('COLABORADOR'), (req, res) => {
  try {
    const registroId = Number(req.params.id);
    const registro = db.prepare(`
      SELECT id, usuario_id, tipo, data, status
      FROM registros
      WHERE id = ? AND usuario_id = ?
    `).get(registroId, req.user.id);

    if (!registro) return res.status(404).json({ error: 'Registro não encontrado.' });
    if (registro.tipo !== 'HORA_EXTRA') {
      return res.status(400).json({ error: 'A edição está disponível apenas para horas extras pendentes.' });
    }
    if (registro.status !== 'PENDENTE') {
      return res.status(400).json({ error: 'Não é possível editar um registro que já foi avaliado pelo supervisor.' });
    }

    const { data, data_fim, hora_inicio, hora_fim, porcentagem, justificativa } = req.body;
    const dataFinal = data_fim || data;
    const justificativaFinal = (justificativa || '').trim();

    if (!data || !hora_inicio || !hora_fim || !justificativaFinal) {
      return res.status(400).json({ error: 'Preencha a data, os horários e a justificativa.' });
    }

    const duracaoHoras = calcularDuracaoHoras(data, hora_inicio, dataFinal, hora_fim);
    const intervalo = criarIntervaloRegistro(data, hora_inicio, dataFinal, hora_fim);
    if (duracaoHoras <= 0 || !intervalo) {
      return res.status(400).json({ error: 'A duração calculada do período deve ser maior que zero.' });
    }
    if (existeConflitoDeHorario(req.user.id, registro.tipo, intervalo, registroId)) {
      return res.status(409).json({ error: 'Já existe uma marcação deste tipo que se sobrepõe a esse horário.' });
    }

    db.exec('BEGIN');
    try {
      db.prepare(`
        UPDATE registros
        SET data = ?, data_fim = ?, hora_inicio = ?, hora_fim = ?,
            duracao_horas = ?, duracao_original = ?, horas_deduzidas = 0,
            porcentagem = ?, justificativa = ?
        WHERE id = ? AND usuario_id = ? AND status = 'PENDENTE'
      `).run(
        data,
        dataFinal,
        hora_inicio,
        hora_fim,
        duracaoHoras,
        duracaoHoras,
        Number(porcentagem) === 100 ? 100 : 50,
        justificativaFinal,
        registroId,
        req.user.id
      );

      for (const dataAfetada of new Set([registro.data, data])) {
        recalcularCompensacaoSobreaviso(req.user.id, dataAfetada);
      }
      db.exec('COMMIT');
    } catch (error) {
      db.exec('ROLLBACK');
      throw error;
    }

    return res.json({ message: 'Hora extra atualizada e enviada para avaliação do supervisor.', duracao_horas: duracaoHoras });
  } catch (error) {
    console.error('Erro ao editar registro:', error);
    return res.status(500).json({ error: 'Erro ao editar o registro.' });
  }
});

// Consultar histórico de registros do colaborador (com filtros opcionais)
app.get('/api/colaborador/registros', autenticarToken, autorizarPerfil('COLABORADOR'), (req, res) => {
  try {
    const { tipo, status, mes_ano } = req.query;

    let sql = 'SELECT * FROM registros WHERE usuario_id = ?';
    const params = [req.user.id];

    if (tipo && tipo !== 'TODOS') {
      sql += ' AND tipo = ?';
      params.push(tipo);
    }

    if (status && status !== 'TODOS') {
      sql += ' AND status = ?';
      params.push(status);
    }

    if (mes_ano) {
      sql += ' AND data LIKE ?';
      params.push(`${mes_ano}%`);
    }

    sql += ' ORDER BY data DESC, hora_inicio DESC';

    const registros = db.prepare(sql).all(...params);
    return res.json(registros);
  } catch (error) {
    console.error('Erro ao buscar registros:', error);
    return res.status(500).json({ error: 'Erro ao consultar o histórico.' });
  }
});

// Excluir registro (Permite excluir PENDENTE ou qualquer SOBREAVISO homologado)
app.delete('/api/colaborador/registros/:id', autenticarToken, autorizarPerfil('COLABORADOR'), (req, res) => {
  try {
    const registroId = Number(req.params.id);
    const registro = db.prepare('SELECT id, usuario_id, tipo, data, duracao_horas, status FROM registros WHERE id = ? AND usuario_id = ?').get(registroId, req.user.id);

    if (!registro) {
      return res.status(404).json({ error: 'Registro não encontrado.' });
    }

    if (registro.tipo !== 'SOBREAVISO' && registro.status !== 'PENDENTE') {
      return res.status(400).json({ error: 'Não é possível excluir horas extras já avaliadas pelo supervisor.' });
    }

    // Se estiver excluindo uma HORA_EXTRA, devolve as horas deduzidas para os registros de SOBREAVISO da mesma data
    if (registro.tipo === 'HORA_EXTRA') {
      const sobreavisos = db.prepare(`
        SELECT id, duracao_horas, duracao_original, horas_deduzidas
        FROM registros
        WHERE usuario_id = ? AND tipo = 'SOBREAVISO' AND data = ? AND horas_deduzidas > 0
        ORDER BY id DESC
      `).all(req.user.id, registro.data);

      let horasParaDevolver = Number(registro.duracao_horas) || 0;
      for (const sob of sobreavisos) {
        if (horasParaDevolver <= 0) break;
        const devolucao = Math.min(sob.horas_deduzidas, horasParaDevolver);
        const novaDuracao = Math.round((sob.duracao_horas + devolucao) * 100) / 100;
        const novasDeduzidas = Math.max(0, Math.round((sob.horas_deduzidas - devolucao) * 100) / 100);

        db.prepare(`
          UPDATE registros
          SET duracao_horas = ?, horas_deduzidas = ?
          WHERE id = ?
        `).run(novaDuracao, novasDeduzidas, sob.id);

        horasParaDevolver -= devolucao;
      }
    }

    db.prepare('DELETE FROM registros WHERE id = ?').run(registroId);
    return res.json({ message: 'Registro excluído com sucesso.' });
  } catch (error) {
    return res.status(500).json({ error: 'Erro ao excluir registro.' });
  }
});

// Ver total de horas e estimativa do valor a receber (Regras CLT)
app.get('/api/colaborador/resumo-financeiro', autenticarToken, autorizarPerfil('COLABORADOR'), (req, res) => {
  try {
    const usuario = db.prepare('SELECT salario, carga_horaria_mensal FROM usuarios WHERE id = ?').get(req.user.id);
    const salarioBase = Number(usuario?.salario) || 0;
    const cargaHoraria = Number(usuario?.carga_horaria_mensal) || 220;
    const valorHoraNormal = cargaHoraria > 0 ? (salarioBase / cargaHoraria) : 0;

    const { mes_ano } = req.query;
    let sql = 'SELECT * FROM registros WHERE usuario_id = ?';
    const params = [req.user.id];

    if (mes_ano) {
      sql += ' AND data LIKE ?';
      params.push(`${mes_ano}%`);
    }

    const registros = db.prepare(sql).all(...params);

    // Totalizadores de Horas (Geral e Aprovadas)
    let horasPonto = 0;
    let horasExtra50 = 0;
    let horasExtra100 = 0;
    let horasSobreaviso = 0;

    let horasExtra50Aprovadas = 0;
    let horasExtra100Aprovadas = 0;
    let horasSobreavisoAprovadas = 0;

    let totalPendentes = 0;
    let totalAprovados = 0;
    let totalReprovados = 0;

    registros.forEach(reg => {
      const dur = Number(reg.duracao_horas) || 0;

      if (reg.status === 'PENDENTE') totalPendentes++;
      if (reg.status === 'APROVADO') totalAprovados++;
      if (reg.status === 'REPROVADO') totalReprovados++;

      if (reg.tipo === 'PONTO') {
        horasPonto += dur;
      } else if (reg.tipo === 'HORA_EXTRA') {
        if (Number(reg.porcentagem) === 100) {
          horasExtra100 += dur;
          if (reg.status === 'APROVADO') horasExtra100Aprovadas += dur;
        } else {
          horasExtra50 += dur;
          if (reg.status === 'APROVADO') horasExtra50Aprovadas += dur;
        }
      } else if (reg.tipo === 'SOBREAVISO') {
        horasSobreaviso += dur;
        if (reg.status === 'APROVADO') horasSobreavisoAprovadas += dur;
      }
    });

    // CÁLCULOS CLT:
    // 1. Hora Extra 50%: valor normal * 1.5
    const valorHE50Unitario = valorHoraNormal * 1.5;
    const valorTotalHE50 = horasExtra50 * valorHE50Unitario;
    const valorAprovadoHE50 = horasExtra50Aprovadas * valorHE50Unitario;

    // 2. Hora Extra 100%: valor normal * 2.0
    const valorHE100Unitario = valorHoraNormal * 2.0;
    const valorTotalHE100 = horasExtra100 * valorHE100Unitario;
    const valorAprovadoHE100 = horasExtra100Aprovadas * valorHE100Unitario;

    // 3. Sobreaviso CLT (Art. 244 § 2º): 1/3 (33,333%) do salário-hora normal
    const valorSobreavisoUnitario = valorHoraNormal / 3;
    const valorTotalSobreaviso = horasSobreaviso * valorSobreavisoUnitario;
    const valorAprovadoSobreaviso = horasSobreavisoAprovadas * valorSobreavisoUnitario;

    // 4. Reflexo no Descanso Semanal Remunerado (DSR CLT):
    // Fórmula padrão estimada: (Total Variáveis) / 25 dias úteis * 5 descansos (fator de 20%)
    const variaveisTotais = valorTotalHE50 + valorTotalHE100 + valorTotalSobreaviso;
    const estimativaDSRTotal = variaveisTotais > 0 ? (variaveisTotais / 25) * 5 : 0;

    const variaveisAprovadas = valorAprovadoHE50 + valorAprovadoHE100 + valorAprovadoSobreaviso;
    const estimativaDSRAprovado = variaveisAprovadas > 0 ? (variaveisAprovadas / 25) * 5 : 0;

    // Totais Finais
    const estimativaTotalReceberGeral = variaveisTotais;
    const totalGarantidoAprovado = variaveisAprovadas;

    return res.json({
      salario_base: salarioBase,
      carga_horaria_mensal: cargaHoraria,
      valor_hora_normal: Math.round(valorHoraNormal * 100) / 100,

      // Horas Acumuladas
      totais_horas: {
        ponto: Math.round(horasPonto * 100) / 100,
        extra_50: Math.round(horasExtra50 * 100) / 100,
        extra_100: Math.round(horasExtra100 * 100) / 100,
        sobreaviso: Math.round(horasSobreaviso * 100) / 100,
        total_geral: Math.round((horasPonto + horasExtra50 + horasExtra100 + horasSobreaviso) * 100) / 100
      },

      // Quantitativos de status
      contagem_status: {
        pendentes: totalPendentes,
        aprovados: totalAprovados,
        reprovados: totalReprovados,
        total_registros: registros.length
      },

      // Valores Financeiros Detalhados (Exclusivos do Colaborador)
      financeiro: {
        valor_hora_base: Math.round(valorHoraNormal * 100) / 100,
        valor_hora_extra_50: Math.round(valorHE50Unitario * 100) / 100,
        valor_hora_extra_100: Math.round(valorHE100Unitario * 100) / 100,
        valor_hora_sobreaviso: Math.round(valorSobreavisoUnitario * 100) / 100,

        subtotal_extra_50: Math.round(valorTotalHE50 * 100) / 100,
        subtotal_extra_100: Math.round(valorTotalHE100 * 100) / 100,
        subtotal_sobreaviso: Math.round(valorTotalSobreaviso * 100) / 100,
        dsr_estimado: Math.round(estimativaDSRTotal * 100) / 100,
        estimativa_total_geral: Math.round(estimativaTotalReceberGeral * 100) / 100,

        aprovado_extra_50: Math.round(valorAprovadoHE50 * 100) / 100,
        aprovado_extra_100: Math.round(valorAprovadoHE100 * 100) / 100,
        aprovado_sobreaviso: Math.round(valorAprovadoSobreaviso * 100) / 100,
        aprovado_dsr: Math.round(estimativaDSRAprovado * 100) / 100,
        total_aprovado_garantido: Math.round(totalGarantidoAprovado * 100) / 100
      }
    });
  } catch (error) {
    console.error('Erro no resumo financeiro:', error);
    return res.status(500).json({ error: 'Erro ao calcular o resumo financeiro.' });
  }
});

// ==========================================
// ROTAS DO SUPERVISOR
// (POLÍTICA DE PRIVACIDADE: NUNCA RETORNA SALÁRIO NEM VALORES FINANCEIROS)
// ==========================================

// Visualizar colaboradores (SEM SALÁRIO!)
app.get('/api/supervisor/colaboradores', autenticarToken, autorizarPerfil('SUPERVISOR'), (req, res) => {
  try {
    const colaboradores = db.prepare(`
      SELECT id, nome, email, cargo, criado_em
      FROM usuarios
      WHERE perfil = 'COLABORADOR'
      ORDER BY nome ASC
    `).all();

    return res.json(colaboradores);
  } catch (error) {
    console.error('Erro ao listar colaboradores:', error);
    return res.status(500).json({ error: 'Erro ao listar colaboradores.' });
  }
});

// Visualizar horas registradas e sobreavisos (com filtros por colaborador, período e status)
// NENHUM campo de salário ou valor em reais é selecionado ou retornado!
app.get('/api/supervisor/registros', autenticarToken, autorizarPerfil('SUPERVISOR'), (req, res) => {
  try {
    const { colaborador_id, status, tipo, mes_ano } = req.query;

    let sql = `
      SELECT 
        r.id,
        r.usuario_id,
        u.nome AS colaborador_nome,
        u.cargo AS colaborador_cargo,
        u.email AS colaborador_email,
        r.tipo,
        r.data,
        r.hora_inicio,
        r.hora_fim,
        r.data_fim,
        r.duracao_horas,
        r.porcentagem,
        r.justificativa,
        r.status,
        r.resposta_supervisor,
        r.analisado_em,
        r.criado_em
      FROM registros r
      INNER JOIN usuarios u ON r.usuario_id = u.id
      WHERE 1=1
    `;
    const params = [];

    if (colaborador_id && colaborador_id !== 'TODOS') {
      sql += ' AND r.usuario_id = ?';
      params.push(Number(colaborador_id));
    }

    if (status && status !== 'TODOS') {
      sql += ' AND r.status = ?';
      params.push(status);
    }

    if (tipo && tipo !== 'TODOS') {
      sql += ' AND r.tipo = ?';
      params.push(tipo);
    }

    if (mes_ano) {
      sql += ' AND r.data LIKE ?';
      params.push(`${mes_ano}%`);
    }

    sql += ' ORDER BY r.data DESC, r.hora_inicio DESC';

    const registros = db.prepare(sql).all(...params);
    return res.json(registros);
  } catch (error) {
    console.error('Erro ao listar registros para o supervisor:', error);
    return res.status(500).json({ error: 'Erro ao listar registros de colaboradores.' });
  }
});

// Aprovar ou reprovar registro com justificativa do supervisor
app.put('/api/supervisor/registros/:id/avaliar', autenticarToken, autorizarPerfil('SUPERVISOR'), (req, res) => {
  try {
    const registroId = Number(req.params.id);
    const { status, resposta_supervisor } = req.body;

    if (!['APROVADO', 'REPROVADO'].includes(status)) {
      return res.status(400).json({ error: 'Status inválido. Escolha APROVADO ou REPROVADO.' });
    }

    const registro = db.prepare('SELECT id FROM registros WHERE id = ?').get(registroId);
    if (!registro) {
      return res.status(404).json({ error: 'Registro não encontrado.' });
    }

    const agora = new Date().toISOString().replace('T', ' ').substring(0, 19);

    db.prepare(`
      UPDATE registros
      SET status = ?, resposta_supervisor = ?, analisado_por = ?, analisado_em = ?
      WHERE id = ?
    `).run(
      status,
      (resposta_supervisor || '').trim(),
      req.user.id,
      agora,
      registroId
    );

    return res.json({
      message: `Registro marcado como ${status} com sucesso!`,
      status,
      resposta_supervisor: resposta_supervisor || ''
    });
  } catch (error) {
    console.error('Erro ao avaliar registro:', error);
    return res.status(500).json({ error: 'Erro ao processar a avaliação do registro.' });
  }
});

// Consultar totais de horas (SEM DADOS FINANCEIROS)
app.get('/api/supervisor/totais', autenticarToken, autorizarPerfil('SUPERVISOR'), (req, res) => {
  try {
    const { mes_ano, colaborador_id } = req.query;

    let filtroSql = ' WHERE 1=1';
    const params = [];

    if (colaborador_id && colaborador_id !== 'TODOS') {
      filtroSql += ' AND r.usuario_id = ?';
      params.push(Number(colaborador_id));
    }

    if (mes_ano) {
      filtroSql += ' AND r.data LIKE ?';
      params.push(`${mes_ano}%`);
    }

    const registros = db.prepare(`
      SELECT 
        r.usuario_id,
        u.nome AS colaborador_nome,
        r.tipo,
        r.porcentagem,
        r.duracao_horas,
        r.status
      FROM registros r
      INNER JOIN usuarios u ON r.usuario_id = u.id
      ${filtroSql}
    `).all(...params);

    let totalHorasPonto = 0;
    let totalHorasExtra50 = 0;
    let totalHorasExtra100 = 0;
    let totalHorasSobreaviso = 0;

    let pendentes = 0;
    let aprovados = 0;
    let reprovados = 0;

    const porColaborador = {};

    registros.forEach(reg => {
      const dur = Number(reg.duracao_horas) || 0;

      if (reg.status === 'PENDENTE') pendentes++;
      if (reg.status === 'APROVADO') aprovados++;
      if (reg.status === 'REPROVADO') reprovados++;

      if (reg.tipo === 'PONTO') totalHorasPonto += dur;
      else if (reg.tipo === 'HORA_EXTRA') {
        if (Number(reg.porcentagem) === 100) totalHorasExtra100 += dur;
        else totalHorasExtra50 += dur;
      } else if (reg.tipo === 'SOBREAVISO') {
        totalHorasSobreaviso += dur;
      }

      if (!porColaborador[reg.usuario_id]) {
        porColaborador[reg.usuario_id] = {
          nome: reg.colaborador_nome,
          ponto: 0,
          extra_50: 0,
          extra_100: 0,
          sobreaviso: 0,
          total_horas: 0,
          pendentes: 0,
          aprovados: 0,
          reprovados: 0
        };
      }

      const colab = porColaborador[reg.usuario_id];
      if (reg.tipo === 'PONTO') colab.ponto += dur;
      else if (reg.tipo === 'HORA_EXTRA') {
        if (Number(reg.porcentagem) === 100) colab.extra_100 += dur;
        else colab.extra_50 += dur;
      } else if (reg.tipo === 'SOBREAVISO') {
        colab.sobreaviso += dur;
      }
      colab.total_horas += dur;

      if (reg.status === 'PENDENTE') colab.pendentes++;
      if (reg.status === 'APROVADO') colab.aprovados++;
      if (reg.status === 'REPROVADO') colab.reprovados++;
    });

    const totalColaboradores = db.prepare("SELECT COUNT(*) as total FROM usuarios WHERE perfil = 'COLABORADOR'").get().total;

    return res.json({
      resumo_geral: {
        total_colaboradores: Number(totalColaboradores),
        horas_ponto: Math.round(totalHorasPonto * 100) / 100,
        horas_extra_50: Math.round(totalHorasExtra50 * 100) / 100,
        horas_extra_100: Math.round(totalHorasExtra100 * 100) / 100,
        horas_sobreaviso: Math.round(totalHorasSobreaviso * 100) / 100,
        total_horas_geral: Math.round((totalHorasPonto + totalHorasExtra50 + totalHorasExtra100 + totalHorasSobreaviso) * 100) / 100,
        contagem: {
          pendentes,
          aprovados,
          reprovados,
          total: registros.length
        }
      },
      consolidado_por_colaborador: Object.values(porColaborador)
    });
  } catch (error) {
    console.error('Erro ao calcular totais para o supervisor:', error);
    return res.status(500).json({ error: 'Erro ao calcular totais de horas.' });
  }
});

// Fallback para servir o index.html na raiz (compatível com Express 5)
app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Inicia o servidor
app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`🚀 Sistema de Ponto, Horas Extras e Sobreaviso Ativo!`);
  console.log(`📡 URL Local: http://localhost:${PORT}`);
  console.log(`👥 Perfis: Colaborador e Supervisor configurados.`);
  console.log(`🔒 Regra de privacidade ativa: Supervisor sem dados financeiros.`);
  console.log(`====================================================`);
});
