import React, { useState } from 'react';
import {
  CalendarDays,
  Sparkles,
  Heart,
  Check,
  Plus,
  RefreshCw,
  Utensils,
  ChevronRight,
  Sun,
  Moon,
  Trash2,
} from 'lucide-react';
import {
  WeeklyMenuItem,
  PantryItem,
  PartnerId,
  CoupleProfile,
} from '../types';
import { PartnerAvatar } from './PartnerAvatar';

interface WeeklyMenuViewProps {
  menu: WeeklyMenuItem[];
  pantry: PantryItem[];
  profile: CoupleProfile;
  activePartner: PartnerId;
  onVoteMeal: (id: string, partner: PartnerId) => void;
  onUpdateMenuItem: (item: WeeklyMenuItem) => void;
  onApplyAiSuggestions: (newItems: WeeklyMenuItem[]) => void;
}

export const WeeklyMenuView: React.FC<WeeklyMenuViewProps> = ({
  menu,
  pantry,
  profile,
  activePartner,
  onVoteMeal,
  onUpdateMenuItem,
  onApplyAiSuggestions,
}) => {
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiSuccessMsg, setAiSuccessMsg] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<WeeklyMenuItem | null>(null);
  const safeMenu = Array.isArray(menu) ? menu : [];

  const daysOfWeek = [
    'Segunda-feira',
    'Terça-feira',
    'Quarta-feira',
    'Quinta-feira',
    'Sexta-feira',
    'Sábado',
    'Domingo',
  ];

  const handleSuggestAiMenu = async () => {
    setIsAiLoading(true);
    setAiSuccessMsg(null);
    try {
      const pantryPayload = (pantry || []).map((p) => ({
        name: p.name,
        quantity: p.quantity,
        unit: p.unit,
        expirationDate: p.expirationDate,
      }));

      const res = await fetch('/api/ai/suggest-menu', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pantryItems: pantryPayload }),
      });

      if (!res.ok) {
        throw new Error('Falha ao gerar sugestão de cardápio');
      }

      const data = await res.json();
      if (Array.isArray(data.suggestions) && data.suggestions.length > 0) {
        const newMenuItems: WeeklyMenuItem[] = data.suggestions.map((s: any, idx: number) => {
          // Normalize day of week
          let day = s.dayOfWeek;
          if (!day || !daysOfWeek.includes(day)) {
            const foundDay = daysOfWeek.find((d) => (s.daySuggestion || '').includes(d));
            day = foundDay || daysOfWeek[idx % daysOfWeek.length];
          }

          const mealType =
            s.mealType === 'almoco' || s.mealType === 'jantar'
              ? s.mealType
              : (s.daySuggestion || '').toLowerCase().includes('almoço')
              ? 'almoco'
              : idx % 2 === 0
              ? 'almoco'
              : 'jantar';

          const dish = s.dishName || s.mealName || 'Prato Especial do Casal';
          const noteText =
            s.notes ||
            s.reason ||
            (Array.isArray(s.usedPantry) && s.usedPantry.length > 0
              ? `Aproveita da despensa: ${s.usedPantry.join(', ')}`
              : 'Sugerido para vocês duas aproveitarem juntas!');

          return {
            id: `ai-menu-${Date.now()}-${idx}`,
            dayOfWeek: day,
            mealType,
            dishName: dish,
            recipeId: undefined,
            votes1: false,
            votes2: false,
            notes: noteText,
            suggestedBy: 'ia',
          };
        });

        onApplyAiSuggestions(newMenuItems);
        setAiSuccessMsg('✨ Cardápio da semana criado com sucesso!');
        setTimeout(() => setAiSuccessMsg(null), 4000);
      }
    } catch (err) {
      console.warn('Erro ao sugerir menu com IA:', err);
      // Even if network drops, notify gently
      setAiSuccessMsg('Não foi possível conectar ao assistente no momento. Tente novamente!');
      setTimeout(() => setAiSuccessMsg(null), 4000);
    } finally {
      setIsAiLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-serif text-2xl font-bold text-[#2D2327] dark:text-[#FAF4F0]">
            Cardápio da Semana & Votação
          </h2>
          <p className="text-xs sm:text-sm text-[#7D6F74] dark:text-[#B8A8AF] mt-0.5">
            Decidam o que comer juntos sem indecisão! Votem nos pratos ou deixem a IA sugerir usando o que já temos na despensa.
          </p>
        </div>

        <button
          onClick={handleSuggestAiMenu}
          disabled={isAiLoading}
          className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-[#E07A8B] to-[#D4A373] hover:opacity-95 text-white font-medium text-xs sm:text-sm shadow-sm transition-all disabled:opacity-50"
        >
          {isAiLoading ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Criando Menu com IA...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              <span>Sugerir Menu com Despensa (IA)</span>
            </>
          )}
        </button>
      </div>

      {/* Success / Notification Banner */}
      {aiSuccessMsg && (
        <div className="p-3.5 rounded-2xl bg-rose-50/80 dark:bg-rose-950/40 border border-[#E07A8B]/40 text-xs text-[#E07A8B] dark:text-rose-300 font-medium flex items-center gap-2 animate-fade-in shadow-xs">
          <Sparkles className="w-4 h-4 shrink-0" />
          <span>{aiSuccessMsg}</span>
        </div>
      )}

      {/* Days Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {daysOfWeek.map((day) => {
          const dayMeals = safeMenu.filter((m) => m.dayOfWeek === day);

          return (
            <div
              key={day}
              className="flex flex-col rounded-3xl bg-white dark:bg-[#241C21] border border-[#F2E8E4] dark:border-[#3D2F36] shadow-xs overflow-hidden"
            >
              {/* Day Header */}
              <div className="px-4 py-3 bg-[#FAF8F5] dark:bg-[#2A2026] border-b border-[#F2E8E4] dark:border-[#3D2F36] flex items-center justify-between">
                <span className="font-serif font-bold text-sm text-[#2D2327] dark:text-[#FAF4F0]">
                  {day}
                </span>
                <span className="text-[11px] text-[#7D6F74] dark:text-[#B8A8AF]">
                  {dayMeals.length} refeições
                </span>
              </div>

              {/* Meals List */}
              <div className="p-3 space-y-3 flex-1">
                {dayMeals.length === 0 ? (
                  <div className="py-6 text-center text-xs text-[#A6999F] dark:text-[#8C7C83]">
                    Sem prato planejado ainda.
                  </div>
                ) : (
                  dayMeals.map((meal) => {
                    const isFullyApproved = meal.votes1 && meal.votes2;

                    return (
                      <div
                        key={meal.id}
                        className={`p-3 rounded-2xl border transition-all ${
                          isFullyApproved
                            ? 'bg-rose-50/50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/60 shadow-xs'
                            : 'bg-[#FAF8F5] dark:bg-[#2B2026] border-[#F2E8E4] dark:border-[#3D2F36]'
                        }`}
                      >
                        {/* Meal type pill & approval badge */}
                        <div className="flex items-center justify-between gap-1 mb-1.5">
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-[#D4A373] dark:text-[#EAD5C3]">
                            {meal.mealType === 'almoco' ? (
                              <>
                                <Sun className="w-3 h-3 text-amber-500" /> Almoço
                              </>
                            ) : (
                              <>
                                <Moon className="w-3 h-3 text-indigo-400" /> Jantar
                              </>
                            )}
                          </span>

                          {isFullyApproved && (
                            <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-rose-600 dark:text-rose-300 bg-white dark:bg-[#38262F] px-2 py-0.5 rounded-full shadow-2xs">
                              <Heart className="w-2.5 h-2.5 fill-rose-500 text-rose-500" /> Aprovado!
                            </span>
                          )}
                        </div>

                        {/* Dish name */}
                        <h4 className="font-bold text-xs sm:text-sm text-[#2D2327] dark:text-[#FAF4F0]">
                          {meal.dishName}
                        </h4>

                        {meal.notes && (
                          <p className="text-[11px] text-[#7D6F74] dark:text-[#B8A8AF] mt-0.5 italic">
                            {meal.notes}
                          </p>
                        )}

                        {/* Voting Section */}
                        <div className="mt-2.5 pt-2 border-t border-[#F2E8E4] dark:border-[#3D2F36] flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {/* Partner 1 Vote */}
                            <button
                              onClick={() => onVoteMeal(meal.id, 'partner1')}
                              className={`flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-medium transition-all ${
                                meal.votes1
                                  ? 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 ring-1 ring-rose-400'
                                  : 'bg-white dark:bg-[#33272E] text-[#7D6F74] dark:text-[#B8A8AF] hover:bg-rose-50'
                              }`}
                              title={`Voto de ${profile.partner1.name}`}
                            >
                              <PartnerAvatar avatar={profile.partner1.avatar} name={profile.partner1.name} size="xs" />
                              <Heart
                                className={`w-3 h-3 ${
                                  meal.votes1 ? 'fill-rose-500 text-rose-500' : 'text-zinc-400'
                                }`}
                              />
                            </button>

                            {/* Partner 2 Vote */}
                            <button
                              onClick={() => onVoteMeal(meal.id, 'partner2')}
                              className={`flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-medium transition-all ${
                                meal.votes2
                                  ? 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 ring-1 ring-rose-400'
                                  : 'bg-white dark:bg-[#33272E] text-[#7D6F74] dark:text-[#B8A8AF] hover:bg-rose-50'
                              }`}
                              title={`Voto de ${profile.partner2.name}`}
                            >
                              <PartnerAvatar avatar={profile.partner2.avatar} name={profile.partner2.name} size="xs" />
                              <Heart
                                className={`w-3 h-3 ${
                                  meal.votes2 ? 'fill-rose-500 text-rose-500' : 'text-zinc-400'
                                }`}
                              />
                            </button>
                          </div>

                          <button
                            onClick={() => setEditingItem(meal)}
                            className="text-[11px] text-[#A6999F] hover:text-[#2D2327] dark:hover:text-white"
                          >
                            Editar
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Edit Item Modal */}
      {editingItem && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#241C21] rounded-3xl max-w-md w-full p-6 border border-[#F2E8E4] dark:border-[#3D2F36] shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#F2E8E4] dark:border-[#3D2F36]">
              <h3 className="font-serif font-bold text-lg text-[#2D2327] dark:text-[#FAF4F0]">
                Editar Prato ({editingItem.dayOfWeek})
              </h3>
              <button
                onClick={() => setEditingItem(null)}
                className="text-xs text-[#7D6F74] hover:text-black dark:hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs sm:text-sm">
              <div>
                <label className="block font-medium text-[#2D2327] dark:text-[#FAF4F0] mb-1">
                  Nome do Prato
                </label>
                <input
                  type="text"
                  value={editingItem.dishName}
                  onChange={(e) =>
                    setEditingItem({ ...editingItem, dishName: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-xl bg-[#FAF8F5] dark:bg-[#2D2228] border border-[#F2E8E4] dark:border-[#3D2F36] text-[#2D2327] dark:text-[#FAF4F0] focus:outline-none focus:ring-1 focus:ring-[#E07A8B]"
                />
              </div>

              <div>
                <label className="block font-medium text-[#2D2327] dark:text-[#FAF4F0] mb-1">
                  Notas / Ideias
                </label>
                <textarea
                  rows={2}
                  value={editingItem.notes || ''}
                  onChange={(e) =>
                    setEditingItem({ ...editingItem, notes: e.target.value })
                  }
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
                  type="button"
                  onClick={() => {
                    onUpdateMenuItem(editingItem);
                    setEditingItem(null);
                  }}
                  className="px-5 py-2 rounded-xl bg-[#E07A8B] text-white font-medium shadow-xs"
                >
                  Salvar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
