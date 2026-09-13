import React, { useState } from 'react';
import {
  Lightbulb,
  Plus,
  Search,
  Heart,
  Trash2,
  Edit3,
  ExternalLink,
  Sparkles,
  Droplets,
  Leaf,
  Shirt,
  Package,
  Wrench,
  Zap,
  X,
  Bot,
  RefreshCw,
  Settings2,
  Check,
} from 'lucide-react';
import {
  HomeTipItem,
  HomeTipCategory,
  HomeRoom,
  CoupleProfile,
  PartnerId,
} from '../types';
import { PartnerAvatar } from './PartnerAvatar';

interface HomeTipsViewProps {
  tips: HomeTipItem[];
  profile: CoupleProfile;
  activePartner: PartnerId;
  onAddTip: (tip: Omit<HomeTipItem, 'id' | 'createdAt'>) => void;
  onUpdateTip: (tip: HomeTipItem) => void;
  onDeleteTip: (id: string) => void;
  onToggleFavorite: (id: string) => void;
  isAddModalOpen: boolean;
  setIsAddModalOpen: (open: boolean) => void;
}

const DEFAULT_CATEGORIES: { id: HomeTipCategory; label: string; icon: any; color: string; badgeBg: string }[] = [
  {
    id: 'limpeza',
    label: 'Limpeza & Truques',
    icon: Droplets,
    color: 'text-sky-500 dark:text-sky-400',
    badgeBg: 'bg-sky-50 dark:bg-sky-950/40 border-sky-200 dark:border-sky-800/40 text-sky-700 dark:text-sky-300',
  },
  {
    id: 'plantas',
    label: 'Plantas & Horta',
    icon: Leaf,
    color: 'text-emerald-500 dark:text-emerald-400',
    badgeBg: 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/40 text-emerald-700 dark:text-emerald-300',
  },
  {
    id: 'lavanderia',
    label: 'Lavanderia & Roupas',
    icon: Shirt,
    color: 'text-indigo-500 dark:text-indigo-400',
    badgeBg: 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-800/40 text-indigo-700 dark:text-indigo-300',
  },
  {
    id: 'organizacao',
    label: 'Organização & Despensa',
    icon: Package,
    color: 'text-amber-500 dark:text-amber-400',
    badgeBg: 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800/40 text-amber-700 dark:text-amber-300',
  },
  {
    id: 'manutencao',
    label: 'Manutenção & Reparos',
    icon: Wrench,
    color: 'text-slate-500 dark:text-slate-400',
    badgeBg: 'bg-slate-50 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800/40 text-slate-700 dark:text-slate-300',
  },
  {
    id: 'economia',
    label: 'Economia & Contas',
    icon: Zap,
    color: 'text-teal-500 dark:text-teal-400',
    badgeBg: 'bg-teal-50 dark:bg-teal-950/40 border-teal-200 dark:border-teal-800/40 text-teal-700 dark:text-teal-300',
  },
  {
    id: 'outros',
    label: 'Outros Cuidados',
    icon: Sparkles,
    color: 'text-rose-500 dark:text-rose-400',
    badgeBg: 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800/40 text-rose-700 dark:text-rose-300',
  },
];

const ROOM_OPTIONS: HomeRoom[] = [
  'Sala',
  'Quarto',
  'Cozinha',
  'Banheiro',
  'Varanda',
  'Escritório',
  'Lavanderia',
  'Casa Toda',
];

export const HomeTipsView: React.FC<HomeTipsViewProps> = ({
  tips,
  profile,
  activePartner,
  onAddTip,
  onUpdateTip,
  onDeleteTip,
  onToggleFavorite,
  isAddModalOpen,
  setIsAddModalOpen,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('todas');
  const [onlyFavorites, setOnlyFavorites] = useState(false);
  const [selectedAuthor, setSelectedAuthor] = useState<'all' | 'partner1' | 'partner2'>('all');

  // Custom/Editable Categories
  const [categoryLabels, setCategoryLabels] = useState<Record<string, string>>(() => {
    try {
      const saved = localStorage.getItem('nos_dois_tip_category_labels');
      if (saved) return JSON.parse(saved);
    } catch {}
    const initial: Record<string, string> = {};
    DEFAULT_CATEGORIES.forEach((cat) => {
      initial[cat.id] = cat.label;
    });
    return initial;
  });

  const [isManagingCategories, setIsManagingCategories] = useState(false);
  const [editingCategoryKey, setEditingCategoryKey] = useState<string | null>(null);
  const [editingCategoryLabel, setEditingCategoryLabel] = useState('');

  const handleSaveCategoryLabel = (key: string) => {
    if (!editingCategoryLabel.trim()) return;
    const updated = { ...categoryLabels, [key]: editingCategoryLabel.trim() };
    setCategoryLabels(updated);
    try {
      localStorage.setItem('nos_dois_tip_category_labels', JSON.stringify(updated));
    } catch {}
    setEditingCategoryKey(null);
  };

  // AI Tip Generator States
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [aiQuestion, setAiQuestion] = useState('');
  const [aiRoom, setAiRoom] = useState('Casa Toda');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiError, setAiError] = useState('');
  const [aiResult, setAiResult] = useState<{
    title: string;
    category: HomeTipCategory;
    room: string;
    description: string;
    goldenTip: string;
  } | null>(null);

  // Edit modal state
  const [editingTip, setEditingTip] = useState<HomeTipItem | null>(null);

  // Form states
  const [formTitle, setFormTitle] = useState('');
  const [formCategory, setFormCategory] = useState<HomeTipCategory>('limpeza');
  const [formRoom, setFormRoom] = useState<string>('Casa Toda');
  const [formDescription, setFormDescription] = useState('');
  const [formGoldenTip, setFormGoldenTip] = useState('');
  const [formLink, setFormLink] = useState('');
  const [formAuthor, setFormAuthor] = useState<PartnerId>(activePartner);

  // Open modal for new tip
  const handleOpenAdd = () => {
    setEditingTip(null);
    setFormTitle('');
    setFormCategory('limpeza');
    setFormRoom('Casa Toda');
    setFormDescription('');
    setFormGoldenTip('');
    setFormLink('');
    setFormAuthor(activePartner);
    setIsAddModalOpen(true);
  };

  // Open modal for editing
  const handleOpenEdit = (tip: HomeTipItem) => {
    setEditingTip(tip);
    setFormTitle(tip.title);
    setFormCategory(tip.category);
    setFormRoom(tip.room || 'Casa Toda');
    setFormDescription(tip.description);
    setFormGoldenTip(tip.goldenTip || '');
    setFormLink(tip.link || '');
    setFormAuthor(tip.addedBy);
    setIsAddModalOpen(true);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || !formDescription.trim()) return;

    if (editingTip) {
      onUpdateTip({
        ...editingTip,
        title: formTitle.trim(),
        category: formCategory,
        room: formRoom,
        description: formDescription.trim(),
        goldenTip: formGoldenTip.trim() || undefined,
        link: formLink.trim() || undefined,
        addedBy: formAuthor,
      });
    } else {
      onAddTip({
        title: formTitle.trim(),
        category: formCategory,
        room: formRoom,
        description: formDescription.trim(),
        goldenTip: formGoldenTip.trim() || undefined,
        link: formLink.trim() || undefined,
        addedBy: formAuthor,
        isFavorite: false,
      });
    }

    setIsAddModalOpen(false);
    setEditingTip(null);
  };

  // Ask AI for Home Tip
  const handleAskAi = async (customPrompt?: string) => {
    const questionToAsk = customPrompt || aiQuestion;
    if (!questionToAsk.trim()) return;

    setIsAiLoading(true);
    setAiError('');
    setAiResult(null);

    try {
      const res = await fetch('/api/ai/home-tip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: questionToAsk.trim(),
          room: aiRoom,
        }),
      });

      if (!res.ok) {
        throw new Error('Falha ao gerar dica com Inteligência Artificial.');
      }

      const data = await res.json();
      setAiResult(data);
    } catch (err: any) {
      setAiError(err.message || 'Erro ao conectar à IA.');
    } finally {
      setIsAiLoading(false);
    }
  };

  // Save AI result as a permanent couple tip
  const handleSaveAiResult = () => {
    if (!aiResult) return;
    onAddTip({
      title: aiResult.title,
      category: aiResult.category || 'limpeza',
      room: aiResult.room || aiRoom || 'Casa Toda',
      description: aiResult.description,
      goldenTip: aiResult.goldenTip,
      addedBy: activePartner,
      isFavorite: true,
    });
    setIsAiModalOpen(false);
    setAiResult(null);
    setAiQuestion('');
  };

  // Filter tips
  const filteredTips = tips.filter((tip) => {
    const matchesSearch =
      tip.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tip.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (tip.goldenTip && tip.goldenTip.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (tip.room && tip.room.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCategory = selectedCategory === 'todas' || tip.category === selectedCategory;
    const matchesFavorite = !onlyFavorites || tip.isFavorite;
    const matchesAuthor = selectedAuthor === 'all' || tip.addedBy === selectedAuthor;

    return matchesSearch && matchesCategory && matchesFavorite && matchesAuthor;
  });

  const getCategoryMeta = (cat: HomeTipCategory) => {
    const found = DEFAULT_CATEGORIES.find((c) => c.id === cat) || DEFAULT_CATEGORIES[6];
    return {
      ...found,
      label: categoryLabels[cat] || found.label,
    };
  };

  return (
    <div className="space-y-5">
      {/* AI Assistance Banner */}
      <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-rose-50/80 via-white to-amber-50/80 dark:from-[#2A1E24] dark:via-[#22191F] dark:to-[#281D1A] border border-[#F2E8E4] dark:border-[#3D2F36] shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="p-2.5 rounded-2xl bg-[#E07A8B] text-white shrink-0 shadow-2xs">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-serif text-sm sm:text-base font-bold text-[#2D2327] dark:text-[#FAF4F0]">
              Dúvida doméstica? Pergunte à nossa IA do Lar ✨
            </h3>
            <p className="text-xs text-[#7D6F74] dark:text-[#B8A8AF]">
              Pergunte como tirar manchas, cuidar de plantas ou truques práticos para o nosso canto.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => {
            setIsAiModalOpen(true);
            setAiError('');
          }}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-[#E07A8B] hover:bg-[#D56B7D] text-white text-xs font-semibold shadow-xs transition-all cursor-pointer whitespace-nowrap"
        >
          <Bot className="w-4 h-4" />
          <span>Perguntar para a IA</span>
        </button>
      </div>

      {/* Search and Filters Bar */}
      <div className="p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-[#241C21] border border-[#F2E8E4] dark:border-[#3D2F36] space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#7D6F74] dark:text-[#B8A8AF] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar truque, cômodo, produto ou dica caseira..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm rounded-xl bg-[#FAF8F5] dark:bg-[#2D2228] border border-[#F2E8E4] dark:border-[#3D2F36] text-[#2D2327] dark:text-[#FAF4F0] placeholder-[#B8A8AF] focus:outline-none focus:ring-1 focus:ring-[#E07A8B]"
            />
          </div>

          {/* Quick Filters */}
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            <button
              onClick={() => setOnlyFavorites(!onlyFavorites)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium border transition-colors cursor-pointer ${
                onlyFavorites
                  ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 text-rose-600 dark:text-rose-300'
                  : 'bg-[#FAF8F5] dark:bg-[#2D2228] border-[#F2E8E4] dark:border-[#3D2F36] text-[#7D6F74] dark:text-[#B8A8AF] hover:text-[#2D2327]'
              }`}
            >
              <Heart className={`w-3.5 h-3.5 ${onlyFavorites ? 'fill-rose-500 text-rose-500' : ''}`} />
              <span>Favoritas ({tips.filter((t) => t.isFavorite).length})</span>
            </button>

            {/* Author filter */}
            <select
              value={selectedAuthor}
              onChange={(e) => setSelectedAuthor(e.target.value as any)}
              className="px-2.5 py-2 text-xs rounded-xl bg-[#FAF8F5] dark:bg-[#2D2228] border border-[#F2E8E4] dark:border-[#3D2F36] text-[#2D2327] dark:text-[#FAF4F0] focus:outline-none focus:ring-1 focus:ring-[#E07A8B]"
            >
              <option value="all">Quem adicionou: Todas</option>
              <option value="partner1">{profile.partner1.nickname || profile.partner1.name}</option>
              <option value="partner2">{profile.partner2.nickname || profile.partner2.name}</option>
            </select>

            {/* Manage categories button */}
            <button
              type="button"
              onClick={() => setIsManagingCategories(true)}
              className="p-2 rounded-xl bg-[#FAF8F5] dark:bg-[#2D2228] border border-[#F2E8E4] dark:border-[#3D2F36] text-[#7D6F74] dark:text-[#B8A8AF] hover:text-[#E07A8B] transition-colors cursor-pointer"
              title="Alterar nomes das categorias"
            >
              <Settings2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-1 pb-0.5">
          <button
            onClick={() => setSelectedCategory('todas')}
            className={`px-3 py-1.5 rounded-full text-xs font-medium shrink-0 transition-all cursor-pointer ${
              selectedCategory === 'todas'
                ? 'bg-[#E07A8B] text-white shadow-xs'
                : 'bg-[#FAF8F5] dark:bg-[#2D2228] text-[#7D6F74] dark:text-[#B8A8AF] hover:text-[#2D2327] dark:hover:text-white border border-[#F2E8E4] dark:border-[#3D2F36]'
            }`}
          >
            Todas ({tips.length})
          </button>

          {DEFAULT_CATEGORIES.map((cat) => {
            const label = categoryLabels[cat.id] || cat.label;
            const count = tips.filter((t) => t.category === cat.id).length;
            const Icon = cat.icon;
            const isSelected = selectedCategory === cat.id;

            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium shrink-0 transition-all border cursor-pointer ${
                  isSelected
                    ? 'bg-[#E07A8B] text-white border-[#E07A8B] shadow-xs'
                    : 'bg-[#FAF8F5] dark:bg-[#2D2228] border-[#F2E8E4] dark:border-[#3D2F36] text-[#7D6F74] dark:text-[#B8A8AF] hover:text-[#2D2327] dark:hover:text-white'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : cat.color}`} />
                <span>{label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    isSelected ? 'bg-white/20 text-white' : 'bg-black/5 dark:bg-white/10 text-[#7D6F74] dark:text-[#B8A8AF]'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tips List / Grid */}
      {filteredTips.length === 0 ? (
        <div className="p-8 sm:p-12 text-center rounded-3xl bg-white dark:bg-[#241C21] border border-[#F2E8E4] dark:border-[#3D2F36] space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-rose-50 dark:bg-rose-950/40 text-[#E07A8B] mx-auto flex items-center justify-center shadow-2xs">
            <Lightbulb className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h3 className="font-serif text-lg font-bold text-[#2D2327] dark:text-[#FAF4F0]">
              Nenhuma dica encontrada
            </h3>
            <p className="text-xs sm:text-sm text-[#7D6F74] dark:text-[#B8A8AF] max-w-md mx-auto">
              {tips.length === 0
                ? 'Seu espaço de dicas está limpo e pronto para vocês! Cadastrem suas receitas caseiras de limpeza, cuidados ou peçam para nossa IA pesquisar um truque.'
                : 'Tente alterar os termos da busca para encontrar o que procura.'}
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-2 pt-2">
            <button
              onClick={handleOpenAdd}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-[#E07A8B] text-white text-xs sm:text-sm font-semibold hover:bg-[#D56B7D] transition-all cursor-pointer shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Cadastrar Dica Manual</span>
            </button>
            <button
              onClick={() => setIsAiModalOpen(true)}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-white dark:bg-[#2D2228] border border-[#F2E8E4] dark:border-[#3D2F36] text-[#2D2327] dark:text-[#FAF4F0] text-xs sm:text-sm font-semibold hover:border-[#E07A8B] transition-all cursor-pointer shadow-2xs"
            >
              <Bot className="w-4 h-4 text-[#E07A8B]" />
              <span>Consultar IA do Lar</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredTips.map((tip) => {
            const meta = getCategoryMeta(tip.category);
            const Icon = meta.icon;
            const author = tip.addedBy === 'partner1' ? profile.partner1 : profile.partner2;

            return (
              <div
                key={tip.id}
                className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-[#241C21] border border-[#F2E8E4] dark:border-[#3D2F36] shadow-xs flex flex-col justify-between space-y-3.5 hover:border-[#E07A8B]/40 transition-colors"
              >
                <div>
                  {/* Card Header */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium border ${meta.badgeBg}`}>
                        <Icon className="w-3 h-3" />
                        <span>{meta.label}</span>
                      </span>
                      {tip.room && (
                        <span className="px-2 py-0.5 rounded-full text-[11px] bg-[#FAF8F5] dark:bg-[#2D2228] border border-[#F2E8E4] dark:border-[#3D2F36] text-[#7D6F74] dark:text-[#B8A8AF]">
                          📍 {tip.room}
                        </span>
                      )}
                    </div>

                    <button
                      onClick={() => onToggleFavorite(tip.id)}
                      className="p-1.5 rounded-full hover:bg-rose-50 dark:hover:bg-rose-950/40 text-[#7D6F74] dark:text-[#B8A8AF] transition-colors cursor-pointer"
                      title={tip.isFavorite ? 'Remover dos favoritos' : 'Favoritar dica'}
                    >
                      <Heart
                        className={`w-4 h-4 ${
                          tip.isFavorite ? 'fill-rose-500 text-rose-500' : 'hover:text-rose-500'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Title & Author */}
                  <div className="mt-2.5 flex items-start justify-between gap-2">
                    <h3 className="font-serif text-base sm:text-lg font-bold text-[#2D2327] dark:text-[#FAF4F0] leading-snug">
                      {tip.title}
                    </h3>
                  </div>

                  {/* Author line */}
                  <div className="flex items-center gap-1.5 mt-1 text-[11px] text-[#7D6F74] dark:text-[#B8A8AF]">
                    <PartnerAvatar avatar={author.avatar} name={author.name} size="xs" />
                    <span>Dica de {author.nickname || author.name}</span>
                  </div>

                  {/* Description */}
                  <p className="text-xs sm:text-sm text-[#4A3E45] dark:text-[#D5C7CE] mt-2.5 whitespace-pre-line leading-relaxed">
                    {tip.description}
                  </p>

                  {/* Golden Tip / Secret Trick Highlight */}
                  {tip.goldenTip && (
                    <div className="mt-3 p-3 rounded-2xl bg-gradient-to-r from-amber-50/90 to-[#FAF3EC] dark:from-amber-950/30 dark:to-[#2D2228] border border-amber-200/60 dark:border-amber-900/40 space-y-1">
                      <div className="flex items-center gap-1.5 text-[11px] font-semibold text-amber-700 dark:text-amber-300">
                        <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                        <span>Pulo do Gato ✨</span>
                      </div>
                      <p className="text-xs text-amber-900 dark:text-amber-200/90 leading-normal">
                        {tip.goldenTip}
                      </p>
                    </div>
                  )}

                  {/* Reference Link */}
                  {tip.link && (
                    <div className="mt-2.5">
                      <a
                        href={tip.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs text-[#E07A8B] dark:text-[#F492A5] hover:underline font-medium break-all"
                      >
                        <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                        <span>Ver receita / tutorial externo</span>
                      </a>
                    </div>
                  )}
                </div>

                {/* Card Footer Actions */}
                <div className="pt-2.5 border-t border-[#F2E8E4]/60 dark:border-[#3D2F36]/60 flex items-center justify-end gap-2 text-xs">
                  <button
                    onClick={() => handleOpenEdit(tip)}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg hover:bg-[#FAF8F5] dark:hover:bg-[#2D2228] text-[#7D6F74] dark:text-[#B8A8AF] hover:text-[#2D2327] dark:hover:text-white transition-colors cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Editar</span>
                  </button>
                  <button
                    onClick={() => onDeleteTip(tip.id)}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 text-[#7D6F74] dark:text-[#B8A8AF] hover:text-rose-600 dark:hover:text-rose-400 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Excluir</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* AI Assistant Modal */}
      {isAiModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="w-full max-w-lg bg-white dark:bg-[#241C21] border border-[#F2E8E4] dark:border-[#3D2F36] rounded-3xl shadow-2xl p-5 sm:p-6 space-y-4 my-auto animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-[#F2E8E4] dark:border-[#3D2F36]">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-[#E07A8B] text-white">
                  <Bot className="w-4 h-4" />
                </span>
                <div>
                  <h3 className="font-serif text-lg font-bold text-[#2D2327] dark:text-[#FAF4F0]">
                    IA do Lar • Nosso Canto
                  </h3>
                  <p className="text-xs text-[#7D6F74] dark:text-[#B8A8AF]">
                    Soluções práticas, seguras e testadas para a casa
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsAiModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-[#FAF8F5] dark:hover:bg-[#2D2228] text-[#7D6F74] dark:text-[#B8A8AF] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Suggestions Chips */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-semibold text-[#7D6F74] dark:text-[#B8A8AF]">
                Sugestões rápidas:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {[
                  'Como tirar mancha de vinho?',
                  'Como tirar gordura de panela queimada?',
                  'Como cuidar de plantas suculentas?',
                  'Como tirar cheiro de mofo do armário?',
                  'Mistura caseira para limpar box de vidro',
                ].map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    onClick={() => {
                      setAiQuestion(prompt);
                      handleAskAi(prompt);
                    }}
                    className="text-[11px] px-2.5 py-1 rounded-full bg-[#FAF8F5] dark:bg-[#2D2228] border border-[#F2E8E4] dark:border-[#3D2F36] text-[#5C4D53] dark:text-[#C5B8BF] hover:border-[#E07A8B] hover:text-[#E07A8B] transition-all cursor-pointer"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>

            {/* Query Form */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleAskAi();
              }}
              className="space-y-3"
            >
              <div>
                <label className="block text-xs font-semibold text-[#2D2327] dark:text-[#FAF4F0] mb-1">
                  O que você quer resolver ou aprender? *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Como tirar mancha de vinho do sofá com produtos caseiros?"
                  value={aiQuestion}
                  onChange={(e) => setAiQuestion(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl bg-[#FAF8F5] dark:bg-[#2D2228] border border-[#F2E8E4] dark:border-[#3D2F36] text-[#2D2327] dark:text-[#FAF4F0] focus:outline-none focus:ring-1 focus:ring-[#E07A8B]"
                />
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={aiRoom}
                  onChange={(e) => setAiRoom(e.target.value)}
                  className="px-3 py-2 text-xs rounded-xl bg-[#FAF8F5] dark:bg-[#2D2228] border border-[#F2E8E4] dark:border-[#3D2F36] text-[#2D2327] dark:text-[#FAF4F0] focus:outline-none focus:ring-1 focus:ring-[#E07A8B]"
                >
                  {ROOM_OPTIONS.map((room) => (
                    <option key={room} value={room}>
                      Cômodo: {room}
                    </option>
                  ))}
                </select>

                <button
                  type="submit"
                  disabled={isAiLoading || !aiQuestion.trim()}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-[#E07A8B] hover:bg-[#D56B7D] disabled:opacity-50 text-white text-xs font-semibold shadow-xs transition-all cursor-pointer"
                >
                  {isAiLoading ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Consultando IA...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Pesquisar Truque</span>
                    </>
                  )}
                </button>
              </div>
            </form>

            {aiError && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 text-rose-700 dark:text-rose-300 text-xs">
                {aiError}
              </div>
            )}

            {/* AI Result Preview */}
            {aiResult && (
              <div className="p-4 rounded-2xl bg-gradient-to-br from-[#FAF8F5] to-rose-50/50 dark:from-[#2D2228] dark:to-[#22181E] border border-[#E07A8B]/40 space-y-3 animate-in fade-in">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#E07A8B]/15 text-[#E07A8B]">
                    {categoryLabels[aiResult.category] || aiResult.category}
                  </span>
                  <span className="text-[11px] text-[#7D6F74] dark:text-[#B8A8AF]">
                    📍 {aiResult.room}
                  </span>
                </div>

                <h4 className="font-serif text-sm sm:text-base font-bold text-[#2D2327] dark:text-[#FAF4F0]">
                  {aiResult.title}
                </h4>

                <p className="text-xs text-[#4A3E45] dark:text-[#D5C7CE] whitespace-pre-line leading-relaxed">
                  {aiResult.description}
                </p>

                {aiResult.goldenTip && (
                  <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 text-xs text-amber-900 dark:text-amber-200 space-y-0.5">
                    <span className="font-bold flex items-center gap-1 text-[11px] text-amber-700 dark:text-amber-300">
                      <Sparkles className="w-3 h-3" /> Pulo do Gato:
                    </span>
                    <span>{aiResult.goldenTip}</span>
                  </div>
                )}

                <div className="pt-2 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={handleSaveAiResult}
                    className="w-full flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-[#E07A8B] hover:bg-[#D56B7D] text-white text-xs font-semibold shadow-xs transition-all cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Salvar nas Nossas Dicas de Casa 💕</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Manage Categories Modal */}
      {isManagingCategories && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="w-full max-w-md bg-white dark:bg-[#241C21] border border-[#F2E8E4] dark:border-[#3D2F36] rounded-3xl shadow-2xl p-5 sm:p-6 space-y-4 my-auto animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-[#F2E8E4] dark:border-[#3D2F36]">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-[#E07A8B]/10 text-[#E07A8B]">
                  <Settings2 className="w-4 h-4" />
                </span>
                <h3 className="font-serif text-lg font-bold text-[#2D2327] dark:text-[#FAF4F0]">
                  Editar Categorias de Dicas
                </h3>
              </div>
              <button
                onClick={() => setIsManagingCategories(false)}
                className="p-1.5 rounded-full hover:bg-[#FAF8F5] dark:hover:bg-[#2D2228] text-[#7D6F74] dark:text-[#B8A8AF] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-[#7D6F74] dark:text-[#B8A8AF]">
              Personalize o nome das categorias para combinarem exatamente com o jeito que vocês chamam as coisas no lar:
            </p>

            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {DEFAULT_CATEGORIES.map((cat) => {
                const isEditing = editingCategoryKey === cat.id;
                const currentLabel = categoryLabels[cat.id] || cat.label;

                return (
                  <div
                    key={cat.id}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-[#FAF8F5] dark:bg-[#2D2228] border border-[#F2E8E4] dark:border-[#3D2F36]"
                  >
                    {isEditing ? (
                      <div className="flex items-center gap-2 flex-1 mr-2">
                        <input
                          type="text"
                          value={editingCategoryLabel}
                          onChange={(e) => setEditingCategoryLabel(e.target.value)}
                          className="flex-1 px-2.5 py-1 text-xs rounded-lg bg-white dark:bg-[#1E161A] border border-[#E07A8B] text-[#2D2327] dark:text-[#FAF4F0] focus:outline-none"
                          autoFocus
                        />
                        <button
                          type="button"
                          onClick={() => handleSaveCategoryLabel(cat.id)}
                          className="p-1 rounded-lg bg-[#E07A8B] text-white hover:bg-[#D56B7D]"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 min-w-0">
                        <cat.icon className={`w-4 h-4 shrink-0 ${cat.color}`} />
                        <span className="text-xs font-medium text-[#2D2327] dark:text-[#FAF4F0] truncate">
                          {currentLabel}
                        </span>
                      </div>
                    )}

                    {!isEditing && (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingCategoryKey(cat.id);
                          setEditingCategoryLabel(currentLabel);
                        }}
                        className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-[#3D2F36] text-[#7D6F74] dark:text-[#B8A8AF] hover:text-[#E07A8B] transition-colors cursor-pointer"
                        title="Editar nome da categoria"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setIsManagingCategories(false)}
                className="px-4 py-2 rounded-xl bg-[#E07A8B] text-white text-xs font-semibold hover:bg-[#D56B7D] cursor-pointer"
              >
                Concluído
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Tip Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="w-full max-w-lg bg-white dark:bg-[#241C21] border border-[#F2E8E4] dark:border-[#3D2F36] rounded-3xl shadow-2xl p-5 sm:p-6 space-y-4 my-auto animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-[#F2E8E4] dark:border-[#3D2F36]">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-[#E07A8B]">
                  <Lightbulb className="w-4 h-4" />
                </span>
                <h3 className="font-serif text-lg font-bold text-[#2D2327] dark:text-[#FAF4F0]">
                  {editingTip ? 'Editar Dica de Casa' : 'Nova Dica de Casa'}
                </h3>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-[#FAF8F5] dark:hover:bg-[#2D2228] text-[#7D6F74] dark:text-[#B8A8AF] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-3.5">
              {/* Title */}
              <div>
                <label className="block text-xs font-semibold text-[#2D2327] dark:text-[#FAF4F0] mb-1">
                  Título da Dica ou Truque *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Misturinha mágica multiuso para bancadas"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl bg-[#FAF8F5] dark:bg-[#2D2228] border border-[#F2E8E4] dark:border-[#3D2F36] text-[#2D2327] dark:text-[#FAF4F0] focus:outline-none focus:ring-1 focus:ring-[#E07A8B]"
                />
              </div>

              {/* Category & Room */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#2D2327] dark:text-[#FAF4F0] mb-1">
                    Categoria *
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as HomeTipCategory)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-[#FAF8F5] dark:bg-[#2D2228] border border-[#F2E8E4] dark:border-[#3D2F36] text-[#2D2327] dark:text-[#FAF4F0] focus:outline-none focus:ring-1 focus:ring-[#E07A8B]"
                  >
                    {DEFAULT_CATEGORIES.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {categoryLabels[cat.id] || cat.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#2D2327] dark:text-[#FAF4F0] mb-1">
                    Cômodo ou Área
                  </label>
                  <select
                    value={formRoom}
                    onChange={(e) => setFormRoom(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-[#FAF8F5] dark:bg-[#2D2228] border border-[#F2E8E4] dark:border-[#3D2F36] text-[#2D2327] dark:text-[#FAF4F0] focus:outline-none focus:ring-1 focus:ring-[#E07A8B]"
                  >
                    {ROOM_OPTIONS.map((room) => (
                      <option key={room} value={room}>
                        {room}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-[#2D2327] dark:text-[#FAF4F0] mb-1">
                  Como Fazer / Passo a Passo *
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="Explique a proporção dos produtos, onde passar, frequência ou cuidados..."
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl bg-[#FAF8F5] dark:bg-[#2D2228] border border-[#F2E8E4] dark:border-[#3D2F36] text-[#2D2327] dark:text-[#FAF4F0] focus:outline-none focus:ring-1 focus:ring-[#E07A8B]"
                />
              </div>

              {/* Golden Tip / Secret */}
              <div>
                <label className="block text-xs font-semibold text-amber-700 dark:text-amber-300 mb-1 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>Pulo do Gato / Segredo Especial (opcional)</span>
                </label>
                <input
                  type="text"
                  placeholder="Ex: Pingar 3 gotas de óleo essencial de lavanda no pano..."
                  value={formGoldenTip}
                  onChange={(e) => setFormGoldenTip(e.target.value)}
                  className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl bg-amber-50/40 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 text-[#2D2327] dark:text-[#FAF4F0] focus:outline-none focus:ring-1 focus:ring-amber-400"
                />
              </div>

              {/* Link */}
              <div>
                <label className="block text-xs font-semibold text-[#2D2327] dark:text-[#FAF4F0] mb-1">
                  Link ou Referência (opcional)
                </label>
                <input
                  type="url"
                  placeholder="https://instagram.com/... ou https://youtube.com/..."
                  value={formLink}
                  onChange={(e) => setFormLink(e.target.value)}
                  className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl bg-[#FAF8F5] dark:bg-[#2D2228] border border-[#F2E8E4] dark:border-[#3D2F36] text-[#2D2327] dark:text-[#FAF4F0] focus:outline-none focus:ring-1 focus:ring-[#E07A8B]"
                />
              </div>

              {/* Author */}
              <div>
                <label className="block text-xs font-semibold text-[#2D2327] dark:text-[#FAF4F0] mb-1">
                  Quem está cadastrando?
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormAuthor('partner1')}
                    className={`flex items-center justify-center gap-2 p-2 rounded-xl text-xs font-medium border transition-colors cursor-pointer ${
                      formAuthor === 'partner1'
                        ? 'bg-[#E07A8B]/10 border-[#E07A8B] text-[#E07A8B]'
                        : 'bg-[#FAF8F5] dark:bg-[#2D2228] border-[#F2E8E4] dark:border-[#3D2F36] text-[#7D6F74] dark:text-[#B8A8AF]'
                    }`}
                  >
                    <PartnerAvatar avatar={profile.partner1.avatar} name={profile.partner1.name} size="xs" />
                    <span>{profile.partner1.nickname || profile.partner1.name}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormAuthor('partner2')}
                    className={`flex items-center justify-center gap-2 p-2 rounded-xl text-xs font-medium border transition-colors cursor-pointer ${
                      formAuthor === 'partner2'
                        ? 'bg-[#E07A8B]/10 border-[#E07A8B] text-[#E07A8B]'
                        : 'bg-[#FAF8F5] dark:bg-[#2D2228] border-[#F2E8E4] dark:border-[#3D2F36] text-[#7D6F74] dark:text-[#B8A8AF]'
                    }`}
                  >
                    <PartnerAvatar avatar={profile.partner2.avatar} name={profile.partner2.name} size="xs" />
                    <span>{profile.partner2.nickname || profile.partner2.name}</span>
                  </button>
                </div>
              </div>

              {/* Buttons */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#F2E8E4] dark:border-[#3D2F36]">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-[#7D6F74] dark:text-[#B8A8AF] hover:bg-[#FAF8F5] dark:hover:bg-[#2D2228] cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#E07A8B] hover:bg-[#D56B7D] text-white text-xs font-semibold shadow-xs cursor-pointer"
                >
                  {editingTip ? 'Salvar Alterações' : 'Cadastrar Dica'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
