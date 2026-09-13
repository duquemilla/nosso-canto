import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
  Heart,
  Film,
  UtensilsCrossed,
  ShoppingBag,
  Home,
  CalendarCheck,
  Plane,
  Camera,
  PieChart,
  Sparkles,
  Gamepad2,
  ChevronLeft,
  ChevronRight,
  Compass,
  Bot,
} from 'lucide-react';

export type ActiveTab =
  | 'home'
  | 'movies'
  | 'recipes'
  | 'pantry_grocery'
  | 'home_decor'
  | 'calendar'
  | 'trips'
  | 'photos'
  | 'consumption'
  | 'lumina'
  | 'games'
  | 'sintonia';

interface NavigationProps {
  activeTab: ActiveTab;
  onChangeTab: (tab: ActiveTab) => void;
  layout?: 'sidebar' | 'horizontal';
  badgeCounts?: {
    moviesToWatch?: number;
    groceryPending?: number;
    pantryExpiring?: number;
  };
}

interface NavItem {
  id: ActiveTab;
  label: string;
  icon: React.ReactNode;
  badge?: number;
  section: 'main' | 'couple';
}

export const Navigation: React.FC<NavigationProps> = ({
  activeTab,
  onChangeTab,
  layout = 'horizontal',
  badgeCounts,
}) => {
  const navRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScroll = useCallback(() => {
    const el = navRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    setCanScrollLeft(scrollLeft > 4);
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 4);
  }, []);

  useEffect(() => {
    if (layout !== 'horizontal') return;
    checkScroll();
    window.addEventListener('resize', checkScroll);
    return () => window.removeEventListener('resize', checkScroll);
  }, [checkScroll, layout]);

  // Center active tab into view when changed (horizontal only)
  useEffect(() => {
    if (layout !== 'horizontal') return;
    const el = navRef.current;
    if (el) {
      const activeBtn = el.querySelector<HTMLElement>('[data-active="true"]');
      if (activeBtn) {
        activeBtn.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
      setTimeout(checkScroll, 300);
    }
  }, [activeTab, checkScroll, layout]);

  const handleScroll = (direction: 'left' | 'right') => {
    const el = navRef.current;
    if (!el) return;
    const scrollAmount = Math.max(el.clientWidth * 0.6, 220);
    el.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    });
    setTimeout(checkScroll, 300);
  };

  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    const el = navRef.current;
    if (!el) return;
    if (e.deltaY !== 0) {
      el.scrollLeft += e.deltaY;
      checkScroll();
    }
  };

  const navItems: NavItem[] = [
    {
      id: 'home',
      label: 'Início',
      icon: <Heart className="w-4 h-4 text-rose-500 fill-rose-500/20" />,
      section: 'main',
    },
    {
      id: 'movies',
      label: 'Filmes & Séries',
      icon: <Film className="w-4 h-4 text-purple-500" />,
      badge: badgeCounts?.moviesToWatch,
      section: 'main',
    },
    {
      id: 'recipes',
      label: 'Receitas com IA',
      icon: <UtensilsCrossed className="w-4 h-4 text-amber-500" />,
      section: 'main',
    },
    {
      id: 'pantry_grocery',
      label: 'Mercado & Despensa',
      icon: <ShoppingBag className="w-4 h-4 text-emerald-500" />,
      badge: (badgeCounts?.groceryPending || 0) + (badgeCounts?.pantryExpiring || 0),
      section: 'main',
    },
    {
      id: 'home_decor',
      label: 'Nosso Lar & Decoração',
      icon: <Home className="w-4 h-4 text-pink-500" />,
      section: 'main',
    },
    {
      id: 'calendar',
      label: 'Agenda & Dia a Dia',
      icon: <CalendarCheck className="w-4 h-4 text-sky-500" />,
      section: 'couple',
    },
    {
      id: 'trips',
      label: 'Nossas Viagens',
      icon: <Plane className="w-4 h-4 text-teal-500" />,
      section: 'couple',
    },
    {
      id: 'photos',
      label: 'Álbum de Memórias',
      icon: <Camera className="w-4 h-4 text-rose-400" />,
      section: 'couple',
    },
    {
      id: 'consumption',
      label: 'Gastos',
      icon: <PieChart className="w-4 h-4 text-indigo-500" />,
      section: 'couple',
    },
    {
      id: 'lumina',
      label: 'Lumina AI ✨',
      icon: <Bot className="w-4 h-4 text-purple-500" />,
      section: 'couple',
    },
    {
      id: 'games',
      label: 'Joguinhos 💕',
      icon: <Gamepad2 className="w-4 h-4 text-violet-500" />,
      section: 'couple',
    },
    {
      id: 'sintonia',
      label: 'Sintonia 💕',
      icon: <Sparkles className="w-4 h-4 text-[#E07A8B]" />,
      section: 'couple',
    },
  ];

  // =========================================================================
  // 1. VERTICAL SIDEBAR LAYOUT (For Desktop / PC on the left side)
  // =========================================================================
  if (layout === 'sidebar') {
    const mainItems = navItems.filter((i) => i.section === 'main');
    const coupleItems = navItems.filter((i) => i.section === 'couple');

    return (
      <nav
        aria-label="Menu Lateral do Aplicativo"
        className="w-full bg-white/90 dark:bg-[#20181D]/90 backdrop-blur-md rounded-3xl border border-[#F2E8E4] dark:border-[#3D2F36] p-3 shadow-xs space-y-4 select-none"
      >
        {/* Navigation Group: Principal */}
        <div className="space-y-1">
          <div className="text-[10px] font-bold tracking-wider uppercase text-[#9B8D93] dark:text-[#8D7F85] px-3 py-1">
            Principal
          </div>
          {mainItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                data-active={isActive}
                onClick={() => onChangeTab(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs xl:text-sm font-medium transition-all duration-150 cursor-pointer ${
                  isActive
                    ? 'bg-[#E07A8B] text-white shadow-xs font-semibold'
                    : 'text-[#5C4D53] dark:text-[#C5B8BF] hover:bg-rose-50/70 dark:hover:bg-[#2A1E25] hover:text-[#2D2327] dark:hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2.5 truncate">
                  <span className={`shrink-0 ${isActive ? 'text-white' : ''}`}>
                    {item.icon}
                  </span>
                  <span className="truncate">{item.label}</span>
                </div>
                {item.badge !== undefined && item.badge > 0 && (
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                      isActive
                        ? 'bg-white text-[#E07A8B]'
                        : 'bg-[#E07A8B]/15 text-[#E07A8B]'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Navigation Group: Nossa Vida a Dois */}
        <div className="space-y-1 pt-1 border-t border-[#F2E8E4]/70 dark:border-[#3D2F36]/70">
          <div className="text-[10px] font-bold tracking-wider uppercase text-[#9B8D93] dark:text-[#8D7F85] px-3 py-1">
            Nossa Vida a Dois
          </div>
          {coupleItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                data-active={isActive}
                onClick={() => onChangeTab(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs xl:text-sm font-medium transition-all duration-150 cursor-pointer ${
                  isActive
                    ? 'bg-[#E07A8B] text-white shadow-xs font-semibold'
                    : 'text-[#5C4D53] dark:text-[#C5B8BF] hover:bg-rose-50/70 dark:hover:bg-[#2A1E25] hover:text-[#2D2327] dark:hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2.5 truncate">
                  <span className={`shrink-0 ${isActive ? 'text-white' : ''}`}>
                    {item.icon}
                  </span>
                  <span className="truncate">{item.label}</span>
                </div>
                {item.badge !== undefined && item.badge > 0 && (
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                      isActive
                        ? 'bg-white text-[#E07A8B]'
                        : 'bg-[#E07A8B]/15 text-[#E07A8B]'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Sweet Long Distance Relationship Badge */}
        <div className="pt-2 border-t border-[#F2E8E4]/70 dark:border-[#3D2F36]/70">
          <div className="p-3 rounded-2xl bg-gradient-to-br from-rose-50/80 via-white to-pink-50/60 dark:from-[#2A1E24] dark:via-[#20181D] dark:to-[#2F1F27] border border-rose-200/50 dark:border-rose-900/40 text-center space-y-1">
            <div className="flex items-center justify-center gap-1 text-[11px] font-bold text-[#E07A8B]">
              <span>João Pessoa</span>
              <Plane className="w-3 h-3 text-[#E07A8B]" />
              <span>Porto Alegre</span>
            </div>
            <p className="text-[10px] text-[#7D6F74] dark:text-[#B8A8AF] leading-tight">
              Milla & Cassi 💕 Amor que encurta qualquer distância.
            </p>
          </div>
        </div>
      </nav>
    );
  }

  // =========================================================================
  // 2. HORIZONTAL LAYOUT (For mobile & small screens)
  // =========================================================================
  return (
    <div className="w-full border-b border-[var(--card-border)] bg-[var(--bg-main)]/90 backdrop-blur-md sticky top-16 z-30 transition-colors">
      <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-6 relative flex items-center">
        {canScrollLeft && (
          <button
            type="button"
            onClick={() => handleScroll('left')}
            aria-label="Rolar abas para a esquerda"
            className="hidden md:flex shrink-0 mr-1.5 p-1.5 rounded-full bg-white dark:bg-[#2A1E25] border border-[var(--card-border)] shadow-xs text-[#7D6F74] dark:text-[#FAF4F0] hover:text-[#E07A8B] transition-all hover:scale-105 active:scale-95 z-10"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        )}

        <nav
          ref={navRef}
          onScroll={checkScroll}
          onWheel={handleWheel}
          className="flex space-x-1 sm:space-x-1.5 overflow-x-auto py-2 px-1 no-scrollbar scroll-smooth w-full"
          aria-label="Abas do aplicativo"
        >
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                data-active={isActive}
                onClick={() => onChangeTab(item.id)}
                className={`theme-pill-btn flex items-center gap-1.5 px-3.5 py-1.5 text-xs sm:text-sm whitespace-nowrap transition-all duration-150 shrink-0 ${
                  isActive ? 'active' : ''
                }`}
              >
                <span className="shrink-0">{item.icon}</span>
                <span>{item.label}</span>
                {item.badge !== undefined && item.badge > 0 && (
                  <span
                    className="ml-0.5 text-[10px] px-1.5 py-0.2 rounded-full font-bold"
                    style={{
                      backgroundColor: isActive ? 'var(--border-accent)' : 'var(--badge-bg)',
                      color: isActive ? '#FFFFFF' : 'var(--badge-text)',
                    }}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {canScrollRight && (
          <button
            type="button"
            onClick={() => handleScroll('right')}
            aria-label="Rolar abas para a direita"
            className="hidden md:flex shrink-0 ml-1.5 p-1.5 rounded-full bg-white dark:bg-[#2A1E25] border border-[var(--card-border)] shadow-xs text-[#7D6F74] dark:text-[#FAF4F0] hover:text-[#E07A8B] transition-all hover:scale-105 active:scale-95 z-10"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};
