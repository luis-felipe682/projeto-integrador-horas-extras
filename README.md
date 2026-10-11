# ⏱️ Sistema de Controle de Ponto, Horas Extras e Sobreaviso CLT

Aplicação web full-stack desenvolvida para automação do registro de ponto eletrônico, gerenciamento de trabalho extraordinário (horas extras a 50% e 100%) e escalas de sobreaviso, com workflow de aprovação hierárquica e cálculo de estimativas financeiras em estrita conformidade com a Consolidação das Leis do Trabalho (**CLT**).

---

## 👥 Perfis de Acesso e Funcionalidades

### 👤 1. Perfil Colaborador
O colaborador tem autonomia para gerenciar sua jornada e acompanhar suas expectativas de remuneração:
- **Autenticação e Cadastro**: Criação de conta com nome, e-mail, senha, cargo e perfil.
- **Gestão de Dados e Salário**: Cadastro e edição do salário base mensal e carga horária contratual (padrão 220h CLT).
- **Registro de Entrada e Saída (Ponto)**: Registro de ponto regular diário com relógio em tempo real, atalhos de preenchimento e justificativa.
- **Lançamento de Horas Extras**: Solicitação de horas extras com adicionais de **50%** (dias úteis e sábados) ou **100%** (domingos e feriados), com prévia de duração em tempo real.
- **Períodos de Sobreaviso**: Registro de períodos de prontidão com definição de data/hora inicial e data/hora final (suportando viradas de noite e fins de semana inteiros).
- **Justificativa Obrigatória**: Campo detalhado para fundamentar cada registro perante a liderança.
- **Histórico e Status**: Acompanhamento dos lançamentos com badges de status (`🟡 PENDENTE`, `🟢 APROVADO`, `🔴 REPROVADO`), parecer do supervisor e opção de cancelamento de solicitações pendentes.
- **Totalizador de Horas**: Visão consolidada de horas normais, extras 50%, extras 100% e sobreaviso.
- **Estimativa do Valor a Receber (Regras CLT)**:
  - **Valor Hora Normal**: $\text{Salário Base} / 220\text{h}$
  - **Hora Extra 50%**: $\text{Valor Hora} \times 1.50$
  - **Hora Extra 100%**: $\text{Valor Hora} \times 2.00$
  - **Sobreaviso (Art. 244 § 2º CLT)**: Remuneração à razão de **$1/3$ (33,33%)** do valor da hora normal.
  - **Reflexo no DSR**: Estimativa do Descanso Semanal Remunerado sobre as variáveis acumuladas.
  - **Total Geral Estimado**: Soma do salário base com todos os adicionais (com diferenciação entre total geral e total já aprovado).

---

### 🛡️ 2. Perfil Supervisor
O supervisor possui visão gerencial voltada para conformidade, auditoria e gestão da equipe:
- **Login com RBAC**: Acesso ao painel exclusivo de supervisão.
- **Visualização de Colaboradores**: Listagem completa de colaboradores da equipe.
- **Monitoramento de Horas**: Visualização de todas as batidas de ponto, horas extras e escalas de sobreaviso.
- **Análise de Justificativas**: Leitura dos motivos apresentados pelos colaboradores.
- **Aprovação ou Reprovação com Parecer**: Decisão ágil com inserção de parecer explicativo para o colaborador.
- **Filtros Dinâmicos**: Filtragem por colaborador, tipo de evento, período (mês/ano) e status.
- **Consolidação de Horas**: Painel consolidado com a soma das horas por colaborador e por tipo de jornada.
- **Exportação CSV**: Download de relatório operacional para auditoria e fechamento de ponto.

---

## 🔒 Regra Rigorosa de Privacidade e Proteção de Dados (LGPD)

> **Regra Fundamental**: O supervisor **NÃO** tem acesso ao salário, valor da hora ou quaisquer valores financeiros do colaborador.

Esta política é garantida em três níveis de segurança:
1. **Camada de Banco de Dados**: A projeção das consultas SQL do supervisor (`SELECT`) omite explicitamente qualquer coluna salarial ou financeira.
2. **Camada de API (Backend Express)**:
   - Se um supervisor tentar acessar `/api/colaborador/resumo-financeiro`, a API retorna `HTTP 403 Forbidden`.
   - O payload do supervisor em `/api/supervisor/colaboradores` e `/api/supervisor/registros` não contém propriedades financeiras.
3. **Camada de Interface (Frontend)**: O painel do supervisor é 100% orientado a **horas**, **justificativas** e **status**, sem qualquer exibição de cifrões ou cálculos monetários.

---

## 🚀 Tecnologias Utilizadas

- **Runtime**: Node.js (v24+)
- **Backend**: Express.js, CORS, JSON Web Token (JWT) e BCrypt.js
- **Banco de Dados**: SQLite nativo via `node:sqlite` (sem dependências externas de compilação ou serviços cloud necessários)
- **Frontend**: HTML5 Semântico, CSS3 Moderno (Plus Jakarta Sans, JetBrains Mono, Flexbox, CSS Grid) e Vanilla JavaScript modular

---

## 📦 Como Executar o Projeto

### 1. Pré-requisitos
Ter o Node.js instalado na máquina.

### 2. Instalação e Execução
Na pasta do projeto (`Aula 29.09`), execute:

```bash
npm start
```

O servidor iniciará em:
👉 **`http://localhost:3000`**

---

## ⚡ Usuários de Demonstração Pré-Cadastrados (1-Click Demo)

Para testar ou apresentar o sistema imediatamente, o banco SQLite já inicializa com registros e contas pré-configuradas:

| Perfil | E-mail | Senha | Detalhes |
|---|---|---|---|
| **Colaborador** | `joao@empresa.com` | `123456` | Salário R$ 3.300,00 (R$ 15,00/h), com registros de ponto, HE e sobreaviso |
| **Colaborador 2** | `maria@empresa.com` | `123456` | Salário R$ 5.500,00 (R$ 25,00/h), com sobreaviso noturno aprovado |
| **Supervisor** | `supervisor@empresa.com` | `123456` | Acesso completo de aprovação, sem visibilidade de salários |

Na tela de login, há botões rápidos que preenchem as credenciais de teste com apenas 1 clique.

---

## 🎬 Vídeo de Apresentação (Claude Remotion Skill)

O projeto inclui um vídeo curto de alta qualidade (54s, 30fps, 1280x720) desenvolvido com **Remotion** em [`video-apresentacao/`](file:///c:/Users/LUIS%20DOIDO/Desktop/curso%20IA/Projeto%20Integrador%20-%20Copia/video-apresentacao):
- **Vídeo Renderizado**: [`video-apresentacao/out/video.mp4`](file:///c:/Users/LUIS%20DOIDO/Desktop/curso%20IA/Projeto%20Integrador%20-%20Copia/video-apresentacao/out/video.mp4)
- **Pré-visualização Interativa (Studio)**:
  ```bash
  cd video-apresentacao
  npx remotion studio
  ```
- **Re-renderização em MP4**:
  ```bash
  cd video-apresentacao
  npx remotion render src/index.ts MyComp out/video.mp4
  ```

---

## 📑 Documento Completo de Entrega do Projeto

Consulte o arquivo [`DESCRICAO_DO_PROJETO.md`](file:///c:/Users/LUIS%20DOIDO/Desktop/curso%20IA/Projeto%20Integrador%20-%20Copia/DESCRICAO_DO_PROJETO.md) para:
- Descrição curta do projeto;
- Detalhamento do **Problema Identificado**;
- Detalhamento da **Solução Proposta**;
- Mapeamento do **Público-Alvo**;
- **Fluxo Visual de Utilização do Protótipo**;
- **Roteiro e Script de Narração Completo para ElevenLabs** (com timestamps e orientações de voz profissional).

