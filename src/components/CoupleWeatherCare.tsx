import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  Sun,
  CloudSun,
  CloudRain,
  Wind,
  Heart,
  RefreshCw,
  MapPin,
  Sparkles,
  Pencil,
  Send,
  X,
  Check,
  RotateCcw,
} from 'lucide-react';
import { CoupleProfile, PartnerId, WeatherNotesData, WeatherNote } from '../types';
import { PartnerAvatar } from './PartnerAvatar';

interface CityWeather {
  temp: number;
  apparentTemp: number;
  humidity: number;
  weatherCode: number;
  isDay: number;
  city: string;
  updatedAt?: string;
}

interface WeatherResponse {
  joaoPessoa: CityWeather;
  portoAlegre: CityWeather;
}

interface CoupleWeatherCareProps {
  profile: CoupleProfile;
  activePartner?: PartnerId;
  weatherNotes?: WeatherNotesData;
  onUpdateWeatherNote?: (partner: PartnerId, note: WeatherNote | null) => void;
}

export const CoupleWeatherCare: React.FC<CoupleWeatherCareProps> = ({
  profile,
  activePartner = 'partner1',
  weatherNotes,
  onUpdateWeatherNote,
}) => {
  const [weather, setWeather] = useState<WeatherResponse>({
    joaoPessoa: {
      temp: 26,
      apparentTemp: 28,
      humidity: 76,
      weatherCode: 80,
      isDay: 1,
      city: 'João Pessoa - PB',
    },
    portoAlegre: {
      temp: 18,
      apparentTemp: 19,
      humidity: 95,
      weatherCode: 3,
      isDay: 1,
      city: 'Porto Alegre - RS',
    },
  });

  const [isLoading, setIsLoading] = useState(false);

  // Modal State for Writing or Generating AI Weather Notes
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [targetPartner, setTargetPartner] = useState<PartnerId>('partner2');
  const [noteText, setNoteText] = useState('');
  const [aiPromptHint, setAiPromptHint] = useState('');
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const fetchWeather = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/weather');
      if (res.ok) {
        const data = await res.json();
        if (data.joaoPessoa && data.portoAlegre) {
          setWeather(data);
        }
      }
    } catch (e) {
      console.warn('Erro ao atualizar clima:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchWeather();
    const interval = setInterval(fetchWeather, 15 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isModalOpen) {
      const prevOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = prevOverflow;
      };
    }
  }, [isModalOpen]);

  // Close modal on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isModalOpen) {
        setIsModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isModalOpen]);

  const getWeatherIcon = (code: number, temp: number) => {
    if ([51, 53, 55, 61, 63, 65, 80, 81, 82, 95].includes(code)) {
      return <CloudRain className="w-4 h-4 text-blue-500 animate-pulse shrink-0" />;
    }
    if (temp >= 26) {
      return <Sun className="w-4 h-4 text-amber-500 shrink-0" />;
    }
    if (temp <= 18) {
      return <Wind className="w-4 h-4 text-cyan-500 shrink-0" />;
    }
    return <CloudSun className="w-4 h-4 text-amber-400 shrink-0" />;
  };

  const getWeatherShortDesc = (code: number, temp: number) => {
    if ([51, 53, 55, 61, 63, 65, 80, 81, 82, 95].includes(code)) return 'Chuva';
    if (code === 0) return 'Ensolarado';
    if (code <= 3) return temp >= 25 ? 'Sol & Nuvens' : 'Nublado';
    if (temp <= 16) return 'Frio';
    return 'Agradável';
  };

  const millaPresets = [
    'Amor, se cuida hoje nesse tempinho de Jampa e bebe bastante água! 💕',
    'Não esquece o guarda-chuva se sair na chuva, minha linda! ☔',
    'Te amo muito! Meu pensamento tá com você o dia todinho ✨',
    'Passando pra te mandar um beijo doce e desejar um dia perfeito! 💖',
  ];

  const cassiPresets = [
    'Tá friozinho aí no Sul! Coloca um agasalho bem quentinho, meu bem 🧣',
    'Se cuida muito nessa chuva, leva o guarda-chuva ao sair! ☔❤️',
    'Queria tá aí debaixo das cobertas com você hoje assistindo filme! 🍿',
    'Meu coração é todinho seu aí em Porto Alegre! Te amo sem fim 💕',
  ];

  // Open note modal for a specific partner
  const handleOpenNoteModal = (target: PartnerId) => {
    setTargetPartner(target);
    const existing = target === 'partner1' ? weatherNotes?.partner1Note : weatherNotes?.partner2Note;
    const defaultPreset = target === 'partner1' ? millaPresets[0] : cassiPresets[0];
    setNoteText(existing?.text || defaultPreset);
    setAiPromptHint('');
    setSaveSuccess(false);
    setIsModalOpen(true);
  };

  // Generate note with Gemini AI based on weather conditions
  const handleGenerateAINote = async () => {
    setIsGeneratingAI(true);
    try {
      const sender = activePartner === 'partner1' ? profile.partner1.name : profile.partner2.name;
      const targetUser = targetPartner === 'partner1' ? profile.partner1 : profile.partner2;
      const targetCityWeather = targetPartner === 'partner1' ? weather.joaoPessoa : weather.portoAlegre;

      const res = await fetch('/api/weather-ai-note', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderName: sender,
          targetPartnerName: targetUser.nickname || targetUser.name,
          targetCity: targetUser.city || (targetPartner === 'partner1' ? 'João Pessoa' : 'Porto Alegre'),
          temp: targetCityWeather.temp,
          weatherDesc: getWeatherShortDesc(targetCityWeather.weatherCode, targetCityWeather.temp),
          userHint: aiPromptHint.trim(),
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.note) {
          setNoteText(data.note);
        }
      }
    } catch (e) {
      console.warn('Erro ao gerar com IA:', e);
      setNoteText(`Amor, se cuida nesse tempinho gostoso! Meu coração tá todinho com você hoje 💕`);
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const handleSaveNote = () => {
    const sender = activePartner === 'partner1'
      ? profile.partner1.nickname || profile.partner1.name
      : profile.partner2.nickname || profile.partner2.name;
    const textToSave = noteText.trim() || (targetPartner === 'partner1' ? millaPresets[0] : cassiPresets[0]);

    onUpdateWeatherNote?.(targetPartner, {
      text: textToSave,
      author: sender,
      updatedAt: new Date().toISOString(),
    });
    setSaveSuccess(true);
    setTimeout(() => {
      setIsModalOpen(false);
      setSaveSuccess(false);
    }, 400);
  };

  const handleResetNote = () => {
    const defaultPreset = targetPartner === 'partner1' ? millaPresets[0] : cassiPresets[0];
    setNoteText(defaultPreset);
  };

  const p1CustomNote = weatherNotes?.partner1Note;
  const p2CustomNote = weatherNotes?.partner2Note;

  const p1DisplayText = p1CustomNote?.text || millaPresets[0];
  const p1Author = p1CustomNote?.author || profile.partner2.nickname || profile.partner2.name;

  const p2DisplayText = p2CustomNote?.text || cassiPresets[0];
  const p2Author = p2CustomNote?.author || profile.partner1.nickname || profile.partner1.name;

  return (
    <section
      id="couple-weather-care-card"
      aria-label="Clima das parceiras"
      className="rounded-3xl bg-white/90 dark:bg-[#251B21]/90 backdrop-blur-sm border border-[#F2E8E4] dark:border-[#3D2F36] shadow-sm p-4 sm:p-5 transition-all space-y-4"
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-[#F2E8E4] dark:border-[#3D2F36]">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-[#E07A8B] shrink-0">
            <Heart className="w-4 h-4 fill-current" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#2D2327] dark:text-[#FAF4F0]">
              Clima & Cuidado
            </h3>
            <p className="text-[11px] text-[#7D6F74] dark:text-[#B8A8AF]">
              Temperaturas em tempo real e recadinhos de carinho
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={fetchWeather}
          disabled={isLoading}
          className="p-1.5 px-2.5 rounded-xl bg-[#FAF8F5] dark:bg-[#2D2228] text-[#7D6F74] dark:text-[#B8A8AF] hover:text-[#2D2327] dark:hover:text-white border border-[#F2E8E4] dark:border-[#3D2F36] text-xs font-medium transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer"
          title="Atualizar temperatura em tempo real"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-[#E07A8B]' : ''}`} />
          <span className="hidden sm:inline">Atualizar</span>
        </button>
      </div>

      {/* Two Cities Weather Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 sm:gap-4">
        {/* JOÃO PESSOA (Milla) */}
        <div className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-br from-amber-50/70 via-rose-50/40 to-white dark:from-[#2C2126] dark:via-[#261A20] dark:to-[#22161C] border border-amber-200/60 dark:border-amber-900/40 relative overflow-hidden flex flex-col justify-between space-y-3 shadow-xs">
          {/* Top: Avatar + Name/City & Compact Temp/Rain Badge */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0 flex-1">
              <PartnerAvatar
                avatar={profile.partner1.avatar}
                name={profile.partner1.name}
                size="md"
              />
              <div className="min-w-0 flex-1">
                <span className="text-sm font-bold text-[#2D2327] dark:text-[#FAF4F0] leading-tight block truncate">
                  {profile.partner1.nickname || profile.partner1.name}
                </span>
                <div className="flex items-center gap-1 text-[11px] text-[#7D6F74] dark:text-[#B8A8AF] mt-0.5">
                  <MapPin className="w-3 h-3 text-amber-500 shrink-0" />
                  <span className="truncate">{profile.partner1.city || 'João Pessoa - PB'}</span>
                </div>
              </div>
            </div>

            {/* Compact Temp + Rain side-by-side badge */}
            <div className="flex items-center gap-2 bg-white/95 dark:bg-[#1E151A]/95 px-2.5 py-1.5 rounded-xl border border-amber-200/80 dark:border-amber-900/60 shadow-xs shrink-0">
              <div className="flex items-center gap-1">
                {getWeatherIcon(weather.joaoPessoa.weatherCode, weather.joaoPessoa.temp)}
                <span className="text-sm font-bold text-[#2D2327] dark:text-[#FAF4F0]">
                  {weather.joaoPessoa.temp}°C
                </span>
              </div>
              <div className="h-4 w-px bg-amber-200/80 dark:bg-amber-900/60" />
              <div className="flex flex-col text-[10px] leading-tight">
                <span className="font-semibold text-amber-900 dark:text-amber-200 whitespace-nowrap">
                  {getWeatherShortDesc(weather.joaoPessoa.weatherCode, weather.joaoPessoa.temp)}
                </span>
                <span className="text-[#7D6F74] dark:text-[#B8A8AF] whitespace-nowrap">
                  {weather.joaoPessoa.humidity}%
                </span>
              </div>
            </div>
          </div>

          {/* Recadinho de Carinho */}
          <div className="space-y-2">
            <div
              onClick={() => handleOpenNoteModal('partner1')}
              className={`p-3 rounded-2xl border transition-all flex items-start gap-2.5 select-none cursor-pointer ${
                p1CustomNote
                  ? 'bg-amber-100/50 dark:bg-amber-950/35 border-amber-300 dark:border-amber-800 hover:bg-amber-100/70 shadow-2xs'
                  : 'bg-white/90 dark:bg-[#20171D]/90 border-amber-200/70 dark:border-amber-900/50 hover:bg-white dark:hover:bg-[#20171D]'
              }`}
              title="Toque para editar o recadinho carinhoso"
            >
              <span className="text-base shrink-0 mt-0.5">💌</span>
              <div className="flex-1 min-w-0">
                <p className="text-xs leading-relaxed text-[#4A3D43] dark:text-[#E2D8DD] italic">
                  "{p1DisplayText}"
                </p>
                <div className="flex items-center justify-between text-[10px] text-amber-800 dark:text-amber-300 font-semibold mt-1.5 not-italic">
                  <span>— De {p1Author} com carinho 💕</span>
                  <span className="text-[10px] text-[#E07A8B] font-medium flex items-center gap-1">
                    <Pencil className="w-2.5 h-2.5" /> Editar
                  </span>
                </div>
              </div>
            </div>

            {/* Action button to write or generate with AI */}
            <div className="flex items-center justify-end">
              <button
                type="button"
                onClick={() => handleOpenNoteModal('partner1')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white dark:bg-[#20171D] text-[#E07A8B] border border-[#E07A8B]/30 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors shadow-2xs cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#E07A8B]" />
                <span>Editar Recadinho</span>
              </button>
            </div>
          </div>
        </div>

        {/* PORTO ALEGRE (Cassi) */}
        <div className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-br from-cyan-50/70 via-indigo-50/40 to-white dark:from-[#1F242B] dark:via-[#1D1E25] dark:to-[#22161C] border border-cyan-200/60 dark:border-cyan-900/40 relative overflow-hidden flex flex-col justify-between space-y-3 shadow-xs">
          {/* Top: Avatar + Name/City & Compact Temp/Rain Badge */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0 flex-1">
              <PartnerAvatar
                avatar={profile.partner2.avatar}
                name={profile.partner2.name}
                size="md"
              />
              <div className="min-w-0 flex-1">
                <span className="text-sm font-bold text-[#2D2327] dark:text-[#FAF4F0] leading-tight block truncate">
                  {profile.partner2.nickname || profile.partner2.name}
                </span>
                <div className="flex items-center gap-1 text-[11px] text-[#7D6F74] dark:text-[#B8A8AF] mt-0.5">
                  <MapPin className="w-3 h-3 text-cyan-600 shrink-0" />
                  <span className="truncate">{profile.partner2.city || 'Porto Alegre - RS'}</span>
                </div>
              </div>
            </div>

            {/* Compact Temp + Rain side-by-side badge */}
            <div className="flex items-center gap-2 bg-white/95 dark:bg-[#151B20]/95 px-2.5 py-1.5 rounded-xl border border-cyan-200/80 dark:border-cyan-900/60 shadow-xs shrink-0">
              <div className="flex items-center gap-1">
                {getWeatherIcon(weather.portoAlegre.weatherCode, weather.portoAlegre.temp)}
                <span className="text-sm font-bold text-[#2D2327] dark:text-[#FAF4F0]">
                  {weather.portoAlegre.temp}°C
                </span>
              </div>
              <div className="h-4 w-px bg-cyan-200/80 dark:bg-cyan-900/60" />
              <div className="flex flex-col text-[10px] leading-tight">
                <span className="font-semibold text-cyan-900 dark:text-cyan-200 whitespace-nowrap">
                  {getWeatherShortDesc(weather.portoAlegre.weatherCode, weather.portoAlegre.temp)}
                </span>
                <span className="text-[#7D6F74] dark:text-[#B8A8AF] whitespace-nowrap">
                  {weather.portoAlegre.humidity}%
                </span>
              </div>
            </div>
          </div>

          {/* Recadinho de Carinho */}
          <div className="space-y-2">
            <div
              onClick={() => handleOpenNoteModal('partner2')}
              className={`p-3 rounded-2xl border transition-all flex items-start gap-2.5 select-none cursor-pointer ${
                p2CustomNote
                  ? 'bg-cyan-100/50 dark:bg-cyan-950/35 border-cyan-300 dark:border-cyan-800 hover:bg-cyan-100/70 shadow-2xs'
                  : 'bg-white/90 dark:bg-[#192026]/90 border-cyan-200/70 dark:border-cyan-900/50 hover:bg-white dark:hover:bg-[#192026]'
              }`}
              title="Toque para editar o recadinho carinhoso"
            >
              <span className="text-base shrink-0 mt-0.5">💌</span>
              <div className="flex-1 min-w-0">
                <p className="text-xs leading-relaxed text-[#3D474D] dark:text-[#DCE5EB] italic">
                  "{p2DisplayText}"
                </p>
                <div className="flex items-center justify-between text-[10px] text-cyan-800 dark:text-cyan-300 font-semibold mt-1.5 not-italic">
                  <span>— De {p2Author} com carinho 💕</span>
                  <span className="text-[10px] text-[#E07A8B] font-medium flex items-center gap-1">
                    <Pencil className="w-2.5 h-2.5" /> Editar
                  </span>
                </div>
              </div>
            </div>

            {/* Action button to write or generate with AI */}
            <div className="flex items-center justify-end">
              <button
                type="button"
                onClick={() => handleOpenNoteModal('partner2')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white dark:bg-[#192026] text-[#E07A8B] border border-[#E07A8B]/30 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors shadow-2xs cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#E07A8B]" />
                <span>Editar Recadinho</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal: Escrever ou Gerar Recadinho com IA usando createPortal para nunca cortar nem bugar no PC/Mobile */}
      {isModalOpen && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
          {/* Backdrop dismiss */}
          <div
            className="fixed inset-0"
            onClick={() => setIsModalOpen(false)}
            aria-hidden="true"
          />

          {/* Modal Dialog Card */}
          <div
            className="relative w-full max-w-lg max-h-[92vh] sm:max-h-[85vh] bg-white dark:bg-[#20171D] rounded-3xl border border-[#F2E8E4] dark:border-[#3D2F36] shadow-2xl flex flex-col overflow-hidden z-10 animate-in zoom-in-95 duration-200"
            role="dialog"
            aria-modal="true"
            aria-labelledby="weather-note-modal-title"
          >
            {/* Sticky Solid Header */}
            <div className="px-5 py-3.5 sm:py-4 border-b border-[#F2E8E4] dark:border-[#3D2F36] flex items-center justify-between bg-white dark:bg-[#20171D] shrink-0">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/50 text-[#E07A8B] shrink-0">
                  <Heart className="w-4 h-4 fill-current" />
                </div>
                <div className="min-w-0">
                  <h3
                    id="weather-note-modal-title"
                    className="text-sm sm:text-base font-bold text-[#2D2327] dark:text-[#FAF4F0] leading-tight truncate"
                  >
                    Recadinho de Clima
                  </h3>
                  <p className="text-[11px] text-[#7D6F74] dark:text-[#B8A8AF] truncate">
                    Para {targetPartner === 'partner1' ? profile.partner1.nickname || profile.partner1.name : profile.partner2.nickname || profile.partner2.name} em {targetPartner === 'partner1' ? 'João Pessoa' : 'Porto Alegre'} ({targetPartner === 'partner1' ? `${weather.joaoPessoa.temp}°C` : `${weather.portoAlegre.temp}°C`})
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                aria-label="Fechar modal"
                className="p-1.5 rounded-xl text-[#7D6F74] hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Modal Body */}
            <div className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1 overscroll-contain">
              {/* Option A: Generate with Gemini AI */}
              <div className="p-3.5 rounded-2xl bg-[#FAF8F5] dark:bg-[#1E161A] border border-[#F2E8E4] dark:border-[#3D2F36] space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#2D2327] dark:text-[#FAF4F0] flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-[#E07A8B]" />
                    Gerar Recado com Inteligência Artificial
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950 text-[#E07A8B] font-semibold">
                    Gemini AI
                  </span>
                </div>

                <p className="text-[11px] text-[#7D6F74] dark:text-[#B8A8AF] leading-relaxed">
                  A IA analisa o clima atual de {targetPartner === 'partner1' ? 'João Pessoa' : 'Porto Alegre'} ({targetPartner === 'partner1' ? `${weather.joaoPessoa.temp}°C` : `${weather.portoAlegre.temp}°C`}) e sugere uma mensagem carinhosa personalizada.
                </p>

                <div className="space-y-1.5">
                  <input
                    type="text"
                    value={aiPromptHint}
                    onChange={(e) => setAiPromptHint(e.target.value)}
                    placeholder="Ex: lembrar do casaco, mandar beijo de conchinha..."
                    className="w-full px-3 py-2 rounded-xl text-xs bg-white dark:bg-[#251B21] border border-[#F2E8E4] dark:border-[#3D2F36] text-[#2D2327] dark:text-[#FAF4F0] placeholder-[#B8A8AF] focus:outline-none focus:ring-1 focus:ring-[#E07A8B]"
                  />
                  <button
                    type="button"
                    onClick={handleGenerateAINote}
                    disabled={isGeneratingAI}
                    className="w-full h-9 rounded-xl bg-gradient-to-r from-[#E07A8B] to-[#d66a7b] hover:opacity-95 text-white text-xs font-semibold flex items-center justify-center gap-1.5 shadow-xs transition-opacity cursor-pointer disabled:opacity-50"
                  >
                    {isGeneratingAI ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Criando com carinho...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Gerar Mensagem com IA</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Option B: Write or Edit text directly */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-[#2D2327] dark:text-[#FAF4F0] flex items-center gap-1.5">
                    <Pencil className="w-3.5 h-3.5 text-[#E07A8B]" />
                    Seu Recadinho (edite livremente):
                  </label>
                  {noteText.trim() && (
                    <span className="text-[10px] text-[#7D6F74] dark:text-[#B8A8AF]">
                      {noteText.length} caracteres
                    </span>
                  )}
                </div>

                <textarea
                  rows={3}
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  placeholder="Escreva algo doce para ela encontrar quando abrir o app hoje..."
                  className="w-full p-3 rounded-2xl text-xs bg-[#FAF8F5] dark:bg-[#1E161A] border border-[#F2E8E4] dark:border-[#3D2F36] text-[#2D2327] dark:text-[#FAF4F0] placeholder-[#B8A8AF] focus:outline-none focus:ring-1 focus:ring-[#E07A8B] resize-none leading-relaxed"
                />
              </div>

              {/* Option C: Clickable Quick Presets */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-bold text-[#7D6F74] dark:text-[#B8A8AF] block">
                  💡 Ou clique em uma sugestão para preencher o texto acima:
                </span>
                <div className="grid grid-cols-1 gap-1.5 max-h-36 overflow-y-auto pr-1">
                  {(targetPartner === 'partner1' ? millaPresets : cassiPresets).map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setNoteText(preset)}
                      className={`p-2.5 rounded-xl text-left text-xs leading-snug border transition-all cursor-pointer ${
                        noteText === preset
                          ? 'bg-rose-50 dark:bg-rose-950/60 border-[#E07A8B] text-[#E07A8B] font-medium shadow-2xs'
                          : 'bg-[#FAF8F5] dark:bg-[#1F171C] border-[#F2E8E4] dark:border-[#3D2F36] text-[#5C4D53] dark:text-[#D1C2C8] hover:border-[#E07A8B]/60'
                      }`}
                    >
                      "{preset}"
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Sticky Solid Footer with Actions */}
            <div className="p-3.5 sm:p-4 border-t border-[#F2E8E4] dark:border-[#3D2F36] flex items-center justify-between gap-2 bg-[#FAF8F5] dark:bg-[#1C1419] shrink-0">
              <button
                type="button"
                onClick={handleResetNote}
                className="h-9 px-3 rounded-xl border border-dashed border-[#F2E8E4] dark:border-[#3D2F36] text-[11px] font-semibold text-[#7D6F74] hover:text-rose-600 dark:hover:text-rose-400 transition-colors flex items-center gap-1.5 cursor-pointer bg-white dark:bg-[#20171D]"
                title="Restaurar sugestão inicial"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Sugestão Padrão</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="h-9 px-3.5 rounded-xl text-xs font-semibold text-[#7D6F74] dark:text-[#B8A8AF] hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleSaveNote}
                  disabled={saveSuccess}
                  className="h-9 px-4 rounded-xl bg-[#E07A8B] hover:bg-[#d66a7b] text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer disabled:opacity-80"
                >
                  {saveSuccess ? (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Salvo com sucesso!</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>Salvar no Clima 💕</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </section>
  );
};
