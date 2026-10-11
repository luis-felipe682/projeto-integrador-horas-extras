// Estado global da aplicação
let token = localStorage.getItem('ponto_token') || null;
let usuarioLogado = null;
let idRegistroEmAvaliacao = null;
let statusDecisaoSupervisor = null;
let registrosHistoricoColaborador = [];
let registroEmEdicaoId = null;

// ==========================================
// INICIALIZAÇÃO E RELÓGIO AO VIVO
// ==========================================

document.addEventListener('DOMContentLoaded', () => {
  iniciarRelogio();
  inicializarDatasInputs();

  if (token) {
    validarSessaoExistente();
  } else {
    exibirVisao('auth');
  }
});

function iniciarRelogio() {
  function tick() {
    const agora = new Date();
    const horaEl = document.getElementById('live-clock');
    const dataEl = document.getElementById('live-date');

    if (horaEl) {
      horaEl.textContent = agora.toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hourCycle: 'h23'
      });
    }
    if (dataEl) {
      const opcoes = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
      dataEl.textContent = agora.toLocaleDateString('pt-BR', opcoes);
    }
  }
  tick();
  setInterval(tick, 1000);
}

function inicializarDatasInputs() {
  const hoje = new Date().toISOString().split('T')[0];
  const mesAtual = hoje.substring(0, 7);

  const extraInicio = document.getElementById('extra-data-inicio');
  const extraFim = document.getElementById('extra-data-fim');
  if (extraInicio) extraInicio.value = hoje;
  if (extraFim) extraFim.value = hoje;

  const sobInicio = document.getElementById('sobreaviso-data-inicio');
  const sobFim = document.getElementById('sobreaviso-data-fim');
  if (sobInicio) sobInicio.value = hoje;
  if (sobFim) sobFim.value = hoje;

  const colabMes = document.getElementById('colab-filtro-mes');
  const supMes = document.getElementById('sup-filtro-mes');
  if (colabMes) colabMes.value = mesAtual;
  if (supMes) supMes.value = mesAtual;
}

// ==========================================
// UTILITÁRIOS E TOASTS
// ==========================================

function exibirToast(mensagem, tipo = 'info') {
  const toast = document.getElementById('toast');
  toast.textContent = mensagem;
  toast.className = `toast ${tipo}`;
  toast.classList.remove('hidden');

  setTimeout(() => {
    toast.classList.add('hidden');
  }, 4000);
}

function formatarMoeda(valor) {
  return Number(valor || 0).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  });
}

function formatarDataBR(dataStr) {
  if (!dataStr) return '-';
  const partes = dataStr.split('-');
  if (partes.length === 3) {
    return `${partes[2]}/${partes[1]}/${partes[0]}`;
  }
  return dataStr;
}

// ==========================================
// CONTROLE DE NAVEGAÇÃO E TELAS
// ==========================================

function exibirVisao(visao) {
  const viewAuth = document.getElementById('view-auth');
  const viewColab = document.getElementById('view-colaborador');
  const viewSup = document.getElementById('view-supervisor');
  const userSession = document.getElementById('user-session');

  viewAuth.classList.add('hidden');
  viewColab.classList.add('hidden');
  viewSup.classList.add('hidden');

  if (visao === 'auth') {
    viewAuth.classList.remove('hidden');
    userSession.classList.add('hidden');
  } else if (visao === 'colaborador') {
    viewColab.classList.remove('hidden');
    userSession.classList.remove('hidden');
    atualizarHeaderUsuario();
    carregarDashboardColaborador();
  } else if (visao === 'supervisor') {
    viewSup.classList.remove('hidden');
    userSession.classList.remove('hidden');
    atualizarHeaderUsuario();
    carregarDashboardSupervisor();
  }
}

function atualizarHeaderUsuario() {
  if (!usuarioLogado) return;
  document.getElementById('session-user-name').textContent = usuarioLogado.nome;
  const roleBadge = document.getElementById('session-user-role');
  roleBadge.textContent = usuarioLogado.perfil;
  roleBadge.className = `role-badge ${usuarioLogado.perfil.toLowerCase()}`;
  document.getElementById('session-user-cargo').textContent = usuarioLogado.cargo || 'Geral';
}

function alternarAbaAuth(aba) {
  const btnLogin = document.getElementById('tab-btn-login');
  const btnCad = document.getElementById('tab-btn-cadastro');
  const formLogin = document.getElementById('form-login');
  const formCad = document.getElementById('form-cadastro');

  if (aba === 'login') {
    btnLogin.classList.add('active');
    btnCad.classList.remove('active');
    formLogin.classList.remove('hidden');
    formCad.classList.add('hidden');
  } else {
    btnCad.classList.add('active');
    btnLogin.classList.remove('active');
    formCad.classList.remove('hidden');
    formLogin.classList.add('hidden');
  }
}

function aoMudarPerfilCadastro() {
  const perfil = document.getElementById('cad-perfil').value;
  const blocoSalario = document.getElementById('bloco-salario-cadastro');
  if (perfil === 'SUPERVISOR') {
    blocoSalario.classList.add('hidden');
  } else {
    blocoSalario.classList.remove('hidden');
  }
}

function preencherDemo(tipo) {
  alternarAbaAuth('login');
  if (tipo === 'colaborador') {
    document.getElementById('login-email').value = 'joao@empresa.com';
    document.getElementById('login-senha').value = '123456';
    exibirToast('Dados do colaborador João preenchidos!', 'info');
  } else {
    document.getElementById('login-email').value = 'supervisor@empresa.com';
    document.getElementById('login-senha').value = '123456';
    exibirToast('Dados do supervisor Carlos preenchidos!', 'info');
  }
}

// ==========================================
// AUTENTICAÇÃO E SESSÃO
// ==========================================

async function realizarLogin(e) {
  e.preventDefault();
  const email = document.getElementById('login-email').value.trim();
  const senha = document.getElementById('login-senha').value;

  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, senha })
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Erro ao realizar login.');

    token = data.token;
    usuarioLogado = data.usuario;
    localStorage.setItem('ponto_token', token);

    exibirToast(data.message || 'Login efetuado com sucesso!', 'success');

    if (usuarioLogado.perfil === 'SUPERVISOR') {
      exibirVisao('supervisor');
    } else {
      exibirVisao('colaborador');
    }
  } catch (err) {
    exibirToast(err.message, 'error');
  }
}

async function realizarCadastro(e) {
  e.preventDefault();
  const nome = document.getElementById('cad-nome').value.trim();
  const email = document.getElementById('cad-email').value.trim();
  const senha = document.getElementById('cad-senha').value;
  const cargo = document.getElementById('cad-cargo').value.trim();
  const perfil = document.getElementById('cad-perfil').value;
  const salario = Number(document.getElementById('cad-salario').value) || 0;
  const carga_horaria_mensal = Number(document.getElementById('cad-carga').value) || 220;

  try {
    const res = await fetch('/api/auth/cadastro', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nome,
        email,
        senha,
        cargo,
        perfil,
        salario,
        carga_horaria_mensal
      })
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Erro ao criar conta.');

    exibirToast('Conta cadastrada com sucesso! Faça login.', 'success');
    alternarAbaAuth('login');
    document.getElementById('login-email').value = email;
    document.getElementById('login-senha').value = '';
  } catch (err) {
    exibirToast(err.message, 'error');
  }
}

async function validarSessaoExistente() {
  try {
    const res = await fetch('/api/auth/me', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) throw new Error('Sessão expirada.');
    usuarioLogado = await res.json();

    if (usuarioLogado.perfil === 'SUPERVISOR') {
      exibirVisao('supervisor');
    } else {
      exibirVisao('colaborador');
    }
  } catch (err) {
    fazerLogout();
  }
}

function fazerLogout() {
  token = null;
  usuarioLogado = null;
  localStorage.removeItem('ponto_token');
  exibirToast('Você saiu do sistema.', 'info');
  exibirVisao('auth');
}

// ==========================================
// PORTAL DO COLABORADOR
// ==========================================

function trocarAbaColaborador(aba) {
  const tabs = ['extra', 'sobreaviso', 'historico'];
  tabs.forEach(t => {
    const btn = document.getElementById(`colab-tab-${t}`);
    const sec = document.getElementById(`colab-secao-${t}`);
    if (btn && sec) {
      if (t === aba) {
        btn.classList.add('active');
        sec.classList.remove('hidden');
      } else {
        btn.classList.remove('active');
        sec.classList.add('hidden');
      }
    }
  });

  if (aba === 'extra') {
    aoMudarDataExtra();
  } else if (aba === 'sobreaviso') {
    aoMudarDataSobreaviso();
  } else if (aba === 'historico') {
    carregarHistoricoColaborador();
  }
}

async function carregarDashboardColaborador() {
  document.getElementById('colab-boas-vindas').textContent = `Olá, ${usuarioLogado.nome}!`;
  await carregarResumoFinanceiroColaborador();
  await carregarHistoricoColaborador();
  trocarAbaColaborador('extra');
}

async function carregarResumoFinanceiroColaborador() {
  try {
    const mesAno = document.getElementById('colab-filtro-mes')?.value || '';
    let url = '/api/colaborador/resumo-financeiro';
    if (mesAno) url += `?mes_ano=${mesAno}`;

    const res = await fetch(url, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) throw new Error('Erro ao obter resumo financeiro.');
    const dados = await res.json();

    // Atualizar dados de salário
    document.getElementById('card-salario-base').textContent = formatarMoeda(dados.salario_base);
    document.getElementById('card-valor-hora').textContent = `${formatarMoeda(dados.valor_hora_normal)}/h`;

    // Atualizar métricas de horas e valores
    document.getElementById('metric-he50-horas').textContent = `${dados.totais_horas.extra_50}h`;
    document.getElementById('metric-he50-reais').textContent = `${formatarMoeda(dados.financeiro.subtotal_extra_50)} (+50% CLT)`;

    document.getElementById('metric-he100-horas').textContent = `${dados.totais_horas.extra_100}h`;
    document.getElementById('metric-he100-reais').textContent = `${formatarMoeda(dados.financeiro.subtotal_extra_100)} (100% Feriados)`;

    document.getElementById('metric-sobreaviso-horas').textContent = `${dados.totais_horas.sobreaviso}h`;
    document.getElementById('metric-sobreaviso-reais').textContent = `${formatarMoeda(dados.financeiro.subtotal_sobreaviso)} (1/3 CLT)`;

    document.getElementById('metric-total-receber').textContent = formatarMoeda(dados.financeiro.estimativa_total_geral);
    document.getElementById('metric-total-aprovado').textContent = `Apenas Aprovados: ${formatarMoeda(dados.financeiro.total_aprovado_garantido)}`;
  } catch (err) {
    console.error(err);
  }
}

async function carregarHistoricoColaborador() {
  try {
    const tipo = document.getElementById('colab-filtro-tipo').value;
    const status = document.getElementById('colab-filtro-status').value;
    const mes_ano = document.getElementById('colab-filtro-mes').value;

    const params = new URLSearchParams();
    if (tipo !== 'TODOS') params.append('tipo', tipo);
    if (status !== 'TODOS') params.append('status', status);
    if (mes_ano) params.append('mes_ano', mes_ano);

    const res = await fetch(`/api/colaborador/registros?${params.toString()}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) throw new Error('Erro ao listar registros.');

    const registros = await res.json();
    registrosHistoricoColaborador = registros;
    const tbody = document.getElementById('colab-tabela-historico');
    tbody.innerHTML = '';

    if (registros.length === 0) {
      tbody.innerHTML = `<tr><td colspan="8" class="text-center text-muted" style="padding: 24px;">Nenhum registro encontrado para os filtros selecionados.</td></tr>`;
      return;
    }

    registros.forEach(reg => {
      const tr = document.createElement('tr');

      // Tipo Badge
      let badgeTipo = '';
      if (reg.tipo === 'PONTO') badgeTipo = '<span class="badge-tipo ponto">⏱️ Ponto Regular</span>';
      else if (reg.tipo === 'HORA_EXTRA') {
        badgeTipo = reg.porcentagem === 100
          ? '<span class="badge-tipo he100">🔥 Extra 100%</span>'
          : '<span class="badge-tipo he50">⚡ Extra 50%</span>';
      } else if (reg.tipo === 'SOBREAVISO') {
        badgeTipo = '<span class="badge-tipo sobreaviso">📡 Sobreaviso (1/3)</span>';
      }

      // Status Badge
      let badgeStatus = '';
      if (reg.status === 'PENDENTE') badgeStatus = '<span class="badge-status pendente">🟡 Pendente</span>';
      else if (reg.status === 'APROVADO') badgeStatus = '<span class="badge-status aprovado">🟢 Aprovado</span>';
      else if (reg.status === 'REPROVADO') badgeStatus = '<span class="badge-status reprovado">🔴 Reprovado</span>';

      // Horário formatado
      const horarioStr = `${reg.hora_inicio} às ${reg.hora_fim}${reg.data_fim && reg.data_fim !== reg.data ? ` (${formatarDataBR(reg.data_fim)})` : ''}`;

      // Formatação da Duração com indicação clara se houve compensação/dedução
      let duracaoHtml = `<strong>${reg.duracao_horas}h</strong>`;
      if (reg.horas_deduzidas && Number(reg.horas_deduzidas) > 0) {
        const durOrig = reg.duracao_original || (Number(reg.duracao_horas) + Number(reg.horas_deduzidas));
        duracaoHtml += `
          <div style="font-size: 0.72rem; color: #fbbf24; margin-top: 3px; font-weight: 600;">
            Original: ${durOrig}h (-${reg.horas_deduzidas}h por H.E.)
          </div>
        `;
      }

      tr.innerHTML = `
        <td><strong>${formatarDataBR(reg.data)}</strong></td>
        <td>${badgeTipo}</td>
        <td>${horarioStr}</td>
        <td>${duracaoHtml}</td>
        <td style="max-width: 260px;">${reg.justificativa}</td>
        <td>${badgeStatus}</td>
        <td class="text-muted">${reg.resposta_supervisor || '<em>Aguardando análise</em>'}</td>
        <td>
          ${reg.status === 'PENDENTE'
            ? `${reg.tipo === 'HORA_EXTRA' ? `<button class="btn btn-sm btn-outline" onclick="abrirModalEditarRegistro(${reg.id})" title="Editar hora extra" aria-label="Editar hora extra">✎</button>` : ''}
              <button class="btn btn-sm btn-outline-danger" onclick="excluirRegistro(${reg.id})" title="Excluir Solicitação Pendente" aria-label="Excluir registro">🗑️</button>`
            : '<span class="text-muted" style="font-size:0.75rem;">Avaliado</span>'
          }
        </td>
      `;
      tbody.appendChild(tr);
    });
  } catch (err) {
    exibirToast(err.message, 'error');
  }
}

// ==========================================
// FUNÇÕES AUXILIARES DE COMPENSAÇÃO E PRÉVIAS
// ==========================================

async function verificarDeducaoData(tipo) {
  try {
    const dataInput = tipo === 'extra'
      ? document.getElementById('extra-data-inicio')?.value
      : document.getElementById('sobreaviso-data-inicio')?.value;

    if (!dataInput) return;

    const res = await fetch(`/api/colaborador/checar-dia?data=${dataInput}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) return;
    const info = await res.json();

    if (tipo === 'extra') {
      const alerta = document.getElementById('extra-alerta-deducao');
      if (info.total_sobreaviso > 0) {
        alerta.innerHTML = `⚡ <strong>Compensação Automática Detectada:</strong> Você possui <strong>${info.total_sobreaviso}h de sobreaviso</strong> nesta data. Ao cadastrar horas extras, o tempo trabalhado será abatido diretamente do sobreaviso!`;
        alerta.classList.remove('hidden');
      } else {
        alerta.classList.add('hidden');
      }
    } else if (tipo === 'sobreaviso') {
      const alerta = document.getElementById('sobreaviso-alerta-deducao');
      if (info.total_extra > 0) {
        alerta.innerHTML = `⚡ <strong>Compensação Automática Detectada:</strong> Você possui <strong>${info.total_extra}h de horas extras</strong> realizadas nesta data. O sobreaviso lançado terá <strong>${info.total_extra}h deduzidas automaticamente</strong>.`;
        alerta.classList.remove('hidden');
      } else {
        alerta.classList.add('hidden');
      }
    }
  } catch (e) {
    console.error(e);
  }
}

function aoMudarDataExtra() {
  const dInicio = document.getElementById('extra-data-inicio')?.value;
  const dFim = document.getElementById('extra-data-fim');
  if (dInicio && dFim && !dFim.value) dFim.value = dInicio;
  atualizarPreviaDuracaoExtra();
  verificarDeducaoData('extra');
}

function aoMudarDataSobreaviso() {
  const dInicio = document.getElementById('sobreaviso-data-inicio')?.value;
  const dFim = document.getElementById('sobreaviso-data-fim');
  if (dInicio && dFim && !dFim.value) dFim.value = dInicio;
  atualizarPreviaDuracaoSobreaviso();
  verificarDeducaoData('sobreaviso');
}

function aoMudarTipoExtra() {
  const tipo = document.getElementById('extra-tipo').value;
  const just = document.getElementById('extra-justificativa');
  if (tipo === 'HORA_EXTRA_100') {
    just.placeholder = 'Ex: Trabalho extraordinário no domingo/feriado para deploy urgente ou reparo em banco de dados.';
  } else {
    just.placeholder = 'Ex: Atendimento emergencial ou extensão de jornada em dia útil.';
  }
  atualizarPreviaDuracaoExtra();
}

function atualizarPreviaDuracaoExtra() {
  const dInicio = document.getElementById('extra-data-inicio')?.value;
  const hInicio = document.getElementById('extra-hora-inicio')?.value;
  const dFim = document.getElementById('extra-data-fim')?.value;
  const hFim = document.getElementById('extra-hora-fim')?.value;

  if (!dInicio || !hInicio || !dFim || !hFim) return;

  try {
    let dtInicio = new Date(`${dInicio}T${hInicio}:00`);
    let dtFim = new Date(`${dFim}T${hFim}:00`);

    if (dInicio === dFim && dtFim < dtInicio) {
      dtFim.setDate(dtFim.getDate() + 1);
    }

    const diff = (dtFim - dtInicio) / (1000 * 60 * 60);
    const duracao = diff > 0 ? (Math.round(diff * 100) / 100) : 0;
    document.getElementById('extra-duracao-previa').textContent = `${duracao}h`;
  } catch (e) {
    document.getElementById('extra-duracao-previa').textContent = '0.0h';
  }
}

function atualizarPreviaDuracaoSobreaviso() {
  const dInicio = document.getElementById('sobreaviso-data-inicio')?.value;
  const hInicio = document.getElementById('sobreaviso-hora-inicio')?.value;
  const dFim = document.getElementById('sobreaviso-data-fim')?.value;
  const hFim = document.getElementById('sobreaviso-hora-fim')?.value;

  if (!dInicio || !hInicio || !dFim || !hFim) return;

  try {
    let dtInicio = new Date(`${dInicio}T${hInicio}:00`);
    let dtFim = new Date(`${dFim}T${hFim}:00`);

    if (dInicio === dFim && dtFim < dtInicio) {
      dtFim.setDate(dtFim.getDate() + 1);
    }

    const diff = (dtFim - dtInicio) / (1000 * 60 * 60);
    const duracao = diff > 0 ? (Math.round(diff * 100) / 100) : 0;
    document.getElementById('sobreaviso-duracao-previa').textContent = `${duracao}h`;
  } catch (e) {
    document.getElementById('sobreaviso-duracao-previa').textContent = '0.0h';
  }
}

// Lançamento de Hora Extra
async function salvarRegistroExtra(e) {
  e.preventDefault();
  const selectTipo = document.getElementById('extra-tipo').value;
  const data = document.getElementById('extra-data-inicio').value;
  const data_fim = document.getElementById('extra-data-fim').value || data;
  const hora_inicio = document.getElementById('extra-hora-inicio').value;
  const hora_fim = document.getElementById('extra-hora-fim').value;
  const justificativa = document.getElementById('extra-justificativa').value.trim();

  const porcentagem = selectTipo === 'HORA_EXTRA_100' ? 100 : 50;

  try {
    const res = await fetch('/api/colaborador/registros', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        tipo: 'HORA_EXTRA',
        data,
        data_fim,
        hora_inicio,
        hora_fim,
        porcentagem,
        justificativa
      })
    });

    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'Erro ao registrar hora extra.');

    exibirToast(result.message, 'success');
    document.getElementById('form-registro-extra').reset();
    inicializarDatasInputs();
    trocarAbaColaborador('historico');
    carregarResumoFinanceiroColaborador();
  } catch (err) {
    exibirToast(err.message, 'error');
  }
}

// Lançamento de Sobreaviso
async function salvarRegistroSobreaviso(e) {
  e.preventDefault();
  const data = document.getElementById('sobreaviso-data-inicio').value;
  const data_fim = document.getElementById('sobreaviso-data-fim').value || data;
  const hora_inicio = document.getElementById('sobreaviso-hora-inicio').value;
  const hora_fim = document.getElementById('sobreaviso-hora-fim').value;
  const justificativa = document.getElementById('sobreaviso-justificativa').value.trim();

  try {
    const res = await fetch('/api/colaborador/registros', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        tipo: 'SOBREAVISO',
        data,
        data_fim,
        hora_inicio,
        hora_fim,
        porcentagem: 0,
        justificativa
      })
    });

    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'Erro ao registrar sobreaviso.');

    exibirToast(result.message, 'success');
    document.getElementById('form-registro-sobreaviso').reset();
    inicializarDatasInputs();
    trocarAbaColaborador('historico');
    carregarResumoFinanceiroColaborador();
  } catch (err) {
    exibirToast(err.message, 'error');
  }
}

function abrirModalEditarRegistro(id) {
  const registro = registrosHistoricoColaborador.find(item => Number(item.id) === Number(id));
  if (!registro || registro.tipo !== 'HORA_EXTRA' || registro.status !== 'PENDENTE') return;

  registroEmEdicaoId = registro.id;
  document.getElementById('editar-data-inicio').value = registro.data;
  document.getElementById('editar-data-fim').value = registro.data_fim || registro.data;
  document.getElementById('editar-hora-inicio').value = registro.hora_inicio;
  document.getElementById('editar-hora-fim').value = registro.hora_fim;
  document.getElementById('editar-porcentagem').value = Number(registro.porcentagem) === 100 ? '100' : '50';
  document.getElementById('editar-justificativa').value = registro.justificativa;
  document.getElementById('modal-editar-registro').classList.remove('hidden');
}

function fecharModalEditarRegistro() {
  registroEmEdicaoId = null;
  document.getElementById('modal-editar-registro').classList.add('hidden');
}

async function salvarEdicaoRegistro(event) {
  event.preventDefault();
  if (!registroEmEdicaoId) return;

  const dados = {
    data: document.getElementById('editar-data-inicio').value,
    data_fim: document.getElementById('editar-data-fim').value,
    hora_inicio: document.getElementById('editar-hora-inicio').value,
    hora_fim: document.getElementById('editar-hora-fim').value,
    porcentagem: Number(document.getElementById('editar-porcentagem').value),
    justificativa: document.getElementById('editar-justificativa').value.trim()
  };

  try {
    const res = await fetch(`/api/colaborador/registros/${registroEmEdicaoId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(dados)
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'Erro ao editar a hora extra.');

    fecharModalEditarRegistro();
    exibirToast(result.message, 'success');
    await carregarHistoricoColaborador();
    await carregarResumoFinanceiroColaborador();
  } catch (err) {
    exibirToast(err.message, 'error');
  }
}

async function excluirRegistro(id) {
  if (!confirm('Deseja realmente excluir este registro pendente?')) return;

  try {
    const res = await fetch(`/api/colaborador/registros/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'Erro ao excluir.');

    exibirToast('Registro excluído com sucesso!', 'info');
    carregarHistoricoColaborador();
    carregarResumoFinanceiroColaborador();
  } catch (err) {
    exibirToast(err.message, 'error');
  }
}

function limparFiltrosColaborador() {
  document.getElementById('colab-filtro-tipo').value = 'TODOS';
  document.getElementById('colab-filtro-status').value = 'TODOS';
  document.getElementById('colab-filtro-mes').value = '';
  carregarHistoricoColaborador();
  carregarResumoFinanceiroColaborador();
}

// Modal Guia do Protótipo
function abrirModalGuiaPrototipo() {
  const modal = document.getElementById('modal-guia-prototipo');
  if (modal) modal.classList.remove('hidden');
}

function fecharModalGuiaPrototipo() {
  const modal = document.getElementById('modal-guia-prototipo');
  if (modal) modal.classList.add('hidden');
}

// Modal Salário
function abrirModalSalario() {
  document.getElementById('edit-cargo').value = usuarioLogado.cargo || '';
  document.getElementById('edit-salario').value = usuarioLogado.salario || 0;
  document.getElementById('edit-carga').value = usuarioLogado.carga_horaria_mensal || 220;
  document.getElementById('modal-salario').classList.remove('hidden');
}

function fecharModalSalario() {
  document.getElementById('modal-salario').classList.add('hidden');
}

async function salvarPerfilColaborador(e) {
  e.preventDefault();
  const cargo = document.getElementById('edit-cargo').value.trim();
  const salario = Number(document.getElementById('edit-salario').value);
  const carga_horaria_mensal = Number(document.getElementById('edit-carga').value);

  try {
    const res = await fetch('/api/colaborador/perfil', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ cargo, salario, carga_horaria_mensal })
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'Erro ao atualizar.');

    usuarioLogado.cargo = cargo;
    usuarioLogado.salario = salario;
    usuarioLogado.carga_horaria_mensal = carga_horaria_mensal;

    fecharModalSalario();
    exibirToast('Salário e dados atualizados com sucesso!', 'success');
    atualizarHeaderUsuario();
    carregarResumoFinanceiroColaborador();
  } catch (err) {
    exibirToast(err.message, 'error');
  }
}

// ==========================================
// PORTAL DO SUPERVISOR
// (POLÍTICA: SEM DADOS SALARIAIS OU FINANCEIROS)
// ==========================================

function trocarAbaSupervisor(aba) {
  const btnReg = document.getElementById('sup-tab-registros');
  const btnTot = document.getElementById('sup-tab-totais');
  const secReg = document.getElementById('sup-secao-registros');
  const secTot = document.getElementById('sup-secao-totais');

  if (aba === 'registros') {
    btnReg.classList.add('active');
    btnTot.classList.remove('active');
    secReg.classList.remove('hidden');
    secTot.classList.add('hidden');
    carregarRegistrosSupervisor();
  } else {
    btnTot.classList.add('active');
    btnReg.classList.remove('active');
    secTot.classList.remove('hidden');
    secReg.classList.add('hidden');
    carregarTotaisSupervisor();
  }
}

async function carregarDashboardSupervisor() {
  await carregarColaboradoresDropdown();
  await carregarMetricasGeraisSupervisor();
  await carregarRegistrosSupervisor();
}

async function carregarColaboradoresDropdown() {
  try {
    const res = await fetch('/api/supervisor/colaboradores', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) throw new Error('Erro ao listar colaboradores.');

    const colaboradores = await res.json();
    const select = document.getElementById('sup-filtro-colaborador');
    select.innerHTML = '<option value="TODOS">Todos os colaboradores</option>';

    colaboradores.forEach(c => {
      const opt = document.createElement('option');
      opt.value = c.id;
      opt.textContent = `${c.nome} (${c.cargo || 'Geral'})`;
      select.appendChild(opt);
    });
  } catch (err) {
    console.error(err);
  }
}

async function carregarMetricasGeraisSupervisor() {
  try {
    const mes_ano = document.getElementById('sup-filtro-mes')?.value || '';
    let url = '/api/supervisor/totais';
    if (mes_ano) url += `?mes_ano=${mes_ano}`;

    const res = await fetch(url, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) throw new Error('Erro ao carregar totais.');

    const dados = await res.json();
    const rg = dados.resumo_geral;

    document.getElementById('sup-metric-pendentes').textContent = rg.contagem.pendentes;
    document.getElementById('sup-metric-he50').textContent = `${rg.horas_extra_50}h`;
    document.getElementById('sup-metric-he100').textContent = `${rg.horas_extra_100}h`;
    document.getElementById('sup-metric-sobreaviso').textContent = `${rg.horas_sobreaviso}h`;
    document.getElementById('sup-metric-colaboradores').textContent = rg.total_colaboradores;
  } catch (err) {
    console.error(err);
  }
}

async function carregarRegistrosSupervisor() {
  try {
    const colabId = document.getElementById('sup-filtro-colaborador').value;
    const tipo = document.getElementById('sup-filtro-tipo').value;
    const status = document.getElementById('sup-filtro-status').value;
    const mes_ano = document.getElementById('sup-filtro-mes').value;

    const params = new URLSearchParams();
    if (colabId !== 'TODOS') params.append('colaborador_id', colabId);
    if (tipo !== 'TODOS') params.append('tipo', tipo);
    if (status !== 'TODOS') params.append('status', status);
    if (mes_ano) params.append('mes_ano', mes_ano);

    const res = await fetch(`/api/supervisor/registros?${params.toString()}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) throw new Error('Erro ao buscar registros para avaliação.');

    const registros = await res.json();
    const tbody = document.getElementById('sup-tabela-registros');
    tbody.innerHTML = '';

    if (registros.length === 0) {
      tbody.innerHTML = `<tr><td colspan="9" class="text-center text-muted" style="padding: 24px;">Nenhum registro encontrado com os critérios selecionados.</td></tr>`;
      return;
    }

    registros.forEach(reg => {
      const tr = document.createElement('tr');

      // Tipo Badge
      let badgeTipo = '';
      if (reg.tipo === 'PONTO') badgeTipo = '<span class="badge-tipo ponto">⏱️ Ponto Regular</span>';
      else if (reg.tipo === 'HORA_EXTRA') {
        badgeTipo = reg.porcentagem === 100
          ? '<span class="badge-tipo he100">🔥 Extra 100%</span>'
          : '<span class="badge-tipo he50">⚡ Extra 50%</span>';
      } else if (reg.tipo === 'SOBREAVISO') {
        badgeTipo = '<span class="badge-tipo sobreaviso">📡 Sobreaviso (1/3)</span>';
      }

      // Status Badge
      let badgeStatus = '';
      if (reg.status === 'PENDENTE') badgeStatus = '<span class="badge-status pendente">🟡 Pendente</span>';
      else if (reg.status === 'APROVADO') badgeStatus = '<span class="badge-status aprovado">🟢 Aprovado</span>';
      else if (reg.status === 'REPROVADO') badgeStatus = '<span class="badge-status reprovado">🔴 Reprovado</span>';

      const horarioStr = `${reg.hora_inicio} às ${reg.hora_fim}${reg.data_fim && reg.data_fim !== reg.data ? ` (${formatarDataBR(reg.data_fim)})` : ''}`;

      tr.innerHTML = `
        <td>
          <strong>${reg.colaborador_nome}</strong>
          <div class="text-muted" style="font-size:0.75rem;">${reg.colaborador_cargo || 'Colaborador'}</div>
        </td>
        <td>${formatarDataBR(reg.data)}</td>
        <td>${badgeTipo}</td>
        <td>${horarioStr}</td>
        <td><strong>${reg.duracao_horas}h</strong></td>
        <td style="max-width: 240px; font-size: 0.85rem;">${reg.justificativa}</td>
        <td>${badgeStatus}</td>
        <td class="text-muted" style="font-size: 0.8rem;">${reg.resposta_supervisor || '—'}</td>
        <td>
          <div style="display:flex; gap: 6px;">
            <button class="btn btn-sm btn-success" onclick="abrirModalDecisaoSupervisor(${reg.id}, 'APROVADO')" title="Aprovar Registro">
              ✓ Aprovar
            </button>
            <button class="btn btn-sm btn-danger" onclick="abrirModalDecisaoSupervisor(${reg.id}, 'REPROVADO')" title="Reprovar Registro">
              ✕ Reprovar
            </button>
          </div>
        </td>
      `;
      tbody.appendChild(tr);
    });
  } catch (err) {
    exibirToast(err.message, 'error');
  }
}

async function carregarTotaisSupervisor() {
  try {
    const mes_ano = document.getElementById('sup-filtro-mes')?.value || '';
    let url = '/api/supervisor/totais';
    if (mes_ano) url += `?mes_ano=${mes_ano}`;

    const res = await fetch(url, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) throw new Error('Erro ao buscar totais de horas.');

    const dados = await res.json();
    const tbody = document.getElementById('sup-tabela-totais');
    tbody.innerHTML = '';

    if (dados.consolidado_por_colaborador.length === 0) {
      tbody.innerHTML = `<tr><td colspan="9" class="text-center text-muted" style="padding: 24px;">Nenhuma atividade registrada no período.</td></tr>`;
      return;
    }

    dados.consolidado_por_colaborador.forEach(colab => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><strong>${colab.nome}</strong></td>
        <td>${colab.ponto.toFixed(1)}h</td>
        <td>${colab.extra_50.toFixed(1)}h</td>
        <td>${colab.extra_100.toFixed(1)}h</td>
        <td>${colab.sobreaviso.toFixed(1)}h</td>
        <td><strong style="color:var(--primary); font-size: 1.05rem;">${colab.total_horas.toFixed(1)}h</strong></td>
        <td><span class="badge-status pendente">${colab.pendentes}</span></td>
        <td><span class="badge-status aprovado">${colab.aprovados}</span></td>
        <td><span class="badge-status reprovado">${colab.reprovados}</span></td>
      `;
      tbody.appendChild(tr);
    });
  } catch (err) {
    exibirToast(err.message, 'error');
  }
}

function abrirModalDecisaoSupervisor(id, decisao) {
  idRegistroEmAvaliacao = id;
  statusDecisaoSupervisor = decisao;

  const tituloEl = document.getElementById('modal-titulo');
  const descEl = document.getElementById('modal-descricao');
  const btnConf = document.getElementById('modal-btn-confirmar');
  const motivoInput = document.getElementById('modal-motivo');

  if (decisao === 'APROVADO') {
    tituloEl.textContent = 'Aprovar Registro';
    descEl.textContent = 'Confirme a aprovação do registro e informe observações (opcional):';
    btnConf.textContent = 'Confirmar Aprovação';
    btnConf.className = 'btn btn-success';
    motivoInput.value = 'Registro aprovado e em conformidade.';
  } else {
    tituloEl.textContent = 'Reprovar Registro';
    descEl.textContent = 'Por favor, informe a justificativa ou motivo da reprovação:';
    btnConf.textContent = 'Confirmar Reprovação';
    btnConf.className = 'btn btn-danger';
    motivoInput.value = 'Reprovado por divergência de horários / falta de autorização prévia.';
  }

  document.getElementById('modal-supervisor').classList.remove('hidden');
}

function fecharModalSupervisor() {
  idRegistroEmAvaliacao = null;
  statusDecisaoSupervisor = null;
  document.getElementById('modal-supervisor').classList.add('hidden');
}

async function confirmarAvaliacao() {
  if (!idRegistroEmAvaliacao || !statusDecisaoSupervisor) return;

  const motivo = document.getElementById('modal-motivo').value.trim();

  try {
    const res = await fetch(`/api/supervisor/registros/${idRegistroEmAvaliacao}/avaliar`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        status: statusDecisaoSupervisor,
        resposta_supervisor: motivo
      })
    });

    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'Erro ao avaliar registro.');

    fecharModalSupervisor();
    exibirToast(result.message, statusDecisaoSupervisor === 'APROVADO' ? 'success' : 'info');
    carregarRegistrosSupervisor();
    carregarMetricasGeraisSupervisor();
  } catch (err) {
    exibirToast(err.message, 'error');
  }
}

function limparFiltrosSupervisor() {
  document.getElementById('sup-filtro-colaborador').value = 'TODOS';
  document.getElementById('sup-filtro-tipo').value = 'TODOS';
  document.getElementById('sup-filtro-status').value = 'TODOS';
  document.getElementById('sup-filtro-mes').value = '';
  carregarRegistrosSupervisor();
  carregarMetricasGeraisSupervisor();
}

// Exportação CSV pelo Supervisor (Sem dados salariais)
async function exportarCSVSup() {
  try {
    const mes_ano = document.getElementById('sup-filtro-mes')?.value || '';
    let url = '/api/supervisor/registros';
    if (mes_ano) url += `?mes_ano=${mes_ano}`;

    const res = await fetch(url, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const registros = await res.json();

    if (registros.length === 0) {
      exibirToast('Não há dados para exportar no período.', 'info');
      return;
    }

    let csv = 'Colaborador;Cargo;Data;Tipo;Hora Inicio;Hora Fim;Duracao Horas;Porcentagem;Justificativa;Status;Parecer Supervisor\n';

    registros.forEach(r => {
      const linha = [
        `"${r.colaborador_nome}"`,
        `"${r.colaborador_cargo || ''}"`,
        `"${r.data}"`,
        `"${r.tipo}"`,
        `"${r.hora_inicio}"`,
        `"${r.hora_fim}"`,
        `"${r.duracao_horas}"`,
        `"${r.porcentagem}%"`,
        `"${(r.justificativa || '').replace(/"/g, '""')}"`,
        `"${r.status}"`,
        `"${(r.resposta_supervisor || '').replace(/"/g, '""')}"`
      ].join(';');
      csv += linha + '\n';
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const urlBlob = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', urlBlob);
    link.setAttribute('download', `relatorio_horas_equipe_${mes_ano || 'geral'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    exibirToast('Relatório CSV exportado com sucesso!', 'success');
  } catch (err) {
    exibirToast('Erro ao exportar CSV.', 'error');
  }
}
