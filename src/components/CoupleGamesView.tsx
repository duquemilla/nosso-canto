import React, { useState } from 'react';
import {
  Gamepad2,
  ChevronRight,
  LayoutGrid,
  CheckCircle2,
} from 'lucide-react';
import { CoupleProfile, PartnerId } from '../types';
import { SudokuGame } from './SudokuGame';
import { CoupleCrosswordGame } from './CoupleCrosswordGame';
import { TetrisGame } from './TetrisGame';
import { MergeGame } from './MergeGame';
import { SolitaireGame } from './SolitaireGame';
import { PokemonGame } from './PokemonGame';
import { WordleGame } from './WordleGame';
import { WordSearchGame } from './WordSearchGame';
import { HiddenObjectsGame } from './HiddenObjectsGame';
import { BrainTeasersGame } from './BrainTeasersGame';

interface CoupleGamesViewProps {
  profile: CoupleProfile;
  activePartner: PartnerId;
}

export type GameSubTab =
  | 'hiddenobjects'
  | 'brainteasers'
  | 'sudoku'
  | 'wordsearch'
  | 'wordle'
  | 'crossword'
  | 'merge'
  | 'solitaire'
  | 'tetris'
  | 'pokemon';

interface GameItem {
  id: GameSubTab;
  title: string;
  icon: string;
  category: 'logic' | 'words' | 'arcade' | 'cards';
  categoryLabel: string;
  description: string;
  badge?: string;
  badgeColor?: string;
}

const ALL_GAMES: GameItem[] = [
  {
    id: 'hiddenobjects',
    title: 'Achar Objetos Escondidos',
    icon: '🔎',
    category: 'logic',
    categoryLabel: 'Atenção & Detetive',
    description: 'Encontre itens camuflados pelo escritório nerd, cafeteria vintage e jardim botânico!',
    badge: 'NOVO 🔎',
    badgeColor: 'bg-indigo-500 text-white',
  },
  {
    id: 'brainteasers',
    title: 'Desafios de Lógica & Raciocínio',
    icon: '🧠',
    category: 'logic',
    categoryLabel: 'Lógica Pura',
    description: 'Enigmas clássicos de travessia de rio, lâmpadas, balança de pratos e pensamento lateral.',
    badge: 'NOVO 🧠',
    badgeColor: 'bg-amber-500 text-white',
  },
  {
    id: 'sudoku',
    title: 'Sudoku do Amor',
    icon: '🧩',
    category: 'logic',
    categoryLabel: 'Lógica & Foco',
    description: 'Preencha a grade 9x9 com números sem repetir. Inclui modo anotações (lápis), dicas e níveis Fácil, Médio e Difícil!',
    badge: 'DESTAQUE',
    badgeColor: 'bg-rose-500 text-white',
  },
  {
    id: 'wordsearch',
    title: 'Caça-Palavras Interativo',
    icon: '🔍',
    category: 'words',
    categoryLabel: 'Nerd & Foco',
    description: 'Encontre palavras escondidas com temas nerd, dev, Pokémon, espaço e carinho entre JP & POA!',
    badge: 'NOVO ✨',
    badgeColor: 'bg-indigo-500 text-white',
  },
  {
    id: 'wordle',
    title: 'Termo / Letreco',
    icon: '🔤',
    category: 'words',
    categoryLabel: 'Palavras',
    description: 'Adivinhe a palavra secreta de 5 letras em até 6 tentativas com pistas coloridas.',
    badge: 'Popular',
    badgeColor: 'bg-emerald-500 text-white',
  },
  {
    id: 'crossword',
    title: 'Palavras Cruzadas',
    icon: '✏️',
    category: 'words',
    categoryLabel: 'Palavras',
    description: 'Cruzadas inteligentes com pistas românticas sobre o casal, viagens e conhecimento.',
  },
  {
    id: 'merge',
    title: 'Merge 2048 Frutas',
    icon: '🍇',
    category: 'logic',
    categoryLabel: 'Lógica',
    description: 'Deslize e funda as frutas iguais até alcançar a lendária melancia 2048!',
  },
  {
    id: 'solitaire',
    title: 'Paciência Klondike',
    icon: '♠️',
    category: 'cards',
    categoryLabel: 'Cartas',
    description: 'O clássico jogo de cartas solitário para relaxar sem pressa a qualquer momento.',
  },
  {
    id: 'tetris',
    title: 'Tetris Clássico',
    icon: '🧱',
    category: 'arcade',
    categoryLabel: 'Arcade Retrô',
    description: 'Encaixe os blocos coloridos, complete linhas e quebre seus recordes!',
  },
  {
    id: 'pokemon',
    title: 'Quem é esse Pokémon?',
    icon: '⚡',
    category: 'arcade',
    categoryLabel: 'Nostalgia Cassi',
    description: 'Adivinhe a silhueta misteriosa dos monstrinhos clássicos favoritos!',
    badge: 'Cassi ⚡',
    badgeColor: 'bg-amber-500 text-white',
  },
];

export const CoupleGamesView: React.FC<CoupleGamesViewProps> = ({ profile, activePartner }) => {
  // Start with Sudoku as requested
  const [selectedSubTab, setSelectedSubTab] = useState<GameSubTab>('sudoku');
  const [isViewingHub, setIsViewingHub] = useState(false);

  const currentGame = ALL_GAMES.find((g) => g.id === selectedSubTab) || ALL_GAMES[0];

  const handleSelectGame = (gameId: GameSubTab) => {
    setSelectedSubTab(gameId);
    setIsViewingHub(false);
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      {/* Top Games Navigation Card */}
      <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-[#20181D] border border-[#F2E8E4] dark:border-[#3D2F36] shadow-xs space-y-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#E07A8B] to-[#F4A6B3] text-white flex items-center justify-center shadow-sm shadow-rose-200/50 shrink-0">
              <Gamepad2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-serif font-bold text-lg sm:text-xl text-[#2D2327] dark:text-[#FAF4F0]">
                  Sala de Jogos & Lógica
                </h2>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-rose-50 dark:bg-rose-950/60 text-[#E07A8B] border border-rose-200/60 dark:border-rose-900/60 font-semibold">
                  8 Jogos
                </span>
              </div>
              <p className="text-xs text-[#7D6F74] dark:text-[#B8A8AF]">
                Jogos individuais selecionados para curtir à distância entre JP & POA 💕
              </p>
            </div>
          </div>

          {/* Toggle between Active Game and All Games Grid */}
          <button
            type="button"
            onClick={() => setIsViewingHub((prev) => !prev)}
            className={`px-3.5 py-2 rounded-2xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer shadow-2xs shrink-0 self-start sm:self-auto ${
              isViewingHub
                ? 'bg-[#E07A8B] text-white shadow-sm'
                : 'bg-rose-50 dark:bg-rose-950/50 text-[#E07A8B] hover:bg-rose-100 dark:hover:bg-rose-900/50 border border-rose-200/80 dark:border-rose-800/60'
            }`}
          >
            <LayoutGrid className="w-4 h-4" />
            <span>{isViewingHub ? 'Voltar ao Jogo' : 'Ver Todos os Jogos'}</span>
          </button>
        </div>

        {/* Clean, Modern Quick Tabs Selector */}
        <div className="pt-2 border-t border-[#F2E8E4] dark:border-[#3D2F36]">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar scroll-smooth pb-0.5">
            {ALL_GAMES.map((game) => {
              const isActive = !isViewingHub && selectedSubTab === game.id;
              return (
                <button
                  key={game.id}
                  type="button"
                  onClick={() => handleSelectGame(game.id)}
                  className={`px-3.5 py-2 rounded-2xl text-xs font-medium whitespace-nowrap shrink-0 transition-all flex items-center gap-2 cursor-pointer ${
                    isActive
                      ? 'bg-gradient-to-r from-[#E07A8B] to-[#F4A6B3] text-white shadow-xs font-semibold'
                      : 'bg-[#FAF8F5] dark:bg-[#271E23] text-[#7D6F74] dark:text-[#B8A8AF] hover:bg-rose-50/70 dark:hover:bg-[#33222A] hover:text-[#2D2327] dark:hover:text-white border border-[#F2E8E4] dark:border-[#3D2F36]'
                  }`}
                >
                  <span className="text-sm">{game.icon}</span>
                  <span>{game.title}</span>
                  {game.badge && (
                    <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-bold uppercase ${
                      isActive ? 'bg-white/30 text-white' : game.badgeColor || 'bg-rose-100 text-rose-700'
                    }`}>
                      {game.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* HUB VIEW: ALL GAMES GRID */}
      {/* ============================================================ */}
      {isViewingHub ? (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {ALL_GAMES.map((game) => {
              const isCurrent = selectedSubTab === game.id;
              return (
                <div
                  key={game.id}
                  onClick={() => handleSelectGame(game.id)}
                  className={`group relative p-5 rounded-3xl border transition-all cursor-pointer flex flex-col justify-between hover:shadow-md hover:-translate-y-0.5 ${
                    isCurrent
                      ? 'bg-gradient-to-br from-rose-50 via-white to-rose-50/50 dark:from-[#2A1D23] dark:via-[#20181D] dark:to-[#2F1F27] border-[#E07A8B] ring-2 ring-[#E07A8B]/30'
                      : 'bg-white dark:bg-[#20181D] border-[#F2E8E4] dark:border-[#3D2F36] hover:border-[#E07A8B]/60'
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-100 dark:border-rose-900/40 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                        {game.icon}
                      </div>
                      <div className="flex items-center gap-1.5 flex-wrap justify-end">
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#FAF8F5] dark:bg-[#271E23] text-[#7D6F74] dark:text-[#B8A8AF] border border-[#F2E8E4] dark:border-[#3D2F36]">
                          {game.categoryLabel}
                        </span>
                        {game.badge && (
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                              game.badgeColor || 'bg-[#E07A8B] text-white'
                            }`}
                          >
                            {game.badge}
                          </span>
                        )}
                      </div>
                    </div>

                    <div>
                      <h3 className="font-serif font-bold text-base text-[#2D2327] dark:text-[#FAF4F0] group-hover:text-[#E07A8B] transition-colors">
                        {game.title}
                      </h3>
                      <p className="text-xs text-[#7D6F74] dark:text-[#B8A8AF] line-clamp-2 mt-1 leading-relaxed">
                        {game.description}
                      </p>
                    </div>
                  </div>

                  <div className="pt-4 flex items-center justify-between border-t border-[#F2E8E4]/60 dark:border-[#3D2F36]/60 mt-3">
                    <span className="text-[11px] font-semibold text-[#E07A8B] flex items-center gap-1">
                      Jogar agora <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                    </span>
                    {isCurrent && (
                      <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        Aberto
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* ============================================================ */
        /* ACTIVE GAME VIEW */
        /* ============================================================ */
        <div className="space-y-4">
          {/* NOVO: ACHAR OBJETOS ESCONDIDOS */}
          {selectedSubTab === 'hiddenobjects' && (
            <HiddenObjectsGame />
          )}

          {/* NOVO: DESAFIOS DE LÓGICA / BRAIN TEASERS */}
          {selectedSubTab === 'brainteasers' && (
            <BrainTeasersGame />
          )}

          {/* 1. SUDOKU (First & Highlighted) */}
          {selectedSubTab === 'sudoku' && (
            <SudokuGame onBack={() => setIsViewingHub(true)} />
          )}

          {/* 2. CAÇA-PALAVRAS INTERATIVO */}
          {selectedSubTab === 'wordsearch' && (
            <WordSearchGame profile={profile} activePartner={activePartner} onBack={() => setIsViewingHub(true)} />
          )}

          {/* 3. TERMO / LETRECO */}
          {selectedSubTab === 'wordle' && (
            <WordleGame profile={profile} activePartner={activePartner} />
          )}

          {/* 3. PALAVRAS CRUZADAS */}
          {selectedSubTab === 'crossword' && (
            <CoupleCrosswordGame profile={profile} activePartner={activePartner} />
          )}

          {/* 4. PACIÊNCIA KLONDIKE */}
          {selectedSubTab === 'solitaire' && <SolitaireGame />}

          {/* 5. TETRIS CLÁSSICO */}
          {selectedSubTab === 'tetris' && <TetrisGame />}

          {/* 6. MERGE 2048 FRUTAS */}
          {selectedSubTab === 'merge' && <MergeGame />}

          {/* 7. QUEM É ESSE POKÉMON */}
          {selectedSubTab === 'pokemon' && (
            <PokemonGame profile={profile} activePartner={activePartner} />
          )}
        </div>
      )}
    </div>
  );
};
