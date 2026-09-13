import React, { useState, useEffect, useCallback } from 'react';
import {
  RotateCcw,
  Trophy,
  Sparkles,
  HelpCircle,
  ArrowRight,
  ShieldAlert,
  Layers,
  CheckCircle2,
  Bot,
  User,
  Crown,
  Eye,
  EyeOff,
  Lock,
  Users,
} from 'lucide-react';
import { CoupleProfile, PartnerId } from '../types';

export type BuracoSuit = 'hearts' | 'diamonds' | 'clubs' | 'spades';

export interface BuracoCard {
  id: string;
  suit: BuracoSuit;
  rank: number; // 1 (Ace) to 13 (King)
}

export interface Meld {
  id: string;
  suit: BuracoSuit;
  cards: BuracoCard[];
  isClean: boolean; // Canastra limpa (7+ cards without wildcard 2)
  isDirty: boolean; // Canastra suja (7+ cards with wildcard 2)
}

const SUIT_SYMBOLS: Record<BuracoSuit, string> = {
  hearts: '♥',
  diamonds: '♦',
  clubs: '♣',
  spades: '♠',
};

const SUIT_COLORS: Record<BuracoSuit, 'red' | 'black'> = {
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

// Points per card in Buraco
function getCardPoints(card: BuracoCard): number {
  if (card.rank === 1) return 15; // Ás
  if (card.rank === 2) return 10; // Coringa 2
  if (card.rank >= 8 && card.rank <= 13) return 10; // 8, 9, 10, J, Q, K
  return 5; // 3, 4, 5, 6, 7
}

// Build 2 decks (104 cards)
function createDoubleDeck(): BuracoCard[] {
  const suits: BuracoSuit[] = ['hearts', 'diamonds', 'clubs', 'spades'];
  const deck: BuracoCard[] = [];
  let idCounter = 1;

  for (let deckNum = 1; deckNum <= 2; deckNum++) {
    suits.forEach((suit) => {
      for (let rank = 1; rank <= 13; rank++) {
        deck.push({
          id: `${suit}-${rank}-${deckNum}-${idCounter++}`,
          suit,
          rank,
        });
      }
    });
  }

  // Shuffle
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }

  return deck;
}

// Sort cards by suit then rank
function sortBuracoHand(cards: BuracoCard[]): BuracoCard[] {
  const suitOrder: Record<BuracoSuit, number> = { hearts: 0, diamonds: 1, clubs: 2, spades: 3 };
  return [...cards].sort((a, b) => {
    if (suitOrder[a.suit] !== suitOrder[b.suit]) {
      return suitOrder[a.suit] - suitOrder[b.suit];
    }
    return a.rank - b.rank;
  });
}

// Check if a list of cards forms a valid sequence in Buraco
function isValidSequence(cards: BuracoCard[]): { valid: boolean; suit: BuracoSuit; hasWildcard: boolean } {
  if (cards.length < 3) return { valid: false, suit: 'hearts', hasWildcard: false };

  const wildcards = cards.filter((c) => c.rank === 2);
  const regulars = cards.filter((c) => c.rank !== 2);

  if (wildcards.length > 1) {
    return { valid: false, suit: 'hearts', hasWildcard: true };
  }

  if (regulars.length === 0) {
    return { valid: false, suit: 'hearts', hasWildcard: true };
  }

  const dominantSuit = regulars[0].suit;
  if (regulars.some((c) => c.suit !== dominantSuit)) {
    return { valid: false, suit: dominantSuit, hasWildcard: wildcards.length > 0 };
  }

  const sortedRegs = [...regulars].sort((a, b) => a.rank - b.rank);
  for (let i = 0; i < sortedRegs.length - 1; i++) {
    if (sortedRegs[i].rank === sortedRegs[i + 1].rank) {
      return { valid: false, suit: dominantSuit, hasWildcard: wildcards.length > 0 };
    }
  }

  let gaps = 0;
  for (let i = 0; i < sortedRegs.length - 1; i++) {
    const diff = sortedRegs[i + 1].rank - sortedRegs[i].rank;
    if (diff > 1) {
      gaps += diff - 1;
    }
  }

  if (gaps === 0) {
    return { valid: true, suit: dominantSuit, hasWildcard: wildcards.length > 0 };
  } else if (gaps === 1 && wildcards.length === 1) {
    return { valid: true, suit: dominantSuit, hasWildcard: true };
  }

  return { valid: false, suit: dominantSuit, hasWildcard: wildcards.length > 0 };
}

export type BuracoGameMode = 'couple_pass' | 'couple_coop' | 'solo_bot';

export const BuracoGame: React.FC<{ profile: CoupleProfile; activePartner: PartnerId }> = ({
  profile,
  activePartner,
}) => {
  const p1 = profile.partner1;
  const p2 = profile.partner2;

  const [gameMode, setGameMode] = useState<BuracoGameMode>('couple_pass');

  // Decks and hands
  const [stock, setStock] = useState<BuracoCard[]>([]);
  const [discardPile, setDiscardPile] = useState<BuracoCard[]>([]);

  // Hands: p1 (Milla), p2 (Cassi) or bot
  const [p1Hand, setP1Hand] = useState<BuracoCard[]>([]);
  const [p2Hand, setP2Hand] = useState<BuracoCard[]>([]);
  const [botHand, setBotHand] = useState<BuracoCard[]>([]);

  const [p1Morto, setP1Morto] = useState<BuracoCard[]>([]);
  const [p2Morto, setP2Morto] = useState<BuracoCard[]>([]);
  const [botMorto, setBotMorto] = useState<BuracoCard[]>([]);

  const [hasP1TakenMorto, setHasP1TakenMorto] = useState(false);
  const [hasP2TakenMorto, setHasP2TakenMorto] = useState(false);
  const [hasBotTakenMorto, setHasBotTakenMorto] = useState(false);

  // Table Melds
  const [p1Melds, setP1Melds] = useState<Meld[]>([]);
  const [p2Melds, setP2Melds] = useState<Meld[]>([]);
  const [botMelds, setBotMelds] = useState<Meld[]>([]);

  // Turn management:
  // in 'couple_pass': 'p1_draw' | 'p1_play' | 'p2_draw' | 'p2_play'
  // in 'solo_bot': 'p1_draw' | 'p1_play' | 'bot_turn'
  // in 'couple_coop': 'p1_draw' | 'p1_play' | 'bot1_turn' | 'p2_draw' | 'p2_play' | 'bot2_turn'
  const [currentTurn, setCurrentTurn] = useState<'partner1' | 'partner2' | 'bot'>('partner1');
  const [turnStep, setTurnStep] = useState<'draw' | 'play'>('draw');

  // Privacy Curtain for couple_pass mode:
  // When turn changes, curtain activates so cards are hidden until current player reveals!
  const [isPrivacyCurtainActive, setIsPrivacyCurtainActive] = useState<boolean>(false);
  const [manuallyHidden, setManuallyHidden] = useState<boolean>(false);

  const [selectedCards, setSelectedCards] = useState<string[]>([]);
  const [gameMessage, setGameMessage] = useState<string>('Sua vez! Compre do Monte ou pegue o Lixo.');
  const [isRulesModalOpen, setIsRulesModalOpen] = useState(false);
  const [gameOver, setGameOver] = useState<{
    winner: 'partner1' | 'partner2' | 'bot' | 'couple';
    score1: number;
    score2: number;
  } | null>(null);

  // Initialize Buraco Match
  const startNewGame = useCallback(() => {
    const fullDeck = createDoubleDeck();

    // Deal 11 cards to P1, 11 to P2 (or Bot)
    const hand1 = fullDeck.splice(0, 11);
    const hand2 = fullDeck.splice(0, 11);

    // Deal 11 cards to 2 Mortos
    const m1 = fullDeck.splice(0, 11);
    const m2 = fullDeck.splice(0, 11);

    // First card to discard pile
    const firstDiscard = fullDeck.splice(0, 1);

    setP1Hand(sortBuracoHand(hand1));
    setP2Hand(sortBuracoHand(hand2));
    setBotHand(hand2);

    setP1Morto(m1);
    setP2Morto(m2);
    setBotMorto(m2);

    setStock(fullDeck);
    setDiscardPile(firstDiscard);

    setP1Melds([]);
    setP2Melds([]);
    setBotMelds([]);

    setHasP1TakenMorto(false);
    setHasP2TakenMorto(false);
    setHasBotTakenMorto(false);

    setSelectedCards([]);
    setGameOver(null);
    setCurrentTurn('partner1');
    setTurnStep('draw');
    setIsPrivacyCurtainActive(false);
    setManuallyHidden(false);

    const firstPlayerName = p1.nickname || p1.name;
    setGameMessage(`Partida iniciada! Vez de ${firstPlayerName}: compre do monte ou pegue o lixo.`);
  }, [p1]);

  useEffect(() => {
    startNewGame();
  }, [startNewGame, gameMode]);

  // Current active player hand
  const currentHand = currentTurn === 'partner1' ? p1Hand : p2Hand;
  const currentMorto = currentTurn === 'partner1' ? p1Morto : p2Morto;
  const currentHasTakenMorto = currentTurn === 'partner1' ? hasP1TakenMorto : hasP2TakenMorto;
  const currentMelds =
    gameMode === 'couple_coop' ? p1Melds : currentTurn === 'partner1' ? p1Melds : p2Melds;

  const currentPartnerName =
    currentTurn === 'partner1' ? p1.nickname || p1.name : p2.nickname || p2.name;

  // Draw from Stock
  const handleDrawFromStock = () => {
    if (turnStep !== 'draw' || stock.length === 0) return;
    const drawn = stock[0];
    const newStock = stock.slice(1);
    setStock(newStock);

    if (currentTurn === 'partner1') {
      setP1Hand((h) => sortBuracoHand([...h, drawn]));
    } else {
      setP2Hand((h) => sortBuracoHand([...h, drawn]));
    }

    setTurnStep('play');
    setGameMessage(
      `${currentPartnerName} comprou ${RANK_LABELS[drawn.rank]}${SUIT_SYMBOLS[drawn.suit]}. Baixe jogos ou descarte uma carta para passar.`
    );
  };

  // Buy Discard Pile (Pegar Lixo)
  const handleTakeDiscardPile = () => {
    if (turnStep !== 'draw' || discardPile.length === 0) return;
    const taken = [...discardPile];
    setDiscardPile([]);

    if (currentTurn === 'partner1') {
      setP1Hand((h) => sortBuracoHand([...h, ...taken]));
    } else {
      setP2Hand((h) => sortBuracoHand([...h, ...taken]));
    }

    setTurnStep('play');
    setGameMessage(`${currentPartnerName} pegou todo o lixo (${taken.length} cartas)!`);
  };

  // Toggle card select
  const toggleCardSelect = (id: string) => {
    setSelectedCards((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  };

  const updateMeldCanastraStatus = (m: Meld): Meld => {
    const isClean = m.cards.length >= 7 && !m.cards.some((c) => c.rank === 2);
    const isDirty = m.cards.length >= 7 && m.cards.some((c) => c.rank === 2);
    return { ...m, isClean, isDirty };
  };

  // Meld selected cards into a new sequence
  const handleMeldSelectedCards = () => {
    if (turnStep !== 'play') return;
    const chosenCards = currentHand.filter((c) => selectedCards.includes(c.id));
    const result = isValidSequence(chosenCards);

    if (!result.valid) {
      setGameMessage('Combinação inválida! Forme sequências do mesmo naipe de pelo menos 3 cartas (ex: 4-5-6 ou com 2 coringa).');
      return;
    }

    const newMeld: Meld = updateMeldCanastraStatus({
      id: `meld-${Date.now()}`,
      suit: result.suit,
      cards: [...chosenCards].sort((a, b) => a.rank - b.rank),
      isClean: false,
      isDirty: false,
    });

    const remainingHand = currentHand.filter((c) => !selectedCards.includes(c.id));
    setSelectedCards([]);

    if (gameMode === 'couple_coop' || currentTurn === 'partner1') {
      setP1Melds((m) => [...m, newMeld]);
    } else {
      setP2Melds((m) => [...m, newMeld]);
    }

    // Check if hand emptied by melding
    if (remainingHand.length === 0 && !currentHasTakenMorto) {
      if (currentTurn === 'partner1') {
        setP1Hand(sortBuracoHand(p1Morto));
        setP1Morto([]);
        setHasP1TakenMorto(true);
      } else {
        setP2Hand(sortBuracoHand(p2Morto));
        setP2Morto([]);
        setHasP2TakenMorto(true);
      }
      setGameMessage(`🎉 ${currentPartnerName} desceu todas as cartas e pegou o MORTO direto na mão!`);
    } else {
      if (currentTurn === 'partner1') setP1Hand(remainingHand);
      else setP2Hand(remainingHand);

      setGameMessage(
        newMeld.isClean
          ? `⭐ CANASTRA LIMPA de ${currentPartnerName}!`
          : `Novo jogo de ${currentPartnerName} baixado na mesa!`
      );
    }
  };

  // Add selected cards to an existing meld
  const handleAddToMeld = (meldId: string) => {
    if (turnStep !== 'play' || selectedCards.length === 0) return;
    const meld = currentMelds.find((m) => m.id === meldId);
    if (!meld) return;

    const chosenCards = currentHand.filter((c) => selectedCards.includes(c.id));
    const combined = [...meld.cards, ...chosenCards];
    const testResult = isValidSequence(combined);

    if (!testResult.valid) {
      setGameMessage('As cartas selecionadas não encaixam nessa sequência.');
      return;
    }

    const updated = updateMeldCanastraStatus({
      ...meld,
      cards: combined.sort((a, b) => a.rank - b.rank),
    });

    if (gameMode === 'couple_coop' || currentTurn === 'partner1') {
      setP1Melds((prev) => prev.map((m) => (m.id === meldId ? updated : m)));
    } else {
      setP2Melds((prev) => prev.map((m) => (m.id === meldId ? updated : m)));
    }

    const remainingHand = currentHand.filter((c) => !selectedCards.includes(c.id));
    setSelectedCards([]);

    if (remainingHand.length === 0 && !currentHasTakenMorto) {
      if (currentTurn === 'partner1') {
        setP1Hand(sortBuracoHand(p1Morto));
        setP1Morto([]);
        setHasP1TakenMorto(true);
      } else {
        setP2Hand(sortBuracoHand(p2Morto));
        setP2Morto([]);
        setHasP2TakenMorto(true);
      }
      setGameMessage(`🎉 ${currentPartnerName} pegou o MORTO!`);
    } else {
      if (currentTurn === 'partner1') setP1Hand(remainingHand);
      else setP2Hand(remainingHand);
      setGameMessage(
        updated.isClean ? '⭐ CANASTRA LIMPA formada!' : 'Cartas adicionadas com sucesso!'
      );
    }
  };

  // Discard 1 card to pass the turn
  const handleDiscard = (card: BuracoCard) => {
    if (turnStep !== 'play') return;

    const nextHand = currentHand.filter((c) => c.id !== card.id);
    const newDiscard = [card, ...discardPile];
    setDiscardPile(newDiscard);
    setSelectedCards([]);

    // Check if player emptied hand
    if (nextHand.length === 0) {
      if (!currentHasTakenMorto) {
        // Take morto and end turn
        if (currentTurn === 'partner1') {
          setP1Hand(sortBuracoHand(p1Morto));
          setP1Morto([]);
          setHasP1TakenMorto(true);
        } else {
          setP2Hand(sortBuracoHand(p2Morto));
          setP2Morto([]);
          setHasP2TakenMorto(true);
        }
        passTurnAfterDiscard();
        setGameMessage(`${currentPartnerName} descartou a última carta e pegou o MORTO!`);
        return;
      } else {
        // Player closes the game (Bateu!)
        const hasCanastra = currentMelds.some((m) => m.cards.length >= 7);
        if (hasCanastra) {
          finishMatch(currentTurn);
          return;
        }
      }
    }

    if (currentTurn === 'partner1') setP1Hand(nextHand);
    else setP2Hand(nextHand);

    passTurnAfterDiscard();
  };

  const passTurnAfterDiscard = () => {
    if (gameMode === 'couple_pass') {
      // Switch between P1 and P2 with Privacy Curtain!
      const nextPlayer = currentTurn === 'partner1' ? 'partner2' : 'partner1';
      setCurrentTurn(nextPlayer);
      setTurnStep('draw');
      // ACTIVATE PRIVACY CURTAIN so P1's cards are hidden before passing phone to P2!
      setIsPrivacyCurtainActive(true);
      setManuallyHidden(false);
      const nextName = nextPlayer === 'partner1' ? p1.nickname || p1.name : p2.nickname || p2.name;
      setGameMessage(`Vez de ${nextName}! Passe o aparelho para ela e toque para revelar.`);
    } else if (gameMode === 'solo_bot') {
      setCurrentTurn('bot');
      setTurnStep('draw');
      setGameMessage('Vez do Robô...');
    }
  };

  // Finish match calculation
  const finishMatch = (winner: 'partner1' | 'partner2' | 'bot') => {
    let score1 = winner === 'partner1' ? 100 : 0;
    let score2 = winner === 'partner2' ? 100 : 0;

    p1Melds.forEach((m) => {
      if (m.isClean) score1 += 200;
      else if (m.isDirty) score1 += 100;
      m.cards.forEach((c) => (score1 += getCardPoints(c)));
    });
    p1Hand.forEach((c) => (score1 -= getCardPoints(c)));
    if (!hasP1TakenMorto) score1 -= 100;

    const secondMelds = gameMode === 'solo_bot' ? botMelds : p2Melds;
    const secondHand = gameMode === 'solo_bot' ? botHand : p2Hand;
    const secondTookMorto = gameMode === 'solo_bot' ? hasBotTakenMorto : hasP2TakenMorto;

    secondMelds.forEach((m) => {
      if (m.isClean) score2 += 200;
      else if (m.isDirty) score2 += 100;
      m.cards.forEach((c) => (score2 += getCardPoints(c)));
    });
    secondHand.forEach((c) => (score2 -= getCardPoints(c)));
    if (!secondTookMorto) score2 -= 100;

    setGameOver({ winner, score1, score2 });
  };

  // Bot Turn Logic for Solo Mode
  useEffect(() => {
    if (gameMode !== 'solo_bot' || currentTurn !== 'bot') return;

    const timer = setTimeout(() => {
      let bHand = [...botHand];
      let bMelds = [...botMelds];
      let tookMorto = hasBotTakenMorto;

      if (stock.length > 0) {
        const drawn = stock[0];
        setStock((s) => s.slice(1));
        bHand.push(drawn);
      }

      const suits: BuracoSuit[] = ['hearts', 'diamonds', 'clubs', 'spades'];
      for (const suit of suits) {
        const suitCards = bHand
          .filter((c) => c.suit === suit && c.rank !== 2)
          .sort((a, b) => a.rank - b.rank);
        if (suitCards.length >= 3) {
          for (let i = 0; i <= suitCards.length - 3; i++) {
            if (
              suitCards[i + 1].rank === suitCards[i].rank + 1 &&
              suitCards[i + 2].rank === suitCards[i + 1].rank + 1
            ) {
              const meldCards = [suitCards[i], suitCards[i + 1], suitCards[i + 2]];
              const meldIds = meldCards.map((c) => c.id);
              bHand = bHand.filter((c) => !meldIds.includes(c.id));
              bMelds.push(
                updateMeldCanastraStatus({
                  id: `bmeld-${Date.now()}`,
                  suit,
                  cards: meldCards,
                  isClean: false,
                  isDirty: false,
                })
              );
              break;
            }
          }
        }
      }

      if (bHand.length === 0 && !tookMorto && botMorto.length > 0) {
        bHand = [...botMorto];
        setBotMorto([]);
        tookMorto = true;
        setHasBotTakenMorto(true);
      }

      if (bHand.length > 0) {
        const discardCard = bHand.pop()!;
        setDiscardPile((d) => [discardCard, ...d]);

        if (bHand.length === 0) {
          if (!tookMorto && botMorto.length > 0) {
            bHand = [...botMorto];
            setBotMorto([]);
            setHasBotTakenMorto(true);
          } else if (bMelds.some((m) => m.cards.length >= 7)) {
            setBotHand(bHand);
            setBotMelds(bMelds);
            finishMatch('bot');
            return;
          }
        }
      }

      setBotHand(bHand);
      setBotMelds(bMelds);
      setCurrentTurn('partner1');
      setTurnStep('draw');
      setGameMessage(`Sua vez, ${p1.nickname || p1.name}! Compre do monte ou pegue o lixo.`);
    }, 1200);

    return () => clearTimeout(timer);
  }, [currentTurn, gameMode, botHand, botMelds, stock, botMorto, hasBotTakenMorto, p1]);

  return (
    <div className="flex flex-col items-center p-2 sm:p-4 max-w-5xl mx-auto select-none space-y-4">
      {/* Header Info & Mode Switcher */}
      <div className="w-full flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white dark:bg-[#241C21] p-3 sm:p-4 rounded-3xl border border-[#F2E8E4] dark:border-[#3D2F36] shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-amber-500 via-rose-500 to-pink-600 flex items-center justify-center text-white shadow-xs">
            <Crown className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-serif font-bold text-lg text-[#2D2327] dark:text-[#FAF4F0]">
                Buraco & Canastra
              </h2>
              {gameMode === 'couple_pass' && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 dark:bg-rose-950/60 text-[#8E283E] dark:text-rose-300 border border-rose-300">
                  🔒 Modo Privativo (Passa e Joga)
                </span>
              )}
            </div>
            <p className="text-xs text-[#7D6F74] dark:text-[#B8A8AF]">
              Faça sequências, canastras limpas e pegue o morto para bater!
            </p>
          </div>
        </div>

        {/* Game Mode Pill Selector (Soft pink with dark borders) */}
        <div className="flex items-center gap-1.5 p-1 rounded-full bg-rose-50/70 dark:bg-rose-950/40 border border-rose-200/60 dark:border-rose-900/50 overflow-x-auto">
          <button
            onClick={() => setGameMode('couple_pass')}
            className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
              gameMode === 'couple_pass'
                ? 'bg-white dark:bg-[#2C1D24] text-[#9E3E50] dark:text-rose-200 border border-rose-300 dark:border-rose-800 shadow-xs'
                : 'text-[#7D6F74] hover:text-[#2D2327]'
            }`}
          >
            💕 {p1.nickname || p1.name} vs {p2.nickname || p2.name}
          </button>
          <button
            onClick={() => setGameMode('solo_bot')}
            className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
              gameMode === 'solo_bot'
                ? 'bg-white dark:bg-[#2C1D24] text-[#9E3E50] dark:text-rose-200 border border-rose-300 dark:border-rose-800 shadow-xs'
                : 'text-[#7D6F74] hover:text-[#2D2327]'
            }`}
          >
            🤖 Treino vs Robô
          </button>
          <button
            onClick={() => setIsRulesModalOpen(true)}
            className="px-2.5 py-1 rounded-full text-xs font-medium text-[#7D6F74] hover:text-[#2D2327]"
          >
            📖 Regras
          </button>
        </div>
      </div>

      {/* Turn Banner with Quick Privacy Curtain Toggle */}
      <div className="w-full p-2.5 rounded-2xl bg-gradient-to-r from-rose-50 to-amber-50 dark:from-rose-950/40 dark:to-amber-950/30 border border-rose-200/60 dark:border-rose-900/40 flex items-center justify-between text-xs">
        <span className="font-semibold text-[#2D2327] dark:text-[#FAF4F0] flex items-center gap-1.5 truncate">
          <Sparkles className="w-4 h-4 text-[#E07A8B] shrink-0" />
          <span className="truncate">{gameMessage}</span>
        </span>

        <div className="flex items-center gap-2 shrink-0">
          {gameMode === 'couple_pass' && (
            <button
              onClick={() => setManuallyHidden((h) => !h)}
              className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-white dark:bg-[#2C1D24] border border-rose-300 dark:border-rose-700 text-[#8E283E] dark:text-rose-200 shadow-xs"
              title="Esconder cartas da tela"
            >
              {manuallyHidden ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
              <span>{manuallyHidden ? 'Mostrar Cartas' : 'Esconder Cartas'}</span>
            </button>
          )}
          <span className="text-[11px] font-mono text-[#7D6F74] dark:text-[#B8A8AF] hidden sm:inline">
            Monte: {stock.length}
          </span>
        </div>
      </div>

      {/* Green Felt Table */}
      <div className="w-full bg-[#1b4329] dark:bg-[#102919] p-3 sm:p-5 rounded-3xl border-4 border-[#0e2718] shadow-2xl space-y-6 relative overflow-hidden">
        {/* Opponent Area */}
        <div className="flex items-center justify-between p-2.5 rounded-2xl bg-black/25 border border-emerald-600/30 text-emerald-100 text-xs">
          <div className="flex items-center gap-2">
            {gameMode === 'solo_bot' ? (
              <Bot className="w-5 h-5 text-emerald-300" />
            ) : (
              <User className="w-5 h-5 text-rose-300" />
            )}
            <span className="font-bold">
              {gameMode === 'solo_bot'
                ? 'Robô Canastra'
                : currentTurn === 'partner1'
                ? p2.nickname || p2.name
                : p1.nickname || p1.name}
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-900/70 border border-emerald-500/40">
              {gameMode === 'solo_bot'
                ? `${botHand.length} cartas na mão`
                : currentTurn === 'partner1'
                ? `${p2Hand.length} cartas (ocultas)`
                : `${p1Hand.length} cartas (ocultas)`}
            </span>
          </div>

          {/* Opponent Melds on Table */}
          <div className="flex items-center gap-1.5 overflow-x-auto max-w-md py-1">
            {(gameMode === 'solo_bot' ? botMelds : currentTurn === 'partner1' ? p2Melds : p1Melds).map(
              (m) => (
                <div
                  key={m.id}
                  className="px-2 py-1 rounded-lg bg-emerald-950/80 border border-emerald-500/40 flex items-center gap-1 text-[11px]"
                >
                  {m.isClean && <span className="text-yellow-300 font-bold">👑</span>}
                  <span className="font-bold">{m.cards.length}x</span>
                  <span>{SUIT_SYMBOLS[m.suit]}</span>
                </div>
              )
            )}
          </div>
        </div>

        {/* Center: Stock & Discard */}
        <div className="flex items-center justify-center gap-6 sm:gap-10 py-2">
          {/* Stock */}
          <div className="flex flex-col items-center gap-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-200">
              Monte ({stock.length})
            </span>
            <div
              onClick={handleDrawFromStock}
              className={`w-16 h-24 sm:w-20 sm:h-28 rounded-xl bg-gradient-to-br from-rose-800 to-rose-950 border-2 border-rose-300/80 shadow-lg flex items-center justify-center cursor-pointer hover:scale-105 transition-all ${
                turnStep === 'draw' ? 'ring-4 ring-yellow-400 animate-pulse' : 'opacity-80'
              }`}
            >
              <span className="font-serif text-white/70 text-2xl">🂠</span>
            </div>
            <button
              onClick={handleDrawFromStock}
              disabled={turnStep !== 'draw'}
              className="text-[11px] px-3 py-1 rounded-full bg-emerald-700 hover:bg-emerald-600 disabled:opacity-40 text-white font-bold transition-colors"
            >
              Comprar
            </button>
          </div>

          {/* Discard Pile */}
          <div className="flex flex-col items-center gap-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-200">
              Lixo ({discardPile.length})
            </span>
            <div
              onClick={handleTakeDiscardPile}
              className={`w-16 h-24 sm:w-20 sm:h-28 rounded-xl border-2 border-dashed border-emerald-500/60 bg-emerald-900/40 shadow-lg flex items-center justify-center cursor-pointer hover:scale-105 transition-all relative ${
                turnStep === 'draw' && discardPile.length > 0 ? 'ring-4 ring-amber-300' : 'opacity-90'
              }`}
            >
              {discardPile.length > 0 ? (
                <BuracoCardItem card={discardPile[0]} />
              ) : (
                <span className="text-[10px] text-emerald-300/60">Vazio</span>
              )}
            </div>
            <button
              onClick={handleTakeDiscardPile}
              disabled={turnStep !== 'draw' || discardPile.length === 0}
              className="text-[11px] px-3 py-1 rounded-full bg-amber-600 hover:bg-amber-500 disabled:opacity-40 text-white font-bold transition-colors"
            >
              Pegar Lixo
            </button>
          </div>

          {/* Mortos info */}
          <div className="hidden sm:flex flex-col gap-2 text-xs text-emerald-200">
            <div className="p-2 rounded-xl bg-black/25 border border-emerald-600/30">
              <span className="text-[10px] block opacity-70">Morto 1 ({p1.nickname || p1.name})</span>
              <strong className={hasP1TakenMorto ? 'text-zinc-400 line-through' : 'text-yellow-300'}>
                {hasP1TakenMorto ? 'Resgatado' : `${p1Morto.length} cartas`}
              </strong>
            </div>
            <div className="p-2 rounded-xl bg-black/25 border border-emerald-600/30">
              <span className="text-[10px] block opacity-70">
                Morto 2 ({gameMode === 'solo_bot' ? 'Robô' : p2.nickname || p2.name})
              </span>
              <strong
                className={
                  gameMode === 'solo_bot'
                    ? hasBotTakenMorto
                      ? 'text-zinc-400 line-through'
                      : 'text-emerald-300'
                    : hasP2TakenMorto
                    ? 'text-zinc-400 line-through'
                    : 'text-yellow-300'
                }
              >
                {gameMode === 'solo_bot'
                  ? hasBotTakenMorto
                    ? 'Resgatado'
                    : `${botMorto.length} cartas`
                  : hasP2TakenMorto
                  ? 'Resgatado'
                  : `${p2Morto.length} cartas`}
              </strong>
            </div>
          </div>
        </div>

        {/* Current Player Table Melds */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs text-emerald-200">
            <span className="font-bold flex items-center gap-1.5">
              <Crown className="w-4 h-4 text-yellow-300" />
              Jogos de {currentPartnerName} na Mesa ({currentMelds.length})
            </span>
            <span className="text-[11px] opacity-80">
              Selecione cartas da sua mão e clique em um jogo para adicioná-las!
            </span>
          </div>

          {currentMelds.length === 0 ? (
            <div className="p-4 rounded-2xl border border-dashed border-emerald-600/40 bg-emerald-950/30 text-center text-xs text-emerald-300/70">
              Nenhum jogo baixado ainda. Selecione 3 ou mais cartas sequenciais da mão e clique em &quot;Baixar Jogo&quot;.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {currentMelds.map((meld) => (
                <div
                  key={meld.id}
                  onClick={() => handleAddToMeld(meld.id)}
                  className={`p-2.5 rounded-2xl bg-emerald-950/90 border transition-all cursor-pointer ${
                    meld.isClean
                      ? 'border-yellow-400 shadow-md shadow-yellow-500/20'
                      : meld.isDirty
                      ? 'border-amber-500'
                      : 'border-emerald-500/40 hover:border-yellow-300'
                  }`}
                >
                  <div className="flex items-center justify-between text-[11px] mb-1.5 text-emerald-200">
                    <span className="font-bold flex items-center gap-1">
                      {SUIT_SYMBOLS[meld.suit]} {meld.cards.length} cartas
                    </span>
                    {meld.isClean && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-yellow-400 text-black">
                        CANASTRA LIMPA (200 pts)
                      </span>
                    )}
                    {meld.isDirty && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500 text-white">
                        CANASTRA SUJA (100 pts)
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {meld.cards.map((c) => (
                      <span
                        key={c.id}
                        className={`text-xs px-1.5 py-0.5 rounded bg-white font-bold shadow-2xs ${
                          SUIT_COLORS[c.suit] === 'red' ? 'text-red-600' : 'text-zinc-900'
                        }`}
                      >
                        {RANK_LABELS[c.rank]}
                        {SUIT_SYMBOLS[c.suit]}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Player Bottom Hand Area (Protected by Privacy Curtain in Pass-and-Play) */}
        <div className="relative pt-2">
          {/* Privacy Curtain Overlay */}
          {(isPrivacyCurtainActive || manuallyHidden) && gameMode === 'couple_pass' && (
            <div className="absolute inset-0 z-20 rounded-2xl bg-[#0b1c11]/95 backdrop-blur-md border-2 border-emerald-500/60 flex flex-col items-center justify-center p-6 text-center space-y-3 animate-in fade-in">
              <div className="w-12 h-12 rounded-full bg-rose-500/20 border border-rose-400 flex items-center justify-center text-rose-300">
                <Lock className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-bold text-white">
                  🔒 Vez de {currentPartnerName}!
                </h3>
                <p className="text-xs text-emerald-200/80 max-w-xs mt-1">
                  Passe o celular para {currentPartnerName}. Suas cartas estão protegidas para ninguém ver!
                </p>
              </div>
              <button
                onClick={() => {
                  setIsPrivacyCurtainActive(false);
                  setManuallyHidden(false);
                }}
                className="px-5 py-2 rounded-full bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white font-bold text-xs shadow-lg transition-all active:scale-95 flex items-center gap-1.5"
              >
                <Eye className="w-4 h-4" />
                <span>Sou a {currentPartnerName} - Revelar Minhas Cartas</span>
              </button>
            </div>
          )}

          {/* Action Bar Above Cards */}
          <div className="flex flex-wrap items-center justify-between gap-2 mb-2 text-xs text-emerald-100">
            <span className="font-bold flex items-center gap-1.5">
              <span>Mão de {currentPartnerName} ({currentHand.length} cartas)</span>
              {currentHasTakenMorto && (
                <span className="text-[10px] px-2 py-0.2 rounded-full bg-yellow-400 text-black font-bold">
                  Morto Já Resgatado
                </span>
              )}
            </span>

            <div className="flex items-center gap-2">
              <button
                onClick={handleMeldSelectedCards}
                disabled={turnStep !== 'play' || selectedCards.length < 3}
                className="px-3 py-1 rounded-full text-xs font-bold bg-yellow-400 hover:bg-yellow-300 disabled:opacity-40 text-black shadow-xs transition-all"
              >
                Baixar Jogo ({selectedCards.length})
              </button>
              <button
                onClick={() => setSelectedCards([])}
                disabled={selectedCards.length === 0}
                className="px-2.5 py-1 rounded-full text-xs font-medium bg-black/40 hover:bg-black/60 text-white transition-all disabled:opacity-30"
              >
                Limpar
              </button>
            </div>
          </div>

          {/* Hand Cards Grid */}
          <div className="flex flex-wrap gap-1.5 sm:gap-2 justify-center p-2 rounded-2xl bg-black/25 min-h-[110px] border border-emerald-600/30">
            {currentHand.map((card) => {
              const isSelected = selectedCards.includes(card.id);
              return (
                <div key={card.id} className="flex flex-col items-center gap-1">
                  <div
                    onClick={() => toggleCardSelect(card.id)}
                    className={`cursor-pointer transition-all transform ${
                      isSelected ? '-translate-y-3 ring-4 ring-yellow-400' : 'hover:-translate-y-1'
                    }`}
                  >
                    <BuracoCardItem card={card} />
                  </div>
                  {turnStep === 'play' && (
                    <button
                      onClick={() => handleDiscard(card)}
                      className="text-[9px] px-1.5 py-0.5 rounded-full bg-rose-600 hover:bg-rose-500 text-white font-bold transition-colors"
                      title="Descartar esta carta e passar a vez"
                    >
                      Descartar
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Rules Modal */}
      {isRulesModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#241C21] rounded-3xl max-w-md w-full p-5 border border-[#F2E8E4] dark:border-[#3D2F36] shadow-2xl space-y-3 max-h-[85vh] overflow-y-auto text-xs sm:text-sm">
            <div className="flex items-center justify-between pb-2 border-b border-[#F2E8E4] dark:border-[#3D2F36]">
              <h3 className="font-serif font-bold text-base text-[#2D2327] dark:text-[#FAF4F0]">
                Regras do Buraco (Canastra)
              </h3>
              <button
                onClick={() => setIsRulesModalOpen(false)}
                className="text-xs text-[#7D6F74] hover:text-[#2D2327]"
              >
                ✕
              </button>
            </div>
            <div className="space-y-2 text-[#7D6F74] dark:text-[#B8A8AF] leading-relaxed">
              <p>
                <strong>Objetivo:</strong> Fazer sequências do mesmo naipe com 3 ou mais cartas (ex: 4-5-6 de Copas).
              </p>
              <p>
                <strong>Coringas:</strong> Todas as cartas de número <strong>2</strong> funcionam como coringa para substituir qualquer carta que falte na sequência.
              </p>
              <p>
                <strong>Canastra Limpa (200 pontos):</strong> Uma sequência de 7 ou mais cartas sem nenhum coringa.
              </p>
              <p>
                <strong>Canastra Suja (100 pontos):</strong> Uma sequência de 7 ou mais cartas utilizando um coringa 2.
              </p>
              <p>
                <strong>O Morto:</strong> Ao acabar com as 11 cartas iniciais da mão, você pega o monte reserva &quot;Morto&quot; com mais 11 cartas.
              </p>
              <p>
                <strong>Bater:</strong> Para vencer e fechar a partida, você precisa ter pego o morto, ter pelo menos uma canastra (limpa ou suja) e descartar a última carta.
              </p>
              <p>
                <strong>🔒 Modo Passa e Joga:</strong> Ativa a cortina de privacidade após cada descarte, garantindo que a Milla não veja as cartas da Cassi e vice-versa!
              </p>
            </div>
            <button
              onClick={() => setIsRulesModalOpen(false)}
              className="w-full py-2 rounded-xl bg-[#E07A8B] text-white font-bold text-xs"
            >
              Entendi, vamos jogar!
            </button>
          </div>
        </div>
      )}

      {/* Game Over Modal */}
      {gameOver && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#241C21] rounded-3xl max-w-sm w-full p-6 text-center space-y-4 border border-[#F2E8E4] dark:border-[#3D2F36] shadow-2xl">
            <div className="w-14 h-14 rounded-2xl bg-amber-100 dark:bg-amber-950/80 text-amber-600 mx-auto flex items-center justify-center text-3xl shadow-md">
              🏆
            </div>
            <div>
              <h3 className="font-serif font-bold text-xl text-[#2D2327] dark:text-[#FAF4F0]">
                {gameOver.winner === 'partner1'
                  ? `🎉 Vitória de ${p1.nickname || p1.name}!`
                  : gameOver.winner === 'partner2'
                  ? `🎉 Vitória de ${p2.nickname || p2.name}!`
                  : 'O Robô Bateu!'}
              </h3>
              <p className="text-xs text-[#7D6F74] dark:text-[#B8A8AF] mt-1">
                Fim de partida emocionante de Canastra!
              </p>
            </div>

            <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200/60 text-xs space-y-1">
              <div className="flex justify-between font-bold text-[#2D2327] dark:text-[#FAF4F0]">
                <span>{p1.nickname || p1.name}:</span>
                <span>{gameOver.score1} pontos</span>
              </div>
              <div className="flex justify-between font-bold text-[#2D2327] dark:text-[#FAF4F0]">
                <span>{gameMode === 'solo_bot' ? 'Robô' : p2.nickname || p2.name}:</span>
                <span>{gameOver.score2} pontos</span>
              </div>
            </div>

            <button
              onClick={startNewGame}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-pink-600 text-white font-bold text-xs shadow-md"
            >
              Jogar Novamente
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// Sub-component: Clean Card rendering
const BuracoCardItem: React.FC<{ card: BuracoCard }> = ({ card }) => {
  const isRed = SUIT_COLORS[card.suit] === 'red';
  const label = RANK_LABELS[card.rank];
  const symbol = SUIT_SYMBOLS[card.suit];

  return (
    <div className="w-10 h-16 sm:w-12 sm:h-20 rounded-xl bg-white border border-zinc-300 shadow-md flex flex-col justify-between p-1 select-none pointer-events-none">
      <div className={`text-[10px] sm:text-xs font-black leading-none ${isRed ? 'text-red-600' : 'text-zinc-900'}`}>
        <div>{label}</div>
        <div>{symbol}</div>
      </div>
      <div className={`text-base sm:text-lg self-center font-bold ${isRed ? 'text-red-600' : 'text-zinc-900'}`}>
        {symbol}
      </div>
      <div className={`text-[10px] sm:text-xs font-black self-end leading-none rotate-180 ${isRed ? 'text-red-600' : 'text-zinc-900'}`}>
        <div>{label}</div>
        <div>{symbol}</div>
      </div>
    </div>
  );
};
