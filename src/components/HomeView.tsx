import React, { useState, useEffect } from 'react';
import {
  Film,
  ShoppingBag,
  UtensilsCrossed,
  Sparkles,
  Heart,
  ArrowRight,
  CalendarCheck,
  Camera,
  Home as HomeIcon,
  Clock,
  Calendar as CalendarIcon,
} from 'lucide-react';
import { AppData, PartnerId, WeatherNote } from '../types';
import { AnniversaryBanner } from './AnniversaryBanner';
import { CoupleWeatherCare } from './CoupleWeatherCare';
import { ActiveTab } from './Navigation';

interface HomeViewProps {
  data: AppData;
  activePartner: PartnerId;
  onNavigateTab: (tab: ActiveTab) => void;
  onOpenSettings: () => void;
  onUpdateWeatherNote?: (partner: PartnerId, note: WeatherNote | null) => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  data,
  activePartner,
  onNavigateTab,
  onOpenSettings,
  onUpdateWeatherNote,
}) => {
  const pendingGroceries = (data.groceries || []).filter((g) => !g.checked).length;
  const moviesToWatch = (data.movies || []).filter((m) => m.status === 'to_watch').length;
  const totalRecipes = (data.recipes || []).length;
  const totalPhotos = (data.photos || []).length;

  // Real-time synchronized clock
  const [currentDateTime, setCurrentDateTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Classic clean date format guaranteed to never wrap: 11/09/2026 (or Sex, 11/09/2026 on wider screens)
  const weekdayShort = currentDateTime.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '');
  const capitalizedWeekday = weekdayShort.charAt(0).toUpperCase() + weekdayShort.slice(1);
  const dayStr = String(currentDateTime.getDate()).padStart(2, '0');
  const monthStr = String(currentDateTime.getMonth() + 1).padStart(2, '0');
  const yearStr = currentDateTime.getFullYear();
  const classicDate = `${dayStr}/${monthStr}/${yearStr}`;

  const formattedTime = currentDateTime.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Discreta barra de Data e Hora Sincronizada (1 linha só garantida) */}
      <div
        id="home-live-datetime"
        className="flex items-center justify-between gap-2 px-3.5 py-2 rounded-2xl bg-white/80 dark:bg-[#251B21]/80 backdrop-blur-md border border-[#F2E8E4] dark:border-[#3D2F36] shadow-2xs text-[#7D6F74] dark:text-[#B8A8AF]"
      >
        <div className="flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-[#2D2327] dark:text-[#FAF4F0] whitespace-nowrap shrink-0">
          <CalendarIcon className="w-4 h-4 text-[#E07A8B] shrink-0" />
          <span className="hidden xs:inline">{capitalizedWeekday}, </span>
          <span>{classicDate}</span>
        </div>

        <div className="flex items-center gap-1.5 bg-[#FAF8F5] dark:bg-[#1E161A] px-2.5 py-1 rounded-xl border border-[#F2E8E4]/80 dark:border-[#3D2F36]/80 text-xs font-semibold text-[#2D2327] dark:text-[#FAF4F0] tabular-nums shrink-0 whitespace-nowrap">
          <Clock className="w-3.5 h-3.5 text-[#E07A8B] shrink-0" />
          <span>{formattedTime}</span>
        </div>
      </div>

      {/* 1. Anniversary Counter Banner */}
      <AnniversaryBanner
        profile={data.profile}
        onEditDate={onOpenSettings}
      />

      {/* 2. Weather & Loving Care João Pessoa ⇄ Porto Alegre */}
      <CoupleWeatherCare
        profile={data.profile}
        activePartner={activePartner}
        weatherNotes={data.weatherNotes}
        onUpdateWeatherNote={onUpdateWeatherNote}
      />

      {/* 3. Atalhos Rápidos & Cantinho do Dia a Dia */}
      <section
        id="home-quick-actions"
        aria-label="Atalhos do casal"
        className="rounded-3xl bg-white/80 dark:bg-[#251B21]/80 backdrop-blur-sm border border-[#F2E8E4] dark:border-[#3D2F36] p-4 sm:p-5 shadow-xs space-y-4"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-[#E07A8B]">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#2D2327] dark:text-[#FAF4F0]">
                Nosso Dia a Dia
              </h3>
              <p className="text-[11px] text-[#7D6F74] dark:text-[#B8A8AF]">
                Acesso rápido às nossas listas e planos
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {/* Mercado */}
          <button
            type="button"
            onClick={() => onNavigateTab('pantry_grocery')}
            className="p-3.5 rounded-2xl bg-[#FAF8F5] dark:bg-[#20171D] border border-[#F2E8E4] dark:border-[#3D2F36] hover:border-rose-300 dark:hover:border-rose-900/80 hover:bg-rose-50/40 dark:hover:bg-rose-950/20 text-left transition-all group flex flex-col justify-between space-y-3 cursor-pointer"
          >
            <div className="flex items-center justify-between w-full">
              <div className="p-2 rounded-xl bg-amber-100/70 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 group-hover:scale-105 transition-transform">
                <ShoppingBag className="w-4 h-4" />
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-[#A6999F] group-hover:text-rose-500 group-hover:translate-x-0.5 transition-all" />
            </div>
            <div>
              <span className="text-xs font-bold text-[#2D2327] dark:text-[#FAF4F0] block">
                Mercado
              </span>
              <span className="text-[10px] text-[#7D6F74] dark:text-[#B8A8AF] block">
                {pendingGroceries > 0
                  ? `${pendingGroceries} ${pendingGroceries === 1 ? 'item pendente' : 'itens pendentes'}`
                  : 'Tudo comprado ✨'}
              </span>
            </div>
          </button>

          {/* Filmes */}
          <button
            type="button"
            onClick={() => onNavigateTab('movies')}
            className="p-3.5 rounded-2xl bg-[#FAF8F5] dark:bg-[#20171D] border border-[#F2E8E4] dark:border-[#3D2F36] hover:border-rose-300 dark:hover:border-rose-900/80 hover:bg-rose-50/40 dark:hover:bg-rose-950/20 text-left transition-all group flex flex-col justify-between space-y-3 cursor-pointer"
          >
            <div className="flex items-center justify-between w-full">
              <div className="p-2 rounded-xl bg-rose-100/70 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 group-hover:scale-105 transition-transform">
                <Film className="w-4 h-4" />
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-[#A6999F] group-hover:text-rose-500 group-hover:translate-x-0.5 transition-all" />
            </div>
            <div>
              <span className="text-xs font-bold text-[#2D2327] dark:text-[#FAF4F0] block">
                Filmes & Séries
              </span>
              <span className="text-[10px] text-[#7D6F74] dark:text-[#B8A8AF] block">
                {moviesToWatch > 0
                  ? `${moviesToWatch} para ver juntas`
                  : 'Nenhum na fila'}
              </span>
            </div>
          </button>

          {/* Receitas */}
          <button
            type="button"
            onClick={() => onNavigateTab('recipes')}
            className="p-3.5 rounded-2xl bg-[#FAF8F5] dark:bg-[#20171D] border border-[#F2E8E4] dark:border-[#3D2F36] hover:border-rose-300 dark:hover:border-rose-900/80 hover:bg-rose-50/40 dark:hover:bg-rose-950/20 text-left transition-all group flex flex-col justify-between space-y-3 cursor-pointer"
          >
            <div className="flex items-center justify-between w-full">
              <div className="p-2 rounded-xl bg-emerald-100/70 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 group-hover:scale-105 transition-transform">
                <UtensilsCrossed className="w-4 h-4" />
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-[#A6999F] group-hover:text-rose-500 group-hover:translate-x-0.5 transition-all" />
            </div>
            <div>
              <span className="text-xs font-bold text-[#2D2327] dark:text-[#FAF4F0] block">
                Receitas
              </span>
              <span className="text-[10px] text-[#7D6F74] dark:text-[#B8A8AF] block">
                {totalRecipes > 0 ? `${totalRecipes} receitas salvas` : 'Cozinhar juntinhas'}
              </span>
            </div>
          </button>

          {/* Joguinhos */}
          <button
            type="button"
            onClick={() => onNavigateTab('games')}
            className="p-3.5 rounded-2xl bg-[#FAF8F5] dark:bg-[#20171D] border border-[#F2E8E4] dark:border-[#3D2F36] hover:border-rose-300 dark:hover:border-rose-900/80 hover:bg-rose-50/40 dark:hover:bg-rose-950/20 text-left transition-all group flex flex-col justify-between space-y-3 cursor-pointer"
          >
            <div className="flex items-center justify-between w-full">
              <div className="p-2 rounded-xl bg-purple-100/70 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 group-hover:scale-105 transition-transform">
                <Heart className="w-4 h-4" />
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-[#A6999F] group-hover:text-rose-500 group-hover:translate-x-0.5 transition-all" />
            </div>
            <div>
              <span className="text-xs font-bold text-[#2D2327] dark:text-[#FAF4F0] block">
                Joguinhos 💕
              </span>
              <span className="text-[10px] text-[#7D6F74] dark:text-[#B8A8AF] block">
                Quiz & Roleta do amor
              </span>
            </div>
          </button>
        </div>
      </section>
    </div>
  );
};
