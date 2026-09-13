import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Sparkles,
  Trophy,
  ChevronLeft,
  ChevronRight,
  HelpCircle,
  Lightbulb,
  RotateCcw,
  CheckCircle2,
  Star,
  Flame,
  Award,
  BookOpen,
} from 'lucide-react';
import { CoupleProfile, PartnerId } from '../types';

interface WordClue {
  word: string;
  clue: string;
  category: string;
}

// Extensive dictionary across diverse fun topics (Cinema, Gastronomia, Viagens, Animais, Cultura Pop, Romance)
const CROSSWORD_DICTIONARY: WordClue[] = [
  // Filmes & Séries
  { word: 'TITANIC', clue: 'Filme épico com Jack e Rose no navio dos sonhos.', category: 'Filmes & Séries' },
  { word: 'MARVEL', clue: 'Universo dos Vingadores, Homem de Ferro e Capitão América.', category: 'Filmes & Séries' },
  { word: 'AVATAR', clue: 'Planeta Pandora com os Na\'vi azuis e natureza exuberante.', category: 'Filmes & Séries' },
  { word: 'OSCAR', clue: 'A estatueta dourada mais cobiçada do cinema mundial.', category: 'Filmes & Séries' },
  { word: 'SHREK', clue: 'Ogro verde carismático que mora no pântano com o Burro.', category: 'Filmes & Séries' },
  { word: 'BATMAN', clue: 'Cavaleiro das Trevas que protege a cidade de Gotham.', category: 'Filmes & Séries' },
  { word: 'BARBIE', clue: 'Boneca mais famosa do mundo que conquistou as telonas de rosa.', category: 'Filmes & Séries' },
  { word: 'DISNEY', clue: 'Reino da magia do castelo, Mickey e contos de fadas.', category: 'Filmes & Séries' },
  { word: 'FROZEN', clue: 'Aventura gelada de Elsa, Anna e o boneco Olaf no inverno.', category: 'Filmes & Séries' },
  { word: 'MATRIX', clue: 'Pílula vermelha ou azul em um mundo de código verde com Neo.', category: 'Filmes & Séries' },
  { word: 'FRIENDS', clue: 'Seis amigos inseparáveis tomando café no Central Perk.', category: 'Filmes & Séries' },
  { word: 'WANDINHA', clue: 'Garota gótica sarcástica da Família Addams na escola Nunca Mais.', category: 'Filmes & Séries' },
  { word: 'CORALINE', clue: 'Porta secreta na parede que leva a um mundo com olhos de botão.', category: 'Filmes & Séries' },
  { word: 'PIRATA', clue: 'Navega pelos mares em busca de baús de ouro com Jack Sparrow.', category: 'Filmes & Séries' },
  { word: 'PIXAR', clue: 'Estúdio de animação criador de Toy Story, Monstros S.A. e Up.', category: 'Filmes & Séries' },

  // Comidas & Gastronomia
  { word: 'BRIGADEIRO', clue: 'Doce típico brasileiro enrolado com chocolate e granulado.', category: 'Comidas & Doces' },
  { word: 'COXINHA', clue: 'Salgadinho recheado de frango desfiado com formato de gota.', category: 'Comidas & Doces' },
  { word: 'ACAI', clue: 'Fruta roxa da Amazônia servida na tigela bem gelada com frutas.', category: 'Comidas & Doces' },
  { word: 'PIZZA', clue: 'Massa redonda assada com muito queijo, molho e orégano.', category: 'Comidas & Doces' },
  { word: 'STROGONOFF', clue: 'Prato com creme de leite, champignon e batata palha crocante.', category: 'Comidas & Doces' },
  { word: 'PUDIM', clue: 'Sobremesa de leite condensado com calda dourada de caramelo.', category: 'Comidas & Doces' },
  { word: 'SUSHI', clue: 'Iguaria tradicional japonesa com arroz e peixe fresco.', category: 'Comidas & Doces' },
  { word: 'CHOCOLATE', clue: 'Doce irresistível feito de cacau que derrete na boca.', category: 'Comidas & Doces' },
  { word: 'PASTEL', clue: 'Massa frita crocante de feira com caldo de cana geladinho.', category: 'Comidas & Doces' },
  { word: 'FONDUE', clue: 'Queijo ou chocolate derretido na panela para espetar pão e frutas.', category: 'Comidas & Doces' },
  { word: 'SORVETE', clue: 'Massa gelada e refrescante em casquinha nos dias de calor.', category: 'Comidas & Doces' },
  { word: 'CREPE', clue: 'Massa fininha de origem francesa com recheio doce ou salgado.', category: 'Comidas & Doces' },
  { word: 'LASANHA', clue: 'Camadas generosas de massa, molho bolonhesa e queijo gratinado.', category: 'Comidas & Doces' },
  { word: 'HAMBURGUER', clue: 'Pão fofinho, carne suculenta e queijo derretido com fritas.', category: 'Comidas & Doces' },
  { word: 'CHURROS', clue: 'Massa frita polvilhada com açúcar e canela recheada com doce de leite.', category: 'Comidas & Doces' },
  { word: 'TAPIOCA', clue: 'Feita da goma de mandioca na frigideira, crocante e quentinha.', category: 'Comidas & Doces' },

  // Viagens & Cidades
  { word: 'PARIS', clue: 'A Cidade Luz na França onde brilha a Torre Eiffel.', category: 'Viagens & Lugares' },
  { word: 'TOQUIO', clue: 'Metrópole vibrante no Japão famosa por luzes neon e cerejeiras.', category: 'Viagens & Lugares' },
  { word: 'ROMA', clue: 'Capital histórica da Itália berço do Coliseu e da Fontana di Trevi.', category: 'Viagens & Lugares' },
  { word: 'LONDRES', clue: 'Cidade dos ônibus vermelhos de dois andares e do Big Ben.', category: 'Viagens & Lugares' },
  { word: 'GRAMADO', clue: 'Cidade charmosa na Serra Gaúcha famosa pelo fondue e Natal Luz.', category: 'Viagens & Lugares' },
  { word: 'PRAIA', clue: 'Faixa de areia dourada de frente para o mar com água de coco.', category: 'Viagens & Lugares' },
  { word: 'AVIAO', clue: 'Meio de transporte com asas que cruza as nuvens entre países.', category: 'Viagens & Lugares' },
  { word: 'PASSAPORTE', clue: 'Caderninho oficial carimbado na imigração para cruzar fronteiras.', category: 'Viagens & Lugares' },
  { word: 'NORONHA', clue: 'Arquipélago brasileiro paradisíaco famoso pelos golfinhos e tartarugas.', category: 'Viagens & Lugares' },
  { word: 'MALA', clue: 'Bagagem onde dobramos nossas roupas favoritas para viajar.', category: 'Viagens & Lugares' },
  { word: 'CRUZEIRO', clue: 'Viagem a bordo de um grande navio de passageiros em alto mar.', category: 'Viagens & Lugares' },
  { word: 'CACHOEIRA', clue: 'Queda de água cristalina refrescante no meio da serra.', category: 'Viagens & Lugares' },

  // Animais & Natureza
  { word: 'GATINHO', clue: 'Felino dengoso que ronrona e adora uma caixa de papelão.', category: 'Animais & Natureza' },
  { word: 'CACHORRO', clue: 'O melhor amigo leal que abana o rabo de alegria ao te ver.', category: 'Animais & Natureza' },
  { word: 'GOLFINHO', clue: 'Mamífero marinho inteligente e brincalhão que salta nas ondas.', category: 'Animais & Natureza' },
  { word: 'PANDA', clue: 'Urso fofo preto e branco que adora comer bambu o dia todo.', category: 'Animais & Natureza' },
  { word: 'BORBOLETA', clue: 'Inseto com asas coloridas que antes vivia como lagarta.', category: 'Animais & Natureza' },
  { word: 'GIRASSOL', clue: 'Flor amarela majestosa que acompanha o movimento da luz solar.', category: 'Animais & Natureza' },
  { word: 'LEAO', clue: 'Felino imponente com vasta juba conhecido como o rei da selva.', category: 'Animais & Natureza' },
  { word: 'FLORESTA', clue: 'Grande ecossistema de árvores altas, ar puro e vida selvagem.', category: 'Animais & Natureza' },
  { word: 'OCEANO', clue: 'Imensa massa de água salgada que cobre a maior parte da Terra.', category: 'Animais & Natureza' },
  { word: 'ESTRELA', clue: 'Corpo celeste brilhante que cintila no céu límpido da noite.', category: 'Animais & Natureza' },

  // Música & Cultura Pop
  { word: 'TAYLOR', clue: 'Cantora loira dona da The Eras Tour e de canções apaixonantes.', category: 'Música & Pop' },
  { word: 'GUITARRA', clue: 'Instrumento musical de cordas elétrico que reina no Rock.', category: 'Música & Pop' },
  { word: 'PIANO', clue: 'Instrumento clássico de teclas pretas e brancas com cauda elegante.', category: 'Música & Pop' },
  { word: 'KARAOKE', clue: 'Diversão onde cantamos no microfone lendo a letra na tela.', category: 'Música & Pop' },
  { word: 'SHOW', clue: 'Apresentação musical ao vivo com palco, luzes e plateia cantando.', category: 'Música & Pop' },
  { word: 'SAMBA', clue: 'Gênero musical tradicional brasileiro celebrado no Carnaval.', category: 'Música & Pop' },
  { word: 'VINIL', clue: 'Disco preto analógico vintage tocado na agulha da vitrola.', category: 'Música & Pop' },
  { word: 'DANCA', clue: 'Expressão do corpo no ritmo compassado de uma boa batida.', category: 'Música & Pop' },
  { word: 'PODCAST', clue: 'Programa de áudio sob demanda para ouvir conversas e entrevistas.', category: 'Música & Pop' },

  // Romance & Casal
  { word: 'AMOR', clue: 'O sentimento mais forte que une nossos corações todos os dias.', category: 'Romance & Casal' },
  { word: 'BEIJO', clue: 'Gesto doce de carinho com os lábios que nunca pode faltar.', category: 'Romance & Casal' },
  { word: 'ABRACO', clue: 'O melhor lugar quentinho do mundo para esquecer qualquer cansaço.', category: 'Romance & Casal' },
  { word: 'CARINHO', clue: 'Denguinho suave no cabelo antes de dormir.', category: 'Romance & Casal' },
  { word: 'PAIXAO', clue: 'A chama ardente e a intensidade do nosso olhar.', category: 'Romance & Casal' },
  { word: 'CORACAO', clue: 'Bate acelerado toda vez que eu te vejo chegar.', category: 'Romance & Casal' },
  { word: 'ETERNO', clue: 'O tempo que eu desejo passar segurando a sua mão.', category: 'Romance & Casal' },
  { word: 'VIDA', clue: 'O que você é para mim desde o primeiro instante.', category: 'Romance & Casal' },
  { word: 'SORRISO', clue: 'O detalhe no seu rosto que ilumina todo o meu dia.', category: 'Romance & Casal' },
  { word: 'ALIANCA', clue: 'Símbolo brilhante de união e amor sem fim.', category: 'Romance & Casal' },
  { word: 'FUTURO', clue: 'Tudo o que estamos sonhando e construindo juntinhas.', category: 'Romance & Casal' },
  { word: 'CUIDADO', clue: 'Fazer um chazinho, cobrir do frio e proteger você.', category: 'Romance & Casal' },
  { word: 'DENGOSO', clue: 'Nosso jeitinho manhoso de pedir atenção e mimo.', category: 'Romance & Casal' },
  { word: 'UNIAO', clue: 'Nossa parceria inquebrável em qualquer fase.', category: 'Romance & Casal' },
  { word: 'CASA', clue: 'Onde nosso coração encontra paz, risada e aconchego.', category: 'Romance & Casal' },
  { word: 'SOFA', clue: 'Lugar sagrado para ver filmes com as pernas entrelaçadas.', category: 'Romance & Casal' },
  { word: 'CAMA', clue: 'Nosso refúgio fofinho para dormir de conchinha.', category: 'Romance & Casal' },
  { word: 'CAFE', clue: 'Bebida aromática quentinha para acordar a dois.', category: 'Romance & Casal' },

  // Geek & Games
  { word: 'MARIO', clue: 'Encanador bigodudo que resgata a Princesa Peach.', category: 'Geek & Games' },
  { word: 'POKEMON', clue: 'Monstrinhos de bolso como Pikachu que capturamos em Pokébolas.', category: 'Geek & Games' },
  { word: 'ZELDA', clue: 'A lendária princesa de Hyrule ao lado do herói Link.', category: 'Geek & Games' },
  { word: 'TETRIS', clue: 'Clássico puzzle soviético de blocos coloridos caindo da tela.', category: 'Geek & Games' },
  { word: 'MINECRAFT', clue: 'Mundo aberto cúbico infinito onde mineramos e construímos.', category: 'Geek & Games' },
  { word: 'PACMAN', clue: 'Personagem amarelo que come pastilhas fugindo de fantasmas.', category: 'Geek & Games' },
  { word: 'CONSOLE', clue: 'Aparelho de videogame conectado na televisão para jogar.', category: 'Geek & Games' },
  { word: 'ARCADE', clue: 'Máquina de fliperama clássica com fichas e botões grandes.', category: 'Geek & Games' },
  { word: 'JOYSTICK', clue: 'Controle com alavancas direcionais para pilotar no videogame.', category: 'Geek & Games' },
  { word: 'SONIC', clue: 'Ouriço azul supersônico veloz que coleta anéis dourados.', category: 'Geek & Games' },

  // Ciência & Tecnologia
  { word: 'INTERNET', clue: 'Rede mundial de computadores que conecta o planeta todo.', category: 'Ciência & Tecnologia' },
  { word: 'FOGUETE', clue: 'Veículo espacial propulsionado para cruzar a atmosfera até a órbita.', category: 'Ciência & Tecnologia' },
  { word: 'GALAXIA', clue: 'Imenso conjunto cósmico com bilhões de estrelas como a Via Láctea.', category: 'Ciência & Tecnologia' },
  { word: 'PLANETA', clue: 'Corpo celeste esférico orbitando o Sol, como a Terra ou Marte.', category: 'Ciência & Tecnologia' },
  { word: 'TELESCOPIO', clue: 'Instrumento óptico com lentes e espelhos para ver constelações distantes.', category: 'Ciência & Tecnologia' },
  { word: 'GRAVIDADE', clue: 'Força fundamental invisível que atrai os corpos em direção ao solo.', category: 'Ciência & Tecnologia' },
  { word: 'ENERGIA', clue: 'Capacidade de produzir trabalho ou luz gerada pelo sol e ventos.', category: 'Ciência & Tecnologia' },
  { word: 'ATOMO', clue: 'Unidade fundamental básica constituinte de toda a matéria do universo.', category: 'Ciência & Tecnologia' },
  { word: 'ROBOT', clue: 'Máquina autônoma programada para realizar tarefas automatizadas.', category: 'Ciência & Tecnologia' },
  { word: 'CELULAR', clue: 'Aparelho portátil moderno que levamos no bolso o dia inteiro.', category: 'Ciência & Tecnologia' },

  // Esportes & Lazer
  { word: 'FUTEBOL', clue: 'Paixão nacional jogada com 11 jogadores chutando ao gol no estádio.', category: 'Esportes & Lazer' },
  { word: 'NATACAO', clue: 'Esporte aquático disputado em piscinas ou águas abertas.', category: 'Esportes & Lazer' },
  { word: 'BASQUETE', clue: 'Esporte dinâmico onde se arremessa a bola na cesta alta.', category: 'Esportes & Lazer' },
  { word: 'MEDALHA', clue: 'Condecoração de ouro, prata ou bronze no pódio esportivo.', category: 'Esportes & Lazer' },
  { word: 'CORRIDA', clue: 'Prova atlética de velocidade ou maratona em busca da linha de chegada.', category: 'Esportes & Lazer' },
  { word: 'CICLISMO', clue: 'Prática de pedalar ao ar livre sobre duas rodas com capacete.', category: 'Esportes & Lazer' },
  { word: 'VOLEI', clue: 'Jogo de cortadas e bloqueios por cima da rede na quadra ou praia.', category: 'Esportes & Lazer' },
  { word: 'SKATE', clue: 'Prancha com quatro rodinhas para manobras radicais em pistas.', category: 'Esportes & Lazer' },
];

const TOPIC_OPTIONS = [
  { id: 'all', label: '🌟 Todos os Temas' },
  { id: 'Filmes & Séries', label: '🍿 Filmes & Séries' },
  { id: 'Comidas & Doces', label: '🍕 Comidas & Doces' },
  { id: 'Geek & Games', label: '👾 Geek & Games' },
  { id: 'Ciência & Tecnologia', label: '🚀 Ciência & Tecnologia' },
  { id: 'Esportes & Lazer', label: '⚽ Esportes & Lazer' },
  { id: 'Viagens & Lugares', label: '✈️ Viagens & Lugares' },
  { id: 'Animais & Natureza', label: '🐾 Animais & Natureza' },
  { id: 'Música & Pop', label: '🎵 Música & Pop' },
  { id: 'Romance & Casal', label: '💖 Romance & Casal' },
];

interface PlacedWord {
  id: number;
  word: string;
  clue: string;
  category: string;
  row: number;
  col: number;
  direction: 'H' | 'V';
}

interface CrosswordGridCell {
  letter: string;
  userLetter: string;
  number?: number;
  isBlocked: boolean;
  words: { wordId: number; indexInWord: number; direction: 'H' | 'V' }[];
}

// Seeded pseudo-random number generator for reproducible 1000 levels
function seededRandom(seed: number) {
  let s = Math.sin(seed) * 10000;
  return s - Math.floor(s);
}

// Generator for level L (from 1 to 1000)
function generateCrosswordLevel(level: number, topic: string = 'all') {
  const seed = level * 7919; // Prime multiplier
  let pool = CROSSWORD_DICTIONARY;
  if (topic !== 'all') {
    const filtered = CROSSWORD_DICTIONARY.filter((w) => w.category === topic);
    if (filtered.length >= 6) {
      pool = filtered;
    }
  }
  const wordsPool = [...pool];

  // Shuffle pool with seed
  for (let i = wordsPool.length - 1; i > 0; i--) {
    const j = Math.floor(seededRandom(seed + i * 13) * (i + 1));
    [wordsPool[i], wordsPool[j]] = [wordsPool[j], wordsPool[i]];
  }

  // Pick 4 to 6 words that can form an interlocking crossword
  const placedWords: PlacedWord[] = [];
  const GRID_SIZE = 9;
  const grid: (string | null)[][] = Array(GRID_SIZE)
    .fill(null)
    .map(() => Array(GRID_SIZE).fill(null));

  // 1. Place central first horizontal word
  const first = wordsPool[0];
  const startRow = 4;
  const startCol = Math.max(0, Math.floor((GRID_SIZE - first.word.length) / 2));

  for (let i = 0; i < first.word.length; i++) {
    grid[startRow][startCol + i] = first.word[i];
  }
  placedWords.push({
    id: 1,
    word: first.word,
    clue: first.clue,
    category: first.category,
    row: startRow,
    col: startCol,
    direction: 'H',
  });

  // 2. Search for vertical intersecting words
  let currentId = 2;
  for (let w = 1; w < wordsPool.length && placedWords.length < 5; w++) {
    const candidate = wordsPool[w];
    let placed = false;

    // Try each existing horizontal placed word
    for (const pw of placedWords) {
      if (pw.direction !== 'H') continue;

      // Find common letters
      for (let i = 0; i < pw.word.length; i++) {
        const char = pw.word[i];
        const matchIndex = candidate.word.indexOf(char);

        if (matchIndex !== -1) {
          const vCol = pw.col + i;
          const vRow = pw.row - matchIndex;

          // Check if candidate fits in grid without bounds errors
          if (vRow >= 0 && vRow + candidate.word.length <= GRID_SIZE) {
            // Check conflicts
            let canPlace = true;
            for (let k = 0; k < candidate.word.length; k++) {
              const r = vRow + k;
              const c = vCol;
              const existing = grid[r][c];
              if (existing !== null && existing !== candidate.word[k]) {
                canPlace = false;
                break;
              }
              // Adjacent checking (avoid accidental touch)
              if (existing === null) {
                if (c > 0 && grid[r][c - 1] !== null && r !== pw.row) canPlace = false;
                if (c < GRID_SIZE - 1 && grid[r][c + 1] !== null && r !== pw.row) canPlace = false;
              }
            }

            if (canPlace) {
              for (let k = 0; k < candidate.word.length; k++) {
                grid[vRow + k][vCol] = candidate.word[k];
              }
              placedWords.push({
                id: currentId++,
                word: candidate.word,
                clue: candidate.clue,
                category: candidate.category,
                row: vRow,
                col: vCol,
                direction: 'V',
              });
              placed = true;
              break;
            }
          }
        }
      }
      if (placed) break;
    }
  }

  // 3. Try to add another horizontal word if space permits
  for (let w = 1; w < wordsPool.length && placedWords.length < 5; w++) {
    const candidate = wordsPool[w];
    if (placedWords.some((p) => p.word === candidate.word)) continue;

    for (const pw of placedWords) {
      if (pw.direction !== 'V') continue;

      for (let i = 0; i < pw.word.length; i++) {
        const char = pw.word[i];
        const matchIndex = candidate.word.indexOf(char);

        if (matchIndex !== -1) {
          const hRow = pw.row + i;
          const hCol = pw.col - matchIndex;

          if (hCol >= 0 && hCol + candidate.word.length <= GRID_SIZE) {
            let canPlace = true;
            for (let k = 0; k < candidate.word.length; k++) {
              const r = hRow;
              const c = hCol + k;
              const existing = grid[r][c];
              if (existing !== null && existing !== candidate.word[k]) {
                canPlace = false;
                break;
              }
              if (existing === null) {
                if (r > 0 && grid[r - 1][c] !== null && c !== pw.col) canPlace = false;
                if (r < GRID_SIZE - 1 && grid[r + 1][c] !== null && c !== pw.col) canPlace = false;
              }
            }

            if (canPlace) {
              for (let k = 0; k < candidate.word.length; k++) {
                grid[hRow][hCol + k] = candidate.word[k];
              }
              placedWords.push({
                id: currentId++,
                word: candidate.word,
                clue: candidate.clue,
                category: candidate.category,
                row: hRow,
                col: hCol,
                direction: 'H',
              });
              break;
            }
          }
        }
      }
      if (placedWords.length >= 5) break;
    }
  }

  // If by chance only 1 word was placed (rare with seeds), add a parallel cute word
  if (placedWords.length < 2) {
    const fallback = wordsPool[1];
    const fbRow = 2;
    const fbCol = Math.max(0, Math.floor((GRID_SIZE - fallback.word.length) / 2));
    for (let i = 0; i < fallback.word.length; i++) {
      grid[fbRow][fbCol + i] = fallback.word[i];
    }
    placedWords.push({
      id: currentId++,
      word: fallback.word,
      clue: fallback.clue,
      category: fallback.category,
      row: fbRow,
      col: fbCol,
      direction: 'H',
    });
  }

  // Calculate bounding box so board fits snugly
  let minR = GRID_SIZE,
    maxR = 0,
    minC = GRID_SIZE,
    maxC = 0;
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      if (grid[r][c] !== null) {
        if (r < minR) minR = r;
        if (r > maxR) maxR = r;
        if (c < minC) minC = c;
        if (c > maxC) maxC = c;
      }
    }
  }

  // Add 1 cell padding if possible
  minR = Math.max(0, minR);
  maxR = Math.min(GRID_SIZE - 1, maxR);
  minC = Math.max(0, minC);
  maxC = Math.min(GRID_SIZE - 1, maxC);

  const numRows = maxR - minR + 1;
  const numCols = maxC - minC + 1;

  // Build final structured grid
  const cells: CrosswordGridCell[][] = Array(numRows)
    .fill(null)
    .map(() =>
      Array(numCols)
        .fill(null)
        .map(() => ({
          letter: '',
          userLetter: '',
          isBlocked: true,
          words: [],
        }))
    );

  const finalPlacedWords: PlacedWord[] = placedWords.map((pw, idx) => {
    const adjustedRow = pw.row - minR;
    const adjustedCol = pw.col - minC;
    return {
      ...pw,
      id: idx + 1,
      row: adjustedRow,
      col: adjustedCol,
    };
  });

  // Populate cells
  finalPlacedWords.forEach((pw) => {
    for (let i = 0; i < pw.word.length; i++) {
      const r = pw.direction === 'H' ? pw.row : pw.row + i;
      const c = pw.direction === 'H' ? pw.col + i : pw.col;

      cells[r][c].letter = pw.word[i];
      cells[r][c].isBlocked = false;
      cells[r][c].words.push({
        wordId: pw.id,
        indexInWord: i,
        direction: pw.direction,
      });

      if (i === 0) {
        cells[r][c].number = pw.id;
      }
    }
  });

  return {
    level,
    numRows,
    numCols,
    cells,
    placedWords: finalPlacedWords,
  };
}

export const CoupleCrosswordGame: React.FC<{ profile: CoupleProfile; activePartner: PartnerId }> = ({
  profile,
  activePartner,
}) => {
  // Current level (1 to 1000)
  const [currentLevel, setCurrentLevel] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('nosso_canto_crossword_level');
      if (saved) {
        const val = parseInt(saved, 10);
        if (!isNaN(val) && val >= 1 && val <= 1000) return val;
      }
    } catch {}
    return 1;
  });

  // Highest unlocked level
  const [highestLevel, setHighestLevel] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('nosso_canto_crossword_highest');
      if (saved) {
        const val = parseInt(saved, 10);
        if (!isNaN(val) && val >= 1) return val;
      }
    } catch {}
    return 1;
  });

  // Total stars earned
  const [totalStars, setTotalStars] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('nosso_canto_crossword_stars');
      if (saved) return parseInt(saved, 10) || 0;
    } catch {}
    return 0;
  });

  // Selected topic filter
  const [selectedTopic, setSelectedTopic] = useState<string>('all');

  const levelData = useMemo(
    () => generateCrosswordLevel(currentLevel, selectedTopic),
    [currentLevel, selectedTopic]
  );

  // User input grid state
  const [userLetters, setUserLetters] = useState<{ [key: string]: string }>({});
  const [selectedCell, setSelectedCell] = useState<{ r: number; c: number } | null>(null);
  const [selectedWordId, setSelectedWordId] = useState<number | null>(1);
  const [hintsUsed, setHintsUsed] = useState<number>(0);
  const [isLevelCompleted, setIsLevelCompleted] = useState<boolean>(false);
  const [showLevelJumpModal, setShowLevelJumpModal] = useState<boolean>(false);
  const [jumpInput, setJumpInput] = useState<string>('');

  const inputRef = useRef<HTMLInputElement>(null);

  // Reset user board when level changes
  useEffect(() => {
    setUserLetters({});
    setHintsUsed(0);
    setIsLevelCompleted(false);

    // Default select first word and its starting cell
    if (levelData.placedWords.length > 0) {
      const firstWord = levelData.placedWords[0];
      setSelectedWordId(firstWord.id);
      setSelectedCell({ r: firstWord.row, c: firstWord.col });
    }
  }, [currentLevel, levelData]);

  // Save progress
  const saveProgress = (nextLvl: number, earnedStars: number) => {
    try {
      localStorage.setItem('nosso_canto_crossword_level', String(nextLvl));
      const newHighest = Math.max(highestLevel, nextLvl);
      setHighestLevel(newHighest);
      localStorage.setItem('nosso_canto_crossword_highest', String(newHighest));

      const newStars = totalStars + earnedStars;
      setTotalStars(newStars);
      localStorage.setItem('nosso_canto_crossword_stars', String(newStars));
    } catch {}
  };

  // Check if level is solved
  const checkIsSolved = (currentInputs: { [key: string]: string }) => {
    for (let r = 0; r < levelData.numRows; r++) {
      for (let c = 0; c < levelData.numCols; c++) {
        const cell = levelData.cells[r][c];
        if (!cell.isBlocked) {
          const userVal = currentInputs[`${r}-${c}`] || '';
          if (userVal.toUpperCase() !== cell.letter.toUpperCase()) {
            return false;
          }
        }
      }
    }
    return true;
  };

  const handleCellClick = (r: number, c: number) => {
    const cell = levelData.cells[r][c];
    if (cell.isBlocked) return;

    setSelectedCell({ r, c });

    // If cell belongs to currently selected word, keep it. Else select first word of cell
    if (cell.words.length > 0) {
      const containsSelected = cell.words.some((w) => w.wordId === selectedWordId);
      if (!containsSelected) {
        setSelectedWordId(cell.words[0].wordId);
      }
    }

    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const handleClueClick = (pw: PlacedWord) => {
    setSelectedWordId(pw.id);
    setSelectedCell({ r: pw.row, c: pw.col });
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  // Advance to next cell in current word
  const moveToNextCell = (r: number, c: number) => {
    if (!selectedWordId) return;
    const activeWord = levelData.placedWords.find((w) => w.id === selectedWordId);
    if (!activeWord) return;

    if (activeWord.direction === 'H') {
      const nextC = c + 1;
      if (nextC < activeWord.col + activeWord.word.length) {
        setSelectedCell({ r, c: nextC });
      }
    } else {
      const nextR = r + 1;
      if (nextR < activeWord.row + activeWord.word.length) {
        setSelectedCell({ r: nextR, c });
      }
    }
  };

  // Move to previous cell in current word on Backspace
  const moveToPrevCell = (r: number, c: number) => {
    if (!selectedWordId) return;
    const activeWord = levelData.placedWords.find((w) => w.id === selectedWordId);
    if (!activeWord) return;

    if (activeWord.direction === 'H') {
      const prevC = c - 1;
      if (prevC >= activeWord.col) {
        setSelectedCell({ r, c: prevC });
      }
    } else {
      const prevR = r - 1;
      if (prevR >= activeWord.row) {
        setSelectedCell({ r: prevR, c });
      }
    }
  };

  const handleKeyInput = (key: string) => {
    if (isLevelCompleted || !selectedCell) return;
    const { r, c } = selectedCell;
    const keyUpper = key.toUpperCase();

    if (/^[A-ZÇ]$/.test(keyUpper)) {
      const newInputs = {
        ...userLetters,
        [`${r}-${c}`]: keyUpper,
      };
      setUserLetters(newInputs);

      // Check win condition
      if (checkIsSolved(newInputs)) {
        setIsLevelCompleted(true);
        const stars = hintsUsed === 0 ? 3 : hintsUsed <= 2 ? 2 : 1;
        saveProgress(currentLevel + 1, stars);
      } else {
        moveToNextCell(r, c);
      }
    } else if (key === 'Backspace') {
      const newInputs = { ...userLetters };
      if (newInputs[`${r}-${c}`]) {
        delete newInputs[`${r}-${c}`];
        setUserLetters(newInputs);
      } else {
        moveToPrevCell(r, c);
      }
    }
  };

  // Reveal a random missing letter (Dica)
  const handleUseHint = () => {
    if (isLevelCompleted) return;

    // Find all missing or incorrect cells
    const unrevealed: { r: number; c: number; letter: string }[] = [];
    for (let r = 0; r < levelData.numRows; r++) {
      for (let c = 0; c < levelData.numCols; c++) {
        const cell = levelData.cells[r][c];
        if (!cell.isBlocked) {
          const userVal = userLetters[`${r}-${c}`] || '';
          if (userVal !== cell.letter) {
            unrevealed.push({ r, c, letter: cell.letter });
          }
        }
      }
    }

    if (unrevealed.length === 0) return;

    // Prefer current selected word cell if empty
    let target = unrevealed[0];
    if (selectedCell) {
      const currentMissing = unrevealed.find(
        (u) => u.r === selectedCell.r && u.c === selectedCell.c
      );
      if (currentMissing) target = currentMissing;
    }

    const newInputs = {
      ...userLetters,
      [`${target.r}-${target.c}`]: target.letter,
    };
    setUserLetters(newInputs);
    setHintsUsed((h) => h + 1);

    if (checkIsSolved(newInputs)) {
      setIsLevelCompleted(true);
      const stars = hintsUsed + 1 === 0 ? 3 : hintsUsed + 1 <= 2 ? 2 : 1;
      saveProgress(currentLevel + 1, stars);
    } else {
      moveToNextCell(target.r, target.c);
    }
  };

  const handleNextLevel = () => {
    if (currentLevel < 1000) {
      setCurrentLevel((lvl) => lvl + 1);
    }
  };

  const handlePrevLevel = () => {
    if (currentLevel > 1) {
      setCurrentLevel((lvl) => lvl - 1);
    }
  };

  const handleJumpToLevel = (e: React.FormEvent) => {
    e.preventDefault();
    const lvl = parseInt(jumpInput, 10);
    if (!isNaN(lvl) && lvl >= 1 && lvl <= 1000) {
      setCurrentLevel(lvl);
      setShowLevelJumpModal(false);
      setJumpInput('');
    }
  };

  // Virtual Keyboard letters
  const KEYBOARD_ROWS = [
    ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
    ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L', 'Ç'],
    ['Z', 'X', 'C', 'V', 'B', 'N', 'M'],
  ];

  return (
    <div className="space-y-5 max-w-4xl mx-auto">
      {/* Hidden input to capture physical keyboard on desktop and mobile */}
      <input
        ref={inputRef}
        type="text"
        className="opacity-0 absolute -top-9999 left-0"
        onKeyDown={(e) => {
          if (e.key === 'Backspace') {
            handleKeyInput('Backspace');
          } else if (e.key.length === 1) {
            handleKeyInput(e.key);
          }
        }}
        autoCapitalize="characters"
      />

      {/* Header with Level selector & Stars */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 rounded-3xl bg-white dark:bg-[#241C21] border border-[#F2E8E4] dark:border-[#3D2F36] shadow-2xs">
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrevLevel}
            disabled={currentLevel <= 1}
            className="p-2 rounded-xl border border-[#F2E8E4] dark:border-[#3D2F36] text-[#7D6F74] dark:text-[#B8A8AF] hover:bg-[#FAF3EC] dark:hover:bg-[#2C2127] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            title="Nível anterior"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <div
            onClick={() => setShowLevelJumpModal(true)}
            className="cursor-pointer group flex items-center gap-2 px-3.5 py-1.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200/80 dark:border-rose-900/50 hover:bg-rose-100 transition-colors"
            title="Clique para pular para qualquer nível (1 a 1000)"
          >
            <BookOpen className="w-4 h-4 text-rose-500" />
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-serif font-bold text-base text-[#2D2327] dark:text-[#FAF4F0]">
                  Nível {currentLevel}
                </span>
                <span className="text-[10px] text-rose-600 dark:text-rose-300 font-semibold bg-white/80 dark:bg-rose-900/80 px-1.5 py-0.5 rounded-md">
                  de 1000
                </span>
              </div>
              <span className="text-[10px] text-[#7D6F74] dark:text-[#B8A8AF] -mt-0.5 block group-hover:text-rose-600">
                Toque para escolher nível ▾
              </span>
            </div>
          </div>

          <button
            onClick={handleNextLevel}
            disabled={currentLevel >= 1000}
            className="p-2 rounded-xl border border-[#F2E8E4] dark:border-[#3D2F36] text-[#7D6F74] dark:text-[#B8A8AF] hover:bg-[#FAF3EC] dark:hover:bg-[#2C2127] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            title="Próximo nível"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Level Stats & Quick Controls */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 px-3 py-1.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/40 text-amber-700 dark:text-amber-300 text-xs font-semibold">
            <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
            <span>{totalStars} Estrelas</span>
          </div>

          <button
            onClick={handleUseHint}
            disabled={isLevelCompleted}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-white dark:bg-[#2D2228] border border-[#F2E8E4] dark:border-[#3D2F36] text-xs font-semibold text-[#7D6F74] dark:text-[#B8A8AF] hover:text-amber-600 hover:border-amber-300 active:scale-95 transition-all"
            title="Revelar uma letra como dica"
          >
            <Lightbulb className="w-4 h-4 text-amber-500" />
            <span>Dica {hintsUsed > 0 && `(${hintsUsed})`}</span>
          </button>

          <button
            onClick={() => {
              setUserLetters({});
              setHintsUsed(0);
            }}
            className="p-2 rounded-2xl border border-[#F2E8E4] dark:border-[#3D2F36] text-[#7D6F74] dark:text-[#B8A8AF] hover:bg-[#FAF3EC] dark:hover:bg-[#2C2127] transition-all"
            title="Recomeçar este nível"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Topic Switcher Bar & Random Theme Button */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        <button
          onClick={() => {
            const nonAllTopics = TOPIC_OPTIONS.filter((t) => t.id !== 'all');
            const randomTopic = nonAllTopics[Math.floor(Math.random() * nonAllTopics.length)];
            const randomLvl = Math.floor(Math.random() * 250) + 1;
            setSelectedTopic(randomTopic.id);
            setCurrentLevel(randomLvl);
            setUserLetters({});
            setHintsUsed(0);
            setIsLevelCompleted(false);
          }}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap bg-gradient-to-r from-[#E07A8B] via-rose-500 to-amber-500 text-white shadow-xs hover:scale-105 active:scale-95 transition-all"
          title="Gerar palavras cruzadas com um tema aleatório surpresa!"
        >
          <span>🎲 Tema Aleatório</span>
        </button>

        {TOPIC_OPTIONS.map((opt) => {
          const isActive = selectedTopic === opt.id;
          return (
            <button
              key={opt.id}
              onClick={() => {
                setSelectedTopic(opt.id);
                setUserLetters({});
                setHintsUsed(0);
                setIsLevelCompleted(false);
              }}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-[#E07A8B] text-white shadow-xs'
                  : 'bg-white dark:bg-[#241C21] border border-[#F2E8E4] dark:border-[#3D2F36] text-[#7D6F74] dark:text-[#B8A8AF] hover:text-[#2D2327] dark:hover:text-[#FAF4F0]'
              }`}
            >
              {opt.label}
            </button>
          );
        })}
      </div>

      {/* Main Game Area: Grid & Clues */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left / Center: Crossword Board */}
        <div className="lg:col-span-7 flex flex-col items-center justify-center p-4 sm:p-6 rounded-3xl bg-white dark:bg-[#241C21] border border-[#F2E8E4] dark:border-[#3D2F36] shadow-sm relative overflow-hidden">
          {/* Active Word Clue Banner at Top of Board */}
          {selectedWordId && (() => {
            const pw = levelData.placedWords.find((w) => w.id === selectedWordId);
            if (!pw) return null;
            return (
              <div className="w-full mb-4 p-3 rounded-2xl bg-rose-50/70 dark:bg-rose-950/40 border border-rose-200/60 dark:border-rose-900/40 text-left">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400">
                    Palavra #{pw.id} • {pw.direction === 'H' ? 'Horizontal' : 'Vertical'} ({pw.word.length} letras)
                  </span>
                  <span className="text-[10px] text-[#7D6F74] dark:text-[#B8A8AF] bg-white/80 dark:bg-[#1C1419] px-2 py-0.5 rounded-full">
                    {pw.category}
                  </span>
                </div>
                <p className="text-xs sm:text-sm font-medium text-[#2D2327] dark:text-[#FAF4F0] leading-snug">
                  "{pw.clue}"
                </p>
              </div>
            );
          })()}

          {/* Crossword Interactive Matrix */}
          <div
            className="inline-grid gap-1.5 sm:gap-2 p-2 rounded-2xl bg-[#FAF8F5] dark:bg-[#1E171C] border border-[#F2E8E4] dark:border-[#3D2F36] shadow-inner select-none touch-manipulation max-w-full overflow-x-auto"
            style={{
              gridTemplateColumns: `repeat(${levelData.numCols}, minmax(32px, 44px))`,
            }}
          >
            {levelData.cells.map((row, r) =>
              row.map((cell, c) => {
                if (cell.isBlocked) {
                  return (
                    <div
                      key={`cell-${r}-${c}`}
                      className="w-8 h-8 sm:w-11 sm:h-11 rounded-xl bg-transparent"
                    />
                  );
                }

                const isSelected = selectedCell?.r === r && selectedCell?.c === c;
                const belongsToActiveWord =
                  selectedWordId !== null &&
                  cell.words.some((w) => w.wordId === selectedWordId);
                const userVal = userLetters[`${r}-${c}`] || '';
                const isCorrect = userVal.toUpperCase() === cell.letter.toUpperCase();

                return (
                  <button
                    key={`cell-${r}-${c}`}
                    type="button"
                    onClick={() => handleCellClick(r, c)}
                    className={`relative w-8 h-8 sm:w-11 sm:h-11 rounded-xl font-bold font-mono text-sm sm:text-lg flex items-center justify-center transition-all duration-150 shadow-2xs ${
                      isSelected
                        ? 'bg-rose-500 text-white ring-2 sm:ring-4 ring-rose-300 dark:ring-rose-900 scale-105 z-10'
                        : belongsToActiveWord
                        ? 'bg-rose-100 dark:bg-rose-950/80 text-[#2D2327] dark:text-rose-200 border-2 border-rose-300 dark:border-rose-700'
                        : 'bg-white dark:bg-[#2A2026] text-[#2D2327] dark:text-[#FAF4F0] border border-[#E8DFD8] dark:border-[#3D2F36] hover:border-rose-300'
                    }`}
                  >
                    {/* Number clue badge in corner */}
                    {cell.number && (
                      <span
                        className={`absolute top-0.5 left-1 text-[9px] sm:text-[10px] font-bold leading-none ${
                          isSelected ? 'text-white/90' : 'text-[#A6999F]'
                        }`}
                      >
                        {cell.number}
                      </span>
                    )}

                    <span>{userVal}</span>
                  </button>
                );
              })
            )}
          </div>

          {/* On-Screen Touch Keyboard for mobile & iPad */}
          <div className="w-full mt-5 pt-4 border-t border-[#F2E8E4] dark:border-[#3D2F36] space-y-1.5">
            {KEYBOARD_ROWS.map((row, rowIdx) => (
              <div key={rowIdx} className="flex items-center justify-center gap-1 sm:gap-1.5">
                {row.map((letter) => (
                  <button
                    key={letter}
                    type="button"
                    onClick={() => handleKeyInput(letter)}
                    className="h-9 sm:h-11 flex-1 max-w-[36px] sm:max-w-[42px] rounded-xl bg-white dark:bg-[#2A2026] border border-[#F2E8E4] dark:border-[#3D2F36] text-xs sm:text-sm font-semibold text-[#2D2327] dark:text-[#FAF4F0] shadow-2xs active:bg-[#E07A8B] active:text-white transition-all select-none touch-manipulation"
                  >
                    {letter}
                  </button>
                ))}
              </div>
            ))}

            <div className="flex items-center justify-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => handleKeyInput('Backspace')}
                className="px-4 py-2 rounded-xl bg-[#FAF3EC] dark:bg-[#2D2228] text-xs font-semibold text-[#7D6F74] dark:text-[#B8A8AF] hover:text-rose-600 border border-[#F2E8E4] dark:border-[#3D2F36] active:scale-95 transition-all select-none"
              >
                ⌫ Apagar Letra
              </button>

              <button
                type="button"
                onClick={handleUseHint}
                className="px-4 py-2 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-xs font-semibold text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/40 active:scale-95 transition-all select-none flex items-center gap-1"
              >
                <Lightbulb className="w-3.5 h-3.5" />
                Revelar Letra
              </button>
            </div>
          </div>
        </div>

        {/* Right: Clues List */}
        <div className="lg:col-span-5 p-4 sm:p-5 rounded-3xl bg-white dark:bg-[#241C21] border border-[#F2E8E4] dark:border-[#3D2F36] shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-[#F2E8E4] dark:border-[#3D2F36]">
            <h3 className="font-serif font-bold text-base text-[#2D2327] dark:text-[#FAF4F0] flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-rose-500" />
              Dicas das Palavras
            </h3>
            <span className="text-xs text-[#7D6F74] dark:text-[#B8A8AF]">
              {levelData.placedWords.length} palavras
            </span>
          </div>

          <div className="space-y-2.5 max-h-[420px] overflow-y-auto pr-1">
            {levelData.placedWords.map((pw) => {
              const isSelected = selectedWordId === pw.id;

              // Check if this word is fully solved by user
              let isWordSolved = true;
              for (let i = 0; i < pw.word.length; i++) {
                const r = pw.direction === 'H' ? pw.row : pw.row + i;
                const c = pw.direction === 'H' ? pw.col + i : pw.col;
                const val = userLetters[`${r}-${c}`] || '';
                if (val.toUpperCase() !== pw.word[i].toUpperCase()) {
                  isWordSolved = false;
                  break;
                }
              }

              return (
                <div
                  key={pw.id}
                  onClick={() => handleClueClick(pw)}
                  className={`p-3 rounded-2xl border transition-all cursor-pointer text-left ${
                    isSelected
                      ? 'bg-rose-50/90 dark:bg-rose-950/60 border-rose-300 dark:border-rose-800 shadow-2xs'
                      : isWordSolved
                      ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/40 opacity-80'
                      : 'bg-[#FAF8F5] dark:bg-[#20181D] border-[#F2E8E4] dark:border-[#3D2F36] hover:border-rose-200'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <div className="flex items-center gap-1.5">
                      <span className="w-5 h-5 rounded-full bg-rose-500 text-white text-[11px] font-bold flex items-center justify-center shadow-2xs">
                        {pw.id}
                      </span>
                      <span className="text-xs font-semibold text-[#2D2327] dark:text-[#FAF4F0]">
                        {pw.direction === 'H' ? 'Horizontal ➔' : 'Vertical ⬇'}
                      </span>
                    </div>

                    {isWordSolved ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-100/60 dark:bg-emerald-950/80 px-2 py-0.5 rounded-full">
                        <CheckCircle2 className="w-3 h-3" /> Completa!
                      </span>
                    ) : (
                      <span className="text-[10px] text-[#A6999F] font-mono">
                        {pw.word.length} letras
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-[#7D6F74] dark:text-[#B8A8AF] leading-relaxed">
                    {pw.clue}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Victory Modal */}
      {isLevelCompleted && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-3xl bg-[#FAF8F5] dark:bg-[#20181D] border border-rose-200 dark:border-rose-900 shadow-2xl p-6 sm:p-8 text-center relative overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Sparkle badge */}
            <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-amber-400 to-rose-400 text-white flex items-center justify-center mx-auto mb-3 shadow-lg shadow-rose-300/40">
              <Trophy className="w-8 h-8" />
            </div>

            <h3 className="font-serif font-bold text-2xl text-[#2D2327] dark:text-[#FAF4F0] mb-1">
              Nível {currentLevel} Concluído! 🎉
            </h3>
            <p className="text-xs sm:text-sm text-[#7D6F74] dark:text-[#B8A8AF] mb-5">
              Vocês formam uma dupla imbatível de palavras cruzadas!
            </p>

            {/* Stars Awarded */}
            <div className="flex items-center justify-center gap-2 mb-6">
              {[1, 2, 3].map((starIdx) => {
                const earned =
                  hintsUsed === 0
                    ? true
                    : hintsUsed <= 2
                    ? starIdx <= 2
                    : starIdx <= 1;
                return (
                  <Star
                    key={starIdx}
                    className={`w-8 h-8 transition-all ${
                      earned
                        ? 'fill-amber-400 text-amber-400 scale-110 drop-shadow-sm'
                        : 'text-stone-300 dark:text-stone-700'
                    }`}
                  />
                );
              })}
            </div>

            <div className="p-3 rounded-2xl bg-white dark:bg-[#2A2026] border border-[#F2E8E4] dark:border-[#3D2F36] text-xs text-[#7D6F74] dark:text-[#B8A8AF] mb-6">
              {hintsUsed === 0
                ? '⭐ Perfeito! Nenhuma dica utilizada!'
                : `💡 ${hintsUsed} dica(s) utilizada(s).`}
            </div>

            {/* Next level button */}
            <button
              onClick={handleNextLevel}
              className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-[#E07A8B] to-[#F4A6B3] text-white font-semibold text-sm shadow-md shadow-rose-300/40 hover:brightness-105 active:scale-98 transition-all flex items-center justify-center gap-2"
            >
              <span>Jogar Nível {currentLevel + 1}</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Level Jump Modal */}
      {showLevelJumpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-3xl bg-white dark:bg-[#20181D] border border-[#F2E8E4] dark:border-[#3D2F36] shadow-2xl p-6 text-center">
            <h3 className="font-serif font-bold text-lg text-[#2D2327] dark:text-[#FAF4F0] mb-2">
              Escolher Nível (1 a 1000)
            </h3>
            <p className="text-xs text-[#7D6F74] dark:text-[#B8A8AF] mb-4">
              Digite o número do nível que você quer jogar agora:
            </p>

            <form onSubmit={handleJumpToLevel} className="space-y-4">
              <input
                type="number"
                min={1}
                max={1000}
                required
                value={jumpInput}
                onChange={(e) => setJumpInput(e.target.value)}
                placeholder="Ex: 50"
                className="w-full px-4 py-3 rounded-2xl bg-[#FAF8F5] dark:bg-[#2D2228] border border-[#F2E8E4] dark:border-[#3D2F36] text-[#2D2327] dark:text-[#FAF4F0] text-center font-bold text-lg focus:outline-none focus:ring-2 focus:ring-[#E07A8B]"
                autoFocus
              />

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowLevelJumpModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-[#F2E8E4] dark:border-[#3D2F36] text-xs font-semibold text-[#7D6F74] dark:text-[#B8A8AF]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-[#E07A8B] text-white text-xs font-semibold hover:brightness-105 transition-all"
                >
                  Ir para o Nível
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
