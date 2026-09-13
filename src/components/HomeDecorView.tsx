import React, { useState, useRef } from 'react';
import {
  Home,
  Plus,
  Search,
  Tag,
  ExternalLink,
  Trash2,
  Edit3,
  CheckCircle2,
  Sparkles,
  Camera,
  Image as ImageIcon,
  DollarSign,
  Heart,
  Eye,
  Check,
  Package,
  Layers,
  Copy,
  Link as LinkIcon,
  ChevronDown,
  Lightbulb,
  Settings2,
} from 'lucide-react';
import {
  HomeDecorItem,
  HomeTipItem,
  HomeRoom,
  HomeCategory,
  HomeItemPriority,
  HomeItemStatus,
  CoupleProfile,
  PartnerId,
} from '../types';
import { compressImageFile } from '../utils/imageCompression';
import { PartnerAvatar, isAvatarImage } from './PartnerAvatar';
import { HomeTipsView } from './HomeTipsView';

interface HomeDecorViewProps {
  items: HomeDecorItem[];
  tips?: HomeTipItem[];
  profile: CoupleProfile;
  activePartner: PartnerId;
  onAddItem: (item: Omit<HomeDecorItem, 'id' | 'addedAt'>) => void;
  onUpdateItem: (item: HomeDecorItem) => void;
  onDeleteItem: (id: string) => void;
  onToggleStatus: (id: string, status: HomeItemStatus) => void;
  onAddTip?: (tip: Omit<HomeTipItem, 'id' | 'createdAt'>) => void;
  onUpdateTip?: (tip: HomeTipItem) => void;
  onDeleteTip?: (id: string) => void;
  onToggleFavoriteTip?: (id: string) => void;
}

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

const CATEGORY_OPTIONS: HomeCategory[] = [
  'Móveis',
  'Decoração',
  'Utensílios & Cozinha',
  'Cama, Mesa & Banho',
  'Iluminação',
  'Eletrônicos & Gadgets',
  'Plantas & Jardim',
  'Organização',
];

export const HomeDecorView: React.FC<HomeDecorViewProps> = ({
  items = [],
  tips = [],
  profile,
  activePartner,
  onAddItem,
  onUpdateItem,
  onDeleteItem,
  onToggleStatus,
  onAddTip,
  onUpdateTip,
  onDeleteTip,
  onToggleFavoriteTip,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'decoracao' | 'dicas'>('decoracao');
  const [isAddTipModalOpen, setIsAddTipModalOpen] = useState(false);
  const currentPartner = activePartner === 'partner1' ? profile.partner1 : profile.partner2;

  // Filter and search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRoom, setSelectedRoom] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedAuthor, setSelectedAuthor] = useState<string>('all');

  // All rooms & categories states with full renaming capability
  const [allRooms, setAllRooms] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('nos_dois_all_home_rooms');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return [
      'Sala',
      'Quarto',
      'Cozinha',
      'Banheiro',
      'Varanda',
      'Escritório',
      'Lavanderia',
      'Casa Toda',
    ];
  });

  const [allCategories, setAllCategories] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('nos_dois_all_home_categories');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return [
      'Móveis',
      'Decoração',
      'Utensílios & Cozinha',
      'Cama, Mesa & Banho',
      'Iluminação',
      'Eletrônicos & Gadgets',
      'Plantas & Jardim',
      'Organização',
    ];
  });

  const [isManagingRoomsModalOpen, setIsManagingRoomsModalOpen] = useState(false);
  const [editingRoomOriginal, setEditingRoomOriginal] = useState<string | null>(null);
  const [editingRoomInput, setEditingRoomInput] = useState('');

  const [isManagingCategoriesModalOpen, setIsManagingCategoriesModalOpen] = useState(false);
  const [editingCategoryOriginal, setEditingCategoryOriginal] = useState<string | null>(null);
  const [editingCategoryInput, setEditingCategoryInput] = useState('');

  // Inline creation states
  const [isCreatingNewRoom, setIsCreatingNewRoom] = useState(false);
  const [customRoomInput, setCustomRoomInput] = useState('');
  const [isCreatingNewCat, setIsCreatingNewCat] = useState(false);
  const [customCatInput, setCustomCatInput] = useState('');

  const [isCreatingEditRoom, setIsCreatingEditRoom] = useState(false);
  const [customEditRoomInput, setCustomEditRoomInput] = useState('');
  const [isCreatingEditCat, setIsCreatingEditCat] = useState(false);
  const [customEditCatInput, setCustomEditCatInput] = useState('');

  const handleAddCustomRoom = (roomName: string) => {
    const trimmed = roomName.trim();
    if (!trimmed) return;
    if (!allRooms.includes(trimmed)) {
      const updated = [...allRooms, trimmed];
      setAllRooms(updated);
      try {
        localStorage.setItem('nos_dois_all_home_rooms', JSON.stringify(updated));
      } catch {}
    }
  };

  const handleDeleteRoom = (roomToDelete: string) => {
    const updated = allRooms.filter((r) => r !== roomToDelete);
    setAllRooms(updated);
    try {
      localStorage.setItem('nos_dois_all_home_rooms', JSON.stringify(updated));
    } catch {}
    if (newRoom === roomToDelete) setNewRoom((updated[0] as any) || 'Sala');
    if (editRoom === roomToDelete) setEditRoom((updated[0] as any) || 'Sala');
    if (selectedRoom === roomToDelete) setSelectedRoom('all');
  };

  const handleSaveEditedRoom = (oldRoom: string) => {
    const trimmed = editingRoomInput.trim();
    if (!trimmed || trimmed === oldRoom) {
      setEditingRoomOriginal(null);
      return;
    }
    const updated = allRooms.map((r) => (r === oldRoom ? trimmed : r));
    setAllRooms(updated);
    try {
      localStorage.setItem('nos_dois_all_home_rooms', JSON.stringify(updated));
    } catch {}
    if (newRoom === oldRoom) setNewRoom(trimmed as any);
    if (editRoom === oldRoom) setEditRoom(trimmed as any);
    if (selectedRoom === oldRoom) setSelectedRoom(trimmed);

    // Update existing items with old room name
    items.forEach((item) => {
      if (item.room === oldRoom) {
        onUpdateItem({ ...item, room: trimmed as any });
      }
    });

    setEditingRoomOriginal(null);
  };

  const handleAddCustomCategory = (catName: string) => {
    const trimmed = catName.trim();
    if (!trimmed) return;
    if (!allCategories.includes(trimmed)) {
      const updated = [...allCategories, trimmed];
      setAllCategories(updated);
      try {
        localStorage.setItem('nos_dois_all_home_categories', JSON.stringify(updated));
      } catch {}
    }
  };

  const handleDeleteCategory = (catToDelete: string) => {
    const updated = allCategories.filter((c) => c !== catToDelete);
    setAllCategories(updated);
    try {
      localStorage.setItem('nos_dois_all_home_categories', JSON.stringify(updated));
    } catch {}
    if (newCategory === catToDelete) setNewCategory((updated[0] as any) || 'Decoração');
    if (editCategory === catToDelete) setEditCategory((updated[0] as any) || 'Decoração');
  };

  const handleSaveEditedCategory = (oldCat: string) => {
    const trimmed = editingCategoryInput.trim();
    if (!trimmed || trimmed === oldCat) {
      setEditingCategoryOriginal(null);
      return;
    }
    const updated = allCategories.map((c) => (c === oldCat ? trimmed : c));
    setAllCategories(updated);
    try {
      localStorage.setItem('nos_dois_all_home_categories', JSON.stringify(updated));
    } catch {}
    if (newCategory === oldCat) setNewCategory(trimmed as any);
    if (editCategory === oldCat) setEditCategory(trimmed as any);

    // Update existing items with old category name
    items.forEach((item) => {
      if (item.category === oldCat) {
        onUpdateItem({ ...item, category: trimmed as any });
      }
    });

    setEditingCategoryOriginal(null);
  };

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<HomeDecorItem | null>(null);
  const [itemToDelete, setItemToDelete] = useState<HomeDecorItem | null>(null);

  // Form states for Add
  const [newName, setNewName] = useState('');
  const [newRoom, setNewRoom] = useState<HomeRoom>('Sala');
  const [newCategory, setNewCategory] = useState<HomeCategory>('Decoração');
  const [newPrice, setNewPrice] = useState('');
  const [newPriority, setNewPriority] = useState<HomeItemPriority>('Média');
  const [newStatus, setNewStatus] = useState<HomeItemStatus>('desejo');
  const [newImageUrl, setNewImageUrl] = useState('');
  const [newLink, setNewLink] = useState('');
  const [newNotes, setNewNotes] = useState('');
  const addFileInputRef = useRef<HTMLInputElement>(null);

  // Form states for Edit
  const [editName, setEditName] = useState('');
  const [editRoom, setEditRoom] = useState<HomeRoom>('Sala');
  const [editCategory, setEditCategory] = useState<HomeCategory>('Decoração');
  const [editPrice, setEditPrice] = useState('');
  const [editPriority, setEditPriority] = useState<HomeItemPriority>('Média');
  const [editStatus, setEditStatus] = useState<HomeItemStatus>('desejo');
  const [editImageUrl, setEditImageUrl] = useState('');
  const [editLink, setEditLink] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const editFileInputRef = useRef<HTMLInputElement>(null);

  // Link helpers
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const getValidLink = (rawLink?: string) => {
    if (!rawLink) return '';
    const trimmed = rawLink.trim();
    if (!trimmed) return '';
    if (/^https?:\/\//i.test(trimmed)) return trimmed;
    return `https://${trimmed}`;
  };

  const getDomainName = (rawLink?: string) => {
    if (!rawLink) return 'Loja';
    try {
      const valid = getValidLink(rawLink);
      const url = new URL(valid);
      return url.hostname.replace(/^www\./, '');
    } catch {
      return 'Loja';
    }
  };

  const handleCopyLink = (item: HomeDecorItem) => {
    const link = getValidLink(item.link);
    if (!link) return;
    navigator.clipboard.writeText(link);
    setCopiedId(item.id);
    setTimeout(() => {
      setCopiedId((prev) => (prev === item.id ? null : prev));
    }, 2000);
  };

  // File upload reader
  const handleFileUpload = async (
    file: File,
    setImageState: (val: string) => void
  ) => {
    if (!file) return;
    try {
      const compressed = await compressImageFile(file, 900, 0.75);
      setImageState(compressed);
    } catch {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result;
        if (typeof result === 'string') {
          setImageState(result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Open edit modal
  const handleOpenEdit = (item: HomeDecorItem) => {
    setEditingItem(item);
    setEditName(item.name);
    setEditRoom(item.room);
    setEditCategory(item.category);
    setEditPrice(item.estimatedPrice !== undefined ? String(item.estimatedPrice) : '');
    setEditPriority(item.priority);
    setEditStatus(item.status);
    setEditImageUrl(item.imageUrl || '');
    setEditLink(item.link || '');
    setEditNotes(item.notes || '');
  };

  // Submit Add
  const handleSubmitAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    onAddItem({
      name: newName.trim(),
      room: newRoom,
      category: newCategory,
      estimatedPrice: newPrice ? parseFloat(newPrice) : undefined,
      priority: newPriority,
      status: newStatus,
      imageUrl: newImageUrl.trim() || undefined,
      link: newLink.trim() || undefined,
      notes: newNotes.trim() || undefined,
      addedBy: activePartner,
    });

    // Reset
    setNewName('');
    setNewRoom('Sala');
    setNewCategory('Decoração');
    setNewPrice('');
    setNewPriority('Média');
    setNewStatus('desejo');
    setNewImageUrl('');
    setNewLink('');
    setNewNotes('');
    setIsAddModalOpen(false);
  };

  // Submit Edit
  const handleSubmitEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem || !editName.trim()) return;

    onUpdateItem({
      ...editingItem,
      name: editName.trim(),
      room: editRoom,
      category: editCategory,
      estimatedPrice: editPrice ? parseFloat(editPrice) : undefined,
      priority: editPriority,
      status: editStatus,
      imageUrl: editImageUrl.trim() || undefined,
      link: editLink.trim() || undefined,
      notes: editNotes.trim() || undefined,
    });

    setEditingItem(null);
  };

  // Suggestions with AI / Quick ideas
  const handleAddAiIdea = (ideaName: string, room: HomeRoom, cat: HomeCategory, price: number, photo: string, notes: string) => {
    onAddItem({
      name: ideaName,
      room,
      category: cat,
      estimatedPrice: price,
      priority: 'Média',
      status: 'desejo',
      imageUrl: photo,
      notes,
      addedBy: activePartner,
    });
  };

  // Filtered items
  const filteredItems = items.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.notes?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.room.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRoom = selectedRoom === 'all' || item.room === selectedRoom;
    const matchesStatus = selectedStatus === 'all' || item.status === selectedStatus;
    const matchesAuthor = selectedAuthor === 'all' || item.addedBy === selectedAuthor;
    return matchesSearch && matchesRoom && matchesStatus && matchesAuthor;
  });

  // Financial sums
  const totalWishPrice = items
    .filter((i) => i.status === 'desejo')
    .reduce((acc, curr) => acc + (curr.estimatedPrice || 0), 0);

  const totalSpentPrice = items
    .filter((i) => i.status === 'comprado' || i.status === 'instalado')
    .reduce((acc, curr) => acc + (curr.estimatedPrice || 0), 0);

  const installedCount = items.filter((i) => i.status === 'instalado').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-2xl bg-[#FAF3EC] dark:bg-[#2D2228] text-[#E07A8B] dark:text-[#F492A5]">
              <Home className="w-5 h-5" />
            </span>
            <h2 className="font-serif text-2xl font-bold text-[#2D2327] dark:text-[#FAF4F0]">
              Nosso Lar
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-[#7D6F74] dark:text-[#B8A8AF] mt-1">
            {activeSubTab === 'decoracao'
              ? 'Mural de inspirações, desejos e links de compras (Shopee, Mercado Livre, Tok&Stok) para o nosso cantinho.'
              : 'Truques práticos de limpeza, lavanderia, cuidados com plantas e dicas do lar para o nosso dia a dia.'}
          </p>
        </div>

        {activeSubTab === 'decoracao' ? (
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-[#E07A8B] to-[#E58C9B] hover:opacity-95 text-white font-medium text-xs sm:text-sm shadow-xs transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Salvar Ideia ou Link</span>
          </button>
        ) : (
          <button
            onClick={() => setIsAddTipModalOpen(true)}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-[#E07A8B] to-[#E58C9B] hover:opacity-95 text-white font-medium text-xs sm:text-sm shadow-xs transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Nova Dica de Casa</span>
          </button>
        )}
      </div>

      {/* Sub-Tabs: Decoração & Dicas de Casa */}
      <div className="grid grid-cols-2 p-1 rounded-2xl bg-white dark:bg-[#1E161A] border border-[#F2E8E4] dark:border-[#3D2F36] shadow-2xs w-full sm:w-auto">
        <button
          type="button"
          onClick={() => setActiveSubTab('decoracao')}
          className={`flex items-center justify-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap cursor-pointer ${
            activeSubTab === 'decoracao'
              ? 'bg-[#E07A8B] text-white shadow-xs'
              : 'text-[#7D6F74] dark:text-[#B8A8AF] hover:text-[#2D2327] dark:hover:text-[#FAF4F0]'
          }`}
        >
          <Sparkles className="w-4 h-4 shrink-0" />
          <span>Decoração</span>
          <span className="text-[11px] opacity-85">({items.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('dicas')}
          className={`flex items-center justify-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap cursor-pointer ${
            activeSubTab === 'dicas'
              ? 'bg-[#E07A8B] text-white shadow-xs'
              : 'text-[#7D6F74] dark:text-[#B8A8AF] hover:text-[#2D2327] dark:hover:text-[#FAF4F0]'
          }`}
        >
          <Lightbulb className="w-4 h-4 shrink-0" />
          <span className="hidden sm:inline">Dicas de Casa</span>
          <span className="inline sm:hidden">Dicas</span>
          <span className="text-[11px] opacity-85">({tips.length})</span>
        </button>
      </div>

      {/* View Content based on active sub-tab */}
      {activeSubTab === 'dicas' && (
        <HomeTipsView
          tips={tips}
          profile={profile}
          activePartner={activePartner}
          onAddTip={onAddTip || (() => {})}
          onUpdateTip={onUpdateTip || (() => {})}
          onDeleteTip={onDeleteTip || (() => {})}
          onToggleFavorite={onToggleFavoriteTip || (() => {})}
          isAddModalOpen={isAddTipModalOpen}
          setIsAddModalOpen={setIsAddTipModalOpen}
        />
      )}

      {activeSubTab === 'decoracao' && (
        <>
          {/* Filter and Search Bar */}
      <div className="p-3.5 rounded-2xl bg-white dark:bg-[#241C21] border border-[#F2E8E4] dark:border-[#3D2F36] flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-[#7D6F74] dark:text-[#B8A8AF] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por objeto, cômodo ou anotação..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm rounded-xl bg-[#FAF8F5] dark:bg-[#2D2228] border border-[#F2E8E4] dark:border-[#3D2F36] text-[#2D2327] dark:text-[#FAF4F0] placeholder-[#B8A8AF] focus:outline-none focus:ring-1 focus:ring-[#E07A8B]"
          />
        </div>

        {/* Room Filter */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
          <select
            value={selectedRoom}
            onChange={(e) => setSelectedRoom(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl bg-[#FAF8F5] dark:bg-[#2D2228] border border-[#F2E8E4] dark:border-[#3D2F36] text-[#2D2327] dark:text-[#FAF4F0] focus:outline-none focus:ring-1 focus:ring-[#E07A8B]"
          >
            <option value="all">Todos os Cômodos</option>
            {allRooms.map((room) => (
              <option key={room} value={room}>
                {room}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl bg-[#FAF8F5] dark:bg-[#2D2228] border border-[#F2E8E4] dark:border-[#3D2F36] text-[#2D2327] dark:text-[#FAF4F0] focus:outline-none focus:ring-1 focus:ring-[#E07A8B]"
          >
            <option value="all">Todos os Status</option>
            <option value="desejo">🛍️ Queremos Comprar</option>
            <option value="comprado">📦 Já Comprado</option>
            <option value="instalado">✨ No Nosso Cantinho</option>
          </select>

          {/* Author Filter */}
          <select
            value={selectedAuthor}
            onChange={(e) => setSelectedAuthor(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl bg-[#FAF8F5] dark:bg-[#2D2228] border border-[#F2E8E4] dark:border-[#3D2F36] text-[#2D2327] dark:text-[#FAF4F0] focus:outline-none focus:ring-1 focus:ring-[#E07A8B]"
          >
            <option value="all">Adicionado por: Todas</option>
            <option value="partner1">{isAvatarImage(profile.partner1.avatar) ? '👤' : profile.partner1.avatar} {profile.partner1.nickname || profile.partner1.name}</option>
            <option value="partner2">{isAvatarImage(profile.partner2.avatar) ? '👤' : profile.partner2.avatar} {profile.partner2.nickname || profile.partner2.name}</option>
          </select>

          {/* Manage Buttons */}
          <button
            type="button"
            onClick={() => setIsManagingRoomsModalOpen(true)}
            className="flex items-center gap-1 px-2.5 py-2 rounded-xl border border-rose-200 dark:border-rose-900/50 text-xs font-semibold text-[#E07A8B] hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors whitespace-nowrap cursor-pointer"
            title="Alterar nomes dos cômodos ou adicionar novos"
          >
            <Settings2 className="w-3.5 h-3.5" />
            <span>Cômodos</span>
          </button>

          <button
            type="button"
            onClick={() => setIsManagingCategoriesModalOpen(true)}
            className="flex items-center gap-1 px-2.5 py-2 rounded-xl border border-rose-200 dark:border-rose-900/50 text-xs font-semibold text-[#E07A8B] hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors whitespace-nowrap cursor-pointer"
            title="Alterar nomes das categorias de decoração ou adicionar novas"
          >
            <Settings2 className="w-3.5 h-3.5" />
            <span>Categorias</span>
          </button>
        </div>
      </div>

      {/* Items Grid */}
      {filteredItems.length === 0 ? (
        <div className="text-center py-12 px-4 rounded-3xl bg-white dark:bg-[#241C21] border border-[#F2E8E4] dark:border-[#3D2F36]">
          <Home className="w-12 h-12 text-[#E07A8B] mx-auto mb-3 opacity-60" />
          <h3 className="font-serif text-lg font-bold text-[#2D2327] dark:text-[#FAF4F0]">
            Nenhum item encontrado
          </h3>
          <p className="text-xs sm:text-sm text-[#7D6F74] dark:text-[#B8A8AF] max-w-md mx-auto mt-1 mb-5">
            Adicione móveis, luminárias, almofadas, pratos ou qualquer objeto de decoração que vocês desejam para o lar!
          </p>

          <div className="flex flex-wrap items-center justify-center gap-2">
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-[#E07A8B] hover:bg-[#d66a7c] text-white text-xs font-semibold"
            >
              + Adicionar Primeiro Objeto
            </button>
            <button
              onClick={() => {
                handleAddAiIdea(
                  'Luminária de Chão Nórdica com Luz Quente',
                  'Sala',
                  'Iluminação',
                  189.9,
                  'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=600&q=80',
                  'Fica perfeita ao lado do nosso sofá para assistir filmes em clima quentinho.'
                );
                handleAddAiIdea(
                  'Conjunto de Cerâmica Artesanal Terracota (4 pratos)',
                  'Cozinha',
                  'Utensílios & Cozinha',
                  159.0,
                  'https://images.unsplash.com/photo-1610701596007-11502861dcfa?auto=format&fit=crop&w=600&q=80',
                  'Para nossos jantares românticos de massa e risoto.'
                );
              }}
              className="px-4 py-2 rounded-xl bg-[#FAF3EC] dark:bg-[#2D2228] border border-[#F2E8E4] dark:border-[#3D2F36] text-[#E07A8B] dark:text-[#F492A5] text-xs font-semibold"
            >
              ✨ Carregar Sugestões Prontas para Começar
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredItems.map((item) => {
            const addedPerson = item.addedBy === 'partner1' ? profile.partner1 : profile.partner2;

            return (
              <div
                key={item.id}
                className="group relative flex flex-col rounded-3xl bg-white dark:bg-[#241C21] border border-[#F2E8E4] dark:border-[#3D2F36] overflow-hidden shadow-xs hover:shadow-md transition-all duration-200"
              >
                {/* Photo banner */}
                <div className="relative h-48 w-full bg-[#FAF8F5] dark:bg-[#2C2127] overflow-hidden">
                  {item.imageUrl ? (
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-[#B8A8AF] gap-2">
                      <Home className="w-10 h-10 opacity-40" />
                      <span className="text-[11px]">Sem foto cadastrada</span>
                    </div>
                  )}

                  {/* Badges on photo */}
                  <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-white/90 dark:bg-black/80 backdrop-blur-xs text-[#2D2327] dark:text-[#FAF4F0] shadow-xs">
                      {item.room}
                    </span>
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-medium bg-[#E07A8B]/90 backdrop-blur-xs text-white shadow-xs">
                      {item.category}
                    </span>
                  </div>

                  {/* Priority badge */}
                  {item.priority && (
                    <div className="absolute top-3 right-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold shadow-xs ${
                          item.priority === 'Urgente'
                            ? 'bg-rose-500 text-white'
                            : item.priority === 'Alta'
                            ? 'bg-amber-500 text-white'
                            : 'bg-zinc-800/80 text-white backdrop-blur-xs'
                        }`}
                      >
                        {item.priority}
                      </span>
                    </div>
                  )}

                  {/* Status chip over photo bottom */}
                  <div className="absolute bottom-2 left-3">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold flex items-center gap-1 backdrop-blur-sm ${
                        item.status === 'instalado'
                          ? 'bg-emerald-500/90 text-white'
                          : item.status === 'comprado'
                          ? 'bg-blue-500/90 text-white'
                          : 'bg-amber-500/90 text-white'
                      }`}
                    >
                      {item.status === 'instalado' && '✨ No Cantinho'}
                      {item.status === 'comprado' && '📦 Já Comprado'}
                      {item.status === 'desejo' && '🛍️ Quero Comprar'}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    <h3 className="font-serif font-bold text-base text-[#2D2327] dark:text-[#FAF4F0] leading-snug line-clamp-1">
                      {item.name}
                    </h3>

                    {item.notes && (
                      <p className="text-xs text-[#7D6F74] dark:text-[#B8A8AF] line-clamp-2 mt-1">
                        {item.notes}
                      </p>
                    )}
                  </div>

                  {/* Price & Link */}
                  <div className="flex items-center justify-between pt-2 border-t border-[#F2E8E4] dark:border-[#3D2F36]">
                    <div>
                      {item.estimatedPrice !== undefined && item.estimatedPrice > 0 ? (
                        <div className="flex items-baseline gap-1">
                          <span className="text-[10px] text-[#7D6F74] dark:text-[#B8A8AF]">Est.</span>
                          <span className="font-serif font-bold text-base text-[#E07A8B] dark:text-[#F492A5]">
                            R$ {item.estimatedPrice.toFixed(2)}
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs text-[#7D6F74] dark:text-[#B8A8AF] italic">
                          Sem valor definido
                        </span>
                      )}
                      {item.addedBy && (
                        <div className="flex items-center gap-1 text-[10px] text-[#7D6F74] dark:text-[#B8A8AF] mt-0.5">
                          <PartnerAvatar avatar={item.addedBy === 'partner1' ? profile.partner1.avatar : profile.partner2.avatar} name={item.addedBy === 'partner1' ? profile.partner1.name : profile.partner2.name} size="xs" />
                          <span>Por {item.addedBy === 'partner1' ? (profile.partner1.nickname || profile.partner1.name) : (profile.partner2.nickname || profile.partner2.name)}</span>
                        </div>
                      )}
                    </div>

                    {item.link && (
                      <div className="flex items-center gap-1">
                        <a
                          href={getValidLink(item.link)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-[11px] px-2 py-1 rounded-xl bg-[#FAF3EC] dark:bg-[#2D2228] border border-[#F2E8E4] dark:border-[#3D2F36] text-[#E07A8B] hover:bg-[#F2E8E4] font-semibold transition-colors truncate max-w-[130px]"
                          title={`Abrir ${getDomainName(item.link)}`}
                        >
                          <LinkIcon className="w-3 h-3 shrink-0" />
                          <span className="truncate">{getDomainName(item.link)}</span>
                          <ExternalLink className="w-2.5 h-2.5 shrink-0 ml-0.5" />
                        </a>

                        <button
                          type="button"
                          onClick={() => handleCopyLink(item)}
                          className="p-1 rounded-lg text-[#7D6F74] dark:text-[#B8A8AF] hover:text-[#E07A8B] hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                          title="Copiar link"
                        >
                          {copiedId === item.id ? (
                            <Check className="w-3 h-3 text-emerald-500" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Status Toggle buttons */}
                  <div className="pt-2 border-t border-[#F2E8E4] dark:border-[#3D2F36] flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => onToggleStatus(item.id, 'desejo')}
                        title="Marcar como Desejo"
                        className={`px-2 py-1 rounded-lg text-[10px] font-semibold transition-colors ${
                          item.status === 'desejo'
                            ? 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-200 ring-1 ring-amber-400'
                            : 'text-[#7D6F74] hover:bg-zinc-100 dark:hover:bg-zinc-800'
                        }`}
                      >
                        🛍️ Desejo
                      </button>
                      <button
                        onClick={() => onToggleStatus(item.id, 'comprado')}
                        title="Marcar como Comprado"
                        className={`px-2 py-1 rounded-lg text-[10px] font-semibold transition-colors ${
                          item.status === 'comprado'
                            ? 'bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-200 ring-1 ring-blue-400'
                            : 'text-[#7D6F74] hover:bg-zinc-100 dark:hover:bg-zinc-800'
                        }`}
                      >
                        📦 Comprado
                      </button>
                      <button
                        onClick={() => onToggleStatus(item.id, 'instalado')}
                        title="Marcar como Instalado no Cantinho"
                        className={`px-2 py-1 rounded-lg text-[10px] font-semibold transition-colors ${
                          item.status === 'instalado'
                            ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-200 ring-1 ring-emerald-400'
                            : 'text-[#7D6F74] hover:bg-zinc-100 dark:hover:bg-zinc-800'
                        }`}
                      >
                        ✨ No Lar
                      </button>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleOpenEdit(item)}
                        className="p-1.5 rounded-lg text-[#7D6F74] hover:text-[#2D2327] dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                        title="Editar"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setItemToDelete(item)}
                        className="p-1.5 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors"
                        title="Excluir"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
        </>
      )}

      {/* Add Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#241C21] rounded-3xl max-w-lg w-full p-6 border border-[#F2E8E4] dark:border-[#3D2F36] shadow-xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-[#F2E8E4] dark:border-[#3D2F36]">
              <div className="flex items-center gap-2">
                <Home className="w-5 h-5 text-[#E07A8B]" />
                <h3 className="font-serif font-bold text-lg text-[#2D2327] dark:text-[#FAF4F0]">
                  Adicionar Coisa de Casa & Decoração
                </h3>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-xs text-[#7D6F74] hover:text-[#2D2327] dark:hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitAdd} className="space-y-3.5 text-xs sm:text-sm">
              <div>
                <label className="block font-medium text-[#2D2327] dark:text-[#FAF4F0] mb-1">
                  Nome do Objeto / Item *
                </label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Ex: Luminária Nórdica / Jogo de Pratos Cerâmica / Manta Sofá"
                  className="w-full px-3 py-2 rounded-xl bg-[#FAF8F5] dark:bg-[#2D2228] border border-[#F2E8E4] dark:border-[#3D2F36] text-[#2D2327] dark:text-[#FAF4F0] focus:outline-none focus:ring-1 focus:ring-[#E07A8B]"
                />
              </div>

              {/* Upload Foto do Celular */}
              <div className="space-y-2 p-3 rounded-2xl bg-[#FAF8F5] dark:bg-[#2C2127] border border-[#F2E8E4] dark:border-[#3D2F36]">
                <label className="block font-medium text-[#2D2327] dark:text-[#FAF4F0]">
                  Foto do Objeto (Upload do Celular ou URL)
                </label>

                {newImageUrl ? (
                  <div className="relative h-32 rounded-xl overflow-hidden border border-[#F2E8E4] dark:border-[#3D2F36] group">
                    <img
                      src={newImageUrl}
                      alt="Preview"
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => setNewImageUrl('')}
                      className="absolute top-2 right-2 px-2 py-1 bg-black/70 text-white rounded-lg text-[10px] font-semibold hover:bg-black"
                    >
                      Remover foto ✕
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col sm:flex-row items-center gap-2">
                    <input
                      type="file"
                      accept="image/*"
                      ref={addFileInputRef}
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFileUpload(file, setNewImageUrl);
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => addFileInputRef.current?.click()}
                      className="w-full sm:w-auto flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl bg-white dark:bg-[#33252C] border border-[#E07A8B]/40 text-[#E07A8B] hover:bg-[#FAF3EC] text-xs font-semibold transition-colors"
                    >
                      <Camera className="w-4 h-4" />
                      <span>Escolher foto do celular / arquivo</span>
                    </button>
                    <span className="text-[11px] text-[#7D6F74] dark:text-[#B8A8AF]">ou cole o link:</span>
                    <input
                      type="url"
                      value={newImageUrl}
                      onChange={(e) => setNewImageUrl(e.target.value)}
                      placeholder="https://images.unsplash..."
                      className="flex-1 w-full px-3 py-1.5 rounded-xl bg-white dark:bg-[#33252C] border border-[#F2E8E4] dark:border-[#3D2F36] text-[#2D2327] dark:text-[#FAF4F0] text-xs focus:outline-none focus:ring-1 focus:ring-[#E07A8B]"
                    />
                  </div>
                )}
              </div>

              {/* Room and Category */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block font-medium text-[#2D2327] dark:text-[#FAF4F0]">
                      Cômodo
                    </label>
                    {allRooms.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setIsManagingRoomsModalOpen(true)}
                        className="text-[11px] text-[#E07A8B] hover:underline font-semibold flex items-center gap-0.5 cursor-pointer"
                      >
                        <Edit3 className="w-3 h-3" /> Gerenciar
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <select
                      value={isCreatingNewRoom ? '__create_new__' : newRoom}
                      onChange={(e) => {
                        if (e.target.value === '__create_new__') {
                          setIsCreatingNewRoom(true);
                          setCustomRoomInput('');
                        } else {
                          setIsCreatingNewRoom(false);
                          setNewRoom(e.target.value as HomeRoom);
                        }
                      }}
                      className="w-full px-3 py-2 pr-8 rounded-xl bg-[#FAF8F5] dark:bg-[#2D2228] border border-[#F2E8E4] dark:border-[#3D2F36] text-[#2D2327] dark:text-[#FAF4F0] focus:outline-none focus:ring-1 focus:ring-[#E07A8B] appearance-none cursor-pointer text-xs sm:text-sm"
                    >
                      {allRooms.map((room) => (
                        <option key={room} value={room}>
                          {room}
                        </option>
                      ))}
                      <option value="__create_new__" className="font-semibold text-[#E07A8B]">
                        ✨ + Criar outro cômodo...
                      </option>
                    </select>
                    <ChevronDown className="w-4 h-4 text-[#7D6F74] dark:text-[#B8A8AF] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>

                  {isCreatingNewRoom && (
                    <div className="mt-2 flex items-center gap-1.5 animate-in fade-in duration-150">
                      <input
                        type="text"
                        autoFocus
                        value={customRoomInput}
                        onChange={(e) => setCustomRoomInput(e.target.value)}
                        placeholder="Nome do cômodo..."
                        className="flex-1 px-2.5 py-1.5 rounded-xl bg-white dark:bg-[#20171C] border border-[#E07A8B] text-xs text-[#2D2327] dark:text-[#FAF4F0] focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (customRoomInput.trim()) {
                            handleAddCustomRoom(customRoomInput.trim());
                            setNewRoom(customRoomInput.trim());
                            setIsCreatingNewRoom(false);
                          }
                        }}
                        className="px-2.5 py-1.5 rounded-xl bg-[#E07A8B] text-white text-xs font-semibold hover:opacity-90"
                      >
                        Criar
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsCreatingNewRoom(false)}
                        className="px-2 py-1.5 text-xs text-[#7D6F74]"
                      >
                        ✕
                      </button>
                    </div>
                  )}
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block font-medium text-[#2D2327] dark:text-[#FAF4F0]">
                      Categoria
                    </label>
                    {allCategories.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setIsManagingCategoriesModalOpen(true)}
                        className="text-[11px] text-[#E07A8B] hover:underline font-semibold flex items-center gap-0.5 cursor-pointer"
                      >
                        <Edit3 className="w-3 h-3" /> Gerenciar
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <select
                      value={isCreatingNewCat ? '__create_new__' : newCategory}
                      onChange={(e) => {
                        if (e.target.value === '__create_new__') {
                          setIsCreatingNewCat(true);
                          setCustomCatInput('');
                        } else {
                          setIsCreatingNewCat(false);
                          setNewCategory(e.target.value as HomeCategory);
                        }
                      }}
                      className="w-full px-3 py-2 pr-8 rounded-xl bg-[#FAF8F5] dark:bg-[#2D2228] border border-[#F2E8E4] dark:border-[#3D2F36] text-[#2D2327] dark:text-[#FAF4F0] focus:outline-none focus:ring-1 focus:ring-[#E07A8B] appearance-none cursor-pointer text-xs sm:text-sm"
                    >
                      {allCategories.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                      <option value="__create_new__" className="font-semibold text-[#E07A8B]">
                        ✨ + Criar outra categoria...
                      </option>
                    </select>
                    <ChevronDown className="w-4 h-4 text-[#7D6F74] dark:text-[#B8A8AF] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>

                  {isCreatingNewCat && (
                    <div className="mt-2 flex items-center gap-1.5 animate-in fade-in duration-150">
                      <input
                        type="text"
                        autoFocus
                        value={customCatInput}
                        onChange={(e) => setCustomCatInput(e.target.value)}
                        placeholder="Nome da categoria..."
                        className="flex-1 px-2.5 py-1.5 rounded-xl bg-white dark:bg-[#20171C] border border-[#E07A8B] text-xs text-[#2D2327] dark:text-[#FAF4F0] focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (customCatInput.trim()) {
                            handleAddCustomCategory(customCatInput.trim());
                            setNewCategory(customCatInput.trim());
                            setIsCreatingNewCat(false);
                          }
                        }}
                        className="px-2.5 py-1.5 rounded-xl bg-[#E07A8B] text-white text-xs font-semibold hover:opacity-90"
                      >
                        Criar
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsCreatingNewCat(false)}
                        className="px-2 py-1.5 text-xs text-[#7D6F74]"
                      >
                        ✕
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Price, Priority, Status */}
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block font-medium text-[#2D2327] dark:text-[#FAF4F0] mb-1">
                    Preço Est. (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={newPrice}
                    onChange={(e) => setNewPrice(e.target.value)}
                    placeholder="120.00"
                    className="w-full px-3 py-2 rounded-xl bg-[#FAF8F5] dark:bg-[#2D2228] border border-[#F2E8E4] dark:border-[#3D2F36] text-[#2D2327] dark:text-[#FAF4F0] focus:outline-none focus:ring-1 focus:ring-[#E07A8B]"
                  />
                </div>

                <div>
                  <label className="block font-medium text-[#2D2327] dark:text-[#FAF4F0] mb-1">
                    Prioridade
                  </label>
                  <select
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value as HomeItemPriority)}
                    className="w-full px-2.5 py-2 rounded-xl bg-[#FAF8F5] dark:bg-[#2D2228] border border-[#F2E8E4] dark:border-[#3D2F36] text-[#2D2327] dark:text-[#FAF4F0] focus:outline-none focus:ring-1 focus:ring-[#E07A8B]"
                  >
                    <option value="Baixa">Baixa</option>
                    <option value="Média">Média</option>
                    <option value="Alta">Alta</option>
                    <option value="Urgente">Urgente</option>
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-[#2D2327] dark:text-[#FAF4F0] mb-1">
                    Status Atual
                  </label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value as HomeItemStatus)}
                    className="w-full px-2.5 py-2 rounded-xl bg-[#FAF8F5] dark:bg-[#2D2228] border border-[#F2E8E4] dark:border-[#3D2F36] text-[#2D2327] dark:text-[#FAF4F0] focus:outline-none focus:ring-1 focus:ring-[#E07A8B]"
                  >
                    <option value="desejo">🛍️ Desejo</option>
                    <option value="comprado">📦 Comprado</option>
                    <option value="instalado">✨ No Lar</option>
                  </select>
                </div>
              </div>

              {/* Link da loja */}
              <div>
                <label className="block font-medium text-[#2D2327] dark:text-[#FAF4F0] mb-1">
                  Link do Produto na Loja (Shopee, Amazon, Tok&Stok, etc.)
                </label>
                <input
                  type="url"
                  value={newLink}
                  onChange={(e) => setNewLink(e.target.value)}
                  placeholder="https://shopee.com.br/... ou https://..."
                  className="w-full px-3 py-2 rounded-xl bg-[#FAF8F5] dark:bg-[#2D2228] border border-[#F2E8E4] dark:border-[#3D2F36] text-[#2D2327] dark:text-[#FAF4F0] focus:outline-none focus:ring-1 focus:ring-[#E07A8B]"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block font-medium text-[#2D2327] dark:text-[#FAF4F0] mb-1">
                  Anotações / Medidas / Cores
                </label>
                <textarea
                  rows={2}
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  placeholder="Ex: Medir a parede antes de pedir; cor bege ou terracota..."
                  className="w-full px-3 py-2 rounded-xl bg-[#FAF8F5] dark:bg-[#2D2228] border border-[#F2E8E4] dark:border-[#3D2F36] text-[#2D2327] dark:text-[#FAF4F0] focus:outline-none focus:ring-1 focus:ring-[#E07A8B]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-[#7D6F74] hover:bg-zinc-100 dark:hover:bg-zinc-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#E07A8B] hover:bg-[#d66a7c] text-white font-medium shadow-xs"
                >
                  Salvar Objeto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingItem && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#241C21] rounded-3xl max-w-lg w-full p-6 border border-[#F2E8E4] dark:border-[#3D2F36] shadow-xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-[#F2E8E4] dark:border-[#3D2F36]">
              <div className="flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-[#E07A8B]" />
                <h3 className="font-serif font-bold text-lg text-[#2D2327] dark:text-[#FAF4F0]">
                  Editar Item de Casa
                </h3>
              </div>
              <button
                onClick={() => setEditingItem(null)}
                className="text-xs text-[#7D6F74] hover:text-[#2D2327] dark:hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitEdit} className="space-y-3.5 text-xs sm:text-sm">
              <div>
                <label className="block font-medium text-[#2D2327] dark:text-[#FAF4F0] mb-1">
                  Nome do Objeto / Item *
                </label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#FAF8F5] dark:bg-[#2D2228] border border-[#F2E8E4] dark:border-[#3D2F36] text-[#2D2327] dark:text-[#FAF4F0] focus:outline-none focus:ring-1 focus:ring-[#E07A8B]"
                />
              </div>

              {/* Upload Foto */}
              <div className="space-y-2 p-3 rounded-2xl bg-[#FAF8F5] dark:bg-[#2C2127] border border-[#F2E8E4] dark:border-[#3D2F36]">
                <label className="block font-medium text-[#2D2327] dark:text-[#FAF4F0]">
                  Foto do Objeto
                </label>

                {editImageUrl ? (
                  <div className="relative h-32 rounded-xl overflow-hidden border border-[#F2E8E4] dark:border-[#3D2F36] group">
                    <img
                      src={editImageUrl}
                      alt="Preview"
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => setEditImageUrl('')}
                      className="absolute top-2 right-2 px-2 py-1 bg-black/70 text-white rounded-lg text-[10px] font-semibold hover:bg-black"
                    >
                      Remover foto ✕
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col sm:flex-row items-center gap-2">
                    <input
                      type="file"
                      accept="image/*"
                      ref={editFileInputRef}
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFileUpload(file, setEditImageUrl);
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => editFileInputRef.current?.click()}
                      className="w-full sm:w-auto flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl bg-white dark:bg-[#33252C] border border-[#E07A8B]/40 text-[#E07A8B] hover:bg-[#FAF3EC] text-xs font-semibold transition-colors"
                    >
                      <Camera className="w-4 h-4" />
                      <span>Escolher foto do celular / arquivo</span>
                    </button>
                    <span className="text-[11px] text-[#7D6F74] dark:text-[#B8A8AF]">ou cole o link:</span>
                    <input
                      type="url"
                      value={editImageUrl}
                      onChange={(e) => setEditImageUrl(e.target.value)}
                      placeholder="https://..."
                      className="flex-1 w-full px-3 py-1.5 rounded-xl bg-white dark:bg-[#33252C] border border-[#F2E8E4] dark:border-[#3D2F36] text-[#2D2327] dark:text-[#FAF4F0] text-xs focus:outline-none focus:ring-1 focus:ring-[#E07A8B]"
                    />
                  </div>
                )}
              </div>

              {/* Room and Category */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block font-medium text-[#2D2327] dark:text-[#FAF4F0]">
                      Cômodo
                    </label>
                    {allRooms.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setIsManagingRoomsModalOpen(true)}
                        className="text-[11px] text-[#E07A8B] hover:underline font-semibold flex items-center gap-0.5 cursor-pointer"
                      >
                        <Edit3 className="w-3 h-3" /> Gerenciar
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <select
                      value={isCreatingEditRoom ? '__create_new__' : editRoom}
                      onChange={(e) => {
                        if (e.target.value === '__create_new__') {
                          setIsCreatingEditRoom(true);
                          setCustomEditRoomInput('');
                        } else {
                          setIsCreatingEditRoom(false);
                          setEditRoom(e.target.value as HomeRoom);
                        }
                      }}
                      className="w-full px-3 py-2 pr-8 rounded-xl bg-[#FAF8F5] dark:bg-[#2D2228] border border-[#F2E8E4] dark:border-[#3D2F36] text-[#2D2327] dark:text-[#FAF4F0] focus:outline-none focus:ring-1 focus:ring-[#E07A8B] appearance-none cursor-pointer text-xs sm:text-sm"
                    >
                      {allRooms.map((room) => (
                        <option key={room} value={room}>
                          {room}
                        </option>
                      ))}
                      <option value="__create_new__" className="font-semibold text-[#E07A8B]">
                        ✨ + Criar outro cômodo...
                      </option>
                    </select>
                    <ChevronDown className="w-4 h-4 text-[#7D6F74] dark:text-[#B8A8AF] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>

                  {isCreatingEditRoom && (
                    <div className="mt-2 flex items-center gap-1.5 animate-in fade-in duration-150">
                      <input
                        type="text"
                        autoFocus
                        value={customEditRoomInput}
                        onChange={(e) => setCustomEditRoomInput(e.target.value)}
                        placeholder="Nome do cômodo..."
                        className="flex-1 px-2.5 py-1.5 rounded-xl bg-white dark:bg-[#20171C] border border-[#E07A8B] text-xs text-[#2D2327] dark:text-[#FAF4F0] focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (customEditRoomInput.trim()) {
                            handleAddCustomRoom(customEditRoomInput.trim());
                            setEditRoom(customEditRoomInput.trim());
                            setIsCreatingEditRoom(false);
                          }
                        }}
                        className="px-2.5 py-1.5 rounded-xl bg-[#E07A8B] text-white text-xs font-semibold hover:opacity-90"
                      >
                        Criar
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsCreatingEditRoom(false)}
                        className="px-2 py-1.5 text-xs text-[#7D6F74]"
                      >
                        ✕
                      </button>
                    </div>
                  )}
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block font-medium text-[#2D2327] dark:text-[#FAF4F0]">
                      Categoria
                    </label>
                    {allCategories.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setIsManagingCategoriesModalOpen(true)}
                        className="text-[11px] text-[#E07A8B] hover:underline font-semibold flex items-center gap-0.5 cursor-pointer"
                      >
                        <Edit3 className="w-3 h-3" /> Gerenciar
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <select
                      value={isCreatingEditCat ? '__create_new__' : editCategory}
                      onChange={(e) => {
                        if (e.target.value === '__create_new__') {
                          setIsCreatingEditCat(true);
                          setCustomEditCatInput('');
                        } else {
                          setIsCreatingEditCat(false);
                          setEditCategory(e.target.value as HomeCategory);
                        }
                      }}
                      className="w-full px-3 py-2 pr-8 rounded-xl bg-[#FAF8F5] dark:bg-[#2D2228] border border-[#F2E8E4] dark:border-[#3D2F36] text-[#2D2327] dark:text-[#FAF4F0] focus:outline-none focus:ring-1 focus:ring-[#E07A8B] appearance-none cursor-pointer text-xs sm:text-sm"
                    >
                      {allCategories.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                      <option value="__create_new__" className="font-semibold text-[#E07A8B]">
                        ✨ + Criar outra categoria...
                      </option>
                    </select>
                    <ChevronDown className="w-4 h-4 text-[#7D6F74] dark:text-[#B8A8AF] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>

                  {isCreatingEditCat && (
                    <div className="mt-2 flex items-center gap-1.5 animate-in fade-in duration-150">
                      <input
                        type="text"
                        autoFocus
                        value={customEditCatInput}
                        onChange={(e) => setCustomEditCatInput(e.target.value)}
                        placeholder="Nome da categoria..."
                        className="flex-1 px-2.5 py-1.5 rounded-xl bg-white dark:bg-[#20171C] border border-[#E07A8B] text-xs text-[#2D2327] dark:text-[#FAF4F0] focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (customEditCatInput.trim()) {
                            handleAddCustomCategory(customEditCatInput.trim());
                            setEditCategory(customEditCatInput.trim());
                            setIsCreatingEditCat(false);
                          }
                        }}
                        className="px-2.5 py-1.5 rounded-xl bg-[#E07A8B] text-white text-xs font-semibold hover:opacity-90"
                      >
                        Criar
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsCreatingEditCat(false)}
                        className="px-2 py-1.5 text-xs text-[#7D6F74]"
                      >
                        ✕
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Price, Priority, Status */}
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block font-medium text-[#2D2327] dark:text-[#FAF4F0] mb-1">
                    Preço Est. (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={editPrice}
                    onChange={(e) => setEditPrice(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#FAF8F5] dark:bg-[#2D2228] border border-[#F2E8E4] dark:border-[#3D2F36] text-[#2D2327] dark:text-[#FAF4F0] focus:outline-none focus:ring-1 focus:ring-[#E07A8B]"
                  />
                </div>

                <div>
                  <label className="block font-medium text-[#2D2327] dark:text-[#FAF4F0] mb-1">
                    Prioridade
                  </label>
                  <select
                    value={editPriority}
                    onChange={(e) => setEditPriority(e.target.value as HomeItemPriority)}
                    className="w-full px-2.5 py-2 rounded-xl bg-[#FAF8F5] dark:bg-[#2D2228] border border-[#F2E8E4] dark:border-[#3D2F36] text-[#2D2327] dark:text-[#FAF4F0] focus:outline-none focus:ring-1 focus:ring-[#E07A8B]"
                  >
                    <option value="Baixa">Baixa</option>
                    <option value="Média">Média</option>
                    <option value="Alta">Alta</option>
                    <option value="Urgente">Urgente</option>
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-[#2D2327] dark:text-[#FAF4F0] mb-1">
                    Status Atual
                  </label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value as HomeItemStatus)}
                    className="w-full px-2.5 py-2 rounded-xl bg-[#FAF8F5] dark:bg-[#2D2228] border border-[#F2E8E4] dark:border-[#3D2F36] text-[#2D2327] dark:text-[#FAF4F0] focus:outline-none focus:ring-1 focus:ring-[#E07A8B]"
                  >
                    <option value="desejo">🛍️ Desejo</option>
                    <option value="comprado">📦 Comprado</option>
                    <option value="instalado">✨ No Lar</option>
                  </select>
                </div>
              </div>

              {/* Link */}
              <div>
                <label className="block font-medium text-[#2D2327] dark:text-[#FAF4F0] mb-1">
                  Link do Produto na Loja
                </label>
                <input
                  type="url"
                  value={editLink}
                  onChange={(e) => setEditLink(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#FAF8F5] dark:bg-[#2D2228] border border-[#F2E8E4] dark:border-[#3D2F36] text-[#2D2327] dark:text-[#FAF4F0] focus:outline-none focus:ring-1 focus:ring-[#E07A8B]"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block font-medium text-[#2D2327] dark:text-[#FAF4F0] mb-1">
                  Anotações / Medidas
                </label>
                <textarea
                  rows={2}
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#FAF8F5] dark:bg-[#2D2228] border border-[#F2E8E4] dark:border-[#3D2F36] text-[#2D2327] dark:text-[#FAF4F0] focus:outline-none focus:ring-1 focus:ring-[#E07A8B]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="px-4 py-2 rounded-xl text-[#7D6F74] hover:bg-zinc-100 dark:hover:bg-zinc-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#E07A8B] hover:bg-[#d66a7c] text-white font-medium shadow-xs"
                >
                  Salvar Alterações
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {itemToDelete && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#241C21] rounded-3xl max-w-sm w-full p-6 border border-[#F2E8E4] dark:border-[#3D2F36] shadow-xl space-y-4">
            <div className="flex items-center gap-3 text-rose-600 dark:text-rose-400">
              <div className="p-3 rounded-full bg-rose-50 dark:bg-rose-950/50">
                <Trash2 className="w-6 h-6" />
              </div>
              <h3 className="font-serif font-bold text-lg text-[#2D2327] dark:text-[#FAF4F0]">
                Remover Objeto?
              </h3>
            </div>

            <p className="text-xs sm:text-sm text-[#7D6F74] dark:text-[#B8A8AF]">
              Tem certeza que deseja remover <strong>"{itemToDelete.name}"</strong> da lista do nosso lar?
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setItemToDelete(null)}
                className="px-4 py-2 rounded-xl text-xs sm:text-sm text-[#7D6F74] hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  onDeleteItem(itemToDelete.id);
                  setItemToDelete(null);
                }}
                className="px-4 py-2 rounded-xl text-xs sm:text-sm bg-rose-600 hover:bg-rose-700 text-white font-medium shadow-xs"
              >
                Sim, Remover
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Manage Custom Rooms Modal */}
      {isManagingRoomsModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#241C21] rounded-3xl max-w-md w-full p-6 border border-[#F2E8E4] dark:border-[#3D2F36] shadow-xl space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[#F2E8E4] dark:border-[#3D2F36]">
              <div>
                <h3 className="font-serif font-bold text-lg text-[#2D2327] dark:text-[#FAF4F0]">
                  Gerenciar Cômodos do Cantinho
                </h3>
                <p className="text-xs text-[#7D6F74] dark:text-[#B8A8AF]">
                  Edite o nome de qualquer cômodo, adicione novos ou exclua.
                </p>
              </div>
              <button
                onClick={() => {
                  setIsManagingRoomsModalOpen(false);
                  setEditingRoomOriginal(null);
                }}
                className="text-xs text-[#7D6F74] hover:text-[#2D2327] dark:hover:text-white p-1 rounded-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Quick Add Room Input */}
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={customRoomInput}
                onChange={(e) => setCustomRoomInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    if (customRoomInput.trim()) {
                      handleAddCustomRoom(customRoomInput.trim());
                      setCustomRoomInput('');
                    }
                  }
                }}
                placeholder="Novo cômodo (ex: Jardim de Inverno)..."
                className="flex-1 px-3 py-2 rounded-xl bg-[#FAF8F5] dark:bg-[#2D2228] border border-[#F2E8E4] dark:border-[#3D2F36] text-xs text-[#2D2327] dark:text-[#FAF4F0] placeholder-[#A6999F] focus:outline-none focus:ring-1 focus:ring-[#E07A8B]"
              />
              <button
                type="button"
                onClick={() => {
                  if (customRoomInput.trim()) {
                    handleAddCustomRoom(customRoomInput.trim());
                    setCustomRoomInput('');
                  }
                }}
                className="px-3 py-2 rounded-xl bg-[#E07A8B] hover:bg-[#d66a7c] text-white text-xs font-semibold whitespace-nowrap cursor-pointer transition-colors shadow-xs"
              >
                + Adicionar
              </button>
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {allRooms.length === 0 ? (
                <p className="text-xs text-center py-6 text-[#7D6F74] dark:text-[#B8A8AF]">
                  Nenhum cômodo cadastrado.
                </p>
              ) : (
                allRooms.map((room) => {
                  const isEditingThis = editingRoomOriginal === room;
                  return (
                    <div
                      key={room}
                      className="flex items-center justify-between p-2.5 rounded-2xl bg-[#FAF8F5] dark:bg-[#2D2228] border border-[#F2E8E4] dark:border-[#3D2F36]"
                    >
                      {isEditingThis ? (
                        <div className="flex items-center gap-2 flex-1 mr-2">
                          <input
                            type="text"
                            autoFocus
                            value={editingRoomInput}
                            onChange={(e) => setEditingRoomInput(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleSaveEditedRoom(room);
                              }
                            }}
                            className="flex-1 px-2.5 py-1.5 rounded-xl bg-white dark:bg-[#20171C] border border-[#E07A8B] text-xs text-[#2D2327] dark:text-[#FAF4F0] focus:outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => handleSaveEditedRoom(room)}
                            className="px-2.5 py-1.5 rounded-xl bg-[#E07A8B] text-white text-xs font-semibold hover:opacity-90 cursor-pointer"
                          >
                            Salvar
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingRoomOriginal(null)}
                            className="px-2 py-1.5 text-xs text-[#7D6F74] hover:text-zinc-900 dark:hover:text-white cursor-pointer"
                          >
                            Cancelar
                          </button>
                        </div>
                      ) : (
                        <>
                          <span className="text-xs sm:text-sm font-medium text-[#2D2327] dark:text-[#FAF4F0]">
                            {room}
                          </span>
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingRoomOriginal(room);
                                setEditingRoomInput(room);
                              }}
                              className="p-1.5 rounded-lg text-[#7D6F74] dark:text-[#B8A8AF] hover:text-[#E07A8B] hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                              title="Editar nome do cômodo"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteRoom(room)}
                              className="p-1.5 rounded-lg text-[#7D6F74] dark:text-[#B8A8AF] hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                              title="Excluir cômodo"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            <div className="pt-2 border-t border-[#F2E8E4] dark:border-[#3D2F36]">
              <button
                type="button"
                onClick={() => {
                  setIsManagingRoomsModalOpen(false);
                  setEditingRoomOriginal(null);
                }}
                className="w-full py-2.5 rounded-2xl bg-[#E07A8B] hover:bg-[#d66a7c] text-white text-xs font-semibold transition-all shadow-xs cursor-pointer"
              >
                Concluído
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Manage Custom Categories Modal */}
      {isManagingCategoriesModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#241C21] rounded-3xl max-w-md w-full p-6 border border-[#F2E8E4] dark:border-[#3D2F36] shadow-xl space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[#F2E8E4] dark:border-[#3D2F36]">
              <div>
                <h3 className="font-serif font-bold text-lg text-[#2D2327] dark:text-[#FAF4F0]">
                  Gerenciar Categorias de Decoração
                </h3>
                <p className="text-xs text-[#7D6F74] dark:text-[#B8A8AF]">
                  Edite o nome de qualquer categoria, adicione novas ou exclua.
                </p>
              </div>
              <button
                onClick={() => {
                  setIsManagingCategoriesModalOpen(false);
                  setEditingCategoryOriginal(null);
                }}
                className="text-xs text-[#7D6F74] hover:text-[#2D2327] dark:hover:text-white p-1 rounded-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Quick Add Category Input */}
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={customCatInput}
                onChange={(e) => setCustomCatInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    if (customCatInput.trim()) {
                      handleAddCustomCategory(customCatInput.trim());
                      setCustomCatInput('');
                    }
                  }
                }}
                placeholder="Nova categoria (ex: Cortinas, Quadros)..."
                className="flex-1 px-3 py-2 rounded-xl bg-[#FAF8F5] dark:bg-[#2D2228] border border-[#F2E8E4] dark:border-[#3D2F36] text-xs text-[#2D2327] dark:text-[#FAF4F0] placeholder-[#A6999F] focus:outline-none focus:ring-1 focus:ring-[#E07A8B]"
              />
              <button
                type="button"
                onClick={() => {
                  if (customCatInput.trim()) {
                    handleAddCustomCategory(customCatInput.trim());
                    setCustomCatInput('');
                  }
                }}
                className="px-3 py-2 rounded-xl bg-[#E07A8B] hover:bg-[#d66a7c] text-white text-xs font-semibold whitespace-nowrap cursor-pointer transition-colors shadow-xs"
              >
                + Adicionar
              </button>
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {allCategories.length === 0 ? (
                <p className="text-xs text-center py-6 text-[#7D6F74] dark:text-[#B8A8AF]">
                  Nenhuma categoria cadastrada ainda.
                </p>
              ) : (
                allCategories.map((cat) => {
                  const isEditingThis = editingCategoryOriginal === cat;
                  return (
                    <div
                      key={cat}
                      className="flex items-center justify-between p-2.5 rounded-2xl bg-[#FAF8F5] dark:bg-[#2D2228] border border-[#F2E8E4] dark:border-[#3D2F36]"
                    >
                      {isEditingThis ? (
                        <div className="flex items-center gap-2 flex-1 mr-2">
                          <input
                            type="text"
                            autoFocus
                            value={editingCategoryInput}
                            onChange={(e) => setEditingCategoryInput(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleSaveEditedCategory(cat);
                              }
                            }}
                            className="flex-1 px-2.5 py-1.5 rounded-xl bg-white dark:bg-[#20171C] border border-[#E07A8B] text-xs text-[#2D2327] dark:text-[#FAF4F0] focus:outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => handleSaveEditedCategory(cat)}
                            className="px-2.5 py-1.5 rounded-xl bg-[#E07A8B] text-white text-xs font-semibold hover:opacity-90 cursor-pointer"
                          >
                            Salvar
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingCategoryOriginal(null)}
                            className="px-2 py-1.5 text-xs text-[#7D6F74] hover:text-zinc-900 dark:hover:text-white cursor-pointer"
                          >
                            Cancelar
                          </button>
                        </div>
                      ) : (
                        <>
                          <span className="text-xs sm:text-sm font-medium text-[#2D2327] dark:text-[#FAF4F0]">
                            {cat}
                          </span>
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingCategoryOriginal(cat);
                                setEditingCategoryInput(cat);
                              }}
                              className="p-1.5 rounded-lg text-[#7D6F74] dark:text-[#B8A8AF] hover:text-[#E07A8B] hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                              title="Editar nome da categoria"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteCategory(cat)}
                              className="p-1.5 rounded-lg text-[#7D6F74] dark:text-[#B8A8AF] hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                              title="Excluir categoria"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            <div className="pt-2 border-t border-[#F2E8E4] dark:border-[#3D2F36]">
              <button
                type="button"
                onClick={() => {
                  setIsManagingCategoriesModalOpen(false);
                  setEditingCategoryOriginal(null);
                }}
                className="w-full py-2.5 rounded-2xl bg-[#E07A8B] hover:bg-[#d66a7c] text-white text-xs font-semibold transition-all shadow-xs cursor-pointer"
              >
                Concluído
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
