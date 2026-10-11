/**
 * Script para geração opcional de narração via ElevenLabs API
 * Uso:
 *   node gerar-narracao-elevenlabs.js [SUA_CHAVE_ELEVENLABS]
 * Ou definir a variável de ambiente:
 *   $env:ELEVENLABS_API_KEY="sua_chave_aqui"
 *   node gerar-narracao-elevenlabs.js
 */

const fs = require('fs');
const path = require('path');

const apiKey = process.argv[2] || process.env.ELEVENLABS_API_KEY;

if (!apiKey) {
  console.log('================================================================');
  console.log('ℹ️ Para utilizar o ElevenLabs com sua chave de API pessoal:');
  console.log('Execute: node gerar-narracao-elevenlabs.js <SUA_CHAVE_ELEVENLABS>');
  console.log('Ou defina: $env:ELEVENLABS_API_KEY="sua_chave"');
  console.log('================================================================');
  process.exit(0);
}

// Voz profissional (Ex: Adam ou Antoni ou voz brasileira personalizada)
const VOICE_ID = process.env.ELEVENLABS_VOICE_ID || 'pNInz6obpgDQGcFmaJgB'; // Adam (multilingual v2)
const MODEL_ID = 'eleven_multilingual_v2';

const cenas = [
  {
    nome: 'scene1.mp3',
    texto: 'Gerenciar horas extras e plantões de sobreaviso por planilhas manuais ou papel gera sérios riscos de passivo trabalhista, erros frequentes nos adicionais da CLT e exposição indevida de dados salariais.'
  },
  {
    nome: 'scene2.mp3',
    texto: 'Para resolver isso, apresentamos nossa Solução de Gestão Inteligente de Jornada. Uma plataforma web integrada, construída em Node.js e SQLite nativo, que automatiza todos os cálculos trabalhistas e garante blindagem salarial rigorosa por LGPD.'
  },
  {
    nome: 'scene3.mp3',
    texto: 'No Portal do Colaborador, o funcionário registra horas extras a 50% ou 100% e escalas de sobreaviso com compensação automática caso seja acionado. Tudo com estimativa financeira em tempo real e reflexo no DSR.'
  },
  {
    nome: 'scene4.mp3',
    texto: 'Já o supervisor acessa um painel exclusivo para avaliar justificativas e aprovar horas em um clique, com exportação direta em CSV para a folha de pagamento — e total privacidade salarial, sem nenhum cifrão visível.'
  },
  {
    nome: 'scene5.mp3',
    texto: 'Conformidade com a CLT, respeito à LGPD e máxima eficiência para a sua empresa. Este é o nosso Projeto Integrador!'
  }
];

async function gerarComElevenLabs() {
  const dirAudio = path.join(__dirname, 'public', 'audio');
  if (!fs.existsSync(dirAudio)) {
    fs.mkdirSync(dirAudio, { recursive: true });
  }

  console.log(`🎙️ Conectando à API do ElevenLabs (Voz ID: ${VOICE_ID})...`);

  for (let i = 0; i < cenas.length; i++) {
    const { nome, texto } = cenas[i];
    const destino = path.join(dirAudio, nome);
    console.log(`🔊 [${i + 1}/${cenas.length}] Gerando ${nome} no ElevenLabs...`);

    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`, {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': apiKey
      },
      body: JSON.stringify({
        text: texto,
        model_id: MODEL_ID,
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75
        }
      })
    });

    if (!response.ok) {
      const erro = await response.text();
      throw new Error(`Erro na API do ElevenLabs (${response.status}): ${erro}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    fs.writeFileSync(destino, Buffer.from(arrayBuffer));
    console.log(`✅ Salvo: ${destino}`);
  }

  console.log('🎉 Todas as faixas do ElevenLabs geradas com sucesso!');
}

gerarComElevenLabs().catch(err => {
  console.error('❌ Erro:', err.message);
  process.exit(1);
});

