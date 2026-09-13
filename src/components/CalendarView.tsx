import React, { useState } from 'react';
import {
  Calendar,
  Clock,
  MapPin,
  Plus,
  CheckCircle2,
  Trash2,
  Edit3,
  Heart,
  Stethoscope,
  ShoppingBag,
  Sparkles,
  Plane,
  Home,
  Tag,
  ChevronDown,
  RotateCcw,
} from 'lucide-react';
import { CalendarEvent, PartnerId, CoupleProfile } from '../types';

interface CalendarViewProps {
  events: CalendarEvent[];
  profile: CoupleProfile;
  activePartner: PartnerId;
  onAddEvent: (event: Omit<CalendarEvent, 'id'>) => void;
  onUpdateEvent?: (event: CalendarEvent) => void;
  onToggleEventDone: (id: string) => void;
  onDeleteEvent: (id: string) => void;
  customCategories?: string[];
  onUpdateCustomCategories?: (categories: string[], renamedFrom?: string, renamedTo?: string, deleted?: string) => void;
}

export interface CalendarCategoryDef {
  id: string;
  label: string;
  badgeClass: string;
}

export const DEFAULT_CALENDAR_CATEGORIES = [
  'Dates Românticos',
  'Consultas Médicas',
  'Idas ao Mercado',
  'Tarefas de Casa',
  'Viagens',
];

// Helper to normalize legacy category IDs (date_romantico, consulta, etc.) to human-readable names
export const normalizeCategoryName = (cat: string): string => {
  if (!cat) return 'Tarefas de Casa';
  const lower = cat.toLowerCase().trim();
  if (lower === 'date_romantico' || lower === 'dates romanticos' || lower === 'dates românticos') return 'Dates Românticos';
  if (lower === 'consulta' || lower === 'consultas' || lower === 'consultas médicas') return 'Consultas Médicas';
  if (lower === 'mercado' || lower === 'idas ao mercado') return 'Idas ao Mercado';
  if (lower === 'tarefa' || lower === 'tarefas' || lower === 'tarefas de casa') return 'Tarefas de Casa';
  if (lower === 'viagem' || lower === 'viagens') return 'Viagens';
  return cat;
};

export const CalendarView: React.FC<CalendarViewProps> = ({
  events,
  profile,
  activePartner,
  onAddEvent,
  onUpdateEvent,
  onToggleEventDone,
  onDeleteEvent,
  customCategories: propsCustomCategories,
  onUpdateCustomCategories,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('todos');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);

  // Active categories list - unified, fully editable and deletable
  const [categories, setCategories] = useState<string[]>(() => {
    if (propsCustomCategories && propsCustomCategories.length > 0) {
      return propsCustomCategories.map(normalizeCategoryName);
    }
    try {
      const saved = localStorage.getItem('nos_dois_calendar_all_categories');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map(normalizeCategoryName);
        }
      }
    } catch {}
    return DEFAULT_CALENDAR_CATEGORIES;
  });

  React.useEffect(() => {
    if (propsCustomCategories && propsCustomCategories.length > 0) {
      setCategories(propsCustomCategories.map(normalizeCategoryName));
    }
  }, [propsCustomCategories]);

  const [isManageCategoriesModalOpen, setIsManageCategoriesModalOpen] = useState(false);
  const [editingCatOriginal, setEditingCatOriginal] = useState<string | null>(null);
  const [editingCatInput, setEditingCatInput] = useState('');
  const [modalNewCatInput, setModalNewCatInput] = useState('');

  // Inline creation states
  const [isCreatingNewCat, setIsCreatingNewCat] = useState(false);
  const [newCatInput, setNewCatInput] = useState('');
  const [isCreatingEditCat, setIsCreatingEditCat] = useState(false);
  const [editCatInput, setEditCatInput] = useState('');

  const saveUpdatedCategories = (newCategories: string[], renamedFrom?: string, renamedTo?: string, deleted?: string) => {
    setCategories(newCategories);
    try {
      localStorage.setItem('nos_dois_calendar_all_categories', JSON.stringify(newCategories));
    } catch {}
    onUpdateCustomCategories?.(newCategories, renamedFrom, renamedTo, deleted);
  };

  const handleAddCategory = (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    const exists = categories.some((c) => c.toLowerCase() === trimmed.toLowerCase());
    if (!exists) {
      const updated = [...categories, trimmed];
      saveUpdatedCategories(updated);
      setNewCategory(trimmed);
      setIsCreatingNewCat(false);
      setNewCatInput('');
    }
  };

  const handleDeleteCategory = (catToDelete: string) => {
    const updated = categories.filter((c) => c.toLowerCase() !== catToDelete.toLowerCase());
    const fallback = updated.length > 0 ? updated[0] : 'Geral';
    const finalCategories = updated.length > 0 ? updated : ['Geral'];

    if (newCategory === catToDelete) setNewCategory(fallback);
    if (editEventCategory === catToDelete) setEditEventCategory(fallback);
    if (selectedCategory === catToDelete) setSelectedCategory('todos');

    saveUpdatedCategories(finalCategories, undefined, undefined, catToDelete);
  };

  const handleSaveEditedCategory = (oldCat: string) => {
    const trimmed = editingCatInput.trim();
    if (!trimmed || trimmed === oldCat) {
      setEditingCatOriginal(null);
      return;
    }
    const updated = categories.map((c) => (c === oldCat ? trimmed : c));

    if (newCategory === oldCat) setNewCategory(trimmed);
    if (editEventCategory === oldCat) setEditEventCategory(trimmed);
    if (selectedCategory === oldCat) setSelectedCategory(trimmed);

    setEditingCatOriginal(null);
    saveUpdatedCategories(updated, oldCat, trimmed, undefined);
  };

  const handleRestoreDefaultCategories = () => {
    saveUpdatedCategories(DEFAULT_CALENDAR_CATEGORIES);
    setSelectedCategory('todos');
  };

  // Form states
  const [newTitle, setNewTitle] = useState('');
  const [newDate, setNewDate] = useState('');
  const [newTime, setNewTime] = useState('');
  const [newCategory, setNewCategory] = useState<string>(() => categories[0] || 'Dates Românticos');
  const [newLocation, setNewLocation] = useState('');
  const [newNotes, setNewNotes] = useState('');
  const [newAssignedTo, setNewAssignedTo] = useState<CalendarEvent['assignedTo']>('ambos');

  // Edit event form state
  const [editEventTitle, setEditEventTitle] = useState('');
  const [editEventDate, setEditEventDate] = useState('');
  const [editEventTime, setEditEventTime] = useState('');
  const [editEventCategory, setEditEventCategory] = useState<string>('Dates Românticos');
  const [editEventLocation, setEditEventLocation] = useState('');
  const [editEventNotes, setEditEventNotes] = useState('');
  const [editEventAssignedTo, setEditEventAssignedTo] = useState<CalendarEvent['assignedTo']>('ambos');

  const handleOpenEditEvent = (ev: CalendarEvent) => {
    setEditingEvent(ev);
    setEditEventTitle(ev.title);
    setEditEventDate(ev.date);
    setEditEventTime(ev.time || '');
    setEditEventCategory(normalizeCategoryName(ev.category));
    setEditEventLocation(ev.location || '');
    setEditEventNotes(ev.notes || '');
    setEditEventAssignedTo(ev.assignedTo || 'ambos');
    setIsCreatingEditCat(false);
  };

  const handleSaveEditedEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEvent || !editEventTitle.trim() || !editEventDate) return;

    if (onUpdateEvent) {
      onUpdateEvent({
        ...editingEvent,
        title: editEventTitle.trim(),
        date: editEventDate,
        time: editEventTime || undefined,
        category: editEventCategory,
        location: editEventLocation.trim() || undefined,
        notes: editEventNotes.trim() || undefined,
        assignedTo: editEventAssignedTo,
      });
    }

    setEditingEvent(null);
  };

  const getCategoryIcon = (cat: string) => {
    const norm = normalizeCategoryName(cat).toLowerCase();
    if (norm.includes('date') || norm.includes('amor') || norm.includes('romântico')) {
      return <Heart className="w-3.5 h-3.5 text-rose-500" />;
    }
    if (norm.includes('médic') || norm.includes('saúde') || norm.includes('consulta') || norm.includes('dentista')) {
      return <Stethoscope className="w-3.5 h-3.5 text-blue-500" />;
    }
    if (norm.includes('mercado') || norm.includes('compra') || norm.includes('feira') || norm.includes('supermercado')) {
      return <ShoppingBag className="w-3.5 h-3.5 text-emerald-500" />;
    }
    if (norm.includes('tarefa') || norm.includes('casa') || norm.includes('limpeza') || norm.includes('faxina')) {
      return <Home className="w-3.5 h-3.5 text-amber-500" />;
    }
    if (norm.includes('viag') || norm.includes('passeio') || norm.includes('voo') || norm.includes('hotel')) {
      return <Plane className="w-3.5 h-3.5 text-purple-500" />;
    }
    return <Tag className="w-3.5 h-3.5 text-indigo-500" />;
  };

  const allCategoryTabs = [
    { id: 'todos', label: 'Todos os Eventos', icon: <Calendar className="w-3.5 h-3.5 text-[#E07A8B]" />, isAll: true },
    ...categories.map((c) => ({
      id: c,
      label: c,
      icon: getCategoryIcon(c),
      isAll: false,
    })),
  ];

  const filteredEvents = events.filter((ev) => {
    if (selectedCategory === 'todos') return true;
    const evNorm = normalizeCategoryName(ev.category);
    const selNorm = normalizeCategoryName(selectedCategory);
    return evNorm.toLowerCase() === selNorm.toLowerCase();
  });

  const handleCreateEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newDate) return;

    onAddEvent({
      title: newTitle.trim(),
      date: newDate,
      time: newTime || undefined,
      category: newCategory,
      location: newLocation.trim() || undefined,
      notes: newNotes.trim() || undefined,
      assignedTo: newAssignedTo,
      completed: false,
      addedBy: activePartner,
    });

    setNewTitle('');
    setNewDate('');
    setNewTime('');
    setNewLocation('');
    setNewNotes('');
    setIsCreatingNewCat(false);
    setIsAddModalOpen(false);
  };

  const getCategoryBadge = (cat: string) => {
    const norm = normalizeCategoryName(cat).toLowerCase();
    if (norm.includes('date') || norm.includes('romântico')) {
      return { label: cat, color: 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-200' };
    }
    if (norm.includes('médic') || norm.includes('saúde') || norm.includes('consulta')) {
      return { label: cat, color: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200' };
    }
    if (norm.includes('mercado') || norm.includes('compra')) {
      return { label: cat, color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200' };
    }
    if (norm.includes('tarefa') || norm.includes('casa')) {
      return { label: cat, color: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200' };
    }
    if (norm.includes('viag')) {
      return { label: cat, color: 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-200' };
    }
    return {
      label: cat,
      color: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-200',
    };
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-serif text-2xl font-bold text-[#2D2327] dark:text-[#FAF4F0]">
            Agenda & Dia a Dia a Dois
          </h2>
          <p className="text-xs sm:text-sm text-[#7D6F74] dark:text-[#B8A8AF] mt-0.5">
            Consultas médicas, idas ao mercado, tarefas de casa e nossos dates inesquecíveis.
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-[#E07A8B] to-[#E58C9B] hover:opacity-95 text-white font-medium text-xs sm:text-sm shadow-sm transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Novo Compromisso</span>
        </button>
      </div>

      {/* Categories Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5 flex-1">
          {allCategoryTabs.map((cat) => {
            const isSelected = selectedCategory === cat.id;

            return (
              <div
                key={cat.id}
                className={`inline-flex items-center rounded-2xl text-xs font-semibold whitespace-nowrap transition-all ${
                  isSelected
                    ? 'bg-[#E07A8B] text-white shadow-2xs'
                    : 'bg-white dark:bg-[#241C21] text-[#7D6F74] dark:text-[#B8A8AF] border border-[#F2E8E4] dark:border-[#3D2F36] hover:bg-[#FAF3EC]'
                }`}
              >
                <button
                  type="button"
                  onClick={() => setSelectedCategory(cat.id)}
                  className="flex items-center gap-1.5 px-3 py-2 cursor-pointer"
                >
                  {cat.icon}
                  <span>{cat.label}</span>
                </button>

                {!cat.isAll && (
                  <div className="flex items-center gap-0.5 pr-2 -ml-1">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingCatOriginal(cat.id);
                        setEditingCatInput(cat.id);
                        setIsManageCategoriesModalOpen(true);
                      }}
                      className={`p-1 rounded-lg transition-colors cursor-pointer ${
                        isSelected
                          ? 'text-white/80 hover:text-white hover:bg-white/20'
                          : 'text-[#7D6F74] dark:text-[#B8A8AF] hover:text-[#E07A8B] hover:bg-rose-50 dark:hover:bg-rose-950/40'
                      }`}
                      title={`Editar categoria "${cat.id}"`}
                    >
                      <Edit3 className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteCategory(cat.id);
                      }}
                      className={`p-1 rounded-lg transition-colors cursor-pointer ${
                        isSelected
                          ? 'text-white/80 hover:text-white hover:bg-white/20'
                          : 'text-[#7D6F74] dark:text-[#B8A8AF] hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40'
                      }`}
                      title={`Excluir categoria "${cat.id}"`}
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <button
          type="button"
          onClick={() => setIsManageCategoriesModalOpen(true)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-2xl text-xs font-semibold text-[#E07A8B] bg-white dark:bg-[#241C21] border border-[#E07A8B]/40 hover:bg-rose-50 dark:hover:bg-rose-950/40 whitespace-nowrap transition-colors cursor-pointer shadow-2xs"
          title="Adicionar, editar ou remover categorias da agenda"
        >
          <Tag className="w-3.5 h-3.5 text-[#E07A8B]" />
          <span>Gerenciar Categorias</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-rose-100 dark:bg-rose-950 text-[#E07A8B] font-bold">
            {categories.length}
          </span>
        </button>
      </div>

      {/* Events List */}
      {filteredEvents.length === 0 ? (
        <div className="py-16 text-center rounded-3xl bg-white dark:bg-[#241C21] border border-[#F2E8E4] dark:border-[#3D2F36]">
          <Calendar className="w-10 h-10 mx-auto text-[#E07A8B]/60 mb-2" />
          <p className="text-sm font-semibold text-[#2D2327] dark:text-[#FAF4F0]">
            Nenhum compromisso marcado nesta categoria
          </p>
          <p className="text-xs text-[#7D6F74] dark:text-[#B8A8AF] mt-1">
            Planeje o próximo date ou anote a consulta para não esquecerem!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredEvents.map((ev) => {
            const badge = getCategoryBadge(ev.category);
            const addedPartner =
              ev.addedBy === 'partner1' ? profile.partner1 : profile.partner2;

            return (
              <div
                key={ev.id}
                className={`p-4 rounded-3xl border transition-all ${
                  ev.completed
                    ? 'bg-[#FAF8F5]/60 dark:bg-[#20181D]/60 border-[#F2E8E4]/50 dark:border-[#33252C]/50 opacity-60'
                    : 'bg-white dark:bg-[#241C21] border-[#F2E8E4] dark:border-[#3D2F36] shadow-xs hover:shadow-md'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    {/* Checkbox button */}
                    <button
                      onClick={() => onToggleEventDone(ev.id)}
                      className="mt-1 text-[#E07A8B] hover:scale-110 transition-transform shrink-0"
                      title={ev.completed ? 'Desmarcar' : 'Concluir compromisso'}
                    >
                      <CheckCircle2
                        className={`w-5 h-5 ${
                          ev.completed ? 'fill-[#E07A8B] text-white' : 'text-zinc-300 dark:text-zinc-600'
                        }`}
                      />
                    </button>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${badge.color}`}>
                          {badge.label}
                        </span>
                        {ev.assignedTo !== 'ambos' && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#FAF3EC] dark:bg-[#2C2127] text-[#D4A373] dark:text-[#EAD5C3] font-medium">
                            {ev.assignedTo === 'partner1' ? profile.partner1.name : profile.partner2.name}
                          </span>
                        )}
                      </div>

                      <h4
                        className={`font-serif font-bold text-base mt-1 ${
                          ev.completed
                            ? 'line-through text-[#7D6F74] dark:text-[#B8A8AF]'
                            : 'text-[#2D2327] dark:text-[#FAF4F0]'
                        }`}
                      >
                        {ev.title}
                      </h4>

                      <div className="flex items-center gap-3 text-xs text-[#7D6F74] dark:text-[#B8A8AF] mt-1.5 flex-wrap">
                        <span className="flex items-center gap-1 font-medium">
                          <Calendar className="w-3.5 h-3.5 text-[#E07A8B]" />
                          {new Date(ev.date + 'T00:00:00').toLocaleDateString('pt-BR')}
                        </span>
                        {ev.time && (
                          <span className="flex items-center gap-1 font-medium">
                            <Clock className="w-3.5 h-3.5 text-amber-500" />
                            {ev.time}
                          </span>
                        )}
                        {ev.location && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-rose-400" />
                            {ev.location}
                          </span>
                        )}
                      </div>

                      {ev.notes && (
                        <p className="text-xs text-[#7D6F74] dark:text-[#B8A8AF] mt-2 italic bg-[#FAF8F5] dark:bg-[#2C2127] p-2 rounded-xl">
                          "{ev.notes}"
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => handleOpenEditEvent(ev)}
                      className="p-1.5 text-zinc-400 hover:text-[#E07A8B] hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors"
                      title="Editar compromisso"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onDeleteEvent(ev.id)}
                      className="p-1.5 text-zinc-300 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors"
                      title="Excluir compromisso"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Event Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#241C21] rounded-3xl max-w-md w-full p-6 border border-[#F2E8E4] dark:border-[#3D2F36] shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#F2E8E4] dark:border-[#3D2F36]">
              <h3 className="font-serif font-bold text-lg text-[#2D2327] dark:text-[#FAF4F0]">
                Novo Compromisso
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-xs text-[#7D6F74] hover:text-black dark:hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateEvent} className="space-y-3 text-xs sm:text-sm">
              <div>
                <label className="block font-medium text-[#2D2327] dark:text-[#FAF4F0] mb-1">
                  Título do Evento *
                </label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Ex: Jantar no nosso restaurante favorito"
                  className="w-full px-3 py-2 rounded-xl bg-[#FAF8F5] dark:bg-[#2D2228] border border-[#F2E8E4] dark:border-[#3D2F36] text-[#2D2327] dark:text-[#FAF4F0] focus:outline-none focus:ring-1 focus:ring-[#E07A8B]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-[#2D2327] dark:text-[#FAF4F0] mb-1">
                    Data *
                  </label>
                  <input
                    type="date"
                    required
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#FAF8F5] dark:bg-[#2D2228] border border-[#F2E8E4] dark:border-[#3D2F36] text-[#2D2327] dark:text-[#FAF4F0] focus:outline-none focus:ring-1 focus:ring-[#E07A8B]"
                  />
                </div>

                <div>
                  <label className="block font-medium text-[#2D2327] dark:text-[#FAF4F0] mb-1">
                    Horário
                  </label>
                  <input
                    type="time"
                    value={newTime}
                    onChange={(e) => setNewTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#FAF8F5] dark:bg-[#2D2228] border border-[#F2E8E4] dark:border-[#3D2F36] text-[#2D2327] dark:text-[#FAF4F0] focus:outline-none focus:ring-1 focus:ring-[#E07A8B]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block font-medium text-[#2D2327] dark:text-[#FAF4F0]">
                      Categoria
                    </label>
                    <button
                      type="button"
                      onClick={() => setIsManageCategoriesModalOpen(true)}
                      className="text-[11px] text-[#E07A8B] hover:underline font-semibold flex items-center gap-0.5"
                    >
                      <Edit3 className="w-3 h-3" /> Gerenciar
                    </button>
                  </div>
                  <div className="relative">
                    <select
                      value={isCreatingNewCat ? '__create_new__' : newCategory}
                      onChange={(e) => {
                        if (e.target.value === '__create_new__') {
                          setIsCreatingNewCat(true);
                          setNewCatInput('');
                        } else {
                          setIsCreatingNewCat(false);
                          setNewCategory(e.target.value);
                        }
                      }}
                      className="w-full px-3 py-2 pr-8 rounded-xl bg-[#FAF8F5] dark:bg-[#2D2228] border border-[#F2E8E4] dark:border-[#3D2F36] text-[#2D2327] dark:text-[#FAF4F0] focus:outline-none focus:ring-1 focus:ring-[#E07A8B] appearance-none cursor-pointer text-xs sm:text-sm"
                    >
                      {categories.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                      <option value="__create_new__" className="font-semibold text-[#E07A8B]">
                        ✨ + Criar outra categoria...
                      </option>
                    </select>
                    <ChevronDown className="w-4 h-4 text-[#7D6F74] dark:text-[#B8A8AF] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>

                  {/* Quick Edit/Delete Category when category is selected */}
                  {newCategory && !isCreatingNewCat && (
                    <div className="mt-1.5 flex items-center justify-between text-xs px-2.5 py-1.5 rounded-xl bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200/60 dark:border-rose-900/40">
                      <span className="text-[11px] text-[#7D6F74] dark:text-[#B8A8AF] truncate">
                        Categoria: <strong className="text-[#2D2327] dark:text-[#FAF4F0]">{newCategory}</strong>
                      </span>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingCatOriginal(newCategory);
                            setEditingCatInput(newCategory);
                            setIsManageCategoriesModalOpen(true);
                          }}
                          className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#E07A8B] hover:underline cursor-pointer"
                        >
                          <Edit3 className="w-3 h-3" /> Editar
                        </button>
                        <span className="text-[#7D6F74] opacity-40">|</span>
                        <button
                          type="button"
                          onClick={() => {
                            handleDeleteCategory(newCategory);
                          }}
                          className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-500 hover:underline cursor-pointer"
                        >
                          <Trash2 className="w-3 h-3" /> Excluir
                        </button>
                      </div>
                    </div>
                  )}

                  {isCreatingNewCat && (
                    <div className="mt-2 flex items-center gap-1.5 animate-in fade-in duration-150">
                      <input
                        type="text"
                        autoFocus
                        value={newCatInput}
                        onChange={(e) => setNewCatInput(e.target.value)}
                        placeholder="Nome da categoria..."
                        className="flex-1 px-2.5 py-1.5 rounded-xl bg-white dark:bg-[#20171C] border border-[#E07A8B] text-xs text-[#2D2327] dark:text-[#FAF4F0] focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (newCatInput.trim()) {
                            handleAddCategory(newCatInput.trim());
                            setNewCategory(newCatInput.trim());
                            setIsCreatingNewCat(false);
                          }
                        }}
                        className="px-2.5 py-1.5 rounded-xl bg-[#E07A8B] text-white text-xs font-semibold hover:opacity-90 cursor-pointer"
                      >
                        Criar
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsCreatingNewCat(false)}
                        className="px-2 py-1.5 text-xs text-[#7D6F74] cursor-pointer"
                      >
                        ✕
                      </button>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block font-medium text-[#2D2327] dark:text-[#FAF4F0] mb-1">
                    Quem vai?
                  </label>
                  <select
                    value={newAssignedTo}
                    onChange={(e) => setNewAssignedTo(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-[#FAF8F5] dark:bg-[#2D2228] border border-[#F2E8E4] dark:border-[#3D2F36] text-[#2D2327] dark:text-[#FAF4F0] focus:outline-none focus:ring-1 focus:ring-[#E07A8B]"
                  >
                    <option value="ambos">Nós Dois (Ambos)</option>
                    <option value="partner1">{profile.partner1.name}</option>
                    <option value="partner2">{profile.partner2.name}</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-medium text-[#2D2327] dark:text-[#FAF4F0] mb-1">
                  Local / Endereço (opcional)
                </label>
                <input
                  type="text"
                  value={newLocation}
                  onChange={(e) => setNewLocation(e.target.value)}
                  placeholder="Ex: Bistrô do Centro ou Clínica São José"
                  className="w-full px-3 py-2 rounded-xl bg-[#FAF8F5] dark:bg-[#2D2228] border border-[#F2E8E4] dark:border-[#3D2F36] text-[#2D2327] dark:text-[#FAF4F0] focus:outline-none focus:ring-1 focus:ring-[#E07A8B]"
                />
              </div>

              <div>
                <label className="block font-medium text-[#2D2327] dark:text-[#FAF4F0] mb-1">
                  Observações
                </label>
                <textarea
                  rows={2}
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  placeholder="Lembrar de levar documento ou roupa formal..."
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
                  className="px-5 py-2 rounded-xl bg-[#E07A8B] text-white font-medium shadow-xs"
                >
                  Salvar Compromisso
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Event Modal */}
      {editingEvent && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#241C21] rounded-3xl max-w-md w-full p-6 border border-[#F2E8E4] dark:border-[#3D2F36] shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#F2E8E4] dark:border-[#3D2F36]">
              <h3 className="font-serif font-bold text-lg text-[#2D2327] dark:text-[#FAF4F0]">
                Editar Compromisso
              </h3>
              <button
                onClick={() => setEditingEvent(null)}
                className="text-xs text-[#7D6F74] hover:text-black dark:hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEditedEvent} className="space-y-3 text-xs sm:text-sm">
              <div>
                <label className="block font-medium text-[#2D2327] dark:text-[#FAF4F0] mb-1">
                  Título do Evento *
                </label>
                <input
                  type="text"
                  required
                  value={editEventTitle}
                  onChange={(e) => setEditEventTitle(e.target.value)}
                  placeholder="Ex: Jantar no nosso restaurante favorito"
                  className="w-full px-3 py-2 rounded-xl bg-[#FAF8F5] dark:bg-[#2D2228] border border-[#F2E8E4] dark:border-[#3D2F36] text-[#2D2327] dark:text-[#FAF4F0] focus:outline-none focus:ring-1 focus:ring-[#E07A8B]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-[#2D2327] dark:text-[#FAF4F0] mb-1">
                    Data *
                  </label>
                  <input
                    type="date"
                    required
                    value={editEventDate}
                    onChange={(e) => setEditEventDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#FAF8F5] dark:bg-[#2D2228] border border-[#F2E8E4] dark:border-[#3D2F36] text-[#2D2327] dark:text-[#FAF4F0] focus:outline-none focus:ring-1 focus:ring-[#E07A8B]"
                  />
                </div>

                <div>
                  <label className="block font-medium text-[#2D2327] dark:text-[#FAF4F0] mb-1">
                    Horário
                  </label>
                  <input
                    type="time"
                    value={editEventTime}
                    onChange={(e) => setEditEventTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#FAF8F5] dark:bg-[#2D2228] border border-[#F2E8E4] dark:border-[#3D2F36] text-[#2D2327] dark:text-[#FAF4F0] focus:outline-none focus:ring-1 focus:ring-[#E07A8B]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block font-medium text-[#2D2327] dark:text-[#FAF4F0]">
                      Categoria
                    </label>
                    <button
                      type="button"
                      onClick={() => setIsManageCategoriesModalOpen(true)}
                      className="text-[11px] text-[#E07A8B] hover:underline font-semibold flex items-center gap-0.5"
                    >
                      <Edit3 className="w-3 h-3" /> Gerenciar
                    </button>
                  </div>
                  <div className="relative">
                    <select
                      value={isCreatingEditCat ? '__create_new__' : editEventCategory}
                      onChange={(e) => {
                        if (e.target.value === '__create_new__') {
                          setIsCreatingEditCat(true);
                          setEditCatInput('');
                        } else {
                          setIsCreatingEditCat(false);
                          setEditEventCategory(e.target.value);
                        }
                      }}
                      className="w-full px-3 py-2 pr-8 rounded-xl bg-[#FAF8F5] dark:bg-[#2D2228] border border-[#F2E8E4] dark:border-[#3D2F36] text-[#2D2327] dark:text-[#FAF4F0] focus:outline-none focus:ring-1 focus:ring-[#E07A8B] appearance-none cursor-pointer text-xs sm:text-sm"
                    >
                      {categories.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                      <option value="__create_new__" className="font-semibold text-[#E07A8B]">
                        ✨ + Criar outra categoria...
                      </option>
                    </select>
                    <ChevronDown className="w-4 h-4 text-[#7D6F74] dark:text-[#B8A8AF] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>

                  {/* Quick Edit/Delete Category when category is selected */}
                  {editEventCategory && !isCreatingEditCat && (
                    <div className="mt-1.5 flex items-center justify-between text-xs px-2.5 py-1.5 rounded-xl bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200/60 dark:border-rose-900/40">
                      <span className="text-[11px] text-[#7D6F74] dark:text-[#B8A8AF] truncate">
                        Categoria: <strong className="text-[#2D2327] dark:text-[#FAF4F0]">{editEventCategory}</strong>
                      </span>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingCatOriginal(editEventCategory);
                            setEditingCatInput(editEventCategory);
                            setIsManageCategoriesModalOpen(true);
                          }}
                          className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#E07A8B] hover:underline cursor-pointer"
                        >
                          <Edit3 className="w-3 h-3" /> Editar
                        </button>
                        <span className="text-[#7D6F74] opacity-40">|</span>
                        <button
                          type="button"
                          onClick={() => {
                            handleDeleteCategory(editEventCategory);
                          }}
                          className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-500 hover:underline cursor-pointer"
                        >
                          <Trash2 className="w-3 h-3" /> Excluir
                        </button>
                      </div>
                    </div>
                  )}

                  {isCreatingEditCat && (
                    <div className="mt-2 flex items-center gap-1.5 animate-in fade-in duration-150">
                      <input
                        type="text"
                        autoFocus
                        value={editCatInput}
                        onChange={(e) => setEditCatInput(e.target.value)}
                        placeholder="Nome da categoria..."
                        className="flex-1 px-2.5 py-1.5 rounded-xl bg-white dark:bg-[#20171C] border border-[#E07A8B] text-xs text-[#2D2327] dark:text-[#FAF4F0] focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (editCatInput.trim()) {
                            handleAddCategory(editCatInput.trim());
                            setEditEventCategory(editCatInput.trim());
                            setIsCreatingEditCat(false);
                          }
                        }}
                        className="px-2.5 py-1.5 rounded-xl bg-[#E07A8B] text-white text-xs font-semibold hover:opacity-90 cursor-pointer"
                      >
                        Criar
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsCreatingEditCat(false)}
                        className="px-2 py-1.5 text-xs text-[#7D6F74] cursor-pointer"
                      >
                        ✕
                      </button>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block font-medium text-[#2D2327] dark:text-[#FAF4F0] mb-1">
                    Quem vai?
                  </label>
                  <select
                    value={editEventAssignedTo}
                    onChange={(e) => setEditEventAssignedTo(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-[#FAF8F5] dark:bg-[#2D2228] border border-[#F2E8E4] dark:border-[#3D2F36] text-[#2D2327] dark:text-[#FAF4F0] focus:outline-none focus:ring-1 focus:ring-[#E07A8B]"
                  >
                    <option value="ambos">Nós Dois (Ambos)</option>
                    <option value="partner1">{profile.partner1.name}</option>
                    <option value="partner2">{profile.partner2.name}</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-medium text-[#2D2327] dark:text-[#FAF4F0] mb-1">
                  Local / Endereço (opcional)
                </label>
                <input
                  type="text"
                  value={editEventLocation}
                  onChange={(e) => setEditEventLocation(e.target.value)}
                  placeholder="Ex: Bistrô do Centro ou Clínica São José"
                  className="w-full px-3 py-2 rounded-xl bg-[#FAF8F5] dark:bg-[#2D2228] border border-[#F2E8E4] dark:border-[#3D2F36] text-[#2D2327] dark:text-[#FAF4F0] focus:outline-none focus:ring-1 focus:ring-[#E07A8B]"
                />
              </div>

              <div>
                <label className="block font-medium text-[#2D2327] dark:text-[#FAF4F0] mb-1">
                  Observações
                </label>
                <textarea
                  rows={2}
                  value={editEventNotes}
                  onChange={(e) => setEditEventNotes(e.target.value)}
                  placeholder="Lembrar de levar documento ou roupa formal..."
                  className="w-full px-3 py-2 rounded-xl bg-[#FAF8F5] dark:bg-[#2D2228] border border-[#F2E8E4] dark:border-[#3D2F36] text-[#2D2327] dark:text-[#FAF4F0] focus:outline-none focus:ring-1 focus:ring-[#E07A8B]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingEvent(null)}
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

      {/* Manage Custom Categories Modal */}
      {isManageCategoriesModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#241C21] rounded-3xl max-w-md w-full p-6 border border-[#F2E8E4] dark:border-[#3D2F36] shadow-xl space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[#F2E8E4] dark:border-[#3D2F36]">
              <div>
                <h3 className="font-serif font-bold text-lg text-[#2D2327] dark:text-[#FAF4F0]">
                  Gerenciar Categorias da Agenda
                </h3>
                <p className="text-xs text-[#7D6F74] dark:text-[#B8A8AF]">
                  Crie, renomeie ou remova as categorias de compromissos.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsManageCategoriesModalOpen(false);
                  setEditingCatOriginal(null);
                }}
                className="text-xs text-[#7D6F74] hover:text-[#2D2327] dark:hover:text-white p-1 rounded-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Direct Add New Category Box */}
            <div className="p-3 rounded-2xl bg-[#FAF8F5] dark:bg-[#2A2026] border border-[#F2E8E4] dark:border-[#3D2F36] space-y-2">
              <label className="block text-xs font-semibold text-[#2D2327] dark:text-[#FAF4F0]">
                Adicionar Nova Categoria
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={modalNewCatInput}
                  onChange={(e) => setModalNewCatInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      if (modalNewCatInput.trim()) {
                        handleAddCategory(modalNewCatInput.trim());
                        setModalNewCatInput('');
                      }
                    }
                  }}
                  placeholder="Ex: Finanças & Contas, Pets, Estudos..."
                  className="flex-1 px-3 py-2 rounded-xl bg-white dark:bg-[#1F171C] border border-[#F2E8E4] dark:border-[#3D2F36] text-xs text-[#2D2327] dark:text-[#FAF4F0] focus:outline-none focus:ring-1 focus:ring-[#E07A8B]"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (modalNewCatInput.trim()) {
                      handleAddCategory(modalNewCatInput.trim());
                      setModalNewCatInput('');
                    }
                  }}
                  className="flex items-center gap-1 px-3 py-2 rounded-xl bg-[#E07A8B] hover:bg-[#d66a7c] text-white text-xs font-semibold transition-all cursor-pointer shadow-xs shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Criar</span>
                </button>
              </div>
            </div>

            {/* All Categories List */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[#7D6F74] dark:text-[#B8A8AF]">
                  Todas as Categorias ({categories.length})
                </span>
                <button
                  type="button"
                  onClick={handleRestoreDefaultCategories}
                  className="text-[11px] text-[#E07A8B] hover:underline font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" /> Restaurar Padrões
                </button>
              </div>

              {categories.length === 0 ? (
                <p className="text-xs text-center py-4 text-[#7D6F74] dark:text-[#B8A8AF] bg-[#FAF8F5] dark:bg-[#2A2026] rounded-2xl border border-dashed border-[#F2E8E4] dark:border-[#3D2F36]">
                  Nenhuma categoria cadastrada. Digite acima para criar!
                </p>
              ) : (
                <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
                  {categories.map((cat) => {
                    const isEditingThis = editingCatOriginal === cat;
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
                              value={editingCatInput}
                              onChange={(e) => setEditingCatInput(e.target.value)}
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
                              onClick={() => setEditingCatOriginal(null)}
                              className="px-2 py-1.5 text-xs text-[#7D6F74] hover:text-zinc-900 dark:hover:text-white cursor-pointer"
                            >
                              Cancelar
                            </button>
                          </div>
                        ) : (
                          <>
                            <div className="flex items-center gap-2">
                              <span className="p-1 rounded-lg bg-white dark:bg-[#1E161B] border border-[#F2E8E4] dark:border-[#3D2F36]">
                                {getCategoryIcon(cat)}
                              </span>
                              <span className="text-xs sm:text-sm font-medium text-[#2D2327] dark:text-[#FAF4F0]">
                                {cat}
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingCatOriginal(cat);
                                  setEditingCatInput(cat);
                                }}
                                className="p-1.5 rounded-lg text-[#7D6F74] dark:text-[#B8A8AF] hover:text-[#E07A8B] hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                                title="Editar nome da categoria"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  handleDeleteCategory(cat);
                                }}
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
                  })}
                </div>
              )}
            </div>

            <div className="pt-2 border-t border-[#F2E8E4] dark:border-[#3D2F36]">
              <button
                type="button"
                onClick={() => {
                  setIsManageCategoriesModalOpen(false);
                  setEditingCatOriginal(null);
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
