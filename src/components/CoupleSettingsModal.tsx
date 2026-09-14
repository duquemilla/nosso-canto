import React, { useState, useRef } from 'react';
import {
  Settings,
  Heart,
  Calendar,
  Sparkles,
  Lock,
  KeyRound,
  Download,
  Upload,
  Cloud,
  CheckCircle2,
  Shield,
  Smartphone,
  Eye,
  EyeOff,
  Trash2,
  HardDrive,
  AlertTriangle,
  Info,
  Loader2,
  Camera,
  Image as ImageIcon,
  X,
  Palette,
  ShieldCheck,
  MapPin,
  RefreshCw,
} from 'lucide-react';
import { CoupleProfile, AppData, PartnerId } from '../types';
import { PartnerAvatar, isAvatarImage } from './PartnerAvatar';

const AVATAR_PRESETS = [
  '⚡', // Pikachu / Eletricidade (Especial Cassi)
  '🦊', // Eevee
  '🌸', // Flor de Cerejeira
  '✨', // Brilho
  '💖', // Coração Rosa
  '🐢', // Squirtle
  '🦖', // Charmander
  '🐱', // Gatinho
  '🦋', // Borboleta
  '👩🏻', // Cabelo Escuro
  '👩',   // Clássica
  '👩🏼', // Loiro Suave
  '👩🏽', // Morena Ondulada
  '👩🏾', // Pele Negra
  '👱‍♀️', // Loira
  '👩‍🦱', // Cabelo Cacheado
  '👧🏻', // Menina Fofa
];

interface CoupleSettingsModalProps {
  profile: CoupleProfile;
  isOpen: boolean;
  onClose: () => void;
  onSaveProfile: (profile: CoupleProfile) => void;
  appData?: AppData;
  onRestoreData?: (imported: AppData) => void;
  onResetSampleData?: () => void;
  activePartner?: PartnerId;
  onManualSync?: () => void;
  isSyncing?: boolean;
}

export const CoupleSettingsModal: React.FC<CoupleSettingsModalProps> = ({
  profile,
  isOpen,
  onClose,
  onSaveProfile,
  appData,
  onRestoreData,
  onResetSampleData,
  activePartner,
  onManualSync,
  isSyncing = false,
}) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'theme' | 'security' | 'cloud'>('profile');

  // Theme State
  const [selectedTheme, setSelectedTheme] = useState<string>(() => {
    try {
      const saved = localStorage.getItem('nos_dois_app_theme');
      if (saved) return saved;
    } catch {}
    return profile.theme || 'rose';
  });

  const [themeFeedback, setThemeFeedback] = useState<string | null>(null);

  const handleSelectTheme = (t: string) => {
    setSelectedTheme(t);
    document.documentElement.setAttribute('data-theme', t);
    try {
      localStorage.setItem('nos_dois_app_theme', t);
    } catch {}
    // Instantly save theme to profile so user doesn't have to search for save button
    onSaveProfile({
      ...profile,
      theme: t,
    });
    setThemeFeedback('✨ Tema ativado com sucesso!');
    setTimeout(() => setThemeFeedback(null), 3000);
  };

  // Profile Form State
  const [coupleName, setCoupleName] = useState(profile.coupleName);
  const [anniversaryDate, setAnniversaryDate] = useState(profile.anniversaryDate);
  const [anniversaryNote, setAnniversaryNote] = useState(profile.anniversaryNote);

  const [partner1Name, setPartner1Name] = useState(profile.partner1.name);
  const [partner1Nickname, setPartner1Nickname] = useState(profile.partner1.nickname || 'Milla');
  const [partner1Avatar, setPartner1Avatar] = useState(profile.partner1.avatar);
  const [partner1City, setPartner1City] = useState(profile.partner1.city || 'João Pessoa - PB');

  const [partner2Name, setPartner2Name] = useState(profile.partner2.name);
  const [partner2Nickname, setPartner2Nickname] = useState(profile.partner2.nickname || 'Cassi');
  const [partner2Avatar, setPartner2Avatar] = useState(profile.partner2.avatar);
  const [partner2City, setPartner2City] = useState(profile.partner2.city || 'Porto Alegre - RS');

  // Security / PINs Form State
  const sec = profile.security || {};
  const [partner1Pin, setPartner1Pin] = useState(sec.partner1Pin || '2604');
  const [partner2Pin, setPartner2Pin] = useState(sec.partner2Pin || '5678');
  const [couplePasscode, setCouplePasscode] = useState(sec.couplePasscode || '2026');
  const [requirePinOnEveryOpen, setRequirePinOnEveryOpen] = useState(
    !!sec.requirePinOnEveryOpen
  );
  const [showPins, setShowPins] = useState(false);

  // Synchronize state when modal opens or profile changes
  React.useEffect(() => {
    if (isOpen && profile) {
      setCoupleName(profile.coupleName);
      setAnniversaryDate(profile.anniversaryDate);
      setAnniversaryNote(profile.anniversaryNote);
      setPartner1Name(profile.partner1.name);
      setPartner1Nickname(profile.partner1.nickname || 'Milla');
      setPartner1Avatar(profile.partner1.avatar);
      setPartner1City(profile.partner1.city || 'João Pessoa - PB');
      setPartner2Name(profile.partner2.name);
      setPartner2Nickname(profile.partner2.nickname || 'Cassi');
      setPartner2Avatar(profile.partner2.avatar);
      setPartner2City(profile.partner2.city || 'Porto Alegre - RS');
      const s = profile.security || {};
      setPartner1Pin(s.partner1Pin || '2604');
      setPartner2Pin(s.partner2Pin || '5678');
      setCouplePasscode(s.couplePasscode || '2026');
      setRequirePinOnEveryOpen(!!s.requirePinOnEveryOpen);
      if (profile.theme) {
        setSelectedTheme(profile.theme);
      }
    }
  }, [isOpen, profile]);

  const [saveSuccessMsg, setSaveSuccessMsg] = useState(false);

  // File input refs for uploading real photos from device / gallery
  const partner1FileRef = useRef<HTMLInputElement>(null);
  const partner2FileRef = useRef<HTMLInputElement>(null);

  // Calculate approximate JSON data size in KB
  const dataSizeKB = appData
    ? (new Blob([JSON.stringify(appData)]).size / 1024).toFixed(1)
    : '14.2';

  if (!isOpen) return null;

  const handleUploadAvatarPhoto = (
    partner: 'partner1' | 'partner2',
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxDim = 250;
        canvas.width = maxDim;
        canvas.height = maxDim;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          const minSide = Math.min(img.width, img.height);
          const sx = (img.width - minSide) / 2;
          const sy = (img.height - minSide) / 2;
          ctx.drawImage(img, sx, sy, minSide, minSide, 0, 0, maxDim, maxDim);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
          if (partner === 'partner1') {
            setPartner1Avatar(dataUrl);
          } else {
            setPartner2Avatar(dataUrl);
          }
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveProfile({
      ...profile,
      theme: selectedTheme,
      coupleName: coupleName.trim() || 'Nosso Canto',
      anniversaryDate,
      anniversaryNote: anniversaryNote.trim() || 'Nosso amor cresce a cada dia.',
      partner1: {
        ...profile.partner1,
        name: partner1Name.trim(),
        nickname: partner1Nickname.trim(),
        avatar: partner1Avatar.trim(),
        city: partner1City.trim(),
      },
      partner2: {
        ...profile.partner2,
        name: partner2Name.trim(),
        nickname: partner2Nickname.trim(),
        avatar: partner2Avatar.trim(),
        city: partner2City.trim(),
      },
      security: {
        partner1Pin: activePartner === 'partner2'
          ? (profile.security?.partner1Pin || '2604')
          : (partner1Pin.trim() || profile.security?.partner1Pin || '2604'),
        partner2Pin: activePartner === 'partner1'
          ? (profile.security?.partner2Pin || '5678')
          : (partner2Pin.trim() || profile.security?.partner2Pin || '5678'),
        couplePasscode: couplePasscode.trim() || profile.security?.couplePasscode || '2026',
        requirePinOnEveryOpen,
      },
    });

    setSaveSuccessMsg(true);
    setTimeout(() => {
      setSaveSuccessMsg(false);
      onClose();
    }, 700);
  };

  const handleExportBackup = () => {
    if (!appData) return;
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(appData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `nosso_canto_backup_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !onRestoreData) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed && parsed.profile) {
          onRestoreData(parsed);
          alert('Backup restaurado com sucesso! Os dados foram atualizados.');
          onClose();
        } else {
          alert('Arquivo de backup inválido.');
        }
      } catch (err) {
        alert('Erro ao ler o arquivo de backup.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overscroll-none touch-none"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="bg-white dark:bg-[#241C21] rounded-3xl max-w-lg w-full p-4 sm:p-6 border border-[#F2E8E4] dark:border-[#3D2F36] shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto overflow-x-hidden overscroll-contain touch-pan-y transform-gpu"
        style={{
          WebkitOverflowScrolling: 'touch',
          touchAction: 'pan-y',
        }}
      >
        <div className="flex items-center justify-between pb-2 border-b border-[#F2E8E4] dark:border-[#3D2F36]">
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-[#E07A8B]" />
            <h3 className="font-serif font-bold text-lg text-[#2D2327] dark:text-[#FAF4F0]">
              Configurações do Casal
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-xs text-[#7D6F74] hover:text-[#2D2327] dark:hover:text-white"
          >
            ✕
          </button>
        </div>

        {/* Tab Selection */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 p-1 rounded-2xl bg-[#FAF8F5] dark:bg-[#2A2026] border border-[#F2E8E4] dark:border-[#3D2F36]">
          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            className={`w-full py-2 px-2 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5 whitespace-nowrap ${
              activeTab === 'profile'
                ? 'bg-white dark:bg-[#3D2F36] text-[#2D2327] dark:text-[#FAF4F0] shadow-xs'
                : 'text-[#7D6F74] dark:text-[#B8A8AF] hover:text-[#2D2327]'
            }`}
          >
            <Heart className="w-3.5 h-3.5 text-[#E07A8B]" />
            <span>Perfil</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('theme')}
            className={`w-full py-2 px-2 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5 whitespace-nowrap ${
              activeTab === 'theme'
                ? 'bg-white dark:bg-[#3D2F36] text-[#2D2327] dark:text-[#FAF4F0] shadow-xs'
                : 'text-[#7D6F74] dark:text-[#B8A8AF] hover:text-[#2D2327]'
            }`}
          >
            <Palette className="w-3.5 h-3.5 text-rose-500" />
            <span>Cores & Tema</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('security')}
            className={`w-full py-2 px-2 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5 whitespace-nowrap ${
              activeTab === 'security'
                ? 'bg-white dark:bg-[#3D2F36] text-[#2D2327] dark:text-[#FAF4F0] shadow-xs'
                : 'text-[#7D6F74] dark:text-[#B8A8AF] hover:text-[#2D2327]'
            }`}
          >
            <Lock className="w-3.5 h-3.5 text-amber-500" />
            <span>Segurança & PINs</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('cloud')}
            className={`w-full py-2 px-2 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5 whitespace-nowrap ${
              activeTab === 'cloud'
                ? 'bg-white dark:bg-[#3D2F36] text-[#2D2327] dark:text-[#FAF4F0] shadow-xs'
                : 'text-[#7D6F74] dark:text-[#B8A8AF] hover:text-[#2D2327]'
            }`}
          >
            <HardDrive className="w-3.5 h-3.5 text-sky-500" />
            <span>Backup & Memória</span>
          </button>
        </div>

        {saveSuccessMsg && (
          <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-700/60 text-emerald-800 dark:text-emerald-200 text-xs font-medium flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Alterações salvas com sucesso!</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs sm:text-sm">
          {/* TAB 1: Profile */}
          {activeTab === 'profile' && (
            <div className="space-y-3">
              <div>
                <label className="block font-medium text-[#2D2327] dark:text-[#FAF4F0] mb-1">
                  Nome do App / Título do Casal
                </label>
                <input
                  type="text"
                  required
                  value={coupleName}
                  onChange={(e) => setCoupleName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#FAF8F5] dark:bg-[#2D2228] border border-[#F2E8E4] dark:border-[#3D2F36] text-[#2D2327] dark:text-[#FAF4F0] focus:outline-none focus:ring-1 focus:ring-[#E07A8B]"
                />
              </div>

              <div className="w-full max-w-full min-w-0">
                <label className="block font-medium text-[#2D2327] dark:text-[#FAF4F0] mb-1">
                  Data de Início do Relacionamento
                </label>
                <input
                  type="date"
                  required
                  value={anniversaryDate}
                  onChange={(e) => setAnniversaryDate(e.target.value)}
                  className="w-full max-w-full min-w-0 box-border px-3 py-2 rounded-xl bg-[#FAF8F5] dark:bg-[#2D2228] border border-[#F2E8E4] dark:border-[#3D2F36] text-[#2D2327] dark:text-[#FAF4F0] focus:outline-none focus:ring-1 focus:ring-[#E07A8B]"
                  style={{
                    width: '100%',
                    maxWidth: '100%',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div>
                <label className="block font-medium text-[#2D2327] dark:text-[#FAF4F0] mb-1">
                  Frase de Dedicação / Lema do Casal
                </label>
                <textarea
                  rows={2}
                  value={anniversaryNote}
                  onChange={(e) => setAnniversaryNote(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#FAF8F5] dark:bg-[#2D2228] border border-[#F2E8E4] dark:border-[#3D2F36] text-[#2D2327] dark:text-[#FAF4F0] focus:outline-none focus:ring-1 focus:ring-[#E07A8B]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-[#F2E8E4] dark:border-[#3D2F36]">
                {/* Hidden file inputs for uploading photos from gallery */}
                <input
                  ref={partner1FileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleUploadAvatarPhoto('partner1', e)}
                />
                <input
                  ref={partner2FileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleUploadAvatarPhoto('partner2', e)}
                />

                {/* Partner 1 (Milla) */}
                <div className="space-y-2 p-3 rounded-2xl bg-[#FAF8F5]/60 dark:bg-[#2D2228]/40 border border-[#F2E8E4] dark:border-[#3D2F36]">
                  <div className="flex items-center justify-between">
                    <label className="block font-semibold text-[#2D2327] dark:text-[#FAF4F0] text-xs">
                      Parceira 1 (Milla)
                    </label>
                    <span className="text-[10px] text-rose-600 dark:text-rose-400 font-medium">
                      Foto ou Emoji
                    </span>
                  </div>

                  {/* Avatar Preview & Photo Upload Button */}
                  <div className="flex items-center gap-3 p-2 rounded-xl bg-white dark:bg-[#22191E] border border-[#F2E8E4] dark:border-[#3D2F36]">
                    <div className="relative">
                      <PartnerAvatar
                        avatar={partner1Avatar}
                        name={partner1Name}
                        size="lg"
                        className="border-2 border-[#E07A8B] shadow-xs"
                      />
                    </div>
                    <div className="flex-1 min-w-0 space-y-1">
                      <button
                        type="button"
                        onClick={() => partner1FileRef.current?.click()}
                        className="w-full px-2.5 py-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 text-[11px] font-semibold border border-rose-200/60 dark:border-rose-800/60 flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <Camera className="w-3.5 h-3.5" />
                        <span>Pegar Foto da Galeria</span>
                      </button>

                      {isAvatarImage(partner1Avatar) ? (
                        <button
                          type="button"
                          onClick={() => setPartner1Avatar('👩🏻')}
                          className="w-full text-center text-[10px] text-zinc-500 hover:text-rose-600 underline"
                        >
                          Remover foto (usar emoji)
                        </button>
                      ) : (
                        <p className="text-[10px] text-[#7D6F74] dark:text-[#B8A8AF]">
                          Ou escolha um emoji abaixo
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <input
                      type="text"
                      required
                      value={partner1Name}
                      onChange={(e) => setPartner1Name(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-xl bg-white dark:bg-[#22191E] border border-[#F2E8E4] dark:border-[#3D2F36] text-xs text-[#2D2327] dark:text-[#FAF4F0]"
                      placeholder="Nome completo (ex: Camilla Duque)"
                    />
                    <input
                      type="text"
                      value={partner1Nickname}
                      onChange={(e) => setPartner1Nickname(e.target.value)}
                      className="w-full px-2.5 py-1 rounded-xl bg-white dark:bg-[#22191E] border border-[#F2E8E4] dark:border-[#3D2F36] text-[11px] text-[#2D2327] dark:text-[#FAF4F0]"
                      placeholder="Apelido carinhoso (ex: Milla)"
                    />
                    <div className="relative">
                      <input
                        type="text"
                        value={partner1City}
                        onChange={(e) => setPartner1City(e.target.value)}
                        className="w-full pl-6 pr-2.5 py-1 rounded-xl bg-white dark:bg-[#22191E] border border-[#F2E8E4] dark:border-[#3D2F36] text-[11px] text-[#2D2327] dark:text-[#FAF4F0]"
                        placeholder="Cidade (ex: João Pessoa - PB)"
                      />
                      <MapPin className="w-3 h-3 text-rose-500 absolute left-2 top-2" />
                    </div>
                  </div>

                  {/* Quick Emoji Picker */}
                  <div className="pt-1">
                    <p className="text-[10px] text-[#7D6F74] dark:text-[#B8A8AF] mb-1">
                      Emojis rápidos:
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {AVATAR_PRESETS.map((emoji) => (
                        <button
                          key={emoji}
                          type="button"
                          onClick={() => setPartner1Avatar(emoji)}
                          className={`w-7 h-7 flex items-center justify-center rounded-lg text-sm transition-transform hover:scale-115 ${
                            partner1Avatar === emoji
                              ? 'bg-rose-100 dark:bg-rose-950/60 ring-2 ring-[#E07A8B]'
                              : 'bg-white dark:bg-[#20171C] border border-[#F2E8E4] dark:border-[#3D2F36] hover:bg-rose-50'
                          }`}
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Partner 2 (Cassi) */}
                <div className="space-y-2 p-3 rounded-2xl bg-[#FAF8F5]/60 dark:bg-[#2D2228]/40 border border-[#F2E8E4] dark:border-[#3D2F36]">
                  <div className="flex items-center justify-between">
                    <label className="block font-semibold text-[#2D2327] dark:text-[#FAF4F0] text-xs">
                      Parceira 2 (Cassi)
                    </label>
                    <span className="text-[10px] text-rose-600 dark:text-rose-400 font-medium">
                      Foto ou Emoji
                    </span>
                  </div>

                  {/* Avatar Preview & Photo Upload Button */}
                  <div className="flex items-center gap-3 p-2 rounded-xl bg-white dark:bg-[#22191E] border border-[#F2E8E4] dark:border-[#3D2F36]">
                    <div className="relative">
                      <PartnerAvatar
                        avatar={partner2Avatar}
                        name={partner2Name}
                        size="lg"
                        className="border-2 border-[#E07A8B] shadow-xs"
                      />
                    </div>
                    <div className="flex-1 min-w-0 space-y-1">
                      <button
                        type="button"
                        onClick={() => partner2FileRef.current?.click()}
                        className="w-full px-2.5 py-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 text-[11px] font-semibold border border-rose-200/60 dark:border-rose-800/60 flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <Camera className="w-3.5 h-3.5" />
                        <span>Pegar Foto da Galeria</span>
                      </button>

                      {isAvatarImage(partner2Avatar) ? (
                        <button
                          type="button"
                          onClick={() => setPartner2Avatar('👩🏽')}
                          className="w-full text-center text-[10px] text-zinc-500 hover:text-rose-600 underline"
                        >
                          Remover foto (usar emoji)
                        </button>
                      ) : (
                        <p className="text-[10px] text-[#7D6F74] dark:text-[#B8A8AF]">
                          Ou escolha um emoji abaixo
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <input
                      type="text"
                      required
                      value={partner2Name}
                      onChange={(e) => setPartner2Name(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-xl bg-white dark:bg-[#22191E] border border-[#F2E8E4] dark:border-[#3D2F36] text-xs text-[#2D2327] dark:text-[#FAF4F0]"
                      placeholder="Nome completo (ex: Cassiane)"
                    />
                    <input
                      type="text"
                      value={partner2Nickname}
                      onChange={(e) => setPartner2Nickname(e.target.value)}
                      className="w-full px-2.5 py-1 rounded-xl bg-white dark:bg-[#22191E] border border-[#F2E8E4] dark:border-[#3D2F36] text-[11px] text-[#2D2327] dark:text-[#FAF4F0]"
                      placeholder="Apelido carinhoso (ex: Cassi)"
                    />
                    <div className="relative">
                      <input
                        type="text"
                        value={partner2City}
                        onChange={(e) => setPartner2City(e.target.value)}
                        className="w-full pl-6 pr-2.5 py-1 rounded-xl bg-white dark:bg-[#22191E] border border-[#F2E8E4] dark:border-[#3D2F36] text-[11px] text-[#2D2327] dark:text-[#FAF4F0]"
                        placeholder="Cidade (ex: Porto Alegre - RS)"
                      />
                      <MapPin className="w-3 h-3 text-[#D4A373] absolute left-2 top-2" />
                    </div>
                  </div>

                  {/* Quick Emoji Picker */}
                  <div className="pt-1">
                    <p className="text-[10px] text-[#7D6F74] dark:text-[#B8A8AF] mb-1">
                      Emojis rápidos:
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {AVATAR_PRESETS.map((emoji) => (
                        <button
                          key={emoji}
                          type="button"
                          onClick={() => setPartner2Avatar(emoji)}
                          className={`w-7 h-7 flex items-center justify-center rounded-lg text-sm transition-transform hover:scale-115 ${
                            partner2Avatar === emoji
                              ? 'bg-rose-100 dark:bg-rose-950/60 ring-2 ring-[#E07A8B]'
                              : 'bg-white dark:bg-[#20171C] border border-[#F2E8E4] dark:border-[#3D2F36] hover:bg-rose-50'
                          }`}
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 1.5: Cores & Tema do App */}
          {activeTab === 'theme' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-2xl bg-gradient-to-r from-rose-50 via-amber-50 to-pink-50 dark:from-rose-950/40 dark:via-amber-950/30 dark:to-pink-950/30 border border-rose-200/60 dark:border-rose-900/40 text-xs text-[#7D6F74] dark:text-[#B8A8AF] space-y-1">
                <strong className="text-[#2D2327] dark:text-[#FAF4F0] flex items-center gap-1.5 font-semibold text-sm">
                  <Palette className="w-4 h-4 text-[#E07A8B]" />
                  Personalize a Atmosfera do Aplicativo
                </strong>
                <p>
                  Escolha a paleta de cores favorita de vocês. O tema é aplicado imediatamente e sincronizado para o casal!
                </p>
              </div>

              {themeFeedback && (
                <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-200 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>{themeFeedback}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  {
                    id: 'rose',
                    name: 'Rosa Romântico',
                    badge: 'Original 💕',
                    desc: 'Tons de blush, marfim e rosa suave clássico.',
                    bgPreview: '#FAF8F5',
                    cardPreview: '#FFFFFF',
                    accent: '#E07A8B',
                    secondary: '#D4A373',
                  },
                  {
                    id: 'pokemon',
                    name: 'Amarelo Pokémon & Pikachu',
                    badge: 'Especial Cassi ⚡',
                    desc: 'Dourado brilhante e raios para a jornada da Cassi!',
                    bgPreview: '#FCF9F0',
                    cardPreview: '#FFFFFF',
                    accent: '#E09F1B',
                    secondary: '#E24F4F',
                  },
                  {
                    id: 'lavender',
                    name: 'Lavanda & Sonho',
                    badge: 'Relaxante 💜',
                    desc: 'Lilás suave, ametista delicado e calmaria.',
                    bgPreview: '#F8F6FB',
                    cardPreview: '#FFFFFF',
                    accent: '#9A74B8',
                    secondary: '#7E94B8',
                  },
                  {
                    id: 'sage',
                    name: 'Verde Sálvia & Matcha',
                    badge: 'Botânico 🌿',
                    desc: 'Verde fresco botânico, menta e sensação zen.',
                    bgPreview: '#F6F9F6',
                    cardPreview: '#FFFFFF',
                    accent: '#5F8F6E',
                    secondary: '#9BAF88',
                  },
                  {
                    id: 'peach',
                    name: 'Pêssego & Terracota',
                    badge: 'Aconchegante 🍑',
                    desc: 'Tons quentes de entardecer, damasco e aconchego.',
                    bgPreview: '#FCF7F3',
                    cardPreview: '#FFFFFF',
                    accent: '#E0825B',
                    secondary: '#DFA668',
                  },
                  {
                    id: 'sky',
                    name: 'Azul Céu & Sereno',
                    badge: 'Sereno 🌊',
                    desc: 'Azul brisa suave, fresco e sereno como o mar.',
                    bgPreview: '#F4F8FA',
                    cardPreview: '#FFFFFF',
                    accent: '#4A8DB7',
                    secondary: '#6EACC2',
                  },
                ].map((th) => {
                  const isSelected = selectedTheme === th.id;
                  return (
                    <button
                      key={th.id}
                      type="button"
                      onClick={() => handleSelectTheme(th.id)}
                      className={`p-3.5 rounded-2xl border text-left transition-all flex flex-col justify-between gap-2.5 relative overflow-hidden group ${
                        isSelected
                          ? 'border-[#E07A8B] ring-2 ring-[#E07A8B]/30 bg-rose-50/40 dark:bg-rose-950/20 shadow-xs'
                          : 'border-[#F2E8E4] dark:border-[#3D2F36] bg-[#FAF8F5]/60 dark:bg-[#20171C]/50 hover:border-rose-300 dark:hover:border-rose-800'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-bold text-xs sm:text-sm text-[#2D2327] dark:text-[#FAF4F0]">
                              {th.name}
                            </span>
                            <span className="text-[10px] px-1.5 py-0.2 rounded-full font-semibold bg-white dark:bg-black/30 border border-zinc-200 dark:border-zinc-700 text-[#7D6F74] dark:text-[#B8A8AF]">
                              {th.badge}
                            </span>
                          </div>
                          <p className="text-[11px] text-[#7D6F74] dark:text-[#B8A8AF] mt-0.5 leading-snug">
                            {th.desc}
                          </p>
                        </div>
                        {isSelected && (
                          <div className="w-5 h-5 rounded-full bg-[#E07A8B] text-white flex items-center justify-center shrink-0">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          </div>
                        )}
                      </div>

                      {/* Visual Color Palette Swatches */}
                      <div className="flex items-center gap-2 pt-1 border-t border-zinc-200/50 dark:border-zinc-800/60">
                        <span className="text-[10px] text-[#7D6F74] dark:text-[#B8A8AF]">Paleta:</span>
                        <div className="flex items-center gap-1.5">
                          <span
                            className="w-4 h-4 rounded-full border border-black/10 shadow-2xs"
                            style={{ backgroundColor: th.accent }}
                            title="Cor principal"
                          />
                          <span
                            className="w-4 h-4 rounded-full border border-black/10 shadow-2xs"
                            style={{ backgroundColor: th.secondary }}
                            title="Cor secundária"
                          />
                          <span
                            className="w-4 h-4 rounded-full border border-black/10 shadow-2xs"
                            style={{ backgroundColor: th.bgPreview }}
                            title="Fundo principal"
                          />
                        </div>
                        {isSelected && (
                          <span className="text-[10px] font-bold text-[#E07A8B] ml-auto">
                            Ativo no app
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: Security & PINs */}
          {activeTab === 'security' && (
            <div className="space-y-3">
              <div className="p-3.5 rounded-2xl bg-amber-50/70 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/40 text-xs text-[#7D6F74] dark:text-[#B8A8AF] space-y-1.5">
                <strong className="text-[#2D2327] dark:text-[#FAF4F0] flex items-center gap-1.5 font-semibold">
                  <Shield className="w-4 h-4 text-amber-600" />
                  Proteção por PIN Individual & Privada
                </strong>
                <p>
                  Cada uma tem seu próprio código de 4 a 6 dígitos. Por questão de respeito e privacidade, <strong>você só pode alterar o seu próprio PIN</strong> ({activePartner === 'partner2' ? partner2Nickname || partner2Name : partner1Nickname || partner1Name}).
                </p>
                <p className="text-[11px] text-amber-800 dark:text-amber-300 font-medium">
                  💡 O PIN da sua parceira é protegido e só pode ser alterado por ela ao entrar no perfil dela.
                </p>
              </div>

              <div className="flex items-center justify-end px-1">
                <button
                  type="button"
                  onClick={() => setShowPins(!showPins)}
                  className="inline-flex items-center gap-1 text-xs text-[#E07A8B] hover:text-[#c75b6e] font-medium transition-colors"
                >
                  {showPins ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  <span>{showPins ? 'Ocultar dígitos' : 'Mostrar dígitos para conferir'}</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Camilla PIN */}
                <div className={`p-3 rounded-2xl border transition-all ${
                  activePartner === 'partner2'
                    ? 'bg-zinc-50/70 dark:bg-[#1E171B] border-zinc-200 dark:border-zinc-800 opacity-90'
                    : 'bg-[#FAF8F5] dark:bg-[#2D2228] border-rose-200/80 dark:border-rose-900/50'
                }`}>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="font-medium text-[#2D2327] dark:text-[#FAF4F0] flex items-center gap-1.5 text-xs">
                      <PartnerAvatar avatar={partner1Avatar} name={partner1Name} size="xs" />
                      <span>PIN de {partner1Nickname || partner1Name}</span>
                    </label>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                      activePartner === 'partner2'
                        ? 'text-zinc-600 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700'
                        : 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/60 border-rose-200 dark:border-rose-900/60'
                    }`}>
                      {activePartner === 'partner2' ? '🔒 Só Milla altera' : 'Seu PIN 🔑'}
                    </span>
                  </div>

                  <input
                    type={showPins && activePartner !== 'partner2' ? 'text' : 'password'}
                    maxLength={6}
                    disabled={activePartner === 'partner2'}
                    value={activePartner === 'partner2' ? '••••••' : partner1Pin}
                    onChange={(e) => setPartner1Pin(e.target.value.replace(/\D/g, ''))}
                    className={`w-full px-3 py-2 rounded-xl border text-center tracking-widest font-mono text-sm focus:outline-none ${
                      activePartner === 'partner2'
                        ? 'bg-zinc-100/60 dark:bg-zinc-900/60 border-zinc-200 dark:border-zinc-800 text-zinc-400 cursor-not-allowed'
                        : 'bg-white dark:bg-[#1F171C] border-[#F2E8E4] dark:border-[#3D2F36] text-[#2D2327] dark:text-[#FAF4F0] focus:ring-2 focus:ring-[#E07A8B]'
                    }`}
                    placeholder="2604"
                  />
                  <span className="text-[10px] text-[#A6999F] block mt-1">
                    {activePartner === 'partner2'
                      ? '🔒 Protegido. Apenas a Milla altera no perfil dela em João Pessoa.'
                      : '4 a 6 números para desbloquear o seu perfil.'}
                  </span>
                </div>

                {/* Cassiane PIN */}
                <div className={`p-3 rounded-2xl border transition-all ${
                  activePartner === 'partner1'
                    ? 'bg-zinc-50/70 dark:bg-[#1E171B] border-zinc-200 dark:border-zinc-800 opacity-90'
                    : 'bg-[#FAF8F5] dark:bg-[#2D2228] border-rose-200/80 dark:border-rose-900/50'
                }`}>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="font-medium text-[#2D2327] dark:text-[#FAF4F0] flex items-center gap-1.5 text-xs">
                      <PartnerAvatar avatar={partner2Avatar} name={partner2Name} size="xs" />
                      <span>PIN de {partner2Nickname || partner2Name}</span>
                    </label>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                      activePartner === 'partner1'
                        ? 'text-zinc-600 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700'
                        : 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/60 border-rose-200 dark:border-rose-900/60'
                    }`}>
                      {activePartner === 'partner1' ? '🔒 Só Cassi altera' : 'Seu PIN 🔑'}
                    </span>
                  </div>

                  <input
                    type={showPins && activePartner !== 'partner1' ? 'text' : 'password'}
                    maxLength={6}
                    disabled={activePartner === 'partner1'}
                    value={activePartner === 'partner1' ? '••••••' : partner2Pin}
                    onChange={(e) => setPartner2Pin(e.target.value.replace(/\D/g, ''))}
                    className={`w-full px-3 py-2 rounded-xl border text-center tracking-widest font-mono text-sm focus:outline-none ${
                      activePartner === 'partner1'
                        ? 'bg-zinc-100/60 dark:bg-zinc-900/60 border-zinc-200 dark:border-zinc-800 text-zinc-400 cursor-not-allowed'
                        : 'bg-white dark:bg-[#1F171C] border-[#F2E8E4] dark:border-[#3D2F36] text-[#2D2327] dark:text-[#FAF4F0] focus:ring-2 focus:ring-[#E07A8B]'
                    }`}
                    placeholder="5678"
                  />
                  <span className="text-[10px] text-[#A6999F] block mt-1">
                    {activePartner === 'partner1'
                      ? '🔒 Protegido. Apenas a Cassi altera no perfil dela em Porto Alegre.'
                      : '4 a 6 números para desbloquear o seu perfil.'}
                  </span>
                </div>
              </div>

              <div>
                <label className="block font-medium text-[#2D2327] dark:text-[#FAF4F0] mb-1 text-xs">
                  PIN Mestre do Casal (código compartilhado alternativo)
                </label>
                <input
                  type={showPins ? 'text' : 'password'}
                  maxLength={6}
                  value={couplePasscode}
                  onChange={(e) => setCouplePasscode(e.target.value.replace(/\D/g, ''))}
                  className="w-full px-3 py-2 rounded-xl bg-[#FAF8F5] dark:bg-[#2D2228] border border-[#F2E8E4] dark:border-[#3D2F36] text-[#2D2327] dark:text-[#FAF4F0] font-mono tracking-widest text-xs focus:outline-none focus:ring-1 focus:ring-[#E07A8B]"
                  placeholder="2026"
                />
                <span className="text-[10px] text-[#A6999F] block mt-0.5">Um PIN reserva que ambas conhecem</span>
              </div>

              <div className="pt-2 border-t border-[#F2E8E4] dark:border-[#3D2F36]">
                <label className="flex items-center gap-2 text-xs text-[#2D2327] dark:text-[#FAF4F0] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={requirePinOnEveryOpen}
                    onChange={(e) => setRequirePinOnEveryOpen(e.target.checked)}
                    className="w-4 h-4 rounded text-[#E07A8B] focus:ring-[#E07A8B]"
                  />
                  <span>Sempre pedir o PIN toda vez que fechar e reabrir o app</span>
                </label>
                <p className="text-[10px] text-[#7D6F74] dark:text-[#B8A8AF] ml-6 mt-0.5">
                  Se desativado, o celular lembra seu login até que você clique no botão 🔒 Bloquear no topo.
                </p>
              </div>
            </div>
          )}

          {/* TAB 3: Backup & Memória */}
          {activeTab === 'cloud' && (
            <div className="space-y-3.5">
              {/* Memory / Storage Metric Card */}
              <div className="p-3.5 rounded-2xl bg-[#FAF8F5] dark:bg-[#2A2026] border border-[#F2E8E4] dark:border-[#3D2F36] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-xs text-[#2D2327] dark:text-[#FAF4F0] flex items-center gap-1.5">
                    <HardDrive className="w-4 h-4 text-emerald-500" />
                    Consumo de Memória do App
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 font-mono text-[11px] font-bold">
                    ~{dataSizeKB} KB usado
                  </span>
                </div>
                <div className="text-[11px] text-[#7D6F74] dark:text-[#B8A8AF] space-y-1">
                  <p>
                    <strong>Quanto de memória isso consome e se aguenta?</strong>
                  </p>
                  <p>
                    • <strong>Espaço ocupado:</strong> O app é extremamente leve! Todos os seus dados de texto (contas, receitas, despensa, viagens) ocupam apenas cerca de <strong>15 a 50 KB</strong>. Isso é menos que uma única foto tirada no celular!
                  </p>
                  <p>
                    • <strong>Capacidade:</strong> O armazenamento local do navegador suporta até <strong>5.000 KB (5 MB)</strong> para este app, o que dá espaço para <strong>mais de 10 anos</strong> de compras de mercado, contas mensais e anotações diárias sem consumir memória RAM nem esquentar o celular.
                  </p>
                </div>
              </div>

              {/* Proteção dos Seus Dados Reais */}
              <div className="p-3.5 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/40 space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    Proteção dos Seus Dados Reais
                  </h4>
                  <span className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-900/60 px-2 py-0.5 rounded-full">
                    Ativa
                  </span>
                </div>
                <p className="text-[11px] text-[#7D6F74] dark:text-[#B8A8AF]">
                  O botão de zerar dados foi removido para proteger 100% o app contra exclusões acidentais. Todos os filmes, receitas, itens de mercado, links de decoração e memórias que vocês cadastrarem ficam salvos e sincronizados com segurança entre João Pessoa e Porto Alegre.
                </p>
                <div className="flex items-center gap-2 pt-0.5 text-[10px] text-emerald-700 dark:text-emerald-400 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  <span>Nenhum dado de teste será colocado automaticamente. O app é 100% de vocês.</span>
                </div>
              </div>

              {/* Sincronização em Nuvem em Tempo Real */}
              <div className="p-3.5 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-xs text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
                    <RefreshCw className={`w-4 h-4 text-amber-600 ${isSyncing ? 'animate-spin' : ''}`} />
                    Sincronização com Outro Dispositivo (Celular / Notebook)
                  </h4>
                </div>
                <p className="text-[11px] text-[#7D6F74] dark:text-[#B8A8AF]">
                  Se você trocou a foto de perfil ou cadastrou algo no celular e deseja atualizar o notebook (ou vice-versa), clique no botão abaixo para buscar imediatamente os dados mais recentes salvos na nuvem.
                </p>
                {onManualSync && (
                  <button
                    type="button"
                    onClick={onManualSync}
                    disabled={isSyncing}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white dark:bg-[#33272D] border border-amber-300 dark:border-amber-800 text-xs font-semibold text-amber-800 dark:text-amber-200 hover:bg-amber-100/50 transition-colors shadow-2xs cursor-pointer"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-[#E07A8B]' : 'text-amber-600'}`} />
                    <span>{isSyncing ? 'Sincronizando agora...' : 'Sincronizar com a Nuvem Agora'}</span>
                  </button>
                )}
              </div>

              {/* Backup & Exportação Completa */}
              <div className="p-3.5 rounded-2xl bg-[#FAF8F5] dark:bg-[#2A2026] border border-[#F2E8E4] dark:border-[#3D2F36] space-y-2.5">
                <h4 className="font-semibold text-xs text-[#2D2327] dark:text-[#FAF4F0] flex items-center gap-1.5">
                  <Download className="w-4 h-4 text-[#E07A8B]" />
                  Backup dos Seus Dados
                </h4>
                <p className="text-[11px] text-[#7D6F74] dark:text-[#B8A8AF]">
                  Você pode baixar a qualquer momento um arquivo com tudo o que cadastraram. Se trocar de celular ou quiser restaurar, basta importar o arquivo aqui.
                </p>

                <div className="flex flex-wrap gap-2 pt-0.5">
                  <button
                    type="button"
                    onClick={handleExportBackup}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white dark:bg-[#33272D] border border-[#F2E8E4] dark:border-[#3D2F36] text-xs font-semibold text-[#2D2327] dark:text-[#FAF4F0] hover:bg-[#FAF3EC] transition-colors shadow-2xs"
                  >
                    <Download className="w-3.5 h-3.5 text-[#E07A8B]" />
                    <span>Baixar Backup (.json)</span>
                  </button>

                  <label className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white dark:bg-[#33272D] border border-[#F2E8E4] dark:border-[#3D2F36] text-xs font-semibold text-[#7D6F74] dark:text-[#B8A8AF] hover:text-[#2D2327] cursor-pointer transition-colors shadow-2xs">
                    <Upload className="w-3.5 h-3.5 text-sky-500" />
                    <span>Restaurar Backup</span>
                    <input
                      type="file"
                      accept=".json"
                      onChange={handleImportBackup}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              {/* Celular / App Nativo */}
              <div className="p-3.5 rounded-2xl bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/40 text-[11px] text-[#7D6F74] dark:text-[#B8A8AF] space-y-1.5">
                <strong className="text-[#2D2327] dark:text-[#FAF4F0] flex items-center gap-1.5 font-semibold">
                  <Smartphone className="w-4 h-4 text-[#E07A8B]" />
                  Como adicionar na tela inicial do celular (como app nativo):
                </strong>
                <ul className="list-disc list-inside space-y-1 pl-1">
                  <li>
                    <strong>iPhone (Safari):</strong> Toque no ícone de <em>Compartilhar</em> (quadrado com setinha pra cima) e selecione <strong>"Adicionar à Tela de Início"</strong>.
                  </li>
                  <li>
                    <strong>Android (Chrome):</strong> Toque nos <strong>três pontinhos ⋮</strong> no canto superior e selecione <strong>"Instalar aplicativo"</strong> ou <strong>"Adicionar à tela inicial"</strong>.
                  </li>
                </ul>
                <p className="text-[10px] text-rose-700 dark:text-rose-300 pt-0.5">
                  ✨ O ícone personalizado do <strong>Nosso Canto</strong> vai aparecer na tela inicial do seu celular e o app abrirá em tela cheia, sem barra de navegador!
                </p>
              </div>
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#F2E8E4] dark:border-[#3D2F36]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-[#7D6F74] hover:bg-zinc-100 dark:hover:bg-zinc-800 text-xs"
            >
              Fechar
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-[#E07A8B] hover:bg-[#d66a7c] text-white font-semibold text-xs shadow-xs transition-colors"
            >
              Salvar Alterações
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
