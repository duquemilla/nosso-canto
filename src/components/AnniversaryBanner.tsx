import React, { useState, useEffect } from 'react';
import { Heart, Calendar, Sparkles, Edit3, Clock, Gift, MapPin } from 'lucide-react';
import { CoupleProfile } from '../types';

interface AnniversaryBannerProps {
  profile: CoupleProfile;
  onEditDate: () => void;
}

// Bodas tradicionais e carinhosas de namoro
const MONTHLY_BODAS: Record<number, { name: string; emoji: string }> = {
  1: { name: 'Bodas de Beijinho', emoji: '💋' },
  2: { name: 'Bodas de Sorvete', emoji: '🍦' },
  3: { name: 'Bodas de Algodão-Doce', emoji: '🍬' },
  4: { name: 'Bodas de Pipoca', emoji: '🍿' },
  5: { name: 'Bodas de Chocolate', emoji: '🍫' },
  6: { name: 'Bodas de Plumas', emoji: '🪶' },
  7: { name: 'Bodas de Pompom', emoji: '🎀' },
  8: { name: 'Bodas de Poesia', emoji: '💌' },
  9: { name: 'Bodas de Pirulito', emoji: '🍭' },
  10: { name: 'Bodas de Pintinhos', emoji: '🐣' },
  11: { name: 'Bodas de Chiclete', emoji: '💖' },
  12: { name: 'Bodas de Papel (1 Ano!)', emoji: '📜' },
};

export const AnniversaryBanner: React.FC<AnniversaryBannerProps> = ({ profile, onEditDate }) => {
  const [showLiveSeconds, setShowLiveSeconds] = useState(false);
  const [timePassed, setTimePassed] = useState({
    years: 0,
    months: 0,
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    totalDays: 0,
    nextAnniversaryDays: 0,
    currentBodas: { name: 'Bodas de Sorvete', emoji: '🍦' },
  });

  useEffect(() => {
    const calculateTime = () => {
      const start = new Date(profile.anniversaryDate + 'T00:00:00');
      const now = new Date();
      let diff = now.getTime() - start.getTime();

      if (diff < 0) diff = 0;

      const totalDays = Math.floor(diff / (1000 * 60 * 60 * 24));
      const seconds = Math.floor((diff / 1000) % 60);
      const minutes = Math.floor((diff / (1000 * 60)) % 60);
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);

      // Approximate years, months, days
      let years = now.getFullYear() - start.getFullYear();
      let months = now.getMonth() - start.getMonth();
      let days = now.getDate() - start.getDate();

      if (days < 0) {
        months--;
        const prevMonth = new Date(now.getFullYear(), now.getMonth(), 0);
        days += prevMonth.getDate();
      }
      if (months < 0) {
        years--;
        months += 12;
      }

      // Next monthly anniversary
      const nextMonthDate = new Date(now.getFullYear(), now.getMonth(), start.getDate());
      if (nextMonthDate < now) {
        nextMonthDate.setMonth(nextMonthDate.getMonth() + 1);
      }
      const diffToNext = Math.ceil((nextMonthDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      // Calculate total months for bodas
      const totalMonths = Math.max(1, years * 12 + months);
      const bodasIndex = (totalMonths % 12) || 12;
      const currentBodas = MONTHLY_BODAS[bodasIndex] || {
        name: `${years} ${years === 1 ? 'Ano' : 'Anos'} de Amor`,
        emoji: '💍',
      };

      setTimePassed({
        years: Math.max(0, years),
        months: Math.max(0, months),
        days: Math.max(0, days),
        hours,
        minutes,
        seconds,
        totalDays,
        nextAnniversaryDays: Math.max(0, diffToNext),
        currentBodas,
      });
    };

    calculateTime();
    const interval = setInterval(calculateTime, 1000);
    return () => clearInterval(interval);
  }, [profile.anniversaryDate]);

  const hasYears = timePassed.years > 0;

  return (
    <div
      id="anniversary-counter-section"
      className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#FFF7F8] via-[#FAF3EC] to-[#F5E6DD] dark:from-[#291E24] dark:via-[#2F2128] dark:to-[#22181C] border border-[#F2E0E4] dark:border-[#42313B] shadow-sm p-6 sm:p-8 my-6 transition-all"
    >
      {/* Delicate background aesthetic shapes */}
      <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-rose-200/30 dark:bg-rose-900/10 blur-2xl pointer-events-none" />
      <div className="absolute -bottom-10 -left-10 w-44 h-44 rounded-full bg-amber-200/20 dark:bg-amber-900/10 blur-2xl pointer-events-none" />

      <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
        {/* Title & Romantic Bio */}
        <div className="text-center md:text-left max-w-lg">
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mb-2.5">
            {/* Bodas do Mês pill */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-100/80 dark:bg-rose-900/50 text-rose-700 dark:text-rose-200 text-xs font-semibold border border-rose-200/60 dark:border-rose-800/60 shadow-2xs">
              <span>{timePassed.currentBodas.emoji}</span>
              <span>{timePassed.currentBodas.name}</span>
            </div>
          </div>

          <p className="font-serif text-lg sm:text-xl font-medium text-[#2D2327] dark:text-[#FAF4F0] tracking-tight italic">
            "{profile.anniversaryNote && profile.anniversaryNote !== 'Cada dia ao seu lado é o melhor momento da minha vida. Te amo infinito! 💕' ? profile.anniversaryNote : 'Meu coração fez a melhor escolha. 💕'}"
          </p>

          <div className="mt-3 flex flex-wrap items-center justify-center md:justify-start gap-2 text-xs text-[#7D6F74] dark:text-[#B8A8AF]">
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-[#E07A8B]" />
              <span>Juntos desde {new Date(profile.anniversaryDate + 'T00:00:00').toLocaleDateString('pt-BR')}</span>
              <button
                onClick={onEditDate}
                className="p-1 text-[#E07A8B] hover:text-rose-600 transition-colors"
                title="Editar data de início"
              >
                <Edit3 className="w-3.5 h-3.5" />
              </button>
            </div>

            {timePassed.nextAnniversaryDays > 0 && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 text-[11px] font-medium border border-amber-200/50">
                <Gift className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                Faltam {timePassed.nextAnniversaryDays} dias para o próximo mêsversário!
              </span>
            )}
          </div>
        </div>

        {/* Counter Grid */}
        <div className="flex flex-col items-center md:items-end w-full md:w-auto">
          {/* Main Romantic Counter (Clean and meaningful) */}
          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-2.5 text-center">
            {/* Years (only shown if > 0 to avoid awkward "0 ANOS") */}
            {hasYears && (
              <div className="bg-white/95 dark:bg-[#251A20]/95 backdrop-blur-xs border border-[#F2E0E4] dark:border-[#42313B] rounded-2xl px-3.5 py-2.5 min-w-[72px] sm:min-w-[80px] shadow-xs">
                <span className="block font-serif text-2xl sm:text-3xl font-bold text-[#E07A8B] dark:text-[#F492A5] leading-none mb-1">
                  {timePassed.years}
                </span>
                <span className="text-[10px] sm:text-[11px] uppercase tracking-wider text-[#7D6F74] dark:text-[#B8A8AF] font-medium whitespace-nowrap">
                  {timePassed.years === 1 ? 'Ano' : 'Anos'}
                </span>
              </div>
            )}

            {/* Months */}
            <div className="bg-white/95 dark:bg-[#251A20]/95 backdrop-blur-xs border border-[#F2E0E4] dark:border-[#42313B] rounded-2xl px-3.5 py-2.5 min-w-[72px] sm:min-w-[80px] shadow-xs">
              <span className="block font-serif text-2xl sm:text-3xl font-bold text-[#E07A8B] dark:text-[#F492A5] leading-none mb-1">
                {timePassed.months}
              </span>
              <span className="text-[10px] sm:text-[11px] uppercase tracking-wider text-[#7D6F74] dark:text-[#B8A8AF] font-medium whitespace-nowrap">
                {timePassed.months === 1 ? 'Mês' : 'Meses'}
              </span>
            </div>

            {/* Days */}
            <div className="bg-white/95 dark:bg-[#251A20]/95 backdrop-blur-xs border border-[#F2E0E4] dark:border-[#42313B] rounded-2xl px-3.5 py-2.5 min-w-[72px] sm:min-w-[80px] shadow-xs">
              <span className="block font-serif text-2xl sm:text-3xl font-bold text-[#E07A8B] dark:text-[#F492A5] leading-none mb-1">
                {timePassed.days}
              </span>
              <span className="text-[10px] sm:text-[11px] uppercase tracking-wider text-[#7D6F74] dark:text-[#B8A8AF] font-medium whitespace-nowrap">
                {timePassed.days === 1 ? 'Dia' : 'Dias'}
              </span>
            </div>

            {/* Live Seconds & Clock details (Shown when user wants the stopwatch view or toggles) */}
            {showLiveSeconds && (
              <>
                {/* Hours */}
                <div className="bg-white/90 dark:bg-[#251A20]/90 backdrop-blur-xs border border-[#F2E0E4] dark:border-[#42313B] rounded-2xl px-3 py-2.5 min-w-[68px] sm:min-w-[74px] shadow-xs animate-fade-in">
                  <span className="block font-serif text-xl sm:text-2xl font-bold text-[#D4A373] dark:text-[#EAD5C3] leading-none mb-1">
                    {String(timePassed.hours).padStart(2, '0')}
                  </span>
                  <span className="text-[9px] sm:text-[10px] uppercase tracking-normal text-[#7D6F74] dark:text-[#B8A8AF] font-medium whitespace-nowrap block">
                    Horas
                  </span>
                </div>

                {/* Minutes */}
                <div className="bg-white/90 dark:bg-[#251A20]/90 backdrop-blur-xs border border-[#F2E0E4] dark:border-[#42313B] rounded-2xl px-3 py-2.5 min-w-[68px] sm:min-w-[74px] shadow-xs animate-fade-in">
                  <span className="block font-serif text-xl sm:text-2xl font-bold text-[#D4A373] dark:text-[#EAD5C3] leading-none mb-1">
                    {String(timePassed.minutes).padStart(2, '0')}
                  </span>
                  <span className="text-[9px] sm:text-[10px] uppercase tracking-normal text-[#7D6F74] dark:text-[#B8A8AF] font-medium whitespace-nowrap block">
                    Minutos
                  </span>
                </div>

                {/* Seconds - Perfect fit without any text overflow! */}
                <div className="bg-white/90 dark:bg-[#251A20]/90 backdrop-blur-xs border border-[#F2E0E4] dark:border-[#42313B] rounded-2xl px-3 py-2.5 min-w-[72px] sm:min-w-[78px] shadow-xs animate-fade-in">
                  <span className="block font-serif text-xl sm:text-2xl font-bold text-[#D4A373] dark:text-[#EAD5C3] leading-none mb-1">
                    {String(timePassed.seconds).padStart(2, '0')}
                  </span>
                  <span className="text-[9px] sm:text-[10px] uppercase tracking-normal text-[#7D6F74] dark:text-[#B8A8AF] font-medium whitespace-nowrap block">
                    Segundos
                  </span>
                </div>
              </>
            )}
          </div>

          {/* Bottom row: Total days & Toggle for seconds */}
          <div className="mt-3 flex flex-wrap items-center justify-center md:justify-end gap-3 text-xs text-[#7D6F74] dark:text-[#B8A8AF]">
            <div className="inline-flex items-center gap-1.5">
              <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500 animate-pulse" />
              <span>
                Total de <strong className="text-[#2D2327] dark:text-[#FAF4F0]">{timePassed.totalDays.toLocaleString()}</strong> dias de cumplicidade!
              </span>
            </div>

            <button
              onClick={() => setShowLiveSeconds((prev) => !prev)}
              className="inline-flex items-center gap-1 text-[11px] text-[#7D6F74] dark:text-[#B8A8AF] hover:text-[#E07A8B] transition-colors underline decoration-dotted"
              title={showLiveSeconds ? 'Ocultar horas e segundos' : 'Ver contagem de horas e segundos em tempo real'}
            >
              <Clock className="w-3 h-3 text-[#E07A8B]" />
              <span>{showLiveSeconds ? 'Ocultar segundos' : 'Ver segundos ao vivo'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

