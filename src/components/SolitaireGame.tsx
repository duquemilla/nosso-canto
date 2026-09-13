import React, { useState, useEffect, useCallback } from 'react';
import {
  RotateCcw,
  Undo2,
  Trophy,
  Sparkles,
  Play,
  CheckCircle2,
  Clock,
  HelpCircle,
} from 'lucide-react';

export type Suit = 'hearts' | 'diamonds' | 'clubs' | 'spades';
export type CardColor = 'red' | 'black';

export interface Card {
  id: string;
  suit: Suit;
  rank: number; // 1 (Ace) to 13 (King)
  isFaceUp: boolean;
}

const SUIT_SYMBOLS: Record<Suit, string> = {
  hearts: '♥',
  diamonds: '♦',
  clubs: '♣',
  spades: '♠',
};

const SUIT_COLORS: Record<Suit, CardColor> = {
  hearts: 'red',
  diamonds: 'red',
  clubs: 'black',
  spades: 'black',
};

const RANK_LABELS: Record<number, string> = {
  1: 'A',
  2: '2',
  3: '3',
  4: '4',
  5: '5',
  6: '6',
  7: '7',
  8: '8',
  9: '9',
  10: '10',
  11: 'J',
  12: 'Q',
  13: 'K',
};

function createDeck(): Card[] {
  const suits: Suit[] = ['hearts', 'diamonds', 'clubs', 'spades'];
  const deck: Card[] = [];
  suits.forEach((suit) => {
    for (let rank = 1; rank <= 13; rank++) {
      deck.push({
        id: `${suit}-${rank}`,
        suit,
        rank,
        isFaceUp: false,
      });
    }
  });

  // Fisher-Yates shuffle
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }

  return deck;
}

interface GameState {
  tableau: Card[][];
  foundations: Card[][];
  stock: Card[];
  waste: Card[];
  moves: number;
}

export const SolitaireGame: React.FC = () => {
  const [tableau, setTableau] = useState<Card[][]>([]);
  const [foundations, setFoundations] = useState<Card[][]>([[], [], [], []]);
  const [stock, setStock] = useState<Card[]>([]);
  const [waste, setWaste] = useState<Card[]>([]);
  const [selected, setSelected] = useState<{
    source: 'tableau' | 'waste';
    colIndex?: number;
    cardIndex?: number;
  } | null>(null);

  const [moves, setMoves] = useState(0);
  const [seconds, setSeconds] = useState(0);
  const [isWon, setIsWon] = useState(false);
  const [history, setHistory] = useState<GameState[]>([]);

  // Start a new game
  const initGame = useCallback(() => {
    const deck = createDeck();
    const newTableau: Card[][] = [[], [], [], [], [], [], []];

    // Deal to tableau (col 0: 1 card, col 1: 2 cards, ..., col 6: 7 cards)
    for (let col = 0; col < 7; col++) {
      for (let row = 0; row <= col; row++) {
        const card = deck.pop()!;
        if (row === col) {
          card.isFaceUp = true;
        }
        newTableau[col].push(card);
      }
    }

    setTableau(newTableau);
    setFoundations([[], [], [], []]);
    setStock(deck);
    setWaste([]);
    setSelected(null);
    setMoves(0);
    setSeconds(0);
    setIsWon(false);
    setHistory([]);
  }, []);

  useEffect(() => {
    initGame();
  }, [initGame]);

  // Timer
  useEffect(() => {
    if (isWon) return;
    const interval = setInterval(() => {
      setSeconds((s) => s + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isWon]);

  // Save state before a valid move
  const pushHistory = () => {
    setHistory((prev) => [
      ...prev.slice(-15), // keep last 15 states
      {
        tableau: tableau.map((col) => col.map((c) => ({ ...c }))),
        foundations: foundations.map((f) => f.map((c) => ({ ...c }))),
        stock: stock.map((c) => ({ ...c })),
        waste: waste.map((c) => ({ ...c })),
        moves,
      },
    ]);
  };

  // Undo move
  const handleUndo = () => {
    if (history.length === 0) return;
    const last = history[history.length - 1];
    setTableau(last.tableau);
    setFoundations(last.foundations);
    setStock(last.stock);
    setWaste(last.waste);
    setMoves(last.moves);
    setSelected(null);
    setHistory((prev) => prev.slice(0, -1));
  };

  // Check victory condition (all 4 foundations have 13 cards)
  useEffect(() => {
    const totalInFoundations = foundations.reduce((acc, curr) => acc + curr.length, 0);
    if (totalInFoundations === 52) {
      setIsWon(true);
    }
  }, [foundations]);

  // Stock draw
  const handleStockClick = () => {
    pushHistory();
    if (stock.length > 0) {
      const card = { ...stock[stock.length - 1], isFaceUp: true };
      setStock((s) => s.slice(0, -1));
      setWaste((w) => [...w, card]);
    } else {
      // Recycle waste into stock face down
      const recycled = [...waste].reverse().map((c) => ({ ...c, isFaceUp: false }));
      setStock(recycled);
      setWaste([]);
    }
    setMoves((m) => m + 1);
    setSelected(null);
  };

  // Smart Auto-Move on Double Click or Single Tap: tries to move card to foundation first, then to tableau
  const tryAutoMove = (card: Card, sourceCol?: number, cardIdx?: number) => {
    // 1. Try to send to foundation
    for (let f = 0; f < 4; f++) {
      const pile = foundations[f];
      const top = pile.length > 0 ? pile[pile.length - 1] : null;

      if (!top && card.rank === 1) {
        // Empty foundation accepts Ace
        pushHistory();
        executeMoveToFoundation(card, f, sourceCol, cardIdx);
        return true;
      } else if (top && top.suit === card.suit && card.rank === top.rank + 1) {
        pushHistory();
        executeMoveToFoundation(card, f, sourceCol, cardIdx);
        return true;
      }
    }

    // 2. Try to move to another tableau column
    if (sourceCol !== undefined) {
      for (let t = 0; t < 7; t++) {
        if (t === sourceCol) continue;
        const targetCol = tableau[t];
        const topTarget = targetCol.length > 0 ? targetCol[targetCol.length - 1] : null;

        if (!topTarget && card.rank === 13) {
          // Empty column accepts King
          pushHistory();
          executeMoveToTableau(sourceCol, cardIdx!, t);
          return true;
        } else if (
          topTarget &&
          topTarget.isFaceUp &&
          SUIT_COLORS[topTarget.suit] !== SUIT_COLORS[card.suit] &&
          topTarget.rank === card.rank + 1
        ) {
          pushHistory();
          executeMoveToTableau(sourceCol, cardIdx!, t);
          return true;
        }
      }
    } else {
      // Card is from waste
      for (let t = 0; t < 7; t++) {
        const targetCol = tableau[t];
        const topTarget = targetCol.length > 0 ? targetCol[targetCol.length - 1] : null;

        if (!topTarget && card.rank === 13) {
          pushHistory();
          setWaste((w) => w.slice(0, -1));
          setTableau((prev) => {
            const next = prev.map((col) => [...col]);
            next[t].push(card);
            return next;
          });
          setMoves((m) => m + 1);
          setSelected(null);
          return true;
        } else if (
          topTarget &&
          topTarget.isFaceUp &&
          SUIT_COLORS[topTarget.suit] !== SUIT_COLORS[card.suit] &&
          topTarget.rank === card.rank + 1
        ) {
          pushHistory();
          setWaste((w) => w.slice(0, -1));
          setTableau((prev) => {
            const next = prev.map((col) => [...col]);
            next[t].push(card);
            return next;
          });
          setMoves((m) => m + 1);
          setSelected(null);
          return true;
        }
      }
    }

    return false;
  };

  const executeMoveToFoundation = (
    card: Card,
    fIndex: number,
    sourceCol?: number,
    cardIdx?: number
  ) => {
    setFoundations((prev) => {
      const next = prev.map((pile) => [...pile]);
      next[fIndex].push(card);
      return next;
    });

    if (sourceCol !== undefined && cardIdx !== undefined) {
      setTableau((prev) => {
        const next = prev.map((col) => [...col]);
        next[sourceCol].splice(cardIdx, 1);
        if (next[sourceCol].length > 0) {
          next[sourceCol][next[sourceCol].length - 1].isFaceUp = true;
        }
        return next;
      });
    } else {
      setWaste((w) => w.slice(0, -1));
    }
    setMoves((m) => m + 1);
    setSelected(null);
  };

  const executeMoveToTableau = (sourceCol: number, cardIdx: number, targetCol: number) => {
    setTableau((prev) => {
      const next = prev.map((col) => [...col]);
      const moving = next[sourceCol].splice(cardIdx);
      if (next[sourceCol].length > 0) {
        next[sourceCol][next[sourceCol].length - 1].isFaceUp = true;
      }
      next[targetCol].push(...moving);
      return next;
    });
    setMoves((m) => m + 1);
    setSelected(null);
  };

  // Card click handler (selection or placement)
  const handleCardClick = (
    source: 'tableau' | 'waste' | 'foundation',
    colIndex?: number,
    cardIndex?: number
  ) => {
    if (source === 'waste') {
      if (waste.length === 0) return;
      const card = waste[waste.length - 1];
      if (selected?.source === 'waste') {
        // try auto move
        tryAutoMove(card);
      } else {
        setSelected({ source: 'waste' });
      }
    } else if (source === 'tableau' && colIndex !== undefined) {
      const col = tableau[colIndex];
      const clickedCard = cardIndex !== undefined ? col[cardIndex] : null;

      // If clicked card is face down, flip if top
      if (clickedCard && !clickedCard.isFaceUp) {
        if (cardIndex === col.length - 1) {
          pushHistory();
          setTableau((prev) => {
            const next = prev.map((c) => [...c]);
            next[colIndex][cardIndex].isFaceUp = true;
            return next;
          });
        }
        return;
      }

      // If there's an active selection, attempt move
      if (selected) {
        let movingCards: Card[] = [];
        let sourceCol = selected.colIndex;
        let sourceIdx = selected.cardIndex;

        if (selected.source === 'waste' && waste.length > 0) {
          movingCards = [waste[waste.length - 1]];
        } else if (selected.source === 'tableau' && sourceCol !== undefined && sourceIdx !== undefined) {
          movingCards = tableau[sourceCol].slice(sourceIdx);
        }

        if (movingCards.length > 0) {
          const leadCard = movingCards[0];
          const topTarget = col.length > 0 ? col[col.length - 1] : null;

          let valid = false;
          if (!topTarget && leadCard.rank === 13) {
            valid = true;
          } else if (
            topTarget &&
            topTarget.isFaceUp &&
            SUIT_COLORS[topTarget.suit] !== SUIT_COLORS[leadCard.suit] &&
            topTarget.rank === leadCard.rank + 1
          ) {
            valid = true;
          }

          if (valid) {
            pushHistory();
            if (selected.source === 'waste') {
              setWaste((w) => w.slice(0, -1));
              setTableau((prev) => {
                const next = prev.map((c) => [...c]);
                next[colIndex].push(...movingCards);
                return next;
              });
            } else if (sourceCol !== undefined && sourceIdx !== undefined) {
              setTableau((prev) => {
                const next = prev.map((c) => [...c]);
                next[sourceCol].splice(sourceIdx);
                if (next[sourceCol].length > 0) {
                  next[sourceCol][next[sourceCol].length - 1].isFaceUp = true;
                }
                next[colIndex].push(...movingCards);
                return next;
              });
            }
            setMoves((m) => m + 1);
            setSelected(null);
            return;
          }
        }
      }

      // If no valid placement, select or auto-move
      if (clickedCard && clickedCard.isFaceUp) {
        if (
          selected?.source === 'tableau' &&
          selected.colIndex === colIndex &&
          selected.cardIndex === cardIndex
        ) {
          // Double tapped: try auto move to foundation
          tryAutoMove(clickedCard, colIndex, cardIndex);
        } else {
          setSelected({ source: 'tableau', colIndex, cardIndex });
        }
      }
    } else if (source === 'foundation' && colIndex !== undefined) {
      // Place selected card into foundation
      if (selected) {
        let card: Card | null = null;
        if (selected.source === 'waste' && waste.length > 0) {
          card = waste[waste.length - 1];
        } else if (
          selected.source === 'tableau' &&
          selected.colIndex !== undefined &&
          selected.cardIndex !== undefined
        ) {
          const col = tableau[selected.colIndex];
          if (selected.cardIndex === col.length - 1) {
            card = col[selected.cardIndex];
          }
        }

        if (card) {
          const pile = foundations[colIndex];
          const top = pile.length > 0 ? pile[pile.length - 1] : null;

          if ((!top && card.rank === 1) || (top && top.suit === card.suit && card.rank === top.rank + 1)) {
            pushHistory();
            executeMoveToFoundation(card, colIndex, selected.colIndex, selected.cardIndex);
          }
        }
      }
    }
  };

  // Format timer MM:SS
  const formatTime = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const s = sec % 60;
    return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Check if can auto-complete (all cards in tableau face-up)
  const canAutoComplete = tableau.every((col) => col.every((c) => c.isFaceUp));

  const handleAutoComplete = () => {
    let changed = true;
    let currTableau = tableau.map((col) => [...col]);
    let currFoundations = foundations.map((f) => [...f]);
    let currWaste = [...waste];

    while (changed) {
      changed = false;
      // check waste
      if (currWaste.length > 0) {
        const wCard = currWaste[currWaste.length - 1];
        for (let f = 0; f < 4; f++) {
          const top = currFoundations[f].length > 0 ? currFoundations[f][currFoundations[f].length - 1] : null;
          if ((!top && wCard.rank === 1) || (top && top.suit === wCard.suit && wCard.rank === top.rank + 1)) {
            currFoundations[f].push(wCard);
            currWaste.pop();
            changed = true;
            break;
          }
        }
      }

      // check tableau
      for (let c = 0; c < 7; c++) {
        if (currTableau[c].length > 0) {
          const card = currTableau[c][currTableau[c].length - 1];
          for (let f = 0; f < 4; f++) {
            const top = currFoundations[f].length > 0 ? currFoundations[f][currFoundations[f].length - 1] : null;
            if ((!top && card.rank === 1) || (top && top.suit === card.suit && card.rank === top.rank + 1)) {
              currFoundations[f].push(card);
              currTableau[c].pop();
              changed = true;
              break;
            }
          }
        }
      }
    }

    setTableau(currTableau);
    setFoundations(currFoundations);
    setWaste(currWaste);
  };

  return (
    <div className="flex flex-col items-center p-2 sm:p-4 max-w-4xl mx-auto select-none">
      {/* Top Header Card */}
      <div className="w-full flex items-center justify-between gap-3 mb-4 bg-white dark:bg-[#241C21] p-3 sm:p-4 rounded-2xl border border-[#F2E8E4] dark:border-[#3D2F36] shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-700 flex items-center justify-center text-white shadow-xs text-xl">
            ♠
          </div>
          <div>
            <h2 className="font-serif font-bold text-lg text-[#2D2327] dark:text-[#FAF4F0]">
              Paciência Clássica (Solitaire)
            </h2>
            <p className="text-xs text-[#7D6F74] dark:text-[#B8A8AF]">
              Ordene as 4 fundações de Ás até o Rei por naipe!
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {canAutoComplete && !isWon && (
            <button
              onClick={handleAutoComplete}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-xs font-bold text-white shadow-xs animate-bounce transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Auto-Completar</span>
            </button>
          )}

          <button
            onClick={handleUndo}
            disabled={history.length === 0}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 disabled:opacity-40 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-xs font-semibold text-[#2D2327] dark:text-[#FAF4F0] transition-colors"
            title="Desfazer jogada"
          >
            <Undo2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Desfazer</span>
          </button>

          <button
            onClick={initGame}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#E07A8B] hover:bg-[#d66a7c] text-xs font-semibold text-white shadow-2xs transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Novo Jogo</span>
          </button>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="w-full flex items-center justify-between text-xs px-2 mb-3 text-[#7D6F74] dark:text-[#B8A8AF]">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            Tempo: <strong className="text-[#2D2327] dark:text-[#FAF4F0] font-mono">{formatTime(seconds)}</strong>
          </span>
          <span>
            Movimentos: <strong className="text-[#2D2327] dark:text-[#FAF4F0] font-mono">{moves}</strong>
          </span>
        </div>
        <p className="text-[11px] hidden sm:block italic">
          Toque duas vezes numa carta para enviá-la automaticamente à fundação!
        </p>
      </div>

      {/* Game Table (Felt Green Atmosphere) */}
      <div className="w-full bg-[#1A472A] dark:bg-[#112F1C] p-3 sm:p-5 rounded-3xl border-4 border-[#0F301B] shadow-2xl space-y-6">
        {/* Top Row: Stock, Waste, and 4 Foundations */}
        <div className="grid grid-cols-7 gap-2 sm:gap-3">
          {/* Stock */}
          <div
            onClick={handleStockClick}
            className="aspect-[5/7] rounded-xl border-2 border-emerald-600/60 bg-emerald-900/40 flex items-center justify-center cursor-pointer hover:border-emerald-400 transition-colors relative shadow-md"
          >
            {stock.length > 0 ? (
              <div className="w-full h-full rounded-lg bg-gradient-to-br from-rose-700 to-rose-900 border-2 border-rose-300 flex items-center justify-center text-white/80 font-bold text-xs shadow-inner">
                <span className="font-serif">🂠</span>
              </div>
            ) : (
              <RotateCcw className="w-5 h-5 text-emerald-300/60" />
            )}
            <span className="absolute bottom-1 right-1.5 text-[9px] font-mono font-bold text-emerald-200/60">
              {stock.length}
            </span>
          </div>

          {/* Waste Pile */}
          <div
            onClick={() => handleCardClick('waste')}
            className={`aspect-[5/7] rounded-xl border-2 border-emerald-600/40 bg-emerald-900/30 flex items-center justify-center cursor-pointer relative ${
              selected?.source === 'waste' ? 'ring-2 ring-yellow-300 shadow-lg' : ''
            }`}
          >
            {waste.length > 0 && (
              <SolitaireCardView card={waste[waste.length - 1]} isSelected={selected?.source === 'waste'} />
            )}
          </div>

          {/* Spacer */}
          <div />

          {/* 4 Foundations */}
          {foundations.map((pile, idx) => {
            const suitSymbols = ['♥', '♦', '♣', '♠'];
            const suitColors = ['text-rose-400', 'text-rose-400', 'text-zinc-300', 'text-zinc-300'];
            const top = pile.length > 0 ? pile[pile.length - 1] : null;

            return (
              <div
                key={idx}
                onClick={() => handleCardClick('foundation', idx)}
                className="aspect-[5/7] rounded-xl border-2 border-emerald-600/50 bg-emerald-900/30 flex items-center justify-center cursor-pointer relative hover:border-yellow-400/60 transition-colors shadow-inner"
              >
                {top ? (
                  <SolitaireCardView card={top} />
                ) : (
                  <span className={`text-xl sm:text-2xl font-bold opacity-30 ${suitColors[idx]}`}>
                    {suitSymbols[idx]}
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {/* Bottom Row: 7 Tableau Columns */}
        <div className="grid grid-cols-7 gap-2 sm:gap-3 min-h-[300px]">
          {tableau.map((col, colIdx) => (
            <div
              key={colIdx}
              onClick={() => {
                if (col.length === 0) {
                  handleCardClick('tableau', colIdx);
                }
              }}
              className="relative min-h-[140px] rounded-xl border border-dashed border-emerald-700/50 bg-emerald-900/10 cursor-pointer"
            >
              {col.map((card, cardIdx) => {
                const isSelected =
                  selected?.source === 'tableau' &&
                  selected.colIndex === colIdx &&
                  cardIdx >= (selected.cardIndex || 0);

                return (
                  <div
                    key={card.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCardClick('tableau', colIdx, cardIdx);
                    }}
                    className="absolute w-full"
                    style={{ top: `${cardIdx * 20}px` }}
                  >
                    <SolitaireCardView card={card} isSelected={isSelected} />
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Win Celebration Modal */}
      {isWon && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#241C21] rounded-3xl max-w-md w-full p-6 border border-[#F2E8E4] dark:border-[#3D2F36] shadow-2xl text-center space-y-4 animate-in zoom-in-95">
            <Trophy className="w-16 h-16 text-yellow-400 mx-auto animate-bounce" />
            <h3 className="font-serif font-bold text-2xl text-[#2D2327] dark:text-[#FAF4F0]">
              Vitória na Paciência! 🎉
            </h3>
            <p className="text-sm text-[#7D6F74] dark:text-[#B8A8AF]">
              Você completou todos os 4 naipes em <strong>{formatTime(seconds)}</strong> com{' '}
              <strong>{moves}</strong> movimentos!
            </p>
            <button
              onClick={initGame}
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-bold shadow-lg transition-all"
            >
              Jogar Nova Partida
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// Subcomponent for rendering individual playing card
const SolitaireCardView: React.FC<{ card: Card; isSelected?: boolean }> = ({
  card,
  isSelected = false,
}) => {
  if (!card.isFaceUp) {
    return (
      <div className="w-full aspect-[5/7] rounded-xl bg-gradient-to-br from-rose-800 via-rose-900 to-red-950 border-2 border-rose-300/80 shadow-md flex items-center justify-center text-rose-200 select-none">
        <div className="w-5/6 h-5/6 border border-rose-400/40 rounded-lg flex items-center justify-center font-serif text-sm">
          ✦
        </div>
      </div>
    );
  }

  const isRed = SUIT_COLORS[card.suit] === 'red';

  return (
    <div
      className={`w-full aspect-[5/7] rounded-xl bg-white border-2 flex flex-col justify-between p-1 sm:p-1.5 shadow-md select-none transition-transform ${
        isSelected
          ? 'border-yellow-400 ring-2 ring-yellow-400 -translate-y-1'
          : 'border-zinc-200 hover:border-zinc-400'
      }`}
    >
      <div className={`flex items-center justify-between font-bold text-xs sm:text-sm leading-none ${isRed ? 'text-rose-600' : 'text-zinc-900'}`}>
        <span>{RANK_LABELS[card.rank]}</span>
        <span className="text-xs">{SUIT_SYMBOLS[card.suit]}</span>
      </div>

      <div className={`self-center text-lg sm:text-2xl font-bold leading-none ${isRed ? 'text-rose-600' : 'text-zinc-900'}`}>
        {SUIT_SYMBOLS[card.suit]}
      </div>

      <div className={`flex items-center justify-between font-bold text-xs sm:text-sm leading-none rotate-180 ${isRed ? 'text-rose-600' : 'text-zinc-900'}`}>
        <span>{RANK_LABELS[card.rank]}</span>
        <span className="text-xs">{SUIT_SYMBOLS[card.suit]}</span>
      </div>
    </div>
  );
};
