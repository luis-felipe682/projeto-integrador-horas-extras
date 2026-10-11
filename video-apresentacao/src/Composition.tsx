import React from "react";
import {
  AbsoluteFill,
  Audio,
  Sequence,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

// Cores do tema corporativo escuro moderno
const THEME = {
  bg: "#090d16",
  bgCard: "rgba(15, 23, 42, 0.85)",
  cardBorder: "rgba(56, 189, 248, 0.2)",
  cardBorderHighlight: "rgba(16, 185, 129, 0.4)",
  primary: "#38bdf8", // Sky blue
  emerald: "#10b981", // Emerald green
  amber: "#f59e0b", // Amber warning
  rose: "#f43f5e", // Rose error
  purple: "#a855f7", // Purple
  text: "#f8fafc",
  textMuted: "#94a3b8",
  textSub: "#64748b",
};

// Barra de progresso inferior
const GlobalProgressBar = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const progress = (frame / durationInFrames) * 100;

  return (
    <div
      style={{
        position: "absolute",
        bottom: 0,
        left: 0,
        height: 6,
        width: `${progress}%`,
        background: "linear-gradient(90deg, #38bdf8, #10b981, #a855f7)",
        boxShadow: "0 0 12px rgba(56, 189, 248, 0.8)",
        zIndex: 100,
      }}
    />
  );
};

// Fundo ambiente dinâmico com iluminação suave
const AmbientBackground = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const glowMove = Math.sin((frame / fps) * 0.8) * 30;

  return (
    <AbsoluteFill
      style={{
        backgroundColor: THEME.bg,
        overflow: "hidden",
        zIndex: 0,
      }}
    >
      {/* Luz ambiente azul */}
      <div
        style={{
          position: "absolute",
          top: -100 + glowMove,
          left: -100,
          width: 600,
          height: 600,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(56, 189, 248, 0.12) 0%, transparent 70%)",
          filter: "blur(40px)",
        }}
      />
      {/* Luz ambiente esmeralda */}
      <div
        style={{
          position: "absolute",
          bottom: -150 - glowMove,
          right: -100,
          width: 700,
          height: 700,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(16, 185, 129, 0.10) 0%, transparent 70%)",
          filter: "blur(50px)",
        }}
      />
      {/* Grid sutil */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "linear-gradient(rgba(255, 255, 255, 0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.02) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
          opacity: 0.6,
        }}
      />
    </AbsoluteFill>
  );
};

// ========================================================
// CENA 1: O PROBLEMA IDENTIFICADO (Frames 0 a 330 / 11s)
// ========================================================
const Scene1Problem = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const enterOpacity = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: "clamp" });
  const exitOpacity = interpolate(frame, [310, 330], [1, 0], { extrapolateLeft: "clamp" });

  const card1Spring = spring({ frame: frame - 15, fps, config: { damping: 14 } });
  const card2Spring = spring({ frame: frame - 35, fps, config: { damping: 14 } });
  const card3Spring = spring({ frame: frame - 55, fps, config: { damping: 14 } });

  return (
    <AbsoluteFill
      style={{
        opacity: enterOpacity * exitOpacity,
        padding: "60px 80px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        fontFamily: "'Segoe UI', Roboto, system-ui, sans-serif",
        color: THEME.text,
        zIndex: 1,
      }}
    >
      {/* Tag de identificação */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
        <span
          style={{
            background: "rgba(244, 63, 94, 0.15)",
            border: "1px solid rgba(244, 63, 94, 0.35)",
            color: "#fb7185",
            fontSize: 14,
            fontWeight: 700,
            letterSpacing: 1.5,
            padding: "6px 14px",
            borderRadius: 999,
            textTransform: "uppercase",
          }}
        >
          ⚠️ O Problema Identificado
        </span>
        <span style={{ color: THEME.textMuted, fontSize: 16 }}>Gestão de Ponto e Trabalho Extraordinário</span>
      </div>

      <h1
        style={{
          fontSize: 46,
          fontWeight: 800,
          margin: "0 0 12px 0",
          letterSpacing: -1,
          lineHeight: 1.15,
        }}
      >
        O Caos das Planilhas Manuais &amp; <br />
        <span style={{ color: "#fb7185" }}>Risco Iminente de Passivo Trabalhista</span>
      </h1>

      <p style={{ fontSize: 20, color: THEME.textMuted, maxWidth: 880, margin: "0 0 36px 0", lineHeight: 1.4 }}>
        Sem uma plataforma automatizada, empresas sofrem com erros de fechamento, descontrole de escalas e descumprimento de regras legais da CLT.
      </p>

      {/* Grid de 3 Dores */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 24 }}>
        {/* Dor 1 */}
        <div
          style={{
            background: THEME.bgCard,
            border: "1px solid rgba(244, 63, 94, 0.25)",
            borderRadius: 16,
            padding: "24px 22px",
            transform: `scale(${card1Spring})`,
            opacity: card1Spring,
          }}
        >
          <div style={{ fontSize: 36, marginBottom: 12 }}>📑</div>
          <h3 style={{ fontSize: 20, fontWeight: 700, margin: "0 0 8px 0", color: "#fca5a5" }}>
            Planilhas Descentralizadas
          </h3>
          <p style={{ fontSize: 15, color: THEME.textMuted, margin: 0, lineHeight: 1.4 }}>
            Horas anotadas manualmente em papel ou Excel, sujeitas a rasuras, extravios e retrabalho constante no RH.
          </p>
        </div>

        {/* Dor 2 */}
        <div
          style={{
            background: THEME.bgCard,
            border: "1px solid rgba(245, 158, 11, 0.25)",
            borderRadius: 16,
            padding: "24px 22px",
            transform: `scale(${card2Spring})`,
            opacity: card2Spring,
          }}
        >
          <div style={{ fontSize: 36, marginBottom: 12 }}>⚖️</div>
          <h3 style={{ fontSize: 20, fontWeight: 700, margin: "0 0 8px 0", color: "#fcd34d" }}>
            Erros nas Regras CLT
          </h3>
          <p style={{ fontSize: 15, color: THEME.textMuted, margin: 0, lineHeight: 1.4 }}>
            Dificuldade em calcular 50%, 100%, escalas noturnas e a proporção de 1/3 do Sobreaviso (Art. 244 CLT).
          </p>
        </div>

        {/* Dor 3 */}
        <div
          style={{
            background: THEME.bgCard,
            border: "1px solid rgba(168, 85, 247, 0.25)",
            borderRadius: 16,
            padding: "24px 22px",
            transform: `scale(${card3Spring})`,
            opacity: card3Spring,
          }}
        >
          <div style={{ fontSize: 36, marginBottom: 12 }}>🔒</div>
          <h3 style={{ fontSize: 20, fontWeight: 700, margin: "0 0 8px 0", color: "#d8b4fe" }}>
            Vazamento Salarial (LGPD)
          </h3>
          <p style={{ fontSize: 15, color: THEME.textMuted, margin: 0, lineHeight: 1.4 }}>
            Supervisores operacionais acessando acidentalmente salários e contracheques durante a análise de horas.
          </p>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ========================================================
// CENA 2: A SOLUÇÃO PROPOSTA & ARQUITETURA (Frames 330 a 660 / 11s)
// ========================================================
const Scene2Solution = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const enterOpacity = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: "clamp" });
  const exitOpacity = interpolate(frame, [310, 330], [1, 0], { extrapolateLeft: "clamp" });

  const heroSpring = spring({ frame: frame - 10, fps, config: { damping: 15 } });
  const pill1Spring = spring({ frame: frame - 25, fps, config: { damping: 12 } });
  const pill2Spring = spring({ frame: frame - 40, fps, config: { damping: 12 } });
  const pill3Spring = spring({ frame: frame - 55, fps, config: { damping: 12 } });

  return (
    <AbsoluteFill
      style={{
        opacity: enterOpacity * exitOpacity,
        padding: "60px 80px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        fontFamily: "'Segoe UI', Roboto, system-ui, sans-serif",
        color: THEME.text,
        zIndex: 1,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
        <span
          style={{
            background: "rgba(56, 189, 248, 0.15)",
            border: "1px solid rgba(56, 189, 248, 0.35)",
            color: THEME.primary,
            fontSize: 14,
            fontWeight: 700,
            letterSpacing: 1.5,
            padding: "6px 14px",
            borderRadius: 999,
            textTransform: "uppercase",
          }}
        >
          🚀 A Solução Proposta
        </span>
        <span style={{ color: THEME.textMuted, fontSize: 16 }}>Plataforma Web Full-Stack</span>
      </div>

      <h1
        style={{
          fontSize: 46,
          fontWeight: 800,
          margin: "0 0 12px 0",
          letterSpacing: -1,
          lineHeight: 1.15,
        }}
      >
        Gestão Inteligente de Jornada &amp; <br />
        <span style={{ color: THEME.emerald }}>Automação em Estrita Conformidade CLT</span>
      </h1>

      <p style={{ fontSize: 20, color: THEME.textMuted, maxWidth: 900, margin: "0 0 36px 0", lineHeight: 1.4 }}>
        Um ecossistema seguro e integrado que transforma o apontamento de horas em um fluxo transparente, rápido e juridicamente blindado.
      </p>

      {/* Bloco central de destaque */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1.2fr 1fr",
          gap: 28,
          alignItems: "center",
          transform: `scale(${heroSpring})`,
          opacity: heroSpring,
        }}
      >
        {/* Painel de Features Principais */}
        <div
          style={{
            background: THEME.bgCard,
            border: `1px solid ${THEME.cardBorderHighlight}`,
            borderRadius: 20,
            padding: "28px 30px",
            boxShadow: "0 20px 40px -15px rgba(0,0,0,0.5)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
            <span style={{ fontSize: 28 }}>⚡</span>
            <div>
              <h3 style={{ fontSize: 22, fontWeight: 700, margin: 0, color: THEME.emerald }}>
                Cálculo CLT Automatizado
              </h3>
              <p style={{ fontSize: 14, color: THEME.textMuted, margin: 0 }}>
                Base 220h com adicionais de 50%, 100%, 1/3 Sobreaviso e reflexo no DSR
              </p>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
            <span style={{ fontSize: 28 }}>🛡️</span>
            <div>
              <h3 style={{ fontSize: 22, fontWeight: 700, margin: 0, color: THEME.primary }}>
                Blindagem Salarial (LGPD)
              </h3>
              <p style={{ fontSize: 14, color: THEME.textMuted, margin: 0 }}>
                Supervisores aprovam horas e justificativas sem nunca ver valores em R$
              </p>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 28 }}>🔄</span>
            <div>
              <h3 style={{ fontSize: 22, fontWeight: 700, margin: 0, color: THEME.purple }}>
                Compensação Cruzada Imediata
              </h3>
              <p style={{ fontSize: 14, color: THEME.textMuted, margin: 0 }}>
                Horas extras realizadas no plantão abatem automaticamente do sobreaviso
              </p>
            </div>
          </div>
        </div>

        {/* Pills de Arquitetura e Engenharia */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div
            style={{
              background: "rgba(15, 23, 42, 0.7)",
              border: `1px solid ${THEME.cardBorder}`,
              borderRadius: 14,
              padding: "16px 20px",
              display: "flex",
              alignItems: "center",
              gap: 14,
              transform: `translateX(${interpolate(pill1Spring, [0, 1], [40, 0])}px)`,
              opacity: pill1Spring,
            }}
          >
            <span style={{ fontSize: 24 }}>🟢</span>
            <div>
              <div style={{ fontWeight: 700, fontSize: 17 }}>Node.js + SQLite Nativo</div>
              <div style={{ fontSize: 13, color: THEME.textMuted }}>Módulo DatabaseSync de alta performance</div>
            </div>
          </div>

          <div
            style={{
              background: "rgba(15, 23, 42, 0.7)",
              border: `1px solid ${THEME.cardBorder}`,
              borderRadius: 14,
              padding: "16px 20px",
              display: "flex",
              alignItems: "center",
              gap: 14,
              transform: `translateX(${interpolate(pill2Spring, [0, 1], [40, 0])}px)`,
              opacity: pill2Spring,
            }}
          >
            <span style={{ fontSize: 24 }}>🔑</span>
            <div>
              <div style={{ fontWeight: 700, fontSize: 17 }}>JWT + BCrypt + RBAC</div>
              <div style={{ fontSize: 13, color: THEME.textMuted }}>Segurança rigorosa com controle de perfis</div>
            </div>
          </div>

          <div
            style={{
              background: "rgba(15, 23, 42, 0.7)",
              border: `1px solid ${THEME.cardBorder}`,
              borderRadius: 14,
              padding: "16px 20px",
              display: "flex",
              alignItems: "center",
              gap: 14,
              transform: `translateX(${interpolate(pill3Spring, [0, 1], [40, 0])}px)`,
              opacity: pill3Spring,
            }}
          >
            <span style={{ fontSize: 24 }}>✨</span>
            <div>
              <div style={{ fontWeight: 700, fontSize: 17 }}>Interface Vanilla Moderna</div>
              <div style={{ fontSize: 13, color: THEME.textMuted }}>Dark glass, 1-Click Demo e relógio em tempo real</div>
            </div>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ========================================================
// CENA 3: PORTAL DO COLABORADOR (Frames 660 a 990 / 11s)
// ========================================================
const Scene3Colaborador = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const enterOpacity = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: "clamp" });
  const exitOpacity = interpolate(frame, [310, 330], [1, 0], { extrapolateLeft: "clamp" });

  const uiSpring = spring({ frame: frame - 10, fps, config: { damping: 15 } });
  const badgeSpring = spring({ frame: frame - 30, fps, config: { damping: 10 } });

  return (
    <AbsoluteFill
      style={{
        opacity: enterOpacity * exitOpacity,
        padding: "50px 80px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        fontFamily: "'Segoe UI', Roboto, system-ui, sans-serif",
        color: THEME.text,
        zIndex: 1,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
        <span
          style={{
            background: "rgba(16, 185, 129, 0.15)",
            border: "1px solid rgba(16, 185, 129, 0.35)",
            color: THEME.emerald,
            fontSize: 14,
            fontWeight: 700,
            letterSpacing: 1.5,
            padding: "6px 14px",
            borderRadius: 999,
            textTransform: "uppercase",
          }}
        >
          👤 Portal do Colaborador
        </span>
        <span style={{ color: THEME.textMuted, fontSize: 16 }}>Autonomia, Simulação e Transparência</span>
      </div>

      <h1
        style={{
          fontSize: 42,
          fontWeight: 800,
          margin: "0 0 10px 0",
          letterSpacing: -1,
          lineHeight: 1.15,
        }}
      >
        Lançamentos Ágeis com <span style={{ color: THEME.emerald }}>Estimativa Financeira em Tempo Real</span>
      </h1>

      <p style={{ fontSize: 18, color: THEME.textMuted, margin: "0 0 24px 0" }}>
        O funcionário acompanha cada centavo com total previsibilidade antes do fechamento do mês.
      </p>

      {/* Mockup da Interface do Colaborador */}
      <div
        style={{
          background: THEME.bgCard,
          border: `1px solid ${THEME.cardBorder}`,
          borderRadius: 20,
          padding: 24,
          transform: `scale(${uiSpring})`,
          opacity: uiSpring,
        }}
      >
        {/* Top Header Mockup */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            paddingBottom: 16,
            borderBottom: "1px solid rgba(255,255,255,0.08)",
            marginBottom: 20,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 24 }}>💰</span>
            <div>
              <div style={{ fontWeight: 700, fontSize: 18 }}>Estimativa de Remuneração Adicional</div>
              <div style={{ fontSize: 13, color: THEME.textMuted }}>Valores calculados com base na jornada contratual</div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 12 }}>
            <div style={{ background: "rgba(56, 189, 248, 0.15)", padding: "6px 14px", borderRadius: 8, fontSize: 13, color: THEME.primary }}>
              Salário Base: <strong>R$ 3.300,00</strong>
            </div>
            <div style={{ background: "rgba(16, 185, 129, 0.15)", padding: "6px 14px", borderRadius: 8, fontSize: 13, color: THEME.emerald }}>
              Hora Base: <strong>R$ 15,00/h</strong>
            </div>
          </div>
        </div>

        {/* 4 Cards de Métricas */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 20 }}>
          <div style={{ background: "rgba(56, 189, 248, 0.08)", border: "1px solid rgba(56, 189, 248, 0.2)", borderRadius: 12, padding: "14px 16px" }}>
            <div style={{ fontSize: 12, color: THEME.primary, fontWeight: 700 }}>⚡ HORA EXTRA 50%</div>
            <div style={{ fontSize: 26, fontWeight: 800, margin: "4px 0" }}>2.5h</div>
            <div style={{ fontSize: 13, color: THEME.textMuted }}>R$ 56,25 (1.5x)</div>
          </div>

          <div style={{ background: "rgba(245, 158, 11, 0.08)", border: "1px solid rgba(245, 158, 11, 0.2)", borderRadius: 12, padding: "14px 16px" }}>
            <div style={{ fontSize: 12, color: THEME.amber, fontWeight: 700 }}>🔥 HORA EXTRA 100%</div>
            <div style={{ fontSize: 26, fontWeight: 800, margin: "4px 0" }}>4.0h</div>
            <div style={{ fontSize: 13, color: THEME.textMuted }}>R$ 120,00 (2.0x)</div>
          </div>

          <div style={{ background: "rgba(168, 85, 247, 0.08)", border: "1px solid rgba(168, 85, 247, 0.2)", borderRadius: 12, padding: "14px 16px" }}>
            <div style={{ fontSize: 12, color: THEME.purple, fontWeight: 700 }}>📡 SOBREAVISO (1/3)</div>
            <div style={{ fontSize: 26, fontWeight: 800, margin: "4px 0" }}>12.0h</div>
            <div style={{ fontSize: 13, color: THEME.textMuted }}>R$ 60,00 (Art. 244)</div>
          </div>

          <div style={{ background: "rgba(16, 185, 129, 0.15)", border: "1px solid rgba(16, 185, 129, 0.35)", borderRadius: 12, padding: "14px 16px" }}>
            <div style={{ fontSize: 12, color: THEME.emerald, fontWeight: 700 }}>💵 TOTAL + DSR</div>
            <div style={{ fontSize: 26, fontWeight: 800, color: THEME.emerald, margin: "4px 0" }}>R$ 283,50</div>
            <div style={{ fontSize: 13, color: "#a7f3d0" }}>Previsão líquida extra</div>
          </div>
        </div>

        {/* Destaque da compensação */}
        <div
          style={{
            background: "rgba(56, 189, 248, 0.1)",
            border: "1px dashed rgba(56, 189, 248, 0.4)",
            borderRadius: 12,
            padding: "12px 18px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            transform: `scale(${badgeSpring})`,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 20 }}>💡</span>
            <span style={{ fontSize: 14, color: "#bae6fd" }}>
              <strong>Compensação Automática de Sobreaviso:</strong> Se o colaborador for chamado para hora extra durante o sobreaviso, o sistema deduz as horas na hora!
            </span>
          </div>
          <span style={{ background: THEME.emerald, color: "#064e3b", fontWeight: 800, fontSize: 12, padding: "4px 10px", borderRadius: 999 }}>
            SEM BITRIBUTAÇÃO
          </span>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ========================================================
// CENA 4: PORTAL DO SUPERVISOR & LGPD (Frames 990 a 1320 / 11s)
// ========================================================
const Scene4Supervisor = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const enterOpacity = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: "clamp" });
  const exitOpacity = interpolate(frame, [310, 330], [1, 0], { extrapolateLeft: "clamp" });

  const supSpring = spring({ frame: frame - 10, fps, config: { damping: 15 } });
  const cardRowSpring = spring({ frame: frame - 30, fps, config: { damping: 12 } });

  return (
    <AbsoluteFill
      style={{
        opacity: enterOpacity * exitOpacity,
        padding: "50px 80px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        fontFamily: "'Segoe UI', Roboto, system-ui, sans-serif",
        color: THEME.text,
        zIndex: 1,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
        <span
          style={{
            background: "rgba(56, 189, 248, 0.15)",
            border: "1px solid rgba(56, 189, 248, 0.35)",
            color: THEME.primary,
            fontSize: 14,
            fontWeight: 700,
            letterSpacing: 1.5,
            padding: "6px 14px",
            borderRadius: 999,
            textTransform: "uppercase",
          }}
        >
          🛡️ Portal do Supervisor
        </span>
        <span style={{ color: THEME.textMuted, fontSize: 16 }}>Governança Operacional &amp; Auditoria</span>
      </div>

      <h1
        style={{
          fontSize: 42,
          fontWeight: 800,
          margin: "0 0 10px 0",
          letterSpacing: -1,
          lineHeight: 1.15,
        }}
      >
        Aprovação Ágil &amp; <span style={{ color: THEME.primary }}>Privacidade Salarial Estrita (LGPD)</span>
      </h1>

      <p style={{ fontSize: 18, color: THEME.textMuted, margin: "0 0 24px 0" }}>
        O gestor analisa justificativas, emite pareceres e exporta relatórios sem qualquer visibilidade de salários.
      </p>

      {/* Mockup do Supervisor */}
      <div
        style={{
          background: THEME.bgCard,
          border: `1px solid ${THEME.cardBorder}`,
          borderRadius: 20,
          padding: 24,
          transform: `scale(${supSpring})`,
          opacity: supSpring,
        }}
      >
        {/* Banner de privacidade no topo */}
        <div
          style={{
            background: "rgba(56, 189, 248, 0.08)",
            border: "1px solid rgba(56, 189, 248, 0.25)",
            borderRadius: 12,
            padding: "12px 18px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 20,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 24 }}>🔒</span>
            <div>
              <strong style={{ fontSize: 15, color: THEME.primary }}>Regra Rigorosa de Privacidade:</strong>
              <div style={{ fontSize: 13, color: THEME.textMuted }}>
                Consultas SQL, API REST e telas do supervisor omitem completamente a coluna salarial.
              </div>
            </div>
          </div>
          <span style={{ background: "rgba(16, 185, 129, 0.2)", color: THEME.emerald, fontSize: 12, padding: "5px 12px", borderRadius: 8, fontWeight: 700 }}>
            COMPLIANCE ATIVO
          </span>
        </div>

        {/* Tabela Mockup de Aprovação */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1.2fr 0.8fr 1fr 1.6fr 1fr",
              padding: "10px 16px",
              background: "rgba(255,255,255,0.03)",
              borderRadius: 8,
              fontSize: 12,
              fontWeight: 700,
              color: THEME.textMuted,
              textTransform: "uppercase",
            }}
          >
            <div>Colaborador</div>
            <div>Tipo</div>
            <div>Horário / Duração</div>
            <div>Justificativa</div>
            <div style={{ textAlign: "right" }}>Ação do Gestor</div>
          </div>

          {/* Linha 1 de Registro */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1.2fr 0.8fr 1fr 1.6fr 1fr",
              padding: "14px 16px",
              background: "rgba(15, 23, 42, 0.6)",
              border: "1px solid rgba(255,255,255,0.06)",
              borderRadius: 10,
              fontSize: 14,
              alignItems: "center",
              transform: `scale(${cardRowSpring})`,
            }}
          >
            <div>
              <strong style={{ color: THEME.text }}>João Silva</strong>
              <div style={{ fontSize: 12, color: THEME.textMuted }}>Suporte Técnico</div>
            </div>
            <div>
              <span style={{ background: "rgba(56, 189, 248, 0.15)", color: THEME.primary, padding: "3px 8px", borderRadius: 6, fontSize: 12, fontWeight: 700 }}>
                H. EXTRA 50%
              </span>
            </div>
            <div>
              <div>17:00 às 19:30</div>
              <div style={{ fontSize: 12, color: THEME.textMuted }}>2.5 horas</div>
            </div>
            <div style={{ fontSize: 13, color: THEME.textMuted, fontStyle: "italic" }}>
              "Chamado emergencial no servidor..."
            </div>
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button
                style={{
                  background: THEME.emerald,
                  color: "#022c22",
                  border: "none",
                  padding: "6px 12px",
                  borderRadius: 6,
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                ✓ Aprovar
              </button>
              <button
                style={{
                  background: "rgba(244, 63, 94, 0.15)",
                  color: "#fb7185",
                  border: "1px solid rgba(244, 63, 94, 0.3)",
                  padding: "6px 10px",
                  borderRadius: 6,
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                Reprovar
              </button>
            </div>
          </div>
        </div>

        {/* Rodapé com botão de CSV */}
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: THEME.textMuted }}>
            <span>📥 Exportação direta de dados consolidados:</span>
            <span style={{ color: THEME.primary, fontWeight: 700, textDecoration: "underline" }}>Download Relatório CSV</span>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ========================================================
// CENA 5: CONCLUSÃO & VALOR ENTREGUE (Frames 1320 a 1620 / 10s)
// ========================================================
const Scene5Conclusion = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const enterOpacity = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: "clamp" });
  const pulse = Math.sin((frame / fps) * 3) * 0.03 + 1;

  const card1Spring = spring({ frame: frame - 15, fps, config: { damping: 14 } });
  const card2Spring = spring({ frame: frame - 30, fps, config: { damping: 14 } });
  const card3Spring = spring({ frame: frame - 45, fps, config: { damping: 14 } });

  return (
    <AbsoluteFill
      style={{
        opacity: enterOpacity,
        padding: "60px 80px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        textAlign: "center",
        fontFamily: "'Segoe UI', Roboto, system-ui, sans-serif",
        color: THEME.text,
        zIndex: 1,
      }}
    >
      <div
        style={{
          background: "rgba(16, 185, 129, 0.15)",
          border: "1px solid rgba(16, 185, 129, 0.35)",
          color: THEME.emerald,
          fontSize: 14,
          fontWeight: 700,
          letterSpacing: 1.5,
          padding: "6px 16px",
          borderRadius: 999,
          textTransform: "uppercase",
          marginBottom: 16,
        }}
      >
        🏆 Impacto do Projeto
      </div>

      <h1
        style={{
          fontSize: 48,
          fontWeight: 800,
          margin: "0 0 16px 0",
          letterSpacing: -1,
          lineHeight: 1.15,
        }}
      >
        Segurança Jurídica, Transparência &amp; <br />
        <span style={{ color: THEME.emerald }}>Eficiência Operacional em Ponto Eletrônico</span>
      </h1>

      <p style={{ fontSize: 20, color: THEME.textMuted, maxWidth: 840, margin: "0 0 40px 0", lineHeight: 1.4 }}>
        Um protótipo completo, escalável e pronto para homologação em ambientes corporativos reais.
      </p>

      {/* 3 Pilares de Resultados */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 24, width: "100%", maxWidth: 1000, marginBottom: 40 }}>
        <div
          style={{
            background: THEME.bgCard,
            border: `1px solid ${THEME.cardBorderHighlight}`,
            borderRadius: 16,
            padding: "24px 20px",
            transform: `scale(${card1Spring})`,
            opacity: card1Spring,
          }}
        >
          <div style={{ fontSize: 36, color: THEME.emerald, fontWeight: 800, marginBottom: 8 }}>100%</div>
          <div style={{ fontWeight: 700, fontSize: 17, marginBottom: 6 }}>Conformidade CLT</div>
          <div style={{ fontSize: 14, color: THEME.textMuted }}>Eliminação do passivo por erros manuais de cálculo</div>
        </div>

        <div
          style={{
            background: THEME.bgCard,
            border: `1px solid ${THEME.cardBorder}`,
            borderRadius: 16,
            padding: "24px 20px",
            transform: `scale(${card2Spring * pulse})`,
            opacity: card2Spring,
          }}
        >
          <div style={{ fontSize: 36, color: THEME.primary, fontWeight: 800, marginBottom: 8 }}>-80%</div>
          <div style={{ fontWeight: 700, fontSize: 17, marginBottom: 6 }}>Tempo no Fechamento</div>
          <div style={{ fontSize: 14, color: THEME.textMuted }}>Aprovações em 1 clique e relatórios CSV instantâneos</div>
        </div>

        <div
          style={{
            background: THEME.bgCard,
            border: `1px solid ${THEME.cardBorder}`,
            borderRadius: 16,
            padding: "24px 20px",
            transform: `scale(${card3Spring})`,
            opacity: card3Spring,
          }}
        >
          <div style={{ fontSize: 36, color: THEME.purple, fontWeight: 800, marginBottom: 8 }}>LGPD</div>
          <div style={{ fontWeight: 700, fontSize: 17, marginBottom: 6 }}>Blindagem Salarial</div>
          <div style={{ fontSize: 14, color: THEME.textMuted }}>Privacidade dos colaboradores garantida por software</div>
        </div>
      </div>

      <div style={{ fontSize: 15, color: THEME.textSub, letterSpacing: 0.5 }}>
        Projeto Integrador • Curso de IA • Gestão de Horas Extras e Sobreaviso CLT
      </div>
    </AbsoluteFill>
  );
};

// ========================================================
// COMPOSIÇÃO PRINCIPAL
// ========================================================
export const MyComposition = () => {
  return (
    <AbsoluteFill>
      <AmbientBackground />

      {/* Cena 1: O Problema (0s a 11s -> frames 0 a 330) */}
      <Sequence from={0} durationInFrames={330}>
        <Audio src={staticFile("audio/scene1.mp3")} volume={1} />
        <Scene1Problem />
      </Sequence>

      {/* Cena 2: A Solução Proposta & Arquitetura (11s a 22s -> frames 330 a 330) */}
      <Sequence from={330} durationInFrames={330}>
        <Audio src={staticFile("audio/scene2.mp3")} volume={1} />
        <Scene2Solution />
      </Sequence>

      {/* Cena 3: Portal do Colaborador (22s a 33s -> frames 660 a 330) */}
      <Sequence from={660} durationInFrames={330}>
        <Audio src={staticFile("audio/scene3.mp3")} volume={1} />
        <Scene3Colaborador />
      </Sequence>

      {/* Cena 4: Portal do Supervisor & Governança (33s a 44s -> frames 990 a 330) */}
      <Sequence from={990} durationInFrames={330}>
        <Audio src={staticFile("audio/scene4.mp3")} volume={1} />
        <Scene4Supervisor />
      </Sequence>

      {/* Cena 5: Conclusão & Impacto (44s a 54s -> frames 1320 a 300) */}
      <Sequence from={1320} durationInFrames={300}>
        <Audio src={staticFile("audio/scene5.mp3")} volume={1} />
        <Scene5Conclusion />
      </Sequence>

      <GlobalProgressBar />
    </AbsoluteFill>
  );
};