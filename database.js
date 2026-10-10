const { DatabaseSync } = require('node:sqlite');
const path = require('path');
const bcrypt = require('bcryptjs');

const dbPath = path.join(__dirname, 'database.sqlite');
const db = new DatabaseSync(dbPath);

// Configuração do modo WAL e Foreign Keys
db.exec('PRAGMA foreign_keys = ON;');

function inicializarBanco() {
  // Tabela de Usuários com Perfil (COLABORADOR ou SUPERVISOR)
  db.exec(`
    CREATE TABLE IF NOT EXISTS usuarios (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      senha TEXT NOT NULL,
      cargo TEXT DEFAULT '',
      perfil TEXT NOT NULL CHECK (perfil IN ('COLABORADOR', 'SUPERVISOR')),
      salario REAL DEFAULT 0,
      carga_horaria_mensal INTEGER DEFAULT 220,
      criado_em TEXT DEFAULT (datetime('now', 'localtime'))
    );
  `);

  // Tabela de Registros (Ponto, Horas Extras e Sobreaviso)
  db.exec(`
    CREATE TABLE IF NOT EXISTS registros (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
      tipo TEXT NOT NULL CHECK (tipo IN ('PONTO', 'HORA_EXTRA', 'SOBREAVISO')),
      data TEXT NOT NULL,
      hora_inicio TEXT NOT NULL,
      hora_fim TEXT NOT NULL,
      data_fim TEXT,
      duracao_horas REAL NOT NULL,
      duracao_original REAL,
      horas_deduzidas REAL DEFAULT 0,
      porcentagem REAL DEFAULT 0,
      justificativa TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'PENDENTE' CHECK (status IN ('PENDENTE', 'APROVADO', 'REPROVADO')),
      resposta_supervisor TEXT DEFAULT '',
      analisado_por INTEGER REFERENCES usuarios(id),
      analisado_em TEXT,
      criado_em TEXT DEFAULT (datetime('now', 'localtime'))
    );
  `);

  // Migração suave para bancos existentes
  try {
    db.exec('ALTER TABLE registros ADD COLUMN duracao_original REAL;');
  } catch (e) {}
  try {
    db.exec('ALTER TABLE registros ADD COLUMN horas_deduzidas REAL DEFAULT 0;');
  } catch (e) {}
  try {
    db.exec('UPDATE registros SET duracao_original = duracao_horas WHERE duracao_original IS NULL;');
  } catch (e) {}

  // Verificar se existem usuários, senão insere dados de demonstração
  const countUsers = db.prepare('SELECT COUNT(*) as total FROM usuarios').get();
  if (countUsers.total === 0 || countUsers.total === 0n) {
    console.log('🌱 Populando banco com dados de demonstração para a Aula...');

    const salt = bcrypt.genSaltSync(10);
    const senhaPadrao = bcrypt.hashSync('123456', salt);

    // Inserir Supervisor Demo
    const insSupervisor = db.prepare(`
      INSERT INTO usuarios (nome, email, senha, cargo, perfil, salario, carga_horaria_mensal)
      VALUES (?, ?, ?, ?, 'SUPERVISOR', 0, 220)
    `);
    const supervisorRes = insSupervisor.run(
      'Carlos Supervisor',
      'supervisor@empresa.com',
      senhaPadrao,
      'Supervisor de Operações e RH'
    );
    const supervisorId = Number(supervisorRes.lastInsertRowid);

    // Inserir Colaborador Demo 1
    const insColaborador = db.prepare(`
      INSERT INTO usuarios (nome, email, senha, cargo, perfil, salario, carga_horaria_mensal)
      VALUES (?, ?, ?, ?, 'COLABORADOR', ?, 220)
    `);
    const colabRes1 = insColaborador.run(
      'João Silva',
      'joao@empresa.com',
      senhaPadrao,
      'Analista de Suporte Técnico',
      3300.00 // R$ 3.300,00 -> R$ 15,00/hora base
    );
    const joaoId = Number(colabRes1.lastInsertRowid);

    // Inserir Colaborador Demo 2
    const colabRes2 = insColaborador.run(
      'Maria Oliveira',
      'maria@empresa.com',
      senhaPadrao,
      'Desenvolvedora Pleno',
      5500.00 // R$ 5.500,00 -> R$ 25,00/hora base
    );
    const mariaId = Number(colabRes2.lastInsertRowid);

    // Inserir Registros de Demonstração para João
    const insRegistro = db.prepare(`
      INSERT INTO registros (usuario_id, tipo, data, hora_inicio, hora_fim, data_fim, duracao_horas, porcentagem, justificativa, status, resposta_supervisor, analisado_por, analisado_em)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    // 1. Ponto normal aprovado
    insRegistro.run(
      joaoId,
      'PONTO',
      '2026-09-28',
      '08:00',
      '17:00',
      '2026-09-28',
      8.0,
      0,
      'Registro regular de jornada com intervalo intrajornada cumprido.',
      'APROVADO',
      'Jornada validada conforme escala regular.',
      supervisorId,
      '2026-09-28 17:30:00'
    );

    // 2. Hora Extra 50% Aprovada
    insRegistro.run(
      joaoId,
      'HORA_EXTRA',
      '2026-09-28',
      '17:00',
      '19:30',
      '2026-09-28',
      2.5,
      50,
      'Atendimento emergencial de chamado crítico de instabilidade no servidor.',
      'APROVADO',
      'Incidente reportado e autorizado.',
      supervisorId,
      '2026-09-28 20:00:00'
    );

    // 3. Sobreaviso Pendente (Plantão de Final de Semana)
    insRegistro.run(
      joaoId,
      'SOBREAVISO',
      '2026-09-26',
      '08:00',
      '20:00',
      '2026-09-26',
      12.0,
      0,
      'Plantão de sobreaviso no sábado para monitoramento de deploy de produção.',
      'PENDENTE',
      '',
      null,
      null
    );

    // 4. Hora Extra 100% Pendente (Domingo)
    insRegistro.run(
      joaoId,
      'HORA_EXTRA',
      '2026-09-27',
      '09:00',
      '13:00',
      '2026-09-27',
      4.0,
      100,
      'Manutenção preventiva emergencial de banco de dados no domingo.',
      'PENDENTE',
      '',
      null,
      null
    );

    // 5. Registro de Maria (Sobreaviso Aprovado)
    insRegistro.run(
      mariaId,
      'SOBREAVISO',
      '2026-09-25',
      '18:00',
      '06:00',
      '2026-09-26',
      12.0,
      0,
      'Escala noturna de prontidão/sobreaviso da equipe de desenvolvimento.',
      'APROVADO',
      'Escala previamente alinhada com a coordenação.',
      supervisorId,
      '2026-09-26 09:00:00'
    );

    console.log('✅ Dados de demonstração inicializados com sucesso!');
  }
}

module.exports = {
  db,
  inicializarBanco
};
