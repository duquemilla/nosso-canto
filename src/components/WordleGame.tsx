import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Sparkles,
  Trophy,
  RotateCcw,
  HelpCircle,
  CheckCircle2,
  XCircle,
  Heart,
  Share2,
  Lock,
  Eye,
  EyeOff,
  Flame,
  Award,
} from 'lucide-react';
import { CoupleProfile, PartnerId } from '../types';

// Curated 5-letter words in Portuguese with romantic & daily life themes
const WORD_LIST = [
  'AMORE', 'BEIJO', 'CASAL', 'LINDA', 'AFETO', 'SONHO', 'SORTE', 'ABRACO',
  'VIVER', 'CARIN', 'NOITE', 'DOCES', 'JUNTO', 'PRAIA', 'FELIZ', 'JURAS',
  'CHAME', 'VIDAS', 'MAGIA', 'QUERO', 'RISOS', 'MUNDO', 'TEMPO', 'CORPO',
  'ALMAS', 'CLARA', 'DOCUR', 'TERRA', 'LUZES', 'BRISA', 'FLORE', 'AROMA',
  'CALOR', 'CUIDA', 'PEITO', 'OLHAR', 'GOSTO', 'CHAVE', 'FESTA', 'CANTO',
  'MIMOS', 'NUVEM', 'LIVRO', 'CAFES', 'UNIAO', 'PAIXA', 'HOTEL', 'VIAGI',
  'AMADA', 'AMADO', 'GRATO', 'GRATA', 'DOCIN', 'PEGAI', 'CHAMA', 'LINDO',
  'PASSO', 'FORTE', 'SERIA', 'DOCIL', 'FOGOS', 'BRILH', 'AMIGA', 'AMIGO',
];

// Helper to remove accents for easy letter matching
function normalizeText(text: string): string {
  return text
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^A-Z]/g, '');
}

interface WordleGameProps {
  profile: CoupleProfile;
  activePartner: PartnerId;
}

type LetterStatus = 'correct' | 'present' | 'absent' | 'empty';

export const WordleGame: React.FC<WordleGameProps> = ({ profile, activePartner }) => {
  const p1 = profile.partner1;
  const p2 = profile.partner2;

  // Game Mode: 'daily' | 'unlimited' | 'custom'
  const [gameMode, setGameMode] = useState<'daily' | 'unlimited' | 'custom'>('daily');
  const [customWordInput, setCustomWordInput] = useState('');
  const [customWordAuthor, setCustomWordAuthor] = useState<PartnerId>('partner1');
  const [customWordHint, setCustomWordHint] = useState('');
  const [isCustomSetup, setIsCustomSetup] = useState(false);

  // Stats
  const [stats, setStats] = useState(() => {
    try {
      const saved = localStorage.getItem('nos_dois_wordle_stats');
      if (saved) return JSON.parse(saved);
    } catch {}
    return { played: 0, wins: 0, currentStreak: 0, maxStreak: 0, distribution: [0, 0, 0, 0, 0, 0] };
  });

  const saveStats = (won: boolean, attemptCount: number) => {
    setStats((prev: any) => {
      const newPlayed = prev.played + 1;
      const newWins = won ? prev.wins + 1 : prev.wins;
      const newStreak = won ? prev.currentStreak + 1 : 0;
      const newMaxStreak = Math.max(newStreak, prev.maxStreak);
      const newDist = [...prev.distribution];
      if (won && attemptCount >= 1 && attemptCount <= 6) {
        newDist[attemptCount - 1] += 1;
      }
      const updated = {
        played: newPlayed,
        wins: newWins,
        currentStreak: newStreak,
        maxStreak: newMaxStreak,
        distribution: newDist,
      };
      try {
        localStorage.setItem('nos_dois_wordle_stats', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  // Target word selection
  const [targetWord, setTargetWord] = useState<string>('AMORE');
  const [targetHint, setTargetHint] = useState<string>('');

  // Daily seed word
  const getDailyWord = () => {
    const today = new Date();
    const dayOfYear = Math.floor(
      (today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / 1000 / 60 / 60 / 24
    );
    const word = WORD_LIST[dayOfYear % WORD_LIST.length];
    return { word: normalizeText(word.slice(0, 5)), hint: 'Palavra do Dia do Casal 💕' };
  };

  // Initialize word based on mode
  const initGame = useCallback((mode: 'daily' | 'unlimited' | 'custom', customWord = '', hint = '') => {
    if (mode === 'daily') {
      const daily = getDailyWord();
      setTargetWord(daily.word);
      setTargetHint(daily.hint);
    } else if (mode === 'unlimited') {
      const randomWord = WORD_LIST[Math.floor(Math.random() * WORD_LIST.length)];
      setTargetWord(normalizeText(randomWord.slice(0, 5)));
      setTargetHint('Palavra Livre 🔄');
    } else if (mode === 'custom' && customWord) {
      setTargetWord(normalizeText(customWord.slice(0, 5)));
      setTargetHint(hint || 'Desafio Secreto feito pela parceira 💌');
    }
    setGuesses([]);
    setCurrentGuess('');
    setGameStatus('playing');
    setErrorMessage('');
  }, []);

  useEffect(() => {
    initGame('daily');
  }, [initGame]);

  // Board state
  const [guesses, setGuesses] = useState<string[]>([]);
  const [currentGuess, setCurrentGuess] = useState<string>('');
  const [gameStatus, setGameStatus] = useState<'playing' | 'won' | 'lost'>('playing');
  const [errorMessage, setErrorMessage] = useState<string>('');

  // Evaluated keyboard letter statuses
  const letterStatuses = useMemo(() => {
    const map: Record<string, LetterStatus> = {};
    guesses.forEach((guess) => {
      for (let i = 0; i < guess.length; i++) {
        const letter = guess[i];
        if (targetWord[i] === letter) {
          map[letter] = 'correct';
        } else if (targetWord.includes(letter)) {
          if (map[letter] !== 'correct') {
            map[letter] = 'present';
          }
        } else {
          if (!map[letter]) {
            map[letter] = 'absent';
          }
        }
      }
    });
    return map;
  }, [guesses, targetWord]);

  // Handle Letter Input
  const handleAddLetter = (letter: string) => {
    if (gameStatus !== 'playing') return;
    if (currentGuess.length < 5) {
      setCurrentGuess((prev) => prev + letter);
      setErrorMessage('');
    }
  };

  // Handle Backspace
  const handleDeleteLetter = () => {
    if (gameStatus !== 'playing') return;
    setCurrentGuess((prev) => prev.slice(0, -1));
    setErrorMessage('');
  };

  // Handle Submit Guess
  const handleSubmitGuess = () => {
    if (gameStatus !== 'playing') return;
    if (currentGuess.length < 5) {
      setErrorMessage('A palavra precisa ter 5 letras!');
      setTimeout(() => setErrorMessage(''), 2500);
      return;
    }

    const newGuesses = [...guesses, currentGuess];
    setGuesses(newGuesses);

    if (currentGuess === targetWord) {
      setGameStatus('won');
      saveStats(true, newGuesses.length);
    } else if (newGuesses.length >= 6) {
      setGameStatus('lost');
      saveStats(false, 6);
    }

    setCurrentGuess('');
  };

  // Keyboard Event Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isCustomSetup) return;
      if (e.key === 'Enter') {
        handleSubmitGuess();
      } else if (e.key === 'Backspace') {
        handleDeleteLetter();
      } else if (/^[a-zA-Z]$/.test(e.key)) {
        handleAddLetter(e.key.toUpperCase());
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });

  // Evaluate letter colors for a submitted row
  const getRowLetterStatus = (guess: string, index: number): LetterStatus => {
    const letter = guess[index];
    if (targetWord[index] === letter) return 'correct';
    if (targetWord.includes(letter)) {
      // Handle duplicates count accurately
      const targetCount = targetWord.split('').filter((l) => l === letter).length;
      const correctMatches = guess
        .split('')
        .filter((l, i) => l === letter && targetWord[i] === letter).length;
      const priorPresentMatches = guess
        .slice(0, index)
        .split('')
        .filter((l, i) => l === letter && targetWord[i] !== letter).length;
      if (priorPresentMatches + correctMatches < targetCount) {
        return 'present';
      }
      return 'absent';
    }
    return 'absent';
  };

  const KEYBOARD_ROWS = [
    ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
    ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
    ['ENTER', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', 'DEL'],
  ];

  return (
    <div className="flex flex-col items-center p-2 sm:p-4 max-w-xl mx-auto select-none space-y-4">
      {/* Top Title & Mode Selector */}
      <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-[#241C21] p-3 sm:p-4 rounded-3xl border border-[var(--card-border)] shadow-2xs">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-600 flex items-center justify-center text-white text-xl shadow-xs">
            📝
          </div>
          <div>
            <h2 className="font-serif font-bold text-base sm:text-lg text-[#2D2327] dark:text-[#FAF4F0] flex items-center gap-1.5">
              Termo & Letreco do Casal
              <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 font-sans font-semibold">
                Wordle 💕
              </span>
            </h2>
            <p className="text-xs text-[#7D6F74] dark:text-[#B8A8AF]">
              {targetHint || 'Adivinhe a palavra secreta de 5 letras em até 6 tentativas'}
            </p>
          </div>
        </div>

        {/* Mode switcher pills */}
        <div className="flex items-center gap-1 p-1 rounded-full bg-[var(--pill-bg)] border border-[var(--pill-border)]">
          <button
            type="button"
            onClick={() => {
              setGameMode('daily');
              initGame('daily');
            }}
            className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
              gameMode === 'daily'
                ? 'bg-white dark:bg-[#2C1D24] text-[var(--pill-active-text)] border border-[var(--border-accent)] shadow-xs'
                : 'text-[#7D6F74] dark:text-[#B8A8AF] hover:text-[#2D2327]'
            }`}
          >
            📅 Diário
          </button>
          <button
            type="button"
            onClick={() => {
              setGameMode('unlimited');
              initGame('unlimited');
            }}
            className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
              gameMode === 'unlimited'
                ? 'bg-white dark:bg-[#2C1D24] text-[var(--pill-active-text)] border border-[var(--border-accent)] shadow-xs'
                : 'text-[#7D6F74] dark:text-[#B8A8AF] hover:text-[#2D2327]'
            }`}
          >
            🔄 Ilimitado
          </button>
          <button
            type="button"
            onClick={() => setIsCustomSetup(true)}
            className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
              gameMode === 'custom'
                ? 'bg-white dark:bg-[#2C1D24] text-[var(--pill-active-text)] border border-[var(--border-accent)] shadow-xs'
                : 'text-[#7D6F74] dark:text-[#B8A8AF] hover:text-[#2D2327]'
            }`}
          >
            💌 Desafio
          </button>
        </div>
      </div>

      {/* Custom Secret Word Setup Modal */}
      {isCustomSetup && (
        <div className="w-full p-4 rounded-3xl bg-rose-50/80 dark:bg-rose-950/40 border-2 border-[var(--border-accent)] space-y-3 animate-in fade-in">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-[#2D2327] dark:text-[#FAF4F0] flex items-center gap-1.5">
              <Lock className="w-4 h-4 text-rose-500" />
              Criar Desafio Secreto para a Parceira
            </h3>
            <button
              type="button"
              onClick={() => setIsCustomSetup(false)}
              className="text-xs text-[#7D6F74] hover:underline font-semibold"
            >
              Cancelar
            </button>
          </div>
          <p className="text-xs text-[#7D6F74] dark:text-[#B8A8AF]">
            Digite uma palavra romântica ou engraçada de exatamente 5 letras. A outra jogadora terá 6 chances para adivinhar!
          </p>

          <div className="space-y-2">
            <input
              type="password"
              maxLength={5}
              value={customWordInput}
              onChange={(e) => setCustomWordInput(e.target.value.toUpperCase())}
              placeholder="Ex: BEIJO ou NOITE (5 letras)"
              className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-[#1E161A] border border-[var(--card-border)] text-sm tracking-widest font-mono uppercase text-[#2D2327] dark:text-white outline-none focus:border-[var(--border-accent)]"
            />
            <input
              type="text"
              maxLength={40}
              value={customWordHint}
              onChange={(e) => setCustomWordHint(e.target.value)}
              placeholder="Dica opcional (Ex: Algo que adoro em você)"
              className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-[#1E161A] border border-[var(--card-border)] text-xs text-[#2D2327] dark:text-white outline-none focus:border-[var(--border-accent)]"
            />
          </div>

          <div className="flex items-center justify-between pt-1">
            <span className="text-xs font-medium text-rose-600 dark:text-rose-400">
              {customWordInput.length}/5 letras
            </span>
            <button
              type="button"
              disabled={customWordInput.length !== 5}
              onClick={() => {
                const norm = normalizeText(customWordInput);
                if (norm.length === 5) {
                  setGameMode('custom');
                  initGame('custom', norm, customWordHint);
                  setIsCustomSetup(false);
                  setCustomWordInput('');
                  setCustomWordHint('');
                }
              }}
              className="px-4 py-1.5 rounded-full text-xs font-bold bg-[var(--border-accent)] text-white disabled:opacity-50 disabled:cursor-not-allowed hover:brightness-105 shadow-xs"
            >
              Começar Desafio 💌
            </button>
          </div>
        </div>
      )}

      {/* Error Message Toast */}
      {errorMessage && (
        <div className="py-1.5 px-4 rounded-full bg-rose-500 text-white text-xs font-semibold shadow-md animate-bounce">
          {errorMessage}
        </div>
      )}

      {/* 6x5 Wordle Tiles Grid */}
      <div className="flex flex-col gap-1.5 sm:gap-2">
        {Array.from({ length: 6 }).map((_, rowIndex) => {
          const isSubmitted = rowIndex < guesses.length;
          const isCurrent = rowIndex === guesses.length;
          const rowGuess = isSubmitted ? guesses[rowIndex] : isCurrent ? currentGuess : '';

          return (
            <div key={rowIndex} className="flex gap-1.5 sm:gap-2">
              {Array.from({ length: 5 }).map((_, colIndex) => {
                const letter = rowGuess[colIndex] || '';
                let tileBg = 'bg-white dark:bg-[#20181D] border-[#E8D5DC] dark:border-[#3D2F36] text-[#2D2327] dark:text-[#FAF4F0]';

                if (isSubmitted) {
                  const status = getRowLetterStatus(rowGuess, colIndex);
                  if (status === 'correct') {
                    tileBg = 'bg-emerald-500 border-emerald-600 text-white shadow-xs';
                  } else if (status === 'present') {
                    tileBg = 'bg-amber-400 border-amber-500 text-white shadow-xs';
                  } else {
                    tileBg = 'bg-zinc-400 dark:bg-zinc-600 border-zinc-500 text-white';
                  }
                } else if (letter) {
                  tileBg = 'bg-rose-50/70 dark:bg-rose-950/40 border-[var(--border-accent)] text-[#2D2327] dark:text-white scale-105 transition-transform';
                }

                return (
                  <div
                    key={colIndex}
                    className={`w-11 h-11 sm:w-13 sm:h-13 rounded-2xl border-2 font-bold text-lg sm:text-xl flex items-center justify-center select-none uppercase transition-all duration-200 ${tileBg}`}
                  >
                    {letter}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>

      {/* Game Finished Banners */}
      {gameStatus === 'won' && (
        <div className="w-full p-4 rounded-3xl bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 dark:from-emerald-950/40 dark:via-teal-950/30 dark:to-emerald-950/40 border border-emerald-300 dark:border-emerald-700 text-center space-y-2 animate-in zoom-in-95">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200 text-xs font-bold">
            <Trophy className="w-4 h-4 text-emerald-600" />
            Parabéns! Acertou em {guesses.length} {guesses.length === 1 ? 'tentativa' : 'tentativas'}! 💕
          </div>
          <p className="font-serif font-bold text-lg text-emerald-900 dark:text-emerald-100">
            A palavra era &quot;{targetWord}&quot;
          </p>
          <div className="flex items-center justify-center gap-2 pt-1">
            <button
              type="button"
              onClick={() => initGame(gameMode)}
              className="px-4 py-2 rounded-full text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700 transition-colors shadow-xs flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Jogar Novamente
            </button>
          </div>
        </div>
      )}

      {gameStatus === 'lost' && (
        <div className="w-full p-4 rounded-3xl bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 text-center space-y-2 animate-in zoom-in-95">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-100 dark:bg-rose-900/60 text-rose-800 dark:text-rose-200 text-xs font-bold">
            <XCircle className="w-4 h-4 text-rose-500" />
            Quase lá! Tentativas esgotadas
          </div>
          <p className="font-serif font-bold text-base text-[#2D2327] dark:text-[#FAF4F0]">
            A palavra era: <span className="text-[var(--border-accent)] uppercase tracking-widest">{targetWord}</span>
          </p>
          <div className="flex items-center justify-center gap-2 pt-1">
            <button
              type="button"
              onClick={() => initGame(gameMode)}
              className="px-4 py-2 rounded-full text-xs font-bold bg-[var(--border-accent)] text-white hover:brightness-105 transition-all shadow-xs flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Tentar Outra Palavra
            </button>
          </div>
        </div>
      )}

      {/* On-screen Virtual Keyboard */}
      <div className="w-full max-w-md flex flex-col gap-1.5 pt-1">
        {KEYBOARD_ROWS.map((row, rIdx) => (
          <div key={rIdx} className="flex justify-center gap-1 sm:gap-1.5">
            {row.map((key) => {
              const status = letterStatuses[key];
              let keyBg = 'bg-white dark:bg-[#2A1F26] text-[#2D2327] dark:text-[#FAF4F0] border-[var(--card-border)] hover:border-[var(--border-accent)]';

              if (status === 'correct') {
                keyBg = 'bg-emerald-500 text-white border-emerald-600 font-bold';
              } else if (status === 'present') {
                keyBg = 'bg-amber-400 text-white border-amber-500 font-bold';
              } else if (status === 'absent') {
                keyBg = 'bg-zinc-300 dark:bg-zinc-700 text-zinc-500 dark:text-zinc-400 border-transparent';
              }

              const isWide = key === 'ENTER' || key === 'DEL';

              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => {
                    if (key === 'ENTER') handleSubmitGuess();
                    else if (key === 'DEL') handleDeleteLetter();
                    else handleAddLetter(key);
                  }}
                  className={`h-11 sm:h-12 rounded-xl border text-xs sm:text-sm font-semibold transition-all active:scale-95 flex items-center justify-center select-none ${
                    isWide ? 'px-2.5 sm:px-3 text-[11px] font-bold min-w-12 bg-rose-100/70 dark:bg-rose-950/60' : 'w-8 sm:w-10'
                  } ${keyBg}`}
                >
                  {key === 'DEL' ? '⌫' : key}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {/* Couple Stats Summary Footer */}
      <div className="w-full flex items-center justify-around p-3 rounded-2xl bg-[var(--pill-bg)] border border-[var(--pill-border)] text-xs text-[#7D6F74] dark:text-[#B8A8AF]">
        <div className="text-center">
          <span className="block font-bold text-sm text-[#2D2327] dark:text-[#FAF4F0]">{stats.played}</span>
          <span className="text-[10px]">Jogadas</span>
        </div>
        <div className="w-[1px] h-6 bg-[var(--card-border)]" />
        <div className="text-center">
          <span className="block font-bold text-sm text-emerald-600 dark:text-emerald-400">
            {stats.played > 0 ? Math.round((stats.wins / stats.played) * 100) : 0}%
          </span>
          <span className="text-[10px]">Vitórias</span>
        </div>
        <div className="w-[1px] h-6 bg-[var(--card-border)]" />
        <div className="text-center">
          <span className="block font-bold text-sm text-amber-500 flex items-center justify-center gap-0.5">
            <Flame className="w-3.5 h-3.5" />
            {stats.currentStreak}
          </span>
          <span className="text-[10px]">Sequência</span>
        </div>
      </div>
    </div>
  );
};
