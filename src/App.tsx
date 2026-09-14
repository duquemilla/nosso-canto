import React, { useState, useEffect, useRef, useCallback } from 'react';
import { initialCoupleData } from './data/initialData';
import { normalizeAppData, smartMergeAppData, hasUserContent } from './utils/syncUtils';
import {
  saveFirebaseAppData,
  getFirebaseAppData,
  subscribeFirebaseAppData,
} from './lib/firebase';
import {
  AppData,
  PartnerId,
  MovieItem,
  RecipeItem,
  GroceryItem,
  PantryItem,
  WeeklyMenuItem,
  CalendarEvent,
  TripPlan,
  PhotoMemory,
  CoupleProfile,
  HomeDecorItem,
  HomeTipItem,
  WeatherNote,
  WeatherNotesData,
} from './types';
import { Header } from './components/Header';
import { AnniversaryBanner } from './components/AnniversaryBanner';
import { Navigation, ActiveTab } from './components/Navigation';
import { MoviesView } from './components/MoviesView';
import { RecipesView } from './components/RecipesView';
import { PantryAndGroceryView } from './components/PantryAndGroceryView';
import { HomeDecorView } from './components/HomeDecorView';
import { CalendarView } from './components/CalendarView';
import { TravelPlannerView } from './components/TravelPlannerView';
import { PhotoAlbumView } from './components/PhotoAlbumView';
import { ConsumptionReportView } from './components/ConsumptionReportView';
import { CoupleGamesView } from './components/CoupleGamesView';
import { SintoniaView } from './components/SintoniaView';
import { LuminaAiView } from './components/LuminaAiView';
import { CoupleSettingsModal } from './components/CoupleSettingsModal';
import { CoupleConnectionModal } from './components/CoupleConnectionModal';
import { CoupleWeatherCare } from './components/CoupleWeatherCare';
import { HomeView } from './components/HomeView';
import { LockScreen } from './components/LockScreen';
import { SwitchPartnerModal } from './components/SwitchPartnerModal';
import {
  Heart,
  Film,
  UtensilsCrossed,
  ShoppingBag,
  CalendarCheck,
  Camera,
  Plane,
  Home,
  PieChart,
  Sparkles,
  MoreHorizontal,
  X,
  Lock,
  Settings,
  Bot,
} from 'lucide-react';

const LOCAL_STORAGE_KEY = 'nos_dois_app_data_cache';
const LOCAL_STORAGE_PARTNER = 'nos_dois_active_partner';
const LOCAL_STORAGE_DARK = 'nos_dois_dark_mode';
const LOCAL_STORAGE_SESSION_UNLOCKED = 'nos_dois_session_unlocked';
const LOCAL_STORAGE_DEVICE_UNLOCKED = 'nos_dois_device_unlocked';

export default function App() {
  // Global App Data State
  const [data, setData] = useState<AppData>(() => {
    try {
      const cached = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (cached && cached !== 'undefined' && cached !== 'null') {
        const parsed = JSON.parse(cached);
        if (parsed && parsed.profile) {
          return normalizeAppData(parsed);
        }
      }
    } catch (e) {
      console.error('Failed reading localStorage', e);
    }
    return initialCoupleData;
  });

  // Active Partner & UI State
  const [activePartner, setActivePartner] = useState<PartnerId>(() => {
    try {
      if (typeof window !== 'undefined') {
        const urlParams = new URLSearchParams(window.location.search);
        const urlPartner = urlParams.get('partner');
        if (urlPartner === 'partner1' || urlPartner === 'partner2') {
          localStorage.setItem(LOCAL_STORAGE_PARTNER, urlPartner);
          return urlPartner;
        }
      }
      const p = localStorage.getItem(LOCAL_STORAGE_PARTNER);
      if (p === 'partner1' || p === 'partner2') return p;
    } catch {}
    return 'partner1';
  });

  const [darkMode, setDarkMode] = useState<boolean>(() => {
    try {
      const d = localStorage.getItem(LOCAL_STORAGE_DARK);
      if (d !== null) return d === 'true';
    } catch {}
    return false;
  });

  const [activeTab, setActiveTab] = useState<ActiveTab>('home');
  const [isMobileMoreOpen, setIsMobileMoreOpen] = useState<boolean>(false);
  const [isOnline, setIsOnline] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isConnectionModalOpen, setIsConnectionModalOpen] = useState<boolean>(false);
  const socketRef = useRef<WebSocket | null>(null);
  const anniversaryRef = useRef<HTMLDivElement>(null);

  // Security & Lock screen state
  const [isLocked, setIsLocked] = useState<boolean>(() => {
    try {
      const sessionUnlocked = sessionStorage.getItem(LOCAL_STORAGE_SESSION_UNLOCKED);
      if (sessionUnlocked === 'true') {
        return false;
      }
      const deviceUnlocked = localStorage.getItem(LOCAL_STORAGE_DEVICE_UNLOCKED);
      if (deviceUnlocked === 'true') {
        return false;
      }
    } catch {}
    return true;
  });

  const handleUnlock = (partner: PartnerId, rememberDevice: boolean) => {
    setIsLocked(false);
    handleSelectPartner(partner);
    try {
      sessionStorage.setItem(LOCAL_STORAGE_SESSION_UNLOCKED, 'true');
      if (rememberDevice) {
        localStorage.setItem(LOCAL_STORAGE_DEVICE_UNLOCKED, 'true');
        localStorage.setItem(LOCAL_STORAGE_PARTNER, partner);
      }
    } catch {}
  };

  const handleLockApp = () => {
    setIsLocked(true);
    try {
      sessionStorage.removeItem(LOCAL_STORAGE_SESSION_UNLOCKED);
      localStorage.removeItem(LOCAL_STORAGE_DEVICE_UNLOCKED);
    } catch {}
  };

  const handleResetPins = () => {
    setData((prev) => {
      const updated: AppData = {
        ...prev,
        profile: {
          ...prev.profile,
          security: {
            partner1Pin: '2604',
            partner2Pin: '5678',
            couplePasscode: '2026',
            requirePinOnEveryOpen: false,
          },
        },
      };
      updateAndSyncData(updated);
      return updated;
    });
  };

  const handleUpdatePin = (partner: PartnerId, newPin: string) => {
    const trimmedPin = newPin.trim();
    if (!trimmedPin || trimmedPin.length < 4) return;
    setData((prev) => {
      const updated: AppData = {
        ...prev,
        profile: {
          ...prev.profile,
          security: {
            ...prev.profile.security,
            partner1Pin: partner === 'partner1' ? trimmedPin : (prev.profile.security?.partner1Pin || '2604'),
            partner2Pin: partner === 'partner2' ? trimmedPin : (prev.profile.security?.partner2Pin || '5678'),
          },
        },
      };
      updateAndSyncData(updated);
      return updated;
    });
  };

  // Apply dark mode class to documentElement
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    try {
      localStorage.setItem(LOCAL_STORAGE_DARK, String(darkMode));
    } catch {}
  }, [darkMode]);

  const handleToggleDarkMode = () => {
    setDarkMode((prev) => !prev);
  };

  const [partnerSwitchTarget, setPartnerSwitchTarget] = useState<PartnerId | null>(null);

  const handleSelectPartner = (partner: PartnerId) => {
    setActivePartner(partner);
    try {
      localStorage.setItem(LOCAL_STORAGE_PARTNER, partner);
    } catch {}
  };

  const handleRequestSelectPartner = (targetPartner: PartnerId) => {
    if (targetPartner === activePartner) return;
    // When switching to the other partner, require her personal PIN (or couple passcode)
    setPartnerSwitchTarget(targetPartner);
  };

  const handleConfirmPartnerSwitch = (targetPartner: PartnerId) => {
    handleSelectPartner(targetPartner);
    setPartnerSwitchTarget(null);
  };

  // Sync state with server & notify subscribers
  const updateAndSyncData = useCallback((newData: AppData) => {
    if (!newData || !newData.profile) return;
    const toSave = {
      ...newData,
      lastModified: Date.now(),
    };
    const normalized = normalizeAppData(toSave);
    setData(normalized);
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(normalized));
    } catch {}

    // 1. Instant WebSocket broadcast to other open clients (notebook / mobile)
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      try {
        socketRef.current.send(JSON.stringify({ type: 'update_all', payload: normalized }));
      } catch (err) {
        console.warn('WS send failed, HTTP sync will persist:', err);
      }
    }

    // 2. HTTP POST persistence
    fetch('/api/data', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(normalized),
    }).catch((err) => {
      console.warn('Sync POST failed (offline mode):', err);
    });

    // 3. Durable Cloud Persistence with Firebase Firestore
    saveFirebaseAppData(normalized).catch((err) => {
      console.warn('[Firebase] Sync save error:', err);
    });
  }, []);

  // Manual cloud synchronization trigger
  const handleManualSync = useCallback(async () => {
    setIsSyncing(true);
    try {
      const res = await fetch(`/api/data?t=${Date.now()}`, { cache: 'no-store' });
      if (res.ok) {
        const serverData = await res.json();
        if (serverData && serverData.profile) {
          setData((prevLocalData) => {
            const { merged, shouldUploadToServer } = smartMergeAppData(prevLocalData, serverData);
            try {
              localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(merged));
            } catch {}
            if (shouldUploadToServer) {
              fetch('/api/data', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(merged),
              }).catch(console.warn);
            }
            return merged;
          });
        }
      }
    } catch (err) {
      console.warn('Manual sync failed:', err);
    } finally {
      setTimeout(() => setIsSyncing(false), 600);
    }
  }, []);

  // Theme synchronization effect
  useEffect(() => {
    let activeTheme = data.profile.theme;
    if (!activeTheme) {
      try {
        activeTheme = localStorage.getItem('nos_dois_app_theme') || 'rose';
      } catch {
        activeTheme = 'rose';
      }
    }
    document.documentElement.setAttribute('data-theme', activeTheme);
  }, [data.profile.theme]);

  // Fetch initial data & connect to WebSocket
  useEffect(() => {
    // 1. HTTP fetch logic - server is the authoritative source across notebook and mobile
    const fetchServerData = () => {
      fetch(`/api/data?t=${Date.now()}`, { cache: 'no-store' })
        .then((res) => (res.ok ? res.json() : null))
        .then((serverData) => {
          if (serverData && serverData.profile) {
            setData((prevLocalData) => {
              const { merged, shouldUploadToServer } = smartMergeAppData(prevLocalData, serverData);
              try {
                localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(merged));
              } catch {}
              if (shouldUploadToServer) {
                // Server was restarted/empty, push local preserved data to re-populate it!
                fetch('/api/data', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(merged),
                }).catch((e) => console.warn('Sync POST failed:', e));
              }
              return merged;
            });
          }
        })
        .catch((e) => console.warn('Could not fetch /api/data:', e));
    };

    fetchServerData();

    // 2. Cloud Firestore Real-time synchronization & initial restore fallback
    let unsubscribeFirestore = () => {};
    try {
      // First try to check Firestore for persistent data in case local / server was empty
      getFirebaseAppData().then((cloudData) => {
        if (cloudData && cloudData.profile) {
          setData((prevLocalData) => {
            const { merged, shouldUploadToServer } = smartMergeAppData(prevLocalData, cloudData);
            try {
              localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(merged));
            } catch {}
            if (shouldUploadToServer) {
              fetch('/api/data', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(merged),
              }).catch(console.warn);
            }
            return merged;
          });
        }
      }).catch(console.warn);

      // Subscribe to real-time Firestore changes
      unsubscribeFirestore = subscribeFirebaseAppData((cloudData) => {
        if (cloudData && cloudData.profile) {
          setData((prevLocalData) => {
            const { merged } = smartMergeAppData(prevLocalData, cloudData);
            try {
              localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(merged));
            } catch {}
            return merged;
          });
        }
      });
    } catch (err) {
      console.warn('[Firebase] Listener init error:', err);
    }

    // 3. Real-time WebSocket connection
    let reconnectTimeout: any = null;

    const connectWs = () => {
      if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) return;
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws`;

      try {
        const socket = new WebSocket(wsUrl);
        socketRef.current = socket;

        socket.onopen = () => {
          setIsOnline(true);
        };

        socket.onmessage = (event) => {
          try {
            const msg = JSON.parse(event.data);
            const incoming = msg.payload || msg.data;
            if ((msg.type === 'init' || msg.type === 'sync_data') && incoming && incoming.profile) {
              setData((prevLocalData) => {
                const { merged, shouldUploadToServer } = smartMergeAppData(prevLocalData, incoming);
                try {
                  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(merged));
                } catch {}
                if (shouldUploadToServer) {
                  fetch('/api/data', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(merged),
                  }).catch((e) => console.warn('Sync POST failed:', e));
                }
                return merged;
              });
            }
          } catch (e) {
            console.error('Error parsing WS message', e);
          }
        };

        socket.onclose = () => {
          setIsOnline(false);
          socketRef.current = null;
          reconnectTimeout = setTimeout(connectWs, 3000);
        };

        socket.onerror = () => {
          setIsOnline(false);
          socket?.close();
        };
      } catch (err) {
        setIsOnline(false);
      }
    };

    connectWs();

    // 3. Focus & Visibility Sync (Ensures mobile and notebook immediately fetch the latest changes upon app opening or tab focus)
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchServerData();
        if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) {
          connectWs();
        }
      }
    };
    const onFocus = () => {
      fetchServerData();
    };

    document.addEventListener('visibilitychange', onVisibilityChange);
    window.addEventListener('focus', onFocus);

    // 4. Background polling every 15s to keep notebook and mobile in sync seamlessly
    const backgroundPoll = setInterval(() => {
      if (document.visibilityState === 'visible') {
        fetchServerData();
      }
    }, 15000);

    return () => {
      unsubscribeFirestore();
      if (socketRef.current) socketRef.current.close();
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('focus', onFocus);
      clearInterval(backgroundPoll);
    };
  }, []);

  // Helper notification creator
  const createNotification = (
    title: string,
    message: string,
    type: 'filme' | 'receita' | 'despensa' | 'compras' | 'aniversario' | 'amor'
  ) => {
    const newNotif = {
      id: `notif-${Date.now()}`,
      title,
      message,
      type,
      timestamp: 'Agora',
      read: false,
    };
    return [newNotif, ...data.notifications.slice(0, 19)];
  };

  // Movie Handlers
  const handleAddMovie = (movie: Omit<MovieItem, 'id' | 'addedAt'>) => {
    const newItem: MovieItem = {
      ...movie,
      id: `m-${Date.now()}`,
      addedAt: new Date().toLocaleDateString('pt-BR'),
    };
    const updated = {
      ...data,
      movies: [newItem, ...data.movies],
      notifications: createNotification(
        'Novo filme salvo!',
        `${activePartner === 'partner1' ? data.profile.partner1.name : data.profile.partner2.name} adicionou "${newItem.title}" à lista.`,
        'filme'
      ),
    };
    updateAndSyncData(updated);
  };

  const handleUpdateMovie = (movie: MovieItem) => {
    const updated = {
      ...data,
      movies: data.movies.map((m) => (m.id === movie.id ? movie : m)),
    };
    updateAndSyncData(updated);
  };

  const handleDeleteMovie = (id: string) => {
    const updated = {
      ...data,
      movies: data.movies.filter((m) => m.id !== id),
    };
    updateAndSyncData(updated);
  };

  // Recipe Handlers
  const handleAddRecipe = (recipe: Omit<RecipeItem, 'id' | 'addedAt'>) => {
    const newItem: RecipeItem = {
      ...recipe,
      id: `rec-${Date.now()}`,
      addedAt: new Date().toLocaleDateString('pt-BR'),
    };
    const updated = {
      ...data,
      recipes: [newItem, ...data.recipes],
      notifications: createNotification(
        'Nova receita adicionada!',
        `${activePartner === 'partner1' ? data.profile.partner1.name : data.profile.partner2.name} salvou "${newItem.title}".`,
        'receita'
      ),
    };
    updateAndSyncData(updated);
  };

  const handleUpdateRecipe = (recipe: RecipeItem) => {
    const updated = {
      ...data,
      recipes: data.recipes.map((r) => (r.id === recipe.id ? recipe : r)),
    };
    updateAndSyncData(updated);
  };

  const handleDeleteRecipe = (id: string) => {
    const updated = {
      ...data,
      recipes: data.recipes.filter((r) => r.id !== id),
    };
    updateAndSyncData(updated);
  };

  const handleAddIngredientsToGroceries = (ingredients: string[]) => {
    const newGroceryItems: GroceryItem[] = ingredients.map((ing, idx) => ({
      id: `g-${Date.now()}-${idx}`,
      name: ing,
      category: 'Hortifruti / Mercearia',
      quantity: '1 un',
      checked: false,
      addedBy: activePartner,
    }));

    const updated = {
      ...data,
      groceries: [...newGroceryItems, ...data.groceries],
      notifications: createNotification(
        'Ingredientes no mercado',
        `${ingredients.length} itens adicionados à lista de compras!`,
        'compras'
      ),
    };
    updateAndSyncData(updated);
  };

  // Grocery Handlers
  const handleAddGrocery = (item: Omit<GroceryItem, 'id'>) => {
    const newItem: GroceryItem = {
      ...item,
      id: `g-${Date.now()}`,
    };
    const updated = {
      ...data,
      groceries: [newItem, ...data.groceries],
      notifications: createNotification(
        'Item no Mercado',
        `${activePartner === 'partner1' ? data.profile.partner1.name : data.profile.partner2.name} adicionou "${newItem.name}".`,
        'compras'
      ),
    };
    updateAndSyncData(updated);
  };

  const handleToggleGrocery = (id: string) => {
    const updated = {
      ...data,
      groceries: data.groceries.map((g) =>
        g.id === id ? { ...g, checked: !g.checked } : g
      ),
    };
    updateAndSyncData(updated);
  };

  const handleDeleteGrocery = (id: string) => {
    const updated = {
      ...data,
      groceries: data.groceries.filter((g) => g.id !== id),
    };
    updateAndSyncData(updated);
  };

  const handleClearCheckedGroceries = () => {
    const updated = {
      ...data,
      groceries: data.groceries.filter((g) => !g.checked),
    };
    updateAndSyncData(updated);
  };

  const handleUpdateGrocery = (updatedGrocery: GroceryItem) => {
    const updated = {
      ...data,
      groceries: data.groceries.map((g) =>
        g.id === updatedGrocery.id ? updatedGrocery : g
      ),
    };
    updateAndSyncData(updated);
  };

  // Pantry Handlers
  const handleAddPantryItem = (item: Omit<PantryItem, 'id'>) => {
    const newItem: PantryItem = {
      ...item,
      id: `p-${Date.now()}`,
    };
    const updated = {
      ...data,
      pantry: [newItem, ...data.pantry],
    };
    updateAndSyncData(updated);
  };

  const handleUpdatePantryItem = (updatedPantry: PantryItem) => {
    const updated = {
      ...data,
      pantry: data.pantry.map((p) =>
        p.id === updatedPantry.id ? updatedPantry : p
      ),
    };
    updateAndSyncData(updated);
  };

  const handleUpdatePantryQuantity = (id: string, delta: number) => {
    const updated = {
      ...data,
      pantry: data.pantry.map((item) => {
        if (item.id !== id) return item;
        const newQty = Math.max(0, item.quantity + delta);
        return { ...item, quantity: newQty };
      }),
    };
    updateAndSyncData(updated);
  };

  const handleDeletePantryItem = (id: string) => {
    const updated = {
      ...data,
      pantry: data.pantry.filter((p) => p.id !== id),
    };
    updateAndSyncData(updated);
  };

  const handleMovePantryToGrocery = (pantryItem: PantryItem) => {
    const newGrocery: GroceryItem = {
      id: `g-${Date.now()}`,
      name: pantryItem.name,
      category: pantryItem.category,
      quantity: `${pantryItem.minQuantity} ${pantryItem.unit}`,
      checked: false,
      addedBy: activePartner,
    };
    const updated = {
      ...data,
      groceries: [newGrocery, ...data.groceries],
      notifications: createNotification(
        'Reposição de despensa',
        `"${pantryItem.name}" adicionado à lista de compras para repor estoque!`,
        'despensa'
      ),
    };
    updateAndSyncData(updated);
  };

  // Weekly Menu Handlers
  const handleVoteMeal = (id: string, partner: PartnerId) => {
    const updated = {
      ...data,
      weeklyMenu: data.weeklyMenu.map((m) => {
        if (m.id !== id) return m;
        return partner === 'partner1'
          ? { ...m, votes1: !m.votes1 }
          : { ...m, votes2: !m.votes2 };
      }),
    };
    updateAndSyncData(updated);
  };

  const handleUpdateMenuItem = (item: WeeklyMenuItem) => {
    const updated = {
      ...data,
      weeklyMenu: data.weeklyMenu.map((m) => (m.id === item.id ? item : m)),
    };
    updateAndSyncData(updated);
  };

  const handleApplyAiSuggestions = (newItems: WeeklyMenuItem[]) => {
    const updated = {
      ...data,
      weeklyMenu: newItems,
      notifications: createNotification(
        'Cardápio IA Atualizado',
        'Novo menu sugerido pela IA baseado no estoque da nossa despensa!',
        'receita'
      ),
    };
    updateAndSyncData(updated);
  };

  // Calendar Event Handlers
  const currentCalendarEvents = data.calendarEvents || data.calendar || [];

  const handleAddEvent = (event: Omit<CalendarEvent, 'id'>) => {
    const newEvent: CalendarEvent = {
      ...event,
      id: `ev-${Date.now()}`,
    };
    const updatedEvents = [newEvent, ...currentCalendarEvents];
    const updated = {
      ...data,
      calendarEvents: updatedEvents,
      calendar: updatedEvents,
      notifications: createNotification(
        'Novo compromisso marcado',
        `"${newEvent.title}" em ${new Date(newEvent.date + 'T00:00:00').toLocaleDateString('pt-BR')}`,
        newEvent.category === 'date_romantico' ? 'amor' : 'despensa'
      ),
    };
    updateAndSyncData(updated);
  };

  const handleToggleEventDone = (id: string) => {
    const updatedEvents = currentCalendarEvents.map((ev) =>
      ev.id === id ? { ...ev, completed: !ev.completed, isCompleted: !ev.isCompleted } : ev
    );
    const updated = {
      ...data,
      calendarEvents: updatedEvents,
      calendar: updatedEvents,
    };
    updateAndSyncData(updated);
  };

  const handleDeleteEvent = (id: string) => {
    const updatedEvents = currentCalendarEvents.filter((ev) => ev.id !== id);
    const updated = {
      ...data,
      calendarEvents: updatedEvents,
      calendar: updatedEvents,
    };
    updateAndSyncData(updated);
  };

  const handleUpdateEvent = (updatedEvent: CalendarEvent) => {
    const updatedEvents = currentCalendarEvents.map((ev) =>
      ev.id === updatedEvent.id ? updatedEvent : ev
    );
    const updated = {
      ...data,
      calendarEvents: updatedEvents,
      calendar: updatedEvents,
    };
    updateAndSyncData(updated);
  };

  const handleUpdateCalendarCategories = (
    categories: string[],
    renamedFrom?: string,
    renamedTo?: string,
    deleted?: string
  ) => {
    let updatedEvents = [...currentCalendarEvents];
    if (renamedFrom && renamedTo) {
      updatedEvents = updatedEvents.map((ev) =>
        ev.category === renamedFrom ? { ...ev, category: renamedTo } : ev
      );
    }
    if (deleted) {
      updatedEvents = updatedEvents.map((ev) =>
        ev.category === deleted ? { ...ev, category: 'tarefa' } : ev
      );
    }
    const updated = {
      ...data,
      calendarEvents: updatedEvents,
      calendar: updatedEvents,
      customCategories: {
        ...(data.customCategories || {}),
        calendar: categories,
      },
    };
    updateAndSyncData(updated);
  };

  // Travel Handlers
  const handleAddTrip = (trip: Omit<TripPlan, 'id'>) => {
    const newTrip: TripPlan = {
      ...trip,
      id: `tr-${Date.now()}`,
    };
    const updated = {
      ...data,
      trips: [newTrip, ...data.trips],
      notifications: createNotification(
        'Nova viagem planejada! ✈️',
        `Destino: ${newTrip.destination}! Já podemos fazer as malas.`,
        'amor'
      ),
    };
    updateAndSyncData(updated);
  };

  const handleUpdateTrip = (trip: TripPlan) => {
    const updated = {
      ...data,
      trips: data.trips.map((t) => (t.id === trip.id ? trip : t)),
    };
    updateAndSyncData(updated);
  };

  const handleDeleteTrip = (id: string) => {
    const updated = {
      ...data,
      trips: data.trips.filter((t) => t.id !== id),
    };
    updateAndSyncData(updated);
  };

  // Photo Album Handlers
  const handleAddPhoto = (photo: Omit<PhotoMemory, 'id'>) => {
    const newPhoto: PhotoMemory = {
      ...photo,
      id: `ph-${Date.now()}`,
    };
    const updated = {
      ...data,
      photos: [newPhoto, ...data.photos],
      notifications: createNotification(
        'Nova memória no álbum 💕',
        `Uma nova foto especial foi guardada no nosso álbum!`,
        'amor'
      ),
    };
    updateAndSyncData(updated);
  };

  const handleLikePhoto = (id: string, partner: PartnerId) => {
    const updated = {
      ...data,
      photos: data.photos.map((p) => {
        if (p.id !== id) return p;
        const alreadyLiked = p.likes.includes(partner);
        return {
          ...p,
          likes: alreadyLiked
            ? p.likes.filter((x) => x !== partner)
            : [...p.likes, partner],
        };
      }),
    };
    updateAndSyncData(updated);
  };

  const handleDeletePhoto = (id: string) => {
    const updated = {
      ...data,
      photos: data.photos.filter((p) => p.id !== id),
    };
    updateAndSyncData(updated);
  };

  // Consumption Handler
  const handleUpdateConsumption = (updatedConsumption: any) => {
    const updated = {
      ...data,
      consumption: updatedConsumption,
    };
    updateAndSyncData(updated);
  };

  // Notification clear
  const handleMarkNotificationRead = (id: string) => {
    const updated = {
      ...data,
      notifications: data.notifications.map((n) =>
        n.id === id ? { ...n, read: true } : n
      ),
    };
    updateAndSyncData(updated);
  };

  const handleClearNotifications = () => {
    const updated = {
      ...data,
      notifications: data.notifications.map((n) => ({ ...n, read: true })),
    };
    updateAndSyncData(updated);
  };

  const handleClearAllNotifications = () => {
    const updated = {
      ...data,
      notifications: [],
    };
    updateAndSyncData(updated);
  };

  // Home & Decor Handlers
  const handleAddHomeDecorItem = (item: Omit<HomeDecorItem, 'id' | 'addedAt'>) => {
    const newItem: HomeDecorItem = {
      ...item,
      id: `decor_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      addedAt: new Date().toISOString(),
    };
    const updated = {
      ...data,
      homeDecor: [newItem, ...(data.homeDecor || [])],
    };
    updateAndSyncData(updated);
  };

  const handleUpdateHomeDecorItem = (item: HomeDecorItem) => {
    const updated = {
      ...data,
      homeDecor: (data.homeDecor || []).map((d) => (d.id === item.id ? item : d)),
    };
    updateAndSyncData(updated);
  };

  const handleDeleteHomeDecorItem = (id: string) => {
    const updated = {
      ...data,
      homeDecor: (data.homeDecor || []).filter((d) => d.id !== id),
    };
    updateAndSyncData(updated);
  };

  const handleToggleHomeDecorStatus = (id: string, status: HomeDecorItem['status']) => {
    const updated = {
      ...data,
      homeDecor: (data.homeDecor || []).map((d) => (d.id === id ? { ...d, status } : d)),
    };
    updateAndSyncData(updated);
  };

  // Home Tips Handlers
  const handleAddHomeTip = (tip: Omit<HomeTipItem, 'id' | 'createdAt'>) => {
    const newTip: HomeTipItem = {
      ...tip,
      id: `tip_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      createdAt: new Date().toISOString(),
    };
    const updated = {
      ...data,
      homeTips: [newTip, ...(data.homeTips || [])],
      notifications: createNotification(
        'Nova dica de casa!',
        `${activePartner === 'partner1' ? data.profile.partner1.name : data.profile.partner2.name} adicionou a dica "${newTip.title}".`,
        'amor'
      ),
    };
    updateAndSyncData(updated);
  };

  const handleUpdateHomeTip = (tip: HomeTipItem) => {
    const updated = {
      ...data,
      homeTips: (data.homeTips || []).map((t) => (t.id === tip.id ? tip : t)),
    };
    updateAndSyncData(updated);
  };

  const handleDeleteHomeTip = (id: string) => {
    const updated = {
      ...data,
      homeTips: (data.homeTips || []).filter((t) => t.id !== id),
    };
    updateAndSyncData(updated);
  };

  const handleToggleFavoriteTip = (id: string) => {
    const updated = {
      ...data,
      homeTips: (data.homeTips || []).map((t) =>
        t.id === id ? { ...t, isFavorite: !t.isFavorite } : t
      ),
    };
    updateAndSyncData(updated);
  };

  // Profile Save
  const handleSaveProfile = (profile: CoupleProfile) => {
    const updated = {
      ...data,
      profile,
    };
    updateAndSyncData(updated);
    if (profile.theme) {
      document.documentElement.setAttribute('data-theme', profile.theme);
      try {
        localStorage.setItem('nos_dois_app_theme', profile.theme);
      } catch {}
    }
  };

  const handleUpdateWeatherNote = (
    partner: PartnerId,
    note: WeatherNote | null
  ) => {
    const updatedNotes: WeatherNotesData = {
      ...(data.weatherNotes || {}),
      [partner === 'partner1' ? 'partner1Note' : 'partner2Note']: note || undefined,
    };
    const sender = activePartner === 'partner1' ? data.profile.partner1.name : data.profile.partner2.name;
    const targetName = partner === 'partner1' ? data.profile.partner1.name : data.profile.partner2.name;
    const updated: AppData = {
      ...data,
      weatherNotes: updatedNotes,
      notifications: note
        ? createNotification(
            'Novo recadinho de clima 💌',
            `${sender} deixou um recadinho especial no Clima para ${targetName}!`,
            'amor'
          )
        : data.notifications,
    };
    updateAndSyncData(updated);
  };

  // Reset sample data to a clean, empty state (preserves couple profile, passwords & anniversary)
  const handleResetSampleData = async () => {
    const currentMonthKey = new Date().toISOString().slice(0, 7);
    const cleanedData: AppData = {
      profile: data.profile,
      movies: [],
      recipes: [],
      pantry: [],
      groceries: [],
      weeklyMenu: [],
      homeDecor: [],
      calendarEvents: [],
      calendar: [],
      trips: [],
      photos: [],
      notifications: [],
      consumption: {
        activeMonthKey: currentMonthKey,
        monthsRecords: {},
        rentSpent: 0,
        electricitySpent: 0,
        waterSpent: 0,
        internetSpent: 0,
        creditCardSpent: 0,
        paidStatus: {
          rent: false,
          water: false,
          electricity: false,
          internet: false,
          creditCard: false,
        },
        customExpenses: [],
        monthlyHistory: [],
      },
      lastModified: Date.now(),
      isCleaned: true,
    };

    // Update state & localStorage immediately
    setData(cleanedData);
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(cleanedData));
    } catch {}

    // Synchronize to backend reset endpoint
    try {
      await fetch('/api/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile: data.profile }),
      });
    } catch (err) {
      console.warn('Dedicated /api/reset endpoint call error, syncing via /api/data:', err);
      updateAndSyncData(cleanedData);
    }
  };

  if (isLocked) {
    return (
      <LockScreen
        profile={data.profile}
        activePartner={activePartner}
        onUnlock={handleUnlock}
        onResetPins={handleResetPins}
        onUpdatePin={handleUpdatePin}
        darkMode={darkMode}
        onToggleDarkMode={handleToggleDarkMode}
      />
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg-main)] text-[var(--text-main)] selection:bg-[#E07A8B]/30 transition-colors duration-200">
      {/* Top Header */}
      <Header
        data={data}
        activePartner={activePartner}
        onSelectPartner={handleRequestSelectPartner}
        darkMode={darkMode}
        onToggleDarkMode={handleToggleDarkMode}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenConnectionModal={() => setIsConnectionModalOpen(true)}
        onLockApp={handleLockApp}
        onMarkNotificationRead={handleMarkNotificationRead}
        onClearNotifications={handleClearNotifications}
        onClearAllNotifications={handleClearAllNotifications}
        isOnline={isOnline}
        onManualSync={handleManualSync}
        isSyncing={isSyncing}
        onScrollToAnniversary={() => {
          setActiveTab('home');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />

      {/* Main Page Layout with Left Sidebar on Desktop */}
      <div className="flex-1 w-full max-w-[1720px] mx-auto px-3 sm:px-6 lg:px-8 py-4 flex flex-col md:flex-row gap-6">
        {/* Desktop Left Sidebar Menu (permanently docked on the left for md and up) */}
        <aside className="hidden md:block w-64 xl:w-72 shrink-0">
          <div className="sticky top-20">
            <Navigation
              layout="sidebar"
              activeTab={activeTab}
              onChangeTab={setActiveTab}
              badgeCounts={{
                moviesToWatch: data.movies.filter((m) => m.status === 'to_watch').length,
                groceryPending: data.groceries.filter((g) => !g.checked).length,
              }}
            />
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 min-w-0 pb-24 md:pb-16 space-y-4">
          {/* View Switcher */}
          <div className="pt-1">
          {activeTab === 'home' && (
            <div ref={anniversaryRef}>
              <HomeView
                data={data}
                activePartner={activePartner}
                onNavigateTab={setActiveTab}
                onOpenSettings={() => setIsSettingsOpen(true)}
                onUpdateWeatherNote={handleUpdateWeatherNote}
              />
            </div>
          )}

          {activeTab === 'movies' && (
            <MoviesView
              movies={data.movies}
              profile={data.profile}
              activePartner={activePartner}
              onAddMovie={handleAddMovie}
              onUpdateMovie={handleUpdateMovie}
              onDeleteMovie={handleDeleteMovie}
            />
          )}

          {activeTab === 'recipes' && (
            <RecipesView
              recipes={data.recipes}
              profile={data.profile}
              activePartner={activePartner}
              onAddRecipe={handleAddRecipe}
              onUpdateRecipe={handleUpdateRecipe}
              onDeleteRecipe={handleDeleteRecipe}
              onAddIngredientsToGroceries={handleAddIngredientsToGroceries}
            />
          )}

          {activeTab === 'pantry_grocery' && (
            <PantryAndGroceryView
              groceries={data.groceries}
              pantry={data.pantry}
              profile={data.profile}
              activePartner={activePartner}
              onAddGrocery={handleAddGrocery}
              onUpdateGrocery={handleUpdateGrocery}
              onToggleGrocery={handleToggleGrocery}
              onDeleteGrocery={handleDeleteGrocery}
              onClearCheckedGroceries={handleClearCheckedGroceries}
              onAddPantryItem={handleAddPantryItem}
              onUpdatePantryItem={handleUpdatePantryItem}
              onUpdatePantryQuantity={handleUpdatePantryQuantity}
              onDeletePantryItem={handleDeletePantryItem}
              onMovePantryToGrocery={handleMovePantryToGrocery}
            />
          )}

          {activeTab === 'home_decor' && (
            <HomeDecorView
              items={data.homeDecor || []}
              tips={data.homeTips || []}
              profile={data.profile}
              activePartner={activePartner}
              onAddItem={handleAddHomeDecorItem}
              onUpdateItem={handleUpdateHomeDecorItem}
              onDeleteItem={handleDeleteHomeDecorItem}
              onToggleStatus={handleToggleHomeDecorStatus}
              onAddTip={handleAddHomeTip}
              onUpdateTip={handleUpdateHomeTip}
              onDeleteTip={handleDeleteHomeTip}
              onToggleFavoriteTip={handleToggleFavoriteTip}
            />
          )}

          {activeTab === 'calendar' && (
            <CalendarView
              events={currentCalendarEvents}
              profile={data.profile}
              activePartner={activePartner}
              onAddEvent={handleAddEvent}
              onUpdateEvent={handleUpdateEvent}
              onToggleEventDone={handleToggleEventDone}
              onDeleteEvent={handleDeleteEvent}
              customCategories={data.customCategories?.calendar || []}
              onUpdateCustomCategories={handleUpdateCalendarCategories}
            />
          )}

          {activeTab === 'trips' && (
            <TravelPlannerView
              trips={data.trips}
              profile={data.profile}
              activePartner={activePartner}
              onAddTrip={handleAddTrip}
              onUpdateTrip={handleUpdateTrip}
              onDeleteTrip={handleDeleteTrip}
            />
          )}

          {activeTab === 'photos' && (
            <PhotoAlbumView
              photos={data.photos}
              profile={data.profile}
              activePartner={activePartner}
              onAddPhoto={handleAddPhoto}
              onLikePhoto={handleLikePhoto}
              onDeletePhoto={handleDeletePhoto}
            />
          )}

          {activeTab === 'consumption' && (
            <ConsumptionReportView
              consumption={data.consumption}
              profile={data.profile}
              activePartner={activePartner}
              onUpdateConsumption={handleUpdateConsumption}
            />
          )}

          {activeTab === 'lumina' && (
            <LuminaAiView
              profile={data.profile}
              activePartner={activePartner}
            />
          )}

          {activeTab === 'games' && (
            <CoupleGamesView
              profile={data.profile}
              activePartner={activePartner}
            />
          )}

          {activeTab === 'sintonia' && (
            <SintoniaView
              data={data}
              activePartner={data.profile[activePartner]}
              onUpdateData={(updater) => {
                if (typeof updater === 'function') {
                  const updated = updater(data);
                  updateAndSyncData(updated);
                } else {
                  updateAndSyncData(updater);
                }
              }}
            />
          )}
        </div>
        </main>
      </div>

      {/* Mobile "Mais" Drawer / Sheet */}
      {isMobileMoreOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex flex-col justify-end animate-in fade-in duration-200">
          <div
            className="bg-[#FAF8F5] dark:bg-[#20181D] border-t border-[#F2E8E4] dark:border-[#3D2F36] rounded-t-3xl p-5 space-y-4 shadow-2xl pb-[max(1.5rem,env(safe-area-inset-bottom))]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-[#F2E8E4] dark:border-[#3D2F36]">
              <h3 className="font-serif font-bold text-sm text-[#2D2327] dark:text-[#FAF4F0]">
                Outras Abas do Nosso Canto
              </h3>
              <button
                onClick={() => setIsMobileMoreOpen(false)}
                className="p-1 rounded-full text-[#7D6F74] hover:bg-rose-50 dark:hover:bg-[#2F2128]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <button
                onClick={() => {
                  setActiveTab('games');
                  setIsMobileMoreOpen(false);
                }}
                className={`p-3 rounded-2xl border text-left flex items-center gap-3 transition-colors ${
                  activeTab === 'games'
                    ? 'bg-rose-100/70 dark:bg-rose-950/60 border-[#E07A8B] text-[#E07A8B] font-bold'
                    : 'bg-white dark:bg-[#271E23] border-[#F2E8E4] dark:border-[#3D2F36] text-[#2D2327] dark:text-[#FAF4F0]'
                }`}
              >
                <div className="p-2 rounded-xl bg-purple-100/70 dark:bg-purple-950/40 text-purple-600">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-semibold">Joguinhos 💕</p>
                  <p className="text-[10px] text-[#7D6F74] dark:text-[#B8A8AF]">Quiz & Roleta</p>
                </div>
              </button>

              <button
                onClick={() => {
                  setActiveTab('calendar');
                  setIsMobileMoreOpen(false);
                }}
                className={`p-3 rounded-2xl border text-left flex items-center gap-3 transition-colors ${
                  activeTab === 'calendar'
                    ? 'bg-rose-100/70 dark:bg-rose-950/60 border-[#E07A8B] text-[#E07A8B] font-bold'
                    : 'bg-white dark:bg-[#271E23] border-[#F2E8E4] dark:border-[#3D2F36] text-[#2D2327] dark:text-[#FAF4F0]'
                }`}
              >
                <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-[#E07A8B]">
                  <CalendarCheck className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-semibold">Agenda</p>
                  <p className="text-[10px] text-[#7D6F74] dark:text-[#B8A8AF]">Compromissos</p>
                </div>
              </button>

              <button
                onClick={() => {
                  setActiveTab('photos');
                  setIsMobileMoreOpen(false);
                }}
                className={`p-3 rounded-2xl border text-left flex items-center gap-3 transition-colors ${
                  activeTab === 'photos'
                    ? 'bg-rose-100/70 dark:bg-rose-950/60 border-[#E07A8B] text-[#E07A8B] font-bold'
                    : 'bg-white dark:bg-[#271E23] border-[#F2E8E4] dark:border-[#3D2F36] text-[#2D2327] dark:text-[#FAF4F0]'
                }`}
              >
                <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-[#E07A8B]">
                  <Camera className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-semibold">Fotos</p>
                  <p className="text-[10px] text-[#7D6F74] dark:text-[#B8A8AF]">Álbum de memórias</p>
                </div>
              </button>

              <button
                onClick={() => {
                  setActiveTab('home_decor');
                  setIsMobileMoreOpen(false);
                }}
                className={`p-3 rounded-2xl border text-left flex items-center gap-3 transition-colors ${
                  activeTab === 'home_decor'
                    ? 'bg-rose-100/70 dark:bg-rose-950/60 border-[#E07A8B] text-[#E07A8B] font-bold'
                    : 'bg-white dark:bg-[#271E23] border-[#F2E8E4] dark:border-[#3D2F36] text-[#2D2327] dark:text-[#FAF4F0]'
                }`}
              >
                <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-[#E07A8B]">
                  <Home className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-semibold">Nosso Lar</p>
                  <p className="text-[10px] text-[#7D6F74] dark:text-[#B8A8AF]">Decoração & Casa</p>
                </div>
              </button>

              <button
                onClick={() => {
                  setActiveTab('trips');
                  setIsMobileMoreOpen(false);
                }}
                className={`p-3 rounded-2xl border text-left flex items-center gap-3 transition-colors ${
                  activeTab === 'trips'
                    ? 'bg-rose-100/70 dark:bg-rose-950/60 border-[#E07A8B] text-[#E07A8B] font-bold'
                    : 'bg-white dark:bg-[#271E23] border-[#F2E8E4] dark:border-[#3D2F36] text-[#2D2327] dark:text-[#FAF4F0]'
                }`}
              >
                <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-[#E07A8B]">
                  <Plane className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-semibold">Viagens</p>
                  <p className="text-[10px] text-[#7D6F74] dark:text-[#B8A8AF]">Roteiros e malas</p>
                </div>
              </button>

              <button
                onClick={() => {
                  setActiveTab('sintonia');
                  setIsMobileMoreOpen(false);
                }}
                className={`p-3 rounded-2xl border text-left flex items-center gap-3 transition-colors ${
                  activeTab === 'sintonia'
                    ? 'bg-rose-100/70 dark:bg-rose-950/60 border-[#E07A8B] text-[#E07A8B] font-bold'
                    : 'bg-white dark:bg-[#271E23] border-[#F2E8E4] dark:border-[#3D2F36] text-[#2D2327] dark:text-[#FAF4F0]'
                }`}
              >
                <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-[#E07A8B]">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-semibold">Sintonia 💕</p>
                  <p className="text-[10px] text-[#7D6F74] dark:text-[#B8A8AF]">Sonhos & Músicas</p>
                </div>
              </button>

              <button
                onClick={() => {
                  setActiveTab('consumption');
                  setIsMobileMoreOpen(false);
                }}
                className={`p-3 rounded-2xl border text-left flex items-center gap-3 transition-colors ${
                  activeTab === 'consumption'
                    ? 'bg-rose-100/70 dark:bg-rose-950/60 border-[#E07A8B] text-[#E07A8B] font-bold'
                    : 'bg-white dark:bg-[#271E23] border-[#F2E8E4] dark:border-[#3D2F36] text-[#2D2327] dark:text-[#FAF4F0]'
                }`}
              >
                <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-[#E07A8B]">
                  <PieChart className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-semibold">Gastos</p>
                  <p className="text-[10px] text-[#7D6F74] dark:text-[#B8A8AF]">Contas & 50/50</p>
                </div>
              </button>

              <button
                onClick={() => {
                  setActiveTab('lumina');
                  setIsMobileMoreOpen(false);
                }}
                className={`p-3 rounded-2xl border text-left flex items-center gap-3 transition-colors ${
                  activeTab === 'lumina'
                    ? 'bg-purple-100/70 dark:bg-purple-950/60 border-purple-500 text-purple-600 font-bold'
                    : 'bg-white dark:bg-[#271E23] border-[#F2E8E4] dark:border-[#3D2F36] text-[#2D2327] dark:text-[#FAF4F0]'
                }`}
              >
                <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600">
                  <Bot className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-semibold">Lumina AI ✨</p>
                  <p className="text-[10px] text-[#7D6F74] dark:text-[#B8A8AF]">Assistente Inteligente</p>
                </div>
              </button>

              {/* Quick Mobile Shortcuts: Lock & Settings */}
              <div className="col-span-2 pt-2 border-t border-[#F2E8E4] dark:border-[#3D2F36] grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    setIsMobileMoreOpen(false);
                    handleLockApp();
                  }}
                  className="p-2.5 rounded-xl bg-rose-50/80 dark:bg-rose-950/50 border border-rose-200/70 dark:border-rose-800/60 text-[#E07A8B] flex items-center justify-center gap-2 text-xs font-semibold hover:bg-rose-100 transition-colors"
                >
                  <Lock className="w-4 h-4 text-[#E07A8B]" />
                  <span>Bloquear com PIN</span>
                </button>

                <button
                  onClick={() => {
                    setIsMobileMoreOpen(false);
                    setIsSettingsOpen(true);
                  }}
                  className="p-2.5 rounded-xl bg-white dark:bg-[#271E23] border border-[#F2E8E4] dark:border-[#3D2F36] text-[#2D2327] dark:text-[#FAF4F0] flex items-center justify-center gap-2 text-xs font-semibold hover:bg-[#FAF3EC] dark:hover:bg-[#3D2F36] transition-colors"
                >
                  <Settings className="w-4 h-4 text-[#7D6F74] dark:text-[#B8A8AF]" />
                  <span>Configurações</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Spacious Mobile Floating Bottom Bar (Safe Area aware, 5 primary tabs) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#FAF8F5]/95 dark:bg-[#1E161A]/95 backdrop-blur-md border-t border-[#F2E8E4] dark:border-[#3D2F36] px-2 pt-1.5 pb-[max(0.75rem,env(safe-area-inset-bottom))] flex items-center justify-around shadow-xl">
        <button
          onClick={() => {
            setActiveTab('home');
            setIsMobileMoreOpen(false);
          }}
          className={`flex-1 flex flex-col items-center justify-center py-2 px-0.5 rounded-2xl text-[11px] transition-all min-h-[50px] touch-manipulation active:scale-95 ${
            activeTab === 'home'
              ? 'text-[#E07A8B] font-bold bg-rose-50/70 dark:bg-rose-950/40'
              : 'text-[#7D6F74] dark:text-[#B8A8AF] hover:text-[#2D2327]'
          }`}
        >
          <Heart className={`w-5 h-5 ${activeTab === 'home' ? 'fill-current text-[#E07A8B]' : ''}`} />
          <span className="mt-1 whitespace-nowrap">Início</span>
        </button>

        <button
          onClick={() => {
            setActiveTab('movies');
            setIsMobileMoreOpen(false);
          }}
          className={`flex-1 flex flex-col items-center justify-center py-2 px-0.5 rounded-2xl text-[11px] transition-all min-h-[50px] touch-manipulation active:scale-95 ${
            activeTab === 'movies'
              ? 'text-[#E07A8B] font-bold bg-rose-50/70 dark:bg-rose-950/40'
              : 'text-[#7D6F74] dark:text-[#B8A8AF] hover:text-[#2D2327]'
          }`}
        >
          <Film className="w-5 h-5" />
          <span className="mt-1 whitespace-nowrap">Filmes</span>
        </button>

        <button
          onClick={() => {
            setActiveTab('recipes');
            setIsMobileMoreOpen(false);
          }}
          className={`flex-1 flex flex-col items-center justify-center py-2 px-0.5 rounded-2xl text-[11px] transition-all min-h-[50px] touch-manipulation active:scale-95 ${
            activeTab === 'recipes'
              ? 'text-[#E07A8B] font-bold bg-rose-50/70 dark:bg-rose-950/40'
              : 'text-[#7D6F74] dark:text-[#B8A8AF] hover:text-[#2D2327]'
          }`}
        >
          <UtensilsCrossed className="w-5 h-5" />
          <span className="mt-1 whitespace-nowrap">Receitas</span>
        </button>

        <button
          onClick={() => {
            setActiveTab('pantry_grocery');
            setIsMobileMoreOpen(false);
          }}
          className={`flex-1 flex flex-col items-center justify-center py-2 px-0.5 rounded-2xl text-[11px] transition-all min-h-[50px] touch-manipulation active:scale-95 ${
            activeTab === 'pantry_grocery'
              ? 'text-[#E07A8B] font-bold bg-rose-50/70 dark:bg-rose-950/40'
              : 'text-[#7D6F74] dark:text-[#B8A8AF] hover:text-[#2D2327]'
          }`}
        >
          <ShoppingBag className="w-5 h-5" />
          <span className="mt-1 whitespace-nowrap">Mercado</span>
        </button>

        <button
          onClick={() => setIsMobileMoreOpen((prev) => !prev)}
          className={`flex-1 flex flex-col items-center justify-center py-2 px-0.5 rounded-2xl text-[11px] transition-all min-h-[50px] touch-manipulation active:scale-95 ${
            isMobileMoreOpen
              ? 'text-[#E07A8B] font-bold bg-rose-50/70 dark:bg-rose-950/40'
              : 'text-[#7D6F74] dark:text-[#B8A8AF] hover:text-[#2D2327]'
          }`}
        >
          <MoreHorizontal className="w-5 h-5" />
          <span className="mt-1 whitespace-nowrap">Mais</span>
        </button>
      </div>

      {/* Couple Connection & Login Modal */}
      <CoupleConnectionModal
        isOpen={isConnectionModalOpen}
        onClose={() => setIsConnectionModalOpen(false)}
        partner1={data.profile.partner1}
        partner2={data.profile.partner2}
        activePartner={activePartner}
        onSelectPartner={(p) => {
          handleSelectPartner(p);
          setIsConnectionModalOpen(false);
        }}
      />

      {/* Couple Profile Settings Modal */}
      <CoupleSettingsModal
        profile={data.profile}
        activePartner={activePartner}
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onSaveProfile={handleSaveProfile}
        appData={data}
        onRestoreData={(imported) => {
          fetch('/api/restore', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(imported),
          }).catch(console.warn);
          updateAndSyncData(imported);
        }}
        onResetSampleData={handleResetSampleData}
        onManualSync={handleManualSync}
        isSyncing={isSyncing}
      />

      {/* Switch Partner PIN Verification Modal */}
      {partnerSwitchTarget && (
        <SwitchPartnerModal
          isOpen={Boolean(partnerSwitchTarget)}
          onClose={() => setPartnerSwitchTarget(null)}
          targetPartner={partnerSwitchTarget}
          profile={data.profile}
          onConfirmSwitch={handleConfirmPartnerSwitch}
        />
      )}
    </div>
  );
}
