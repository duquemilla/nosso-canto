import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Trophy,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  RotateCw,
  Zap,
  Volume2,
  VolumeX,
} from 'lucide-react';

const BOARD_WIDTH = 10;
const BOARD_HEIGHT = 20;

type TetrominoType = 'I' | 'J' | 'L' | 'O' | 'S' | 'T' | 'Z';

interface Piece {
  type: TetrominoType;
  matrix: number[][];
  x: number;
  y: number;
  color: string;
}

const TETROMINOES: Record<TetrominoType, { shape: number[][]; color: string }> = {
  I: {
    shape: [
      [0, 0, 0, 0],
      [1, 1, 1, 1],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ],
    color: 'bg-cyan-500 shadow-cyan-500/50 border-cyan-300',
  },
  J: {
    shape: [
      [1, 0, 0],
      [1, 1, 1],
      [0, 0, 0],
    ],
    color: 'bg-blue-600 shadow-blue-500/50 border-blue-400',
  },
  L: {
    shape: [
      [0, 0, 1],
      [1, 1, 1],
      [0, 0, 0],
    ],
    color: 'bg-amber-500 shadow-amber-500/50 border-amber-300',
  },
  O: {
    shape: [
      [1, 1],
      [1, 1],
    ],
    color: 'bg-yellow-400 shadow-yellow-400/50 border-yellow-200',
  },
  S: {
    shape: [
      [0, 1, 1],
      [1, 1, 0],
      [0, 0, 0],
    ],
    color: 'bg-emerald-500 shadow-emerald-500/50 border-emerald-300',
  },
  T: {
    shape: [
      [0, 1, 0],
      [1, 1, 1],
      [0, 0, 0],
    ],
    color: 'bg-purple-500 shadow-purple-500/50 border-purple-300',
  },
  Z: {
    shape: [
      [1, 1, 0],
      [0, 1, 1],
      [0, 0, 0],
    ],
    color: 'bg-rose-500 shadow-rose-500/50 border-rose-300',
  },
};

const TETROMINO_KEYS: TetrominoType[] = ['I', 'J', 'L', 'O', 'S', 'T', 'Z'];

function getRandomTetromino(): Piece {
  const type = TETROMINO_KEYS[Math.floor(Math.random() * TETROMINO_KEYS.length)];
  const def = TETROMINOES[type];
  const matrix = def.shape.map((row) => [...row]);
  const x = Math.floor((BOARD_WIDTH - matrix[0].length) / 2);
  const y = type === 'I' ? -1 : 0;
  return { type, matrix, x, y, color: def.color };
}

function rotateMatrix(matrix: number[][]): number[][] {
  const rows = matrix.length;
  const cols = matrix[0].length;
  const rotated: number[][] = [];
  for (let c = 0; c < cols; c++) {
    const newRow: number[] = [];
    for (let r = rows - 1; r >= 0; r--) {
      newRow.push(matrix[r][c]);
    }
    rotated.push(newRow);
  }
  return rotated;
}

export const TetrisGame: React.FC = () => {
  const [board, setBoard] = useState<(string | null)[][]>(() =>
    Array(BOARD_HEIGHT)
      .fill(null)
      .map(() => Array(BOARD_WIDTH).fill(null))
  );

  const [currentPiece, setCurrentPiece] = useState<Piece | null>(() => getRandomTetromino());
  const [nextPiece, setNextPiece] = useState<Piece | null>(() => getRandomTetromino());
  const [holdPiece, setHoldPiece] = useState<TetrominoType | null>(null);
  const [canHold, setCanHold] = useState(true);

  const [score, setScore] = useState(0);
  const [linesCleared, setLinesCleared] = useState(0);
  const [level, setLevel] = useState(1);
  const [highScore, setHighScore] = useState<number>(() => {
    try {
      return parseInt(localStorage.getItem('nosso_tetris_high') || '0', 10);
    } catch {
      return 0;
    }
  });

  const [isGameOver, setIsGameOver] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  // Sound effects with web audio api
  const playTone = useCallback(
    (freq: number, type: OscillatorType = 'sine', duration: number = 0.1) => {
      if (isMuted) return;
      try {
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
        gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + duration);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + duration);
      } catch {
        // Audio error ignored
      }
    },
    [isMuted]
  );

  // Collision detection
  const checkCollision = useCallback(
    (piece: Piece, b: (string | null)[][], offX = 0, offY = 0): boolean => {
      for (let r = 0; r < piece.matrix.length; r++) {
        for (let c = 0; c < piece.matrix[r].length; c++) {
          if (piece.matrix[r][c] !== 0) {
            const newX = piece.x + c + offX;
            const newY = piece.y + r + offY;

            if (newX < 0 || newX >= BOARD_WIDTH || newY >= BOARD_HEIGHT) {
              return true;
            }
            if (newY >= 0 && b[newY][newX] !== null) {
              return true;
            }
          }
        }
      }
      return false;
    },
    []
  );

  // Ghost piece calculation
  const getGhostY = useCallback((): number => {
    if (!currentPiece) return 0;
    let ghostY = currentPiece.y;
    while (!checkCollision(currentPiece, board, 0, ghostY - currentPiece.y + 1)) {
      ghostY++;
    }
    return ghostY;
  }, [currentPiece, board, checkCollision]);

  // Lock piece and clear lines
  const lockPiece = useCallback(
    (piece: Piece) => {
      setBoard((prevBoard) => {
        const newBoard = prevBoard.map((row) => [...row]);

        for (let r = 0; r < piece.matrix.length; r++) {
          for (let c = 0; c < piece.matrix[r].length; c++) {
            if (piece.matrix[r][c] !== 0) {
              const bY = piece.y + r;
              const bX = piece.x + c;
              if (bY >= 0 && bY < BOARD_HEIGHT && bX >= 0 && bX < BOARD_WIDTH) {
                newBoard[bY][bX] = piece.color;
              }
            }
          }
        }

        // Line clears
        let cleared = 0;
        const filteredBoard: (string | null)[][] = [];

        for (let r = 0; r < BOARD_HEIGHT; r++) {
          if (newBoard[r].every((cell) => cell !== null)) {
            cleared++;
          } else {
            filteredBoard.push(newBoard[r]);
          }
        }

        while (filteredBoard.length < BOARD_HEIGHT) {
          filteredBoard.unshift(Array(BOARD_WIDTH).fill(null));
        }

        if (cleared > 0) {
          playTone(440 + cleared * 120, 'triangle', 0.25);
          const pts = [0, 100, 300, 500, 800][cleared] * level;
          setScore((s) => {
            const newS = s + pts;
            if (newS > highScore) {
              setHighScore(newS);
              try {
                localStorage.setItem('nosso_tetris_high', String(newS));
              } catch {}
            }
            return newS;
          });
          setLinesCleared((l) => {
            const nextL = l + cleared;
            setLevel(Math.floor(nextL / 10) + 1);
            return nextL;
          });
        } else {
          playTone(220, 'sine', 0.08);
        }

        return filteredBoard;
      });

      // Spawn next piece
      const next = nextPiece || getRandomTetromino();
      const afterNext = getRandomTetromino();

      if (checkCollision(next, board)) {
        setIsGameOver(true);
        playTone(150, 'sawtooth', 0.5);
      } else {
        setCurrentPiece(next);
        setNextPiece(afterNext);
        setCanHold(true);
      }
    },
    [nextPiece, board, level, highScore, checkCollision, playTone]
  );

  // Drop down by 1
  const moveDown = useCallback(() => {
    if (!currentPiece || isGameOver || isPaused) return;

    if (!checkCollision(currentPiece, board, 0, 1)) {
      setCurrentPiece((p) => (p ? { ...p, y: p.y + 1 } : null));
    } else {
      lockPiece(currentPiece);
    }
  }, [currentPiece, board, isGameOver, isPaused, checkCollision, lockPiece]);

  // Hard drop instantly to bottom
  const hardDrop = useCallback(() => {
    if (!currentPiece || isGameOver || isPaused) return;
    const ghostY = getGhostY();
    const droppedPiece = { ...currentPiece, y: ghostY };
    playTone(600, 'square', 0.1);
    setScore((s) => s + (ghostY - currentPiece.y) * 2);
    lockPiece(droppedPiece);
  }, [currentPiece, isGameOver, isPaused, getGhostY, lockPiece, playTone]);

  // Move left or right
  const moveHorizontal = useCallback(
    (dir: number) => {
      if (!currentPiece || isGameOver || isPaused) return;
      if (!checkCollision(currentPiece, board, dir, 0)) {
        playTone(320, 'sine', 0.04);
        setCurrentPiece((p) => (p ? { ...p, x: p.x + dir } : null));
      }
    },
    [currentPiece, board, isGameOver, isPaused, checkCollision, playTone]
  );

  // Rotate piece
  const rotatePiece = useCallback(() => {
    if (!currentPiece || isGameOver || isPaused) return;
    const rotated = rotateMatrix(currentPiece.matrix);
    const candidate: Piece = { ...currentPiece, matrix: rotated };

    // Standard kick checks (0, -1, +1, -2, +2)
    const kicks = [0, -1, 1, -2, 2];
    for (const kick of kicks) {
      if (!checkCollision(candidate, board, kick, 0)) {
        playTone(480, 'sine', 0.05);
        setCurrentPiece({ ...candidate, x: candidate.x + kick });
        return;
      }
    }
  }, [currentPiece, board, isGameOver, isPaused, checkCollision, playTone]);

  // Hold piece
  const handleHold = useCallback(() => {
    if (!currentPiece || !canHold || isGameOver || isPaused) return;
    playTone(520, 'triangle', 0.1);

    const curType = currentPiece.type;
    if (holdPiece === null) {
      setHoldPiece(curType);
      const next = nextPiece || getRandomTetromino();
      setCurrentPiece(next);
      setNextPiece(getRandomTetromino());
    } else {
      const def = TETROMINOES[holdPiece];
      const newPiece: Piece = {
        type: holdPiece,
        matrix: def.shape.map((r) => [...r]),
        x: Math.floor((BOARD_WIDTH - def.shape[0].length) / 2),
        y: holdPiece === 'I' ? -1 : 0,
        color: def.color,
      };
      setHoldPiece(curType);
      setCurrentPiece(newPiece);
    }
    setCanHold(false);
  }, [currentPiece, canHold, isGameOver, isPaused, holdPiece, nextPiece, playTone]);

  // Keyboard events
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
        e.preventDefault();
      }

      if (e.key === 'p' || e.key === 'P') {
        setIsPaused((p) => !p);
        return;
      }

      if (isPaused || isGameOver) return;

      switch (e.key) {
        case 'ArrowLeft':
        case 'a':
        case 'A':
          moveHorizontal(-1);
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          moveHorizontal(1);
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          moveDown();
          break;
        case 'ArrowUp':
        case 'w':
        case 'W':
          rotatePiece();
          break;
        case ' ':
          hardDrop();
          break;
        case 'c':
        case 'C':
        case 'Shift':
          handleHold();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [moveHorizontal, moveDown, rotatePiece, hardDrop, handleHold, isPaused, isGameOver]);

  // Auto gravity ticker
  useEffect(() => {
    if (isGameOver || isPaused) return;
    const speed = Math.max(100, 800 - (level - 1) * 70);
    const interval = setInterval(moveDown, speed);
    return () => clearInterval(interval);
  }, [moveDown, isGameOver, isPaused, level]);

  // Restart
  const handleRestart = () => {
    setBoard(
      Array(BOARD_HEIGHT)
        .fill(null)
        .map(() => Array(BOARD_WIDTH).fill(null))
    );
    setCurrentPiece(getRandomTetromino());
    setNextPiece(getRandomTetromino());
    setHoldPiece(null);
    setCanHold(true);
    setScore(0);
    setLinesCleared(0);
    setLevel(1);
    setIsGameOver(false);
    setIsPaused(false);
  };

  // Render combined view with current piece & ghost
  const ghostY = getGhostY();
  const renderedGrid: { color: string | null; isGhost?: boolean; isActive?: boolean }[][] = board.map(
    (row) => row.map((cell) => ({ color: cell }))
  );

  // Overlay ghost
  if (currentPiece && !isGameOver) {
    for (let r = 0; r < currentPiece.matrix.length; r++) {
      for (let c = 0; c < currentPiece.matrix[r].length; c++) {
        if (currentPiece.matrix[r][c] !== 0) {
          const gY = ghostY + r;
          const gX = currentPiece.x + c;
          if (gY >= 0 && gY < BOARD_HEIGHT && gX >= 0 && gX < BOARD_WIDTH) {
            if (!renderedGrid[gY][gX].color) {
              renderedGrid[gY][gX] = { color: 'border border-dashed border-zinc-400/50 bg-zinc-500/10', isGhost: true };
            }
          }
        }
      }
    }

    // Overlay active piece
    for (let r = 0; r < currentPiece.matrix.length; r++) {
      for (let c = 0; c < currentPiece.matrix[r].length; c++) {
        if (currentPiece.matrix[r][c] !== 0) {
          const pY = currentPiece.y + r;
          const pX = currentPiece.x + c;
          if (pY >= 0 && pY < BOARD_HEIGHT && pX >= 0 && pX < BOARD_WIDTH) {
            renderedGrid[pY][pX] = { color: currentPiece.color, isActive: true };
          }
        }
      }
    }
  }

  return (
    <div className="flex flex-col items-center justify-center p-2 sm:p-4 max-w-4xl mx-auto select-none">
      {/* Top HUD & Stats */}
      <div className="w-full flex items-center justify-between gap-3 mb-4 bg-white dark:bg-[#241C21] p-3 sm:p-4 rounded-2xl border border-[#F2E8E4] dark:border-[#3D2F36] shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-xs">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-serif font-bold text-lg text-[#2D2327] dark:text-[#FAF4F0]">
              Tetris Clássico
            </h2>
            <p className="text-xs text-[#7D6F74] dark:text-[#B8A8AF]">
              Encaixe blocos, limpe linhas e bata o recorde!
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsMuted((m) => !m)}
            className="p-2 rounded-xl text-[#7D6F74] hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            title={isMuted ? 'Ativar Sons' : 'Silenciar Sons'}
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
          <button
            onClick={() => setIsPaused((p) => !p)}
            className="p-2 rounded-xl text-[#7D6F74] hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            title={isPaused ? 'Continuar' : 'Pausar'}
          >
            {isPaused ? <Play className="w-4 h-4 text-emerald-500" /> : <Pause className="w-4 h-4" />}
          </button>
          <button
            onClick={handleRestart}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-xs font-semibold text-[#2D2327] dark:text-[#FAF4F0] transition-colors"
            title="Reiniciar partida"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Reiniciar</span>
          </button>
        </div>
      </div>

      {/* Main Game Layout */}
      <div className="flex flex-col md:flex-row items-center md:items-start justify-center gap-4 w-full">
        {/* Left Side: Hold Piece & Level Stats */}
        <div className="flex flex-row md:flex-col gap-3 w-full md:w-36 justify-between md:justify-start">
          {/* Hold Box */}
          <div className="flex-1 md:flex-initial p-3 rounded-2xl bg-white dark:bg-[#241C21] border border-[#F2E8E4] dark:border-[#3D2F36] shadow-2xs text-center">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#7D6F74] dark:text-[#B8A8AF] block mb-2">
              Reserva (Hold)
            </span>
            <div className="w-16 h-16 mx-auto flex items-center justify-center bg-zinc-50 dark:bg-[#1C1518] rounded-xl border border-dashed border-zinc-200 dark:border-zinc-800">
              {holdPiece ? (
                <div className="grid gap-0.5">
                  {TETROMINOES[holdPiece].shape.map((row, r) => (
                    <div key={r} className="flex gap-0.5">
                      {row.map((val, c) => (
                        <div
                          key={c}
                          className={`w-3 h-3 rounded-xs ${
                            val ? TETROMINOES[holdPiece].color : 'opacity-0'
                          }`}
                        />
                      ))}
                    </div>
                  ))}
                </div>
              ) : (
                <span className="text-[10px] text-zinc-400">Vazio (C)</span>
              )}
            </div>
            <button
              onClick={handleHold}
              disabled={!canHold || isGameOver || isPaused}
              className="mt-2 text-[10px] w-full py-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 font-semibold disabled:opacity-40 hover:bg-[#E07A8B] hover:text-white transition-colors"
            >
              Trocar
            </button>
          </div>

          {/* Level and Lines Card */}
          <div className="flex-1 md:flex-initial p-3 rounded-2xl bg-white dark:bg-[#241C21] border border-[#F2E8E4] dark:border-[#3D2F36] shadow-2xs space-y-2">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#7D6F74] dark:text-[#B8A8AF] block">
                Nível
              </span>
              <p className="text-xl font-bold font-mono text-[#E07A8B]">{level}</p>
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#7D6F74] dark:text-[#B8A8AF] block">
                Linhas
              </span>
              <p className="text-xl font-bold font-mono text-[#2D2327] dark:text-[#FAF4F0]">
                {linesCleared}
              </p>
            </div>
          </div>
        </div>

        {/* Center: Tetris Board */}
        <div className="relative p-2.5 sm:p-3 bg-zinc-900 dark:bg-black rounded-3xl border-4 border-[#2D2327] dark:border-[#3D2F36] shadow-xl">
          <div
            className="grid gap-[1px] bg-zinc-950 p-1 rounded-xl"
            style={{
              gridTemplateColumns: `repeat(${BOARD_WIDTH}, minmax(0, 1fr))`,
            }}
          >
            {renderedGrid.map((row, r) =>
              row.map((cell, c) => (
                <div
                  key={`${r}-${c}`}
                  className={`w-6 h-6 sm:w-7 sm:h-7 rounded-[3px] transition-all duration-75 flex items-center justify-center ${
                    cell.color
                      ? cell.color
                      : 'bg-zinc-900/60 border border-zinc-800/40 hover:bg-zinc-800/30'
                  }`}
                />
              ))
            )}
          </div>

          {/* Pause Overlay */}
          {isPaused && !isGameOver && (
            <div className="absolute inset-0 bg-black/75 backdrop-blur-xs flex flex-col items-center justify-center rounded-3xl z-10 text-white space-y-3">
              <Pause className="w-12 h-12 text-yellow-400 animate-pulse" />
              <p className="font-serif font-bold text-xl">Jogo Pausado</p>
              <button
                onClick={() => setIsPaused(false)}
                className="px-6 py-2 rounded-xl bg-[#E07A8B] hover:bg-[#d66a7c] text-white font-semibold text-sm transition-colors shadow-md"
              >
                Continuar
              </button>
            </div>
          )}

          {/* Game Over Overlay */}
          {isGameOver && (
            <div className="absolute inset-0 bg-black/85 backdrop-blur-xs flex flex-col items-center justify-center rounded-3xl z-10 text-white space-y-3 p-4 text-center">
              <Trophy className="w-12 h-12 text-yellow-400" />
              <p className="font-serif font-bold text-2xl text-rose-400">Fim de Jogo!</p>
              <div className="text-xs space-y-1 text-zinc-300">
                <p>Pontuação: <strong className="text-white text-base font-mono">{score}</strong></p>
                <p>Linhas completadas: <strong>{linesCleared}</strong></p>
                {score >= highScore && score > 0 && (
                  <p className="text-amber-300 font-bold">✨ Novo Recorde do Casal!</p>
                )}
              </div>
              <button
                onClick={handleRestart}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#E07A8B] to-rose-500 hover:from-[#d66a7c] hover:to-rose-600 text-white font-bold text-sm transition-all shadow-lg"
              >
                Jogar Novamente
              </button>
            </div>
          )}
        </div>

        {/* Right Side: Next Piece & Score */}
        <div className="flex flex-row md:flex-col gap-3 w-full md:w-36 justify-between md:justify-start">
          {/* Next Box */}
          <div className="flex-1 md:flex-initial p-3 rounded-2xl bg-white dark:bg-[#241C21] border border-[#F2E8E4] dark:border-[#3D2F36] shadow-2xs text-center">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#7D6F74] dark:text-[#B8A8AF] block mb-2">
              Próxima
            </span>
            <div className="w-16 h-16 mx-auto flex items-center justify-center bg-zinc-50 dark:bg-[#1C1518] rounded-xl border border-dashed border-zinc-200 dark:border-zinc-800">
              {nextPiece && (
                <div className="grid gap-0.5">
                  {nextPiece.matrix.map((row, r) => (
                    <div key={r} className="flex gap-0.5">
                      {row.map((val, c) => (
                        <div
                          key={c}
                          className={`w-3 h-3 rounded-xs ${
                            val ? nextPiece.color : 'opacity-0'
                          }`}
                        />
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Score & Record Card */}
          <div className="flex-1 md:flex-initial p-3 rounded-2xl bg-white dark:bg-[#241C21] border border-[#F2E8E4] dark:border-[#3D2F36] shadow-2xs space-y-2">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#7D6F74] dark:text-[#B8A8AF] block">
                Pontos
              </span>
              <p className="text-xl font-bold font-mono text-[#2D2327] dark:text-[#FAF4F0]">
                {score}
              </p>
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 block">
                Recorde 🏆
              </span>
              <p className="text-xl font-bold font-mono text-amber-600 dark:text-amber-400">
                {highScore}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Touch / Mobile Virtual Controls */}
      <div className="w-full max-w-sm mt-4 p-3 bg-white/70 dark:bg-[#241C21]/70 backdrop-blur-xs rounded-2xl border border-[#F2E8E4] dark:border-[#3D2F36] shadow-2xs">
        <div className="flex items-center justify-between gap-2">
          {/* Directional Pad */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => moveHorizontal(-1)}
              className="w-11 h-11 rounded-xl bg-zinc-100 dark:bg-zinc-800 active:bg-[#E07A8B] active:text-white flex items-center justify-center font-bold text-zinc-700 dark:text-zinc-200 shadow-2xs"
              aria-label="Esquerda"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <button
              onClick={moveDown}
              className="w-11 h-11 rounded-xl bg-zinc-100 dark:bg-zinc-800 active:bg-[#E07A8B] active:text-white flex items-center justify-center font-bold text-zinc-700 dark:text-zinc-200 shadow-2xs"
              aria-label="Descer"
            >
              <ArrowDown className="w-5 h-5" />
            </button>
            <button
              onClick={() => moveHorizontal(1)}
              className="w-11 h-11 rounded-xl bg-zinc-100 dark:bg-zinc-800 active:bg-[#E07A8B] active:text-white flex items-center justify-center font-bold text-zinc-700 dark:text-zinc-200 shadow-2xs"
              aria-label="Direita"
            >
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={rotatePiece}
              className="w-11 h-11 rounded-xl bg-[#E07A8B]/15 text-[#E07A8B] border border-[#E07A8B]/30 active:bg-[#E07A8B] active:text-white flex items-center justify-center font-bold shadow-2xs"
              title="Girar Peça"
            >
              <RotateCw className="w-5 h-5" />
            </button>
            <button
              onClick={hardDrop}
              className="px-3.5 h-11 rounded-xl bg-[#E07A8B] active:bg-[#d66a7c] text-white flex items-center justify-center font-bold text-xs shadow-2xs"
              title="Queda Imediata (Hard Drop)"
            >
              Queda ⚡
            </button>
          </div>
        </div>
        <p className="text-[10px] text-center text-[#7D6F74] dark:text-[#B8A8AF] mt-2">
          Teclado: ← → para mover | ↑ ou W para girar | ↓ para descer | Espaço para queda direta | C para reservar
        </p>
      </div>
    </div>
  );
};
