import { AppData } from '../types';
import { initialCoupleData } from '../data/initialData';

export function hasUserContent(data: any): boolean {
  if (!data || !data.profile) return false;
  if (Array.isArray(data.recipes) && data.recipes.length > 0) return true;
  if (Array.isArray(data.movies) && data.movies.length > 0) return true;
  if (Array.isArray(data.photos) && data.photos.length > 0) return true;
  if (Array.isArray(data.groceries) && data.groceries.length > 0) return true;
  if (Array.isArray(data.pantry) && data.pantry.length > 0) return true;
  if (Array.isArray(data.trips) && data.trips.length > 0) return true;
  if (Array.isArray(data.coupleDreams) && data.coupleDreams.length > 0) return true;
  if (data.coupleSoundtrack?.songs?.length > 0 || data.coupleSoundtrack?.playlists?.length > 0) return true;
  const cal = data.calendarEvents || data.calendar;
  if (Array.isArray(cal) && cal.length > 0) return true;
  if (Array.isArray(data.homeDecor) && data.homeDecor.length > 0) return true;
  if (Array.isArray(data.homeTips) && data.homeTips.length > 0) return true;

  // Weather notes
  if (data.weatherNotes?.partner1Note?.text || data.weatherNotes?.partner2Note?.text) return true;

  // Profile checks - custom avatar (photo base64 or custom emoji)
  const p1Av = data.profile?.partner1?.avatar;
  if (p1Av && p1Av !== '👩🏻' && p1Av !== '👩🏻‍🦰' && p1Av !== '👩‍🦰') return true;
  const p2Av = data.profile?.partner2?.avatar;
  if (p2Av && p2Av !== '👩🏽') return true;

  // Profile checks - security PINs changed from defaults
  const sec = data.profile?.security;
  if (sec?.partner1Pin && sec.partner1Pin !== '1234') return true;
  if (sec?.partner2Pin && sec.partner2Pin !== '5678') return true;
  if (sec?.couplePasscode && sec.couplePasscode !== '2026') return true;

  // Anniversary note changed
  if (
    data.profile?.anniversaryNote &&
    data.profile.anniversaryNote !== 'Meu coração fez a melhor escolha. 💕' &&
    data.profile.anniversaryNote !== 'Cada dia ao seu lado é o melhor momento da minha vida. Te amo infinito! 💕'
  ) {
    return true;
  }

  // Custom categories added
  if (data.customCategories?.calendar?.length > 0) return true;
  if (data.customCategories?.recipes?.length > 0) return true;
  if (data.customCategories?.movies?.length > 0) return true;

  return false;
}

export function normalizeAppData(raw: any): AppData {
  if (!raw || typeof raw !== 'object' || !raw.profile) {
    return initialCoupleData;
  }
  const weeklyMenu = Array.isArray(raw.weeklyMenu) ? raw.weeklyMenu : [];
  const calendarEvents = Array.isArray(raw.calendarEvents)
    ? raw.calendarEvents
    : Array.isArray(raw.calendar)
    ? raw.calendar
    : [];

  const profile = raw.profile || initialCoupleData.profile;
  if (profile.partner1 && (profile.partner1.avatar === '👩🏻‍🦰' || profile.partner1.avatar === '👩‍🦰')) {
    profile.partner1.avatar = '👩🏻';
  }
  if (!profile.anniversaryNote || profile.anniversaryNote === 'Cada dia ao seu lado é o melhor momento da minha vida. Te amo infinito! 💕') {
    profile.anniversaryNote = 'Meu coração fez a melhor escolha. 💕';
  }

  const customCategories = raw.customCategories || {};
  if (!Array.isArray(customCategories.recipes)) customCategories.recipes = [];
  if (!Array.isArray(customCategories.movies)) customCategories.movies = [];
  if (!Array.isArray(customCategories.calendar)) customCategories.calendar = [];

  return {
    profile,
    movies: Array.isArray(raw.movies) ? raw.movies : [],
    recipes: Array.isArray(raw.recipes) ? raw.recipes : [],
    pantry: Array.isArray(raw.pantry) ? raw.pantry : [],
    groceries: Array.isArray(raw.groceries) ? raw.groceries : [],
    weeklyMenu,
    calendarEvents,
    calendar: calendarEvents,
    trips: Array.isArray(raw.trips) ? raw.trips : [],
    photos: Array.isArray(raw.photos) ? raw.photos : [],
    homeDecor: Array.isArray(raw.homeDecor) ? raw.homeDecor : [],
    homeTips: Array.isArray(raw.homeTips) ? raw.homeTips : (initialCoupleData.homeTips || []),
    notifications: Array.isArray(raw.notifications) ? raw.notifications : [],
    coupleDreams: Array.isArray(raw.coupleDreams) ? raw.coupleDreams : [],
    coupleSoundtrack: raw.coupleSoundtrack && Array.isArray(raw.coupleSoundtrack.songs)
      ? raw.coupleSoundtrack
      : { songs: [], playlists: [] },
    weatherNotes: raw.weatherNotes || {},
    customCategories,
    consumption: raw.consumption || {
      activeMonthKey: new Date().toISOString().slice(0, 7),
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
    lastModified: raw.lastModified || Date.now(),
    isCleaned: raw.isCleaned,
  };
}

export function smartMergeAppData(
  localData: AppData,
  incomingData: AppData
): { merged: AppData; shouldUploadToServer: boolean } {
  const normLocal = normalizeAppData(localData);
  const normIncoming = normalizeAppData(incomingData);

  const localHas = hasUserContent(normLocal);
  const incomingHas = hasUserContent(normIncoming);

  // Case 1: Browser has real data, but server is blank/empty/restarted
  if (localHas && !incomingHas) {
    console.warn('[Anti-Wipe Client] O servidor retornou estado vazio/padrão, mas este navegador possui dados reais. Re-hidratando servidor!');
    return {
      merged: normLocal,
      shouldUploadToServer: true,
    };
  }

  // Case 2: Browser was fresh/empty, but server has real data
  if (!localHas && incomingHas) {
    return {
      merged: normIncoming,
      shouldUploadToServer: false,
    };
  }

  // Smart merge profiles - NEVER allow default avatar or PIN to overwrite customized ones!
  const isIncomingP1DefaultAvatar = !normIncoming.profile.partner1?.avatar || normIncoming.profile.partner1.avatar === '👩🏻';
  const isLocalP1CustomAvatar = normLocal.profile.partner1?.avatar && normLocal.profile.partner1.avatar !== '👩🏻';
  const p1Avatar = isIncomingP1DefaultAvatar && isLocalP1CustomAvatar
    ? normLocal.profile.partner1.avatar
    : (normIncoming.profile.partner1?.avatar || normLocal.profile.partner1?.avatar || '👩🏻');

  const isIncomingP2DefaultAvatar = !normIncoming.profile.partner2?.avatar || normIncoming.profile.partner2.avatar === '👩🏽';
  const isLocalP2CustomAvatar = normLocal.profile.partner2?.avatar && normLocal.profile.partner2.avatar !== '👩🏽';
  const p2Avatar = isIncomingP2DefaultAvatar && isLocalP2CustomAvatar
    ? normLocal.profile.partner2.avatar
    : (normIncoming.profile.partner2?.avatar || normLocal.profile.partner2?.avatar || '👩🏽');

  const p1 = {
    ...normLocal.profile.partner1,
    ...normIncoming.profile.partner1,
    avatar: p1Avatar,
    nickname: normIncoming.profile.partner1?.nickname || normLocal.profile.partner1?.nickname,
    city: normIncoming.profile.partner1?.city || normLocal.profile.partner1?.city,
  };
  const p2 = {
    ...normLocal.profile.partner2,
    ...normIncoming.profile.partner2,
    avatar: p2Avatar,
    nickname: normIncoming.profile.partner2?.nickname || normLocal.profile.partner2?.nickname,
    city: normIncoming.profile.partner2?.city || normLocal.profile.partner2?.city,
  };

  const p1Pin = normIncoming.profile.security?.partner1Pin && normIncoming.profile.security.partner1Pin !== '1234'
    ? normIncoming.profile.security.partner1Pin
    : (normLocal.profile.security?.partner1Pin || '1234');

  const p2Pin = normIncoming.profile.security?.partner2Pin && normIncoming.profile.security.partner2Pin !== '5678'
    ? normIncoming.profile.security.partner2Pin
    : (normLocal.profile.security?.partner2Pin || '5678');

  const couplePasscode = normIncoming.profile.security?.couplePasscode && normIncoming.profile.security.couplePasscode !== '2026'
    ? normIncoming.profile.security.couplePasscode
    : (normLocal.profile.security?.couplePasscode || '2026');

  const security = {
    partner1Pin: p1Pin,
    partner2Pin: p2Pin,
    couplePasscode,
    requirePinOnEveryOpen: normIncoming.profile.security?.requirePinOnEveryOpen ?? normLocal.profile.security?.requirePinOnEveryOpen ?? false,
  };

  const mergeById = <T extends { id?: string }>(arr1: T[] = [], arr2: T[] = []): T[] => {
    const map = new Map<string, T>();
    (arr1 || []).forEach((item, idx) => {
      const key = item.id || `idx-${idx}`;
      map.set(key, item);
    });
    (arr2 || []).forEach((item, idx) => {
      const key = item.id || `idx-${idx}`;
      map.set(key, item);
    });
    return Array.from(map.values());
  };

  const mergedMovies = mergeById(normLocal.movies, normIncoming.movies);
  const mergedRecipes = mergeById(normLocal.recipes, normIncoming.recipes);
  const mergedPantry = mergeById(normLocal.pantry, normIncoming.pantry);
  const mergedGroceries = mergeById(normLocal.groceries, normIncoming.groceries);
  const mergedCalendar = mergeById(normLocal.calendarEvents, normIncoming.calendarEvents);
  const mergedTrips = mergeById(normLocal.trips, normIncoming.trips);
  const mergedPhotos = mergeById(normLocal.photos, normIncoming.photos);
  const mergedHomeDecor = mergeById(normLocal.homeDecor, normIncoming.homeDecor);
  const mergedDreams = mergeById(normLocal.coupleDreams, normIncoming.coupleDreams);

  const customCatCalendar = Array.from(new Set([
    ...(normLocal.customCategories?.calendar || []),
    ...(normIncoming.customCategories?.calendar || []),
  ]));
  const customCatRecipes = Array.from(new Set([
    ...(normLocal.customCategories?.recipes || []),
    ...(normIncoming.customCategories?.recipes || []),
  ]));
  const customCatMovies = Array.from(new Set([
    ...(normLocal.customCategories?.movies || []),
    ...(normIncoming.customCategories?.movies || []),
  ]));

  const mergeWeatherNote = (n1?: any, n2?: any) => {
    if (!n1 && !n2) return undefined;
    if (!n1) return n2;
    if (!n2) return n1;
    const t1 = n1.updatedAt ? new Date(n1.updatedAt).getTime() : 0;
    const t2 = n2.updatedAt ? new Date(n2.updatedAt).getTime() : 0;
    return t2 >= t1 ? n2 : n1;
  };

  const merged: AppData = {
    profile: {
      ...normLocal.profile,
      ...normIncoming.profile,
      partner1: p1,
      partner2: p2,
      security,
      coupleName: normIncoming.profile.coupleName || normLocal.profile.coupleName,
      anniversaryDate: normIncoming.profile.anniversaryDate || normLocal.profile.anniversaryDate,
      anniversaryNote: normIncoming.profile.anniversaryNote || normLocal.profile.anniversaryNote,
    },
    movies: mergedMovies,
    recipes: mergedRecipes,
    pantry: mergedPantry,
    groceries: mergedGroceries,
    weeklyMenu: normIncoming.weeklyMenu && normIncoming.weeklyMenu.length > 0 ? normIncoming.weeklyMenu : normLocal.weeklyMenu,
    calendarEvents: mergedCalendar,
    calendar: mergedCalendar,
    trips: mergedTrips,
    photos: mergedPhotos,
    homeDecor: mergedHomeDecor,
    homeTips: normIncoming.homeTips && normIncoming.homeTips.length > 0 ? normIncoming.homeTips : normLocal.homeTips,
    notifications: normIncoming.notifications && normIncoming.notifications.length > 0 ? normIncoming.notifications : normLocal.notifications,
    coupleDreams: mergedDreams,
    coupleSoundtrack: {
      anthemSongId: normIncoming.coupleSoundtrack?.anthemSongId || normLocal.coupleSoundtrack?.anthemSongId,
      songs: mergeById(normLocal.coupleSoundtrack?.songs, normIncoming.coupleSoundtrack?.songs),
      playlists: mergeById(normLocal.coupleSoundtrack?.playlists, normIncoming.coupleSoundtrack?.playlists),
    },
    weatherNotes: {
      partner1Note: mergeWeatherNote(normLocal.weatherNotes?.partner1Note, normIncoming.weatherNotes?.partner1Note),
      partner2Note: mergeWeatherNote(normLocal.weatherNotes?.partner2Note, normIncoming.weatherNotes?.partner2Note),
    },
    customCategories: {
      recipes: customCatRecipes,
      movies: customCatMovies,
      calendar: customCatCalendar,
      homeTips: normIncoming.customCategories?.homeTips || normLocal.customCategories?.homeTips,
    },
    consumption: normIncoming.consumption || normLocal.consumption,
    lastModified: Math.max(normLocal.lastModified || 0, normIncoming.lastModified || 0, Date.now()),
    isCleaned: normIncoming.isCleaned ?? normLocal.isCleaned,
  };

  // Determine if local had elements missing on incoming
  const hadExtraItems =
    mergedMovies.length > (normIncoming.movies?.length || 0) ||
    mergedRecipes.length > (normIncoming.recipes?.length || 0) ||
    mergedPantry.length > (normIncoming.pantry?.length || 0) ||
    mergedGroceries.length > (normIncoming.groceries?.length || 0) ||
    mergedCalendar.length > (normIncoming.calendarEvents?.length || 0) ||
    mergedDreams.length > (normIncoming.coupleDreams?.length || 0);

  return {
    merged,
    shouldUploadToServer: hadExtraItems,
  };
}
