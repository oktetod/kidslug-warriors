// =================================================================
//  KIDSLUG WARRIORS v2 - FIREBASE MANAGER
//  Auth (Google + Anonymous) + Firestore auto-save every 30s
// =================================================================
import { initializeApp, type FirebaseApp }      from 'firebase/app';
import {
  getAuth, GoogleAuthProvider, signInWithPopup,
  signInAnonymously, onAuthStateChanged, signOut,
  type Auth, type User,
}                                               from 'firebase/auth';
import {
  getFirestore, doc, getDoc, setDoc, updateDoc,
  collection, getDocs, query, orderBy, limit,
  serverTimestamp, type Firestore,
}                                               from 'firebase/firestore';
import { type SaveData, writeSave }             from './SaveSystem.js';

// ---- Config from environment vars ---------------------------------
const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY             as string,
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN         as string,
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID          as string,
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET      as string,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID as string,
  appId:             import.meta.env.VITE_FIREBASE_APP_ID              as string,
};

// Guard: if env vars missing, Firebase features silently disabled
const FIREBASE_ENABLED = Boolean(
  firebaseConfig.apiKey &&
  firebaseConfig.projectId &&
  firebaseConfig.appId
);

if (!FIREBASE_ENABLED) {
  console.warn('[FirebaseManager] Env vars not set - Firebase disabled, guest-only mode');
}

export const ADMIN_UIDS: string[] = (import.meta.env.VITE_ADMIN_UIDS ?? '')
  .split(',')
  .map((s: string) => s.trim())
  .filter(Boolean);

// ---- Singleton Firebase instance ----------------------------------
let _app:  FirebaseApp | null = null;
let _auth: Auth        | null = null;
let _db:   Firestore   | null = null;

function getApp(): FirebaseApp {
  if (!_app) _app = initializeApp(firebaseConfig);
  return _app;
}
function getAuthInst(): Auth {
  if (!_auth) _auth = getAuth(getApp());
  return _auth;
}
function getDb(): Firestore {
  if (!_db) _db = getFirestore(getApp());
  return _db;
}

// ---- Auth ----------------------------------------------------------
export async function loginWithGoogle(): Promise<{ user: User | null; error: string | null }> {
  if (!FIREBASE_ENABLED) return { user: null, error: 'Firebase not configured. Set VITE_FIREBASE_* in Vercel env vars.' };
  try {
    const provider = new GoogleAuthProvider();
    const result   = await signInWithPopup(getAuthInst(), provider);
    return { user: result.user, error: null };
  } catch (err) {
    return { user: null, error: (err as Error).message };
  }
}

export async function loginAnonymous(): Promise<{ user: User | null; error: string | null }> {
  if (!FIREBASE_ENABLED) return { user: null, error: 'Firebase not configured' };
  try {
    const result = await signInAnonymously(getAuthInst());
    return { user: result.user, error: null };
  } catch (err) {
    return { user: null, error: (err as Error).message };
  }
}

export async function logoutUser(): Promise<void> {
  if (!FIREBASE_ENABLED) return;
  try { await signOut(getAuthInst()); } catch { /* ignore */ }
}

export function onAuthChange(cb: (user: User | null) => void): () => void {
  if (!FIREBASE_ENABLED) {
    // No Firebase config - immediately signal "no user"
    setTimeout(() => cb(null), 0);
    return () => { /* noop */ };
  }
  try {
    return onAuthStateChanged(getAuthInst(), cb);
  } catch (e) {
    console.warn('[FirebaseManager] onAuthChange failed:', e);
    setTimeout(() => cb(null), 0);
    return () => { /* noop */ };
  }
}

// ---- Firestore save / load ----------------------------------------
export async function loadFromFirebase(uid: string): Promise<SaveData | null> {
  if (!FIREBASE_ENABLED) return null;
  try {
    const ref  = doc(getDb(), 'players', uid);
    const snap = await getDoc(ref);
    if (snap.exists()) return (snap.data().saveData as SaveData) ?? null;
    return null;
  } catch {
    return null;
  }
}

export async function saveToFirebase(uid: string, saveData: SaveData): Promise<boolean> {
  if (!FIREBASE_ENABLED) return false;
  try {
    const ref = doc(getDb(), 'players', uid);
    await setDoc(ref, {
      saveData,
      lastSaved:          serverTimestamp(),
      uid,
      displayName:        saveData.player?.name ?? 'PEJUANG',
      level:              saveData.player?.level ?? 1,
      totalStagesCleared: saveData.player?.totalStagesCleared ?? 0,
    }, { merge: true });
    return true;
  } catch {
    return false;
  }
}

// ---- Auto-save manager (30-second interval) -----------------------
export class AutoSaveManager {
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private uid: string | null = null;
  private getSave: (() => SaveData) | null = null;

  start(uid: string, getSaveFn: () => SaveData): void {
    this.uid     = uid;
    this.getSave = getSaveFn;
    this.stop();
    this.intervalId = setInterval(() => this.flush(), 30_000);
  }

  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  async flush(): Promise<void> {
    if (!this.uid || !this.getSave) return;
    const save = this.getSave();
    writeSave(save);
    if (this.uid) await saveToFirebase(this.uid, save);
  }
}

// ---- GM helpers ----------------------------------------------------
export async function getAllPlayers(limitCount = 50): Promise<Array<Record<string, unknown>>> {
  try {
    const q    = query(collection(getDb(), 'players'), orderBy('level', 'desc'), limit(limitCount));
    const snap = await getDocs(q);
    return snap.docs.map((d: any) => ({ id: d.id, ...d.data() }));
  } catch { return []; }
}

export async function gmBanPlayer(uid: string, reason = ''): Promise<boolean> {
  try {
    await updateDoc(doc(getDb(), 'players', uid), {
      banned: true, banReason: reason, bannedAt: serverTimestamp(),
    });
    return true;
  } catch { return false; }
}

export async function getLeaderboard(limitCount = 20): Promise<Array<Record<string, unknown>>> {
  try {
    const q    = query(collection(getDb(), 'players'), orderBy('totalStagesCleared', 'desc'), limit(limitCount));
    const snap = await getDocs(q);
    return snap.docs.map((d: any, i: number) => ({ rank: i + 1, ...d.data() }));
  } catch { return []; }
}
