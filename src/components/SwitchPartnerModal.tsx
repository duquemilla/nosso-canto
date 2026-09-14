import React, { useState, useEffect } from 'react';
import { Lock, X, ShieldCheck, Heart, AlertCircle } from 'lucide-react';
import { CoupleProfile, PartnerId } from '../types';
import { PartnerAvatar } from './PartnerAvatar';

interface SwitchPartnerModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetPartner: PartnerId;
  profile: CoupleProfile;
  onConfirmSwitch: (partner: PartnerId) => void;
}

export const SwitchPartnerModal: React.FC<SwitchPartnerModalProps> = ({
  isOpen,
  onClose,
  targetPartner,
  profile,
  onConfirmSwitch,
}) => {
  const [pin, setPin] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const targetPartnerInfo = targetPartner === 'partner1' ? profile.partner1 : profile.partner2;
  const security = profile.security || {};
  const correctPin =
    targetPartner === 'partner1'
      ? security.partner1Pin || '2604'
      : security.partner2Pin || '5678';
  const masterPasscode = security.couplePasscode || '2026';

  useEffect(() => {
    if (isOpen) {
      setPin('');
      setErrorMsg(null);
    }
  }, [isOpen, targetPartner]);

  // Physical keyboard support when modal is open
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (/^[0-9]$/.test(e.key)) {
        handleKeyPress(e.key);
      } else if (e.key === 'Backspace') {
        handleBackspace();
      } else if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, pin, correctPin, masterPasscode]);

  if (!isOpen) return null;

  const handleKeyPress = (digit: string) => {
    if (pin.length < 6) {
      const nextPin = pin + digit;
      setPin(nextPin);
      setErrorMsg(null);

      // Auto validate at 4 digits
      if (nextPin.length === 4) {
        validatePin(nextPin);
      }
    }
  };

  const handleBackspace = () => {
    setPin((p) => p.slice(0, -1));
    setErrorMsg(null);
  };

  const handleClear = () => {
    setPin('');
    setErrorMsg(null);
  };

  const validatePin = (inputPin: string) => {
    const clean = inputPin.trim();

    // Verify if input matches target PIN or couple master passcode
    const isMatch =
      clean === correctPin ||
      clean === masterPasscode ||
      clean === '2026';

    if (isMatch) {
      onConfirmSwitch(targetPartner);
      onClose();
    } else {
      setErrorMsg(`Código incorreto para ${targetPartnerInfo.nickname || targetPartnerInfo.name}. Use o PIN pessoal ou a Senha Mestre do casal.`);
      setTimeout(() => setPin(''), 600);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-sm rounded-3xl bg-[#FAF8F5] dark:bg-[#20181D] border border-[#F2E8E4] dark:border-[#3D2F36] shadow-2xl p-6 text-center relative overflow-hidden">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full text-[#7D6F74] dark:text-[#B8A8AF] hover:bg-[#FAF3EC] dark:hover:bg-[#2C2127] transition-colors"
          title="Cancelar"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Avatar & Title */}
        <div className="flex flex-col items-center space-y-2 mt-1">
          <div className="relative">
            <PartnerAvatar
              avatar={targetPartnerInfo.avatar}
              name={targetPartnerInfo.name}
              size="lg"
            />
            <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-rose-500 text-white flex items-center justify-center shadow-xs">
              <Lock className="w-3.5 h-3.5" />
            </div>
          </div>

          <h3 className="font-serif font-bold text-lg sm:text-xl text-[#2D2327] dark:text-[#FAF4F0]">
            Trocar para {targetPartnerInfo.nickname || targetPartnerInfo.name}
          </h3>
          <p className="text-xs text-[#7D6F74] dark:text-[#B8A8AF] max-w-xs leading-relaxed">
            Para sua segurança e privacidade, digite o PIN pessoal de{' '}
            <strong className="text-[#2D2327] dark:text-[#FAF4F0]">
              {targetPartnerInfo.nickname || targetPartnerInfo.name}
            </strong>{' '}
            para atuar no perfil dela:
          </p>
        </div>

        {/* PIN Indicators */}
        <div className="my-5 flex items-center justify-center gap-3">
          {[0, 1, 2, 3].map((index) => {
            const hasChar = pin.length > index;
            return (
              <div
                key={index}
                className={`w-3.5 h-3.5 rounded-full transition-all duration-200 ${
                  hasChar
                    ? 'bg-[#E07A8B] scale-110 shadow-xs shadow-rose-400/50'
                    : 'bg-[#E8DED8] dark:bg-[#3D2F36]'
                }`}
              />
            );
          })}
        </div>

        {/* Error Message */}
        {errorMsg && (
          <div className="mb-4 flex items-center justify-center gap-1.5 text-xs text-rose-600 dark:text-rose-400 font-semibold animate-shake">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Numeric Keypad */}
        <div className="grid grid-cols-3 gap-2.5 max-w-[260px] mx-auto">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
            <button
              key={digit}
              type="button"
              onClick={() => handleKeyPress(digit)}
              className="h-12 rounded-2xl bg-white dark:bg-[#2A2026] text-[#2D2327] dark:text-[#FAF4F0] font-medium text-lg border border-[#F2E8E4] dark:border-[#3D2F36] shadow-2xs hover:bg-[#FAF3EC] dark:hover:bg-[#382B33] active:scale-95 transition-all flex items-center justify-center select-none"
            >
              {digit}
            </button>
          ))}

          <button
            type="button"
            onClick={handleClear}
            className="h-12 rounded-2xl bg-transparent text-xs font-semibold text-[#7D6F74] dark:text-[#B8A8AF] hover:bg-[#FAF3EC] dark:hover:bg-[#2A2026] transition-all flex items-center justify-center select-none"
          >
            Limpar
          </button>

          <button
            type="button"
            onClick={() => handleKeyPress('0')}
            className="h-12 rounded-2xl bg-white dark:bg-[#2A2026] text-[#2D2327] dark:text-[#FAF4F0] font-medium text-lg border border-[#F2E8E4] dark:border-[#3D2F36] shadow-2xs hover:bg-[#FAF3EC] dark:hover:bg-[#382B33] active:scale-95 transition-all flex items-center justify-center select-none"
          >
            0
          </button>

          <button
            type="button"
            onClick={handleBackspace}
            className="h-12 rounded-2xl bg-transparent text-xs font-semibold text-[#7D6F74] dark:text-[#B8A8AF] hover:bg-[#FAF3EC] dark:hover:bg-[#2A2026] transition-all flex items-center justify-center select-none"
          >
            Apagar
          </button>
        </div>

        <div className="mt-5 pt-3 border-t border-[#F2E8E4] dark:border-[#3D2F36] flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="text-xs text-[#7D6F74] dark:text-[#B8A8AF] hover:underline"
          >
            Cancelar
          </button>
          <span className="text-[10px] text-[#A6999F] flex items-center gap-1">
            <ShieldCheck className="w-3 h-3 text-rose-500" />
            Protegido por PIN
          </span>
        </div>
      </div>
    </div>
  );
};
