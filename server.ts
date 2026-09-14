import express from 'express';
import http from 'http';
import path from 'path';
import fs from 'fs';
import { WebSocketServer, WebSocket } from 'ws';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import { initialAppData } from './src/data/initialData';
import { AppData } from './src/types';

const PORT = 3000;
const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: '/ws' });

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Persistent storage setup
const DATA_DIR = path.join(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'couple_data.json');
const BACKUP_FILE = path.join(DATA_DIR, 'couple_data_backup.json');
const SAFE_FILE = path.join(DATA_DIR, 'couple_data_safe.json');

function atomicWriteFile(filePath: string, content: string): void {
  try {
    const tmpPath = `${filePath}.tmp.${Date.now()}.${Math.random().toString(36).slice(2, 6)}`;
    fs.writeFileSync(tmpPath, content, 'utf-8');
    fs.renameSync(tmpPath, filePath);
  } catch (err) {
    // Fallback direct write if rename fails on some file systems
    fs.writeFileSync(filePath, content, 'utf-8');
  }
}

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

  // Check profile customizations - custom avatars
  const p1Av = data.profile?.partner1?.avatar;
  if (p1Av && p1Av !== '👩🏻' && p1Av !== '👩🏻‍🦰' && p1Av !== '👩‍🦰') return true;
  const p2Av = data.profile?.partner2?.avatar;
  if (p2Av && p2Av !== '👩🏽') return true;

  // Check profile customizations - PINs
  const sec = data.profile?.security;
  if (sec?.partner1Pin && sec.partner1Pin !== '1234') return true;
  if (sec?.partner2Pin && sec.partner2Pin !== '5678') return true;
  if (sec?.couplePasscode && sec.couplePasscode !== '2026') return true;

  // Anniversary note
  if (
    data.profile?.anniversaryNote &&
    data.profile.anniversaryNote !== 'Meu coração fez a melhor escolha. 💕' &&
    data.profile.anniversaryNote !== 'Cada dia ao seu lado é o melhor momento da minha vida. Te amo infinito! 💕'
  ) {
    return true;
  }

  // Custom categories
  if (data.customCategories?.calendar?.length > 0) return true;
  if (data.customCategories?.recipes?.length > 0) return true;
  if (data.customCategories?.movies?.length > 0) return true;

  return false;
}

export function mergeAppData(existing: AppData, incoming: AppData): AppData {
  if (!existing || !existing.profile) return incoming;
  if (!incoming || !incoming.profile) return existing;

  const existingHas = hasUserContent(existing);
  const incomingHas = hasUserContent(incoming);

  // Anti-Wipe rule: never let an empty/default payload wipe existing user content!
  if (existingHas && !incomingHas) {
    console.warn('[Anti-Wipe Server] Protegendo dados: payload recebido está vazio ou padrão, mantendo dados existentes.');
    return existing;
  }

  // Smart merge profiles - NEVER allow default avatar or PIN to overwrite customized ones!
  const isIncomingP1DefaultAvatar = !incoming.profile.partner1?.avatar || incoming.profile.partner1.avatar === '👩🏻';
  const isExistingP1CustomAvatar = existing.profile.partner1?.avatar && existing.profile.partner1.avatar !== '👩🏻';
  const p1Avatar = isIncomingP1DefaultAvatar && isExistingP1CustomAvatar
    ? existing.profile.partner1.avatar
    : (incoming.profile.partner1?.avatar || existing.profile.partner1?.avatar || '👩🏻');

  const isIncomingP2DefaultAvatar = !incoming.profile.partner2?.avatar || incoming.profile.partner2.avatar === '👩🏽';
  const isExistingP2CustomAvatar = existing.profile.partner2?.avatar && existing.profile.partner2.avatar !== '👩🏽';
  const p2Avatar = isIncomingP2DefaultAvatar && isExistingP2CustomAvatar
    ? existing.profile.partner2.avatar
    : (incoming.profile.partner2?.avatar || existing.profile.partner2?.avatar || '👩🏽');

  const p1 = {
    ...existing.profile.partner1,
    ...incoming.profile.partner1,
    avatar: p1Avatar,
    nickname: incoming.profile.partner1?.nickname || existing.profile.partner1?.nickname,
    city: incoming.profile.partner1?.city || existing.profile.partner1?.city,
  };
  const p2 = {
    ...existing.profile.partner2,
    ...incoming.profile.partner2,
    avatar: p2Avatar,
    nickname: incoming.profile.partner2?.nickname || existing.profile.partner2?.nickname,
    city: incoming.profile.partner2?.city || existing.profile.partner2?.city,
  };

  const p1Pin = incoming.profile.security?.partner1Pin?.trim()
    ? incoming.profile.security.partner1Pin.trim()
    : (existing.profile.security?.partner1Pin || '2604');

  const p2Pin = incoming.profile.security?.partner2Pin?.trim()
    ? incoming.profile.security.partner2Pin.trim()
    : (existing.profile.security?.partner2Pin || '5678');

  const couplePasscode = incoming.profile.security?.couplePasscode?.trim()
    ? incoming.profile.security.couplePasscode.trim()
    : (existing.profile.security?.couplePasscode || '2026');

  const security = {
    partner1Pin: p1Pin,
    partner2Pin: p2Pin,
    couplePasscode,
    requirePinOnEveryOpen: incoming.profile.security?.requirePinOnEveryOpen ?? existing.profile.security?.requirePinOnEveryOpen ?? false,
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

  return {
    ...existing,
    ...incoming,
    profile: {
      ...existing.profile,
      ...incoming.profile,
      partner1: p1,
      partner2: p2,
      security,
      coupleName: incoming.profile.coupleName || existing.profile.coupleName,
      anniversaryDate: incoming.profile.anniversaryDate || existing.profile.anniversaryDate,
      anniversaryNote: incoming.profile.anniversaryNote || existing.profile.anniversaryNote,
    },
    movies: mergeById(existing.movies, incoming.movies),
    recipes: mergeById(existing.recipes, incoming.recipes),
    pantry: mergeById(existing.pantry, incoming.pantry),
    groceries: mergeById(existing.groceries, incoming.groceries),
    weeklyMenu: incoming.weeklyMenu && incoming.weeklyMenu.length > 0 ? incoming.weeklyMenu : (existing.weeklyMenu || []),
    calendarEvents: mergeById(existing.calendarEvents || existing.calendar, incoming.calendarEvents || incoming.calendar),
    calendar: mergeById(existing.calendarEvents || existing.calendar, incoming.calendarEvents || incoming.calendar),
    trips: mergeById(existing.trips, incoming.trips),
    photos: mergeById(existing.photos, incoming.photos),
    homeDecor: mergeById(existing.homeDecor, incoming.homeDecor),
    homeTips: (incoming.homeTips && incoming.homeTips.length > 0) ? incoming.homeTips : (existing.homeTips || []),
    notifications: (incoming.notifications && incoming.notifications.length > 0) ? incoming.notifications : (existing.notifications || []),
    coupleDreams: mergeById(existing.coupleDreams, incoming.coupleDreams),
    coupleSoundtrack: {
      anthemSongId: incoming.coupleSoundtrack?.anthemSongId || existing.coupleSoundtrack?.anthemSongId,
      songs: mergeById(existing.coupleSoundtrack?.songs, incoming.coupleSoundtrack?.songs),
      playlists: mergeById(existing.coupleSoundtrack?.playlists, incoming.coupleSoundtrack?.playlists),
    },
    weatherNotes: {
      partner1Note: (() => {
        const n1 = existing.weatherNotes?.partner1Note;
        const n2 = incoming.weatherNotes?.partner1Note;
        if (!n1 && !n2) return undefined;
        if (!n1) return n2;
        if (!n2) return n1;
        const t1 = n1.updatedAt ? new Date(n1.updatedAt).getTime() : 0;
        const t2 = n2.updatedAt ? new Date(n2.updatedAt).getTime() : 0;
        return t2 >= t1 ? n2 : n1;
      })(),
      partner2Note: (() => {
        const n1 = existing.weatherNotes?.partner2Note;
        const n2 = incoming.weatherNotes?.partner2Note;
        if (!n1 && !n2) return undefined;
        if (!n1) return n2;
        if (!n2) return n1;
        const t1 = n1.updatedAt ? new Date(n1.updatedAt).getTime() : 0;
        const t2 = n2.updatedAt ? new Date(n2.updatedAt).getTime() : 0;
        return t2 >= t1 ? n2 : n1;
      })(),
    },
    customCategories: {
      recipes: Array.from(new Set([...(existing.customCategories?.recipes || []), ...(incoming.customCategories?.recipes || [])])),
      movies: Array.from(new Set([...(existing.customCategories?.movies || []), ...(incoming.customCategories?.movies || [])])),
      calendar: Array.from(new Set([...(existing.customCategories?.calendar || []), ...(incoming.customCategories?.calendar || [])])),
      homeTips: incoming.customCategories?.homeTips || existing.customCategories?.homeTips,
    },
    consumption: incoming.consumption || existing.consumption,
    lastModified: Math.max(existing.lastModified || 0, incoming.lastModified || 0, Date.now()),
  };
}

let currentData: AppData = initialAppData;

function loadStoredData(): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    const filesToTry = [DATA_FILE, BACKUP_FILE, SAFE_FILE];
    let loaded: AppData | null = null;

    for (const file of filesToTry) {
      if (fs.existsSync(file)) {
        try {
          const raw = fs.readFileSync(file, 'utf-8');
          if (raw && raw.trim().length > 0) {
            const parsed = JSON.parse(raw);
            if (parsed && parsed.profile) {
              loaded = parsed;
              console.log(`[Storage] Dados carregados com sucesso a partir de: ${path.basename(file)}`);
              break;
            }
          }
        } catch (e) {
          console.warn(`[Storage] Falha ao ler ${path.basename(file)}, tentando próximo backup...`, e);
        }
      }
    }

    if (loaded) {
      if (!Array.isArray(loaded.weeklyMenu)) loaded.weeklyMenu = initialAppData.weeklyMenu;
      if (!Array.isArray(loaded.calendarEvents)) loaded.calendarEvents = loaded.calendar || initialAppData.calendarEvents;
      loaded.calendar = loaded.calendarEvents;
      loaded.homeTips = Array.isArray(loaded.homeTips) ? loaded.homeTips : [];
      currentData = loaded;
      saveData(currentData);
      return;
    }

    // Only if absolutely no file exists anywhere
    console.log('[Storage] Nenhum dado prévio encontrado. Inicializando base.');
    atomicWriteFile(DATA_FILE, JSON.stringify(initialAppData, null, 2));
  } catch (err) {
    console.error('[Storage] Erro grave ao carregar dados:', err);
  }
}

function saveData(data: AppData): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    const jsonStr = JSON.stringify(data, null, 2);
    atomicWriteFile(DATA_FILE, jsonStr);

    // Create persistent backup copies whenever there is user content or deliberate clean
    if (hasUserContent(data)) {
      atomicWriteFile(BACKUP_FILE, jsonStr);
      atomicWriteFile(SAFE_FILE, jsonStr);
    }
  } catch (err) {
    console.error('[Storage] Erro ao salvar dados:', err);
  }
}

loadStoredData();

// WebSocket real-time connection handler
wss.on('connection', (ws: WebSocket) => {
  // Send current state on connection
  ws.send(JSON.stringify({ type: 'init', payload: currentData, data: currentData }));

  ws.on('message', (messageRaw: string) => {
    try {
      const parsed = JSON.parse(messageRaw.toString());
      const incoming = parsed.payload || parsed.data;
      if (parsed.type === 'update_all' && incoming) {
        currentData = mergeAppData(currentData, incoming);
        saveData(currentData);
        broadcast({ type: 'sync_data', payload: currentData, data: currentData }, ws);
      } else if (parsed.type === 'notification' && incoming) {
        currentData.notifications = [incoming, ...currentData.notifications];
        saveData(currentData);
        broadcast({ type: 'new_notification', payload: incoming, data: incoming });
      }
    } catch (e) {
      console.error('Erro no processamento do WebSocket:', e);
    }
  });
});

function broadcast(data: any, excludeWs?: WebSocket) {
  const str = JSON.stringify(data);
  wss.clients.forEach((client) => {
    if (client !== excludeWs && client.readyState === WebSocket.OPEN) {
      client.send(str);
    }
  });
}

// Weather Cache for João Pessoa & Porto Alegre
let weatherCache: {
  timestamp: number;
  data: any;
} | null = null;

app.get('/api/weather', async (_req, res) => {
  const now = Date.now();
  // 10 minute cache
  if (weatherCache && now - weatherCache.timestamp < 10 * 60 * 1000) {
    return res.json(weatherCache.data);
  }

  try {
    const url = 'https://api.open-meteo.com/v1/forecast?latitude=-7.115,-30.0346&longitude=-34.863,-51.2177&current=temperature_2m,apparent_temperature,relative_humidity_2m,weather_code,is_day&timezone=America/Sao_Paulo';
    const response = await fetch(url);
    if (!response.ok) throw new Error('Open-Meteo error: ' + response.statusText);
    const json = await response.json();

    if (Array.isArray(json) && json.length >= 2) {
      const jp = json[0]?.current || {};
      const poa = json[1]?.current || {};

      const weatherResult = {
        joaoPessoa: {
          temp: Math.round(jp.temperature_2m ?? 28),
          apparentTemp: Math.round(jp.apparent_temperature ?? 30),
          humidity: jp.relative_humidity_2m ?? 70,
          weatherCode: jp.weather_code ?? 1,
          isDay: jp.is_day ?? 1,
          city: 'João Pessoa - PB',
          updatedAt: new Date().toISOString(),
        },
        portoAlegre: {
          temp: Math.round(poa.temperature_2m ?? 18),
          apparentTemp: Math.round(poa.apparent_temperature ?? 18),
          humidity: poa.relative_humidity_2m ?? 85,
          weatherCode: poa.weather_code ?? 1,
          isDay: poa.is_day ?? 1,
          city: 'Porto Alegre - RS',
          updatedAt: new Date().toISOString(),
        },
      };

      weatherCache = { timestamp: now, data: weatherResult };
      return res.json(weatherResult);
    }
    throw new Error('Formato inesperado da API de clima');
  } catch (err: any) {
    console.warn('Falha ao obter clima Open-Meteo, usando dados padrão:', err.message);
    // Fallback se estiver offline ou em caso de erro na requisição externa
    const fallbackResult = weatherCache?.data || {
      joaoPessoa: {
        temp: 28,
        apparentTemp: 31,
        humidity: 72,
        weatherCode: 1,
        isDay: 1,
        city: 'João Pessoa - PB',
        updatedAt: new Date().toISOString(),
      },
      portoAlegre: {
        temp: 18,
        apparentTemp: 18,
        humidity: 80,
        weatherCode: 2,
        isDay: 1,
        city: 'Porto Alegre - RS',
        updatedAt: new Date().toISOString(),
      },
    };
    return res.json(fallbackResult);
  }
});

// Endpoint to generate romantic & caring weather notes with Gemini AI
app.post('/api/weather-ai-note', async (req, res) => {
  try {
    const {
      senderName,
      targetPartnerName,
      targetCity,
      temp,
      weatherDesc,
      userHint,
    } = req.body || {};

    const ai = getAI();
    if (!ai) {
      const fallbacks = [
        `Amor, tá ${temp || 20}°C em ${targetCity || 'aí'} hoje! Se cuida muito e não esquece de beber água, meu bem 💕`,
        `Passando pra te mandar um beijo quentinho nesse clima de ${temp || 20}°C! Te amo infinito, minha linda 💖`,
        `Meu bem, se agasalha direitinho se estiver friozinho aí em ${targetCity || 'sua cidade'}! Meu coração tá juntinho do seu 💌`,
        `Queria tá de conchinha com você hoje com esse tempo! Te amo demais, meu amor ✨`,
      ];
      const randomFallback = fallbacks[Math.floor(Math.random() * fallbacks.length)];
      return res.json({ note: randomFallback, source: 'fallback' });
    }

    const prompt = `Você é uma assistente do casal Camilla e Cassi (um relacionamento lésbico carinhoso, doce e apaixonado).
A parceira ${senderName || 'Camilla'} quer deixar um recadinho curto, carinhoso, espontâneo e afetuoso para sua parceira ${targetPartnerName || 'Cassi'}.
A parceira está em ${targetCity || 'Porto Alegre'}, onde a temperatura atual é ${temp || 20}°C e a condição do tempo é "${weatherDesc || 'agradável'}".
${userHint ? `A parceira deu essa ideia/toque adicional: "${userHint}".` : ''}

Instruções:
- Escreva APENAS o recadinho direto (1 ou no máximo 2 frases curtas).
- Use tom natural, doce, apaixonado, com emojis fofos (como 💕, ☕, 🧣, ☔, 💖, ✨).
- Faça referência ao clima da cidade dela de forma acolhedora (ex: se proteger da chuva/frio, ou aproveitar o sol e beber água, desejar um bom dia, dizer que queria estar de conchinha).
- Não use aspas e não acrescente explicações, apenas a mensagem final.`;

    const aiRes = await callGeminiWithRetry(ai, 'gemini-2.5-flash', {
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
    });

    const note = aiRes.text?.trim() || `Amor, se cuida muito nesse tempinho em ${targetCity || 'aí'}! Te amo infinito 💕`;
    return res.json({ note, source: 'gemini' });
  } catch (err: any) {
    console.error('Erro ao gerar recadinho de clima com IA:', err);
    return res.json({
      note: 'Amor, passando pra te mandar um abraço bem quentinho hoje e lembrar o quanto te amo! 💕',
      source: 'fallback',
    });
  }
});

// REST APIs
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

app.get('/api/data', (_req, res) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  try {
    if (fs.existsSync(DATA_FILE)) {
      const diskContent = fs.readFileSync(DATA_FILE, 'utf-8');
      if (diskContent) {
        const parsed = JSON.parse(diskContent);
        if (parsed && parsed.profile) {
          currentData = parsed;
        }
      }
    }
  } catch (e) {
    console.warn('Error reading DATA_FILE in /api/data:', e);
  }
  res.json(currentData);
});

app.post('/api/data', (req, res) => {
  try {
    const updated = req.body;
    if (updated && updated.profile) {
      if (!updated.lastModified) {
        updated.lastModified = Date.now();
      }
      currentData = mergeAppData(currentData, updated);
      saveData(currentData);
      broadcast({ type: 'sync_data', payload: currentData, data: currentData });
      res.json({ success: true, lastModified: currentData.lastModified, data: currentData });
    } else {
      res.status(400).json({ error: 'Dados inválidos' });
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Explicit full restore endpoint (for user backup file restore)
app.post('/api/restore', (req, res) => {
  try {
    const restored = req.body;
    if (restored && restored.profile) {
      restored.lastModified = Date.now();
      currentData = restored;
      saveData(currentData);
      broadcast({ type: 'sync_data', payload: currentData, data: currentData });
      res.json({ success: true, lastModified: currentData.lastModified });
    } else {
      res.status(400).json({ error: 'Arquivo de restauração inválido' });
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Dedicated endpoint to wipe demo data and start clean
app.post('/api/reset', (req, res) => {
  try {
    const profile = req.body?.profile || currentData.profile;
    const currentMonthKey = new Date().toISOString().slice(0, 7);
    const cleanData: AppData = {
      profile,
      movies: [],
      recipes: [],
      pantry: [],
      groceries: [],
      weeklyMenu: [],
      calendarEvents: [],
      calendar: [],
      trips: [],
      photos: [],
      homeDecor: [],
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
        billAuthors: {
          rent: 'partner1',
          electricity: 'partner2',
          water: 'partner1',
          internet: 'partner2',
          creditCard: 'partner1',
        },
        billPaidBy: {},
        billDueDates: {
          rent: '10',
          electricity: '15',
          water: '20',
          internet: '25',
          creditCard: '05',
        },
        customExpenses: [],
        monthlyHistory: [],
      },
      lastModified: Date.now(),
      isCleaned: true,
    };

    currentData = cleanData;
    saveData(currentData);
    broadcast({ type: 'sync_data', payload: currentData, data: currentData });
    res.json({ success: true, data: currentData });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Lazy Gemini API initialization & resilient executor
let aiClient: GoogleGenAI | null = null;
function getAI(): GoogleGenAI | null {
  if (!aiClient && process.env.GEMINI_API_KEY) {
    aiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

// Resilient Gemini executor that retries on transient 503 / 429 errors and falls back to gemini-flash-latest
async function callGeminiWithRetry(
  ai: GoogleGenAI,
  primaryModel: string,
  params: any,
  retries: number = 2
): Promise<any> {
  let lastError: any = null;
  const modelsToTry = [primaryModel, 'gemini-flash-latest'];

  for (const model of modelsToTry) {
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const res = await ai.models.generateContent({
          ...params,
          model,
        });
        return res;
      } catch (err: any) {
        lastError = err;
        const errMsg = err?.message || String(err);
        const isUnavailable =
          errMsg.includes('503') ||
          errMsg.includes('UNAVAILABLE') ||
          errMsg.includes('high demand') ||
          errMsg.includes('overloaded') ||
          errMsg.includes('429');

        if (isUnavailable && attempt < retries) {
          // Wait with exponential backoff before retrying
          await new Promise((resolve) => setTimeout(resolve, 600 * (attempt + 1)));
          continue;
        }
        break;
      }
    }
  }

  throw lastError;
}

function generateFallbackRecipe(url?: string, prompt?: string) {
  const cleanName =
    (prompt || url || 'Receita Especial a Dois')
      .replace(/https?:\/\/[^\s]+/g, '')
      .trim() || 'Prato Especial do Casal';

  return {
    title: cleanName,
    description: 'Receita deliciosa e equilibrada especialmente para 2 pessoas.',
    prepTime: '15 min',
    cookTime: '25 min',
    servings: '2 pessoas',
    difficulty: 'Fácil',
    dietaryTags: ['Jantar a Dois', 'Conforto', 'Prático'],
    sourceUrl: url || '',
    ingredients: [
      { name: 'Ingrediente principal (frango, massa ou legumes)', amount: '350g' },
      { name: 'Azeite de oliva extra virgem', amount: '2 colheres (sopa)' },
      { name: 'Alho e cebola picadinhos', amount: 'a gosto' },
      { name: 'Queijo parmesão ou creme', amount: '100g' },
      { name: 'Ervas frescas aromáticas (manjericão ou alecrim)', amount: 'a gosto' },
      { name: 'Sal e pimenta-do-reino', amount: 'a gosto' },
    ],
    instructions: [
      'Separe todos os ingredientes na bancada com antecedência (mise en place).',
      'Em uma panela ou frigideira em fogo médio, aqueça o azeite e doure o alho e a cebola.',
      'Adicione o ingrediente principal e refogue ou grelhe até dourar por completo.',
      'Acrescente o molho ou queijo para criar uma textura aveludada e envolvente.',
      'Acerte o sal, polvilhe ervas frescas e sirva imediatamente para aproveitarem juntos!',
    ],
  };
}

function generateFallbackMenu(itemsList: { name: string; info: string }[]): any[] {
  const pantryNames = itemsList.map((i) => i.name).filter(Boolean);

  const recipesBank = [
    {
      name: 'Risoto Cremoso com Toque de Queijo e Ervas',
      matches: ['Arroz', 'Arroz Arbóreo', 'Queijo', 'Parmesão', 'Manteiga'],
      day: 'Segunda-feira',
      type: 'jantar',
      needed: ['Caldo de legumes', 'Vinho branco suave'],
      reason: 'Aproveita o queijo e arroz da despensa para um início de semana acolhedor.',
    },
    {
      name: 'Frango Dourado Suculento com Batatas Rústicas',
      matches: ['Frango', 'Peito de Frango', 'Azeite', 'Batata', 'Alecrim'],
      day: 'Terça-feira',
      type: 'almoco',
      needed: ['Salada de folhas verdes'],
      reason: 'Rico em proteínas, saudável e super rápido de preparar.',
    },
    {
      name: 'Massa Italiana com Molho de Tomates Confitados',
      matches: ['Macarrão', 'Massa', 'Molho de Tomate', 'Tomate', 'Azeite'],
      day: 'Quarta-feira',
      type: 'jantar',
      needed: ['Folhas de manjericão fresco'],
      reason: 'Clássico romântico irresistível pronto em menos de 20 minutos.',
    },
    {
      name: 'Omelete Cremosa de Forno com Queijo e Tomatinhos',
      matches: ['Ovos', 'Ovo', 'Queijo', 'Tomate', 'Cebola'],
      day: 'Quinta-feira',
      type: 'almoco',
      needed: ['Torradas crocantes'],
      reason: 'Prático e aproveita os ovos e queijo frescos da despensa com zero desperdício.',
    },
    {
      name: 'Noite de Fondue ou Tábua de Petiscos Quentes a Dois',
      matches: ['Queijo', 'Pão', 'Batata', 'Vinho'],
      day: 'Sexta-feira',
      type: 'jantar',
      needed: ['Frutas da estação (uvas, morango)'],
      reason: 'Perfeito para celebrar a chegada do fim de semana com velas e boa conversa.',
    },
    {
      name: 'Escondidinho Dourado com Crosta Crocante',
      matches: ['Batata', 'Carne', 'Frango', 'Manteiga', 'Leite'],
      day: 'Sábado',
      type: 'almoco',
      needed: ['Queijo para gratinar'],
      reason: 'Comidinha caseira com afeto para um sábado preguiçoso.',
    },
    {
      name: 'Panquecas Fofinhas com Iogurte e Mel',
      matches: ['Farinha', 'Leite', 'Ovos', 'Iogurte', 'Mel'],
      day: 'Domingo',
      type: 'almoco',
      needed: ['Frutas frescas para acompanhar'],
      reason: 'Brunch descontraído de domingo para curtir juntas sem pressa.',
    },
  ];

  return recipesBank.map((item, idx) => {
    const used = item.matches.filter((m) =>
      pantryNames.some((p) => p.toLowerCase().includes(m.toLowerCase()))
    );
    const actualUsed =
      used.length > 0
        ? used
        : [pantryNames[idx % Math.max(1, pantryNames.length)] || 'Itens básicos da despensa'];

    return {
      dishName: item.name,
      mealName: item.name,
      dayOfWeek: item.day,
      daySuggestion: `${item.day} (${item.type === 'almoco' ? 'Almoço' : 'Jantar'})`,
      mealType: item.type,
      usedPantry: actualUsed,
      neededGroceries: item.needed,
      notes: `Aproveita ${actualUsed.join(', ')}. ${item.reason}`,
      reason: item.reason,
    };
  });
}

// Recipe extraction endpoint via Gemini with resilient retry & fallback
app.post('/api/recipes/extract', async (req, res) => {
  const { url, prompt } = req.body;
  const ai = getAI();

  if (!ai) {
    return res.json(generateFallbackRecipe(url, prompt));
  }

  const aiPrompt = `Você é um chef e assistente culinário especializado em receitas para casais.
O usuário quer salvar uma receita que viu na internet (TikTok, Instagram, site de culinária ou texto):
Entrada:
Link ou Descrição: "${url || ''}"
Observações/Nome: "${prompt || ''}"

Analise e estruture a receita completa em português, calibrada preferencialmente para 2 pessoas (casal).
Seja detalhado no modo de preparo passo a passo e nos ingredientes com quantidades exatas.
Identifique tags de restrição alimentar pertinentes (ex: 'Sem Glúten', 'Sem Lactose', 'Vegetariano', 'Vegano', 'Fit', 'Low Carb', 'Sobremesa', 'Rápido').`;

  try {
    const response = await callGeminiWithRetry(ai, 'gemini-3.8-flash', {
      contents: aiPrompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING, description: 'Título da receita' },
            description: { type: Type.STRING, description: 'Breve descrição apetitosa' },
            prepTime: { type: Type.STRING, description: 'Tempo de preparo ex: 15 min' },
            cookTime: { type: Type.STRING, description: 'Tempo de cozimento ex: 25 min' },
            servings: { type: Type.STRING, description: 'Rendimento, ex: 2 pessoas' },
            difficulty: { type: Type.STRING, description: 'Fácil, Médio ou Elaborado' },
            dietaryTags: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'Tags de restrição alimentar ou estilo',
            },
            ingredients: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  amount: { type: Type.STRING },
                },
                required: ['name', 'amount'],
              },
            },
            instructions: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'Passos detalhados de preparo em ordem',
            },
          },
          required: [
            'title',
            'description',
            'prepTime',
            'servings',
            'difficulty',
            'dietaryTags',
            'ingredients',
            'instructions',
          ],
        },
      },
    });

    const parsedJson = JSON.parse(response.text || '{}');
    parsedJson.sourceUrl = url || '';
    res.json(parsedJson);
  } catch (error: any) {
    console.warn('Gemini indisponível ou em alta demanda ao extrair receita. Usando gerador seguro:', error?.message);
    const fallback = generateFallbackRecipe(url, prompt);
    res.json(fallback);
  }
});

// Menu suggestions based on Pantry items with resilient retry & fallback
app.post('/api/ai/suggest-menu', async (req, res) => {
  const { pantryItems, preferences } = req.body;

  // Normalize pantryItems into structured format regardless of array of strings or objects
  const itemsList: { name: string; info: string }[] = (
    Array.isArray(pantryItems) ? pantryItems : []
  ).map((item) => {
    if (typeof item === 'string') {
      return { name: item, info: item };
    } else if (item && typeof item === 'object') {
      const name = item.name || 'Ingrediente';
      const detail = `${name}${
        item.quantity ? ` (${item.quantity} ${item.unit || ''})` : ''
      }${item.expirationDate ? ` [validade: ${item.expirationDate}]` : ''}`;
      return { name, info: detail };
    }
    return { name: 'Item', info: 'Item' };
  });

  const ai = getAI();

  if (!ai) {
    return res.json({ suggestions: generateFallbackMenu(itemsList) });
  }

  const promptText = `Você é um chef consultor de casais focado em cozinha prática, romântica e com desperdício zero.
Itens atuais disponíveis na despensa do casal:
${
  itemsList.length > 0
    ? itemsList.map((i) => `- ${i.info}`).join('\n')
    : 'Nenhum item cadastrado ainda (sugira opções versáteis para casal)'
}

Preferências / restrições: ${preferences || 'Nenhuma restrição específica'}

Gere de 5 a 7 sugestões de refeições para a semana (variando entre dias da semana, almoço e jantar), priorizando itens que estão próximos do vencimento ou já estocados, para economizar no mercado.`;

  try {
    const response = await callGeminiWithRetry(ai, 'gemini-3.8-flash', {
      contents: promptText,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            suggestions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  dishName: { type: Type.STRING, description: 'Nome apetitoso do prato' },
                  mealName: { type: Type.STRING, description: 'Nome apetitoso do prato' },
                  dayOfWeek: {
                    type: Type.STRING,
                    description: 'Dia da semana (ex: Segunda-feira, Terça-feira, etc)',
                  },
                  daySuggestion: {
                    type: Type.STRING,
                    description: 'Sugestão amigável do dia',
                  },
                  mealType: {
                    type: Type.STRING,
                    description: 'almoco ou jantar',
                  },
                  usedPantry: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: 'Itens da despensa aproveitados',
                  },
                  neededGroceries: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: 'Itens adicionais para comprar',
                  },
                  notes: {
                    type: Type.STRING,
                    description: 'Dica do chef / razão romântica de preparo',
                  },
                  reason: {
                    type: Type.STRING,
                    description: 'Razão do prato',
                  },
                },
                required: ['dishName', 'dayOfWeek', 'mealType', 'usedPantry', 'neededGroceries', 'notes'],
              },
            },
          },
          required: ['suggestions'],
        },
      },
    });

    const result = JSON.parse(response.text || '{}');
    if (Array.isArray(result.suggestions) && result.suggestions.length > 0) {
      return res.json(result);
    }
    // Fallback if empty array returned
    res.json({ suggestions: generateFallbackMenu(itemsList) });
  } catch (error: any) {
    console.warn(
      'Gemini temporariamente em alta demanda (503) ou erro no cardápio. Usando sugestão personalizada da despensa:',
      error?.message
    );
    // Graceful smart fallback ensuring 100% uptime
    res.json({ suggestions: generateFallbackMenu(itemsList) });
  }
});

// Trip Itinerary & Places AI Suggestion Helper
function generateFallbackTripPlan(destination: string, title?: string) {
  const dest = destination || 'Destino Romântico';
  const cleanDest = dest.trim();
  const mapsQuery = encodeURIComponent(cleanDest);

  return {
    placesToVisit: [
      {
        id: `wp-${Date.now()}-1`,
        name: `Mirante & Pôr do Sol de ${cleanDest}`,
        category: 'Romântico & Fotos',
        notes: 'Vista panorâmica perfeita para tirar fotos e brindar o amor no fim da tarde.',
        link: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent('mirante por do sol ' + cleanDest)}`,
        visited: false,
      },
      {
        id: `wp-${Date.now()}-2`,
        name: `Centro Histórico & Gastronômico de ${cleanDest}`,
        category: 'Passeio a Pé',
        notes: 'Ruas charmosas, cafés acolhedores e lojinhas de artesanato local.',
        link: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent('centro historico ' + cleanDest)}`,
        visited: false,
      },
      {
        id: `wp-${Date.now()}-3`,
        name: `Restaurante Intimista à Luz de Velas em ${cleanDest}`,
        category: 'Gastronomia Romântica',
        notes: 'Ambiente aconchegante para um jantar memorável a dois.',
        link: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent('restaurante romantico ' + cleanDest)}`,
        visited: false,
      },
      {
        id: `wp-${Date.now()}-4`,
        name: `Parque Natural ou Trilha Leve de ${cleanDest}`,
        category: 'Natureza & Relax',
        notes: 'Contato com a natureza, ar puro e momentos de paz a dois.',
        link: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent('parque natural ' + cleanDest)}`,
        visited: false,
      },
    ],
    itinerary: [
      {
        id: `it-${Date.now()}-1`,
        day: 1,
        title: `Chegada & Primeiro Brinde em ${cleanDest}`,
        activities: [
          'Viagem tranquila com playlist especial do casal',
          'Check-in na hospedagem e momento para relaxar',
          'Passeio inicial a pé para sentir a vibe do local',
          'Jantar leve de boas-vindas em bistrô aconchegante',
        ],
      },
      {
        id: `it-${Date.now()}-2`,
        day: 2,
        title: `Passeios Principais & Jantar Romântico`,
        activities: [
          'Café da manhã sem pressa juntinhos',
          'Visita aos principais cartões-postais e pontos turísticos',
          'Almoço com gastronomia típica regional',
          'Assistir ao pôr do sol no mirante abraçadinhos',
          'Noite especial: jantar romântico com fondue ou vinho',
        ],
      },
      {
        id: `it-${Date.now()}-3`,
        day: 3,
        title: `Compras de Lembrancinhas & Retorno com o Coração Cheio`,
        activities: [
          'Último café da manhã relaxante',
          'Comprar lembrancinhas e doces artesanais para levar para casa',
          'Despedida dos lugares favoritos',
          'Retorno seguro relembrando os melhores momentos',
        ],
      },
    ],
  };
}

// AI Endpoint for Trip Itinerary and Dream Places
app.post('/api/trips/suggest-itinerary', async (req, res) => {
  const { destination, title, daysCount } = req.body;
  const dest = (destination || title || 'Destino Romântico').trim();

  const ai = getAI();
  if (!ai) {
    return res.json(generateFallbackTripPlan(dest, title));
  }

  const promptText = `Você é um guia turístico especialista em viagens românticas inesquecíveis para casais.
Destino: "${dest}"
Título da viagem: "${title || dest}"
Dias aproximados: ${daysCount || 3} dias.

Gere:
1) Uma lista de 4 a 6 "Lugares dos Sonhos Para Visitar" em "${dest}". Para cada lugar, inclua nome real exato, categoria (Natureza, Gastronomia, Romântico, Ponto Turístico, etc), uma nota de por que é imperdível para o casal, e o link de busca no Google Maps com a URL padrão:
https://www.google.com/maps/search/?api=1&query={NOME_DO_LUGAR_CODIFICADO}+{DESTINO_CODIFICADO}

2) Um roteiro diário ("itinerary") de 2 a 4 dias, com título romântico e uma lista de 3 a 5 atividades por dia pensadas para ritmo de casal (sem correria, com momentos para fotos, pausas para café e noites acolhedoras).`;

  try {
    const response = await callGeminiWithRetry(ai, 'gemini-3.8-flash', {
      contents: promptText,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            placesToVisit: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING, description: 'Nome do local ou atração' },
                  category: { type: Type.STRING, description: 'Categoria do local' },
                  notes: { type: Type.STRING, description: 'Dica romântica / por que visitar' },
                  link: { type: Type.STRING, description: 'Link do Google Maps para o local' },
                },
                required: ['name', 'category', 'notes', 'link'],
              },
            },
            itinerary: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  day: { type: Type.NUMBER, description: 'Número do dia' },
                  title: { type: Type.STRING, description: 'Título romântico do dia' },
                  activities: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: 'Atividades sugeridas para o dia',
                  },
                },
                required: ['day', 'title', 'activities'],
              },
            },
          },
          required: ['placesToVisit', 'itinerary'],
        },
      },
    });

    const result = JSON.parse(response.text || '{}');
    if (Array.isArray(result.placesToVisit) && result.placesToVisit.length > 0) {
      // Ensure all places have IDs and visited flag
      const formattedPlaces = result.placesToVisit.map((p: any, idx: number) => ({
        id: `wp-${Date.now()}-${idx}`,
        name: p.name,
        category: p.category || 'Passeio a Dois',
        notes: p.notes || '',
        link:
          p.link ||
          `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(p.name + ' ' + dest)}`,
        visited: false,
      }));

      const formattedItinerary = (result.itinerary || []).map((it: any, idx: number) => ({
        id: `it-${Date.now()}-${idx}`,
        day: it.day || idx + 1,
        title: it.title || `Dia ${idx + 1}`,
        activities: Array.isArray(it.activities) ? it.activities : [],
      }));

      return res.json({
        placesToVisit: formattedPlaces,
        itinerary: formattedItinerary,
      });
    }

    res.json(generateFallbackTripPlan(dest, title));
  } catch (error: any) {
    console.warn('Erro ao sugerir roteiro com IA. Usando fallback:', error?.message);
    res.json(generateFallbackTripPlan(dest, title));
  }
});

// AI Multimodal Product & Expiration Date Scanner
app.post('/api/ai/scan-product', async (req, res) => {
  try {
    const { imageBase64, mimeType } = req.body;
    if (!imageBase64) {
      return res.status(400).json({ error: 'Imagem não fornecida' });
    }

    const ai = getAI();
    if (!ai) {
      return res.json({
        name: '',
        category: 'Despensa & Secos',
        expirationDate: null,
        quantity: 1,
        unit: 'un',
        notes: 'API Gemini não configurada',
      });
    }

    // Clean base64 data URL if present
    const cleanBase64 = imageBase64.replace(/^data:image\/[a-zA-Z0-9+]+;base64,/, '');
    const actualMime = mimeType || (imageBase64.startsWith('data:image/png') ? 'image/png' : 'image/jpeg');

    const promptText = `Você é um assistente especialista em despensa de casa e supermercado.
Analise com extrema atenção a foto desta embalagem / produto e a data de validade impressa nela (geralmente carimbada na tampa, verso, topo ou fundo da embalagem).

Extraia e retorne estritamente em formato JSON:
1. "name": Nome claro e comercial do produto em português (ex: "Iogurte Natural Batavo", "Queijo Minas Padrão", "Leite Integral Piracanjuba", "Molho de Tomate Pomarola", "Pão de Forma Pullman").
2. "category": A categoria mais adequada entre:
   - "Laticínios & Frios"
   - "Carnes & Aves"
   - "Frutas & Hortifrúti"
   - "Despensa & Secos"
   - "Bebidas"
   - "Padaria & Doces"
   - "Higiene & Limpeza"
   - "Outros"
3. "expirationDate": A data de validade (VAL / VENC / FAB + validade) identificada no formato ISO "AAAA-MM-DD" (por exemplo, "2026-10-15").
   - Se estiver em formato brasileiro (ex: 28/09/2026 ou 28.09.26), converta para AAAA-MM-DD.
   - Se constar apenas mês/ano (ex: NOV/26), use o último dia daquele mês (ex: 2026-11-30).
   - Se não houver data legível na foto, retorne null.
4. "quantity": Número da quantidade estimada na embalagem (geralmente 1).
5. "unit": Uma das unidades: "un", "kg", "g", "L", "ml", "pct", "lata".
6. "notes": Detalhes breves ou marca identificada.`;

    const response = await callGeminiWithRetry(ai, 'gemini-3.8-flash', {
      contents: [
        {
          role: 'user',
          parts: [
            {
              inlineData: {
                data: cleanBase64,
                mimeType: actualMime,
              },
            },
            {
              text: promptText,
            },
          ],
        },
      ],
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING, description: 'Nome do produto identificado' },
            category: { type: Type.STRING, description: 'Categoria do produto na despensa' },
            expirationDate: { type: Type.STRING, description: 'Data de validade em AAAA-MM-DD ou null', nullable: true },
            quantity: { type: Type.NUMBER, description: 'Quantidade numérica' },
            unit: { type: Type.STRING, description: 'Unidade de medida' },
            notes: { type: Type.STRING, description: 'Observações sobre o produto' },
          },
          required: ['name', 'category', 'unit'],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    return res.json(parsed);
  } catch (error: any) {
    console.warn('Erro ao escanear produto com Gemini Vision:', error?.message);
    res.status(500).json({
      error: 'Não foi possível escanear o produto automaticamente',
      details: error?.message,
    });
  }
});

// AI Home Tip Generator endpoint
app.post('/api/ai/home-tip', async (req, res) => {
  try {
    const { question, room } = req.body;
    if (!question || typeof question !== 'string' || !question.trim()) {
      return res.status(400).json({ error: 'Pergunta obrigatória' });
    }

    const ai = getAI();
    if (!ai) {
      return res.status(503).json({ error: 'Serviço de IA não inicializado. Verifique a chave da API.' });
    }

    const prompt = `Você é um especialista gentil, acolhedor e altamente experiente em organização, limpeza e cuidados com o lar para casais apaixonados vivendo juntos no aplicativo 'Nosso Canto'.
Responda à seguinte dúvida doméstica com uma solução prática, testada, segura e rápida:
Pergunta do casal: "${question.trim()}"
${room ? `Cômodo ou contexto: "${room}"` : ''}

Requisitos da resposta:
1. "title": Um título claro, amigável e direto (ex: "Como Tirar Mancha de Vinho com Bicarbonato e Vinagre").
2. "category": Deve ser EXATAMENTE uma das opções: "limpeza", "plantas", "lavanderia", "organizacao", "manutencao", "economia".
3. "room": O cômodo mais indicado (ex: "Cozinha", "Sala", "Lavanderia", "Quarto", "Banheiro", "Casa Toda").
4. "description": Instruções passo a passo claras e fáceis. Prefira ingredientes ou truques caseiros e acessíveis (bicarbonato, vinagre, água morna, sabão neutro, álcool, etc.).
5. "goldenTip": "O Pulo do Gato / Dica de Ouro" - um segredinho prático essencial para não errar ou obter o melhor resultado.
6. "difficulty": "Fácil" ou "Médio".`;

    const response = await callGeminiWithRetry(ai, 'gemini-3.8-flash', {
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            category: {
              type: Type.STRING,
              enum: ['limpeza', 'plantas', 'lavanderia', 'organizacao', 'manutencao', 'economia'],
            },
            room: { type: Type.STRING },
            description: { type: Type.STRING },
            goldenTip: { type: Type.STRING },
            difficulty: { type: Type.STRING, enum: ['Fácil', 'Médio'] },
          },
          required: ['title', 'category', 'room', 'description', 'goldenTip'],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    return res.json(parsed);
  } catch (error: any) {
    console.warn('Erro ao gerar dica com Gemini:', error?.message);
    res.status(500).json({
      error: 'Não foi possível gerar a dica no momento',
      details: error?.message,
    });
  }
});

// Full General AI Chat Endpoint (Lumina AI / Assistente Inteligente)
app.post('/api/ai/chat', async (req, res) => {
  try {
    const { message, history, partnerName } = req.body;
    if (!message || typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({ error: 'Mensagem obrigatória' });
    }

    const ai = getAI();
    if (!ai) {
      return res.json({
        reply: `Oi ${partnerName || 'querida'}! Estou no modo offline no momento. Assim que a conexão de IA for restaurada, posso responder com todos os detalhes!`,
      });
    }

    const systemInstruction = `Você é Lumina AI, a inteligência artificial pessoal e assistente inteligente oficial do aplicativo 'Nosso Canto', desenvolvido com muito carinho para Camilla (Milla) e Cassi.
Você tem uma personalidade brilhante, acolhedora, sagaz, prestativa e bem informada — no nível dos melhores assistentes do mundo (como Gemini, ChatGPT, Claude).

Seus superpoderes e diretrizes:
1. Você responde a QUALQUER pergunta do mundo: conhecimento geral, cultura pop, filmes/séries, ciência, tecnologia, programação, culinária, saúde e bem-estar, finanças e conselhos do dia a dia.
2. Seu tom é inteligente, claro, respeitoso, bem formatado e amigável.
3. Você sabe que está dentro do app do casal Camilla e Cassi. Quando conveniente, use um tom acolhedor e carinhoso para com elas, mas responda à pergunta com precisão técnica e profundidade quando solicitado.
4. Responda em Português do Brasil de forma fluida, usando formatação limpa (títulos com Markdown, listas com bullet points, tabelas quando útil, e destaques em negrito).`;

    // Format conversation history for Gemini contents
    const contents: any[] = [];
    if (Array.isArray(history) && history.length > 0) {
      for (const item of history.slice(-10)) {
        if (item.sender === 'user') {
          contents.push({ role: 'user', parts: [{ text: item.text }] });
        } else if (item.sender === 'ai' || item.sender === 'model') {
          contents.push({ role: 'model', parts: [{ text: item.text }] });
        }
      }
    }

    contents.push({ role: 'user', parts: [{ text: message.trim() }] });

    const response = await callGeminiWithRetry(ai, 'gemini-3.8-flash', {
      contents,
      config: {
        systemInstruction,
        temperature: 0.7,
      },
    });

    const reply = response.text?.trim() || 'Desculpe, não consegui formular a resposta agora. Pode perguntar de novo?';
    return res.json({ reply });
  } catch (err: any) {
    console.error('Erro no /api/ai/chat:', err);
    return res.status(500).json({
      error: 'Erro ao processar mensagem com a IA',
      details: err?.message,
    });
  }
});

// Vite & Static Asset Handling
async function start() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    // Set headers so html file is never cached aggressively by mobile browsers
    app.use(express.static(distPath, {
      setHeaders: (res, filePath) => {
        if (filePath.endsWith('.html')) {
          res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
          res.setHeader('Pragma', 'no-cache');
          res.setHeader('Expires', '0');
        }
      }
    }));
    app.get('*', (_req, res) => {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Servidor Nós Dois rodando na porta ${PORT}`);
  });
}

start();
