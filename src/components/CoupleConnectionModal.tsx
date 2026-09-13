import React, { useState } from 'react';
import {
  Heart,
  Smartphone,
  Copy,
  Check,
  Share2,
  X,
  MessageCircle,
  ExternalLink,
  ShieldCheck,
  Users,
} from 'lucide-react';
import { PartnerId, Partner } from '../types';
import { PartnerAvatar } from './PartnerAvatar';

interface CoupleConnectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  partner1: Partner;
  partner2: Partner;
  activePartner: PartnerId;
  onSelectPartner: (id: PartnerId) => void;
}

export const CoupleConnectionModal: React.FC<CoupleConnectionModalProps> = ({
  isOpen,
  onClose,
  partner1,
  partner2,
  activePartner,
  onSelectPartner,
}) => {
  const [copiedLink, setCopiedLink] = useState<'partner1' | 'partner2' | null>(null);

  if (!isOpen) return null;

  const currentUrl = typeof window !== 'undefined' ? window.location.origin + window.location.pathname : '';
  const linkForPartner1 = `${currentUrl}?partner=partner1`;
  const linkForPartner2 = `${currentUrl}?partner=partner2`;

  const handleCopyLink = async (partner: 'partner1' | 'partner2', link: string) => {
    try {
      await navigator.clipboard.writeText(link);
      setCopiedLink(partner);
      setTimeout(() => setCopiedLink(null), 2500);
    } catch {
      prompt('Copie o link abaixo para enviar:', link);
    }
  };

  const handleWhatsAppShare = (targetPartner: 'partner1' | 'partner2') => {
    const targetName = targetPartner === 'partner1' ? partner1.name : partner2.name;
    const senderName = targetPartner === 'partner1' ? partner2.name : partner1.name;
    const link = targetPartner === 'partner1' ? linkForPartner1 : linkForPartner2;

    const message = encodeURIComponent(
      `Oi meu amor ${targetName}! 💕 Aqui está o link de acesso direto do nosso aplicativo de casal. Quando você clicar, ele já abre logado no seu perfil!\n\n${link}`
    );

    window.open(`https://api.whatsapp.com/send?text=${message}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-[#241C21] rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto border border-[#F2E8E4] dark:border-[#3D2F36] shadow-2xl p-6 space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-[#F2E8E4] dark:border-[#3D2F36]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#E07A8B] to-[#F4A6B3] flex items-center justify-center text-white shadow-sm">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-lg text-[#2D2327] dark:text-[#FAF4F0]">
                Acesso & Conexão do Casal
              </h3>
              <p className="text-xs text-[#7D6F74] dark:text-[#B8A8AF]">
                Como funciona a mesma conta com cada uma no seu celular
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-full text-[#7D6F74] hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Real-time shared explanation */}
        <div className="p-4 rounded-2xl bg-[#FAF3EC] dark:bg-[#2E2229] border border-rose-200/60 dark:border-rose-900/40 space-y-2">
          <div className="flex items-center gap-2 text-[#E07A8B] font-semibold text-xs">
            <ShieldCheck className="w-4 h-4" />
            <span>Mesma conta sincronizada em tempo real!</span>
          </div>
          <p className="text-xs text-[#7D6F74] dark:text-[#D1C2C9] leading-relaxed">
            Vocês duas compartilham exatamente os mesmos filmes, receitas, lista de mercado, despesas e agenda. Quando uma adicionar ou marcar algo no celular dela, aparece instantaneamente no celular da outra.
          </p>
        </div>

        {/* Device Identity Selection */}
        <div className="space-y-2.5">
          <label className="block text-xs font-bold uppercase tracking-wider text-[#7D6F74] dark:text-[#B8A8AF]">
            Quem está usando este celular agora?
          </label>
          <div className="grid grid-cols-2 gap-3">
            {/* Partner 1 Card */}
            <button
              type="button"
              onClick={() => onSelectPartner('partner1')}
              className={`p-3.5 rounded-2xl border text-left transition-all relative ${
                activePartner === 'partner1'
                  ? 'border-[#E07A8B] bg-rose-50/50 dark:bg-rose-950/40 ring-2 ring-[#E07A8B]/30'
                  : 'border-[#F2E8E4] dark:border-[#3D2F36] hover:bg-[#FAF8F5] dark:hover:bg-[#2D2228]'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <PartnerAvatar avatar={partner1.avatar} name={partner1.name} size="md" />
                {activePartner === 'partner1' && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#E07A8B] text-white">
                    Ativa aqui
                  </span>
                )}
              </div>
              <strong className="block text-sm font-semibold text-[#2D2327] dark:text-[#FAF4F0]">
                {partner1.name}
              </strong>
              <span className="text-[11px] text-[#7D6F74] dark:text-[#B8A8AF]">
                {partner1.nickname || 'Parceira 1'}
              </span>
            </button>

            {/* Partner 2 Card */}
            <button
              type="button"
              onClick={() => onSelectPartner('partner2')}
              className={`p-3.5 rounded-2xl border text-left transition-all relative ${
                activePartner === 'partner2'
                  ? 'border-[#E07A8B] bg-rose-50/50 dark:bg-rose-950/40 ring-2 ring-[#E07A8B]/30'
                  : 'border-[#F2E8E4] dark:border-[#3D2F36] hover:bg-[#FAF8F5] dark:hover:bg-[#2D2228]'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <PartnerAvatar avatar={partner2.avatar} name={partner2.name} size="md" />
                {activePartner === 'partner2' && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#E07A8B] text-white">
                    Ativa aqui
                  </span>
                )}
              </div>
              <strong className="block text-sm font-semibold text-[#2D2327] dark:text-[#FAF4F0]">
                {partner2.name}
              </strong>
              <span className="text-[11px] text-[#7D6F74] dark:text-[#B8A8AF]">
                {partner2.nickname || 'Parceira 2'}
              </span>
            </button>
          </div>
          <p className="text-[11px] text-[#7D6F74] dark:text-[#B8A8AF]">
            O app salva a sua escolha automaticamente na memória do aparelho.
          </p>
        </div>

        {/* Share with partner section */}
        <div className="space-y-3 pt-2 border-t border-[#F2E8E4] dark:border-[#3D2F36]">
          <h4 className="text-xs font-bold uppercase tracking-wider text-[#7D6F74] dark:text-[#B8A8AF] flex items-center gap-1.5">
            <Share2 className="w-3.5 h-3.5 text-[#E07A8B]" />
            <span>Enviar Acesso Direto para a sua Namorada</span>
          </h4>
          <p className="text-xs text-[#7D6F74] dark:text-[#B8A8AF]">
            Envie o link especial dela. Quando ela clicar no WhatsApp, o aplicativo já abrirá logado diretamente com o nome e perfil dela!
          </p>

          <div className="space-y-2">
            {/* Box for Partner 2 (Cassiane) */}
            <div className="p-3 rounded-2xl bg-[#FAF8F5] dark:bg-[#2D2228] border border-[#F2E8E4] dark:border-[#3D2F36] flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <div className="flex items-center gap-2">
                <PartnerAvatar avatar={partner2.avatar} name={partner2.name} size="sm" />
                <div>
                  <span className="text-xs font-semibold text-[#2D2327] dark:text-[#FAF4F0] block">
                    Link para {partner2.name}
                  </span>
                  <span className="text-[11px] text-[#7D6F74] dark:text-[#B8A8AF]">
                    Já abre identificado como {partner2.name}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1.5 self-end sm:self-auto">
                <button
                  type="button"
                  onClick={() => handleCopyLink('partner2', linkForPartner2)}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white dark:bg-[#382B32] border border-[#F2E8E4] dark:border-[#4D3A44] hover:bg-[#FAF3EC] text-xs font-medium text-[#2D2327] dark:text-[#FAF4F0]"
                >
                  {copiedLink === 'partner2' ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                      <span className="text-emerald-600 dark:text-emerald-400">Copiado!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copiar Link</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => handleWhatsAppShare('partner2')}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium shadow-2xs"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>WhatsApp</span>
                </button>
              </div>
            </div>

            {/* Box for Partner 1 (Camilla) */}
            <div className="p-3 rounded-2xl bg-[#FAF8F5] dark:bg-[#2D2228] border border-[#F2E8E4] dark:border-[#3D2F36] flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <div className="flex items-center gap-2">
                <PartnerAvatar avatar={partner1.avatar} name={partner1.name} size="sm" />
                <div>
                  <span className="text-xs font-semibold text-[#2D2327] dark:text-[#FAF4F0] block">
                    Link para {partner1.name}
                  </span>
                  <span className="text-[11px] text-[#7D6F74] dark:text-[#B8A8AF]">
                    Já abre identificado como {partner1.name}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1.5 self-end sm:self-auto">
                <button
                  type="button"
                  onClick={() => handleCopyLink('partner1', linkForPartner1)}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white dark:bg-[#382B32] border border-[#F2E8E4] dark:border-[#4D3A44] hover:bg-[#FAF3EC] text-xs font-medium text-[#2D2327] dark:text-[#FAF4F0]"
                >
                  {copiedLink === 'partner1' ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                      <span className="text-emerald-600 dark:text-emerald-400">Copiado!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copiar Link</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => handleWhatsAppShare('partner1')}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium shadow-2xs"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>WhatsApp</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Tip: Add to Home Screen like a real phone App */}
        <div className="p-4 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-900/40 space-y-2 text-xs">
          <div className="font-semibold text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
            <span>💡 Dica de Ouro: Como usar como Aplicativo no Celular</span>
          </div>
          <ul className="space-y-1 text-amber-900/80 dark:text-amber-200/80 list-disc list-inside">
            <li>
              <strong>No iPhone (Safari):</strong> Toque no ícone de <em>Compartilhar</em> (quadradinho com seta para cima) e selecione <strong>"Adicionar à Tela de Início"</strong>.
            </li>
            <li>
              <strong>No Android (Chrome):</strong> Toque nos <em>3 pontinhos</em> no topo do navegador e selecione <strong>"Instalar aplicativo"</strong> ou <strong>"Adicionar à tela inicial"</strong>.
            </li>
          </ul>
          <p className="text-[11px] text-amber-700 dark:text-amber-400">
            Fica em tela cheia com o ícone do casal no celular de vocês duas, exatamente como um app da App Store!
          </p>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-[#E07A8B] to-[#E58C9B] hover:opacity-95 text-white font-medium text-xs sm:text-sm shadow-xs"
          >
            Entendido, tudo pronto! 💕
          </button>
        </div>
      </div>
    </div>
  );
};
