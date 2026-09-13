import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Sparkles,
  Trophy,
  RotateCcw,
  Shield,
  Crosshair,
  Flame,
  Anchor,
  HelpCircle,
  Eye,
  EyeOff,
  Dice5,
  Bot,
  User,
} from 'lucide-react';
import { CoupleProfile, PartnerId } from '../types';

const GRID_SIZE = 8;
const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];

interface ShipDef {
  id: string;
  name: string;
  size: number;
  icon: string;
}

const SHIP_DEFS: ShipDef[] = [
  { id: 'carrier', name: 'Porta-Aviões do Amor', size: 4, icon: '🚢' },
  { id: 'cruiser', name: 'Cruzador Romântico', size: 3, icon: '🛳️' },
  { id: 'sub', name: 'Submarino Cupido', size: 2, icon: '🚤' },
  { id: 'patrol1', name: 'Lancha Brisa', size: 1, icon: '⛵' },
  { id: 'patrol2', name: 'Lancha Paixão', size: 1, icon: '⛵' },
];

interface ShipPlacement {
  id: string;
  name: string;
  size: number;
  coordinates: string[]; // e.g. ["A1", "A2"]
  hits: string[];
}

interface PlayerState {
  ships: ShipPlacement[];
  shotsReceived: Record<string, 'hit' | 'miss'>; // "A1" -> 'hit' | 'miss'
  shotsMade: Record<string, 'hit' | 'miss'>;
}

interface NavalBattleGameProps {
  profile: CoupleProfile;
  activePartner: PartnerId;
}

// Generate a random valid fleet
function generateRandomFleet(): ShipPlacement[] {
  const fleet: ShipPlacement[] = [];
  const occupied = new Set<string>();

  for (const def of SHIP_DEFS) {
    let placed = false;
    let attempts = 0;

    while (!placed && attempts < 200) {
      attempts++;
      const isHorizontal = Math.random() > 0.5;
      const r = Math.floor(Math.random() * GRID_SIZE);
      const c = Math.floor(Math.random() * GRID_SIZE);

      const coords: string[] = [];
      let fits = true;

      for (let i = 0; i < def.size; i++) {
        const nr = isHorizontal ? r : r + i;
        const nc = isHorizontal ? c + i : c;

        if (nr >= GRID_SIZE || nc >= GRID_SIZE) {
          fits = false;
          break;
        }

        const key = `${LETTERS[nr]}${nc + 1}`;
        if (occupied.has(key)) {
          fits = false;
          break;
        }
        coords.push(key);
      }

      if (fits && coords.length === def.size) {
        coords.forEach((k) => occupied.add(k));
        fleet.push({
          id: def.id,
          name: def.name,
          size: def.size,
          coordinates: coords,
          hits: [],
        });
        placed = true;
      }
    }
  }

  return fleet;
}

export const NavalBattleGame: React.FC<NavalBattleGameProps> = ({ profile, activePartner }) => {
  const p1 = profile.partner1;
  const p2 = profile.partner2;

  // Mode: 'pass' (2 players pass-and-play) or 'ai' (vs Cupido bot)
  const [gameMode, setGameMode] = useState<'pass' | 'ai'>('ai');

  // Stage: 'setup_p1' | 'setup_p2' | 'curtain' | 'battle' | 'gameover'
  const [stage, setStage] = useState<'setup_p1' | 'setup_p2' | 'curtain' | 'battle' | 'gameover'>('setup_p1');

  // Current turn in battle: 'p1' | 'p2'
  const [currentTurn, setCurrentTurn] = useState<'p1' | 'p2'>('p1');

  // Fleets and Boards
  const [fleetP1, setFleetP1] = useState<ShipPlacement[]>(() => generateRandomFleet());
  const [fleetP2, setFleetP2] = useState<ShipPlacement[]>(() => generateRandomFleet());

  const [shotsP1, setShotsP1] = useState<Record<string, 'hit' | 'miss'>>({}); // Shots fired by P1
  const [shotsP2, setShotsP2] = useState<Record<string, 'hit' | 'miss'>>({}); // Shots fired by P2

  const [lastShotResult, setLastShotResult] = useState<string | null>(null);
  const [winner, setWinner] = useState<'p1' | 'p2' | null>(null);

  // Auto-setup button
  const handleRandomizeP1 = () => {
    setFleetP1(generateRandomFleet());
  };
  const handleRandomizeP2 = () => {
    setFleetP2(generateRandomFleet());
  };

  // Start Battle
  const handleStartBattle = () => {
    if (gameMode === 'pass') {
      setStage('curtain');
      setCurrentTurn('p1');
    } else {
      setFleetP2(generateRandomFleet());
      setStage('battle');
      setCurrentTurn('p1');
    }
    setShotsP1({});
    setShotsP2({});
    setLastShotResult(null);
    setWinner(null);
  };

  // Check if all ships of a player are sunk
  const isFleetDestroyed = (fleet: ShipPlacement[], shotsReceived: Record<string, 'hit' | 'miss'>) => {
    return fleet.every((ship) => ship.coordinates.every((coord) => shotsReceived[coord] === 'hit'));
  };

  // Handle Player Firing a Shot
  const handleFireShot = (coord: string) => {
    if (stage !== 'battle' || winner) return;

    if (currentTurn === 'p1') {
      if (shotsP1[coord]) return; // Already shot here

      // Check hit on P2 fleet
      const hitShip = fleetP2.find((s) => s.coordinates.includes(coord));
      const result = hitShip ? 'hit' : 'miss';
      const updatedShots = { ...shotsP1, [coord]: result };
      setShotsP1(updatedShots);

      if (hitShip) {
        // Check if ship was sunk
        const isSunk = hitShip.coordinates.every((c) => updatedShots[c] === 'hit');
        if (isSunk) {
          setLastShotResult(`💥 Acertou e AFUNDOU o ${hitShip.name}!`);
        } else {
          setLastShotResult(`🔥 Fogo! Acertou uma embarcação!`);
        }

        // Check overall victory
        if (isFleetDestroyed(fleetP2, updatedShots)) {
          setWinner('p1');
          setStage('gameover');
          return;
        }
      } else {
        setLastShotResult(`🌊 Água! Tiro no mar.`);
      }

      // Turn transition
      if (gameMode === 'pass') {
        setTimeout(() => {
          setCurrentTurn('p2');
          setStage('curtain');
        }, 1200);
      } else {
        // Bot turn
        setCurrentTurn('p2');
        setTimeout(handleBotTurn, 1000);
      }
    } else if (currentTurn === 'p2' && gameMode === 'pass') {
      if (shotsP2[coord]) return;

      const hitShip = fleetP1.find((s) => s.coordinates.includes(coord));
      const result = hitShip ? 'hit' : 'miss';
      const updatedShots = { ...shotsP2, [coord]: result };
      setShotsP2(updatedShots);

      if (hitShip) {
        const isSunk = hitShip.coordinates.every((c) => updatedShots[c] === 'hit');
        if (isSunk) {
          setLastShotResult(`💥 Acertou e AFUNDOU o ${hitShip.name}!`);
        } else {
          setLastShotResult(`🔥 Fogo! Acertou uma embarcação!`);
        }

        if (isFleetDestroyed(fleetP1, updatedShots)) {
          setWinner('p2');
          setStage('gameover');
          return;
        }
      } else {
        setLastShotResult(`🌊 Água! Tiro no mar.`);
      }

      setTimeout(() => {
        setCurrentTurn('p1');
        setStage('curtain');
      }, 1200);
    }
  };

  // Bot Turn Logic
  const handleBotTurn = () => {
    setShotsP2((prevShots) => {
      // Find unhit coordinates
      const allCoords: string[] = [];
      for (let r = 0; r < GRID_SIZE; r++) {
        for (let c = 1; c <= GRID_SIZE; c++) {
          const key = `${LETTERS[r]}${c}`;
          if (!prevShots[key]) allCoords.push(key);
        }
      }

      if (allCoords.length === 0) return prevShots;

      // Smart targeting: check if there's an unsunk hit
      const targetCoord = allCoords[Math.floor(Math.random() * allCoords.length)];

      const hitShip = fleetP1.find((s) => s.coordinates.includes(targetCoord));
      const result = hitShip ? 'hit' : 'miss';
      const nextShots = { ...prevShots, [targetCoord]: result };

      if (hitShip) {
        const isSunk = hitShip.coordinates.every((c) => nextShots[c] === 'hit');
        if (isSunk) {
          setLastShotResult(`🤖 Cupido Bot acertou e afundou o ${hitShip.name}!`);
        } else {
          setLastShotResult(`🤖 Cupido Bot atingiu seu navio em ${targetCoord}!`);
        }

        if (isFleetDestroyed(fleetP1, nextShots)) {
          setWinner('p2');
          setStage('gameover');
          return nextShots;
        }
      }

      setCurrentTurn('p1');
      return nextShots;
    });
  };

  const activeTurnName = currentTurn === 'p1' ? p1.nickname || p1.name : gameMode === 'ai' ? 'Capitão Cupido 🤖' : p2.nickname || p2.name;

  return (
    <div className="flex flex-col items-center p-2 sm:p-4 max-w-4xl mx-auto select-none space-y-4">
      {/* Top Header Card */}
      <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-[#241C21] p-3 sm:p-4 rounded-3xl border border-[var(--card-border)] shadow-2xs">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center text-white text-xl shadow-xs">
            ⚓
          </div>
          <div>
            <h2 className="font-serif font-bold text-base sm:text-lg text-[#2D2327] dark:text-[#FAF4F0] flex items-center gap-1.5">
              Batalha Naval do Casal
              <span className="text-xs px-2 py-0.5 rounded-full bg-sky-100 text-sky-800 dark:bg-sky-950/60 dark:text-sky-300 font-sans font-semibold">
                Naval Battle 🌊
              </span>
            </h2>
            <p className="text-xs text-[#7D6F74] dark:text-[#B8A8AF]">
              Posicione sua frota, mire nas águas do amor e afunde os navios adversários
            </p>
          </div>
        </div>

        {/* Mode Selector */}
        <div className="flex items-center gap-1 p-1 rounded-full bg-[var(--pill-bg)] border border-[var(--pill-border)]">
          <button
            type="button"
            onClick={() => {
              setGameMode('ai');
              setStage('setup_p1');
            }}
            className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
              gameMode === 'ai'
                ? 'bg-white dark:bg-[#2C1D24] text-[var(--pill-active-text)] border border-[var(--border-accent)] shadow-xs'
                : 'text-[#7D6F74] dark:text-[#B8A8AF] hover:text-[#2D2327]'
            }`}
          >
            🤖 Solo vs Bot
          </button>
          <button
            type="button"
            onClick={() => {
              setGameMode('pass');
              setStage('setup_p1');
            }}
            className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
              gameMode === 'pass'
                ? 'bg-white dark:bg-[#2C1D24] text-[var(--pill-active-text)] border border-[var(--border-accent)] shadow-xs'
                : 'text-[#7D6F74] dark:text-[#B8A8AF] hover:text-[#2D2327]'
            }`}
          >
            👥 Passa e Joga
          </button>
        </div>
      </div>

      {/* SETUP STAGE: PLAYER 1 */}
      {stage === 'setup_p1' && (
        <div className="w-full max-w-lg p-5 rounded-3xl bg-white dark:bg-[#20181D] border border-[var(--card-border)] space-y-4 shadow-xs">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-[#2D2327] dark:text-[#FAF4F0] flex items-center gap-2">
              <Shield className="w-4 h-4 text-sky-500" />
              Posicione a Frota de {p1.nickname || p1.name}
            </h3>
            <button
              type="button"
              onClick={handleRandomizeP1}
              className="px-3 py-1 rounded-full text-xs font-semibold bg-[var(--pill-bg)] text-[var(--pill-text)] border border-[var(--pill-border)] hover:border-[var(--border-accent)] flex items-center gap-1.5 transition-all"
            >
              <Dice5 className="w-3.5 h-3.5" />
              Embaralhar 🎲
            </button>
          </div>

          <p className="text-xs text-[#7D6F74] dark:text-[#B8A8AF]">
            Veja a distribuição da sua frota no tabuleiro 8x8. Você pode reembaralhar até ficar do seu agrado:
          </p>

          {/* 8x8 Preview Grid */}
          <div className="grid grid-cols-9 gap-1 max-w-xs mx-auto p-2 bg-sky-50 dark:bg-sky-950/30 rounded-2xl border border-sky-200 dark:border-sky-900/50">
            {/* Header row numbers */}
            <div className="w-7 h-7" />
            {Array.from({ length: 8 }).map((_, c) => (
              <div key={c} className="w-7 h-7 flex items-center justify-center text-[10px] font-bold text-sky-800 dark:text-sky-300">
                {c + 1}
              </div>
            ))}

            {/* Grid rows */}
            {LETTERS.map((letter) => (
              <React.Fragment key={letter}>
                <div className="w-7 h-7 flex items-center justify-center text-[10px] font-bold text-sky-800 dark:text-sky-300">
                  {letter}
                </div>
                {Array.from({ length: 8 }).map((_, c) => {
                  const key = `${letter}${c + 1}`;
                  const hasShip = fleetP1.some((s) => s.coordinates.includes(key));
                  return (
                    <div
                      key={key}
                      className={`w-7 h-7 rounded-lg border text-xs flex items-center justify-center transition-all ${
                        hasShip
                          ? 'bg-sky-500 border-sky-600 text-white font-bold shadow-xs'
                          : 'bg-white dark:bg-[#1E161A] border-sky-100 dark:border-sky-900/30'
                      }`}
                    >
                      {hasShip ? '🚢' : ''}
                    </div>
                  );
                })}
              </React.Fragment>
            ))}
          </div>

          <div className="pt-2">
            <button
              type="button"
              onClick={() => {
                if (gameMode === 'pass') {
                  setStage('setup_p2');
                } else {
                  handleStartBattle();
                }
              }}
              className="w-full py-3 rounded-2xl bg-[var(--border-accent)] text-white font-bold text-xs hover:brightness-105 shadow-md transition-all flex items-center justify-center gap-2"
            >
              <span>{gameMode === 'pass' ? `Próximo: Frota de ${p2.nickname || p2.name} ➡️` : 'Iniciar Batalha Naval! ⚓'}</span>
            </button>
          </div>
        </div>
      )}

      {/* SETUP STAGE: PLAYER 2 */}
      {stage === 'setup_p2' && (
        <div className="w-full max-w-lg p-5 rounded-3xl bg-white dark:bg-[#20181D] border border-[var(--card-border)] space-y-4 shadow-xs">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-[#2D2327] dark:text-[#FAF4F0] flex items-center gap-2">
              <Shield className="w-4 h-4 text-rose-500" />
              Posicione a Frota de {p2.nickname || p2.name}
            </h3>
            <button
              type="button"
              onClick={handleRandomizeP2}
              className="px-3 py-1 rounded-full text-xs font-semibold bg-[var(--pill-bg)] text-[var(--pill-text)] border border-[var(--pill-border)] hover:border-[var(--border-accent)] flex items-center gap-1.5 transition-all"
            >
              <Dice5 className="w-3.5 h-3.5" />
              Embaralhar 🎲
            </button>
          </div>

          <p className="text-xs text-[#7D6F74] dark:text-[#B8A8AF]">
            {p1.nickname || p1.name}, não olhe a tela! {p2.nickname || p2.name}, confirme sua frota secreta:
          </p>

          {/* 8x8 Preview Grid */}
          <div className="grid grid-cols-9 gap-1 max-w-xs mx-auto p-2 bg-rose-50 dark:bg-rose-950/30 rounded-2xl border border-rose-200 dark:border-rose-900/50">
            <div className="w-7 h-7" />
            {Array.from({ length: 8 }).map((_, c) => (
              <div key={c} className="w-7 h-7 flex items-center justify-center text-[10px] font-bold text-rose-800 dark:text-rose-300">
                {c + 1}
              </div>
            ))}

            {LETTERS.map((letter) => (
              <React.Fragment key={letter}>
                <div className="w-7 h-7 flex items-center justify-center text-[10px] font-bold text-rose-800 dark:text-rose-300">
                  {letter}
                </div>
                {Array.from({ length: 8 }).map((_, c) => {
                  const key = `${letter}${c + 1}`;
                  const hasShip = fleetP2.some((s) => s.coordinates.includes(key));
                  return (
                    <div
                      key={key}
                      className={`w-7 h-7 rounded-lg border text-xs flex items-center justify-center transition-all ${
                        hasShip
                          ? 'bg-rose-500 border-rose-600 text-white font-bold shadow-xs'
                          : 'bg-white dark:bg-[#1E161A] border-rose-100 dark:border-rose-900/30'
                      }`}
                    >
                      {hasShip ? '🚢' : ''}
                    </div>
                  );
                })}
              </React.Fragment>
            ))}
          </div>

          <div className="pt-2">
            <button
              type="button"
              onClick={handleStartBattle}
              className="w-full py-3 rounded-2xl bg-[var(--border-accent)] text-white font-bold text-xs hover:brightness-105 shadow-md transition-all flex items-center justify-center gap-2"
            >
              <span>Começar a Batalha a Dois! ⚔️</span>
            </button>
          </div>
        </div>
      )}

      {/* PRIVACY CURTAIN FOR PASS-AND-PLAY */}
      {stage === 'curtain' && (
        <div className="w-full max-w-md p-8 rounded-3xl bg-white dark:bg-[#20181D] border-2 border-[var(--border-accent)] text-center space-y-4 shadow-lg animate-in zoom-in-95">
          <div className="w-16 h-16 mx-auto rounded-3xl bg-rose-100 dark:bg-rose-950/60 text-[var(--border-accent)] flex items-center justify-center text-3xl">
            🔒
          </div>
          <h3 className="font-serif font-bold text-lg text-[#2D2327] dark:text-[#FAF4F0]">
            Passe o aparelho para {activeTurnName}!
          </h3>
          <p className="text-xs text-[#7D6F74] dark:text-[#B8A8AF]">
            Mantenha as táticas em segredo para uma batalha justa e divertida.
          </p>
          <button
            type="button"
            onClick={() => setStage('battle')}
            className="w-full py-3 rounded-2xl bg-[var(--border-accent)] text-white font-bold text-xs shadow-md hover:brightness-105 transition-all"
          >
            Estou pronta, ver meu tabuleiro! ✨
          </button>
        </div>
      )}

      {/* BATTLE STAGE */}
      {stage === 'battle' && (
        <div className="w-full space-y-4">
          {/* Turn Header */}
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-white dark:bg-[#20181D] border border-[var(--card-border)] shadow-2xs">
            <div className="flex items-center gap-2.5">
              <span className="w-9 h-9 rounded-xl bg-[var(--border-accent)] text-white flex items-center justify-center font-bold text-sm">
                🎯
              </span>
              <div>
                <span className="text-xs font-bold text-[#2D2327] dark:text-[#FAF4F0] block">
                  Vez de: {activeTurnName}
                </span>
                <span className="text-[11px] text-[#7D6F74] dark:text-[#B8A8AF]">
                  Toque numa coordenada para disparar o torpedo
                </span>
              </div>
            </div>

            {lastShotResult && (
              <span className="text-xs font-semibold px-3 py-1 rounded-full bg-[var(--pill-bg)] text-[var(--pill-text)] border border-[var(--pill-border)] animate-in fade-in">
                {lastShotResult}
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Primary Target Board (Opponent Radar) */}
            <div className="lg:col-span-2 p-4 rounded-3xl bg-white dark:bg-[#20181D] border border-[var(--card-border)] space-y-3 shadow-xs">
              <h4 className="font-bold text-xs text-[#2D2327] dark:text-[#FAF4F0] flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Crosshair className="w-4 h-4 text-sky-500" />
                  Radar Inimigo (Onde você atira)
                </span>
                <span className="text-[10px] text-[#7D6F74]">
                  Tiros feitos: {Object.keys(currentTurn === 'p1' ? shotsP1 : shotsP2).length}
                </span>
              </h4>

              {/* 8x8 Shooting Radar */}
              <div className="grid grid-cols-9 gap-1 sm:gap-1.5 p-2 bg-slate-900 rounded-2xl border border-slate-800 shadow-inner max-w-sm sm:max-w-md mx-auto">
                <div className="w-8 h-8 sm:w-10 sm:h-10" />
                {Array.from({ length: 8 }).map((_, c) => (
                  <div key={c} className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center text-xs font-bold text-sky-400">
                    {c + 1}
                  </div>
                ))}

                {LETTERS.map((letter) => (
                  <React.Fragment key={letter}>
                    <div className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center text-xs font-bold text-sky-400">
                      {letter}
                    </div>
                    {Array.from({ length: 8 }).map((_, c) => {
                      const coord = `${letter}${c + 1}`;
                      const myShots = currentTurn === 'p1' ? shotsP1 : shotsP2;
                      const shotStatus = myShots[coord];

                      return (
                        <button
                          key={coord}
                          type="button"
                          disabled={Boolean(shotStatus) || currentTurn === 'p2' && gameMode === 'ai'}
                          onClick={() => handleFireShot(coord)}
                          className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl border flex items-center justify-center text-sm font-black transition-all ${
                            shotStatus === 'hit'
                              ? 'bg-rose-600 border-rose-700 text-white shadow-md animate-in zoom-in'
                              : shotStatus === 'miss'
                              ? 'bg-sky-950 border-sky-800 text-sky-400'
                              : 'bg-slate-800 border-slate-700 hover:bg-slate-700 active:scale-95 text-transparent'
                          }`}
                        >
                          {shotStatus === 'hit' ? '💥' : shotStatus === 'miss' ? '🌊' : ''}
                        </button>
                      );
                    })}
                  </React.Fragment>
                ))}
              </div>
            </div>

            {/* Miniature Fleet Status of Current Player */}
            <div className="p-4 rounded-3xl bg-white dark:bg-[#20181D] border border-[var(--card-border)] space-y-3 shadow-xs">
              <h4 className="font-bold text-xs text-[#2D2327] dark:text-[#FAF4F0] flex items-center gap-1.5">
                <Anchor className="w-4 h-4 text-emerald-500" />
                Sua Frota & Defesa
              </h4>

              <div className="space-y-2">
                {(currentTurn === 'p1' ? fleetP1 : fleetP2).map((ship) => {
                  const enemyShots = currentTurn === 'p1' ? shotsP2 : shotsP1;
                  const hitsCount = ship.coordinates.filter((c) => enemyShots[c] === 'hit').length;
                  const isSunk = hitsCount === ship.size;

                  return (
                    <div
                      key={ship.id}
                      className={`p-2 rounded-xl border flex items-center justify-between text-xs transition-all ${
                        isSunk
                          ? 'bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900/40 text-rose-700 dark:text-rose-300 opacity-60'
                          : 'bg-[var(--pill-bg)] border-[var(--pill-border)] text-[#2D2327] dark:text-[#FAF4F0]'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-base">{isSunk ? '☠️' : '🚢'}</span>
                        <span className="font-semibold text-[11px]">{ship.name}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        {Array.from({ length: ship.size }).map((_, i) => (
                          <span
                            key={i}
                            className={`w-2 h-2 rounded-full ${
                              i < hitsCount ? 'bg-rose-500' : 'bg-emerald-400'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* GAME OVER SCREEN */}
      {stage === 'gameover' && (
        <div className="w-full max-w-lg p-6 rounded-3xl bg-white dark:bg-[#20181D] border-2 border-[var(--border-accent)] text-center space-y-4 shadow-lg animate-in zoom-in-95">
          <div className="w-16 h-16 mx-auto rounded-3xl bg-gradient-to-tr from-amber-400 to-rose-500 text-white flex items-center justify-center text-3xl shadow-md">
            🏆
          </div>
          <h3 className="font-serif font-bold text-xl text-[#2D2327] dark:text-[#FAF4F0]">
            Vitória Naval!
          </h3>
          <p className="text-sm font-semibold text-[var(--border-accent)]">
            {winner === 'p1' ? p1.nickname || p1.name : gameMode === 'ai' ? 'Capitão Cupido 🤖' : p2.nickname || p2.name} afundou toda a frota adversária!
          </p>
          <div className="pt-2">
            <button
              type="button"
              onClick={() => {
                setFleetP1(generateRandomFleet());
                setFleetP2(generateRandomFleet());
                setStage('setup_p1');
              }}
              className="w-full py-3 rounded-2xl bg-[var(--border-accent)] text-white font-bold text-xs shadow-md hover:brightness-105 transition-all flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Jogar Novamente ⚓</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
