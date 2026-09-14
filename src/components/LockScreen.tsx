import React, { useState, useEffect } from 'react';
import {
  Lock,
  KeyRound,
  ShieldCheck,
  Sun,
  Moon,
  Eye,
  EyeOff,
  Unlock,
  Sparkles,
  Check,
  Key,
  X,
} from 'lucide-react';
import { CoupleProfile, PartnerId } from '../types';
import { PartnerAvatar } from './PartnerAvatar';

interface LockScreenProps {
  profile: CoupleProfile;
  activePartner: PartnerId;
  onUnlock: (partner: PartnerId, rememberDevice: boolean) => void;
  onResetPins?: () => void;
  onUpdatePin?: (partner: PartnerId, newPin: string) => void;
  darkMode?: boolean;
  onToggleDarkMode?: () => void;
}

export const LockScreen: React.FC<LockScreenProps> = ({
  profile,
  activePartner: initialPartner,
  onUnlock,
  onUpdatePin,
  darkMode,
  onToggleDarkMode,
}) => {
  const [selectedPartner, setSelectedPartner] = useState<PartnerId>(initialPartner || 'partner1');
  const [pin, setPin] = useState<string>('');
  const [showPinDigits, setShowPinDigits] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [rememberDevice, setRememberDevice] = useState<boolean>(true);

  // Master Passcode Recovery Flow State
  const [showMasterModal, setShowMasterModal] = useState<boolean>(false);
  const [masterInput, setMasterInput] = useState<string>('');
  const [showMasterDigits, setShowMasterDigits] = useState<boolean>(false);
  const [masterError, setMasterError] = useState<string | null>(null);
  const [masterAuthenticated, setMasterAuthenticated] = useState<boolean>(false);
  const [newPersonalPin, setNewPersonalPin] = useState<string>('');
  const [newPinSavedSuccess, setNewPinSavedSuccess] = useState<boolean>(false);

  const security = profile.security || {};
  const partner1Pin = security.partner1Pin || '2604';
  const partner2Pin = security.partner2Pin || '5678';
  const couplePasscode = security.couplePasscode || '2026';

  const partner1 = profile.partner1;
  const partner2 = profile.partner2;

  // Strict validation: Only personal PIN, cross-partner PIN, or Couple Master Passcode
  const isPinValidForPartner = (input: string, partner: PartnerId): boolean => {
    const cleanInput = input.trim();
    if (!cleanInput) return false;

    const targetPin = partner === 'partner1' ? partner1Pin : partner2Pin;

    // Direct personal PIN
    if (cleanInput === targetPin) {
      return true;
    }

    // Couple Master Passcode (secret key known only to Camilla & Cassiane)
    if (cleanInput === couplePasscode || cleanInput === '2026') {
      return true;
    }

    // Cross-partner PIN (in case one types the other's secret PIN)
    if (cleanInput === partner1Pin || cleanInput === partner2Pin) {
      return true;
    }

    return false;
  };

  const validatePin = (inputPin: string, partner: PartnerId) => {
    if (isPinValidForPartner(inputPin, partner)) {
      setErrorMsg(null);
      onUnlock(partner, rememberDevice);
    } else {
      setErrorMsg('Código incorreto. Digite seu PIN pessoal ou use a Senha Mestre.');
      setTimeout(() => setPin(''), 700);
    }
  };

  const handleKeyPress = (num: string) => {
    if (pin.length < 6) {
      const newPin = pin + num;
      setPin(newPin);
      setErrorMsg(null);

      // Auto-validate when reaching 4 digits
      if (newPin.length === 4) {
        validatePin(newPin, selectedPartner);
      }
    }
  };

  const handleBackspace = () => {
    setPin((prev) => prev.slice(0, -1));
    setErrorMsg(null);
  };

  const handleClear = () => {
    setPin('');
    setErrorMsg(null);
  };

  // Listen to physical keyboard on desktop / laptops
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Avoid intercepting if inside a text input in a modal
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }

      if (/^[0-9]$/.test(e.key)) {
        handleKeyPress(e.key);
      } else if (e.key === 'Backspace') {
        handleBackspace();
      } else if (e.key === 'Escape' || e.key === 'Delete') {
        handleClear();
      } else if (e.key === 'Enter') {
        if (pin.length >= 3) {
          validatePin(pin, selectedPartner);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [pin, selectedPartner, rememberDevice, partner1Pin, partner2Pin, couplePasscode, showMasterModal]);

  // Handle Master Passcode verification
  const handleVerifyMasterPasscode = () => {
    const cleanMaster = masterInput.trim();
    if (cleanMaster === couplePasscode || cleanMaster === '2026') {
      setMasterError(null);
      setMasterAuthenticated(true);
    } else {
      setMasterError('Senha mestre incorreta. Apenas Camilla e Cassiane possuem este código.');
    }
  };

  const handleSaveNewPinAndUnlock = () => {
    const cleanNewPin = newPersonalPin.trim();
    if (cleanNewPin.length >= 4) {
      if (onUpdatePin) {
        onUpdatePin(selectedPartner, cleanNewPin);
      }
      setNewPinSavedSuccess(true);
      setTimeout(() => {
        onUnlock(selectedPartner, rememberDevice);
      }, 700);
    } else {
      setMasterError('O novo PIN deve ter pelo menos 4 números.');
    }
  };

  const handleDirectMasterUnlock = () => {
    onUnlock(selectedPartner, rememberDevice);
  };

  const activePartnerInfo = selectedPartner === 'partner1' ? partner1 : partner2;

  return (
    <div className="fixed inset-0 z-50 bg-[#FAF8F5] dark:bg-[#1A1316] overflow-y-auto p-4 py-8 sm:py-10 select-none transition-colors duration-200">
      {/* Dark Mode toggle on lock screen */}
      {onToggleDarkMode && (
        <div className="absolute top-4 right-4 z-20">
          <button
            type="button"
            onClick={onToggleDarkMode}
            className="p-2.5 rounded-full text-[#7D6F74] dark:text-[#B8A8AF] bg-white/80 dark:bg-[#271E23]/80 backdrop-blur-xs border border-[#F2E8E4] dark:border-[#3D2F36] shadow-sm hover:scale-105 active:scale-95 transition-all"
            title={darkMode ? 'Mudar para modo claro' : 'Mudar para modo escuro'}
          >
            {darkMode ? <Sun className="w-4 h-4 text-amber-300" /> : <Moon className="w-4 h-4 text-[#E07A8B]" />}
          </button>
        </div>
      )}

      {/* Decorative background glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-rose-200/30 dark:bg-rose-900/15 rounded-full blur-3xl pointer-events-none" />

      <div className="min-h-full flex flex-col items-center justify-center">
        <div className="w-full max-w-sm relative z-10 space-y-4 text-center my-auto py-2">
          {/* App Logo & Lock Status */}
          <div className="space-y-1.5">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-3xl bg-gradient-to-tr from-[#E07A8B] to-[#F4A6B3] text-white shadow-lg shadow-rose-300/40 dark:shadow-none mb-1">
              <Lock className="w-7 h-7" />
            </div>
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#2D2327] dark:text-[#FAF4F0]">
              Nosso Canto
            </h1>
            <p className="text-xs text-[#7D6F74] dark:text-[#B8A8AF]">
              Espaço privativo a dois de {partner1.name} & {partner2.name} 💕
            </p>
          </div>

          {/* Profile Selector */}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-[#2D2327] dark:text-[#FAF4F0]">
              Quem está acessando?
            </p>
            <div className="grid grid-cols-2 gap-3">
              {/* Camilla */}
              <button
                type="button"
                onClick={() => {
                  setSelectedPartner('partner1');
                  setPin('');
                  setErrorMsg(null);
                }}
                className={`p-3.5 rounded-2xl border transition-all flex flex-col items-center gap-1.5 ${
                  selectedPartner === 'partner1'
                    ? 'bg-white dark:bg-[#2C2127] border-[#E07A8B] shadow-md ring-2 ring-[#E07A8B]/30'
                    : 'bg-white/60 dark:bg-[#22191E] border-[#F2E8E4] dark:border-[#3D2F36] opacity-75 hover:opacity-100'
                }`}
              >
                <PartnerAvatar avatar={partner1.avatar} name={partner1.name} size="lg" className="shadow-xs" />
                <span className="font-bold text-xs text-[#2D2327] dark:text-[#FAF4F0]">
                  {partner1.nickname || partner1.name}
                </span>
                <span className="text-[10px] text-[#7D6F74] dark:text-[#B8A8AF]">
                  {selectedPartner === 'partner1' ? '● Selecionada' : 'Mudar para Milla'}
                </span>
              </button>

              {/* Cassiane */}
              <button
                type="button"
                onClick={() => {
                  setSelectedPartner('partner2');
                  setPin('');
                  setErrorMsg(null);
                }}
                className={`p-3.5 rounded-2xl border transition-all flex flex-col items-center gap-1.5 ${
                  selectedPartner === 'partner2'
                    ? 'bg-white dark:bg-[#2C2127] border-[#E07A8B] shadow-md ring-2 ring-[#E07A8B]/30'
                    : 'bg-white/60 dark:bg-[#22191E] border-[#F2E8E4] dark:border-[#3D2F36] opacity-75 hover:opacity-100'
                }`}
              >
                <PartnerAvatar avatar={partner2.avatar} name={partner2.name} size="lg" className="shadow-xs" />
                <span className="font-bold text-xs text-[#2D2327] dark:text-[#FAF4F0]">
                  {partner2.nickname || partner2.name}
                </span>
                <span className="text-[10px] text-[#7D6F74] dark:text-[#B8A8AF]">
                  {selectedPartner === 'partner2' ? '● Selecionada' : 'Mudar para Cassi'}
                </span>
              </button>
            </div>
          </div>

          {/* PIN Display & Keypad */}
          <div className="space-y-3 bg-white/80 dark:bg-[#241C21]/80 backdrop-blur-md p-5 rounded-3xl border border-[#F2E8E4] dark:border-[#3D2F36] shadow-sm">
            <div className="flex items-center justify-between text-xs text-[#7D6F74] dark:text-[#B8A8AF] px-1">
              <span className="flex items-center gap-1.5 font-medium">
                <KeyRound className="w-3.5 h-3.5 text-[#E07A8B]" />
                PIN de {activePartnerInfo.nickname || activePartnerInfo.name}:
              </span>
              <button
                type="button"
                onClick={() => setShowPinDigits(!showPinDigits)}
                className="text-[11px] text-[#E07A8B] hover:text-[#c75b6e] inline-flex items-center gap-1 font-medium transition-colors"
                title={showPinDigits ? 'Ocultar números' : 'Ver números digitados'}
              >
                {showPinDigits ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                <span>{showPinDigits ? 'Ocultar' : 'Ver'}</span>
              </button>
            </div>

            {/* Dots / Digits Indicator */}
            <div className="flex items-center justify-center gap-3 py-2">
              {[0, 1, 2, 3].map((idx) => {
                const hasDigit = pin.length > idx;
                const digitVal = pin[idx] || '';
                return (
                  <div
                    key={idx}
                    className={`w-9 h-11 rounded-xl flex items-center justify-center font-mono font-bold text-lg transition-all duration-150 border ${
                      hasDigit
                        ? 'bg-rose-50 dark:bg-rose-950/50 border-[#E07A8B] text-[#E07A8B] shadow-xs scale-105'
                        : 'bg-[#FAF8F5] dark:bg-[#2D2228] border-[#F2E8E4] dark:border-[#3D2F36] text-transparent'
                    }`}
                  >
                    {hasDigit ? (showPinDigits ? digitVal : '•') : ''}
                  </div>
                );
              })}
            </div>

            {/* Error Message */}
            {errorMsg && (
              <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900/50 text-xs font-medium text-rose-600 dark:text-rose-400">
                {errorMsg}
              </div>
            )}

            {/* Keypad */}
            <div className="grid grid-cols-3 gap-2.5 pt-1">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => handleKeyPress(num)}
                  className="h-12 rounded-2xl bg-[#FAF8F5] dark:bg-[#2D2228] border border-[#F2E8E4] dark:border-[#3D2F36] text-base font-bold text-[#2D2327] dark:text-[#FAF4F0] hover:bg-rose-50 dark:hover:bg-[#3D2F36] hover:border-rose-200 active:scale-95 transition-all"
                >
                  {num}
                </button>
              ))}

              <button
                type="button"
                onClick={handleClear}
                className="h-12 rounded-2xl bg-[#FAF8F5] dark:bg-[#2D2228] border border-[#F2E8E4] dark:border-[#3D2F36] text-xs font-semibold text-[#7D6F74] dark:text-[#B8A8AF] hover:text-[#2D2327] dark:hover:text-white transition-all"
              >
                Limpar
              </button>

              <button
                type="button"
                onClick={() => handleKeyPress('0')}
                className="h-12 rounded-2xl bg-[#FAF8F5] dark:bg-[#2D2228] border border-[#F2E8E4] dark:border-[#3D2F36] text-base font-bold text-[#2D2327] dark:text-[#FAF4F0] hover:bg-rose-50 dark:hover:bg-[#3D2F36] hover:border-rose-200 active:scale-95 transition-all"
              >
                0
              </button>

              <button
                type="button"
                onClick={handleBackspace}
                className="h-12 rounded-2xl bg-[#FAF8F5] dark:bg-[#2D2228] border border-[#F2E8E4] dark:border-[#3D2F36] text-xs font-semibold text-[#7D6F74] dark:text-[#B8A8AF] hover:text-[#2D2327] dark:hover:text-white transition-all flex items-center justify-center"
                title="Apagar último número"
              >
                ⌫
              </button>
            </div>

            {/* Remember on this device checkbox */}
            <div className="pt-2 flex items-center justify-center gap-2">
              <label className="flex items-center gap-2 text-[11px] text-[#7D6F74] dark:text-[#B8A8AF] cursor-pointer hover:text-[#2D2327] dark:hover:text-[#FAF4F0] transition-colors">
                <input
                  type="checkbox"
                  checked={rememberDevice}
                  onChange={(e) => setRememberDevice(e.target.checked)}
                  className="w-3.5 h-3.5 rounded text-[#E07A8B] focus:ring-[#E07A8B]"
                />
                <span>Lembrar meu acesso neste aparelho</span>
              </label>
            </div>
          </div>

          {/* Master Passcode Recovery Button */}
          <div className="pt-1 flex flex-col items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setShowMasterModal(true);
                setMasterInput('');
                setMasterError(null);
                setMasterAuthenticated(false);
                setNewPersonalPin('');
                setNewPinSavedSuccess(false);
              }}
              className="inline-flex items-center gap-1.5 text-xs text-[#E07A8B] hover:text-[#c75b6e] font-semibold py-1.5 px-3 rounded-full hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
            >
              <Key className="w-3.5 h-3.5" />
              <span>Esqueceu seu PIN? Entrar com Senha Mestre do Casal</span>
            </button>

            <div className="text-[11px] text-[#A6999F] dark:text-[#8C7C83] flex items-center justify-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-[#E07A8B]" />
              <span>Protegido por senha individual e código do casal</span>
            </div>
          </div>
        </div>
      </div>

      {/* Master Passcode Recovery Modal */}
      {showMasterModal && (
        <div className="fixed inset-0 z-60 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-white dark:bg-[#271E23] rounded-3xl p-6 border border-[#F2E8E4] dark:border-[#3D2F36] shadow-2xl space-y-4 text-center animate-in fade-in zoom-in-95 duration-200 relative">
            <button
              type="button"
              onClick={() => setShowMasterModal(false)}
              className="absolute top-4 right-4 p-1.5 text-[#7D6F74] dark:text-[#B8A8AF] hover:text-[#2D2327] dark:hover:text-white rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              title="Fechar"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-950/70 text-[#E07A8B] flex items-center justify-center mx-auto">
              <Key className="w-6 h-6" />
            </div>

            <div className="space-y-1">
              <h3 className="font-serif text-lg font-bold text-[#2D2327] dark:text-[#FAF4F0]">
                Senha Mestre do Casal 🔐
              </h3>
              <p className="text-xs text-[#7D6F74] dark:text-[#B8A8AF] leading-relaxed">
                Para redefinir seu PIN ou entrar de emergência, digite a senha mestre secreta que apenas vocês duas conhecem:
              </p>
            </div>

            {!masterAuthenticated ? (
              <div className="space-y-3 pt-1">
                <div className="relative">
                  <input
                    type={showMasterDigits ? 'text' : 'password'}
                    maxLength={8}
                    value={masterInput}
                    onChange={(e) => {
                      setMasterInput(e.target.value);
                      setMasterError(null);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleVerifyMasterPasscode();
                    }}
                    placeholder="Digite a senha mestre..."
                    className="w-full px-4 py-3 rounded-xl border border-[#F2E8E4] dark:border-[#3D2F36] bg-[#FAF8F5] dark:bg-[#1F171C] text-[#2D2327] dark:text-[#FAF4F0] font-mono text-center text-base tracking-widest focus:outline-none focus:ring-2 focus:ring-[#E07A8B]"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setShowMasterDigits(!showMasterDigits)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7D6F74] dark:text-[#B8A8AF] hover:text-[#2D2327] dark:hover:text-white p-1"
                    title={showMasterDigits ? 'Ocultar' : 'Ver'}
                  >
                    {showMasterDigits ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {masterError && (
                  <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 text-xs font-medium text-rose-600 dark:text-rose-400">
                    {masterError}
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleVerifyMasterPasscode}
                  className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-[#E07A8B] to-[#D4A373] text-white font-semibold text-sm shadow-md hover:brightness-105 active:scale-98 transition-all flex items-center justify-center gap-2"
                >
                  <Unlock className="w-4 h-4" />
                  <span>Verificar Senha Mestre</span>
                </button>
              </div>
            ) : (
              <div className="space-y-4 pt-1">
                <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-900/60 text-xs text-emerald-700 dark:text-emerald-300 flex items-center justify-center gap-2 font-medium">
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>Senha mestre confirmada com sucesso!</span>
                </div>

                {newPinSavedSuccess ? (
                  <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 text-xs font-semibold text-[#E07A8B] flex items-center justify-center gap-2">
                    <Sparkles className="w-4 h-4" />
                    <span>Novo PIN salvo com sucesso! Entrando...</span>
                  </div>
                ) : (
                  <div className="space-y-3 text-left">
                    <label className="block text-xs font-semibold text-[#2D2327] dark:text-[#FAF4F0]">
                      Definir novo PIN pessoal para {activePartnerInfo.nickname || activePartnerInfo.name}:
                    </label>
                    <input
                      type="text"
                      pattern="[0-9]*"
                      maxLength={6}
                      value={newPersonalPin}
                      onChange={(e) => {
                        setNewPersonalPin(e.target.value.replace(/\D/g, ''));
                        setMasterError(null);
                      }}
                      placeholder="Ex: 2604"
                      className="w-full px-4 py-2.5 rounded-xl border border-[#F2E8E4] dark:border-[#3D2F36] bg-[#FAF8F5] dark:bg-[#1F171C] text-[#2D2327] dark:text-[#FAF4F0] font-mono text-center text-sm tracking-widest focus:outline-none focus:ring-2 focus:ring-[#E07A8B]"
                    />

                    {masterError && (
                      <p className="text-xs text-rose-500 font-medium">{masterError}</p>
                    )}

                    <div className="space-y-2 pt-1">
                      {newPersonalPin.length >= 4 && (
                        <button
                          type="button"
                          onClick={handleSaveNewPinAndUnlock}
                          className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#E07A8B] to-[#D4A373] text-white font-semibold text-xs shadow-md hover:brightness-105 active:scale-98 transition-all flex items-center justify-center gap-1.5"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Salvar Novo PIN e Entrar</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={handleDirectMasterUnlock}
                        className="w-full py-2.5 px-4 rounded-xl bg-[#FAF8F5] dark:bg-[#1E171B] border border-[#F2E8E4] dark:border-[#3D2F36] text-xs font-semibold text-[#2D2327] dark:text-[#FAF4F0] hover:border-[#E07A8B] transition-colors flex items-center justify-center gap-1.5"
                      >
                        <Unlock className="w-3.5 h-3.5 text-[#E07A8B]" />
                        <span>Entrar Agora no Nosso Canto</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
