import React, { useState, useEffect, useCallback } from 'react';
import {
  RotateCcw,
  Sparkles,
  Trophy,
  Lightbulb,
  Eraser,
  PenTool,
  Play,
  Pause,
  ArrowLeft,
  CheckCircle2,
  Heart,
  Volume2,
  VolumeX,
} from 'lucide-react';

// Difficulty type
export type SudokuDifficulty = 'facil' | 'medio' | 'dificil';

// Board representation: 9x9 grid
// 0 means empty cell
interface SudokuPuzzle {
  id: string;
  difficulty: SudokuDifficulty;
  initial: number[][];
  solution: number[][];
}

// Hand-curated valid Sudoku boards with verified unique solutions
const SUDOKU_PUZZLES: SudokuPuzzle[] = [
  // FÁCIL 1
  {
    id: 'f1',
    difficulty: 'facil',
    initial: [
      [5, 3, 0, 0, 7, 0, 0, 0, 0],
      [6, 0, 0, 1, 9, 5, 0, 0, 0],
      [0, 9, 8, 0, 0, 0, 0, 6, 0],
      [8, 0, 0, 0, 6, 0, 0, 0, 3],
      [4, 0, 0, 8, 0, 3, 0, 0, 1],
      [7, 0, 0, 0, 2, 0, 0, 0, 6],
      [0, 6, 0, 0, 0, 0, 2, 8, 0],
      [0, 0, 0, 4, 1, 9, 0, 0, 5],
      [0, 0, 0, 0, 8, 0, 0, 7, 9],
    ],
    solution: [
      [5, 3, 4, 6, 7, 8, 9, 1, 2],
      [6, 7, 2, 1, 9, 5, 3, 4, 8],
      [1, 9, 8, 3, 4, 2, 5, 6, 7],
      [8, 5, 9, 7, 6, 1, 4, 2, 3],
      [4, 2, 6, 8, 5, 3, 7, 9, 1],
      [7, 1, 3, 9, 2, 4, 8, 5, 6],
      [9, 6, 1, 5, 3, 7, 2, 8, 4],
      [2, 8, 7, 4, 1, 9, 6, 3, 5],
      [3, 4, 5, 2, 8, 6, 1, 7, 9],
    ],
  },
  // FÁCIL 2
  {
    id: 'f2',
    difficulty: 'facil',
    initial: [
      [0, 0, 0, 2, 6, 0, 7, 0, 1],
      [6, 8, 0, 0, 7, 0, 0, 9, 0],
      [1, 9, 0, 0, 0, 4, 5, 0, 0],
      [8, 2, 0, 1, 0, 0, 0, 4, 0],
      [0, 0, 4, 6, 0, 2, 9, 0, 0],
      [0, 5, 0, 0, 0, 3, 0, 2, 8],
      [0, 0, 9, 3, 0, 0, 0, 7, 4],
      [0, 4, 0, 0, 5, 0, 0, 3, 6],
      [7, 0, 3, 0, 1, 8, 0, 0, 0],
    ],
    solution: [
      [4, 3, 5, 2, 6, 9, 7, 8, 1],
      [6, 8, 2, 5, 7, 1, 4, 9, 3],
      [1, 9, 7, 8, 3, 4, 5, 6, 2],
      [8, 2, 6, 1, 9, 5, 3, 4, 7],
      [3, 7, 4, 6, 8, 2, 9, 1, 5],
      [9, 5, 1, 7, 4, 3, 6, 2, 8],
      [5, 1, 9, 3, 2, 6, 8, 7, 4],
      [2, 4, 8, 9, 5, 7, 1, 3, 6],
      [7, 6, 3, 4, 1, 8, 2, 5, 9],
    ],
  },
  // MÉDIO 1
  {
    id: 'm1',
    difficulty: 'medio',
    initial: [
      [0, 2, 0, 6, 0, 8, 0, 0, 0],
      [5, 8, 0, 0, 0, 9, 7, 0, 0],
      [0, 0, 0, 0, 4, 0, 0, 0, 0],
      [3, 7, 0, 0, 0, 0, 5, 0, 0],
      [6, 0, 0, 0, 0, 0, 0, 0, 4],
      [0, 0, 8, 0, 0, 0, 0, 1, 3],
      [0, 0, 0, 0, 2, 0, 0, 0, 0],
      [0, 0, 9, 8, 0, 0, 0, 3, 6],
      [0, 0, 0, 3, 0, 6, 0, 9, 0],
    ],
    solution: [
      [1, 2, 3, 6, 7, 8, 9, 4, 5],
      [5, 8, 4, 2, 3, 9, 7, 6, 1],
      [9, 6, 7, 1, 4, 5, 3, 2, 8],
      [3, 7, 2, 4, 6, 1, 5, 8, 9],
      [6, 9, 1, 5, 8, 3, 2, 7, 4],
      [4, 5, 8, 7, 9, 2, 6, 1, 3],
      [8, 3, 6, 9, 2, 4, 1, 5, 7],
      [2, 1, 9, 8, 5, 7, 4, 3, 6],
      [7, 4, 5, 3, 1, 6, 8, 9, 2],
    ],
  },
  // MÉDIO 2
  {
    id: 'm2',
    difficulty: 'medio',
    initial: [
      [1, 0, 0, 4, 8, 9, 0, 0, 6],
      [7, 3, 0, 0, 0, 0, 0, 4, 0],
      [0, 0, 0, 0, 0, 1, 2, 9, 5],
      [0, 0, 7, 1, 2, 0, 6, 0, 0],
      [5, 0, 0, 7, 0, 3, 0, 0, 8],
      [0, 0, 6, 0, 9, 5, 7, 0, 0],
      [9, 1, 4, 6, 0, 0, 0, 0, 0],
      [0, 2, 0, 0, 0, 0, 0, 3, 7],
      [8, 0, 0, 5, 1, 2, 0, 0, 4],
    ],
    solution: [
      [1, 5, 2, 4, 8, 9, 3, 7, 6],
      [7, 3, 9, 2, 5, 6, 8, 4, 1],
      [4, 6, 8, 3, 7, 1, 2, 9, 5],
      [3, 8, 7, 1, 2, 4, 6, 5, 9],
      [5, 9, 1, 7, 6, 3, 4, 2, 8],
      [2, 4, 6, 8, 9, 5, 7, 1, 3],
      [9, 1, 4, 6, 3, 7, 5, 8, 2],
      [6, 2, 5, 9, 4, 8, 1, 3, 7],
      [8, 7, 3, 5, 1, 2, 9, 6, 4],
    ],
  },
  // DIFÍCIL 1
  {
    id: 'd1',
    difficulty: 'dificil',
    initial: [
      [0, 0, 0, 6, 0, 0, 4, 0, 0],
      [7, 0, 0, 0, 0, 3, 6, 0, 0],
      [0, 0, 0, 0, 9, 1, 0, 8, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 5, 0, 1, 8, 0, 0, 0, 3],
      [0, 0, 0, 3, 0, 6, 0, 4, 5],
      [0, 4, 0, 2, 0, 0, 0, 6, 0],
      [9, 0, 3, 0, 0, 0, 0, 0, 0],
      [0, 2, 0, 0, 0, 0, 1, 0, 0],
    ],
    solution: [
      [5, 8, 1, 6, 7, 2, 4, 3, 9],
      [7, 9, 2, 8, 4, 3, 6, 5, 1],
      [3, 6, 4, 5, 9, 1, 7, 8, 2],
      [4, 3, 8, 9, 5, 7, 2, 1, 6],
      [2, 5, 6, 1, 8, 4, 9, 7, 3],
      [1, 7, 9, 3, 2, 6, 8, 4, 5],
      [8, 4, 5, 2, 1, 9, 3, 6, 7],
      [9, 1, 3, 7, 6, 8, 5, 2, 4],
      [6, 2, 7, 4, 3, 5, 1, 9, 8],
    ],
  },
];

interface SudokuGameProps {
  onBack?: () => void;
}

export const SudokuGame: React.FC<SudokuGameProps> = ({ onBack }) => {
  const [difficulty, setDifficulty] = useState<SudokuDifficulty>('facil');
  const [currentPuzzle, setCurrentPuzzle] = useState<SudokuPuzzle>(SUDOKU_PUZZLES[0]);
  const [board, setBoard] = useState<number[][]>(() =>
    SUDOKU_PUZZLES[0].initial.map((row) => [...row])
  );
  // Notes: 9x9 set of numbers per cell
  const [notes, setNotes] = useState<Set<number>[][]>(() =>
    Array(9)
      .fill(null)
      .map(() =>
        Array(9)
          .fill(null)
          .map(() => new Set<number>())
      )
  );
  const [selectedCell, setSelectedCell] = useState<[number, number] | null>([0, 0]);
  const [isNoteMode, setIsNoteMode] = useState(false);
  const [history, setHistory] = useState<number[][][]>([]);
  const [errors, setErrors] = useState(0);
  const [secondsElapsed, setSecondsElapsed] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isWon, setIsWon] = useState(false);
  const [hintsRemaining, setHintsRemaining] = useState(3);

  // Load a puzzle based on difficulty
  const startNewGame = useCallback(
    (diff: SudokuDifficulty = difficulty) => {
      const candidates = SUDOKU_PUZZLES.filter((p) => p.difficulty === diff);
      const puzzle =
        candidates[Math.floor(Math.random() * candidates.length)] || SUDOKU_PUZZLES[0];
      setCurrentPuzzle(puzzle);
      setBoard(puzzle.initial.map((row) => [...row]));
      setNotes(
        Array(9)
          .fill(null)
          .map(() =>
            Array(9)
              .fill(null)
              .map(() => new Set<number>())
          )
      );
      setSelectedCell(null);
      setHistory([]);
      setErrors(0);
      setSecondsElapsed(0);
      setIsPaused(false);
      setIsWon(false);
      setHintsRemaining(3);
    },
    [difficulty]
  );

  useEffect(() => {
    startNewGame(difficulty);
  }, [difficulty, startNewGame]);

  // Timer
  useEffect(() => {
    if (isPaused || isWon) return;
    const interval = setInterval(() => {
      setSecondsElapsed((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isPaused, isWon]);

  // Check victory condition
  useEffect(() => {
    if (isWon) return;
    let filled = true;
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (board[r][c] === 0 || board[r][c] !== currentPuzzle.solution[r][c]) {
          filled = false;
          break;
        }
      }
      if (!filled) break;
    }
    if (filled) {
      setIsWon(true);
    }
  }, [board, currentPuzzle.solution, isWon]);

  // Handle cell entry
  const handleNumberInput = useCallback(
    (num: number) => {
      if (!selectedCell || isPaused || isWon) return;
      const [r, c] = selectedCell;

      // Cannot modify initial puzzle cells
      if (currentPuzzle.initial[r][c] !== 0) return;

      if (isNoteMode) {
        setNotes((prevNotes) => {
          const next = prevNotes.map((row, rIdx) =>
            row.map((cellSet, cIdx) => {
              if (rIdx === r && cIdx === c) {
                const newSet = new Set(cellSet);
                if (newSet.has(num)) {
                  newSet.delete(num);
                } else {
                  newSet.add(num);
                }
                return newSet;
              }
              return cellSet;
            })
          );
          return next;
        });
        return;
      }

      // Normal placement
      // If placed number is wrong, increment errors
      if (num !== 0 && num !== currentPuzzle.solution[r][c]) {
        setErrors((prev) => prev + 1);
      }

      // Save history
      setHistory((prev) => [...prev, board.map((row) => [...row])]);

      // Update board
      setBoard((prev) => {
        const next = prev.map((row) => [...row]);
        next[r][c] = num;
        return next;
      });

      // Clear notes in this cell, row, col, and block
      if (num !== 0) {
        setNotes((prevNotes) => {
          const startR = Math.floor(r / 3) * 3;
          const startC = Math.floor(c / 3) * 3;
          return prevNotes.map((row, rIdx) =>
            row.map((cellSet, cIdx) => {
              if (rIdx === r && cIdx === c) return new Set<number>();
              const sameRow = rIdx === r;
              const sameCol = cIdx === c;
              const sameBlock =
                rIdx >= startR && rIdx < startR + 3 && cIdx >= startC && cIdx < startC + 3;
              if (sameRow || sameCol || sameBlock) {
                const newSet = new Set(cellSet);
                newSet.delete(num);
                return newSet;
              }
              return cellSet;
            })
          );
        });
      }
    },
    [selectedCell, isPaused, isWon, currentPuzzle, isNoteMode, board]
  );

  // Keyboard navigation & inputs
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!selectedCell || isPaused || isWon) return;
      const [r, c] = selectedCell;

      if (e.key >= '1' && e.key <= '9') {
        handleNumberInput(parseInt(e.key, 10));
      } else if (e.key === 'Backspace' || e.key === 'Delete') {
        handleNumberInput(0);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedCell([Math.max(0, r - 1), c]);
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedCell([Math.min(8, r + 1), c]);
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        setSelectedCell([r, Math.max(0, c - 1)]);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        setSelectedCell([r, Math.min(8, c + 1)]);
      } else if (e.key.toLowerCase() === 'n') {
        setIsNoteMode((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedCell, isPaused, isWon, handleNumberInput]);

  // Undo
  const handleUndo = () => {
    if (history.length === 0) return;
    const previous = history[history.length - 1];
    setBoard(previous);
    setHistory((prev) => prev.slice(0, prev.length - 1));
  };

  // Hint
  const handleHint = () => {
    if (hintsRemaining <= 0 || !selectedCell || isWon) return;
    const [r, c] = selectedCell;
    if (currentPuzzle.initial[r][c] !== 0) return;

    const correctVal = currentPuzzle.solution[r][c];
    handleNumberInput(correctVal);
    setHintsRemaining((prev) => prev - 1);
  };

  // Format timer
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Check conflicts
  const isCellConflicted = (r: number, c: number, val: number): boolean => {
    if (val === 0) return false;
    // Row
    for (let col = 0; col < 9; col++) {
      if (col !== c && board[r][col] === val) return true;
    }
    // Col
    for (let row = 0; row < 9; row++) {
      if (row !== r && board[row][c] === val) return true;
    }
    // 3x3 block
    const startR = Math.floor(r / 3) * 3;
    const startC = Math.floor(c / 3) * 3;
    for (let row = startR; row < startR + 3; row++) {
      for (let col = startC; col < startC + 3; col++) {
        if ((row !== r || col !== c) && board[row][col] === val) return true;
      }
    }
    return false;
  };

  const selectedValue = selectedCell ? board[selectedCell[0]][selectedCell[1]] : null;

  return (
    <div className="space-y-4 max-w-2xl mx-auto select-none animate-in fade-in duration-200">
      {/* Top Controls Bar */}
      <div className="flex items-center justify-between gap-2 p-3.5 rounded-2xl bg-white dark:bg-[#20181D] border border-[#F2E8E4] dark:border-[#3D2F36] shadow-xs">
        <div className="flex items-center gap-2">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="p-1.5 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/40 text-[#7D6F74] dark:text-[#B8A8AF] hover:text-[#E07A8B] transition-colors cursor-pointer"
              title="Voltar aos jogos"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <div>
            <h2 className="font-serif font-bold text-base sm:text-lg text-[#2D2327] dark:text-[#FAF4F0] flex items-center gap-1.5">
              <span>Sudoku do Amor</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950/60 text-[#E07A8B] font-sans font-semibold">
                {difficulty === 'facil' ? 'Fácil' : difficulty === 'medio' ? 'Médio' : 'Difícil'}
              </span>
            </h2>
            <p className="text-[11px] text-[#7D6F74] dark:text-[#B8A8AF]">
              Exercite a mente pensando no nosso cantinho 💕
            </p>
          </div>
        </div>

        {/* Difficulty Switcher */}
        <div className="flex items-center gap-1 bg-[#FAF8F5] dark:bg-[#271E23] p-1 rounded-xl border border-[#F2E8E4] dark:border-[#3D2F36]">
          {(['facil', 'medio', 'dificil'] as SudokuDifficulty[]).map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => setDifficulty(d)}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold capitalize transition-all cursor-pointer ${
                difficulty === d
                  ? 'bg-[#E07A8B] text-white shadow-2xs'
                  : 'text-[#7D6F74] dark:text-[#B8A8AF] hover:text-[#2D2327] dark:hover:text-white'
              }`}
            >
              {d === 'facil' ? 'Fácil' : d === 'medio' ? 'Médio' : 'Difícil'}
            </button>
          ))}
        </div>
      </div>

      {/* Info Status Bar (Timer, Errors, Pause) */}
      <div className="flex items-center justify-between px-4 py-2 rounded-xl bg-rose-50/60 dark:bg-rose-950/30 border border-rose-100 dark:border-rose-900/30 text-xs">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 text-[#2D2327] dark:text-[#FAF4F0] font-medium">
            <button
              type="button"
              onClick={() => setIsPaused((p) => !p)}
              className="p-1 rounded-lg hover:bg-white/80 dark:hover:bg-black/30 transition-colors cursor-pointer"
              title={isPaused ? 'Continuar' : 'Pausar'}
            >
              {isPaused ? <Play className="w-4 h-4 text-emerald-600" /> : <Pause className="w-4 h-4 text-[#7D6F74]" />}
            </button>
            <span className="font-mono font-bold text-sm">{formatTime(secondsElapsed)}</span>
          </div>

          <div className="text-[11px] text-[#7D6F74] dark:text-[#B8A8AF]">
            Erros:{' '}
            <strong className={`font-semibold ${errors > 0 ? 'text-rose-500' : 'text-emerald-600'}`}>
              {errors}
            </strong>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => startNewGame(difficulty)}
            className="flex items-center gap-1 text-[11px] font-semibold text-[#7D6F74] dark:text-[#B8A8AF] hover:text-[#E07A8B] transition-colors cursor-pointer"
            title="Reiniciar este jogo"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Novo</span>
          </button>
        </div>
      </div>

      {/* The 9x9 Sudoku Board */}
      <div className="relative aspect-square max-w-[440px] mx-auto bg-white dark:bg-[#1C1418] rounded-2xl border-2 border-[#2D2327] dark:border-[#5A4550] shadow-md p-1 grid grid-cols-9 overflow-hidden">
        {/* Pause Overlay */}
        {isPaused && (
          <div className="absolute inset-0 z-20 bg-white/90 dark:bg-[#1C1418]/90 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center space-y-3">
            <Pause className="w-10 h-10 text-[#E07A8B] animate-pulse" />
            <h3 className="font-serif font-bold text-lg text-[#2D2327] dark:text-[#FAF4F0]">
              Jogo Pausado
            </h3>
            <p className="text-xs text-[#7D6F74] dark:text-[#B8A8AF]">
              Respire fundo e continue quando estiver pronta! 💕
            </p>
            <button
              type="button"
              onClick={() => setIsPaused(false)}
              className="px-5 py-2.5 rounded-xl bg-[#E07A8B] text-white text-xs font-semibold shadow-xs hover:bg-[#d66a7c] cursor-pointer"
            >
              Continuar Jogo
            </button>
          </div>
        )}

        {/* 81 Sudoku Cells */}
        {board.map((row, r) =>
          row.map((val, c) => {
            const isInitial = currentPuzzle.initial[r][c] !== 0;
            const isSelected = selectedCell?.[0] === r && selectedCell?.[1] === c;
            const isSameRowColBlock =
              selectedCell &&
              (selectedCell[0] === r ||
                selectedCell[1] === c ||
                (Math.floor(selectedCell[0] / 3) === Math.floor(r / 3) &&
                  Math.floor(selectedCell[1] / 3) === Math.floor(c / 3)));
            const isSameNumber = selectedValue !== null && selectedValue > 0 && val === selectedValue;
            const isConflict = isCellConflicted(r, c, val);
            const cellNotes = notes[r][c];

            // Thicker borders on 3x3 block dividers
            const borderRight = (c + 1) % 3 === 0 && c !== 8 ? 'border-r-2 border-r-[#2D2327] dark:border-r-[#5A4550]' : 'border-r border-r-[#EAE0E4] dark:border-r-[#382830]';
            const borderBottom = (r + 1) % 3 === 0 && r !== 8 ? 'border-b-2 border-b-[#2D2327] dark:border-b-[#5A4550]' : 'border-b border-b-[#EAE0E4] dark:border-b-[#382830]';

            return (
              <button
                key={`${r}-${c}`}
                type="button"
                onClick={() => setSelectedCell([r, c])}
                className={`aspect-square flex items-center justify-center relative select-none transition-colors cursor-pointer text-base sm:text-lg ${borderRight} ${borderBottom} ${
                  isSelected
                    ? 'bg-[#E07A8B] text-white font-bold ring-2 ring-[#E07A8B] z-10'
                    : isSameNumber
                    ? 'bg-rose-100/90 dark:bg-rose-950/70 font-bold text-[#E07A8B] dark:text-rose-300'
                    : isSameRowColBlock
                    ? 'bg-rose-50/40 dark:bg-rose-950/20'
                    : 'bg-transparent'
                } ${
                  isConflict && !isSelected
                    ? 'bg-red-100 dark:bg-red-950/70 text-red-600 dark:text-red-300 font-bold'
                    : ''
                }`}
              >
                {val !== 0 ? (
                  <span
                    className={`${
                      isInitial
                        ? 'font-bold text-[#2D2327] dark:text-[#FAF4F0]'
                        : isSelected
                        ? 'text-white'
                        : 'text-[#E07A8B] font-semibold'
                    }`}
                  >
                    {val}
                  </span>
                ) : cellNotes.size > 0 ? (
                  /* 3x3 Notes sub-grid */
                  <div className="grid grid-cols-3 w-full h-full p-0.5 text-[8px] leading-tight text-[#7D6F74] dark:text-[#A8989F] pointer-events-none">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
                      <span key={n} className="flex items-center justify-center font-sans font-medium">
                        {cellNotes.has(n) ? n : ''}
                      </span>
                    ))}
                  </div>
                ) : null}
              </button>
            );
          })
        )}
      </div>

      {/* Game Action Controls: Desfazer, Apagar, Rascunho, Dica */}
      <div className="grid grid-cols-4 gap-2 max-w-[440px] mx-auto">
        <button
          type="button"
          onClick={handleUndo}
          disabled={history.length === 0}
          className="flex flex-col items-center justify-center py-2.5 px-2 rounded-2xl bg-white dark:bg-[#20181D] border border-[#F2E8E4] dark:border-[#3D2F36] hover:bg-rose-50 dark:hover:bg-rose-950/40 disabled:opacity-40 text-xs font-semibold text-[#7D6F74] dark:text-[#B8A8AF] transition-colors cursor-pointer shadow-2xs"
        >
          <RotateCcw className="w-4 h-4 mb-1 text-[#E07A8B]" />
          <span>Desfazer</span>
        </button>

        <button
          type="button"
          onClick={() => handleNumberInput(0)}
          className="flex flex-col items-center justify-center py-2.5 px-2 rounded-2xl bg-white dark:bg-[#20181D] border border-[#F2E8E4] dark:border-[#3D2F36] hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs font-semibold text-[#7D6F74] dark:text-[#B8A8AF] transition-colors cursor-pointer shadow-2xs"
        >
          <Eraser className="w-4 h-4 mb-1 text-amber-500" />
          <span>Apagar</span>
        </button>

        <button
          type="button"
          onClick={() => setIsNoteMode((n) => !n)}
          className={`flex flex-col items-center justify-center py-2.5 px-2 rounded-2xl border text-xs font-semibold transition-all cursor-pointer shadow-2xs ${
            isNoteMode
              ? 'bg-[#E07A8B] text-white border-[#E07A8B]'
              : 'bg-white dark:bg-[#20181D] border-[#F2E8E4] dark:border-[#3D2F36] text-[#7D6F74] dark:text-[#B8A8AF] hover:bg-rose-50 dark:hover:bg-rose-950/40'
          }`}
        >
          <PenTool className="w-4 h-4 mb-1" />
          <span>Rascunho {isNoteMode ? 'ON' : 'OFF'}</span>
        </button>

        <button
          type="button"
          onClick={handleHint}
          disabled={hintsRemaining <= 0}
          className="flex flex-col items-center justify-center py-2.5 px-2 rounded-2xl bg-white dark:bg-[#20181D] border border-[#F2E8E4] dark:border-[#3D2F36] hover:bg-rose-50 dark:hover:bg-rose-950/40 disabled:opacity-40 text-xs font-semibold text-[#7D6F74] dark:text-[#B8A8AF] transition-colors cursor-pointer shadow-2xs relative"
        >
          <Lightbulb className="w-4 h-4 mb-1 text-amber-500" />
          <span>Dica ({hintsRemaining})</span>
        </button>
      </div>

      {/* Number Pad 1 to 9 */}
      <div className="grid grid-cols-9 gap-1 sm:gap-2 max-w-[440px] mx-auto">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => {
          // Count remaining of this number
          let count = 0;
          for (let r = 0; r < 9; r++) {
            for (let c = 0; c < 9; c++) {
              if (board[r][c] === num) count++;
            }
          }
          const isDone = count >= 9;

          return (
            <button
              key={num}
              type="button"
              onClick={() => handleNumberInput(num)}
              disabled={isDone}
              className={`aspect-square sm:aspect-auto sm:py-3.5 rounded-xl font-bold text-base sm:text-lg flex flex-col items-center justify-center transition-all cursor-pointer shadow-xs active:scale-95 ${
                isDone
                  ? 'bg-[#EAE0E4] dark:bg-[#2B2025] text-[#A6989F] opacity-40 cursor-not-allowed'
                  : 'bg-white dark:bg-[#241A20] text-[#2D2327] dark:text-[#FAF4F0] border border-[#F2E8E4] dark:border-[#3D2F36] hover:bg-rose-50 dark:hover:bg-rose-950/60 hover:border-[#E07A8B]'
              }`}
            >
              <span>{num}</span>
              <span className="text-[9px] font-normal text-[#A6989F] leading-none mt-0.5">
                {9 - count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Keyboard Shortcut Tip for PC */}
      <p className="text-center text-[11px] text-[#A6989F] dark:text-[#8D7F85] pt-1">
        💡 No PC, você pode usar os números <kbd className="px-1 rounded bg-black/5 dark:bg-white/10 font-mono">1-9</kbd>, as setas do teclado e a tecla <kbd className="px-1 rounded bg-black/5 dark:bg-white/10 font-mono">Delete</kbd>.
      </p>

      {/* Victory Modal */}
      {isWon && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in zoom-in-95">
          <div className="bg-white dark:bg-[#20181D] border border-rose-200 dark:border-rose-900/60 rounded-3xl p-6 max-w-sm w-full text-center space-y-4 shadow-2xl">
            <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-[#E07A8B] to-[#F4A6B3] text-white flex items-center justify-center mx-auto shadow-md animate-bounce">
              <Trophy className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <h3 className="font-serif font-bold text-xl text-[#2D2327] dark:text-[#FAF4F0]">
                Parabéns, meu amor! 🎉
              </h3>
              <p className="text-xs text-[#7D6F74] dark:text-[#B8A8AF]">
                Você completou o Sudoku com maestria!
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 p-3 rounded-2xl bg-rose-50/70 dark:bg-rose-950/40 text-xs">
              <div>
                <span className="text-[#7D6F74] dark:text-[#B8A8AF] block text-[10px]">Tempo</span>
                <strong className="font-mono text-[#E07A8B] text-sm">{formatTime(secondsElapsed)}</strong>
              </div>
              <div>
                <span className="text-[#7D6F74] dark:text-[#B8A8AF] block text-[10px]">Erros</span>
                <strong className="text-sm font-semibold text-[#2D2327] dark:text-[#FAF4F0]">{errors}</strong>
              </div>
            </div>

            <div className="p-2.5 rounded-2xl bg-[#FAF8F5] dark:bg-[#2A1E24] text-[11px] text-[#7D6F74] dark:text-[#B8A8AF] flex items-center justify-center gap-1.5">
              <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
              <span>A mente afiada pra gente cuidar do nosso lar juntas! 💕</span>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                type="button"
                onClick={() => startNewGame(difficulty)}
                className="py-2.5 rounded-xl bg-[#E07A8B] hover:bg-[#d66a7c] text-white text-xs font-semibold shadow-xs cursor-pointer"
              >
                Jogar Novamente
              </button>
              {onBack && (
                <button
                  type="button"
                  onClick={onBack}
                  className="py-2.5 rounded-xl bg-white dark:bg-[#271E23] border border-[#F2E8E4] dark:border-[#3D2F36] text-[#2D2327] dark:text-[#FAF4F0] text-xs font-semibold hover:bg-rose-50 cursor-pointer"
                >
                  Outros Jogos
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
