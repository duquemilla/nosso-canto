import React, { useState } from 'react';
import {
  Heart,
  Moon,
  Sun,
  Bell,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Sparkles,
  Settings,
  Wifi,
  Film,
  UtensilsCrossed,
  ShoppingBag,
  Smartphone,
  Lock,
  Trash2,
  X,
  RefreshCw,
  Menu,
} from 'lucide-react';
import { AppData, PartnerId, AppNotification } from '../types';
import { PartnerAvatar } from './PartnerAvatar';

interface HeaderProps {
  data: AppData;
  activePartner: PartnerId;
  onSelectPartner: (id: PartnerId) => void;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  onOpenSettings: () => void;
  onMarkNotificationRead: (id: string) => void;
  onClearNotifications: () => void;
  onClearAllNotifications?: () => void;
  isOnline: boolean;
  onScrollToAnniversary?: () => void;
  onOpenConnectionModal?: () => void;
  onLockApp?: () => void;
  onManualSync?: () => void;
  isSyncing?: boolean;
  onToggleLeftMenu?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  data,
  activePartner,
  onSelectPartner,
  darkMode,
  onToggleDarkMode,
  onOpenSettings,
  onMarkNotificationRead,
  onClearNotifications,
  onClearAllNotifications,
  isOnline,
  onScrollToAnniversary,
  onOpenConnectionModal,
  onLockApp,
  onManualSync,
  isSyncing = false,
  onToggleLeftMenu,
}) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const unreadCount = data.notifications.filter((n) => !n.read).length;

  const currentPartner =
    activePartner === 'partner1' ? data.profile.partner1 : data.profile.partner2;
  const otherPartner =
    activePartner === 'partner1' ? data.profile.partner2 : data.profile.partner1;

  const getNotificationIcon = (type: AppNotification['type']) => {
    switch (type) {
      case 'filme':
        return <Film className="w-4 h-4 text-rose-500" />;
      case 'receita':
        return <UtensilsCrossed className="w-4 h-4 text-amber-500" />;
      case 'despensa':
        return <AlertTriangle className="w-4 h-4 text-amber-600" />;
      case 'compras':
        return <ShoppingBag className="w-4 h-4 text-emerald-500" />;
      case 'aniversario':
      case 'amor':
        return <Heart className="w-4 h-4 text-rose-500 fill-rose-500" />;
      default:
        return <Sparkles className="w-4 h-4 text-rose-400" />;
    }
  };

  return (
    <header className="sticky top-0 z-40 backdrop-blur-md bg-[var(--bg-main)]/95 border-b border-[var(--card-border)] transition-colors duration-200 pt-[env(safe-area-inset-top)]">
      <div className="max-w-7xl mx-auto px-2.5 sm:px-6 lg:px-8 min-h-16 py-2 flex items-center justify-between gap-1.5 sm:gap-2">
        {/* Logo & Couple Title & Left Menu Toggle */}
        <div className="flex items-center gap-1.5 sm:gap-3 shrink min-w-0">
          {onToggleLeftMenu && (
            <button
              type="button"
              onClick={onToggleLeftMenu}
              className="p-2 -ml-1 rounded-2xl text-[#7D6F74] dark:text-[#B8A8AF] hover:bg-rose-50 dark:hover:bg-[#2A1E25] hover:text-[#E07A8B] transition-colors flex items-center gap-1 cursor-pointer"
              title="Menu Lateral (Todas as Abas)"
              aria-label="Abrir Menu Lateral"
            >
              <Menu className="w-5 h-5 text-[#2D2327] dark:text-[#FAF4F0]" />
              <span className="hidden sm:inline md:hidden text-xs font-semibold text-[#2D2327] dark:text-[#FAF4F0]">Menu</span>
            </button>
          )}

          <div
            id="brand-logo"
            onClick={onScrollToAnniversary}
            className="cursor-pointer group flex items-center gap-1.5 sm:gap-2 shrink min-w-0"
            title="Ver contador do relacionamento"
          >
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-2xl bg-gradient-to-tr from-[#E07A8B] to-[#F4A6B3] flex items-center justify-center text-white shadow-sm shadow-rose-200/50 dark:shadow-none group-hover:scale-105 transition-transform shrink-0">
              <Heart className="w-4 h-4 sm:w-5 sm:h-5 fill-white text-white" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1">
                <span className="font-serif font-bold text-sm sm:text-lg text-[#2D2327] dark:text-[#FAF4F0] tracking-tight truncate">
                  Nosso Canto
                </span>
                <span className="hidden sm:inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-300 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                  Conectados
                </span>
              </div>
              <p className="text-[10px] sm:text-[11px] text-[#7D6F74] dark:text-[#B8A8AF] -mt-0.5 block truncate max-w-[85px] xs:max-w-[120px] sm:max-w-none">
                {data.profile.coupleName || 'Camilla & Cassiane'} 💕
              </p>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
          {/* Active Partner Switcher */}
          <div
            id="partner-switcher"
            className="flex items-center p-0.5 rounded-full bg-[#FAF3EC] dark:bg-[#271E23] border border-[#F2E8E4] dark:border-[#3D2F36]"
          >
            <button
              onClick={() => onSelectPartner('partner1')}
              className={`flex items-center gap-1 px-1.5 sm:px-2.5 py-1 rounded-full text-xs font-medium transition-all ${
                activePartner === 'partner1'
                  ? 'bg-white dark:bg-[#3D2F36] text-[#2D2327] dark:text-[#FAF4F0] shadow-sm'
                  : 'text-[#7D6F74] dark:text-[#B8A8AF] hover:text-[#2D2327] dark:hover:text-white'
              }`}
              title={`Atuar como ${data.profile.partner1.name}`}
            >
              <PartnerAvatar avatar={data.profile.partner1.avatar} name={data.profile.partner1.name} size="xs" />
              <span className="hidden md:inline">{data.profile.partner1.name}</span>
            </button>

            <button
              onClick={() => onSelectPartner('partner2')}
              className={`flex items-center gap-1 px-1.5 sm:px-2.5 py-1 rounded-full text-xs font-medium transition-all ${
                activePartner === 'partner2'
                  ? 'bg-white dark:bg-[#3D2F36] text-[#2D2327] dark:text-[#FAF4F0] shadow-sm'
                  : 'text-[#7D6F74] dark:text-[#B8A8AF] hover:text-[#2D2327] dark:hover:text-white'
              }`}
              title={`Atuar como ${data.profile.partner2.name}`}
            >
              <PartnerAvatar avatar={data.profile.partner2.avatar} name={data.profile.partner2.name} size="xs" />
              <span className="hidden md:inline">{data.profile.partner2.name}</span>
            </button>
          </div>

          {/* Connect / Share Device Button - shown on md+ screens to save space on mobile */}
          {onOpenConnectionModal && (
            <button
              onClick={onOpenConnectionModal}
              className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-medium bg-[#FAF3EC] dark:bg-[#271E23] border border-[#F2E8E4] dark:border-[#3D2F36] text-[#7D6F74] dark:text-[#B8A8AF] hover:text-[#E07A8B] hover:border-[#E07A8B] transition-colors"
              title="Conectar celular / Enviar acesso para namorada"
            >
              <Smartphone className="w-3.5 h-3.5 text-[#E07A8B]" />
              <span className="hidden lg:inline">Conectar Celular</span>
            </button>
          )}

          {/* Real-time Indicator / Manual Cloud Sync Button */}
          <button
            type="button"
            onClick={onManualSync}
            disabled={isSyncing}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#FAF3EC] dark:bg-[#271E23] border border-[#F2E8E4] dark:border-[#3D2F36] text-[11px] text-[#7D6F74] dark:text-[#B8A8AF] hover:text-[#2D2327] dark:hover:text-white hover:border-[#E07A8B]/50 transition-all cursor-pointer"
            title="Sincronizar com a nuvem e outro celular agora"
          >
            <RefreshCw
              className={`w-3 h-3 ${isOnline ? 'text-emerald-500' : 'text-amber-500'} ${
                isSyncing ? 'animate-spin text-[#E07A8B]' : ''
              }`}
            />
            <span className="hidden sm:inline">
              {isSyncing ? 'Sincronizando...' : isOnline ? 'Sincronizado' : 'Reconectar'}
            </span>
          </button>

          {/* Notifications Dropdown */}
          <div className="relative">
            <button
              id="notifications-button"
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-1.5 sm:p-2 rounded-full text-[#7D6F74] dark:text-[#B8A8AF] hover:bg-[#FAF3EC] dark:hover:bg-[#271E23] transition-colors"
              title="Notificações e lembretes"
            >
              <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-0.5 right-0.5 w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full bg-[#E07A8B] text-white text-[9px] sm:text-[10px] font-bold flex items-center justify-center animate-pulse">
                  {unreadCount}
                </span>
              )}
            </button>

            {showNotifications && (
              <>
                {/* Backdrop to close on tap outside */}
                <div
                  className="fixed inset-0 z-40 bg-black/20 sm:bg-transparent"
                  onClick={() => setShowNotifications(false)}
                />

                <div
                  id="notifications-dropdown"
                  className="fixed inset-x-3 top-20 sm:absolute sm:inset-auto sm:right-0 sm:top-full sm:mt-2 sm:w-96 rounded-2xl bg-white dark:bg-[#241C21] border border-[#F2E8E4] dark:border-[#3D2F36] shadow-2xl p-4 z-50 animate-in fade-in zoom-in-95 duration-150 max-h-[80vh] flex flex-col"
                >
                  <div className="flex items-center justify-between pb-3 border-b border-[#F2E8E4] dark:border-[#3D2F36] gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <Bell className="w-4 h-4 text-[#E07A8B] shrink-0" />
                      <h3 className="text-sm font-semibold text-[#2D2327] dark:text-[#FAF4F0] truncate">
                        Lembretes & Avisos
                      </h3>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {data.notifications.length > 0 && (
                        <button
                          type="button"
                          onClick={() => {
                            if (onClearAllNotifications) onClearAllNotifications();
                            else if (onClearNotifications) onClearNotifications();
                          }}
                          className="inline-flex items-center gap-1 text-[11px] text-rose-500 hover:text-rose-600 dark:text-rose-400 font-semibold px-2.5 py-1 rounded-lg bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/40 transition-colors cursor-pointer"
                          title="Limpar todas as notificações"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Limpar todas</span>
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setShowNotifications(false)}
                        className="p-1 rounded-lg text-[#7D6F74] hover:text-[#2D2327] dark:hover:text-white hover:bg-[#FAF8F5] dark:hover:bg-[#2F242A] transition-colors cursor-pointer"
                        title="Fechar"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="max-h-72 overflow-y-auto divide-y divide-[#FAF3EC] dark:divide-[#2F242A] mt-2 overscroll-contain">
                    {data.notifications.length === 0 ? (
                      <div className="py-6 px-3 text-center space-y-2">
                        <p className="text-xs font-semibold text-[#2D2327] dark:text-[#FAF4F0]">
                          Nenhuma notificação por aqui! 💕
                        </p>
                        <p className="text-[11px] text-[#7D6F74] dark:text-[#B8A8AF] leading-relaxed">
                          O sininho avisa quando sua namorada adiciona itens na lista de compras do mercado, novas memórias no álbum, viagens planejadas e lembretes de datas do casal.
                        </p>
                      </div>
                    ) : (
                      data.notifications.map((n) => (
                        <div
                          key={n.id}
                          onClick={() => onMarkNotificationRead(n.id)}
                          className={`p-2.5 rounded-xl transition-colors cursor-pointer text-left ${
                            n.read
                              ? 'opacity-70 hover:bg-[#FAF8F5] dark:hover:bg-[#2A2026]'
                              : 'bg-rose-50/50 dark:bg-rose-950/30 font-medium'
                          }`}
                        >
                          <div className="flex items-start gap-2.5">
                            <div className="p-1.5 rounded-lg bg-white dark:bg-[#33272D] shadow-xs shrink-0">
                              {getNotificationIcon(n.type)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-semibold text-[#2D2327] dark:text-[#FAF4F0]">
                                {n.title}
                              </p>
                              <p className="text-[11px] text-[#7D6F74] dark:text-[#B8A8AF] mt-0.5 line-clamp-2">
                                {n.message}
                              </p>
                              <span className="text-[10px] text-[#A6999F] dark:text-[#8C7C83] mt-1 block">
                                {n.timestamp}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Footer hint */}
                  <div className="mt-3 pt-2.5 border-t border-[#F2E8E4] dark:border-[#3D2F36] flex items-center justify-between text-[10px] text-[#A6999F]">
                    <span>🛒 Mercado • 📸 Álbum • ✈️ Viagens</span>
                    <span>💕 Nosso Canto</span>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Theme Toggle (Dark Mode personalizado com tons suaves de rosa e bege) */}
          <button
            id="theme-toggle-button"
            onClick={onToggleDarkMode}
            className="p-1.5 sm:p-2 rounded-full text-[#7D6F74] dark:text-[#B8A8AF] hover:bg-[#FAF3EC] dark:hover:bg-[#271E23] transition-colors shrink-0"
            title={darkMode ? 'Mudar para modo claro (Marfim)' : 'Mudar para modo escuro (Rosé & Bege)'}
            aria-label="Alternar modo escuro"
          >
            {darkMode ? <Sun className="w-4 h-4 sm:w-5 sm:h-5 text-amber-300" /> : <Moon className="w-4 h-4 sm:w-5 sm:h-5 text-[#E07A8B]" />}
          </button>

          {/* Lock App Button - Prominently visible on both mobile and desktop */}
          {onLockApp && (
            <button
              id="lock-app-button"
              onClick={onLockApp}
              className="flex items-center gap-1 p-1.5 sm:px-2.5 sm:py-1.5 rounded-full text-xs font-medium text-[#E07A8B] bg-rose-50/80 dark:bg-rose-950/60 border border-rose-200/70 dark:border-rose-800/60 hover:bg-rose-100 dark:hover:bg-rose-900/60 transition-colors shrink-0 shadow-2xs"
              title="Bloquear app com PIN para ninguém de fora ver"
              aria-label="Bloquear aplicativo"
            >
              <Lock className="w-4 h-4 text-[#E07A8B]" />
              <span className="hidden sm:inline">Bloquear</span>
            </button>
          )}

          {/* Settings Modal Button - Prominently visible on both mobile and desktop */}
          <button
            id="settings-modal-button"
            onClick={onOpenSettings}
            className="p-1.5 sm:p-2 rounded-full text-[#7D6F74] dark:text-[#B8A8AF] hover:text-[#E07A8B] hover:bg-[#FAF3EC] dark:hover:bg-[#271E23] transition-colors shrink-0"
            title="Configurações do casal"
            aria-label="Configurações do casal"
          >
            <Settings className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>
      </div>
    </header>
  );
};
