import React, { useState, useRef } from 'react';
import {
  ShoppingBag,
  Package,
  Plus,
  CheckCircle2,
  Circle,
  AlertTriangle,
  Clock,
  Trash2,
  Edit3,
  ExternalLink,
  Copy,
  Check,
  Send,
  ArrowRight,
  TrendingDown,
  Sparkles,
  Camera,
  Loader2,
  UploadCloud,
} from 'lucide-react';
import {
  GroceryItem,
  PantryItem,
  PantryCategory,
  PartnerId,
  CoupleProfile,
} from '../types';
import { PartnerAvatar } from './PartnerAvatar';

interface PantryAndGroceryViewProps {
  groceries: GroceryItem[];
  pantry: PantryItem[];
  profile: CoupleProfile;
  activePartner: PartnerId;
  onAddGrocery: (item: Omit<GroceryItem, 'id'>) => void;
  onUpdateGrocery?: (item: GroceryItem) => void;
  onToggleGrocery: (id: string) => void;
  onDeleteGrocery: (id: string) => void;
  onClearCheckedGroceries: () => void;
  onAddPantryItem: (item: Omit<PantryItem, 'id'>) => void;
  onUpdatePantryItem?: (item: PantryItem) => void;
  onUpdatePantryQuantity: (id: string, delta: number) => void;
  onDeletePantryItem: (id: string) => void;
  onMovePantryToGrocery: (pantryItem: PantryItem) => void;
}

export const PantryAndGroceryView: React.FC<PantryAndGroceryViewProps> = ({
  groceries,
  pantry,
  profile,
  activePartner,
  onAddGrocery,
  onUpdateGrocery,
  onToggleGrocery,
  onDeleteGrocery,
  onClearCheckedGroceries,
  onAddPantryItem,
  onUpdatePantryItem,
  onUpdatePantryQuantity,
  onDeletePantryItem,
  onMovePantryToGrocery,
}) => {
  const [subTab, setSubTab] = useState<'groceries' | 'pantry'>('groceries');
  const [groceryFilter, setGroceryFilter] = useState<'all' | 'partner1' | 'partner2'>('all');
  const [isAddGroceryModalOpen, setIsAddGroceryModalOpen] = useState(false);
  const [isAddPantryModalOpen, setIsAddPantryModalOpen] = useState(false);
  const [copiedSuccess, setCopiedSuccess] = useState(false);

  // OCR Photo scanning states
  const fileInputRef = useRef<HTMLInputElement>(null);
  const modalFileInputRef = useRef<HTMLInputElement>(null);
  const [isScanningPhoto, setIsScanningPhoto] = useState(false);
  const [scanMessage, setScanMessage] = useState<string | null>(null);

  // New grocery form
  const [newGroceryName, setNewGroceryName] = useState('');
  const [newGroceryCategory, setNewGroceryCategory] = useState('Hortifruti');
  const [newGroceryQuantity, setNewGroceryQuantity] = useState('1 un');
  const [newGroceryPrice, setNewGroceryPrice] = useState('');

  // Edit grocery form
  const [editingGrocery, setEditingGrocery] = useState<GroceryItem | null>(null);
  const [editGroceryName, setEditGroceryName] = useState('');
  const [editGroceryCategory, setEditGroceryCategory] = useState('Hortifruti');
  const [editGroceryQuantity, setEditGroceryQuantity] = useState('1 un');
  const [editGroceryPrice, setEditGroceryPrice] = useState('');

  // New pantry form
  const [newPantryName, setNewPantryName] = useState('');
  const [newPantryCategory, setNewPantryCategory] = useState<PantryCategory>('Laticínios & Frios');
  const [newPantryQuantity, setNewPantryQuantity] = useState('1');
  const [newPantryUnit, setNewPantryUnit] = useState<PantryItem['unit']>('un');
  const [newPantryMin, setNewPantryMin] = useState('1');
  const [newPantryExpDate, setNewPantryExpDate] = useState('');
  const [newPantryNotes, setNewPantryNotes] = useState('');

  // Edit pantry form
  const [editingPantry, setEditingPantry] = useState<PantryItem | null>(null);
  const [editPantryName, setEditPantryName] = useState('');
  const [editPantryCategory, setEditPantryCategory] = useState<PantryCategory>('Laticínios & Frios');
  const [editPantryQuantity, setEditPantryQuantity] = useState('1');
  const [editPantryUnit, setEditPantryUnit] = useState<PantryItem['unit']>('un');
  const [editPantryMin, setEditPantryMin] = useState('1');
  const [editPantryExpDate, setEditPantryExpDate] = useState('');
  const [editPantryNotes, setEditPantryNotes] = useState('');

  const currentPartner = activePartner === 'partner1' ? profile.partner1 : profile.partner2;

  // Grocery statistics
  const totalPendingGroceries = groceries.filter((g) => !g.checked);
  const totalCheckedGroceries = groceries.filter((g) => g.checked);
  const estimatedTotalCost = groceries.reduce((acc, curr) => acc + (curr.estimatedPrice || 0), 0);

  // Photo scan handler using Gemini Vision API
  const handleScanProductPhoto = async (file: File) => {
    if (!file) return;
    setIsScanningPhoto(true);
    setScanMessage('Lendo embalagem e data de validade com IA...');

    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64Data = reader.result as string;
        try {
          const res = await fetch('/api/ai/scan-product', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              imageBase64: base64Data,
              mimeType: file.type || 'image/jpeg',
            }),
          });

          if (!res.ok) {
            throw new Error('Falha ao processar foto');
          }

          const result = await res.json();
          if (result.name) {
            setNewPantryName(result.name);
          }
          if (result.category) {
            setNewPantryCategory(result.category as PantryCategory);
          }
          if (result.expirationDate) {
            setNewPantryExpDate(result.expirationDate);
          }
          if (result.quantity) {
            setNewPantryQuantity(String(result.quantity));
          }
          if (result.unit) {
            setNewPantryUnit(result.unit as any);
          }
          if (result.notes) {
            setNewPantryNotes(result.notes);
          }

          setIsAddPantryModalOpen(true);
          setScanMessage('✨ Dados do produto e validade reconhecidos! Confira e salve.');
          setTimeout(() => setScanMessage(null), 5000);
        } catch (err: any) {
          console.error('Erro no scan:', err);
          setScanMessage('Não foi possível ler a foto com precisão. Você pode preencher manualmente.');
          setTimeout(() => setScanMessage(null), 4000);
          setIsAddPantryModalOpen(true);
        } finally {
          setIsScanningPhoto(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (e) {
      console.error(e);
      setIsScanningPhoto(false);
    }
  };

  // Calculate days until expiration for pantry items
  const getExpirationStatus = (dateStr: string) => {
    if (!dateStr) return { days: 999, label: 'Sem data', status: 'ok' };
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const exp = new Date(dateStr + 'T00:00:00');
    const diffTime = exp.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return { days: diffDays, label: `Venceu há ${Math.abs(diffDays)} dias`, status: 'expired' };
    if (diffDays === 0) return { days: 0, label: 'Vence hoje!', status: 'critical' };
    if (diffDays === 1) return { days: 1, label: 'Vence amanhã!', status: 'critical' };
    if (diffDays <= 3) return { days: diffDays, label: `Vence em ${diffDays} dias!`, status: 'critical' };
    if (diffDays <= 7) return { days: diffDays, label: `Vence em ${diffDays} dias`, status: 'warning' };
    return { days: diffDays, label: `Validade: ${exp.toLocaleDateString('pt-BR')}`, status: 'ok' };
  };

  // Urgent expiring items
  const expiringPantryItems = pantry
    .map((item) => ({ item, exp: getExpirationStatus(item.expirationDate) }))
    .filter((x) => x.exp.days <= 4)
    .sort((a, b) => a.exp.days - b.exp.days);

  const handleCreateGrocery = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroceryName.trim()) return;

    onAddGrocery({
      name: newGroceryName.trim(),
      category: newGroceryCategory,
      quantity: newGroceryQuantity.trim() || '1 un',
      checked: false,
      estimatedPrice: newGroceryPrice ? parseFloat(newGroceryPrice) : undefined,
      addedBy: activePartner,
    });

    setNewGroceryName('');
    setNewGroceryQuantity('1 un');
    setNewGroceryPrice('');
    setIsAddGroceryModalOpen(false);
  };

  const handleOpenEditGrocery = (item: GroceryItem) => {
    setEditingGrocery(item);
    setEditGroceryName(item.name);
    setEditGroceryCategory(item.category);
    setEditGroceryQuantity(item.quantity);
    setEditGroceryPrice(item.estimatedPrice ? String(item.estimatedPrice) : '');
  };

  const handleSaveEditGrocery = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingGrocery || !editGroceryName.trim()) return;

    if (onUpdateGrocery) {
      onUpdateGrocery({
        ...editingGrocery,
        name: editGroceryName.trim(),
        category: editGroceryCategory,
        quantity: editGroceryQuantity.trim() || '1 un',
        estimatedPrice: editGroceryPrice ? parseFloat(editGroceryPrice) : undefined,
      });
    }
    setEditingGrocery(null);
  };

  const handleCreatePantryItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPantryName.trim()) return;

    onAddPantryItem({
      name: newPantryName.trim(),
      category: newPantryCategory,
      quantity: parseFloat(newPantryQuantity) || 1,
      unit: newPantryUnit,
      minQuantity: parseFloat(newPantryMin) || 1,
      expirationDate: newPantryExpDate,
      addedBy: activePartner,
      notes: newPantryNotes.trim() || undefined,
    });

    setNewPantryName('');
    setNewPantryQuantity('1');
    setNewPantryExpDate('');
    setNewPantryNotes('');
    setIsAddPantryModalOpen(false);
  };

  const handleOpenEditPantry = (item: PantryItem) => {
    setEditingPantry(item);
    setEditPantryName(item.name);
    setEditPantryCategory(item.category);
    setEditPantryQuantity(String(item.quantity));
    setEditPantryUnit(item.unit);
    setEditPantryMin(String(item.minQuantity));
    setEditPantryExpDate(item.expirationDate || '');
    setEditPantryNotes(item.notes || '');
  };

  const handleSaveEditPantry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPantry || !editPantryName.trim()) return;

    if (onUpdatePantryItem) {
      onUpdatePantryItem({
        ...editingPantry,
        name: editPantryName.trim(),
        category: editPantryCategory,
        quantity: parseFloat(editPantryQuantity) || 1,
        unit: editPantryUnit,
        minQuantity: parseFloat(editPantryMin) || 1,
        expirationDate: editPantryExpDate,
        notes: editPantryNotes.trim() || undefined,
      });
    }
    setEditingPantry(null);
  };

  const handleCopyShoppingList = () => {
    const listText = `🛒 Lista de compras\n\n` +
      totalPendingGroceries
        .map((item) => `▫️ ${item.name} (${item.quantity})`)
        .join('\n');

    navigator.clipboard.writeText(listText);
    setCopiedSuccess(true);
    setTimeout(() => setCopiedSuccess(false), 2500);
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Sub-tab Switcher */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-serif text-2xl font-bold text-[#2D2327] dark:text-[#FAF4F0]">
            Mercado & Despensa Inteligente
          </h2>
          <p className="text-xs sm:text-sm text-[#7D6F74] dark:text-[#B8A8AF] mt-0.5">
            Lista sincronizada em tempo real, controle de validade de perecíveis e reposição com 1 clique.
          </p>
        </div>

        {/* Sub-tab Pills */}
        <div className="w-full sm:w-auto grid grid-cols-2 p-1 rounded-2xl bg-white dark:bg-[#241C21] border border-[#F2E8E4] dark:border-[#3D2F36] shadow-xs">
          <button
            onClick={() => setSubTab('groceries')}
            className={`flex items-center justify-center gap-1.5 px-2.5 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
              subTab === 'groceries'
                ? 'bg-[#E07A8B] text-white shadow-xs'
                : 'text-[#7D6F74] dark:text-[#B8A8AF] hover:text-[#2D2327] dark:hover:text-white'
            }`}
          >
            <ShoppingBag className="w-4 h-4 shrink-0" />
            <span>Lista de Compras ({totalPendingGroceries.length})</span>
          </button>

          <button
            onClick={() => setSubTab('pantry')}
            className={`flex items-center justify-center gap-1.5 px-2.5 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
              subTab === 'pantry'
                ? 'bg-[#E07A8B] text-white shadow-xs'
                : 'text-[#7D6F74] dark:text-[#B8A8AF] hover:text-[#2D2327] dark:hover:text-white'
            }`}
          >
            <Package className="w-4 h-4 shrink-0" />
            <span>Despensa ({pantry.length})</span>
          </button>
        </div>
      </div>

      {/* Perishables Expiration Alert Banner */}
      {expiringPantryItems.length > 0 && (
        <div className="p-4 rounded-3xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-2xl bg-amber-100 dark:bg-amber-900/70 text-amber-700 dark:text-amber-300">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-bold text-amber-900 dark:text-amber-200">
                Alerta de Produtos Perecíveis Próximos do Vencimento!
              </h4>
              <p className="text-xs text-amber-800/80 dark:text-amber-300/80 mt-0.5">
                {expiringPantryItems.map((x) => `${x.item.name} (${x.exp.label})`).join(', ')}.
                Que tal aproveitá-los no cardápio de hoje para evitar desperdício?
              </p>
            </div>
          </div>

          <button
            onClick={() => setSubTab('pantry')}
            className="px-3.5 py-1.5 rounded-xl bg-amber-200/80 dark:bg-amber-800 text-amber-900 dark:text-amber-100 text-xs font-semibold whitespace-nowrap hover:bg-amber-300 dark:hover:bg-amber-700 transition-colors"
          >
            Ver na Despensa
          </button>
        </div>
      )}

      {/* TAB 1: GROCERY LIST */}
      {subTab === 'groceries' && (
        <div className="space-y-4">
          {/* Action Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl bg-white dark:bg-[#241C21] border border-[#F2E8E4] dark:border-[#3D2F36]">
            <div className="flex items-center gap-3 text-xs sm:text-sm">
              <span className="text-[#7D6F74] dark:text-[#B8A8AF]">
                Itens pendentes:{' '}
                <strong className="text-[#2D2327] dark:text-[#FAF4F0]">
                  {totalPendingGroceries.length}
                </strong>
              </span>
              <span className="hidden sm:inline text-zinc-300 dark:text-zinc-700">|</span>
              <span className="text-[#7D6F74] dark:text-[#B8A8AF]">
                Estimativa total:{' '}
                <strong className="text-emerald-600 dark:text-emerald-400">
                  R$ {estimatedTotalCost.toFixed(2)}
                </strong>
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleCopyShoppingList}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#FAF3EC] dark:bg-[#2D2228] text-[#7D6F74] dark:text-[#B8A8AF] hover:text-[#2D2327] dark:hover:text-white text-xs font-semibold transition-colors"
                title="Copiar lista formatada"
              >
                {copiedSuccess ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                    <span className="text-emerald-600">Copiada!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copiar Lista</span>
                  </>
                )}
              </button>

              {totalCheckedGroceries.length > 0 && (
                <button
                  onClick={onClearCheckedGroceries}
                  className="text-xs text-[#7D6F74] dark:text-[#B8A8AF] hover:text-rose-500 px-2 py-1"
                  title="Limpar itens marcados como comprados"
                >
                  Limpar comprados
                </button>
              )}

              <button
                onClick={() => setIsAddGroceryModalOpen(true)}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#E07A8B] hover:bg-[#d66a7c] text-white text-xs font-semibold shadow-2xs transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Adicionar Item</span>
              </button>
            </div>
          </div>

          {/* Author filter for groceries */}
          <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-[#FAF8F5] dark:bg-[#20181D] border border-[#F2E8E4] dark:border-[#3D2F36] overflow-x-auto text-xs">
            <span className="text-[11px] font-semibold text-[#7D6F74] dark:text-[#B8A8AF] px-2">Quem adicionou:</span>
            <button
              onClick={() => setGroceryFilter('all')}
              className={`px-3 py-1 rounded-xl transition-all ${
                groceryFilter === 'all'
                  ? 'bg-white dark:bg-[#3D2F36] font-bold shadow-xs text-[#2D2327] dark:text-[#FAF4F0]'
                  : 'text-[#7D6F74] dark:text-[#B8A8AF]'
              }`}
            >
              Todos ({groceries.length})
            </button>
            <button
              onClick={() => setGroceryFilter('partner1')}
              className={`px-3 py-1 rounded-xl transition-all flex items-center gap-1.5 ${
                groceryFilter === 'partner1'
                  ? 'bg-white dark:bg-[#3D2F36] font-bold shadow-xs text-[#2D2327] dark:text-[#FAF4F0]'
                  : 'text-[#7D6F74] dark:text-[#B8A8AF]'
              }`}
            >
              <PartnerAvatar avatar={profile.partner1.avatar} name={profile.partner1.name} size="xs" />
              <span>{profile.partner1.nickname || profile.partner1.name}</span>
            </button>
            <button
              onClick={() => setGroceryFilter('partner2')}
              className={`px-3 py-1 rounded-xl transition-all flex items-center gap-1.5 ${
                groceryFilter === 'partner2'
                  ? 'bg-white dark:bg-[#3D2F36] font-bold shadow-xs text-[#2D2327] dark:text-[#FAF4F0]'
                  : 'text-[#7D6F74] dark:text-[#B8A8AF]'
              }`}
            >
              <PartnerAvatar avatar={profile.partner2.avatar} name={profile.partner2.name} size="xs" />
              <span>{profile.partner2.nickname || profile.partner2.name}</span>
            </button>
          </div>

          {/* Groceries List */}
          {groceries.length === 0 ? (
            <div className="py-16 text-center rounded-3xl bg-white dark:bg-[#241C21] border border-[#F2E8E4] dark:border-[#3D2F36]">
              <ShoppingBag className="w-10 h-10 mx-auto text-[#E07A8B]/60 mb-2" />
              <p className="text-sm font-semibold text-[#2D2327] dark:text-[#FAF4F0]">
                Lista de compras vazia!
              </p>
              <p className="text-xs text-[#7D6F74] dark:text-[#B8A8AF] mt-1">
                Tudo abastecido ou que tal adicionar o que precisamos para a semana?
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {groceries
                .filter((g) => {
                  if (groceryFilter === 'partner1') return g.addedBy === 'partner1';
                  if (groceryFilter === 'partner2') return g.addedBy === 'partner2';
                  return true;
                })
                .map((item) => {
                  const addedPartner =
                    item.addedBy === 'partner1' ? profile.partner1 : profile.partner2;

                  return (
                    <div
                      key={item.id}
                      className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all ${
                        item.checked
                          ? 'bg-[#FAF8F5]/60 dark:bg-[#20181D]/60 border-[#F2E8E4]/50 dark:border-[#33252C]/50 opacity-60'
                          : 'bg-white dark:bg-[#241C21] border-[#F2E8E4] dark:border-[#3D2F36] shadow-xs'
                      }`}
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0 mr-2">
                        <button
                          onClick={() => onToggleGrocery(item.id)}
                          className="p-1 text-[#E07A8B] hover:scale-110 transition-transform shrink-0"
                        >
                          {item.checked ? (
                            <CheckCircle2 className="w-5 h-5 fill-[#E07A8B] text-white" />
                          ) : (
                            <Circle className="w-5 h-5 text-zinc-300 dark:text-zinc-600" />
                          )}
                        </button>

                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span
                              className={`text-xs sm:text-sm font-medium ${
                                item.checked
                                  ? 'line-through text-[#7D6F74] dark:text-[#B8A8AF]'
                                  : 'text-[#2D2327] dark:text-[#FAF4F0]'
                              }`}
                            >
                              {item.name}
                            </span>
                            <span className="text-xs text-[#7D6F74] dark:text-[#B8A8AF] font-normal">
                              ({item.quantity})
                            </span>
                          </div>

                          <div className="flex items-center gap-2 mt-0.5 text-[10px] text-[#A6999F] dark:text-[#8C7C83]">
                            <span className="px-1.5 py-0.2 rounded-md bg-[#FAF3EC] dark:bg-[#2C2127] text-[#D4A373] dark:text-[#EAD5C3]">
                              {item.category}
                            </span>
                            <span>•</span>
                            <span className="inline-flex items-center gap-1 font-semibold text-[#2D2327] dark:text-[#FAF4F0]">
                              <PartnerAvatar avatar={addedPartner.avatar} name={addedPartner.name} size="xs" />
                              <span>{addedPartner.nickname || addedPartner.name}</span>
                            </span>
                            {item.estimatedPrice && (
                              <>
                                <span>•</span>
                                <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                                  R$ {item.estimatedPrice.toFixed(2)}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => handleOpenEditGrocery(item)}
                        className="p-1.5 text-zinc-400 hover:text-[#E07A8B] hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors"
                        title="Editar item da lista"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onDeleteGrocery(item.id)}
                        className="p-1.5 text-zinc-400 hover:text-rose-500 rounded-lg transition-colors"
                        title="Remover item"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: PANTRY & EXPIRATION DATES */}
      {subTab === 'pantry' && (
        <div className="space-y-4">
          {/* Hidden file input for camera/photo scan */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                handleScanProductPhoto(e.target.files[0]);
                e.target.value = '';
              }
            }}
          />

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 rounded-2xl bg-white dark:bg-[#241C21] border border-[#F2E8E4] dark:border-[#3D2F36]">
            <div>
              <p className="text-xs sm:text-sm text-[#7D6F74] dark:text-[#B8A8AF]">
                Total de <strong className="text-[#2D2327] dark:text-[#FAF4F0]">{pantry.length}</strong> itens monitorados na despensa.
              </p>
              {scanMessage && (
                <p className="text-xs font-medium text-[#E07A8B] mt-0.5 animate-pulse">
                  {scanMessage}
                </p>
              )}
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isScanningPhoto}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-[#E07A8B]/15 to-[#D4A373]/20 hover:from-[#E07A8B]/25 hover:to-[#D4A373]/30 text-[#E07A8B] dark:text-[#F3A6B5] border border-[#E07A8B]/30 text-xs font-semibold shadow-2xs transition-colors"
                title="Tirar foto do produto ou da data de validade para a IA preencher"
              >
                {isScanningPhoto ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Lendo foto...</span>
                  </>
                ) : (
                  <>
                    <Camera className="w-3.5 h-3.5" />
                    <span>Foto / Validade com IA</span>
                  </>
                )}
              </button>

              <button
                onClick={() => setIsAddPantryModalOpen(true)}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#E07A8B] hover:bg-[#d66a7c] text-white text-xs font-semibold shadow-2xs transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Cadastrar Item</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {pantry.map((item) => {
              const exp = getExpirationStatus(item.expirationDate);
              const isLowStock = item.quantity <= item.minQuantity;

              return (
                <div
                  key={item.id}
                  className="flex flex-col justify-between p-4 rounded-3xl bg-white dark:bg-[#241C21] border border-[#F2E8E4] dark:border-[#3D2F36] shadow-xs hover:shadow-md transition-all space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] uppercase font-bold tracking-wider text-[#D4A373] dark:text-[#EAD5C3]">
                        {item.category}
                      </span>
                      <h4 className="font-serif font-bold text-base text-[#2D2327] dark:text-[#FAF4F0] mt-0.5">
                        {item.name}
                      </h4>
                      {item.notes && (
                        <p className="text-[11px] text-[#7D6F74] dark:text-[#B8A8AF] italic mt-0.5">
                          {item.notes}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenEditPantry(item)}
                        className="p-1 text-zinc-400 hover:text-[#E07A8B] hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-md transition-colors"
                        title="Editar item da despensa"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onDeletePantryItem(item.id)}
                        className="p-1 text-zinc-300 hover:text-rose-500 rounded-md transition-colors"
                        title="Excluir item"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Expiration Pill */}
                  <div className="flex items-center justify-between text-xs">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                        exp.status === 'expired' || exp.status === 'critical'
                          ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-200 animate-pulse'
                          : exp.status === 'warning'
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200'
                          : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200'
                      }`}
                    >
                      <Clock className="w-3 h-3" />
                      <span>{exp.label}</span>
                    </span>

                    {isLowStock && (
                      <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded-md">
                        Estoque Baixo!
                      </span>
                    )}
                  </div>

                  {/* Quantity adjustment & Quick Add to Grocery */}
                  <div className="pt-2 border-t border-[#F2E8E4] dark:border-[#3D2F36] flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onUpdatePantryQuantity(item.id, -1)}
                        className="w-7 h-7 rounded-lg bg-[#FAF8F5] dark:bg-[#2D2228] border border-[#F2E8E4] dark:border-[#3D2F36] text-[#2D2327] dark:text-[#FAF4F0] font-bold text-sm flex items-center justify-center hover:bg-[#F2E8E4]"
                      >
                        -
                      </button>
                      <span className="font-bold text-xs sm:text-sm text-[#2D2327] dark:text-[#FAF4F0] min-w-[40px] text-center">
                        {item.quantity} {item.unit}
                      </span>
                      <button
                        onClick={() => onUpdatePantryQuantity(item.id, 1)}
                        className="w-7 h-7 rounded-lg bg-[#FAF8F5] dark:bg-[#2D2228] border border-[#F2E8E4] dark:border-[#3D2F36] text-[#2D2327] dark:text-[#FAF4F0] font-bold text-sm flex items-center justify-center hover:bg-[#F2E8E4]"
                      >
                        +
                      </button>
                    </div>

                    <button
                      onClick={() => onMovePantryToGrocery(item)}
                      className="flex items-center gap-1 text-[11px] font-semibold text-[#E07A8B] hover:text-rose-600"
                      title="Adicionar à lista de compras"
                    >
                      <ShoppingBag className="w-3.5 h-3.5" />
                      <span>Repor</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Add Grocery Modal */}
      {isAddGroceryModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#241C21] rounded-3xl max-w-md w-full p-6 border border-[#F2E8E4] dark:border-[#3D2F36] shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#F2E8E4] dark:border-[#3D2F36]">
              <h3 className="font-serif font-bold text-lg text-[#2D2327] dark:text-[#FAF4F0]">
                Novo Item para o Mercado
              </h3>
              <button
                onClick={() => setIsAddGroceryModalOpen(false)}
                className="text-xs text-[#7D6F74] hover:text-black dark:hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateGrocery} className="space-y-3 text-xs sm:text-sm">
              <div>
                <label className="block font-medium text-[#2D2327] dark:text-[#FAF4F0] mb-1">
                  Nome do Item *
                </label>
                <input
                  type="text"
                  required
                  value={newGroceryName}
                  onChange={(e) => setNewGroceryName(e.target.value)}
                  placeholder="Ex: Iogurte Grego ou Morangos"
                  className="w-full px-3 py-2 rounded-xl bg-[#FAF8F5] dark:bg-[#2D2228] border border-[#F2E8E4] dark:border-[#3D2F36] text-[#2D2327] dark:text-[#FAF4F0] focus:outline-none focus:ring-1 focus:ring-[#E07A8B]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-[#2D2327] dark:text-[#FAF4F0] mb-1">
                    Categoria
                  </label>
                  <select
                    value={newGroceryCategory}
                    onChange={(e) => setNewGroceryCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#FAF8F5] dark:bg-[#2D2228] border border-[#F2E8E4] dark:border-[#3D2F36] text-[#2D2327] dark:text-[#FAF4F0] focus:outline-none focus:ring-1 focus:ring-[#E07A8B]"
                  >
                    <option value="Hortifruti">Hortifruti</option>
                    <option value="Laticínios & Frios">Laticínios & Frios</option>
                    <option value="Carnes & Peixes">Carnes & Peixes</option>
                    <option value="Mercearia & Grãos">Mercearia & Grãos</option>
                    <option value="Bebidas">Bebidas</option>
                    <option value="Temperos & Molhos">Temperos & Molhos</option>
                    <option value="Higiene & Limpeza">Higiene & Limpeza</option>
                    <option value="Outros">Outros</option>
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-[#2D2327] dark:text-[#FAF4F0] mb-1">
                    Quantidade
                  </label>
                  <input
                    type="text"
                    value={newGroceryQuantity}
                    onChange={(e) => setNewGroceryQuantity(e.target.value)}
                    placeholder="1 kg ou 2 bandejas"
                    className="w-full px-3 py-2 rounded-xl bg-[#FAF8F5] dark:bg-[#2D2228] border border-[#F2E8E4] dark:border-[#3D2F36] text-[#2D2327] dark:text-[#FAF4F0] focus:outline-none focus:ring-1 focus:ring-[#E07A8B]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-[#2D2327] dark:text-[#FAF4F0] mb-1">
                  Preço Estimado (R$, opcional)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={newGroceryPrice}
                  onChange={(e) => setNewGroceryPrice(e.target.value)}
                  placeholder="Ex: 14.50"
                  className="w-full px-3 py-2 rounded-xl bg-[#FAF8F5] dark:bg-[#2D2228] border border-[#F2E8E4] dark:border-[#3D2F36] text-[#2D2327] dark:text-[#FAF4F0] focus:outline-none focus:ring-1 focus:ring-[#E07A8B]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddGroceryModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-[#7D6F74] hover:bg-zinc-100 dark:hover:bg-zinc-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#E07A8B] text-white font-medium shadow-xs"
                >
                  Salvar Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Pantry Modal */}
      {isAddPantryModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#241C21] rounded-3xl max-w-md w-full p-6 border border-[#F2E8E4] dark:border-[#3D2F36] shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#F2E8E4] dark:border-[#3D2F36]">
              <h3 className="font-serif font-bold text-lg text-[#2D2327] dark:text-[#FAF4F0]">
                Cadastrar Item na Despensa
              </h3>
              <button
                onClick={() => setIsAddPantryModalOpen(false)}
                className="text-xs text-[#7D6F74] hover:text-black dark:hover:text-white"
              >
                ✕
              </button>
            </div>

            {/* AI Photo Scan Banner inside Modal */}
            <input
              ref={modalFileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleScanProductPhoto(e.target.files[0]);
                  e.target.value = '';
                }
              }}
            />
            <div className="p-3 rounded-2xl bg-gradient-to-r from-[#E07A8B]/10 to-[#D4A373]/15 dark:from-[#2c1d25] dark:to-[#2c241d] border border-[#E07A8B]/20 dark:border-rose-900/40 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-[#E07A8B]/20 text-[#E07A8B] flex items-center justify-center shrink-0">
                  <Camera className="w-4 h-4" />
                </div>
                <div className="min-w-0 text-xs">
                  <p className="font-semibold text-[#2D2327] dark:text-[#FAF4F0]">
                    Tirar foto do produto ou validade
                  </p>
                  <p className="text-[11px] text-[#7D6F74] dark:text-[#B8A8AF] truncate">
                    Reconhece o item e preenche a validade automaticamente!
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => modalFileInputRef.current?.click()}
                disabled={isScanningPhoto}
                className="px-3 py-1.5 rounded-xl bg-[#E07A8B] hover:bg-[#d66a7c] text-white text-xs font-semibold shrink-0 shadow-2xs flex items-center gap-1 transition-colors"
              >
                {isScanningPhoto ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Lendo...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Tirar Foto</span>
                  </>
                )}
              </button>
            </div>

            <form onSubmit={handleCreatePantryItem} className="space-y-3 text-xs sm:text-sm">
              <div>
                <label className="block font-medium text-[#2D2327] dark:text-[#FAF4F0] mb-1">
                  Nome do Produto *
                </label>
                <input
                  type="text"
                  required
                  value={newPantryName}
                  onChange={(e) => setNewPantryName(e.target.value)}
                  placeholder="Ex: Queijo Parmesão"
                  className="w-full px-3 py-2 rounded-xl bg-[#FAF8F5] dark:bg-[#2D2228] border border-[#F2E8E4] dark:border-[#3D2F36] text-[#2D2327] dark:text-[#FAF4F0] focus:outline-none focus:ring-1 focus:ring-[#E07A8B]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-[#2D2327] dark:text-[#FAF4F0] mb-1">
                    Categoria
                  </label>
                  <select
                    value={newPantryCategory}
                    onChange={(e) => setNewPantryCategory(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-[#FAF8F5] dark:bg-[#2D2228] border border-[#F2E8E4] dark:border-[#3D2F36] text-[#2D2327] dark:text-[#FAF4F0] focus:outline-none focus:ring-1 focus:ring-[#E07A8B]"
                  >
                    <option value="Hortifruti">Hortifruti</option>
                    <option value="Laticínios & Frios">Laticínios & Frios</option>
                    <option value="Carnes & Peixes">Carnes & Peixes</option>
                    <option value="Mercearia & Grãos">Mercearia & Grãos</option>
                    <option value="Bebidas">Bebidas</option>
                    <option value="Temperos & Molhos">Temperos & Molhos</option>
                    <option value="Congelados">Congelados</option>
                    <option value="Higiene & Limpeza">Higiene & Limpeza</option>
                    <option value="Outros">Outros</option>
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-[#2D2327] dark:text-[#FAF4F0] mb-1">
                    Unidade
                  </label>
                  <select
                    value={newPantryUnit}
                    onChange={(e) => setNewPantryUnit(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-[#FAF8F5] dark:bg-[#2D2228] border border-[#F2E8E4] dark:border-[#3D2F36] text-[#2D2327] dark:text-[#FAF4F0] focus:outline-none focus:ring-1 focus:ring-[#E07A8B]"
                  >
                    <option value="un">un (unidade)</option>
                    <option value="kg">kg</option>
                    <option value="g">g</option>
                    <option value="L">L (litro)</option>
                    <option value="ml">ml</option>
                    <option value="pct">pct (pacote)</option>
                    <option value="lata">lata</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-[#2D2327] dark:text-[#FAF4F0] mb-1">
                    Quantidade Atual
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={newPantryQuantity}
                    onChange={(e) => setNewPantryQuantity(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#FAF8F5] dark:bg-[#2D2228] border border-[#F2E8E4] dark:border-[#3D2F36] text-[#2D2327] dark:text-[#FAF4F0] focus:outline-none focus:ring-1 focus:ring-[#E07A8B]"
                  />
                </div>

                <div>
                  <label className="block font-medium text-[#2D2327] dark:text-[#FAF4F0] mb-1">
                    Estoque Mínimo
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={newPantryMin}
                    onChange={(e) => setNewPantryMin(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#FAF8F5] dark:bg-[#2D2228] border border-[#F2E8E4] dark:border-[#3D2F36] text-[#2D2327] dark:text-[#FAF4F0] focus:outline-none focus:ring-1 focus:ring-[#E07A8B]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-[#2D2327] dark:text-[#FAF4F0] mb-1">
                  Data de Validade (perecíveis)
                </label>
                <input
                  type="date"
                  value={newPantryExpDate}
                  onChange={(e) => setNewPantryExpDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#FAF8F5] dark:bg-[#2D2228] border border-[#F2E8E4] dark:border-[#3D2F36] text-[#2D2327] dark:text-[#FAF4F0] focus:outline-none focus:ring-1 focus:ring-[#E07A8B]"
                />
              </div>

              <div>
                <label className="block font-medium text-[#2D2327] dark:text-[#FAF4F0] mb-1">
                  Notas (marca preferida, receita pretendida)
                </label>
                <input
                  type="text"
                  value={newPantryNotes}
                  onChange={(e) => setNewPantryNotes(e.target.value)}
                  placeholder="Ex: Comprado para o jantar de sexta"
                  className="w-full px-3 py-2 rounded-xl bg-[#FAF8F5] dark:bg-[#2D2228] border border-[#F2E8E4] dark:border-[#3D2F36] text-[#2D2327] dark:text-[#FAF4F0] focus:outline-none focus:ring-1 focus:ring-[#E07A8B]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddPantryModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-[#7D6F74] hover:bg-zinc-100 dark:hover:bg-zinc-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#E07A8B] text-white font-medium shadow-xs"
                >
                  Cadastrar na Despensa
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Grocery Modal */}
      {editingGrocery && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#241C21] rounded-3xl max-w-md w-full p-6 border border-[#F2E8E4] dark:border-[#3D2F36] shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#F2E8E4] dark:border-[#3D2F36]">
              <h3 className="font-serif font-bold text-lg text-[#2D2327] dark:text-[#FAF4F0]">
                Editar Item da Lista
              </h3>
              <button
                onClick={() => setEditingGrocery(null)}
                className="text-xs text-[#7D6F74] hover:text-black dark:hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEditGrocery} className="space-y-3 text-xs sm:text-sm">
              <div>
                <label className="block font-medium text-[#2D2327] dark:text-[#FAF4F0] mb-1">
                  Nome do Item *
                </label>
                <input
                  type="text"
                  required
                  value={editGroceryName}
                  onChange={(e) => setEditGroceryName(e.target.value)}
                  placeholder="Ex: Iogurte Grego ou Morangos"
                  className="w-full px-3 py-2 rounded-xl bg-[#FAF8F5] dark:bg-[#2D2228] border border-[#F2E8E4] dark:border-[#3D2F36] text-[#2D2327] dark:text-[#FAF4F0] focus:outline-none focus:ring-1 focus:ring-[#E07A8B]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-[#2D2327] dark:text-[#FAF4F0] mb-1">
                    Categoria
                  </label>
                  <select
                    value={editGroceryCategory}
                    onChange={(e) => setEditGroceryCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#FAF8F5] dark:bg-[#2D2228] border border-[#F2E8E4] dark:border-[#3D2F36] text-[#2D2327] dark:text-[#FAF4F0] focus:outline-none focus:ring-1 focus:ring-[#E07A8B]"
                  >
                    <option value="Hortifruti">Hortifruti</option>
                    <option value="Laticínios & Frios">Laticínios & Frios</option>
                    <option value="Carnes & Peixes">Carnes & Peixes</option>
                    <option value="Mercearia & Grãos">Mercearia & Grãos</option>
                    <option value="Bebidas">Bebidas</option>
                    <option value="Temperos & Molhos">Temperos & Molhos</option>
                    <option value="Higiene & Limpeza">Higiene & Limpeza</option>
                    <option value="Outros">Outros</option>
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-[#2D2327] dark:text-[#FAF4F0] mb-1">
                    Quantidade
                  </label>
                  <input
                    type="text"
                    value={editGroceryQuantity}
                    onChange={(e) => setEditGroceryQuantity(e.target.value)}
                    placeholder="Ex: 2 pct ou 500g"
                    className="w-full px-3 py-2 rounded-xl bg-[#FAF8F5] dark:bg-[#2D2228] border border-[#F2E8E4] dark:border-[#3D2F36] text-[#2D2327] dark:text-[#FAF4F0] focus:outline-none focus:ring-1 focus:ring-[#E07A8B]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-[#2D2327] dark:text-[#FAF4F0] mb-1">
                  Preço Estimado R$ (opcional)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={editGroceryPrice}
                  onChange={(e) => setEditGroceryPrice(e.target.value)}
                  placeholder="Ex: 14.50"
                  className="w-full px-3 py-2 rounded-xl bg-[#FAF8F5] dark:bg-[#2D2228] border border-[#F2E8E4] dark:border-[#3D2F36] text-[#2D2327] dark:text-[#FAF4F0] focus:outline-none focus:ring-1 focus:ring-[#E07A8B]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingGrocery(null)}
                  className="px-4 py-2 rounded-xl text-[#7D6F74] hover:bg-zinc-100 dark:hover:bg-zinc-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#E07A8B] text-white font-medium shadow-xs"
                >
                  Salvar Alterações
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Pantry Modal */}
      {editingPantry && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#241C21] rounded-3xl max-w-md w-full p-6 border border-[#F2E8E4] dark:border-[#3D2F36] shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#F2E8E4] dark:border-[#3D2F36]">
              <h3 className="font-serif font-bold text-lg text-[#2D2327] dark:text-[#FAF4F0]">
                Editar Item da Despensa
              </h3>
              <button
                onClick={() => setEditingPantry(null)}
                className="text-xs text-[#7D6F74] hover:text-black dark:hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEditPantry} className="space-y-3 text-xs sm:text-sm">
              <div>
                <label className="block font-medium text-[#2D2327] dark:text-[#FAF4F0] mb-1">
                  Nome do Produto *
                </label>
                <input
                  type="text"
                  required
                  value={editPantryName}
                  onChange={(e) => setEditPantryName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#FAF8F5] dark:bg-[#2D2228] border border-[#F2E8E4] dark:border-[#3D2F36] text-[#2D2327] dark:text-[#FAF4F0] focus:outline-none focus:ring-1 focus:ring-[#E07A8B]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-[#2D2327] dark:text-[#FAF4F0] mb-1">
                    Categoria
                  </label>
                  <select
                    value={editPantryCategory}
                    onChange={(e) => setEditPantryCategory(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-[#FAF8F5] dark:bg-[#2D2228] border border-[#F2E8E4] dark:border-[#3D2F36] text-[#2D2327] dark:text-[#FAF4F0] focus:outline-none focus:ring-1 focus:ring-[#E07A8B]"
                  >
                    <option value="Hortifruti">Hortifruti</option>
                    <option value="Laticínios & Frios">Laticínios & Frios</option>
                    <option value="Carnes & Peixes">Carnes & Peixes</option>
                    <option value="Mercearia & Grãos">Mercearia & Grãos</option>
                    <option value="Bebidas">Bebidas</option>
                    <option value="Temperos & Molhos">Temperos & Molhos</option>
                    <option value="Congelados">Congelados</option>
                    <option value="Higiene & Limpeza">Higiene & Limpeza</option>
                    <option value="Outros">Outros</option>
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-[#2D2327] dark:text-[#FAF4F0] mb-1">
                    Unidade
                  </label>
                  <select
                    value={editPantryUnit}
                    onChange={(e) => setEditPantryUnit(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-[#FAF8F5] dark:bg-[#2D2228] border border-[#F2E8E4] dark:border-[#3D2F36] text-[#2D2327] dark:text-[#FAF4F0] focus:outline-none focus:ring-1 focus:ring-[#E07A8B]"
                  >
                    <option value="un">un (unidade)</option>
                    <option value="kg">kg</option>
                    <option value="g">g</option>
                    <option value="L">L (litro)</option>
                    <option value="ml">ml</option>
                    <option value="pct">pct (pacote)</option>
                    <option value="lata">lata</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-[#2D2327] dark:text-[#FAF4F0] mb-1">
                    Quantidade Atual
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={editPantryQuantity}
                    onChange={(e) => setEditPantryQuantity(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#FAF8F5] dark:bg-[#2D2228] border border-[#F2E8E4] dark:border-[#3D2F36] text-[#2D2327] dark:text-[#FAF4F0] focus:outline-none focus:ring-1 focus:ring-[#E07A8B]"
                  />
                </div>

                <div>
                  <label className="block font-medium text-[#2D2327] dark:text-[#FAF4F0] mb-1">
                    Estoque Mínimo
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={editPantryMin}
                    onChange={(e) => setEditPantryMin(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#FAF8F5] dark:bg-[#2D2228] border border-[#F2E8E4] dark:border-[#3D2F36] text-[#2D2327] dark:text-[#FAF4F0] focus:outline-none focus:ring-1 focus:ring-[#E07A8B]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-[#2D2327] dark:text-[#FAF4F0] mb-1">
                  Data de Validade (perecíveis)
                </label>
                <input
                  type="date"
                  value={editPantryExpDate}
                  onChange={(e) => setEditPantryExpDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#FAF8F5] dark:bg-[#2D2228] border border-[#F2E8E4] dark:border-[#3D2F36] text-[#2D2327] dark:text-[#FAF4F0] focus:outline-none focus:ring-1 focus:ring-[#E07A8B]"
                />
              </div>

              <div>
                <label className="block font-medium text-[#2D2327] dark:text-[#FAF4F0] mb-1">
                  Notas (marca preferida, receita pretendida)
                </label>
                <input
                  type="text"
                  value={editPantryNotes}
                  onChange={(e) => setEditPantryNotes(e.target.value)}
                  placeholder="Ex: Comprado para o jantar de sexta"
                  className="w-full px-3 py-2 rounded-xl bg-[#FAF8F5] dark:bg-[#2D2228] border border-[#F2E8E4] dark:border-[#3D2F36] text-[#2D2327] dark:text-[#FAF4F0] focus:outline-none focus:ring-1 focus:ring-[#E07A8B]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingPantry(null)}
                  className="px-4 py-2 rounded-xl text-[#7D6F74] hover:bg-zinc-100 dark:hover:bg-zinc-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#E07A8B] text-white font-medium shadow-xs"
                >
                  Salvar Alterações
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
