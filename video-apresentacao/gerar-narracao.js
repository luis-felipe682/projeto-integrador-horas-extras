const { MsEdgeTTS, OUTPUT_FORMAT } = require('msedge-tts');
const fs = require('fs');
const path = require('path');

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

async function gerarTodasAsNarracoes() {
  const dirAudio = path.join(__dirname, 'public', 'audio');
  if (!fs.existsSync(dirAudio)) {
    fs.mkdirSync(dirAudio, { recursive: true });
  }

  console.log('🎙️ Iniciando geração da narração profissional em Português (Brasil)...');

  for (let i = 0; i < cenas.length; i++) {
    const { nome, texto } = cenas[i];
    const destino = path.join(dirAudio, nome);
    console.log(`🔊 [${i + 1}/${cenas.length}] Gerando: ${nome}...`);

    const tts = new MsEdgeTTS();
    await tts.setMetadata('pt-BR-AntonioNeural', OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3);

    const { audioStream } = tts.toStream(texto);
    const fileStream = fs.createWriteStream(destino);

    await new Promise((resolve, reject) => {
      audioStream.pipe(fileStream);
      fileStream.on('finish', () => {
        console.log(`✅ Salvo: ${destino}`);
        resolve();
      });
      fileStream.on('error', reject);
      audioStream.on('error', reject);
    });
  }

  console.log('🎉 Todas as faixas de narração foram geradas com sucesso!');
  process.exit(0);
}

gerarTodasAsNarracoes().catch(err => {
  console.error('❌ Erro na geração da narração:', err);
  process.exit(1);
});

