import type { WeaponDef, EnemyDef, EnemyType, StageConfig } from '../types';

export const GAME_WIDTH = 1280;
export const GAME_HEIGHT = 720;
export const GROUND_Y = 640;
export const MAP_WIDTH = 10544;
export const PLAYER_SCALE = 3;
export const PLAYER_SPEED = 200;
export const JUMP_VEL = -520;
export const GRAVITY = 900;

export const WEAPONS: Record<string, WeaponDef> = {
  pistol: {
    id: 'pistol', name: 'Pistol', price: 0, isDefault: true,
    damage: 25, fireRate: 380, bulletSpeed: 600, sound: 'shoot1',
    description: 'Reliable sidearm. Default weapon.', emoji: '🔫',
  },
  grenade: {
    id: 'grenade', name: 'Grenade', price: 0, isDefault: true,
    damage: 90, fireRate: 1800, bulletSpeed: 300, sound: 'grenade1',
    description: 'Explosive grenade with area damage.', emoji: '💣',
    isExplosive: true, splashRadius: 120,
  },
  machinegun: {
    id: 'machinegun', name: 'Machine Gun', price: 500, isDefault: false,
    damage: 15, fireRate: 90, bulletSpeed: 700, sound: 'machinegun',
    description: 'Rapid fire. Eats enemies alive!', emoji: '🔥',
  },
  shotgun: {
    id: 'shotgun', name: 'Shotgun', price: 800, isDefault: false,
    damage: 45, fireRate: 750, bulletSpeed: 450, sound: 'shoot2',
    description: 'Wide 5-spread burst at close range.', emoji: '💥',
    spreadCount: 5,
  },
  rocket: {
    id: 'rocket', name: 'Rocket Launcher', price: 1200, isDefault: false,
    damage: 150, fireRate: 1400, bulletSpeed: 380, sound: 'explosion',
    description: 'Massive area destruction. Bosses hate it!', emoji: '🚀',
    isExplosive: true, splashRadius: 180,
  },
  knife: {
    id: 'knife', name: 'Combat Knife', price: 300, isDefault: false,
    damage: 60, fireRate: 250, bulletSpeed: 0, sound: 'shoot',
    description: 'Silent melee. No bullets needed!', emoji: '🔪',
    range: 90,
  },
};

export const WEAPON_ORDER: string[] = ['pistol', 'grenade', 'machinegun', 'shotgun', 'rocket', 'knife'];

export const ENEMY_DEFS: Record<EnemyType, EnemyDef> = {
  scientist: {
    hp: 50, speed: 70, damage: 15, coinValue: 5, scoreValue: 50,
    shootRange: 380, shootRate: 2200, scale: 2.5, sound: 'scientist',
  },
  zombie: {
    hp: 80, speed: 55, damage: 20, coinValue: 5, scoreValue: 60,
    meleeRange: 55, attackRate: 1400, scale: 2.5, sound: 'zombie',
  },
  tank: {
    hp: 280, speed: 35, damage: 35, coinValue: 20, scoreValue: 200,
    shootRange: 650, shootRate: 2800, scale: 2, sound: 'tank',
  },
  helicopter: {
    hp: 180, speed: 90, damage: 20, coinValue: 15, scoreValue: 150,
    shootRange: 500, shootRate: 1800, isFlying: true, scale: 2, sound: 'helicopter',
  },
  airship: {
    hp: 350, speed: 28, damage: 28, coinValue: 25, scoreValue: 280,
    shootRange: 700, shootRate: 3200, isFlying: true, scale: 2, sound: 'airship',
  },
  mechaRobot: {
    hp: 300, speed: 50, damage: 38, coinValue: 30, scoreValue: 320,
    shootRange: 480, shootRate: 2000, scale: 2.5, sound: 'mecha',
  },
  ufo: {
    hp: 1200, speed: 65, damage: 45, coinValue: 100, scoreValue: 2000,
    shootRange: 900, shootRate: 1200, isFlying: true, isBoss: true, scale: 3, sound: 'ufo',
  },
};

export const STAGES: StageConfig[] = [
  {
    id: 1, name: 'Desert Outpost', bgm: 'bgm1', coinReward: 150,
    enemies: [
      { type: 'scientist', count: 8, spawnInterval: 4500 },
      { type: 'zombie', count: 6, spawnInterval: 3800 },
    ],
  },
  {
    id: 2, name: 'Steel Valley', bgm: 'bgm2', coinReward: 280,
    enemies: [
      { type: 'tank', count: 5, spawnInterval: 7000 },
      { type: 'helicopter', count: 5, spawnInterval: 5500 },
    ],
  },
  {
    id: 3, name: 'Sky Fortress', bgm: 'bgm1', coinReward: 450,
    enemies: [
      { type: 'mechaRobot', count: 5, spawnInterval: 5500 },
      { type: 'airship', count: 3, spawnInterval: 9000 },
    ],
  },
  {
    id: 4, name: '⚡ FINAL BOSS: UFO Commander', bgm: 'bgm2', coinReward: 1200,
    enemies: [
      { type: 'ufo', count: 1, spawnInterval: 3000 },
      { type: 'scientist', count: 5, spawnInterval: 5000 },
      { type: 'zombie', count: 5, spawnInterval: 4500 },
    ],
  },
];
