import { create } from 'zustand';
import type { PlayerData, WeaponId } from '../types';

interface GameState {
  // Auth
  user: PlayerData | null;
  setUser: (u: PlayerData | null) => void;
  updateUserCoins: (delta: number) => void;
  addOwnedWeapon: (w: WeaponId) => void;

  // Screen
  screen: 'loading' | 'auth' | 'menu' | 'game' | 'shop' | 'leaderboard' | 'gm';
  setScreen: (s: GameState['screen']) => void;

  // In-game HUD (updated by Phaser events)
  hud: {
    score: number;
    coins: number;
    health: number;
    maxHealth: number;
    currentWeapon: string;
    stage: number;
    bossHP: number;
    bossMaxHP: number;
  };
  updateHud: (partial: Partial<GameState['hud']>) => void;

  // Stage to start
  selectedStage: number;
  setSelectedStage: (n: number) => void;
}

export const useGameStore = create<GameState>((set) => ({
  user: null,
  setUser: (user) => set({ user }),
  updateUserCoins: (delta) =>
    set((s) => s.user ? { user: { ...s.user, coins: s.user.coins + delta } } : {}),
  addOwnedWeapon: (w) =>
    set((s) => s.user ? { user: { ...s.user, ownedWeapons: [...s.user.ownedWeapons, w] } } : {}),

  screen: 'loading',
  setScreen: (screen) => set({ screen }),

  hud: { score: 0, coins: 0, health: 3, maxHealth: 3, currentWeapon: 'pistol', stage: 1, bossHP: 0, bossMaxHP: 0 },
  updateHud: (partial) => set((s) => ({ hud: { ...s.hud, ...partial } })),

  selectedStage: 1,
  setSelectedStage: (selectedStage) => set({ selectedStage }),
}));
