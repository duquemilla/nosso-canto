import React, { useState } from 'react';
import { Heart, Lock, KeyRound, CheckCircle2, ShieldCheck, Sparkles, Sun, Moon } from 'lucide-react';
import { CoupleProfile, PartnerId } from '../types';
import { PartnerAvatar } from './PartnerAvatar';

interface LockScreenProps {
  profile: CoupleProfile;
  activePartner: PartnerId;
  onUnlock: (partner: PartnerId, rememberDevice: boolean) => void;
  darkMode?: boolean;
  onToggleDarkMode?: () => void;
}

export const LockScreen: React.FC<LockScreenProps> = ({
  profile,
  activePartner: initialPartner,
  onUnlock,
  darkMode,
  onToggleDarkMode,
}) => {
  const [selectedPartner, setSelectedPartner] = useState<PartnerId>(initialPartner || 'partner1');
  const [pin, setPin] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [rememberDevice, setRememberDevice] = useState<boolean>(true);
  const [useCoupleCode, setUseCoupleCode] = useState<boolean>(false);

  const security = profile.security || {};
  const partner1Pin = security.partner1Pin || '1234';
  const partner2Pin = security.partner2Pin || '5678';
  const couplePasscode = security.couplePasscode || '2026';

  const partner1 = profile.partner1;
  const partner2 = profile.partner2;

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
    setPin(pin.slice(0, -1));
    setErrorMsg(null);
  };

  const handleClear = () => {
    setPin('');
    setErrorMsg(null);
  };

  const validatePin = (inputPin: string, partner: PartnerId) => {
    const targetPin = partner === 'partner1' ? partner1Pin : partner2Pin;

    // Check personal PIN or Couple master code
    if (inputPin === targetPin || inputPin === couplePasscode) {
      onUnlock(partner, rememberDevice);
    } else {
      setErrorMsg('Código incorreto. Tente novamente.');
      setTimeout(() => setPin(''), 600);
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    validatePin(pin, selectedPartner);
  };

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

      {/* Decorative background glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-rose-200/30 dark:bg-rose-900/15 rounded-full blur-3xl pointer-events-none" />

      <div className="min-h-full flex flex-col items-center justify-center">
        <div className="w-full max-w-sm relative z-10 space-y-5 text-center my-auto py-2">
          {/* App Logo & Lock Status */}
          <div className="space-y-2">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-3xl bg-gradient-to-tr from-[#E07A8B] to-[#F4A6B3] text-white shadow-lg shadow-rose-300/40 dark:shadow-none mb-1">
              <Lock className="w-7 h-7" />
            </div>
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#2D2327] dark:text-[#FAF4F0]">
              Nosso Canto
            </h1>
            <p className="text-xs text-[#7D6F74] dark:text-[#B8A8AF]">
              Espaço privado de {partner1.name} & {partner2.name} 💕
            </p>
          </div>

        {/* Profile Selector */}
        <div className="space-y-2">
          <p className="text-xs font-semibold text-[#2D2327] dark:text-[#FAF4F0]">
            Quem está acessando este aparelho?
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
                {selectedPartner === 'partner1' ? '● Selecionada' : 'Entrar'}
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
                {selectedPartner === 'partner2' ? '● Selecionada' : 'Entrar'}
              </span>
            </button>
          </div>
        </div>

        {/* PIN Display Dots */}
        <div className="space-y-3 bg-white/80 dark:bg-[#241C21]/80 backdrop-blur-md p-5 rounded-3xl border border-[#F2E8E4] dark:border-[#3D2F36] shadow-sm">
          <div className="flex items-center justify-center gap-1.5 text-xs text-[#7D6F74] dark:text-[#B8A8AF]">
            <KeyRound className="w-3.5 h-3.5 text-[#E07A8B]" />
            <span>Digite o PIN de 4 dígitos de {selectedPartner === 'partner1' ? partner1.nickname : partner2.nickname}:</span>
          </div>

          {/* Dots Indicator */}
          <div className="flex items-center justify-center gap-3 py-2">
            {[0, 1, 2, 3].map((idx) => (
              <div
                key={idx}
                className={`w-3.5 h-3.5 rounded-full transition-all duration-200 ${
                  pin.length > idx
                    ? 'bg-[#E07A8B] scale-110 shadow-sm shadow-rose-300'
                    : 'bg-[#F2E8E4] dark:bg-[#3D2F36]'
                }`}
              />
            ))}
          </div>

          {/* Error Message */}
          {errorMsg && (
            <p className="text-xs font-semibold text-rose-500 animate-shake">
              {errorMsg}
            </p>
          )}

          {/* Keypad */}
          <div className="grid grid-cols-3 gap-2.5 pt-2">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
              <button
                key={num}
                type="button"
                onClick={() => handleKeyPress(num)}
                className="h-12 rounded-2xl bg-[#FAF8F5] dark:bg-[#2D2228] border border-[#F2E8E4] dark:border-[#3D2F36] text-base font-bold text-[#2D2327] dark:text-[#FAF4F0] hover:bg-[#F2E8E4] dark:hover:bg-[#3D2F36] active:scale-95 transition-all"
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
              className="h-12 rounded-2xl bg-[#FAF8F5] dark:bg-[#2D2228] border border-[#F2E8E4] dark:border-[#3D2F36] text-base font-bold text-[#2D2327] dark:text-[#FAF4F0] hover:bg-[#F2E8E4] dark:hover:bg-[#3D2F36] active:scale-95 transition-all"
            >
              0
            </button>

            <button
              type="button"
              onClick={handleBackspace}
              className="h-12 rounded-2xl bg-[#FAF8F5] dark:bg-[#2D2228] border border-[#F2E8E4] dark:border-[#3D2F36] text-xs font-semibold text-[#7D6F74] dark:text-[#B8A8AF] hover:text-[#2D2327] dark:hover:text-white transition-all flex items-center justify-center"
              title="Apagar"
            >
              ⌫
            </button>
          </div>

          {/* Remember on this device checkbox */}
          <div className="pt-2 flex items-center justify-center gap-2">
            <label className="flex items-center gap-2 text-[11px] text-[#7D6F74] dark:text-[#B8A8AF] cursor-pointer">
              <input
                type="checkbox"
                checked={rememberDevice}
                onChange={(e) => setRememberDevice(e.target.checked)}
                className="w-3.5 h-3.5 rounded text-[#E07A8B] focus:ring-[#E07A8B]"
              />
              <span>Lembrar meu login neste celular</span>
            </label>
          </div>
        </div>

          {/* Discreet Security Note */}
          <div className="text-[11px] text-[#A6999F] dark:text-[#8C7C83] flex items-center justify-center gap-1.5 pt-2">
            <ShieldCheck className="w-3.5 h-3.5 text-[#E07A8B]" />
            <span>Espaço protegido por senha individual</span>
          </div>
        </div>
      </div>
    </div>
  );
};
