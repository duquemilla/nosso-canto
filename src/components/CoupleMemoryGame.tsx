import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Trophy,
  RotateCcw,
  Timer,
  CheckCircle2,
  Star,
  Flame,
  ChevronRight,
  ChevronLeft,
} from 'lucide-react';
import { CoupleProfile, PartnerId } from '../types';

interface MemoryCard {
  id: string;
  pairKey: string;
  label: string;
  icon: string;
  isFlipped: boolean;
  isMatched: boolean;
}

const ALL_PAIR_ITEMS = [
  { key: 'casa', label: 'Nosso Lar', icon: '🏡' },
  { key: 'alianca', label: 'Alianças', icon: '💍' },
  { key: 'cinema', label: 'Pipoca & Filme', icon: '🍿' },
  { key: 'viagem', label: 'Mala de Férias', icon: '✈️' },
  { key: 'vinho', label: 'Brinde a Dois', icon: '🍷' },
  { key: 'cafe', label: 'Café na Cama', icon: '☕' },
  { key: 'praia', label: 'Pôr do Sol', icon: '🌅' },
  { key: 'sushi', label: 'Jantarzinho', icon: '🍣' },
  { key: 'chocolate', label: 'Doce de Amor', icon: '🍫' },
  { key: 'foto', label: 'Foto no Álbum', icon: '📸' },
  { key: 'musica', label: 'Trilha Sonora', icon: '🎵' },
  { key: 'coracao', label: 'Coração Quentinho', icon: '💖' },
];

const MEMORY_LEVELS = [
  { level: 1, name: 'Começo Fofo', pairsCount: 3, gridCols: 'grid-cols-3' },
  { level: 2, name: 'Amor Doce', pairsCount: 4, gridCols: 'grid-cols-4' },
  { level: 3, name: 'Nosso Lar', pairsCount: 5, gridCols: 'grid-cols-5' },
  { level: 4, name: 'Viagens & Risadas', pairsCount: 6, gridCols: 'grid-cols-4' },
  { level: 5, name: 'Casal Perfeito', pairsCount: 8, gridCols: 'grid-cols-4' },
  { level: 6, name: 'Modo Expert', pairsCount: 10, gridCols: 'grid-cols-5' },
];

export const CoupleMemoryGame: React.FC<{ profile: CoupleProfile; activePartner: PartnerId }> = ({
  profile,
  activePartner,
}) => {
  const [currentLevelIdx, setCurrentLevelIdx] = useState<number>(0);
  const [cards, setCards] = useState<MemoryCard[]>([]);
  const [flippedIndices, setFlippedIndices] = useState<number[]>([]);
  const [moves, setMoves] = useState<number>(0);
  const [seconds, setSeconds] = useState<number>(0);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);
  const [isWon, setIsWon] = useState<boolean>(false);

  const levelConfig = MEMORY_LEVELS[currentLevelIdx] || MEMORY_LEVELS[0];

  // Initialize deck for current level
  const initLevel = () => {
    const selectedPairs = ALL_PAIR_ITEMS.slice(0, levelConfig.pairsCount);
    const deck: MemoryCard[] = [];

    selectedPairs.forEach((item, idx) => {
      deck.push({
        id: `card-${idx}-a`,
        pairKey: item.key,
        label: item.label,
        icon: item.icon,
        isFlipped: false,
        isMatched: false,
      });
      deck.push({
        id: `card-${idx}-b`,
        pairKey: item.key,
        label: item.label,
        icon: item.icon,
        isFlipped: false,
        isMatched: false,
      });
    });

    // Shuffle deck
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }

    setCards(deck);
    setFlippedIndices([]);
    setMoves(0);
    setSeconds(0);
    setIsTimerRunning(false);
    setIsWon(false);
  };

  useEffect(() => {
    initLevel();
  }, [currentLevelIdx]);

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isTimerRunning && !isWon) {
      interval = setInterval(() => {
        setSeconds((s) => s + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTimerRunning, isWon]);

  const handleCardClick = (index: number) => {
    if (isWon) return;
    const card = cards[index];
    if (card.isMatched || card.isFlipped) return;
    if (flippedIndices.length >= 2) return;

    if (!isTimerRunning) {
      setIsTimerRunning(true);
    }

    const newCards = [...cards];
    newCards[index].isFlipped = true;
    setCards(newCards);

    const newFlipped = [...flippedIndices, index];
    setFlippedIndices(newFlipped);

    if (newFlipped.length === 2) {
      setMoves((m) => m + 1);
      const [firstIdx, secondIdx] = newFlipped;
      const firstCard = newCards[firstIdx];
      const secondCard = newCards[secondIdx];

      if (firstCard.pairKey === secondCard.pairKey) {
        // Match!
        setTimeout(() => {
          setCards((prev) => {
            const updated = [...prev];
            updated[firstIdx].isMatched = true;
            updated[secondIdx].isMatched = true;

            // Check if all matched
            if (updated.every((c) => c.isMatched)) {
              setIsWon(true);
              setIsTimerRunning(false);
            }
            return updated;
          });
          setFlippedIndices([]);
        }, 400);
      } else {
        // No match - flip back
        setTimeout(() => {
          setCards((prev) => {
            const updated = [...prev];
            updated[firstIdx].isFlipped = false;
            updated[secondIdx].isFlipped = false;
            return updated;
          });
          setFlippedIndices([]);
        }, 900);
      }
    }
  };

  const formatTime = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className="space-y-5 max-w-2xl mx-auto">
      {/* Level bar & Header */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 rounded-3xl bg-white dark:bg-[#241C21] border border-[#F2E8E4] dark:border-[#3D2F36] shadow-2xs">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentLevelIdx((i) => Math.max(0, i - 1))}
            disabled={currentLevelIdx <= 0}
            className="p-2 rounded-xl border border-[#F2E8E4] dark:border-[#3D2F36] text-[#7D6F74] dark:text-[#B8A8AF] disabled:opacity-40 transition-all"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <div className="px-3.5 py-1.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200/80 dark:border-rose-900/50">
            <span className="font-serif font-bold text-sm text-[#2D2327] dark:text-[#FAF4F0]">
              Nível {levelConfig.level}: {levelConfig.name}
            </span>
            <span className="text-[10px] text-rose-600 dark:text-rose-300 block">
              {levelConfig.pairsCount} pares para encontrar
            </span>
          </div>

          <button
            onClick={() =>
              setCurrentLevelIdx((i) => Math.min(MEMORY_LEVELS.length - 1, i + 1))
            }
            disabled={currentLevelIdx >= MEMORY_LEVELS.length - 1}
            className="p-2 rounded-xl border border-[#F2E8E4] dark:border-[#3D2F36] text-[#7D6F74] dark:text-[#B8A8AF] disabled:opacity-40 transition-all"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Moves & Timer */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-[#FAF8F5] dark:bg-[#2A2026] border border-[#F2E8E4] dark:border-[#3D2F36] text-xs font-semibold text-[#7D6F74] dark:text-[#B8A8AF]">
            <Timer className="w-4 h-4 text-rose-500" />
            <span>{formatTime(seconds)}</span>
          </div>

          <div className="px-3 py-1.5 rounded-2xl bg-[#FAF8F5] dark:bg-[#2A2026] border border-[#F2E8E4] dark:border-[#3D2F36] text-xs font-semibold text-[#7D6F74] dark:text-[#B8A8AF]">
            <span>{moves} jogadas</span>
          </div>

          <button
            onClick={initLevel}
            className="p-2 rounded-2xl border border-[#F2E8E4] dark:border-[#3D2F36] text-[#7D6F74] dark:text-[#B8A8AF] hover:bg-[#FAF3EC] dark:hover:bg-[#2C2127] transition-all"
            title="Recomeçar jogo"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Cards Matrix */}
      <div className="p-4 sm:p-6 rounded-3xl bg-white dark:bg-[#241C21] border border-[#F2E8E4] dark:border-[#3D2F36] shadow-sm">
        <div
          className={`grid ${
            levelConfig.pairsCount <= 4
              ? 'grid-cols-4'
              : levelConfig.pairsCount <= 6
              ? 'grid-cols-4 sm:grid-cols-4'
              : 'grid-cols-4 sm:grid-cols-5'
          } gap-2.5 sm:gap-3.5`}
        >
          {cards.map((card, idx) => {
            const isRevealed = card.isFlipped || card.isMatched;
            return (
              <button
                key={card.id}
                type="button"
                onClick={() => handleCardClick(idx)}
                className={`aspect-square rounded-2xl p-2 font-semibold text-xs flex flex-col items-center justify-center transition-all duration-300 transform select-none touch-manipulation shadow-2xs ${
                  card.isMatched
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 border-2 border-emerald-300 dark:border-emerald-800 scale-98 opacity-90'
                    : isRevealed
                    ? 'bg-rose-50 dark:bg-rose-950/70 border-2 border-rose-400 dark:border-rose-700 shadow-md scale-102'
                    : 'bg-gradient-to-tr from-[#FAF3EC] to-[#F5EBE6] dark:from-[#2A2026] dark:to-[#352830] border border-[#E8DFD8] dark:border-[#42323B] hover:scale-102 active:scale-95'
                }`}
              >
                {isRevealed ? (
                  <div className="flex flex-col items-center justify-center space-y-1 animate-in zoom-in-75 duration-150">
                    <span className="text-2xl sm:text-3xl">{card.icon}</span>
                    <span className="text-[10px] sm:text-[11px] text-[#2D2327] dark:text-[#FAF4F0] text-center font-medium line-clamp-1">
                      {card.label}
                    </span>
                  </div>
                ) : (
                  <span className="text-xl sm:text-2xl opacity-40">💕</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Win Modal */}
      {isWon && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-sm rounded-3xl bg-[#FAF8F5] dark:bg-[#20181D] border border-rose-200 dark:border-rose-900 shadow-2xl p-6 text-center">
            <div className="w-14 h-14 rounded-3xl bg-gradient-to-tr from-amber-400 to-rose-400 text-white flex items-center justify-center mx-auto mb-3 shadow-md">
              <Trophy className="w-7 h-7" />
            </div>

            <h3 className="font-serif font-bold text-xl text-[#2D2327] dark:text-[#FAF4F0] mb-1">
              Parabéns, Amadas! 🎉
            </h3>
            <p className="text-xs text-[#7D6F74] dark:text-[#B8A8AF] mb-4">
              Vocês encontraram todos os pares em <strong>{moves} jogadas</strong> e{' '}
              <strong>{formatTime(seconds)}</strong>!
            </p>

            <div className="flex items-center justify-center gap-2 mb-5">
              <Star className="w-7 h-7 fill-amber-400 text-amber-400" />
              <Star className="w-7 h-7 fill-amber-400 text-amber-400" />
              <Star className="w-7 h-7 fill-amber-400 text-amber-400" />
            </div>

            {currentLevelIdx < MEMORY_LEVELS.length - 1 ? (
              <button
                onClick={() => setCurrentLevelIdx((i) => i + 1)}
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-[#E07A8B] to-[#F4A6B3] text-white font-semibold text-xs shadow-md active:scale-98 transition-all flex items-center justify-center gap-2"
              >
                <span>Próximo Nível (Nível {currentLevelIdx + 2})</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={initLevel}
                className="w-full py-3 rounded-2xl bg-[#E07A8B] text-white font-semibold text-xs shadow-md active:scale-98 transition-all"
              >
                Jogar Novamente
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
