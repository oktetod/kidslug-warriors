import {
  doc, getDoc, setDoc, updateDoc, collection,
  query, orderBy, limit, getDocs, increment, serverTimestamp,
  arrayUnion, where,
} from 'firebase/firestore';
import { db, ADMIN_UIDS } from './config';
import type { PlayerData, LeaderboardEntry, WeaponId } from '../types';

// ── Player ─────────────────────────────────────────────────────
export async function getOrCreatePlayer(
  uid: string, displayName: string, email: string, photoURL: string,
): Promise<PlayerData> {
  const ref  = doc(db, 'users', uid);
  const snap = await getDoc(ref);
  if (snap.exists()) return snap.data() as PlayerData;

  const isGM: boolean = ADMIN_UIDS.includes(uid);
  const player: PlayerData = {
    uid, displayName, email, photoURL,
    coins: 50,
    ownedWeapons: ['pistol', 'grenade'],
    highScore: 0,
    stagesCleared: 0,
    totalKills: 0,
    isGM,
    isBanned: false,
    createdAt: Date.now(),
  };
  await setDoc(ref, player);
  return player;
}

export async function getPlayer(uid: string): Promise<PlayerData | null> {
  const snap = await getDoc(doc(db, 'users', uid));
  return snap.exists() ? (snap.data() as PlayerData) : null;
}

export async function updateCoins(uid: string, delta: number) {
  if (delta === 0) return;
  await updateDoc(doc(db, 'users', uid), { coins: increment(delta) });
}

export async function buyWeapon(uid: string, weaponId: WeaponId, price: number) {
  await updateDoc(doc(db, 'users', uid), {
    ownedWeapons: arrayUnion(weaponId),
    coins:        increment(-price),
  });
}

export async function saveScore(
  uid: string, score: number, stagesCleared: number, kills: number,
): Promise<void> {
  const ref  = doc(db, 'users', uid);
  const snap = await getDoc(ref);

  // FIX #10: null-safe check before accessing data
  if (!snap.exists()) return;
  const current = snap.data() as PlayerData;

  const updates: Record<string, unknown> = {
    totalKills: (current.totalKills || 0) + kills,
  };
  if (score > (current.highScore || 0))               updates.highScore     = score;
  if (stagesCleared > (current.stagesCleared || 0))   updates.stagesCleared = stagesCleared;

  await updateDoc(ref, updates);

  // Update leaderboard only if new high score
  if (score > (current.highScore || 0)) {
    await setDoc(doc(db, 'leaderboard', uid), {
      uid,
      displayName: current.displayName,
      photoURL:    current.photoURL || '',
      score,
      stagesCleared,
      timestamp:   serverTimestamp(),
    });
  }
}

// ── Leaderboard ────────────────────────────────────────────────
export async function getLeaderboard(top = 20): Promise<LeaderboardEntry[]> {
  const q    = query(collection(db, 'leaderboard'), orderBy('score', 'desc'), limit(top));
  const snap = await getDocs(q);
  return snap.docs.map(d => d.data() as LeaderboardEntry);
}

// ── GM Functions ───────────────────────────────────────────────
export async function gmAddCoins(
  gmUid: string, targetUid: string, amount: number, reason: string,
): Promise<void> {
  const gmSnap = await getDoc(doc(db, 'users', gmUid));
  if (!gmSnap.exists()) throw new Error('GM not found');
  const gmData = gmSnap.data() as PlayerData;
  if (!gmData.isGM && !ADMIN_UIDS.includes(gmUid)) throw new Error('Unauthorized');

  await updateDoc(doc(db, 'users', targetUid), { coins: increment(amount) });
  await setDoc(doc(collection(db, 'transactions')), {
    type: 'topup', gmUid, targetUid, amount, reason,
    timestamp: serverTimestamp(),
  });
}

export async function gmSetGM(gmUid: string, targetUid: string, isGM: boolean): Promise<void> {
  if (!ADMIN_UIDS.includes(gmUid)) throw new Error('Unauthorized: Only super admins can change GM status');
  await updateDoc(doc(db, 'users', targetUid), { isGM });
}

export async function gmBanUser(gmUid: string, targetUid: string, isBanned: boolean): Promise<void> {
  const gmSnap = await getDoc(doc(db, 'users', gmUid));
  if (!gmSnap.exists()) throw new Error('GM not found');
  const gmData = gmSnap.data() as PlayerData;
  if (!gmData.isGM && !ADMIN_UIDS.includes(gmUid)) throw new Error('Unauthorized');
  await updateDoc(doc(db, 'users', targetUid), { isBanned });
}

export async function getAllPlayers(): Promise<PlayerData[]> {
  const q    = query(collection(db, 'users'), orderBy('createdAt', 'desc'), limit(100));
  const snap = await getDocs(q);
  return snap.docs.map(d => d.data() as PlayerData);
}

export async function searchPlayer(email: string): Promise<PlayerData | null> {
  const q    = query(collection(db, 'users'), where('email', '==', email), limit(1));
  const snap = await getDocs(q);
  if (snap.empty) return null;
  return snap.docs[0].data() as PlayerData;
}
