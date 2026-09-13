import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  RotateCcw,
  Trophy,
  Undo2,
  Sparkles,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Flame,
  Apple,
  Hash,
} from 'lucide-react';

const GRID_SIZE = 4;

type TileTheme = 'numbers' | 'fruits';

interface Tile {
  id: number;
  value: number;
  row: number;
  col: number;
  mergedInto?: boolean;
  isNew?: boolean;
}

const FRUIT_EMOJIS: Record<number, { emoji: string; name: string; color: string }> = {
  2: { emoji: '🍒', name: 'Cereja', color: 'bg-red-100 text-red-700 border-red-200' },
  4: { emoji: '🍓', name: 'Morango', color: 'bg-rose-100 text-rose-700 border-rose-200' },
  8: { emoji: '🍇', name: 'Uva', color: 'bg-purple-100 text-purple-700 border-purple-200' },
  16: { emoji: '🍊', name: 'Laranja', color: 'bg-orange-100 text-orange-700 border-orange-200' },
  32: { emoji: '🍋', name: 'Limão', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
  64: { emoji: '🍏', name: 'Maçã Verde', color: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
  128: { emoji: '🍑', name: 'Pêssego', color: 'bg-amber-100 text-amber-900 border-amber-300' },
  256: { emoji: '🍍', name: 'Abacaxi', color: 'bg-amber-200 text-amber-950 border-amber-400 font-bold' },
  512: { emoji: '🥥', name: 'Coco', color: 'bg-stone-200 text-stone-900 border-stone-400 font-bold' },
  1024: { emoji: '🍉', name: 'Melancia', color: 'bg-green-200 text-green-950 border-green-500 font-bold' },
  2048: { emoji: '👑', name: 'Coroa Dourada', color: 'bg-yellow-400 text-yellow-950 border-yellow-600 shadow-md font-extrabold' },
  4096: { emoji: '💎', name: 'Diamante', color: 'bg-cyan-300 text-cyan-950 border-cyan-500 shadow-lg font-extrabold' },
};

const NUMBER_COLORS: Record<number, string> = {
  2: 'bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-100 border-zinc-200 dark:border-zinc-700',
  4: 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-200 border-amber-200 dark:border-amber-800/50',
  8: 'bg-orange-100 dark:bg-orange-950/50 text-orange-800 dark:text-orange-200 border-orange-300 font-bold',
  16: 'bg-orange-200 dark:bg-orange-900/60 text-orange-900 dark:text-orange-100 border-orange-400 font-bold',
  32: 'bg-rose-200 dark:bg-rose-900/60 text-rose-900 dark:text-rose-100 border-rose-400 font-bold',
  64: 'bg-rose-300 dark:bg-rose-800/70 text-rose-950 dark:text-white border-rose-500 font-bold',
  128: 'bg-yellow-200 dark:bg-yellow-900/70 text-yellow-950 dark:text-yellow-100 border-yellow-400 font-extrabold shadow-xs',
  256: 'bg-yellow-300 dark:bg-yellow-800 text-yellow-950 dark:text-white border-yellow-500 font-extrabold shadow-xs',
  512: 'bg-yellow-400 dark:bg-yellow-700 text-yellow-950 dark:text-white border-yellow-600 font-extrabold shadow-sm',
  1024: 'bg-emerald-400 dark:bg-emerald-700 text-emerald-950 dark:text-white border-emerald-600 font-extrabold shadow-md',
  2048: 'bg-gradient-to-tr from-[#E07A8B] to-amber-400 text-white font-black shadow-lg animate-pulse',
  4096: 'bg-gradient-to-tr from-purple-600 to-indigo-600 text-white font-black shadow-xl',
};

let nextTileId = 1;

export const MergeGame: React.FC = () => {
  const [board, setBoard] = useState<(number | null)[][]>(() =>
    Array(GRID_SIZE)
      .fill(null)
      .map(() => Array(GRID_SIZE).fill(null))
  );

  const [score, setScore] = useState(0);
  const [bestScore, setBestScore] = useState<number>(() => {
    try {
      return parseInt(localStorage.getItem('nosso_merge_best') || '0', 10);
    } catch {
      return 0;
    }
  });

  const [history, setHistory] = useState<{ board: (number | null)[][]; score: number } | null>(null);
  const [isGameOver, setIsGameOver] = useState(false);
  const [hasWon, setHasWon] = useState(false);
  const [theme, setTheme] = useState<TileTheme>('fruits');

  // Add random tile (2 or 4) to empty spot
  const addRandomTile = useCallback((currentBoard: (number | null)[][]): (number | null)[][] => {
    const emptyCells: { r: number; c: number }[] = [];
    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        if (currentBoard[r][c] === null) {
          emptyCells.push({ r, c });
        }
      }
    }

    if (emptyCells.length === 0) return currentBoard;

    const randomIndex = Math.floor(Math.random() * emptyCells.length);
    const { r, c } = emptyCells[randomIndex];
    const newBoard = currentBoard.map((row) => [...row]);
    newBoard[r][c] = Math.random() < 0.9 ? 2 : 4;
    return newBoard;
  }, []);

  // Initialize board
  const initializeGame = useCallback(() => {
    let newBoard = Array(GRID_SIZE)
      .fill(null)
      .map(() => Array(GRID_SIZE).fill(null));
    newBoard = addRandomTile(newBoard);
    newBoard = addRandomTile(newBoard);
    setBoard(newBoard);
    setScore(0);
    setHistory(null);
    setIsGameOver(false);
    setHasWon(false);
  }, [addRandomTile]);

  useEffect(() => {
    initializeGame();
  }, [initializeGame]);

  // Check if any move is possible
  const checkGameOver = useCallback((b: (number | null)[][]): boolean => {
    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        if (b[r][c] === null) return false;
        if (c < GRID_SIZE - 1 && b[r][c] === b[r][c + 1]) return false;
        if (r < GRID_SIZE - 1 && b[r][c] === b[r + 1][c]) return false;
      }
    }
    return true;
  }, []);

  // Move tiles in direction
  const move = useCallback(
    (direction: 'up' | 'down' | 'left' | 'right') => {
      if (isGameOver) return;

      let moved = false;
      let pointsEarned = 0;
      let won = false;

      // Deep copy board
      const newBoard = board.map((row) => [...row]);

      const processLine = (line: (number | null)[]): (number | null)[] => {
        // Filter non-null
        const nonNull = line.filter((x): x is number => x !== null);
        const merged: (number | null)[] = [];

        for (let i = 0; i < nonNull.length; i++) {
          if (i < nonNull.length - 1 && nonNull[i] === nonNull[i + 1]) {
            const val = nonNull[i] * 2;
            merged.push(val);
            pointsEarned += val;
            if (val === 2048) won = true;
            i++; // skip next since it's merged
          } else {
            merged.push(nonNull[i]);
          }
        }

        while (merged.length < GRID_SIZE) {
          merged.push(null);
        }

        return merged;
      };

      if (direction === 'left') {
        for (let r = 0; r < GRID_SIZE; r++) {
          const processed = processLine(newBoard[r]);
          if (processed.some((val, idx) => val !== newBoard[r][idx])) {
            moved = true;
          }
          newBoard[r] = processed;
        }
      } else if (direction === 'right') {
        for (let r = 0; r < GRID_SIZE; r++) {
          const reversed = [...newBoard[r]].reverse();
          const processed = processLine(reversed).reverse();
          if (processed.some((val, idx) => val !== newBoard[r][idx])) {
            moved = true;
          }
          newBoard[r] = processed;
        }
      } else if (direction === 'up') {
        for (let c = 0; c < GRID_SIZE; c++) {
          const col = [newBoard[0][c], newBoard[1][c], newBoard[2][c], newBoard[3][c]];
          const processed = processLine(col);
          for (let r = 0; r < GRID_SIZE; r++) {
            if (newBoard[r][c] !== processed[r]) moved = true;
            newBoard[r][c] = processed[r];
          }
        }
      } else if (direction === 'down') {
        for (let c = 0; c < GRID_SIZE; c++) {
          const col = [newBoard[3][c], newBoard[2][c], newBoard[1][c], newBoard[0][c]];
          const processed = processLine(col).reverse();
          for (let r = 0; r < GRID_SIZE; r++) {
            if (newBoard[r][c] !== processed[r]) moved = true;
            newBoard[r][c] = processed[r];
          }
        }
      }

      if (moved) {
        // Save history for undo
        setHistory({ board: board.map((r) => [...r]), score });

        const withNewTile = addRandomTile(newBoard);
        setBoard(withNewTile);

        setScore((prev) => {
          const nextScore = prev + pointsEarned;
          if (nextScore > bestScore) {
            setBestScore(nextScore);
            try {
              localStorage.setItem('nosso_merge_best', String(nextScore));
            } catch {}
          }
          return nextScore;
        });

        if (won && !hasWon) {
          setHasWon(true);
        }

        if (checkGameOver(withNewTile)) {
          setIsGameOver(true);
        }
      }
    },
    [board, score, bestScore, isGameOver, hasWon, addRandomTile, checkGameOver]
  );

  // Undo move
  const handleUndo = () => {
    if (!history) return;
    setBoard(history.board);
    setScore(history.score);
    setHistory(null);
    setIsGameOver(false);
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
      }
      switch (e.key) {
        case 'ArrowLeft':
        case 'a':
        case 'A':
          move('left');
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          move('right');
          break;
        case 'ArrowUp':
        case 'w':
        case 'W':
          move('up');
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          move('down');
          break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [move]);

  // Touch Swipe gestures support
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStartRef.current) return;
    const touch = e.changedTouches[0];
    const dx = touch.clientX - touchStartRef.current.x;
    const dy = touch.clientY - touchStartRef.current.y;

    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);

    if (Math.max(absDx, absDy) > 30) {
      if (absDx > absDy) {
        if (dx > 0) move('right');
        else move('left');
      } else {
        if (dy > 0) move('down');
        else move('up');
      }
    }
    touchStartRef.current = null;
  };

  return (
    <div className="flex flex-col items-center justify-center p-2 sm:p-4 max-w-lg mx-auto select-none">
      {/* Top Header Card */}
      <div className="w-full flex items-center justify-between gap-3 mb-4 bg-white dark:bg-[#241C21] p-3 sm:p-4 rounded-2xl border border-[#F2E8E4] dark:border-[#3D2F36] shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-400 to-orange-500 flex items-center justify-center text-white shadow-xs">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-serif font-bold text-lg text-[#2D2327] dark:text-[#FAF4F0]">
              Merge das Frutas & 2048
            </h2>
            <p className="text-xs text-[#7D6F74] dark:text-[#B8A8AF]">
              Junte itens iguais para evoluir até a Coroa Dourada!
            </p>
          </div>
        </div>

        {/* Theme Switcher Button */}
        <div className="flex items-center gap-1.5 p-1 bg-zinc-100 dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700">
          <button
            onClick={() => setTheme('fruits')}
            className={`p-1.5 rounded-lg text-xs font-semibold transition-all ${
              theme === 'fruits'
                ? 'bg-white dark:bg-[#2D2228] text-rose-500 shadow-xs'
                : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
            }`}
            title="Tema Frutas Fofas"
          >
            <Apple className="w-4 h-4" />
          </button>
          <button
            onClick={() => setTheme('numbers')}
            className={`p-1.5 rounded-lg text-xs font-semibold transition-all ${
              theme === 'numbers'
                ? 'bg-white dark:bg-[#2D2228] text-[#E07A8B] shadow-xs'
                : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
            }`}
            title="Tema Números Clássico 2048"
          >
            <Hash className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Action Bar (Scores, Undo, Reset) */}
      <div className="w-full flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <div className="px-3.5 py-1.5 rounded-xl bg-white dark:bg-[#241C21] border border-[#F2E8E4] dark:border-[#3D2F36] shadow-2xs">
            <span className="text-[10px] font-bold uppercase text-[#7D6F74] dark:text-[#B8A8AF] block leading-none">
              Pontuação
            </span>
            <span className="text-base font-bold font-mono text-[#2D2327] dark:text-[#FAF4F0]">
              {score}
            </span>
          </div>

          <div className="px-3.5 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/40 shadow-2xs">
            <span className="text-[10px] font-bold uppercase text-amber-600 dark:text-amber-400 block leading-none">
              Melhor 🏆
            </span>
            <span className="text-base font-bold font-mono text-amber-600 dark:text-amber-400">
              {bestScore}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={handleUndo}
            disabled={!history}
            className="flex items-center gap-1 px-3 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 disabled:opacity-40 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-xs font-semibold text-[#2D2327] dark:text-[#FAF4F0] transition-colors"
            title="Desfazer último movimento"
          >
            <Undo2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Desfazer</span>
          </button>

          <button
            onClick={initializeGame}
            className="flex items-center gap-1 px-3 py-2 rounded-xl bg-[#E07A8B] hover:bg-[#d66a7c] text-xs font-semibold text-white shadow-2xs transition-colors"
            title="Novo Jogo"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Novo</span>
          </button>
        </div>
      </div>

      {/* 2048 / Merge Board */}
      <div
        className="relative w-full aspect-square max-w-[360px] p-3 bg-zinc-200 dark:bg-zinc-900 rounded-3xl border-4 border-[#2D2327] dark:border-[#3D2F36] shadow-xl touch-none"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <div className="grid grid-cols-4 grid-rows-4 gap-2.5 w-full h-full">
          {board.map((row, r) =>
            row.map((cell, c) => {
              const fruitInfo = cell ? FRUIT_EMOJIS[cell] : null;
              const numberClass = cell ? NUMBER_COLORS[cell] || 'bg-purple-600 text-white font-black' : '';

              return (
                <div
                  key={`${r}-${c}`}
                  className={`relative w-full h-full rounded-2xl flex flex-col items-center justify-center transition-all duration-150 select-none ${
                    cell === null
                      ? 'bg-zinc-100/70 dark:bg-[#1C1518]/60 border border-zinc-200/50 dark:border-zinc-800/50'
                      : theme === 'fruits' && fruitInfo
                      ? `${fruitInfo.color} border shadow-xs scale-100 animate-in zoom-in-75`
                      : `${numberClass} border shadow-xs scale-100 animate-in zoom-in-75`
                  }`}
                >
                  {cell !== null && (
                    <>
                      {theme === 'fruits' && fruitInfo ? (
                        <div className="flex flex-col items-center justify-center">
                          <span className="text-2xl sm:text-3xl filter drop-shadow-xs">
                            {fruitInfo.emoji}
                          </span>
                          <span className="text-[9px] font-bold font-mono opacity-80 mt-0.5">
                            {cell}
                          </span>
                        </div>
                      ) : (
                        <span
                          className={`font-mono font-black ${
                            cell >= 1024
                              ? 'text-lg sm:text-xl'
                              : cell >= 128
                              ? 'text-xl sm:text-2xl'
                              : 'text-2xl sm:text-3xl'
                          }`}
                        >
                          {cell}
                        </span>
                      )}
                    </>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Win Alert Banner */}
        {hasWon && !isGameOver && (
          <div className="absolute top-4 left-4 right-4 p-2.5 rounded-2xl bg-gradient-to-r from-amber-400 to-yellow-500 text-zinc-950 font-bold text-xs text-center shadow-lg animate-bounce flex items-center justify-center gap-1.5">
            <Trophy className="w-4 h-4 text-white" />
            <span>Parabéns! Você alcançou a Coroa 2048! Pode continuar jogando!</span>
          </div>
        )}

        {/* Game Over Overlay */}
        {isGameOver && (
          <div className="absolute inset-0 bg-black/80 backdrop-blur-xs flex flex-col items-center justify-center rounded-3xl z-10 text-white space-y-3 p-4 text-center">
            <Trophy className="w-12 h-12 text-yellow-400" />
            <p className="font-serif font-bold text-2xl text-rose-400">Sem Movimentos!</p>
            <div className="text-xs space-y-1 text-zinc-300">
              <p>Pontuação final: <strong className="text-white text-base font-mono">{score}</strong></p>
              {score >= bestScore && score > 0 && (
                <p className="text-amber-300 font-bold">✨ Novo Recorde no Merge!</p>
              )}
            </div>
            <button
              onClick={initializeGame}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#E07A8B] to-rose-500 hover:from-[#d66a7c] hover:to-rose-600 text-white font-bold text-sm transition-all shadow-lg"
            >
              Jogar Novamente
            </button>
          </div>
        )}
      </div>

      {/* Directional Pad for Mobile & Clicks */}
      <div className="w-full max-w-[280px] mt-4 flex flex-col items-center gap-1.5">
        <button
          onClick={() => move('up')}
          className="w-12 h-10 rounded-xl bg-white dark:bg-[#241C21] border border-[#F2E8E4] dark:border-[#3D2F36] active:bg-[#E07A8B] active:text-white flex items-center justify-center font-bold text-zinc-700 dark:text-zinc-200 shadow-2xs"
          aria-label="Cima"
        >
          <ArrowUp className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-3">
          <button
            onClick={() => move('left')}
            className="w-12 h-10 rounded-xl bg-white dark:bg-[#241C21] border border-[#F2E8E4] dark:border-[#3D2F36] active:bg-[#E07A8B] active:text-white flex items-center justify-center font-bold text-zinc-700 dark:text-zinc-200 shadow-2xs"
            aria-label="Esquerda"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <button
            onClick={() => move('down')}
            className="w-12 h-10 rounded-xl bg-white dark:bg-[#241C21] border border-[#F2E8E4] dark:border-[#3D2F36] active:bg-[#E07A8B] active:text-white flex items-center justify-center font-bold text-zinc-700 dark:text-zinc-200 shadow-2xs"
            aria-label="Baixo"
          >
            <ArrowDown className="w-5 h-5" />
          </button>
          <button
            onClick={() => move('right')}
            className="w-12 h-10 rounded-xl bg-white dark:bg-[#241C21] border border-[#F2E8E4] dark:border-[#3D2F36] active:bg-[#E07A8B] active:text-white flex items-center justify-center font-bold text-zinc-700 dark:text-zinc-200 shadow-2xs"
            aria-label="Direita"
          >
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
        <p className="text-[10px] text-center text-[#7D6F74] dark:text-[#B8A8AF] mt-1">
          Dica: deslize o dedo na tela ou use as setas do teclado para juntar os itens!
        </p>
      </div>
    </div>
  );
};
