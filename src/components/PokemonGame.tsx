import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Sparkles,
  Trophy,
  RotateCcw,
  HelpCircle,
  Eye,
  CheckCircle2,
  XCircle,
  Zap,
  Heart,
  Award,
  Flame,
  Search,
  Volume2,
} from 'lucide-react';
import { CoupleProfile, PartnerId } from '../types';

export interface PokemonData {
  id: number;
  name: string;
  brazilianName?: string;
  types: string[];
  generation: string;
  funFact: string;
  color: string;
}

const POKEMON_LIST: PokemonData[] = [
  {
    id: 25,
    name: 'Pikachu',
    types: ['Elétrico ⚡'],
    generation: 'Gen 1 (Kanto)',
    funFact: 'Acumula eletricidade em suas bochechas vermelhas e solta faíscas quando fica feliz!',
    color: '#F4C430',
  },
  {
    id: 133,
    name: 'Eevee',
    types: ['Normal 🌸'],
    generation: 'Gen 1 (Kanto)',
    funFact: 'Possui DNA instável que permite evoluir para 8 formas diferentes com muito amor!',
    color: '#C68B59',
  },
  {
    id: 94,
    name: 'Gengar',
    types: ['Fantasma 👻', 'Venenoso 🧪'],
    generation: 'Gen 1 (Kanto)',
    funFact: 'Diz a lenda que se a temperatura do quarto cair 5 graus de repente, há um Gengar sorrindo por perto.',
    color: '#7B5282',
  },
  {
    id: 143,
    name: 'Snorlax',
    types: ['Normal 💤'],
    generation: 'Gen 1 (Kanto)',
    funFact: 'Come mais de 400kg de comida por dia e passa o resto do tempo tirando uma sonequinha farta.',
    color: '#386663',
  },
  {
    id: 175,
    name: 'Togepi',
    types: ['Fada ✨'],
    generation: 'Gen 2 (Johto)',
    funFact: 'Sua casca de ovo é cheia de felicidade acumulada e traz sorte imensa para quem a protege!',
    color: '#FBE2B5',
  },
  {
    id: 39,
    name: 'Jigglypuff',
    types: ['Normal 🎤', 'Fada 🌸'],
    generation: 'Gen 1 (Kanto)',
    funFact: 'Canta uma canção de ninar tão relaxante que todos ao redor dormem, e depois desenha no rosto de quem dormiu!',
    color: '#F5B0BD',
  },
  {
    id: 4,
    name: 'Charmander',
    types: ['Fogo 🔥'],
    generation: 'Gen 1 (Kanto)',
    funFact: 'A chama na ponta da sua cauda queima intensamente quando está cheio de energia e alegre.',
    color: '#F08030',
  },
  {
    id: 7,
    name: 'Squirtle',
    types: ['Água 💧'],
    generation: 'Gen 1 (Kanto)',
    funFact: 'Líder do clássico Esquadrão Squirtle com óculos escuros icônicos e casca resistente.',
    color: '#6890F0',
  },
  {
    id: 1,
    name: 'Bulbasaur',
    types: ['Planta 🍃', 'Venenoso 🧪'],
    generation: 'Gen 1 (Kanto)',
    funFact: 'Carrega uma semente nas costas desde o nascimento que cresce absorvendo a luz do sol.',
    color: '#78C850',
  },
  {
    id: 54,
    name: 'Psyduck',
    types: ['Água 💧'],
    generation: 'Gen 1 (Kanto)',
    funFact: 'Tem dores de cabeça constantes que liberam poderes psíquicos misteriosos sem nem perceber!',
    color: '#F7D02C',
  },
  {
    id: 151,
    name: 'Mew',
    types: ['Psíquico 🔮'],
    generation: 'Gen 1 (Kanto)',
    funFact: 'É tão puro que só aparece para pessoas com coração sincero e contém o código genético de todos os Pokémon.',
    color: '#FA92B2',
  },
  {
    id: 778,
    name: 'Mimikyu',
    types: ['Fantasma 👻', 'Fada ✨'],
    generation: 'Gen 7 (Alola)',
    funFact: 'Disfarça-se como Pikachu usando um pano velho porque só quer ser amado pelas pessoas!',
    color: '#E0C068',
  },
  {
    id: 448,
    name: 'Lucario',
    types: ['Lutador 🥊', 'Aço 🛡️'],
    generation: 'Gen 4 (Sinnoh)',
    funFact: 'Pode ler as emoções e auras das pessoas mesmo a quilômetros de distância.',
    color: '#497998',
  },
  {
    id: 700,
    name: 'Sylveon',
    types: ['Fada 💖'],
    generation: 'Gen 6 (Kalos)',
    funFact: 'Evolui do Eevee através do carinho sincero, emitindo uma aura calmante através de suas fitas.',
    color: '#F4ABC4',
  },
  {
    id: 197,
    name: 'Umbreon',
    types: ['Noturno 🌙'],
    generation: 'Gen 2 (Johto)',
    funFact: 'Quando a lua cheia brilha, os anéis amarelos em seu corpo reluzem na escuridão.',
    color: '#4F5E68',
  },
  {
    id: 196,
    name: 'Espeon',
    types: ['Psíquico 🔮'],
    generation: 'Gen 2 (Johto)',
    funFact: 'Sua lealdade ao parceiro é tão profunda que desenvolveu o poder de prever o futuro para protegê-lo.',
    color: '#A890F0',
  },
  {
    id: 149,
    name: 'Dragonite',
    types: ['Dragão 🐉', 'Voador 🕊️'],
    generation: 'Gen 1 (Kanto)',
    funFact: 'Apesar de ser imenso e poderoso, é carinhoso e salva marinheiros perdidos em alto mar.',
    color: '#FFA54F',
  },
  {
    id: 132,
    name: 'Ditto',
    types: ['Normal 🟣'],
    generation: 'Gen 1 (Kanto)',
    funFact: 'Pode reorganizar suas células para copiar qualquer Pokémon, mas às vezes esquece e mantém os olhinhos de pontinho!',
    color: '#A890F0',
  },
  {
    id: 152,
    name: 'Chikorita',
    types: ['Planta 🍃'],
    generation: 'Gen 2 (Johto)',
    funFact: 'A folha em sua cabeça exala um aroma doce e reconfortante que acalma quem estiver estressado.',
    color: '#88D880',
  },
  {
    id: 155,
    name: 'Cyndaquil',
    types: ['Fogo 🔥'],
    generation: 'Gen 2 (Johto)',
    funFact: 'É tímido e fofo, e acende suas chamas nas costas quando toma um susto ou quer se defender.',
    color: '#F08030',
  },
  {
    id: 158,
    name: 'Totodile',
    types: ['Água 💧'],
    generation: 'Gen 2 (Johto)',
    funFact: 'Pequeno, agitado e cheio de energia, dança de alegria pulando com os pezinhos na água!',
    color: '#6890F0',
  },
  {
    id: 393,
    name: 'Piplup',
    types: ['Água 💧'],
    generation: 'Gen 4 (Sinnoh)',
    funFact: 'Muito orgulhoso e gracioso, odeia receber ordens mas adora ser elogiado com carinho.',
    color: '#539DDF',
  },
  {
    id: 258,
    name: 'Mudkip',
    types: ['Água 💧'],
    generation: 'Gen 3 (Hoenn)',
    funFact: 'Sua barbatana na cabeça funciona como um radar natural sensível às correntes de água e terra.',
    color: '#4E9ECF',
  },
  {
    id: 37,
    name: 'Vulpix',
    types: ['Fogo 🔥'],
    generation: 'Gen 1 (Kanto)',
    funFact: 'Nasce com apenas uma cauda branca que se divide em seis lindas caudas douradas conforme cresce.',
    color: '#D87040',
  },
  {
    id: 6,
    name: 'Charizard',
    types: ['Fogo 🔥', 'Voador 🐉'],
    generation: 'Gen 1 (Kanto)',
    funFact: 'Suas asas o levam acima das nuvens e seu sopro de fogo é capaz de derreter pedregulhos.',
    color: '#F08030',
  },
  {
    id: 131,
    name: 'Lapras',
    types: ['Água 💧', 'Gelo ❄️'],
    generation: 'Gen 1 (Kanto)',
    funFact: 'Pokémon dócil e cantor que adora carregar pessoas com segurança em seu casco pelo mar.',
    color: '#6890F0',
  },
  {
    id: 280,
    name: 'Ralts',
    types: ['Psíquico 🔮', 'Fada ✨'],
    generation: 'Gen 3 (Hoenn)',
    funFact: 'Sente a felicidade e o amor das pessoas; quando o casal está feliz, seu corpo esquenta de alegria!',
    color: '#A0D8A8',
  },
];

const BADGES = [
  { id: 'thunder', name: 'Insígnia do Trovão ⚡', scoreNeeded: 3, desc: '3 acertos seguidos!' },
  { id: 'heart', name: 'Insígnia do Amor 💖', scoreNeeded: 6, desc: 'Amor pela Pokédex!' },
  { id: 'soul', name: 'Insígnia Alma Gêmea 🌸', scoreNeeded: 10, desc: 'Cassi & Milla Mestres!' },
  { id: 'champion', name: 'Campeãs de Kanto 🏆', scoreNeeded: 15, desc: 'Conhecimento lendário!' },
];

export const PokemonGame: React.FC<{
  profile: CoupleProfile;
  activePartner: PartnerId;
}> = ({ profile, activePartner }) => {
  const p1 = profile.partner1;
  const p2 = profile.partner2;

  const [currentIndex, setCurrentIndex] = useState<number>(() =>
    Math.floor(Math.random() * POKEMON_LIST.length)
  );
  const [revealed, setRevealed] = useState<boolean>(false);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [score, setScore] = useState<number>(0);
  const [streak, setStreak] = useState<number>(0);
  const [showTypeHint, setShowTypeHint] = useState<boolean>(false);
  const [showFactHint, setShowFactHint] = useState<boolean>(false);
  const [playTurn, setPlayTurn] = useState<'both' | 'partner1' | 'partner2'>('partner2'); // Default to Cassi who loves it!

  const currentPokemon = POKEMON_LIST[currentIndex];

  // Generate 4 randomized options (1 correct, 3 wrong)
  const options = useMemo(() => {
    const wrongNames = POKEMON_LIST.filter((p) => p.name !== currentPokemon.name).map(
      (p) => p.name
    );
    // Shuffle wrong
    for (let i = wrongNames.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [wrongNames[i], wrongNames[j]] = [wrongNames[j], wrongNames[i]];
    }
    const chosenOptions = [currentPokemon.name, ...wrongNames.slice(0, 3)];
    // Shuffle final 4
    for (let i = chosenOptions.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [chosenOptions[i], chosenOptions[j]] = [chosenOptions[j], chosenOptions[i]];
    }
    return chosenOptions;
  }, [currentPokemon]);

  const imageUrl = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${currentPokemon.id}.png`;

  const handleGuess = (pokemonName: string) => {
    if (revealed) return;
    setSelectedOption(pokemonName);
    setRevealed(true);

    if (pokemonName.toLowerCase() === currentPokemon.name.toLowerCase()) {
      setIsCorrect(true);
      setScore((s) => s + 10);
      setStreak((st) => st + 1);
    } else {
      setIsCorrect(false);
      setStreak(0);
    }
  };

  const handleNextPokemon = useCallback(() => {
    let nextIdx = Math.floor(Math.random() * POKEMON_LIST.length);
    while (nextIdx === currentIndex && POKEMON_LIST.length > 1) {
      nextIdx = Math.floor(Math.random() * POKEMON_LIST.length);
    }
    setCurrentIndex(nextIdx);
    setRevealed(false);
    setSelectedOption(null);
    setIsCorrect(null);
    setShowTypeHint(false);
    setShowFactHint(false);
  }, [currentIndex]);

  const unlockedBadges = BADGES.filter((b) => score / 10 >= b.scoreNeeded);

  return (
    <div className="flex flex-col items-center p-2 sm:p-4 max-w-4xl mx-auto select-none space-y-4">
      {/* Top Header Card */}
      <div className="w-full flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white dark:bg-[#241C21] p-3 sm:p-4 rounded-3xl border border-[#F2E8E4] dark:border-[#3D2F36] shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-400 via-red-500 to-rose-600 flex items-center justify-center text-white shadow-md text-2xl">
            ⚡
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-serif font-bold text-lg sm:text-xl text-[#2D2327] dark:text-[#FAF4F0]">
                Quem é esse Pokémon?
              </h2>
            </div>
            <p className="text-xs text-[#7D6F74] dark:text-[#B8A8AF]">
              Adivinhe a silhueta, ganhe insígnias de casal e mostre seus conhecimentos Pokémon!
            </p>
          </div>
        </div>

        {/* Turn Selector Pills */}
        <div className="flex items-center gap-1.5 p-1 rounded-full bg-rose-50/70 dark:bg-rose-950/40 border border-rose-200/60 dark:border-rose-900/50">
          <button
            onClick={() => setPlayTurn('partner2')}
            className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
              playTurn === 'partner2'
                ? 'bg-white dark:bg-[#2C1D24] text-[#9E3E50] dark:text-rose-200 border border-rose-300 dark:border-rose-800 shadow-xs'
                : 'text-[#7D6F74] hover:text-[#2D2327]'
            }`}
          >
            🌸 {p2.nickname || p2.name}
          </button>
          <button
            onClick={() => setPlayTurn('partner1')}
            className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
              playTurn === 'partner1'
                ? 'bg-white dark:bg-[#2C1D24] text-[#9E3E50] dark:text-rose-200 border border-rose-300 dark:border-rose-800 shadow-xs'
                : 'text-[#7D6F74] hover:text-[#2D2327]'
            }`}
          >
            👩🏻 {p1.nickname || p1.name}
          </button>
          <button
            onClick={() => setPlayTurn('both')}
            className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
              playTurn === 'both'
                ? 'bg-white dark:bg-[#2C1D24] text-[#9E3E50] dark:text-rose-200 border border-rose-300 dark:border-rose-800 shadow-xs'
                : 'text-[#7D6F74] hover:text-[#2D2327]'
            }`}
          >
            💕 Juntas
          </button>
        </div>
      </div>

      {/* Score & Badges Bar */}
      <div className="w-full flex items-center justify-between text-xs px-2 text-[#7D6F74] dark:text-[#B8A8AF]">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5 font-bold text-[#2D2327] dark:text-[#FAF4F0]">
            <Trophy className="w-4 h-4 text-amber-500" />
            Pontos: <span className="font-mono text-base text-amber-600 dark:text-amber-400">{score}</span>
          </span>
          <span className="flex items-center gap-1">
            <Flame className="w-3.5 h-3.5 text-rose-500" />
            Sequência: <strong className="font-mono text-[#2D2327] dark:text-[#FAF4F0]">{streak}x</strong>
          </span>
        </div>

        {/* Unlocked Badges Mini Bar */}
        <div className="flex items-center gap-1">
          {BADGES.map((b) => {
            const isUnlocked = score / 10 >= b.scoreNeeded;
            return (
              <span
                key={b.id}
                title={`${b.name} (${b.desc})`}
                className={`text-xs px-2 py-0.5 rounded-full border transition-all ${
                  isUnlocked
                    ? 'bg-amber-100 dark:bg-amber-950/60 border-amber-400 text-amber-900 dark:text-amber-200 font-bold scale-105'
                    : 'bg-zinc-100 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 opacity-40 grayscale'
                }`}
              >
                {b.name.split(' ')[0]}
              </span>
            );
          })}
        </div>
      </div>

      {/* Main Pokémon Arena (Stylized Pokéball & Silhouette) */}
      <div className="w-full relative overflow-hidden rounded-3xl bg-gradient-to-b from-[#1C2333] via-[#161B26] to-[#0E121A] border-4 border-[#2D3748] shadow-2xl p-4 sm:p-8 flex flex-col items-center justify-center min-h-[360px]">
        {/* Decorative Pokéball Glow Background */}
        <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-red-600/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-72 h-72 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />

        {/* Top TV Screen Headline */}
        <div className="relative z-10 mb-4 px-4 py-1.5 rounded-full bg-black/40 border border-white/10 backdrop-blur-xs flex items-center gap-2">
          <Zap className="w-4 h-4 text-yellow-400 animate-bounce" />
          <span className="font-mono uppercase tracking-widest text-xs text-yellow-300 font-bold">
            {revealed ? `É o ${currentPokemon.name}! 🎉` : 'Quem é esse Pokémon?!'}
          </span>
        </div>

        {/* Pokémon Image Silhouette or Revealed */}
        <div className="relative z-10 w-52 h-52 sm:w-64 sm:h-64 flex items-center justify-center my-2">
          {/* Circular platform glow */}
          <div className="absolute bottom-2 w-44 h-8 rounded-[100%] bg-white/10 blur-md" />

          <img
            src={imageUrl}
            alt={revealed ? currentPokemon.name : 'Silhueta Pokémon'}
            referrerPolicy="no-referrer"
            className={`w-full h-full object-contain transition-all duration-700 ease-out select-none pointer-events-none ${
              revealed
                ? 'filter-none scale-105 drop-shadow-[0_0_20px_rgba(255,215,0,0.6)] animate-in zoom-in-95'
                : 'brightness-0 contrast-200 invert opacity-95 drop-shadow-[0_0_12px_rgba(255,255,255,0.3)]'
            }`}
          />

          {!revealed && (
            <div className="absolute text-5xl font-black text-white/30 select-none animate-pulse">
              ?
            </div>
          )}
        </div>

        {/* Hints Bar (when not revealed) */}
        {!revealed && (
          <div className="relative z-10 flex flex-wrap items-center justify-center gap-2 mt-2">
            <button
              onClick={() => setShowTypeHint(true)}
              disabled={showTypeHint}
              className="px-3 py-1 rounded-full text-xs font-semibold bg-white/10 hover:bg-white/20 text-emerald-200 border border-emerald-500/40 backdrop-blur-xs transition-colors disabled:opacity-80"
            >
              🔍 {showTypeHint ? `Tipo: ${currentPokemon.types.join(', ')}` : 'Dica: Ver Tipo'}
            </button>
            <button
              onClick={() => setShowFactHint(true)}
              disabled={showFactHint}
              className="px-3 py-1 rounded-full text-xs font-semibold bg-white/10 hover:bg-white/20 text-amber-200 border border-amber-500/40 backdrop-blur-xs transition-colors disabled:opacity-80"
            >
              📜 {showFactHint ? currentPokemon.generation : 'Dica: Geração'}
            </button>
          </div>
        )}

        {/* Revealed Fun Fact Card */}
        {revealed && (
          <div className="relative z-10 mt-3 p-3.5 rounded-2xl bg-black/50 border border-white/20 max-w-md w-full text-center space-y-1.5 animate-in fade-in slide-in-from-bottom-2">
            <div className="flex items-center justify-center gap-2 text-xs font-bold text-yellow-300">
              <span>#{currentPokemon.id.toString().padStart(3, '0')}</span>
              <span>•</span>
              <span>{currentPokemon.types.join(' / ')}</span>
              <span>•</span>
              <span>{currentPokemon.generation}</span>
            </div>
            <p className="text-xs text-white/90 leading-relaxed font-sans">
              &quot;{currentPokemon.funFact}&quot;
            </p>
          </div>
        )}
      </div>

      {/* Answer Options Grid */}
      <div className="w-full grid grid-cols-2 gap-2.5 sm:gap-3">
        {options.map((optionName) => {
          const isThisSelected = selectedOption === optionName;
          const isThisCorrect = optionName.toLowerCase() === currentPokemon.name.toLowerCase();

          let btnClass =
            'bg-white dark:bg-[#241C21] text-[#2D2327] dark:text-[#FAF4F0] border-2 border-[#F2D6DC] dark:border-[#422C37] hover:border-amber-400 hover:bg-amber-50/40 dark:hover:bg-amber-950/20';

          if (revealed) {
            if (isThisCorrect) {
              btnClass =
                'bg-emerald-500 text-white border-2 border-emerald-400 shadow-md font-bold scale-[1.02]';
            } else if (isThisSelected) {
              btnClass = 'bg-rose-500 text-white border-2 border-rose-400 opacity-70';
            } else {
              btnClass = 'opacity-40 border-zinc-200 dark:border-zinc-800';
            }
          }

          return (
            <button
              key={optionName}
              onClick={() => handleGuess(optionName)}
              disabled={revealed}
              className={`p-3 sm:p-4 rounded-2xl font-serif text-sm sm:text-base font-bold transition-all shadow-xs flex items-center justify-between ${btnClass}`}
            >
              <span>{optionName}</span>
              {revealed && isThisCorrect && <CheckCircle2 className="w-5 h-5 text-white" />}
              {revealed && isThisSelected && !isThisCorrect && (
                <XCircle className="w-5 h-5 text-white" />
              )}
            </button>
          );
        })}
      </div>

      {/* Action Next Button */}
      {revealed && (
        <button
          onClick={handleNextPokemon}
          className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 via-rose-500 to-red-500 hover:from-amber-600 hover:to-red-600 text-white font-bold text-sm sm:text-base shadow-lg hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2"
        >
          <Sparkles className="w-4 h-4" />
          <span>Próximo Pokémon! ⚡</span>
        </button>
      )}
    </div>
  );
};
