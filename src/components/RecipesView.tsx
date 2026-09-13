import React, { useState, useRef } from 'react';
import {
  UtensilsCrossed,
  Sparkles,
  Plus,
  Search,
  Clock,
  Users,
  Flame,
  Heart,
  ExternalLink,
  CheckCircle2,
  ShoppingCart,
  Trash2,
  BookOpen,
  Filter,
  Check,
  Download,
  Edit3,
  Camera,
  Image as ImageIcon,
  ChevronDown,
  Settings2,
} from 'lucide-react';
import { RecipeItem, PartnerId, CoupleProfile } from '../types';
import { compressImageFile } from '../utils/imageCompression';
import { PartnerAvatar } from './PartnerAvatar';

const RECIPE_CATEGORY_SUGGESTIONS = [
  'Jantar Romântico',
  'Massa & Risoto',
  'Sobremesa dos Sonhos',
  'Café da Manhã a Dois',
  'Prático em 15 min',
  'Comfort Food',
  'Italiana',
  'Asiática & Oriental',
  'Fit & Leve',
  'Sem Glúten',
  'Sem Lactose',
  'Vegetariano',
  'Lanche da Noite',
  'Petiscos & Drinks',
];

interface RecipesViewProps {
  recipes: RecipeItem[];
  profile: CoupleProfile;
  activePartner: PartnerId;
  onAddRecipe: (recipe: Omit<RecipeItem, 'id' | 'addedAt'>) => void;
  onUpdateRecipe: (recipe: RecipeItem) => void;
  onDeleteRecipe: (id: string) => void;
  onAddIngredientsToGroceries: (ingredients: string[]) => void;
}

export const RecipesView: React.FC<RecipesViewProps> = ({
  recipes,
  profile,
  activePartner,
  onAddRecipe,
  onUpdateRecipe,
  onDeleteRecipe,
  onAddIngredientsToGroceries,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string>('Todos');
  const [activeRecipe, setActiveRecipe] = useState<RecipeItem | null>(null);

  // AI Extraction Modal State
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [aiUrl, setAiUrl] = useState('');
  const [aiPrompt, setAiPrompt] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiError, setAiError] = useState('');

  // Manual Recipe with Link Modal State
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [manualTitle, setManualTitle] = useState('');
  const [manualUrl, setManualUrl] = useState('');
  const [manualDescription, setManualDescription] = useState('');
  const [manualPrepTime, setManualPrepTime] = useState('20 min');
  const [manualCookTime, setManualCookTime] = useState('20 min');
  const [manualServings, setManualServings] = useState('2 pessoas');
  const [manualDifficulty, setManualDifficulty] = useState<'Fácil' | 'Médio' | 'Elaborado'>('Fácil');
  const [manualTag, setManualTag] = useState('Jantar Romântico');
  const [manualImageUrl, setManualImageUrl] = useState('');
  const [manualIngredientsText, setManualIngredientsText] = useState('');
  const [manualInstructionsText, setManualInstructionsText] = useState('');
  const manualImageFileRef = useRef<HTMLInputElement>(null);

  // Manage All Categories State (Defaults can be renamed, new ones added, etc.)
  const [allCategories, setAllCategories] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('nos_dois_all_recipe_categories');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return [
      'Jantar Romântico',
      'Massa & Risoto',
      'Sobremesa dos Sonhos',
      'Café da Manhã a Dois',
      'Prático em 15 min',
      'Comfort Food',
      'Italiana',
      'Asiática & Oriental',
      'Fit & Leve',
      'Sem Glúten',
      'Sem Lactose',
      'Vegetariano',
      'Lanche da Noite',
      'Petiscos & Drinks',
    ];
  });

  const [customCatInput, setCustomCatInput] = useState('');
  const [isCreatingNewCat, setIsCreatingNewCat] = useState(false);

  // Edit Recipe State
  const [editingRecipe, setEditingRecipe] = useState<RecipeItem | null>(null);
  const [recipeToDelete, setRecipeToDelete] = useState<RecipeItem | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editUrl, setEditUrl] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editPrepTime, setEditPrepTime] = useState('20 min');
  const [editCookTime, setEditCookTime] = useState('20 min');
  const [editServings, setEditServings] = useState('2 pessoas');
  const [editDifficulty, setEditDifficulty] = useState<'Fácil' | 'Médio' | 'Elaborado'>('Fácil');
  const [editTag, setEditTag] = useState('Jantar Romântico');
  const [isCreatingEditCat, setIsCreatingEditCat] = useState(false);
  const [customEditCatInput, setCustomEditCatInput] = useState('');

  const [isManagingCategoriesModalOpen, setIsManagingCategoriesModalOpen] = useState(false);
  const [editingCategoryOriginal, setEditingCategoryOriginal] = useState<string | null>(null);
  const [editingCategoryInput, setEditingCategoryInput] = useState('');

  const handleAddCustomCategory = (catName: string) => {
    const trimmed = catName.trim();
    if (!trimmed) return;
    if (!allCategories.includes(trimmed)) {
      const updated = [...allCategories, trimmed];
      setAllCategories(updated);
      try {
        localStorage.setItem('nos_dois_all_recipe_categories', JSON.stringify(updated));
      } catch {}
    }
  };

  const handleDeleteCategory = (catToDelete: string) => {
    const updated = allCategories.filter((c) => c !== catToDelete);
    setAllCategories(updated);
    try {
      localStorage.setItem('nos_dois_all_recipe_categories', JSON.stringify(updated));
    } catch {}
    if (manualTag === catToDelete) setManualTag(updated[0] || 'Geral');
    if (editTag === catToDelete) setEditTag(updated[0] || 'Geral');
    if (selectedTag === catToDelete) setSelectedTag('Todos');
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
      localStorage.setItem('nos_dois_all_recipe_categories', JSON.stringify(updated));
    } catch {}

    if (manualTag === oldCat) setManualTag(trimmed);
    if (editTag === oldCat) setEditTag(trimmed);
    if (selectedTag === oldCat) setSelectedTag(trimmed);

    // Update all existing recipes that had this category
    recipes.forEach((r) => {
      let changed = false;
      let newTags = r.tags || [];
      let newDietary = r.dietaryTags || [];
      if (newTags.includes(oldCat)) {
        newTags = newTags.map((t) => (t === oldCat ? trimmed : t));
        changed = true;
      }
      if (newDietary.includes(oldCat)) {
        newDietary = newDietary.map((t) => (t === oldCat ? trimmed : t));
        changed = true;
      }
      if (changed) {
        onUpdateRecipe({
          ...r,
          tags: newTags,
          dietaryTags: newDietary,
        });
      }
    });

    setEditingCategoryOriginal(null);
  };
  const [editImageUrl, setEditImageUrl] = useState('');
  const [editIngredientsText, setEditIngredientsText] = useState('');
  const [editInstructionsText, setEditInstructionsText] = useState('');
  const editImageFileRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (file: File, callback: (val: string) => void) => {
    if (!file) return;
    try {
      const compressed = await compressImageFile(file, 900, 0.75);
      callback(compressed);
    } catch {
      const reader = new FileReader();
      reader.onload = (e) => {
        const res = e.target?.result;
        if (typeof res === 'string') {
          callback(res);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const openEditRecipeModal = (recipe: RecipeItem) => {
    setEditingRecipe(recipe);
    setEditTitle(recipe.title);
    setEditUrl(recipe.sourceUrl || '');
    setEditDescription(recipe.description);
    setEditPrepTime(recipe.prepTime);
    setEditCookTime(recipe.cookTime);
    setEditServings(recipe.servings);
    setEditDifficulty(recipe.difficulty);
    setEditTag(recipe.dietaryTags[0] || 'Jantar Romântico');
    setEditImageUrl(recipe.imageUrl);
    setEditIngredientsText(
      recipe.ingredients
        .map((i) => (i.amount ? `${i.name} (${i.amount})` : i.name))
        .join('\n')
    );
    setEditInstructionsText(recipe.instructions.join('\n'));
  };

  const handleSaveRecipeEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRecipe || !editTitle.trim()) return;

    const parsedIngredients = editIngredientsText
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean)
      .map((line) => {
        const match = line.match(/^(.+?)\s*\((.+?)\)$/);
        if (match) {
          return { name: match[1].trim(), amount: match[2].trim(), inPantry: false };
        }
        return { name: line, amount: 'a gosto', inPantry: false };
      });

    const parsedInstructions = editInstructionsText
      .split('\n')
      .map((l) => l.trim().replace(/^\d+[\.\-\)]\s*/, ''))
      .filter(Boolean);

    const updated: RecipeItem = {
      ...editingRecipe,
      title: editTitle.trim(),
      description: editDescription.trim() || 'Receita especial feita com carinho.',
      prepTime: editPrepTime.trim() || '20 min',
      cookTime: editCookTime.trim() || '20 min',
      servings: editServings.trim() || '2 pessoas',
      difficulty: editDifficulty,
      dietaryTags: Array.from(new Set([editTag, ...editingRecipe.dietaryTags.filter(t => t !== editTag)])),
      sourceUrl: editUrl.trim() || undefined,
      imageUrl:
        editImageUrl.trim() ||
        'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80',
      ingredients:
        parsedIngredients.length > 0
          ? parsedIngredients
          : [{ name: 'Ingredientes a combinar', amount: 'a gosto', inPantry: false }],
      instructions:
        parsedInstructions.length > 0
          ? parsedInstructions
          : ['Seguir passos do preparo com amor e harmonia.'],
    };

    onUpdateRecipe(updated);
    if (activeRecipe && activeRecipe.id === updated.id) {
      setActiveRecipe(updated);
    }
    setEditingRecipe(null);
  };

  const currentPartner = activePartner === 'partner1' ? profile.partner1 : profile.partner2;

  const dietaryFilterOptions = ['Todos', ...allCategories];

  const filteredRecipes = recipes.filter((r) => {
    const matchesTag =
      selectedTag === 'Todos' ||
      r.dietaryTags?.includes(selectedTag) ||
      (r.tags && r.tags.includes(selectedTag));
    const matchesSearch =
      r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.ingredients.some((i) => i.name.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesTag && matchesSearch;
  });

  const handleExtractWithAi = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiUrl.trim() && !aiPrompt.trim()) return;

    setIsAiLoading(true);
    setAiError('');

    try {
      const res = await fetch('/api/recipes/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: aiUrl.trim(), prompt: aiPrompt.trim() }),
      });

      if (!res.ok) {
        throw new Error('Falha ao processar receita');
      }

      const extracted = await res.json();

      onAddRecipe({
        title: extracted.title || 'Receita Especial a Dois',
        description: extracted.description || 'Importada com auxílio de IA.',
        prepTime: extracted.prepTime || '20 min',
        cookTime: extracted.cookTime || '20 min',
        servings: extracted.servings || '2 pessoas',
        difficulty: extracted.difficulty || 'Fácil',
        dietaryTags: extracted.dietaryTags || ['Jantar a Dois'],
        sourceUrl: aiUrl.trim() || undefined,
        imageUrl:
          'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80',
        ingredients: (extracted.ingredients || []).map((i: any) => ({
          name: i.name,
          amount: i.amount,
          inPantry: false,
        })),
        instructions: extracted.instructions || ['Modo de preparo'],
        addedBy: activePartner,
        favorite: false,
      });

      // Reset modal
      setAiUrl('');
      setAiPrompt('');
      setIsAiModalOpen(false);
    } catch (err: any) {
      setAiError(err.message || 'Erro ao extrair com IA');
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleCreateManualRecipe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualTitle.trim()) return;

    // Parse ingredients from lines
    const parsedIngredients = manualIngredientsText
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean)
      .map((line) => {
        const match = line.match(/^(.+?)\s*\((.+?)\)$/);
        if (match) {
          return { name: match[1].trim(), amount: match[2].trim(), inPantry: false };
        }
        return { name: line, amount: 'a gosto', inPantry: false };
      });

    // Parse instructions
    const parsedInstructions = manualInstructionsText
      .split('\n')
      .map((l) => l.trim().replace(/^\d+[\.\-\)]\s*/, ''))
      .filter(Boolean);

    onAddRecipe({
      title: manualTitle.trim(),
      description: manualDescription.trim() || 'Receita salva com carinho para fazermos juntas.',
      prepTime: manualPrepTime.trim() || '20 min',
      cookTime: manualCookTime.trim() || '20 min',
      servings: manualServings.trim() || '2 pessoas',
      difficulty: manualDifficulty,
      dietaryTags: [manualTag],
      sourceUrl: manualUrl.trim() || undefined,
      imageUrl:
        manualImageUrl.trim() ||
        'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80',
      ingredients:
        parsedIngredients.length > 0
          ? parsedIngredients
          : [{ name: 'Ver ingredientes no link original', amount: 'na receita', inPantry: false }],
      instructions:
        parsedInstructions.length > 0
          ? parsedInstructions
          : ['Acesse o link salvo para conferir o modo de preparo completo.'],
      addedBy: activePartner,
      favorite: false,
    });

    // Reset modal
    setManualTitle('');
    setManualUrl('');
    setManualDescription('');
    setManualIngredientsText('');
    setManualInstructionsText('');
    setManualImageUrl('');
    setIsManualModalOpen(false);
  };

  const handleAddMissingToCart = (recipe: RecipeItem) => {
    const missing = recipe.ingredients
      .filter((i) => !i.inPantry)
      .map((i) => `${i.name} (${i.amount})`);

    if (missing.length > 0) {
      onAddIngredientsToGroceries(missing);
      alert(`${missing.length} ingredientes adicionados à Lista de Compras compartilhada! 🛒`);
    } else {
      alert('Todos os ingredientes já estão marcados como disponíveis na despensa! ✨');
    }
  };

  return (
    <div className="space-y-6">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-serif text-2xl font-bold text-[#2D2327] dark:text-[#FAF4F0]">
            Nosso Livro de Receitas
          </h2>
          <p className="text-xs sm:text-sm text-[#7D6F74] dark:text-[#B8A8AF] mt-0.5">
            Salvem receitas com links da internet (Instagram, TikTok, TudoGostoso) ou deixem a IA formatar o prato para vocês duas!
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={() => setIsManualModalOpen(true)}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-2xl bg-white dark:bg-[#2F2128] border border-rose-200 dark:border-rose-900/50 hover:bg-[#FAF3EC] text-[#E07A8B] dark:text-[#F492A5] font-semibold text-xs sm:text-sm shadow-xs transition-all whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            <span>Salvar Receita com Link</span>
          </button>

          <button
            onClick={() => setIsAiModalOpen(true)}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-[#E07A8B] to-[#E58C9B] hover:opacity-95 text-white font-medium text-xs sm:text-sm shadow-sm transition-all whitespace-nowrap"
          >
            <Sparkles className="w-4 h-4" />
            <span>Importar com IA</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 p-3 rounded-2xl bg-white dark:bg-[#241C21] border border-[#F2E8E4] dark:border-[#3D2F36]">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-[#7D6F74] dark:text-[#B8A8AF] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por receita ou ingrediente..."
            className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-[#FAF8F5] dark:bg-[#2D2228] border-none text-xs sm:text-sm text-[#2D2327] dark:text-[#FAF4F0] placeholder-[#A6999F] focus:outline-none focus:ring-1 focus:ring-[#E07A8B]"
          />
        </div>

        {/* Dietary Restriction Pills & Manage Button */}
        <div className="flex flex-wrap items-center gap-1.5">
          {dietaryFilterOptions.map((tag) => (
            <button
              key={tag}
              onClick={() => setSelectedTag(tag)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
                selectedTag === tag
                  ? 'bg-[#E07A8B] text-white'
                  : 'text-[#7D6F74] dark:text-[#B8A8AF] hover:bg-[#FAF3EC] dark:hover:bg-[#2D2228]'
              }`}
            >
              {tag}
            </button>
          ))}

          <button
            type="button"
            onClick={() => setIsManagingCategoriesModalOpen(true)}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold text-[#E07A8B] hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 transition-colors cursor-pointer"
            title="Alterar nomes das categorias (ex: Jantar Romântico)"
          >
            <Settings2 className="w-3.5 h-3.5" />
            <span>Editar Categorias</span>
          </button>
        </div>
      </div>

      {/* Recipes Grid */}
      {filteredRecipes.length === 0 ? (
        <div className="py-16 text-center rounded-3xl bg-white dark:bg-[#241C21] border border-[#F2E8E4] dark:border-[#3D2F36]">
          <UtensilsCrossed className="w-10 h-10 mx-auto text-[#E07A8B]/60 mb-2" />
          <p className="text-sm font-semibold text-[#2D2327] dark:text-[#FAF4F0]">
            Nenhuma receita encontrada
          </p>
          <p className="text-xs text-[#7D6F74] dark:text-[#B8A8AF] mt-1">
            Que tal colar aquele link do reels ou sugerir uma receita que vocês amam?
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {filteredRecipes.map((recipe) => {
            const addedPartner =
              recipe.addedBy === 'partner1' ? profile.partner1 : profile.partner2;

            return (
              <div
                key={recipe.id}
                className="group relative flex flex-col rounded-3xl bg-white dark:bg-[#241C21] border border-[#F2E8E4] dark:border-[#3D2F36] overflow-hidden shadow-xs hover:shadow-md transition-all"
              >
                {/* Image & Badges */}
                <div className="relative h-40 sm:h-48 w-full overflow-hidden bg-zinc-100 dark:bg-zinc-800">
                  <img
                    src={recipe.imageUrl}
                    alt={recipe.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />

                  {/* Card top right actions */}
                  <div className="absolute top-3 right-3 flex items-center gap-1.5">
                    <button
                      onClick={() => openEditRecipeModal(recipe)}
                      className="p-1.5 rounded-full bg-black/50 text-white hover:bg-black/80 hover:scale-105 transition-all"
                      title="Editar receita"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setRecipeToDelete(recipe)}
                      className="p-1.5 rounded-full bg-black/50 text-white/85 hover:text-rose-400 hover:bg-black/80 hover:scale-105 transition-all"
                      title="Excluir receita"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onUpdateRecipe({ ...recipe, favorite: !recipe.favorite })}
                      className="p-1.5 rounded-full bg-black/50 text-white backdrop-blur-xs hover:scale-110 transition-transform"
                      title="Favoritar receita"
                    >
                      <Heart
                        className={`w-3.5 h-3.5 ${recipe.favorite ? 'text-rose-500 fill-rose-500' : 'text-white'}`}
                      />
                    </button>
                  </div>

                  {/* Difficulty and Offline Pill */}
                  <div className="absolute top-3 left-3 flex items-center gap-1.5">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/90 dark:bg-black/80 text-zinc-900 dark:text-zinc-100">
                      {recipe.difficulty}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/90 text-white flex items-center gap-1">
                      <Check className="w-2.5 h-2.5" /> Offline
                    </span>
                  </div>

                  {/* Bottom title & prep time */}
                  <div className="absolute bottom-3 left-3 right-3">
                    <h3 className="font-serif font-bold text-base text-white leading-snug line-clamp-1">
                      {recipe.title}
                    </h3>
                    <div className="flex items-center gap-3 text-[11px] text-zinc-300 mt-1">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {recipe.prepTime}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3" /> {recipe.servings}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Body */}
                <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                  <p className="text-xs text-[#7D6F74] dark:text-[#B8A8AF] line-clamp-2">
                    {recipe.description}
                  </p>

                  {/* Tags & Web Link */}
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex flex-wrap gap-1">
                      {recipe.dietaryTags.slice(0, 3).map((tag) => (
                        <span
                          key={tag}
                          className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-[#FAF3EC] dark:bg-[#2F2228] text-[#D4A373] dark:text-[#EAD5C3]"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>

                    {recipe.sourceUrl && (
                      <a
                        href={recipe.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-lg bg-rose-50 dark:bg-rose-950/60 text-[#E07A8B] dark:text-[#F492A5] hover:bg-rose-100 font-medium transition-colors"
                        title="Abrir receita original no navegador"
                      >
                        <ExternalLink className="w-3 h-3" />
                        <span>Link da Web</span>
                      </a>
                    )}
                  </div>

                  {/* Bottom Action Bar */}
                  <div className="pt-3 border-t border-[#F2E8E4] dark:border-[#3D2F36] flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-[11px] text-[#7D6F74] dark:text-[#B8A8AF]">
                      <PartnerAvatar avatar={addedPartner.avatar} name={addedPartner.name} size="xs" />
                      <span>Salvo por {addedPartner.name}</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => openEditRecipeModal(recipe)}
                        className="p-1.5 rounded-xl text-[#7D6F74] hover:text-[#E07A8B] hover:bg-[#FAF3EC] dark:hover:bg-[#2F2228] transition-colors"
                        title="Editar receita"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setActiveRecipe(recipe)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#FAF3EC] dark:bg-[#2F2228] text-[#E07A8B] dark:text-[#F492A5] hover:bg-[#F2E8E4] dark:hover:bg-[#3D2F36] text-xs font-semibold transition-colors"
                      >
                        <BookOpen className="w-3.5 h-3.5" />
                        <span>Ver Receita</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Recipe Detail Modal */}
      {activeRecipe && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#241C21] rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-[#F2E8E4] dark:border-[#3D2F36] shadow-2xl p-6 space-y-6">
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-4 pb-4 border-b border-[#F2E8E4] dark:border-[#3D2F36]">
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 dark:bg-rose-950/60 text-[#E07A8B] dark:text-[#F492A5]">
                    {activeRecipe.difficulty}
                  </span>
                  <span className="text-xs text-[#7D6F74] dark:text-[#B8A8AF]">
                    Rendimento: {activeRecipe.servings}
                  </span>
                  <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                    ✓ Disponível Offline
                  </span>
                </div>
                <h3 className="font-serif font-bold text-xl sm:text-2xl text-[#2D2327] dark:text-[#FAF4F0]">
                  {activeRecipe.title}
                </h3>
                <p className="text-xs sm:text-sm text-[#7D6F74] dark:text-[#B8A8AF] mt-1">
                  {activeRecipe.description}
                </p>
              </div>

              <button
                onClick={() => setActiveRecipe(null)}
                className="p-1.5 rounded-full text-[#7D6F74] hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                ✕
              </button>
            </div>

            {/* Web Link Banner in Modal */}
            {activeRecipe.sourceUrl ? (
              <div className="p-3.5 rounded-2xl bg-[#FAF3EC] dark:bg-[#2F2128] border border-rose-200/70 dark:border-rose-900/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 overflow-hidden">
                  <div className="w-8 h-8 rounded-xl bg-rose-100 dark:bg-rose-900/50 flex items-center justify-center text-[#E07A8B] shrink-0">
                    <ExternalLink className="w-4 h-4" />
                  </div>
                  <div className="truncate">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-[#E07A8B] block">
                      Link da Receita Original
                    </span>
                    <a
                      href={activeRecipe.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-medium text-[#2D2327] dark:text-[#FAF4F0] hover:underline truncate block"
                    >
                      {activeRecipe.sourceUrl}
                    </a>
                  </div>
                </div>

                <a
                  href={activeRecipe.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#E07A8B] hover:opacity-95 text-white text-xs font-semibold shrink-0 shadow-2xs"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Abrir Receita ↗</span>
                </a>
              </div>
            ) : (
              <div className="p-3 rounded-2xl bg-[#FAF8F5] dark:bg-[#2D2228] flex items-center justify-between gap-2 text-xs">
                <span className="text-[#7D6F74] dark:text-[#B8A8AF]">Deseja adicionar o link original da receita?</span>
                <button
                  onClick={() => {
                    const url = prompt('Cole o link da receita na internet (Instagram, TikTok, site):');
                    if (url && url.trim()) {
                      const updated = { ...activeRecipe, sourceUrl: url.trim() };
                      setActiveRecipe(updated);
                      onUpdateRecipe(updated);
                    }
                  }}
                  className="text-[#E07A8B] font-semibold hover:underline"
                >
                  + Adicionar Link da Web
                </button>
              </div>
            )}

            {/* Times */}
            <div className="grid grid-cols-3 gap-2 p-3 rounded-2xl bg-[#FAF8F5] dark:bg-[#2D2228] text-center text-xs">
              <div>
                <span className="text-[#7D6F74] dark:text-[#B8A8AF] block">Preparo</span>
                <strong className="text-[#2D2327] dark:text-[#FAF4F0]">{activeRecipe.prepTime}</strong>
              </div>
              <div>
                <span className="text-[#7D6F74] dark:text-[#B8A8AF] block">Cozimento</span>
                <strong className="text-[#2D2327] dark:text-[#FAF4F0]">{activeRecipe.cookTime || 'N/A'}</strong>
              </div>
              <div>
                <span className="text-[#7D6F74] dark:text-[#B8A8AF] block">Porções</span>
                <strong className="text-[#2D2327] dark:text-[#FAF4F0]">{activeRecipe.servings}</strong>
              </div>
            </div>

            {/* Ingredients with Pantry Check */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-serif font-bold text-base text-[#2D2327] dark:text-[#FAF4F0]">
                  Ingredientes Necessários
                </h4>

                <button
                  onClick={() => handleAddMissingToCart(activeRecipe)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#FAF3EC] dark:bg-[#2F2228] text-[#E07A8B] dark:text-[#F492A5] hover:bg-[#F2E8E4] dark:hover:bg-[#3D2F36] text-xs font-semibold"
                >
                  <ShoppingCart className="w-3.5 h-3.5" />
                  <span>Adicionar faltantes ao Mercado</span>
                </button>
              </div>

              <ul className="space-y-2">
                {activeRecipe.ingredients.map((ing, idx) => (
                  <li
                    key={idx}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-[#FAF8F5] dark:bg-[#2D2228] text-xs sm:text-sm"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-[#2D2327] dark:text-[#FAF4F0]">
                        {ing.name}
                      </span>
                      <span className="text-[#7D6F74] dark:text-[#B8A8AF]">({ing.amount})</span>
                    </div>

                    <label className="flex items-center gap-1 text-[11px] text-[#7D6F74] dark:text-[#B8A8AF] cursor-pointer">
                      <input
                        type="checkbox"
                        checked={ing.inPantry || false}
                        onChange={(e) => {
                          const updated = [...activeRecipe.ingredients];
                          updated[idx] = { ...updated[idx], inPantry: e.target.checked };
                          const newRecipe = { ...activeRecipe, ingredients: updated };
                          setActiveRecipe(newRecipe);
                          onUpdateRecipe(newRecipe);
                        }}
                        className="rounded accent-[#E07A8B]"
                      />
                      <span>Temos na despensa</span>
                    </label>
                  </li>
                ))}
              </ul>
            </div>

            {/* Step by Step Instructions */}
            <div>
              <h4 className="font-serif font-bold text-base text-[#2D2327] dark:text-[#FAF4F0] mb-3">
                Modo de Preparo (Passo a Passo a Dois)
              </h4>

              <div className="space-y-3">
                {activeRecipe.instructions.map((step, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-3 p-3 rounded-2xl bg-[#FAF8F5] dark:bg-[#2D2228] text-xs sm:text-sm text-[#2D2327] dark:text-[#FAF4F0]"
                  >
                    <span className="w-6 h-6 rounded-full bg-[#E07A8B] text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <p className="flex-1 leading-relaxed">{step}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Source link, Edit & Delete */}
            <div className="flex items-center justify-between pt-4 border-t border-[#F2E8E4] dark:border-[#3D2F36]">
              {activeRecipe.sourceUrl ? (
                <a
                  href={activeRecipe.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs text-[#E07A8B] hover:underline"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Ver link da receita original</span>
                </a>
              ) : (
                <div />
              )}

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => openEditRecipeModal(activeRecipe)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#FAF3EC] dark:bg-[#2F2228] text-xs font-semibold text-[#E07A8B] dark:text-[#F492A5] hover:bg-[#F2E8E4] dark:hover:bg-[#3D2F36] transition-colors"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Editar Receita</span>
                </button>
                <button
                  type="button"
                  onClick={() => setRecipeToDelete(activeRecipe)}
                  className="inline-flex items-center gap-1 text-xs text-rose-500 hover:text-rose-600 hover:underline px-2 py-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Excluir</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* AI Extraction Modal */}
      {isAiModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#241C21] rounded-3xl max-w-lg w-full p-6 border border-[#F2E8E4] dark:border-[#3D2F36] shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#F2E8E4] dark:border-[#3D2F36]">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[#E07A8B]" />
                <h3 className="font-serif font-bold text-lg text-[#2D2327] dark:text-[#FAF4F0]">
                  Importar Receita com Gemini AI
                </h3>
              </div>
              <button
                onClick={() => setIsAiModalOpen(false)}
                className="text-xs text-[#7D6F74] hover:text-[#2D2327] dark:hover:text-white"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-[#7D6F74] dark:text-[#B8A8AF]">
              Basta colar o link do TikTok, Instagram Reels, canal do YouTube ou digitar o nome do prato. A IA do app analisa e organiza tudo em ingredientes com medidas exatas e passos para duas pessoas!
            </p>

            <form onSubmit={handleExtractWithAi} className="space-y-4 text-xs sm:text-sm">
              <div>
                <label className="block font-medium text-[#2D2327] dark:text-[#FAF4F0] mb-1">
                  Link do TikTok, Instagram ou Site de Culinária
                </label>
                <input
                  type="url"
                  value={aiUrl}
                  onChange={(e) => setAiUrl(e.target.value)}
                  placeholder="https://www.tiktok.com/@chef/video/..."
                  className="w-full px-3 py-2 rounded-xl bg-[#FAF8F5] dark:bg-[#2D2228] border border-[#F2E8E4] dark:border-[#3D2F36] text-[#2D2327] dark:text-[#FAF4F0] focus:outline-none focus:ring-1 focus:ring-[#E07A8B]"
                />
              </div>

              <div>
                <label className="block font-medium text-[#2D2327] dark:text-[#FAF4F0] mb-1">
                  Ou digite o prato / observações (ex: "Massa carbonara autêntica para 2 pessoas sem creme")
                </label>
                <textarea
                  rows={2}
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  placeholder="Ex: Torta de limão fácil com bolacha triturada..."
                  className="w-full px-3 py-2 rounded-xl bg-[#FAF8F5] dark:bg-[#2D2228] border border-[#F2E8E4] dark:border-[#3D2F36] text-[#2D2327] dark:text-[#FAF4F0] focus:outline-none focus:ring-1 focus:ring-[#E07A8B]"
                />
              </div>

              {aiError && (
                <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-xs text-rose-600">
                  {aiError}
                </div>
              )}

              <div className="p-3 rounded-xl bg-[#FAF3EC] dark:bg-[#2C2127] text-xs text-[#7D6F74] dark:text-[#B8A8AF] flex items-center gap-2">
                <PartnerAvatar avatar={currentPartner.avatar} name={currentPartner.name} size="xs" />
                <span>
                  Receita será salva no perfil de <strong>{currentPartner.name}</strong>
                </span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  disabled={isAiLoading}
                  onClick={() => setIsAiModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-[#7D6F74] hover:bg-zinc-100 dark:hover:bg-zinc-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isAiLoading || (!aiUrl.trim() && !aiPrompt.trim())}
                  className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-gradient-to-r from-[#E07A8B] to-[#E58C9B] hover:opacity-95 text-white font-medium shadow-xs disabled:opacity-50"
                >
                  {isAiLoading ? (
                    <>
                      <Sparkles className="w-4 h-4 animate-spin" />
                      <span>Processando com IA...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Analisar e Salvar</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Manual Recipe & Link Modal */}
      {isManualModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#241C21] rounded-3xl max-w-lg w-full p-6 border border-[#F2E8E4] dark:border-[#3D2F36] shadow-xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-[#F2E8E4] dark:border-[#3D2F36]">
              <div className="flex items-center gap-2">
                <UtensilsCrossed className="w-5 h-5 text-[#E07A8B]" />
                <h3 className="font-serif font-bold text-lg text-[#2D2327] dark:text-[#FAF4F0]">
                  Salvar Receita com Link da Web
                </h3>
              </div>
              <button
                onClick={() => setIsManualModalOpen(false)}
                className="text-xs text-[#7D6F74] hover:text-[#2D2327] dark:hover:text-white"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-[#7D6F74] dark:text-[#B8A8AF]">
              Encontrou uma receita perfeita no Instagram, TikTok, YouTube ou blog culinário? Salve o link direto aqui para vocês acessarem sempre que forem cozinhar juntas!
            </p>

            <form onSubmit={handleCreateManualRecipe} className="space-y-4 text-xs sm:text-sm">
              <div>
                <label className="block font-medium text-[#2D2327] dark:text-[#FAF4F0] mb-1">
                  Nome da Receita *
                </label>
                <input
                  type="text"
                  required
                  value={manualTitle}
                  onChange={(e) => setManualTitle(e.target.value)}
                  placeholder="Ex: Torta de Limão Fácil / Risoto de Cogumelos"
                  className="w-full px-3 py-2 rounded-xl bg-[#FAF8F5] dark:bg-[#2D2228] border border-[#F2E8E4] dark:border-[#3D2F36] text-[#2D2327] dark:text-[#FAF4F0] focus:outline-none focus:ring-1 focus:ring-[#E07A8B]"
                />
              </div>

              <div>
                <label className="block font-medium text-[#2D2327] dark:text-[#FAF4F0] mb-1">
                  🔗 Link da Receita na Internet (Instagram, TikTok, Site, YouTube)
                </label>
                <input
                  type="url"
                  value={manualUrl}
                  onChange={(e) => setManualUrl(e.target.value)}
                  placeholder="https://www.instagram.com/reel/... ou https://..."
                  className="w-full px-3 py-2 rounded-xl bg-[#FAF8F5] dark:bg-[#2D2228] border border-[#F2E8E4] dark:border-[#3D2F36] text-[#2D2327] dark:text-[#FAF4F0] focus:outline-none focus:ring-1 focus:ring-[#E07A8B]"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[11px] font-medium text-[#2D2327] dark:text-[#FAF4F0] mb-1">
                    Preparo
                  </label>
                  <input
                    type="text"
                    value={manualPrepTime}
                    onChange={(e) => setManualPrepTime(e.target.value)}
                    placeholder="20 min"
                    className="w-full px-2.5 py-1.5 rounded-xl bg-[#FAF8F5] dark:bg-[#2D2228] border border-[#F2E8E4] dark:border-[#3D2F36] text-xs text-[#2D2327] dark:text-[#FAF4F0]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-[#2D2327] dark:text-[#FAF4F0] mb-1">
                    Rendimento
                  </label>
                  <input
                    type="text"
                    value={manualServings}
                    onChange={(e) => setManualServings(e.target.value)}
                    placeholder="2 pessoas"
                    className="w-full px-2.5 py-1.5 rounded-xl bg-[#FAF8F5] dark:bg-[#2D2228] border border-[#F2E8E4] dark:border-[#3D2F36] text-xs text-[#2D2327] dark:text-[#FAF4F0]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-[#2D2327] dark:text-[#FAF4F0] mb-1">
                    Dificuldade
                  </label>
                  <select
                    value={manualDifficulty}
                    onChange={(e) => setManualDifficulty(e.target.value as any)}
                    className="w-full px-2 py-1.5 rounded-xl bg-[#FAF8F5] dark:bg-[#2D2228] border border-[#F2E8E4] dark:border-[#3D2F36] text-xs text-[#2D2327] dark:text-[#FAF4F0]"
                  >
                    <option value="Fácil">Fácil</option>
                    <option value="Médio">Médio</option>
                    <option value="Elaborado">Elaborado</option>
                  </select>
                </div>
              </div>

              {/* Category / Dish Type with Arrow Dropdown and Creation */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[11px] font-medium text-[#2D2327] dark:text-[#FAF4F0]">
                    Categoria / Tipo do Prato
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
                    value={isCreatingNewCat ? '__create_new__' : manualTag}
                    onChange={(e) => {
                      if (e.target.value === '__create_new__') {
                        setIsCreatingNewCat(true);
                        setCustomCatInput('');
                      } else {
                        setIsCreatingNewCat(false);
                        setManualTag(e.target.value);
                      }
                    }}
                    className="w-full px-3 py-2 pr-8 rounded-xl bg-[#FAF8F5] dark:bg-[#2D2228] border border-[#F2E8E4] dark:border-[#3D2F36] text-[#2D2327] dark:text-[#FAF4F0] focus:outline-none focus:ring-1 focus:ring-[#E07A8B] appearance-none cursor-pointer text-xs"
                  >
                    <option value="">Selecione o tipo de prato...</option>
                    {allCategories.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                    <option value="__create_new__" className="font-semibold text-[#E07A8B]">
                      ✨ + Criar outro tipo de prato...
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
                      placeholder="Ex: Torta Doce, Caldo de Inverno..."
                      className="flex-1 px-2.5 py-1.5 rounded-xl bg-white dark:bg-[#20171C] border border-[#E07A8B] text-xs text-[#2D2327] dark:text-[#FAF4F0] focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (customCatInput.trim()) {
                          handleAddCustomCategory(customCatInput.trim());
                          setManualTag(customCatInput.trim());
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
                      className="px-2 py-1.5 rounded-xl text-xs text-[#7D6F74] hover:bg-[#FAF3EC] dark:hover:bg-[#2D2228]"
                    >
                      ✕
                    </button>
                  </div>
                )}
              </div>

              {/* Cover Photo upload from phone or URL */}
              <div className="space-y-2 p-3 rounded-2xl bg-[#FAF8F5] dark:bg-[#2C2127] border border-[#F2E8E4] dark:border-[#3D2F36]">
                <label className="block text-xs font-medium text-[#2D2327] dark:text-[#FAF4F0]">
                  Foto da Capa da Receita
                </label>

                {manualImageUrl ? (
                  <div className="relative h-28 w-32 rounded-xl overflow-hidden border border-[#F2E8E4] dark:border-[#3D2F36] shadow-xs group">
                    <img
                      src={manualImageUrl}
                      alt="Capa"
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => setManualImageUrl('')}
                      className="absolute inset-0 bg-black/60 flex items-center justify-center text-white text-[10px] font-bold opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      Trocar Foto
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col sm:flex-row items-center gap-2">
                    <input
                      type="file"
                      accept="image/*"
                      ref={manualImageFileRef}
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFileUpload(file, setManualImageUrl);
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => manualImageFileRef.current?.click()}
                      className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-white dark:bg-[#33252C] border border-[#E07A8B]/40 text-[#E07A8B] hover:bg-[#FAF3EC] text-xs font-semibold transition-colors"
                    >
                      <Camera className="w-4 h-4" />
                      <span>Subir foto do celular</span>
                    </button>
                    <span className="text-[11px] text-[#7D6F74] dark:text-[#B8A8AF]">ou link:</span>
                    <input
                      type="url"
                      value={manualImageUrl}
                      onChange={(e) => setManualImageUrl(e.target.value)}
                      placeholder="https://..."
                      className="flex-1 w-full px-3 py-1.5 rounded-xl bg-white dark:bg-[#33252C] border border-[#F2E8E4] dark:border-[#3D2F36] text-[#2D2327] dark:text-[#FAF4F0] text-xs focus:outline-none focus:ring-1 focus:ring-[#E07A8B]"
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block font-medium text-[#2D2327] dark:text-[#FAF4F0] mb-1">
                  Breve Descrição / Por que salvaram
                </label>
                <textarea
                  rows={2}
                  value={manualDescription}
                  onChange={(e) => setManualDescription(e.target.value)}
                  placeholder="Ex: Vimos no feed do Instagram e queremos fazer no próximo jantar romântico!"
                  className="w-full px-3 py-2 rounded-xl bg-[#FAF8F5] dark:bg-[#2D2228] border border-[#F2E8E4] dark:border-[#3D2F36] text-[#2D2327] dark:text-[#FAF4F0] focus:outline-none focus:ring-1 focus:ring-[#E07A8B]"
                />
              </div>

              <div>
                <label className="block font-medium text-[#2D2327] dark:text-[#FAF4F0] mb-1">
                  Ingredientes (um por linha, opcional se tiver o link)
                </label>
                <textarea
                  rows={3}
                  value={manualIngredientsText}
                  onChange={(e) => setManualIngredientsText(e.target.value)}
                  placeholder={'Macarrão Fettuccine (300g)\nCreme de leite (1 lata)\nQueijo Parmesão (100g)'}
                  className="w-full px-3 py-2 rounded-xl bg-[#FAF8F5] dark:bg-[#2D2228] border border-[#F2E8E4] dark:border-[#3D2F36] text-[#2D2327] dark:text-[#FAF4F0] focus:outline-none focus:ring-1 focus:ring-[#E07A8B]"
                />
              </div>

              <div>
                <label className="block font-medium text-[#2D2327] dark:text-[#FAF4F0] mb-1">
                  Modo de Preparo / Anotações
                </label>
                <textarea
                  rows={2}
                  value={manualInstructionsText}
                  onChange={(e) => setManualInstructionsText(e.target.value)}
                  placeholder="Ou deixe em branco para seguir o vídeo/post salvo no link!"
                  className="w-full px-3 py-2 rounded-xl bg-[#FAF8F5] dark:bg-[#2D2228] border border-[#F2E8E4] dark:border-[#3D2F36] text-[#2D2327] dark:text-[#FAF4F0] focus:outline-none focus:ring-1 focus:ring-[#E07A8B]"
                />
              </div>

              <div className="p-3 rounded-xl bg-[#FAF3EC] dark:bg-[#2C2127] text-xs text-[#7D6F74] dark:text-[#B8A8AF] flex items-center gap-2">
                <PartnerAvatar avatar={currentPartner.avatar} name={currentPartner.name} size="xs" />
                <span>
                  Receita será salva por <strong>{currentPartner.name}</strong>
                </span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsManualModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-[#7D6F74] hover:bg-zinc-100 dark:hover:bg-zinc-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-gradient-to-r from-[#E07A8B] to-[#E58C9B] hover:opacity-95 text-white font-medium shadow-xs"
                >
                  <Plus className="w-4 h-4" />
                  <span>Salvar no Livro</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Recipe Modal */}
      {editingRecipe && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#241C21] rounded-3xl max-w-lg w-full p-6 border border-[#F2E8E4] dark:border-[#3D2F36] shadow-xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-[#F2E8E4] dark:border-[#3D2F36]">
              <div className="flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-[#E07A8B]" />
                <h3 className="font-serif font-bold text-lg text-[#2D2327] dark:text-[#FAF4F0]">
                  Editar Receita
                </h3>
              </div>
              <button
                onClick={() => setEditingRecipe(null)}
                className="text-xs text-[#7D6F74] hover:text-[#2D2327] dark:hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveRecipeEdit} className="space-y-3 text-xs sm:text-sm">
              <div>
                <label className="block font-medium text-[#2D2327] dark:text-[#FAF4F0] mb-1">
                  Nome do Prato / Receita *
                </label>
                <input
                  type="text"
                  required
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#FAF8F5] dark:bg-[#2D2228] border border-[#F2E8E4] dark:border-[#3D2F36] text-[#2D2327] dark:text-[#FAF4F0] focus:outline-none focus:ring-1 focus:ring-[#E07A8B]"
                />
              </div>

              <div>
                <label className="block font-medium text-[#2D2327] dark:text-[#FAF4F0] mb-1">
                  Breve Descrição
                </label>
                <input
                  type="text"
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#FAF8F5] dark:bg-[#2D2228] border border-[#F2E8E4] dark:border-[#3D2F36] text-[#2D2327] dark:text-[#FAF4F0] focus:outline-none focus:ring-1 focus:ring-[#E07A8B]"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block font-medium text-[#2D2327] dark:text-[#FAF4F0] mb-1">
                    Preparo
                  </label>
                  <input
                    type="text"
                    value={editPrepTime}
                    onChange={(e) => setEditPrepTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#FAF8F5] dark:bg-[#2D2228] border border-[#F2E8E4] dark:border-[#3D2F36] text-[#2D2327] dark:text-[#FAF4F0] focus:outline-none focus:ring-1 focus:ring-[#E07A8B]"
                  />
                </div>
                <div>
                  <label className="block font-medium text-[#2D2327] dark:text-[#FAF4F0] mb-1">
                    Cozimento
                  </label>
                  <input
                    type="text"
                    value={editCookTime}
                    onChange={(e) => setEditCookTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#FAF8F5] dark:bg-[#2D2228] border border-[#F2E8E4] dark:border-[#3D2F36] text-[#2D2327] dark:text-[#FAF4F0] focus:outline-none focus:ring-1 focus:ring-[#E07A8B]"
                  />
                </div>
                <div>
                  <label className="block font-medium text-[#2D2327] dark:text-[#FAF4F0] mb-1">
                    Porções
                  </label>
                  <input
                    type="text"
                    value={editServings}
                    onChange={(e) => setEditServings(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#FAF8F5] dark:bg-[#2D2228] border border-[#F2E8E4] dark:border-[#3D2F36] text-[#2D2327] dark:text-[#FAF4F0] focus:outline-none focus:ring-1 focus:ring-[#E07A8B]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-[#2D2327] dark:text-[#FAF4F0] mb-1">
                    Dificuldade
                  </label>
                  <select
                    value={editDifficulty}
                    onChange={(e) => setEditDifficulty(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-[#FAF8F5] dark:bg-[#2D2228] border border-[#F2E8E4] dark:border-[#3D2F36] text-[#2D2327] dark:text-[#FAF4F0] focus:outline-none focus:ring-1 focus:ring-[#E07A8B]"
                  >
                    <option value="Fácil">Fácil</option>
                    <option value="Médio">Médio</option>
                    <option value="Elaborado">Elaborado</option>
                  </select>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block font-medium text-[#2D2327] dark:text-[#FAF4F0]">
                      Categoria Principal
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
                      value={isCreatingEditCat ? '__create_new__' : editTag}
                      onChange={(e) => {
                        if (e.target.value === '__create_new__') {
                          setIsCreatingEditCat(true);
                          setCustomEditCatInput('');
                        } else {
                          setIsCreatingEditCat(false);
                          setEditTag(e.target.value);
                        }
                      }}
                      className="w-full px-3 py-2 pr-8 rounded-xl bg-[#FAF8F5] dark:bg-[#2D2228] border border-[#F2E8E4] dark:border-[#3D2F36] text-[#2D2327] dark:text-[#FAF4F0] focus:outline-none focus:ring-1 focus:ring-[#E07A8B] appearance-none cursor-pointer text-xs sm:text-sm"
                    >
                      <option value="">Selecione a categoria...</option>
                      {allCategories.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                      <option value="__create_new__" className="font-semibold text-[#E07A8B]">
                        ✨ + Criar outro tipo de prato...
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
                        placeholder="Nome do novo tipo de prato..."
                        className="flex-1 px-2.5 py-1.5 rounded-xl bg-white dark:bg-[#20171C] border border-[#E07A8B] text-xs text-[#2D2327] dark:text-[#FAF4F0] focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (customEditCatInput.trim()) {
                            handleAddCustomCategory(customEditCatInput.trim());
                            setEditTag(customEditCatInput.trim());
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
                        className="px-2 py-1.5 rounded-xl text-xs text-[#7D6F74] hover:bg-[#FAF3EC] dark:hover:bg-[#2D2228]"
                      >
                        ✕
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block font-medium text-[#2D2327] dark:text-[#FAF4F0] mb-1">
                  Link de Referência (TikTok, Insta, Vídeo ou Blog)
                </label>
                <input
                  type="url"
                  value={editUrl}
                  onChange={(e) => setEditUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full px-3 py-2 rounded-xl bg-[#FAF8F5] dark:bg-[#2D2228] border border-[#F2E8E4] dark:border-[#3D2F36] text-[#2D2327] dark:text-[#FAF4F0] focus:outline-none focus:ring-1 focus:ring-[#E07A8B]"
                />
              </div>

              {/* Edit Recipe photo upload */}
              <div className="space-y-2 p-3 rounded-2xl bg-[#FAF8F5] dark:bg-[#2C2127] border border-[#F2E8E4] dark:border-[#3D2F36]">
                <label className="block text-xs font-medium text-[#2D2327] dark:text-[#FAF4F0]">
                  Foto do Prato
                </label>

                {editImageUrl ? (
                  <div className="relative h-28 w-32 rounded-xl overflow-hidden border border-[#F2E8E4] dark:border-[#3D2F36] shadow-xs group">
                    <img
                      src={editImageUrl}
                      alt="Capa"
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => setEditImageUrl('')}
                      className="absolute inset-0 bg-black/60 flex items-center justify-center text-white text-[10px] font-bold opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      Trocar Foto
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col sm:flex-row items-center gap-2">
                    <input
                      type="file"
                      accept="image/*"
                      ref={editImageFileRef}
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFileUpload(file, setEditImageUrl);
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => editImageFileRef.current?.click()}
                      className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-white dark:bg-[#33252C] border border-[#E07A8B]/40 text-[#E07A8B] hover:bg-[#FAF3EC] text-xs font-semibold transition-colors"
                    >
                      <Camera className="w-4 h-4" />
                      <span>Subir foto do celular</span>
                    </button>
                    <span className="text-[11px] text-[#7D6F74] dark:text-[#B8A8AF]">ou link:</span>
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

              <div>
                <label className="block font-medium text-[#2D2327] dark:text-[#FAF4F0] mb-1">
                  Ingredientes (um por linha, ex: "Massa Penne (250g)")
                </label>
                <textarea
                  rows={4}
                  value={editIngredientsText}
                  onChange={(e) => setEditIngredientsText(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#FAF8F5] dark:bg-[#2D2228] border border-[#F2E8E4] dark:border-[#3D2F36] text-[#2D2327] dark:text-[#FAF4F0] focus:outline-none focus:ring-1 focus:ring-[#E07A8B] font-mono text-xs"
                />
              </div>

              <div>
                <label className="block font-medium text-[#2D2327] dark:text-[#FAF4F0] mb-1">
                  Modo de Preparo (um passo por linha)
                </label>
                <textarea
                  rows={4}
                  value={editInstructionsText}
                  onChange={(e) => setEditInstructionsText(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#FAF8F5] dark:bg-[#2D2228] border border-[#F2E8E4] dark:border-[#3D2F36] text-[#2D2327] dark:text-[#FAF4F0] focus:outline-none focus:ring-1 focus:ring-[#E07A8B]"
                />
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-[#F2E8E4] dark:border-[#3D2F36]">
                <button
                  type="button"
                  onClick={() => {
                    const toDel = editingRecipe;
                    setEditingRecipe(null);
                    setRecipeToDelete(toDel);
                  }}
                  className="inline-flex items-center gap-1.5 text-xs text-rose-500 hover:underline"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Excluir Receita</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingRecipe(null)}
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
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Recipe Confirmation Modal */}
      {recipeToDelete && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#241C21] rounded-3xl max-w-sm w-full p-6 border border-[#F2E8E4] dark:border-[#3D2F36] shadow-xl text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-500 mx-auto flex items-center justify-center">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-lg text-[#2D2327] dark:text-[#FAF4F0]">
                Excluir Receita?
              </h3>
              <p className="text-xs text-[#7D6F74] dark:text-[#B8A8AF] mt-1">
                Deseja remover "<strong>{recipeToDelete.title}</strong>" do livro de receitas do casal?
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                onClick={() => setRecipeToDelete(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-[#7D6F74] hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  onDeleteRecipe(recipeToDelete.id);
                  if (activeRecipe?.id === recipeToDelete.id) {
                    setActiveRecipe(null);
                  }
                  setRecipeToDelete(null);
                }}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-rose-500 hover:bg-rose-600 text-white shadow-xs"
              >
                Sim, Excluir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Manage Recipe Categories Modal */}
      {isManagingCategoriesModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#241C21] rounded-3xl max-w-md w-full p-6 border border-[#F2E8E4] dark:border-[#3D2F36] shadow-xl space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[#F2E8E4] dark:border-[#3D2F36]">
              <div>
                <h3 className="font-serif font-bold text-lg text-[#2D2327] dark:text-[#FAF4F0]">
                  Gerenciar Categorias de Receitas
                </h3>
                <p className="text-xs text-[#7D6F74] dark:text-[#B8A8AF]">
                  Edite o nome (ex: alterar "Jantar Romântico"), adicione ou exclua categorias.
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

            {/* Quick Add New Category Input */}
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
                placeholder="Nova categoria (ex: Almoço de Domingo)..."
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

            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {allCategories.length === 0 ? (
                <p className="text-xs text-center py-6 text-[#7D6F74] dark:text-[#B8A8AF]">
                  Nenhuma categoria cadastrada.
                </p>
              ) : (
                allCategories.map((c) => {
                  const isEditingThis = editingCategoryOriginal === c;
                  return (
                    <div
                      key={c}
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
                                handleSaveEditedCategory(c);
                              }
                            }}
                            className="flex-1 px-2.5 py-1.5 rounded-xl bg-white dark:bg-[#20171C] border border-[#E07A8B] text-xs text-[#2D2327] dark:text-[#FAF4F0] focus:outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => handleSaveEditedCategory(c)}
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
                            {c}
                          </span>
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingCategoryOriginal(c);
                                setEditingCategoryInput(c);
                              }}
                              className="p-1.5 rounded-lg text-[#7D6F74] dark:text-[#B8A8AF] hover:text-[#E07A8B] hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                              title="Alterar nome desta categoria"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteCategory(c)}
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
