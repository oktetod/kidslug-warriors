export type WeaponId = 'pistol' | 'grenade' | 'machinegun' | 'shotgun' | 'rocket' | 'knife';

export interface WeaponDef {
  id: WeaponId;
  name: string;
  price: number;
  isDefault: boolean;
  damage: number;
  fireRate: number;
  bulletSpeed: number;
  description: string;
  emoji: string;
  sound: string;
  isExplosive?: boolean;
  splashRadius?: number;
  spreadCount?: number;
  range?: number;
}

export type EnemyType = 'scientist' | 'zombie' | 'tank' | 'helicopter' | 'airship' | 'mechaRobot' | 'ufo';

export interface EnemyDef {
  hp: number;
  speed: number;
  damage: number;
  coinValue: number;
  scoreValue: number;
  shootRange?: number;
  shootRate?: number;
  meleeRange?: number;
  attackRate?: number;
  isFlying?: boolean;
  isBoss?: boolean;
  scale: number;
  sound: string;
}

export interface StageConfig {
  id: number;
  name: string;
  bgm: string;
  coinReward: number;
  enemies: { type: EnemyType; count: number; spawnInterval: number }[];
}

export interface PlayerData {
  uid: string;
  displayName: string;
  email: string;
  photoURL: string;
  coins: number;
  ownedWeapons: WeaponId[];
  highScore: number;
  stagesCleared: number;
  totalKills: number;
  isGM: boolean;
  isBanned: boolean;
  createdAt: number;
}

export interface LeaderboardEntry {
  uid: string;
  displayName: string;
  photoURL: string;
  score: number;
  stagesCleared: number;
  timestamp: number;
}

export interface TopUpRequest {
  targetUid: string;
  amount: number;
  reason: string;
  gmUid: string;
}

export interface GameEventPayload {
  type: 'score' | 'coins' | 'health' | 'weapon' | 'stage' | 'gameover' | 'stageclear' | 'bosshp';
  value: number | string;
}
