import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { AppData } from '../types';

// Initialize Firebase App
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Firestore targeting the specific database if configured
export const db = firebaseConfig.firestoreDatabaseId
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

const COUPLE_DOC_PATH = ['coupleData', 'main'] as const;

/**
 * Loads the current couple app data directly from Cloud Firestore.
 */
export async function getFirebaseAppData(): Promise<AppData | null> {
  try {
    const docRef = doc(db, COUPLE_DOC_PATH[0], COUPLE_DOC_PATH[1]);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const data = snap.data();
      if (data && data.payload) {
        return data.payload as AppData;
      }
    }
    return null;
  } catch (error) {
    console.warn('[Firebase] Erro ao carregar dados do Firestore:', error);
    return null;
  }
}

/**
 * Saves or updates couple app data into Cloud Firestore.
 */
export async function saveFirebaseAppData(data: AppData): Promise<boolean> {
  try {
    const docRef = doc(db, COUPLE_DOC_PATH[0], COUPLE_DOC_PATH[1]);
    await setDoc(
      docRef,
      {
        payload: data,
        lastModified: data.lastModified || Date.now(),
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
    return true;
  } catch (error) {
    console.warn('[Firebase] Erro ao salvar dados no Firestore:', error);
    return false;
  }
}

/**
 * Subscribes to real-time updates from Cloud Firestore.
 */
export function subscribeFirebaseAppData(
  onData: (data: AppData) => void,
  onError?: (err: any) => void
): () => void {
  try {
    const docRef = doc(db, COUPLE_DOC_PATH[0], COUPLE_DOC_PATH[1]);
    const unsubscribe = onSnapshot(
      docRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const docData = snapshot.data();
          if (docData && docData.payload) {
            onData(docData.payload as AppData);
          }
        }
      },
      (error) => {
        console.warn('[Firebase] Snapshot error:', error);
        if (onError) onError(error);
      }
    );
    return unsubscribe;
  } catch (err) {
    console.warn('[Firebase] Subscrição falhou:', err);
    return () => {};
  }
}
