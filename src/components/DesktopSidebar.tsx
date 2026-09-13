import React from 'react';
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
  Settings,
  Lock,
  Smartphone,
  Moon,
  Sun,
  RefreshCw,
  Wifi,
} from 'lucide-react';
import { ActiveTab } from './Navigation';
import { AppData, PartnerId } from '../types';
import { PartnerAvatar } from './PartnerAvatar';

interface DesktopSidebarProps {
  activeTab: ActiveTab;
  onChangeTab: (tab: ActiveTab) => void;
  data: AppData;
  activePartner: PartnerId;
  onSelectPartner: (partner: PartnerId) => void;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  onOpenSettings: () => void;
  onOpenConnectionModal?: () => void;
  onLockApp?: () => void;
  onManualSync?: () => void;
  isSyncing?: boolean;
  isOnline?: boolean;
  badgeCounts?: {
    moviesToWatch?: number;
    groceryPending?: number;
  };
}

export const DesktopSidebar: React.FC<DesktopSidebarProps> = ({
  activeTab,
  onChangeTab,
  data,
  activePartner,
  onSelectPartner,
  darkMode,
  onToggleDarkMode,
  onOpenSettings,
  onOpenConnectionModal,
  onLockApp,
  onManualSync,
  isSyncing = false,
  isOnline = false,
  badgeCounts,
}) => {
  const partner1 = data.profile.partner1;
  const partner2 = data.profile.partner2;

  const mainNavItems: { id: ActiveTab; label: string; icon: React.ReactNode; badge?: number }[] = [
    {
      id: 'home',
      label: 'Início',
      icon: <Heart className="w-4 h-4 text-rose-500" />,
    },
    {
      id: 'movies',
      label: 'Filmes & Séries',
      icon: <Film className="w-4 h-4 text-purple-500" />,
      badge: badgeCounts?.moviesToWatch,
    },
    {
      id: 'recipes',
      label: 'Receitas & Cardápio',
      icon: <UtensilsCrossed className="w-4 h-4 text-amber-500" />,
    },
    {
      id: 'pantry_grocery',
      label: 'Compras & Despensa',
      icon: <ShoppingBag className="w-4 h-4 text-emerald-500" />,
      badge: badgeCounts?.groceryPending,
    },
    {
      id: 'home_decor',
      label: 'Nosso Lar & Decoração',
      icon: <Home className="w-4 h-4 text-[#E07A8B]" />,
    },
  ];

  const coupleNavItems: { id: ActiveTab; label: string; icon: React.ReactNode; badge?: number }[] = [
    {
      id: 'calendar',
      label: 'Agenda & Dia a Dia',
      icon: <CalendarCheck className="w-4 h-4 text-sky-500" />,
    },
    {
      id: 'trips',
      label: 'Nossas Viagens',
      icon: <Plane className="w-4 h-4 text-teal-500" />,
    },
    {
      id: 'photos',
      label: 'Álbum de Fotos',
      icon: <Camera className="w-4 h-4 text-pink-500" />,
    },
    {
      id: 'sintonia',
      label: 'Sonhos & Trilha Sonora',
      icon: <Sparkles className="w-4 h-4 text-rose-400" />,
    },
    {
      id: 'consumption',
      label: 'Finanças & Gastos',
      icon: <PieChart className="w-4 h-4 text-indigo-500" />,
    },
    {
      id: 'games',
      label: 'Quiz & Jogos do Amor',
      icon: <Gamepad2 className="w-4 h-4 text-violet-500" />,
    },
  ];

  return (
    <aside className="hidden lg:flex flex-col w-64 xl:w-72 shrink-0 border-r border-[#F2E8E4] dark:border-[#3D2F36] bg-[#FCF8F5] dark:bg-[#1E171B] h-screen sticky top-0 overflow-y-auto p-4 select-none z-30 transition-colors">
      {/* Brand & Couple Identity */}
      <div className="pb-4 border-b border-[#F2E8E4] dark:border-[#3D2F36] space-y-3">
        <div className="flex items-center gap-2.5">
          <div className="relative flex -space-x-2 shrink-0">
            <PartnerAvatar avatar={partner1.avatar} name={partner1.name} size="sm" />
            <PartnerAvatar avatar={partner2.avatar} name={partner2.name} size="sm" />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="font-serif font-bold text-base xl:text-lg text-[#2D2327] dark:text-[#FAF4F0] tracking-tight truncate leading-tight">
              Nosso Canto
            </h1>
            <p className="text-xs text-[#7D6F74] dark:text-[#B8A8AF] truncate">
              {data.profile.coupleName || `${partner1.name} & ${partner2.name}`} 💕
            </p>
          </div>
        </div>

        {/* Active Partner Switcher */}
        <div className="p-1 rounded-2xl bg-white dark:bg-[#271E23] border border-[#F2E8E4] dark:border-[#3D2F36] shadow-2xs">
          <div className="text-[10px] font-semibold tracking-wider uppercase text-[#9B8D93] dark:text-[#9B8D93] px-2 pt-1 pb-1">
            Atuando como
          </div>
          <div className="grid grid-cols-2 gap-1">
            <button
              type="button"
              onClick={() => onSelectPartner('partner1')}
              className={`flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                activePartner === 'partner1'
                  ? 'bg-[#E07A8B] text-white shadow-2xs'
                  : 'text-[#7D6F74] dark:text-[#B8A8AF] hover:text-[#2D2327] dark:hover:text-white'
              }`}
            >
              <PartnerAvatar avatar={partner1.avatar} name={partner1.name} size="xs" />
              <span className="truncate">{partner1.name}</span>
            </button>
            <button
              type="button"
              onClick={() => onSelectPartner('partner2')}
              className={`flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                activePartner === 'partner2'
                  ? 'bg-[#E07A8B] text-white shadow-2xs'
                  : 'text-[#7D6F74] dark:text-[#B8A8AF] hover:text-[#2D2327] dark:hover:text-white'
              }`}
            >
              <PartnerAvatar avatar={partner2.avatar} name={partner2.name} size="xs" />
              <span className="truncate">{partner2.name}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 py-4 space-y-5 overflow-y-auto scrollbar-none">
        {/* Principal */}
        <div className="space-y-1">
          <div className="text-[10px] font-bold tracking-wider uppercase text-[#9B8D93] dark:text-[#8D7F85] px-3 pb-1">
            Principal
          </div>
          {mainNavItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onChangeTab(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs xl:text-sm font-medium transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[#E07A8B] text-white shadow-2xs font-semibold'
                    : 'text-[#5C4D53] dark:text-[#C5B8BF] hover:bg-white/70 dark:hover:bg-[#281F25] hover:text-[#2D2327] dark:hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2.5 truncate">
                  <span className={`shrink-0 ${isActive ? 'text-white' : ''}`}>{item.icon}</span>
                  <span className="truncate">{item.label}</span>
                </div>
                {item.badge !== undefined && item.badge > 0 && (
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                      isActive ? 'bg-white text-[#E07A8B]' : 'bg-[#E07A8B]/15 text-[#E07A8B]'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Nossa Vida a Dois */}
        <div className="space-y-1">
          <div className="text-[10px] font-bold tracking-wider uppercase text-[#9B8D93] dark:text-[#8D7F85] px-3 pb-1">
            Nossa Vida a Dois
          </div>
          {coupleNavItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onChangeTab(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs xl:text-sm font-medium transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[#E07A8B] text-white shadow-2xs font-semibold'
                    : 'text-[#5C4D53] dark:text-[#C5B8BF] hover:bg-white/70 dark:hover:bg-[#281F25] hover:text-[#2D2327] dark:hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2.5 truncate">
                  <span className={`shrink-0 ${isActive ? 'text-white' : ''}`}>{item.icon}</span>
                  <span className="truncate">{item.label}</span>
                </div>
                {item.badge !== undefined && item.badge > 0 && (
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                      isActive ? 'bg-white text-[#E07A8B]' : 'bg-[#E07A8B]/15 text-[#E07A8B]'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Footer Controls & Cloud Status */}
      <div className="pt-3 border-t border-[#F2E8E4] dark:border-[#3D2F36] space-y-2">
        {/* Sincronização em Nuvem */}
        <button
          type="button"
          onClick={onManualSync}
          disabled={isSyncing}
          className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-white dark:bg-[#271E23] border border-[#F2E8E4] dark:border-[#3D2F36] text-xs text-[#7D6F74] dark:text-[#B8A8AF] hover:text-[#2D2327] dark:hover:text-white hover:border-[#E07A8B]/40 transition-all cursor-pointer shadow-2xs"
          title="Sincronizar dados com o celular e nuvem agora"
        >
          <div className="flex items-center gap-2">
            <RefreshCw
              className={`w-3.5 h-3.5 ${
                isSyncing ? 'animate-spin text-[#E07A8B]' : isOnline ? 'text-emerald-500' : 'text-amber-500'
              }`}
            />
            <span className="text-[11px] font-medium">
              {isSyncing ? 'Sincronizando...' : isOnline ? 'Conectado à Nuvem' : 'Sincronizar Nuvem'}
            </span>
          </div>
          <span className="text-[10px] font-bold text-[#E07A8B]">Atualizar</span>
        </button>

        {/* Action icons bar */}
        <div className="grid grid-cols-4 gap-1.5 pt-1">
          {onOpenConnectionModal && (
            <button
              type="button"
              onClick={onOpenConnectionModal}
              className="flex items-center justify-center p-2 rounded-xl bg-white dark:bg-[#271E23] border border-[#F2E8E4] dark:border-[#3D2F36] text-[#7D6F74] dark:text-[#B8A8AF] hover:text-[#E07A8B] hover:border-[#E07A8B]/50 transition-all cursor-pointer shadow-2xs"
              title="Conectar Celular / QR Code"
            >
              <Smartphone className="w-4 h-4 text-[#E07A8B]" />
            </button>
          )}

          <button
            type="button"
            onClick={onToggleDarkMode}
            className="flex items-center justify-center p-2 rounded-xl bg-white dark:bg-[#271E23] border border-[#F2E8E4] dark:border-[#3D2F36] text-[#7D6F74] dark:text-[#B8A8AF] hover:text-[#E07A8B] transition-all cursor-pointer shadow-2xs"
            title={darkMode ? 'Modo Claro' : 'Modo Escuro'}
          >
            {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-400" />}
          </button>

          <button
            type="button"
            onClick={onOpenSettings}
            className="flex items-center justify-center p-2 rounded-xl bg-white dark:bg-[#271E23] border border-[#F2E8E4] dark:border-[#3D2F36] text-[#7D6F74] dark:text-[#B8A8AF] hover:text-[#E07A8B] transition-all cursor-pointer shadow-2xs"
            title="Configurações do Casal & Backup"
          >
            <Settings className="w-4 h-4" />
          </button>

          {onLockApp && (
            <button
              type="button"
              onClick={onLockApp}
              className="flex items-center justify-center p-2 rounded-xl bg-white dark:bg-[#271E23] border border-[#F2E8E4] dark:border-[#3D2F36] text-[#7D6F74] dark:text-[#B8A8AF] hover:text-rose-500 transition-all cursor-pointer shadow-2xs"
              title="Bloquear Aplicativo"
            >
              <Lock className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </aside>
  );
};
