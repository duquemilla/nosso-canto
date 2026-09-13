import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Search,
  RotateCcw,
  Sparkles,
  Trophy,
  HelpCircle,
  Clock,
  CheckCircle2,
  ChevronRight,
  Flame,
  Shuffle,
} from 'lucide-react';
import { CoupleProfile, PartnerId } from '../types';

interface WordSearchGameProps {
  profile?: CoupleProfile;
  activePartner?: PartnerId;
  onBack?: () => void;
}

interface ThemeDef {
  id: string;
  name: string;
  icon: string;
  description: string;
  words: string[];
}

const THEMES: ThemeDef[] = [
  {
    id: 'nerd_tech',
    name: 'Nerdices & Tecnologia',
    icon: '💻',
    description: 'Algoritmos, códigos e termos do mundo dev e gamer',
    words: ['ALGORITMO', 'CODIGO', 'MATRIX', 'PIXEL', 'ROBO', 'LINUX', 'PYTHON', 'CLOUD'],
  },
  {
    id: 'pokemon_games',
    name: 'Pokémon & Games Retrô',
    icon: '⚡',
    description: 'Favoritos da Cassi e dos jogos clássicos',
    words: ['PIKACHU', 'CHARIZARD', 'MEWTWO', 'NINTENDO', 'ZELDA', 'ARCADE', 'POKEBOLA', 'CONSOLE'],
  },
  {
    id: 'casal_jp_poa',
    name: 'Cassi & Milla (JP + POA)',
    icon: '💕',
    description: 'Palavras fofas da rotina, viagens e carinho à distância',
    words: ['CASSI', 'MILLA', 'PRAIA', 'CHIMARRAO', 'SAUDADE', 'ABRACO', 'CARINHO', 'CORACAO'],
  },
  {
    id: 'ciencia_cosmos',
    name: 'Ciência & Espaço',
    icon: '🪐',
    description: 'Para mentes curiosas fascinadas pelo universo',
    words: ['GALAXIA', 'QUANTICO', 'NEBULA', 'FOTON', 'TELESCOPIO', 'GRAVIDADE', 'COMETA', 'ORBITA'],
  },
];

const GRID_SIZE = 10;

interface PlacedWord {
  word: string;
  coords: { r: number; c: number }[];
  color: string;
}

const HIGHLIGHT_COLORS = [
  'bg-rose-500/30 text-rose-700 dark:text-rose-200 border-rose-400 font-bold',
  'bg-indigo-500/30 text-indigo-700 dark:text-indigo-200 border-indigo-400 font-bold',
  'bg-emerald-500/30 text-emerald-700 dark:text-emerald-200 border-emerald-400 font-bold',
  'bg-amber-500/30 text-amber-700 dark:text-amber-200 border-amber-400 font-bold',
  'bg-teal-500/30 text-teal-700 dark:text-teal-200 border-teal-400 font-bold',
  'bg-purple-500/30 text-purple-700 dark:text-purple-200 border-purple-400 font-bold',
  'bg-sky-500/30 text-sky-700 dark:text-sky-200 border-sky-400 font-bold',
  'bg-pink-500/30 text-pink-700 dark:text-pink-200 border-pink-400 font-bold',
];

// Direction deltas: horizontal, vertical, diagonal
const DIRECTIONS = [
  { dr: 0, dc: 1 },  // Left to right
  { dr: 1, dc: 0 },  // Top to bottom
  { dr: 1, dc: 1 },  // Diagonal down-right
  { dr: 1, dc: -1 }, // Diagonal down-left
];

function generateGrid(wordsToPlace: string[]) {
  const grid: string[][] = Array.from({ length: GRID_SIZE }, () =>
    Array.from({ length: GRID_SIZE }, () => '')
  );
  const placedWords: PlacedWord[] = [];

  // Sort words by length descending to place larger ones first
  const sortedWords = [...wordsToPlace].sort((a, b) => b.length - a.length);

  for (let i = 0; i < sortedWords.length; i++) {
    const word = sortedWords[i].toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    let placed = false;
    let attempts = 0;

    while (!placed && attempts < 150) {
      attempts++;
      const dir = DIRECTIONS[Math.floor(Math.random() * DIRECTIONS.length)];
      const maxR = dir.dr === 1 ? GRID_SIZE - word.length : GRID_SIZE - 1;
      const minR = 0;
      const maxC = dir.dc === 1 ? GRID_SIZE - word.length : GRID_SIZE - 1;
      const minC = dir.dc === -1 ? word.length - 1 : 0;

      if (maxR < minR || maxC < minC) continue;

      const r = Math.floor(Math.random() * (maxR - minR + 1)) + minR;
      const c = Math.floor(Math.random() * (maxC - minC + 1)) + minC;

      // Check if fit
      let canPlace = true;
      const coords: { r: number; c: number }[] = [];
      for (let charIndex = 0; charIndex < word.length; charIndex++) {
        const curR = r + dir.dr * charIndex;
        const curC = c + dir.dc * charIndex;
        const existing = grid[curR][curC];
        if (existing !== '' && existing !== word[charIndex]) {
          canPlace = false;
          break;
        }
        coords.push({ r: curR, c: curC });
      }

      if (canPlace) {
        for (let charIndex = 0; charIndex < word.length; charIndex++) {
          const curR = r + dir.dr * charIndex;
          const curC = c + dir.dc * charIndex;
          grid[curR][curC] = word[charIndex];
        }
        placedWords.push({
          word,
          coords,
          color: HIGHLIGHT_COLORS[i % HIGHLIGHT_COLORS.length],
        });
        placed = true;
      }
    }
  }

  // Fill remaining cells with random letters
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      if (!grid[r][c]) {
        grid[r][c] = alphabet[Math.floor(Math.random() * alphabet.length)];
      }
    }
  }

  return { grid, placedWords };
}

export const WordSearchGame: React.FC<WordSearchGameProps> = ({ profile, activePartner }) => {
  const [selectedThemeId, setSelectedThemeId] = useState<string>('nerd_tech');
  const [gridData, setGridData] = useState<{ grid: string[][]; placedWords: PlacedWord[] }>({
    grid: [],
    placedWords: [],
  });

  const [foundWords, setFoundWords] = useState<string[]>([]);
  const [selectionStart, setSelectionStart] = useState<{ r: number; c: number } | null>(null);
  const [selectionEnd, setSelectionEnd] = useState<{ r: number; c: number } | null>(null);
  const [isSelecting, setIsSelecting] = useState(false);

  // Timer & hints
  const [seconds, setSeconds] = useState(0);
  const [timerActive, setTimerActive] = useState(true);
  const [hintCoords, setHintCoords] = useState<{ r: number; c: number } | null>(null);
  const [hasWon, setHasWon] = useState(false);

  const currentTheme = useMemo(
    () => THEMES.find((t) => t.id === selectedThemeId) || THEMES[0],
    [selectedThemeId]
  );

  const startNewGame = useCallback(
    (themeId: string) => {
      const theme = THEMES.find((t) => t.id === themeId) || THEMES[0];
      const data = generateGrid(theme.words);
      setGridData(data);
      setFoundWords([]);
      setSelectionStart(null);
      setSelectionEnd(null);
      setIsSelecting(false);
      setSeconds(0);
      setTimerActive(true);
      setHintCoords(null);
      setHasWon(false);
    },
    []
  );

  useEffect(() => {
    startNewGame(selectedThemeId);
  }, [selectedThemeId, startNewGame]);

  // Timer tick
  useEffect(() => {
    if (!timerActive || hasWon) return;
    const interval = setInterval(() => {
      setSeconds((s) => s + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [timerActive, hasWon]);

  // Check victory
  useEffect(() => {
    if (gridData.placedWords.length > 0 && foundWords.length === gridData.placedWords.length) {
      setHasWon(true);
      setTimerActive(false);
    }
  }, [foundWords, gridData.placedWords]);

  // Format seconds mm:ss
  const formatTime = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // Get line coordinates between start and end (only horizontal, vertical, or 45deg diagonal)
  const currentSelectionLine = useMemo(() => {
    if (!selectionStart) return [];
    if (!selectionEnd) return [selectionStart];

    const dr = selectionEnd.r - selectionStart.r;
    const dc = selectionEnd.c - selectionStart.c;

    const absDr = Math.abs(dr);
    const absDc = Math.abs(dc);

    // Must be same row, same col, or square diagonal
    if (absDr !== 0 && absDc !== 0 && absDr !== absDc) {
      return [selectionStart];
    }

    const stepR = dr === 0 ? 0 : dr / absDr;
    const stepC = dc === 0 ? 0 : dc / absDc;
    const steps = Math.max(absDr, absDc);

    const line: { r: number; c: number }[] = [];
    for (let i = 0; i <= steps; i++) {
      line.push({
        r: selectionStart.r + stepR * i,
        c: selectionStart.c + stepC * i,
      });
    }
    return line;
  }, [selectionStart, selectionEnd]);

  // Evaluate selected word
  const checkSelection = useCallback(() => {
    if (currentSelectionLine.length < 2) {
      setSelectionStart(null);
      setSelectionEnd(null);
      setIsSelecting(false);
      return;
    }

    const forwardWord = currentSelectionLine
      .map((pt) => gridData.grid[pt.r]?.[pt.c] || '')
      .join('');
    const backwardWord = forwardWord.split('').reverse().join('');

    const match = gridData.placedWords.find(
      (pw) =>
        (!foundWords.includes(pw.word) && pw.word === forwardWord) ||
        (!foundWords.includes(pw.word) && pw.word === backwardWord)
    );

    if (match) {
      setFoundWords((prev) => [...prev, match.word]);
      setHintCoords(null);
    }

    setSelectionStart(null);
    setSelectionEnd(null);
    setIsSelecting(false);
  }, [currentSelectionLine, gridData, foundWords]);

  // Cell interaction handlers
  const handleCellMouseDown = (r: number, c: number) => {
    setIsSelecting(true);
    setSelectionStart({ r, c });
    setSelectionEnd({ r, c });
  };

  const handleCellMouseEnter = (r: number, c: number) => {
    if (isSelecting) {
      setSelectionEnd({ r, c });
    }
  };

  const handleCellMouseUp = () => {
    if (isSelecting) {
      checkSelection();
    }
  };

  // Touch handlers for mobile
  const handleTouchStart = (r: number, c: number) => {
    if (!selectionStart) {
      setSelectionStart({ r, c });
      setSelectionEnd({ r, c });
      setIsSelecting(true);
    } else {
      // Tap-tap mode (tap first letter, tap last letter)
      setSelectionEnd({ r, c });
      setTimeout(() => {
        checkSelection();
      }, 50);
    }
  };

  // Provide hint
  const handleGiveHint = () => {
    const unFound = gridData.placedWords.find((pw) => !foundWords.includes(pw.word));
    if (unFound && unFound.coords.length > 0) {
      setHintCoords(unFound.coords[0]);
      setTimeout(() => {
        setHintCoords(null);
      }, 3500);
    }
  };

  // Lookup if a cell is in found word
  const getCellFoundStyle = (r: number, c: number) => {
    for (const pw of gridData.placedWords) {
      if (foundWords.includes(pw.word)) {
        const hasPoint = pw.coords.some((pt) => pt.r === r && pt.c === c);
        if (hasPoint) {
          return pw.color;
        }
      }
    }
    return null;
  };

  return (
    <div
      className="space-y-4 select-none"
      onMouseUp={handleCellMouseUp}
      onTouchEnd={() => {
        if (isSelecting && selectionStart && selectionEnd) {
          checkSelection();
        }
      }}
    >
      {/* Game Header Bar */}
      <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-[#20181D] border border-[#F2E8E4] dark:border-[#3D2F36] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-rose-500 to-amber-400 text-white flex items-center justify-center font-bold text-lg shadow-xs shrink-0">
            🔍
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-serif font-bold text-lg text-[#2D2327] dark:text-[#FAF4F0]">
                Caça-Palavras Interativo
              </h3>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-50 dark:bg-rose-950 text-[#E07A8B] font-bold border border-rose-200/80 dark:border-rose-900/60">
                Solo & Nerd
              </span>
            </div>
            <p className="text-xs text-[#7D6F74] dark:text-[#B8A8AF]">
              Arraste ou toque na primeira e última letra para encontrar as palavras escondidas!
            </p>
          </div>
        </div>

        {/* Stats & Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 text-xs font-mono font-semibold text-[#2D2327] dark:text-[#FAF4F0]">
            <Clock className="w-3.5 h-3.5 text-[#E07A8B]" />
            <span>{formatTime(seconds)}</span>
          </div>

          <button
            type="button"
            onClick={handleGiveHint}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-800 text-xs font-semibold text-amber-700 dark:text-amber-300 hover:bg-amber-100 transition-colors cursor-pointer"
            title="Mostrar primeira letra de uma palavra pendente"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Dica</span>
          </button>

          <button
            type="button"
            onClick={() => startNewGame(selectedThemeId)}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 text-xs font-semibold text-[#E07A8B] hover:bg-rose-100 transition-colors cursor-pointer"
            title="Gerar nova grade com as mesmas palavras"
          >
            <Shuffle className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Embaralhar</span>
          </button>
        </div>
      </div>

      {/* Theme Selector Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {THEMES.map((th) => {
          const isSelected = th.id === selectedThemeId;
          return (
            <button
              key={th.id}
              type="button"
              onClick={() => setSelectedThemeId(th.id)}
              className={`p-3 rounded-2xl text-left transition-all border cursor-pointer ${
                isSelected
                  ? 'bg-rose-50/80 dark:bg-rose-950/50 border-[#E07A8B] shadow-2xs'
                  : 'bg-white dark:bg-[#20181D] border-[#F2E8E4] dark:border-[#3D2F36] hover:bg-zinc-50 dark:hover:bg-zinc-800/40'
              }`}
            >
              <div className="text-xl mb-1">{th.icon}</div>
              <div className="font-semibold text-xs text-[#2D2327] dark:text-[#FAF4F0] line-clamp-1">
                {th.name}
              </div>
              <div className="text-[10px] text-[#7D6F74] dark:text-[#B8A8AF] line-clamp-1">
                {th.words.length} palavras
              </div>
            </button>
          );
        })}
      </div>

      {/* Main Board & Words Checklist */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left 2 Cols: The 10x10 Word Search Grid */}
        <div className="lg:col-span-2 p-3 sm:p-5 rounded-3xl bg-white dark:bg-[#20181D] border border-[#F2E8E4] dark:border-[#3D2F36] shadow-xs flex flex-col items-center justify-center">
          <div className="w-full max-w-[420px] aspect-square grid grid-cols-10 gap-1 sm:gap-1.5 p-1 rounded-2xl bg-zinc-50 dark:bg-[#1A1217] border border-zinc-200 dark:border-zinc-800">
            {gridData.grid.map((row, r) =>
              row.map((letter, c) => {
                const isSelectedInLine = currentSelectionLine.some(
                  (pt) => pt.r === r && pt.c === c
                );
                const foundStyle = getCellFoundStyle(r, c);
                const isHint = hintCoords?.r === r && hintCoords?.c === c;

                return (
                  <button
                    key={`${r}-${c}`}
                    type="button"
                    onMouseDown={() => handleCellMouseDown(r, c)}
                    onMouseEnter={() => handleCellMouseEnter(r, c)}
                    onTouchStart={() => handleTouchStart(r, c)}
                    className={`aspect-square flex items-center justify-center rounded-lg sm:rounded-xl text-xs sm:text-base font-bold select-none cursor-pointer transition-colors border ${
                      isHint
                        ? 'bg-amber-400 text-zinc-900 animate-bounce border-amber-600 ring-2 ring-amber-400'
                        : isSelectedInLine
                        ? 'bg-[#E07A8B] text-white border-rose-600 scale-105 shadow-xs'
                        : foundStyle
                        ? `${foundStyle}`
                        : 'bg-white dark:bg-[#241C21] text-[#2D2327] dark:text-[#FAF4F0] border-zinc-100 dark:border-zinc-800/80 hover:bg-rose-50/60 dark:hover:bg-rose-950/30'
                    }`}
                  >
                    {letter}
                  </button>
                );
              })
            )}
          </div>

          <p className="text-[11px] text-[#7D6F74] dark:text-[#B8A8AF] mt-3 text-center">
            💡 Dica: No celular, toque na primeira letra e depois toque na última letra da palavra!
          </p>
        </div>

        {/* Right Col: Words List & Progress */}
        <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-[#20181D] border border-[#F2E8E4] dark:border-[#3D2F36] shadow-xs flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-[#F2E8E4] dark:border-[#3D2F36]">
              <div>
                <span className="text-xs font-semibold text-[#7D6F74] dark:text-[#B8A8AF] block">
                  Progresso do Desafio
                </span>
                <h4 className="font-serif font-bold text-base text-[#2D2327] dark:text-[#FAF4F0]">
                  {foundWords.length} de {gridData.placedWords.length} Palavras
                </h4>
              </div>
              <div className="w-10 h-10 rounded-full bg-rose-50 dark:bg-rose-950/60 text-[#E07A8B] font-bold text-xs flex items-center justify-center border border-rose-200 dark:border-rose-900">
                {gridData.placedWords.length > 0
                  ? `${Math.round((foundWords.length / gridData.placedWords.length) * 100)}%`
                  : '0%'}
              </div>
            </div>

            {/* Words Badge List */}
            <div className="grid grid-cols-2 gap-2 mt-3.5">
              {gridData.placedWords.map((pw) => {
                const isFound = foundWords.includes(pw.word);
                return (
                  <div
                    key={pw.word}
                    className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-between transition-all border ${
                      isFound
                        ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-300 line-through opacity-80'
                        : 'bg-[#FAF8F5] dark:bg-[#261E23] text-[#2D2327] dark:text-[#FAF4F0] border-[#F2E8E4] dark:border-[#3D2F36]'
                    }`}
                  >
                    <span>{pw.word}</span>
                    {isFound ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 ml-1" />
                    ) : (
                      <span className="text-[10px] text-[#7D6F74] dark:text-[#B8A8AF]">
                        {pw.word.length}L
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick theme note */}
          <div className="p-3 rounded-2xl bg-rose-50/50 dark:bg-rose-950/30 border border-rose-200/60 dark:border-rose-900/40 text-[11px] text-[#7D6F74] dark:text-[#B8A8AF] space-y-1">
            <span className="font-semibold text-[#E07A8B] block">
              {currentTheme.icon} {currentTheme.name}
            </span>
            <p>{currentTheme.description}</p>
          </div>
        </div>
      </div>

      {/* Victory Modal */}
      {hasWon && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white dark:bg-[#241C21] rounded-3xl max-w-sm w-full p-6 border border-rose-300 dark:border-rose-900 shadow-2xl text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-amber-400 to-rose-400 text-white flex items-center justify-center text-3xl mx-auto shadow-md">
              🏆
            </div>
            <div>
              <h3 className="font-serif font-bold text-xl text-[#2D2327] dark:text-[#FAF4F0]">
                Parabéns, Nerd Fofa! 🎉
              </h3>
              <p className="text-xs text-[#7D6F74] dark:text-[#B8A8AF] mt-1">
                Você encontrou todas as {gridData.placedWords.length} palavras de{' '}
                <strong>{currentTheme.name}</strong> em <strong>{formatTime(seconds)}</strong>!
              </p>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  const nextIndex =
                    (THEMES.findIndex((t) => t.id === selectedThemeId) + 1) % THEMES.length;
                  setSelectedThemeId(THEMES[nextIndex].id);
                }}
                className="flex-1 py-2.5 rounded-2xl bg-[#E07A8B] hover:bg-[#d66a7c] text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
              >
                Próximo Tema ✨
              </button>
              <button
                type="button"
                onClick={() => startNewGame(selectedThemeId)}
                className="px-4 py-2.5 rounded-2xl border border-[#F2E8E4] dark:border-[#3D2F36] text-[#7D6F74] dark:text-[#B8A8AF] hover:bg-zinc-100 dark:hover:bg-zinc-800 text-xs font-semibold transition-colors cursor-pointer"
              >
                Jogar Novamente
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
