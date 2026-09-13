export type PartnerId = 'partner1' | 'partner2';

export interface Partner {
  id: PartnerId;
  name: string;
  nickname: string;
  avatar: string; // URL or emoji
  color: string; // color tag
  city?: string; // ex: 'João Pessoa - PB' or 'Porto Alegre - RS'
}

export interface CoupleSecuritySettings {
  partner1Pin?: string; // Default: '1234'
  partner2Pin?: string; // Default: '5678'
  couplePasscode?: string; // Default: '2026'
  requirePinOnEveryOpen?: boolean;
}

export interface CoupleProfile {
  partner1: Partner;
  partner2: Partner;
  coupleName: string;
  anniversaryDate: string; // YYYY-MM-DD
  anniversaryNote: string;
  coverPhoto: string;
  theme?: string; // 'rose' | 'lavender' | 'sage' | 'peach' | 'sky' | 'pokemon'
  security?: CoupleSecuritySettings;
}

export interface MovieItem {
  id: string;
  title: string;
  year?: number;
  origin: 'tiktok' | 'instagram' | 'amigos' | 'cinema' | 'outro';
  platform: string; // Netflix, Prime Video, Disney+, Max, Apple TV, Cinema, YouTube
  genre: string;
  status: 'to_watch' | 'watching' | 'watched';
  linkUrl?: string;
  rating1?: number; // 1-5 partner1 rating
  rating2?: number; // 1-5 partner2 rating
  ourNotes?: string;
  addedBy: PartnerId;
  addedAt: string;
  posterUrl?: string;
}

export interface RecipeIngredient {
  name: string;
  amount: string;
  inPantry?: boolean;
}

export interface RecipeItem {
  id: string;
  title: string;
  description: string;
  prepTime: string;
  cookTime?: string;
  servings: string;
  difficulty: 'Fácil' | 'Médio' | 'Elaborado';
  dietaryTags: string[]; // Sem Glúten, Sem Lactose, Vegetariano, Vegano, Fit, Doce, etc.
  sourceUrl?: string;
  imageUrl?: string;
  ingredients: RecipeIngredient[];
  instructions: string[];
  addedBy: PartnerId;
  addedAt: string;
  favorite: boolean;
}

export type PantryCategory =
  | 'Hortifruti'
  | 'Laticínios & Frios'
  | 'Carnes & Peixes'
  | 'Mercearia & Grãos'
  | 'Bebidas'
  | 'Temperos & Molhos'
  | 'Congelados'
  | 'Higiene & Limpeza'
  | 'Outros';

export interface PantryItem {
  id: string;
  name: string;
  category: PantryCategory | string;
  quantity: number;
  unit: 'un' | 'kg' | 'g' | 'L' | 'ml' | 'pct' | 'lata' | string;
  minQuantity: number;
  expirationDate: string; // YYYY-MM-DD
  addedBy: PartnerId;
  notes?: string;
  imageUrl?: string;
}

export interface GroceryItem {
  id: string;
  name: string;
  category: string;
  quantity: string;
  checked: boolean;
  estimatedPrice?: number;
  addedBy: PartnerId;
  checkedBy?: PartnerId;
  fromPantry?: boolean;
  imageUrl?: string;
  notes?: string;
}

export interface DayMealPlan {
  mealName: string;
  recipeId?: string;
  votes: PartnerId[];
  notes?: string;
}

export interface DayMenu {
  dayKey: 'seg' | 'ter' | 'qua' | 'qui' | 'sex' | 'sab' | 'dom';
  dayName: string;
  lunch: DayMealPlan;
  dinner: DayMealPlan;
}

export interface WeeklyMenu {
  id: string;
  weekStartDate: string;
  days: DayMenu[];
}

export interface WeeklyMenuItem {
  id: string;
  dayOfWeek: string;
  mealType: 'almoco' | 'jantar';
  dishName: string;
  recipeId?: string;
  votes1: boolean;
  votes2: boolean;
  notes?: string;
  suggestedBy?: 'partner1' | 'partner2' | 'ia';
}

export type EventCategory =
  | 'consulta'
  | 'mercado'
  | 'date_romantico'
  | 'viagem'
  | 'aniversario'
  | 'tarefa'
  | 'outros'
  | string;

export interface CalendarEvent {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  time?: string; // HH:mm
  category: EventCategory;
  location?: string;
  reminderMinutes?: number;
  addedBy: PartnerId;
  assignedTo?: PartnerId | 'ambos';
  isCompleted?: boolean;
  completed?: boolean;
  notes?: string;
}

export interface TravelLuggageItem {
  id: string;
  item: string;
  packed: boolean;
  assignedTo: 'partner1' | 'partner2' | 'ambos';
}

export interface TravelItineraryDay {
  id: string;
  day: number;
  date: string;
  title: string;
  activities: string[];
}

export interface TravelWishlistPlace {
  id: string;
  name: string;
  category?: string;
  notes?: string;
  link?: string;
  visited: boolean;
}

export interface TravelPlan {
  id: string;
  title: string;
  destination: string;
  startDate: string;
  endDate: string;
  coverPhoto?: string;
  coverUrl?: string;
  estimatedBudget?: number;
  spentBudget?: number;
  budget?: number;
  spent?: number;
  status: 'planejando' | 'confirmada' | 'realizada';
  luggageChecklist: TravelLuggageItem[];
  itinerary?: TravelItineraryDay[];
  itineraryDays?: TravelItineraryDay[];
  wishlistPlaces?: TravelWishlistPlace[];
  placesToVisit?: (string | TravelWishlistPlace)[];
  addedBy?: PartnerId;
  notes?: string;
}

export type TripPlan = TravelPlan;

export interface PhotoMemory {
  id: string;
  title: string;
  date: string;
  imageUrl: string;
  caption: string;
  location?: string;
  addedBy: PartnerId;
  likes: PartnerId[];
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: 'filme' | 'receita' | 'despensa' | 'compras' | 'compromisso' | 'aniversario' | 'amor';
  timestamp: string;
  read: boolean;
  sender: PartnerId | 'sistema';
}

export type HomeRoom =
  | 'Sala'
  | 'Quarto'
  | 'Cozinha'
  | 'Banheiro'
  | 'Varanda'
  | 'Escritório'
  | 'Lavanderia'
  | 'Casa Toda'
  | (string & {});

export type HomeCategory =
  | 'Móveis'
  | 'Decoração'
  | 'Utensílios & Cozinha'
  | 'Cama, Mesa & Banho'
  | 'Iluminação'
  | 'Eletrônicos & Gadgets'
  | 'Plantas & Jardim'
  | 'Organização'
  | (string & {});

export type HomeItemPriority = 'Baixa' | 'Média' | 'Alta' | 'Urgente';
export type HomeItemStatus = 'desejo' | 'comprado' | 'instalado';

export interface HomeDecorItem {
  id: string;
  name: string;
  room: HomeRoom;
  category: HomeCategory;
  estimatedPrice?: number;
  priority: HomeItemPriority;
  status: HomeItemStatus;
  imageUrl?: string;
  link?: string;
  notes?: string;
  addedBy: PartnerId;
  addedAt: string;
}

export type HomeTipCategory =
  | 'limpeza'
  | 'plantas'
  | 'lavanderia'
  | 'organizacao'
  | 'manutencao'
  | 'economia'
  | 'outros';

export interface HomeTipItem {
  id: string;
  title: string;
  category: HomeTipCategory;
  room?: HomeRoom;
  description: string;
  goldenTip?: string; // truque de ouro / segredo
  link?: string;
  addedBy: PartnerId;
  createdAt: string;
  isFavorite?: boolean;
}

export interface CustomExpense {
  id: string;
  name: string;
  category: string;
  amount: number;
  paid?: boolean;
  dueDate?: string;
  addedBy?: PartnerId;
  paidBy?: PartnerId;
  receiptUrl?: string; // photo/file of Pix or receipt
}

export interface MonthBillPaidStatus {
  rent?: boolean;
  electricity?: boolean;
  water?: boolean;
  internet?: boolean;
  creditCard?: boolean;
}

export interface MonthExpenseRecord {
  monthKey: string; // e.g. "2026-09"
  monthLabel: string; // e.g. "Setembro 2026"
  rentSpent: number;
  electricitySpent: number;
  waterSpent: number;
  internetSpent: number;
  creditCardSpent: number;
  paidStatus: MonthBillPaidStatus;
  customExpenses: CustomExpense[];
  notes?: string;
  billDueDates?: Record<string, string>; // e.g. { rent: '10', electricity: '15', water: '20', internet: '25', creditCard: '05' }
  billAuthors?: Record<string, PartnerId>; // who registered each core bill
  billPaidBy?: Record<string, PartnerId>; // who paid each core bill
  billReceipts?: Record<string, string>; // Pix/receipt image or link for each core bill
  deletedBills?: string[]; // IDs of core bills deleted by user (e.g. ['water', 'creditCard'])
  billCustomTitles?: Record<string, string>; // custom renamed titles for core bills
  billCategories?: Record<string, string>; // custom categories for core bills
}

export interface MonthlyConsumption {
  activeMonthKey?: string;
  monthsRecords?: Record<string, MonthExpenseRecord>;
  rentSpent?: number;
  electricitySpent?: number;
  waterSpent?: number;
  internetSpent?: number;
  creditCardSpent?: number;
  paidStatus?: MonthBillPaidStatus;
  customExpenses?: CustomExpense[];
  monthlySupermarket?: number;
  monthlyDelivery?: number;
  billsSpent?: number;
  homeDecorSpent?: number;
  leisureSpent?: number;
  homeMealsCooked?: number;
  deliveryMeals?: number;
  perishablesSavedPercent?: number;
  topIngredients?: { name: string; frequency: number }[];
  monthlyHistory?: {
    month: string;
    bills: number;
    creditCard: number;
    delivery?: number;
    supermarket?: number;
    other: number;
    total?: number;
    decor?: number;
  }[];
}

export interface AppData {
  profile: CoupleProfile;
  movies: MovieItem[];
  recipes: RecipeItem[];
  pantry: PantryItem[];
  groceries: GroceryItem[];
  weeklyMenu?: WeeklyMenuItem[];
  homeDecor?: HomeDecorItem[];
  homeTips?: HomeTipItem[];
  calendarEvents: CalendarEvent[];
  calendar?: CalendarEvent[];
  trips: TravelPlan[];
  photos: PhotoMemory[];
  notifications: AppNotification[];
  consumption: any;
  coupleDreams?: CoupleDreamItem[];
  coupleSoundtrack?: CoupleSoundtrackData;
  weatherNotes?: WeatherNotesData;
  customCategories?: {
    recipes?: string[];
    movies?: string[];
    homeTips?: { id: string; label: string }[];
    calendar?: string[];
  };
  lastModified?: number;
  isCleaned?: boolean;
}

export interface CoupleDreamItem {
  id: string;
  title: string;
  description?: string;
  category: 'viagem' | 'aventura' | 'experiencia' | 'conquista' | 'outro';
  status: 'planejando' | 'realizado';
  suggestedBy: PartnerId;
  achievedAt?: string;
  photoUrl?: string;
  targetDate?: string;
}

export interface CoupleSongItem {
  id: string;
  title: string;
  artist: string;
  dedication?: string;
  addedBy: PartnerId;
  link?: string;
  category: 'nossa_musica' | 'lembranca' | 'romantica' | 'viagem';
}

export interface CouplePlaylistLink {
  id: string;
  name: string;
  platform: 'spotify' | 'apple' | 'youtube' | 'outra';
  url: string;
  description?: string;
}

export interface CoupleSoundtrackData {
  anthemSongId?: string;
  songs: CoupleSongItem[];
  playlists: CouplePlaylistLink[];
}

export interface WeatherNote {
  text: string;
  updatedAt: string;
  author: PartnerId;
  isAiGenerated?: boolean;
}

export interface WeatherNotesData {
  partner1Note?: WeatherNote;
  partner2Note?: WeatherNote;
}


