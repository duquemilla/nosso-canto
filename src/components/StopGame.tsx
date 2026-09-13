import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Sparkles,
  Trophy,
  RotateCcw,
  Play,
  Pause,
  Clock,
  CheckCircle2,
  XCircle,
  Award,
  Dice5,
  Volume2,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import { CoupleProfile, PartnerId } from '../types';

interface StopGameProps {
  profile: CoupleProfile;
  activePartner: PartnerId;
}

const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'L', 'M', 'N', 'O', 'P', 'R', 'S', 'T', 'U', 'V'];

const CATEGORIES = [
  { id: 'nome', label: 'Nome de Pessoa', icon: '👤', placeholder: 'Ex: Camilla, Cassi...' },
  { id: 'animal', label: 'Animal', icon: '🐾', placeholder: 'Ex: Cachorro, Camelo...' },
  { id: 'comida', label: 'Comida / Gostosura', icon: '🍓', placeholder: 'Ex: Coxinha, Chocolate...' },
  { id: 'objeto', label: 'Objeto / Coisa de Casa', icon: '🛋️', placeholder: 'Ex: Cadeira, Caneca...' },
  { id: 'lugar', label: 'Cidade / País / Viagem', icon: '✈️', placeholder: 'Ex: Curitiba, Canadá...' },
  { id: 'adjetivo', label: 'Minha Namorada É...', icon: '💖', placeholder: 'Ex: Carinhosa, Charmosa...' },
];

export const StopGame: React.FC<StopGameProps> = ({ profile, activePartner }) => {
  const p1 = profile.partner1;
  const p2 = profile.partner2;

  // Game phase: 'idle' | 'spinning' | 'playing' | 'scoring' | 'result'
  const [phase, setPhase] = useState<'idle' | 'spinning' | 'playing' | 'scoring' | 'result'>('idle');
  const [currentLetter, setCurrentLetter] = useState<string>('C');
  const [usedLetters, setUsedLetters] = useState<string[]>([]);

  // Timer: 60s, 90s, 120s, or 0 (free)
  const [timerDuration, setTimerDuration] = useState<number>(90);
  const [timeLeft, setTimeLeft] = useState<number>(90);
  const timerRef = useRef<any>(null);

  // Player Answers
  const [answersP1, setAnswersP1] = useState<Record<string, string>>({});
  const [answersP2, setAnswersP2] = useState<Record<string, string>>({});

  // Scoring per category: 10, 5, or 0
  const [scoresP1, setScoresP1] = useState<Record<string, number>>({});
  const [scoresP2, setScoresP2] = useState<Record<string, number>>({});

  // Cumulative Couple Score
  const [totalScoreP1, setTotalScoreP1] = useState<number>(0);
  const [totalScoreP2, setTotalScoreP2] = useState<number>(0);
  const [roundsPlayed, setRoundsPlayed] = useState<number>(0);

  // Active filling view in mobile: 'p1' | 'p2' | 'both'
  const [viewMode, setViewMode] = useState<'p1' | 'p2' | 'both'>('both');

  // Spinning letter animation
  const handleSpinLetter = () => {
    setPhase('spinning');
    let counter = 0;
    const available = LETTERS.filter((l) => !usedLetters.includes(l));
    const pool = available.length > 0 ? available : LETTERS;

    const interval = setInterval(() => {
      const rand = pool[Math.floor(Math.random() * pool.length)];
      setCurrentLetter(rand);
      counter++;
      if (counter > 18) {
        clearInterval(interval);
        const finalLetter = pool[Math.floor(Math.random() * pool.length)];
        setCurrentLetter(finalLetter);
        setUsedLetters((prev) => [...prev, finalLetter]);
        setPhase('playing');
        setTimeLeft(timerDuration);
        setAnswersP1({});
        setAnswersP2({});
      }
    }, 80);
  };

  // Timer Tick
  useEffect(() => {
    if (phase === 'playing' && timerDuration > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            handleStopCall('O tempo acabou!');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [phase, timerDuration]);

  // Stop button clicked
  const handleStopCall = (caller = 'STOP!') => {
    if (timerRef.current) clearInterval(timerRef.current);
    setPhase('scoring');

    // Default initial scores: 10 if answered, 0 if blank
    const initialScores1: Record<string, number> = {};
    const initialScores2: Record<string, number> = {};
    CATEGORIES.forEach((cat) => {
      const a1 = (answersP1[cat.id] || '').trim();
      const a2 = (answersP2[cat.id] || '').trim();
      if (a1 && a2 && a1.toLowerCase() === a2.toLowerCase()) {
        initialScores1[cat.id] = 5;
        initialScores2[cat.id] = 5;
      } else {
        initialScores1[cat.id] = a1 ? 10 : 0;
        initialScores2[cat.id] = a2 ? 10 : 0;
      }
    });
    setScoresP1(initialScores1);
    setScoresP2(initialScores2);
  };

  // Finalize round scores
  const handleFinishRound = () => {
    const roundSum1 = Object.values(scoresP1).reduce((acc: number, curr: number) => acc + (curr || 0), 0);
    const roundSum2 = Object.values(scoresP2).reduce((acc: number, curr: number) => acc + (curr || 0), 0);
    setTotalScoreP1((prev) => prev + roundSum1);
    setTotalScoreP2((prev) => prev + roundSum2);
    setRoundsPlayed((prev) => prev + 1);
    setPhase('result');
  };

  const currentRoundScoreP1 = Object.values(scoresP1).reduce((acc: number, curr: number) => acc + (curr || 0), 0);
  const currentRoundScoreP2 = Object.values(scoresP2).reduce((acc: number, curr: number) => acc + (curr || 0), 0);

  return (
    <div className="flex flex-col items-center p-2 sm:p-4 max-w-4xl mx-auto select-none space-y-4">
      {/* Top Header Card */}
      <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-[#241C21] p-3 sm:p-4 rounded-3xl border border-[var(--card-border)] shadow-2xs">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-rose-500 to-pink-600 flex items-center justify-center text-white text-xl shadow-xs">
            🛑
          </div>
          <div>
            <h2 className="font-serif font-bold text-base sm:text-lg text-[#2D2327] dark:text-[#FAF4F0] flex items-center gap-1.5">
              Stop / Adedonha do Casal
              <span className="text-xs px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 font-sans font-semibold">
                Diversão a Dois 💕
              </span>
            </h2>
            <p className="text-xs text-[#7D6F74] dark:text-[#B8A8AF]">
              Sorteie a letra, preencha as 6 categorias e aperte STOP! antes da parceira
            </p>
          </div>
        </div>

        {/* Placar Acumulado */}
        <div className="flex items-center gap-3 px-3 py-1.5 rounded-2xl bg-[var(--pill-bg)] border border-[var(--pill-border)]">
          <div className="text-center">
            <span className="text-[10px] text-[#7D6F74] dark:text-[#B8A8AF] block">{p1.nickname || p1.name}</span>
            <span className="text-xs font-bold text-[var(--border-accent)]">{totalScoreP1} pts</span>
          </div>
          <span className="text-xs font-bold text-[#A6999F]">vs</span>
          <div className="text-center">
            <span className="text-[10px] text-[#7D6F74] dark:text-[#B8A8AF] block">{p2.nickname || p2.name}</span>
            <span className="text-xs font-bold text-rose-600 dark:text-rose-400">{totalScoreP2} pts</span>
          </div>
        </div>
      </div>

      {/* IDLE / SPINNING SCREEN */}
      {(phase === 'idle' || phase === 'spinning') && (
        <div className="w-full max-w-lg p-6 rounded-3xl bg-white dark:bg-[#20181D] border border-[var(--card-border)] text-center space-y-5 shadow-xs">
          <div className="space-y-2">
            <div className="w-24 h-24 mx-auto rounded-3xl bg-gradient-to-tr from-rose-400 to-pink-500 flex items-center justify-center text-white text-5xl font-black shadow-lg shadow-rose-200/50 dark:shadow-none animate-pulse">
              {currentLetter}
            </div>
            <p className="text-xs text-[#7D6F74] dark:text-[#B8A8AF]">
              {phase === 'spinning' ? 'Sorteando letra mágica...' : 'Toque no botão para girar a roleta de letras!'}
            </p>
          </div>

          {/* Tempo por Rodada */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[#2D2327] dark:text-[#FAF4F0]">
              Tempo da Rodada:
            </label>
            <div className="flex items-center justify-center gap-2">
              {[60, 90, 120, 0].map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTimerDuration(t)}
                  className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                    timerDuration === t
                      ? 'bg-[var(--pill-active-bg)] text-[var(--pill-active-text)] border-2 border-[var(--border-accent)] font-bold'
                      : 'bg-white dark:bg-[#2C1D24] text-[#7D6F74] border border-[var(--pill-border)]'
                  }`}
                >
                  {t === 0 ? 'Sem tempo' : `${t}s`}
                </button>
              ))}
            </div>
          </div>

          <button
            type="button"
            disabled={phase === 'spinning'}
            onClick={handleSpinLetter}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-rose-500 to-pink-600 text-white font-bold text-sm shadow-md hover:brightness-105 active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <Dice5 className="w-5 h-5" />
            <span>Sortear Letra & Começar 🎲</span>
          </button>
        </div>
      )}

      {/* PLAYING PHASE */}
      {phase === 'playing' && (
        <div className="w-full space-y-4">
          {/* Active Round Status Bar */}
          <div className="flex items-center justify-between p-3 rounded-2xl bg-white dark:bg-[#20181D] border border-[var(--card-border)] shadow-2xs">
            <div className="flex items-center gap-3">
              <span className="w-10 h-10 rounded-2xl bg-[var(--border-accent)] text-white text-xl font-black flex items-center justify-center shadow-xs">
                {currentLetter}
              </span>
              <div>
                <span className="text-xs font-bold text-[#2D2327] dark:text-[#FAF4F0] block">
                  Letra &quot;{currentLetter}&quot; Ativa!
                </span>
                <span className="text-[11px] text-[#7D6F74] dark:text-[#B8A8AF]">
                  Todas as respostas devem começar com a letra {currentLetter}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {timerDuration > 0 && (
                <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border ${
                  timeLeft <= 15
                    ? 'bg-rose-100 text-rose-700 border-rose-400 animate-bounce'
                    : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 border-zinc-200 dark:border-zinc-700'
                }`}>
                  <Clock className="w-3.5 h-3.5" />
                  <span>{timeLeft}s</span>
                </div>
              )}

              <button
                type="button"
                onClick={() => handleStopCall('STOP!')}
                className="px-4 py-2 rounded-full bg-rose-600 hover:bg-rose-700 text-white font-black text-xs uppercase tracking-wider shadow-md hover:scale-105 active:scale-95 transition-all animate-pulse"
              >
                🛑 STOP!
              </button>
            </div>
          </div>

          {/* Questions Grid: Two Columns for PC or Tabs for Mobile */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Player 1 Column */}
            <div className="p-4 rounded-3xl bg-white dark:bg-[#20181D] border border-[var(--card-border)] space-y-3 shadow-xs">
              <div className="flex items-center gap-2 pb-2 border-b border-[var(--card-border)]">
                <span className="text-base">👩🏻</span>
                <h3 className="font-bold text-sm text-[#2D2327] dark:text-[#FAF4F0]">
                  {p1.nickname || p1.name}
                </h3>
              </div>

              <div className="space-y-2.5">
                {CATEGORIES.map((cat) => (
                  <div key={cat.id} className="space-y-1">
                    <label className="text-xs font-medium text-[#7D6F74] dark:text-[#B8A8AF] flex items-center gap-1.5">
                      <span>{cat.icon}</span>
                      <span>{cat.label}</span>
                    </label>
                    <input
                      type="text"
                      value={answersP1[cat.id] || ''}
                      onChange={(e) =>
                        setAnswersP1((prev) => ({ ...prev, [cat.id]: e.target.value }))
                      }
                      placeholder={cat.placeholder}
                      className="w-full px-3 py-1.5 rounded-xl bg-[var(--pill-bg)] border border-[var(--pill-border)] text-xs text-[#2D2327] dark:text-white outline-none focus:border-[var(--border-accent)]"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Player 2 Column */}
            <div className="p-4 rounded-3xl bg-white dark:bg-[#20181D] border border-[var(--card-border)] space-y-3 shadow-xs">
              <div className="flex items-center gap-2 pb-2 border-b border-[var(--card-border)]">
                <span className="text-base">🌸</span>
                <h3 className="font-bold text-sm text-[#2D2327] dark:text-[#FAF4F0]">
                  {p2.nickname || p2.name}
                </h3>
              </div>

              <div className="space-y-2.5">
                {CATEGORIES.map((cat) => (
                  <div key={cat.id} className="space-y-1">
                    <label className="text-xs font-medium text-[#7D6F74] dark:text-[#B8A8AF] flex items-center gap-1.5">
                      <span>{cat.icon}</span>
                      <span>{cat.label}</span>
                    </label>
                    <input
                      type="text"
                      value={answersP2[cat.id] || ''}
                      onChange={(e) =>
                        setAnswersP2((prev) => ({ ...prev, [cat.id]: e.target.value }))
                      }
                      placeholder={cat.placeholder}
                      className="w-full px-3 py-1.5 rounded-xl bg-[var(--pill-bg)] border border-[var(--pill-border)] text-xs text-[#2D2327] dark:text-white outline-none focus:border-[var(--border-accent)]"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SCORING & REVIEW PHASE */}
      {phase === 'scoring' && (
        <div className="w-full space-y-4 animate-in fade-in">
          <div className="p-4 rounded-3xl bg-rose-50/80 dark:bg-rose-950/40 border border-[var(--border-accent)] text-center space-y-1">
            <h3 className="font-bold text-sm text-[#2D2327] dark:text-[#FAF4F0] flex items-center justify-center gap-1.5">
              🛑 STOP Chamado! Hora de Conferir os Pontos!
            </h3>
            <p className="text-xs text-[#7D6F74] dark:text-[#B8A8AF]">
              Toque nos botões para ajustar: 10 pts (palavra única), 5 pts (repetida), 0 pts (em branco ou inválida).
            </p>
          </div>

          <div className="space-y-3">
            {CATEGORIES.map((cat) => {
              const a1 = answersP1[cat.id] || '-';
              const a2 = answersP2[cat.id] || '-';
              const score1 = scoresP1[cat.id] ?? 0;
              const score2 = scoresP2[cat.id] ?? 0;

              return (
                <div
                  key={cat.id}
                  className="p-3.5 rounded-2xl bg-white dark:bg-[#20181D] border border-[var(--card-border)] space-y-2"
                >
                  <div className="flex items-center justify-between text-xs font-bold text-[#2D2327] dark:text-[#FAF4F0]">
                    <span className="flex items-center gap-1.5">
                      {cat.icon} {cat.label} (Letra {currentLetter})
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    {/* P1 Answer & Score Toggle */}
                    <div className="p-2.5 rounded-xl bg-[var(--pill-bg)] border border-[var(--pill-border)] flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-[#7D6F74] block">{p1.nickname || p1.name}</span>
                        <span className="text-xs font-semibold text-[#2D2327] dark:text-white capitalize">
                          {a1}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        {[10, 5, 0].map((val) => (
                          <button
                            key={val}
                            type="button"
                            onClick={() =>
                              setScoresP1((prev) => ({ ...prev, [cat.id]: val }))
                            }
                            className={`px-2 py-0.5 rounded-lg text-[10px] font-bold ${
                              score1 === val
                                ? val === 10
                                  ? 'bg-emerald-500 text-white'
                                  : val === 5
                                  ? 'bg-amber-500 text-white'
                                  : 'bg-rose-500 text-white'
                                : 'bg-white dark:bg-black/20 text-[#7D6F74]'
                            }`}
                          >
                            {val}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* P2 Answer & Score Toggle */}
                    <div className="p-2.5 rounded-xl bg-[var(--pill-bg)] border border-[var(--pill-border)] flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-[#7D6F74] block">{p2.nickname || p2.name}</span>
                        <span className="text-xs font-semibold text-[#2D2327] dark:text-white capitalize">
                          {a2}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        {[10, 5, 0].map((val) => (
                          <button
                            key={val}
                            type="button"
                            onClick={() =>
                              setScoresP2((prev) => ({ ...prev, [cat.id]: val }))
                            }
                            className={`px-2 py-0.5 rounded-lg text-[10px] font-bold ${
                              score2 === val
                                ? val === 10
                                  ? 'bg-emerald-500 text-white'
                                  : val === 5
                                  ? 'bg-amber-500 text-white'
                                  : 'bg-rose-500 text-white'
                                : 'bg-white dark:bg-black/20 text-[#7D6F74]'
                            }`}
                          >
                            {val}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Subtotal & Confirm Button */}
          <div className="flex items-center justify-between p-4 rounded-3xl bg-white dark:bg-[#20181D] border border-[var(--card-border)]">
            <div className="text-xs text-[#7D6F74] dark:text-[#B8A8AF]">
              Subtotal da Rodada:{' '}
              <strong className="text-[var(--border-accent)]">{currentRoundScoreP1} pts</strong> ({p1.nickname || p1.name}) vs{' '}
              <strong className="text-rose-600">{currentRoundScoreP2} pts</strong> ({p2.nickname || p2.name})
            </div>
            <button
              type="button"
              onClick={handleFinishRound}
              className="px-5 py-2 rounded-full bg-[var(--border-accent)] text-white font-bold text-xs hover:brightness-105 shadow-xs"
            >
              Confirmar Pontos ✨
            </button>
          </div>
        </div>
      )}

      {/* RESULT PHASE */}
      {phase === 'result' && (
        <div className="w-full max-w-lg p-6 rounded-3xl bg-white dark:bg-[#20181D] border border-[var(--card-border)] text-center space-y-4 animate-in zoom-in-95 shadow-md">
          <div className="w-14 h-14 mx-auto rounded-3xl bg-gradient-to-tr from-amber-400 to-rose-500 flex items-center justify-center text-white text-2xl shadow-md">
            🏆
          </div>
          <h3 className="font-serif font-bold text-lg text-[#2D2327] dark:text-[#FAF4F0]">
            Fim da Rodada com a Letra {currentLetter}!
          </h3>

          <div className="grid grid-cols-2 gap-3 p-3 rounded-2xl bg-[var(--pill-bg)] border border-[var(--pill-border)]">
            <div className="text-center">
              <span className="text-xs font-semibold text-[#7D6F74] block">{p1.nickname || p1.name}</span>
              <span className="text-xl font-extrabold text-[var(--border-accent)]">
                +{currentRoundScoreP1} pts
              </span>
              <span className="text-[10px] text-[#A6999F] block">Total: {totalScoreP1}</span>
            </div>
            <div className="text-center">
              <span className="text-xs font-semibold text-[#7D6F74] block">{p2.nickname || p2.name}</span>
              <span className="text-xl font-extrabold text-rose-600">
                +{currentRoundScoreP2} pts
              </span>
              <span className="text-[10px] text-[#A6999F] block">Total: {totalScoreP2}</span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              setPhase('idle');
            }}
            className="w-full py-3 rounded-2xl bg-[var(--border-accent)] text-white font-bold text-xs shadow-md hover:brightness-105 transition-all flex items-center justify-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Próxima Rodada / Nova Letra 🎲</span>
          </button>
        </div>
      )}
    </div>
  );
};
