import React, { useState, useEffect } from 'react';
import { Search, Trophy, RotateCcw, Eye, Sparkles, CheckCircle2, Clock } from 'lucide-react';

interface HiddenItem {
  id: string;
  name: string;
  icon: string;
  x: number; // percentage from left
  y: number; // percentage from top
  hint: string;
}

interface SceneData {
  id: string;
  title: string;
  theme: string;
  bgGradient: string;
  description: string;
  items: HiddenItem[];
}

const SCENES: SceneData[] = [
  {
    id: 'room',
    title: 'O Quarto & O Escritório Nerd',
    theme: 'Mesa de trabalho, estante de livros e setup gamer',
    bgGradient: 'from-slate-900 via-indigo-950 to-purple-950',
    description: 'Encontre os 6 objetos espalhados pelo quarto e pela escrivaninha!',
    items: [
      { id: 'item-1', name: 'Pen Drive USB', icon: '💾', x: 18, y: 72, hint: 'Perto do teclado na parte inferior esquerda' },
      { id: 'item-2', name: 'Caneca Térmica de Café', icon: '☕', x: 74, y: 35, hint: 'Na estante superior do lado direito' },
      { id: 'item-3', name: 'Chave Dourada Antiga', icon: '🔑', x: 42, y: 84, hint: 'Escondida no rodapé central' },
      { id: 'item-4', name: 'Óculos de Grau', icon: '👓', x: 86, y: 78, hint: 'No canto direito da escrivaninha' },
      { id: 'item-5', name: 'Miniatura de Foguete', icon: '🚀', x: 28, y: 22, hint: 'Na prateleira de cima' },
      { id: 'item-6', name: 'Dado de 20 Lados (D20)', icon: '🎲', x: 55, y: 50, hint: 'Bem no centro do cenário' },
    ],
  },
  {
    id: 'cafe',
    title: 'Cafeteria & Livraria Vintage',
    theme: 'Cafés, livros, plantas e aconchego',
    bgGradient: 'from-amber-950 via-stone-900 to-amber-900',
    description: 'Procure os 6 itens escondidos entre os livros e as mesas do café!',
    items: [
      { id: 'item-1', name: 'Livro de Capa de Couro', icon: '📖', x: 22, y: 38, hint: 'Entre as prateleiras de livros à esquerda' },
      { id: 'item-2', name: 'Fatia de Bolo de Morango', icon: '🍰', x: 68, y: 65, hint: 'Sobre a mesinha baixa à direita' },
      { id: 'item-3', name: 'Ampulheta de Areia', icon: '⏳', x: 82, y: 26, hint: 'No alto perto do relógio de parede' },
      { id: 'item-4', name: 'Lupa de Detetive', icon: '🔍', x: 38, y: 75, hint: 'Atrás da poltrona' },
      { id: 'item-5', name: 'Vaso de Suculenta', icon: '🪴', x: 12, y: 82, hint: 'No chão no cantinho esquerdo' },
      { id: 'item-6', name: 'Câmera Fotográfica', icon: '📷', x: 52, y: 20, hint: 'No balcão superior central' },
    ],
  },
  {
    id: 'park',
    title: 'Jardim Botânico & Estufa',
    theme: 'Natureza, orquídeas, borboletas e trilhas',
    bgGradient: 'from-emerald-950 via-teal-950 to-slate-900',
    description: 'Encontre 6 elementos da natureza e da estufa!',
    items: [
      { id: 'item-1', name: 'Borboleta Azul Rara', icon: '🦋', x: 78, y: 18, hint: 'Voando próximo às copas no alto' },
      { id: 'item-2', name: 'Cogumelo Silvestre', icon: '🍄', x: 25, y: 88, hint: 'Próximo à raiz da árvore no chão' },
      { id: 'item-3', name: 'Binóculos de Observação', icon: '🔭', x: 85, y: 55, hint: 'No parapeito da passarela' },
      { id: 'item-4', name: 'Bússola de Trilha', icon: '🧭', x: 48, y: 72, hint: 'Na trilha de pedras central' },
      { id: 'item-5', name: 'Folha de Trevo de 4 Folhas', icon: '🍀', x: 15, y: 45, hint: 'Camuflado entre as samambaias' },
      { id: 'item-6', name: 'Joaninha Vermelha', icon: '🐞', x: 60, y: 38, hint: 'Descansando no caule da flor central' },
    ],
  },
];

export const HiddenObjectsGame: React.FC = () => {
  const [selectedSceneIdx, setSelectedSceneIdx] = useState(0);
  const [foundIds, setFoundIds] = useState<string[]>([]);
  const [activeHint, setActiveHint] = useState<string | null>(null);
  const [seconds, setSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(true);
  const [lastClickedPos, setLastClickedPos] = useState<{ x: number; y: number } | null>(null);

  const scene = SCENES[selectedSceneIdx];
  const isFinished = foundIds.length === scene.items.length;

  useEffect(() => {
    setFoundIds([]);
    setSeconds(0);
    setIsRunning(true);
    setActiveHint(null);
  }, [selectedSceneIdx]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isRunning && !isFinished) {
      timer = setInterval(() => setSeconds((s) => s + 1), 1000);
    }
    return () => clearInterval(timer);
  }, [isRunning, isFinished]);

  const handleItemClick = (e: React.MouseEvent, item: HiddenItem) => {
    e.stopPropagation();
    if (!foundIds.includes(item.id)) {
      setFoundIds((prev) => [...prev, item.id]);
      setActiveHint(null);
    }
  };

  const handleSceneClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = ((e.clientX - rect.left) / rect.width) * 100;
    const clickY = ((e.clientY - rect.top) / rect.height) * 100;

    setLastClickedPos({ x: clickX, y: clickY });
    setTimeout(() => setLastClickedPos(null), 700);
  };

  const formatTime = (totalSec: number) => {
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="space-y-4">
      {/* Header Controls */}
      <div className="flex items-center justify-between gap-3 flex-wrap bg-white dark:bg-[#20181D] p-4 rounded-3xl border border-[#F2E8E4] dark:border-[#3D2F36]">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-2xl bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-300 flex items-center justify-center">
            <Search className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-serif font-bold text-base text-[#2D2327] dark:text-[#FAF4F0]">
              {scene.title}
            </h3>
            <p className="text-xs text-[#7D6F74] dark:text-[#B8A8AF]">{scene.theme}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Timer */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-xs font-semibold text-[#2D2327] dark:text-[#FAF4F0]">
            <Clock className="w-3.5 h-3.5 text-[#E07A8B]" />
            <span>{formatTime(seconds)}</span>
          </div>

          {/* Scene selector */}
          <select
            value={selectedSceneIdx}
            onChange={(e) => setSelectedSceneIdx(Number(e.target.value))}
            className="px-3 py-1.5 rounded-xl bg-[#FAF8F5] dark:bg-[#2A2026] border border-[#F2E8E4] dark:border-[#3D2F36] text-xs text-[#2D2327] dark:text-[#FAF4F0]"
          >
            {SCENES.map((sc, idx) => (
              <option key={sc.id} value={idx}>
                {sc.title}
              </option>
            ))}
          </select>

          {/* Reset */}
          <button
            onClick={() => {
              setFoundIds([]);
              setSeconds(0);
              setActiveHint(null);
            }}
            className="p-2 rounded-xl text-[#7D6F74] hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            title="Reiniciar cena"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Target Items Checklist */}
      <div className="bg-white dark:bg-[#20181D] p-3 rounded-2xl border border-[#F2E8E4] dark:border-[#3D2F36]">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold text-[#2D2327] dark:text-[#FAF4F0]">
            Objetos para Encontrar ({foundIds.length}/{scene.items.length}):
          </span>
          <span className="text-[11px] text-[#7D6F74]">
            {isFinished ? '🎉 Parabéns! Todos encontrados!' : 'Clique no item escondido na tela'}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
          {scene.items.map((item) => {
            const isFound = foundIds.includes(item.id);
            return (
              <div
                key={item.id}
                className={`p-2 rounded-xl border flex items-center gap-2 transition-all ${
                  isFound
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800/60 opacity-60 line-through text-emerald-800 dark:text-emerald-300'
                    : 'bg-[#FAF8F5] dark:bg-[#2A2026] border-[#F2E8E4] dark:border-[#3D2F36] text-[#2D2327] dark:text-[#FAF4F0]'
                }`}
              >
                <span className="text-base shrink-0">{item.icon}</span>
                <span className="text-xs font-medium truncate flex-1">{item.name}</span>
                {isFound ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                ) : (
                  <button
                    onClick={() => setActiveHint(item.hint)}
                    title="Pedir dica para este item"
                    className="text-[10px] text-[#E07A8B] hover:underline shrink-0"
                  >
                    Dica
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {activeHint && (
          <div className="mt-2 p-2 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 text-xs text-amber-800 dark:text-amber-200 flex items-center justify-between">
            <span>💡 <strong>Dica:</strong> {activeHint}</span>
            <button onClick={() => setActiveHint(null)} className="text-xs font-bold ml-2">✕</button>
          </div>
        )}
      </div>

      {/* Interactive Game Stage / Scene Canvas */}
      <div
        onClick={handleSceneClick}
        className={`relative w-full h-[420px] sm:h-[480px] rounded-3xl overflow-hidden cursor-crosshair bg-gradient-to-br ${scene.bgGradient} border-2 border-[#F2E8E4] dark:border-[#3D2F36] shadow-inner select-none`}
      >
        {/* Decorative Background Elements and Ambience */}
        <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />

        {/* Ambient furniture / scene silhouettes */}
        <div className="absolute top-10 left-8 text-6xl opacity-20 pointer-events-none">📚</div>
        <div className="absolute top-8 right-12 text-7xl opacity-20 pointer-events-none">🪴</div>
        <div className="absolute bottom-6 left-12 text-7xl opacity-20 pointer-events-none">🛋️</div>
        <div className="absolute bottom-8 right-16 text-8xl opacity-20 pointer-events-none">🖥️</div>
        <div className="absolute top-1/2 left-1/4 text-5xl opacity-15 pointer-events-none">🖼️</div>
        <div className="absolute top-1/3 right-1/3 text-6xl opacity-15 pointer-events-none">🕰️</div>

        {/* Click ripple animation on miss */}
        {lastClickedPos && (
          <div
            className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-none w-8 h-8 rounded-full border-2 border-white/60 animate-ping"
            style={{ left: `${lastClickedPos.x}%`, top: `${lastClickedPos.y}%` }}
          />
        )}

        {/* Hidden Interactive Items */}
        {scene.items.map((item) => {
          const isFound = foundIds.includes(item.id);
          return (
            <button
              key={item.id}
              onClick={(e) => handleItemClick(e, item)}
              style={{ left: `${item.x}%`, top: `${item.y}%` }}
              className={`absolute -translate-x-1/2 -translate-y-1/2 p-2 rounded-2xl transition-transform hover:scale-125 focus:outline-hidden ${
                isFound
                  ? 'scale-125 ring-4 ring-emerald-400 bg-emerald-500/40 animate-bounce shadow-lg'
                  : 'opacity-70 hover:opacity-100'
              }`}
              title={isFound ? `${item.name} (Encontrado!)` : 'O que é isso?'}
            >
              <span className="text-2xl sm:text-3xl filter drop-shadow-md">{item.icon}</span>
              {isFound && (
                <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 px-1.5 py-0.5 rounded-md bg-emerald-600 text-white text-[9px] font-bold whitespace-nowrap">
                  ✓ {item.name}
                </span>
              )}
            </button>
          );
        })}

        {/* Victory Overlay */}
        {isFinished && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center text-white animate-in fade-in duration-300">
            <div className="w-16 h-16 rounded-3xl bg-emerald-500/80 flex items-center justify-center text-3xl mb-3 shadow-lg">
              🏆
            </div>
            <h4 className="font-serif font-bold text-2xl mb-1">Cena Concluída!</h4>
            <p className="text-sm text-zinc-200 mb-4 max-w-sm">
              Você encontrou todos os {scene.items.length} objetos em {formatTime(seconds)}! Visão de detetive aguçada!
            </p>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSelectedSceneIdx((prev) => (prev + 1) % SCENES.length)}
                className="px-4 py-2 rounded-xl bg-[#E07A8B] hover:bg-[#d66a7c] text-white text-xs font-bold shadow-xs transition-colors"
              >
                Próximo Cenário ➡️
              </button>
              <button
                onClick={() => {
                  setFoundIds([]);
                  setSeconds(0);
                }}
                className="px-4 py-2 rounded-xl bg-white/20 hover:bg-white/30 text-white text-xs font-semibold transition-colors"
              >
                Jogar Novamente
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
