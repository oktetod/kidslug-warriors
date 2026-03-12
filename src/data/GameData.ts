// =================================================================
//  KIDSLUG WARRIORS v2 - GAME DATA
//  All game constants. No emojis in runtime data.
// =================================================================

export interface CharacterData {
  id:          string;
  name:        string;
  title:       string;
  unlocked:    boolean;
  unlockCost:  number;
  baseStats:   StatBlock;
  color:       string;
  accentColor: string;
  bodyColor:   string;
  headColor:   string;
  helmetColor: string;
  pantsColor:  string;
  upgradeCostPerLevel: number;
  passiveDesc: string;
  activeDesc:  string;
}

export interface StatBlock {
  hp:    number;
  atk:   number;
  def:   number;
  spd:   number;
  crit:  number;
  dodge: number;
}

export interface WeaponData {
  id:       string;
  name:     string;
  rarity:   Rarity;
  dmg:      number;
  rate:     number;
  range:    number;
  color:    string;
  levelReq: number;
  bulletColor: string;
  bulletSize:  number;
}

export interface EquipmentData {
  id:       string;
  slot:     'helmet' | 'armor' | 'boots' | 'accessory';
  name:     string;
  rarity:   Rarity;
  color:    string;
  stat:     Partial<StatBlock>;
  levelReq: number;
}

export interface ItemData {
  id:    string;
  name:  string;
  color: string;
  desc:  string;
  price: number;
}

export interface StageData {
  id:          number;
  name:        string;
  difficulty:  string;
  coins:       [number, number];
  enemyHp:     number;
  enemyAtk:    number;
  enemies:     number;
  color:       string;
  bgColor:     string;
  unlockReq:   number;
  bossId:      string;
  hardMode:    boolean;
  exp:         number;
  questCount:  number;
  isFinalBoss?: boolean;
  groundColor: string;
  skyColor:    string;
}

export type Rarity = 'common' | 'rare' | 'epic' | 'legendary' | 'mythic' | 'divine';

export interface RarityConfig {
  label:    string;
  color:    string;
  bg:       string;
  levelReq: number;
}

// ---- RARITY CONFIG --------------------------------------------------
export const RARITY_CONFIG: Record<Rarity, RarityConfig> = {
  common:    { label: 'Common',    color: '#9e9e9e', bg: '#1c2529', levelReq: 1  },
  rare:      { label: 'Rare',      color: '#42a5f5', bg: '#0a1929', levelReq: 15 },
  epic:      { label: 'Epic',      color: '#ce93d8', bg: '#180a29', levelReq: 25 },
  legendary: { label: 'Legendary', color: '#ffd700', bg: '#291800', levelReq: 40 },
  mythic:    { label: 'Mythic',    color: '#ff4081', bg: '#1a0010', levelReq: 55 },
  divine:    { label: 'Divine',    color: '#ffffff', bg: '#0a0a1a', levelReq: 70 },
};

// ---- CHARACTERS -----------------------------------------------------
export const CHARACTERS: CharacterData[] = [
  {
    id: 'marco', name: 'Marco', title: 'The Soldier',
    unlocked: true, unlockCost: 0,
    baseStats: { hp: 120, atk: 35, def: 20, spd: 50, crit: 10, dodge: 8 },
    color: '#1976d2', accentColor: '#42a5f5',
    bodyColor: '#1565c0', headColor: '#ffe0b2', helmetColor: '#0d47a1', pantsColor: '#283593',
    upgradeCostPerLevel: 100,
    passiveDesc: 'ATK +5% when HP below 50%',
    activeDesc:  'Heavy Fire: rapid shoot for 3s, cooldown 12s',
  },
  {
    id: 'tarma', name: 'Tarma', title: 'The Tank',
    unlocked: true, unlockCost: 0,
    baseStats: { hp: 200, atk: 25, def: 45, spd: 30, crit: 5, dodge: 3 },
    color: '#d32f2f', accentColor: '#ef5350',
    bodyColor: '#b71c1c', headColor: '#d7a57a', helmetColor: '#7f0000', pantsColor: '#4a0000',
    upgradeCostPerLevel: 100,
    passiveDesc: 'Take 20% less damage when defending',
    activeDesc:  'Ground Slam: stun nearby enemies, cooldown 10s',
  },
  {
    id: 'eri', name: 'Eri', title: 'The Swift',
    unlocked: false, unlockCost: 5000,
    baseStats: { hp: 90, atk: 40, def: 12, spd: 90, crit: 20, dodge: 25 },
    color: '#7b1fa2', accentColor: '#ce93d8',
    bodyColor: '#6a1b9a', headColor: '#ffe0b2', helmetColor: '#4a148c', pantsColor: '#4a148c',
    upgradeCostPerLevel: 100,
    passiveDesc: 'Dodge +30% while moving',
    activeDesc:  'Blitz Rush: dash and attack 3x, cooldown 8s',
  },
  {
    id: 'fio', name: 'Fio', title: 'The Tech',
    unlocked: false, unlockCost: 8000,
    baseStats: { hp: 100, atk: 45, def: 18, spd: 55, crit: 15, dodge: 12 },
    color: '#00796b', accentColor: '#4db6ac',
    bodyColor: '#00695c', headColor: '#f5cba7', helmetColor: '#004d40', pantsColor: '#004d40',
    upgradeCostPerLevel: 100,
    passiveDesc: '+10% damage with Epic+ weapons',
    activeDesc:  'Deploy Drone: auto-shoots for 5s, cooldown 15s',
  },
  {
    id: 'nadia', name: 'Nadia', title: 'The Sniper',
    unlocked: false, unlockCost: 12000,
    baseStats: { hp: 85, atk: 70, def: 10, spd: 40, crit: 35, dodge: 15 },
    color: '#c17900', accentColor: '#ffca28',
    bodyColor: '#e65100', headColor: '#d7a57a', helmetColor: '#bf360c', pantsColor: '#bf360c',
    upgradeCostPerLevel: 100,
    passiveDesc: '+50% damage to far enemies (over 200px)',
    activeDesc:  'Headshot: guaranteed crit, cooldown 20s',
  },
  {
    id: 'rumi', name: 'Rumi', title: 'The Ninja',
    unlocked: false, unlockCost: 20000,
    baseStats: { hp: 95, atk: 55, def: 15, spd: 80, crit: 30, dodge: 35 },
    color: '#37474f', accentColor: '#90a4ae',
    bodyColor: '#263238', headColor: '#455a64', helmetColor: '#1a1a1a', pantsColor: '#1c1c1c',
    upgradeCostPerLevel: 100,
    passiveDesc: 'Melee attacks +25% damage',
    activeDesc:  'Smoke Bomb: invincible for 3s, cooldown 14s',
  },
];

// ---- WEAPONS --------------------------------------------------------
export const WEAPONS: WeaponData[] = [
  { id:'pistol',   name:'Pistol',          rarity:'common',    dmg:12,  rate:1.0, range:180, color:'#90a4ae', levelReq:1,  bulletColor:'#e0e0e0', bulletSize:0.06 },
  { id:'smg',      name:'SMG',             rarity:'common',    dmg:8,   rate:3.0, range:150, color:'#78909c', levelReq:1,  bulletColor:'#b0bec5', bulletSize:0.05 },
  { id:'shotgun',  name:'Shotgun',         rarity:'common',    dmg:30,  rate:0.5, range:120, color:'#a1887f', levelReq:1,  bulletColor:'#d7ccc8', bulletSize:0.08 },
  { id:'rifle',    name:'Assault Rifle',   rarity:'rare',      dmg:40,  rate:1.5, range:250, color:'#42a5f5', levelReq:15, bulletColor:'#82b1ff', bulletSize:0.06 },
  { id:'grenade',  name:'Grenade L.',      rarity:'rare',      dmg:70,  rate:0.4, range:200, color:'#7986cb', levelReq:15, bulletColor:'#ff6d00', bulletSize:0.12 },
  { id:'sniper',   name:'Sniper Rifle',    rarity:'rare',      dmg:95,  rate:0.3, range:999, color:'#66bb6a', levelReq:15, bulletColor:'#b9f6ca', bulletSize:0.04 },
  { id:'laser',    name:'Laser Gun',       rarity:'epic',      dmg:65,  rate:2.0, range:300, color:'#ce93d8', levelReq:25, bulletColor:'#ea80fc', bulletSize:0.04 },
  { id:'rocketl',  name:'Rocket Launcher', rarity:'epic',      dmg:130, rate:0.35,range:280, color:'#ef9a9a', levelReq:25, bulletColor:'#ff5722', bulletSize:0.15 },
  { id:'minigun',  name:'Minigun',         rarity:'epic',      dmg:20,  rate:5.0, range:200, color:'#ffcc80', levelReq:25, bulletColor:'#ffd740', bulletSize:0.05 },
  { id:'flamer',   name:'Flamethrower',    rarity:'legendary', dmg:85,  rate:3.0, range:160, color:'#ff9800', levelReq:40, bulletColor:'#ff6d00', bulletSize:0.10 },
  { id:'thunder',  name:'Thunderbolt',     rarity:'legendary', dmg:200, rate:0.5, range:999, color:'#ffd700', levelReq:40, bulletColor:'#fff9c4', bulletSize:0.08 },
  { id:'plasma',   name:'Plasma Cannon',   rarity:'legendary', dmg:160, rate:0.8, range:350, color:'#e040fb', levelReq:40, bulletColor:'#ea80fc', bulletSize:0.12 },
  { id:'void_bow', name:'Void Bow',        rarity:'mythic',    dmg:280, rate:0.7, range:450, color:'#ff4081', levelReq:55, bulletColor:'#ff80ab', bulletSize:0.09 },
  { id:'divine_ray',name:'Divine Ray',     rarity:'divine',    dmg:500, rate:0.9, range:999, color:'#ffffff', levelReq:70, bulletColor:'#e0e0ff', bulletSize:0.07 },
];

// ---- EQUIPMENT ------------------------------------------------------
export const EQUIPMENT: EquipmentData[] = [
  { id:'helm_iron',     slot:'helmet',    name:'Iron Helmet',    rarity:'common',    color:'#90a4ae', stat:{hp:15,def:5},                 levelReq:1  },
  { id:'armor_leather', slot:'armor',     name:'Leather Vest',   rarity:'common',    color:'#a1887f', stat:{hp:20,def:8},                 levelReq:1  },
  { id:'boots_cloth',   slot:'boots',     name:'Cloth Boots',    rarity:'common',    color:'#a1887f', stat:{spd:8,dodge:3},               levelReq:1  },
  { id:'acc_ring',      slot:'accessory', name:'Iron Ring',      rarity:'common',    color:'#90a4ae', stat:{atk:5,crit:3},                levelReq:1  },
  { id:'helm_steel',    slot:'helmet',    name:'Steel Helmet',   rarity:'rare',      color:'#42a5f5', stat:{hp:30,def:12,crit:5},         levelReq:15 },
  { id:'armor_chain',   slot:'armor',     name:'Chainmail',      rarity:'rare',      color:'#7986cb', stat:{hp:45,def:20},                levelReq:15 },
  { id:'boots_steel',   slot:'boots',     name:'Steel Boots',    rarity:'rare',      color:'#64b5f6', stat:{spd:5,def:10,dodge:8},        levelReq:15 },
  { id:'acc_pendant',   slot:'accessory', name:'Battle Pendant', rarity:'rare',      color:'#ffca28', stat:{atk:12,crit:8,hp:15},         levelReq:15 },
  { id:'helm_titan',    slot:'helmet',    name:'Titan Helm',     rarity:'epic',      color:'#ce93d8', stat:{hp:60,def:22,crit:10},        levelReq:25 },
  { id:'armor_dragon',  slot:'armor',     name:'Dragon Scale',   rarity:'epic',      color:'#ef5350', stat:{hp:80,def:35,atk:10},         levelReq:25 },
  { id:'boots_wind',    slot:'boots',     name:'Wind Boots',     rarity:'epic',      color:'#80deea', stat:{spd:25,dodge:18,crit:8},      levelReq:25 },
  { id:'acc_crystal',   slot:'accessory', name:'Power Crystal',  rarity:'epic',      color:'#80cbc4', stat:{atk:22,crit:15,spd:8},        levelReq:25 },
  { id:'helm_void',     slot:'helmet',    name:'Void Crown',     rarity:'legendary', color:'#ffd700', stat:{hp:100,def:35,crit:18,dodge:10},levelReq:40},
  { id:'armor_cyber',   slot:'armor',     name:'Cyber Suit',     rarity:'legendary', color:'#e040fb', stat:{hp:150,def:50,atk:20,spd:10}, levelReq:40 },
  { id:'boots_hermes',  slot:'boots',     name:'Hermes Boots',   rarity:'legendary', color:'#ffd700', stat:{spd:45,dodge:30,crit:12},     levelReq:40 },
  { id:'acc_dragon_eye',slot:'accessory', name:'Dragon Eye',     rarity:'legendary', color:'#ffd700', stat:{atk:40,crit:25,hp:80,spd:15}, levelReq:40 },
];

// ---- ITEMS ----------------------------------------------------------
export const ITEMS: ItemData[] = [
  { id:'medkit',    name:'Med Kit',      color:'#ef5350', desc:'Restore 30 HP',           price:500  },
  { id:'medkit_lg', name:'Large Med Kit',color:'#e53935', desc:'Restore 80 HP',           price:1500 },
  { id:'full_heal', name:'Full Restore', color:'#ffd700', desc:'Restore all HP',          price:5000 },
  { id:'bomb',      name:'Hand Bomb',    color:'#ff9800', desc:'Destroy all visible enemies', price:1000 },
  { id:'shield',    name:'Shield Plate', color:'#42a5f5', desc:'DEF +20 for 10 seconds',  price:800  },
  { id:'speed_up',  name:'Speed Boost',  color:'#4caf50', desc:'SPD +30 for 8 seconds',   price:700  },
  { id:'revive',    name:'Revive Stone', color:'#f48fb1', desc:'Revive with 50% HP',       price:8000 },
];

// ---- STAGES ---------------------------------------------------------
export const STAGES: StageData[] = [
  { id:1,  name:'Jungle Base',     difficulty:'Easy',       coins:[18,32],    enemyHp:60,   enemyAtk:8,   enemies:8,  color:'#2e7d32', bgColor:'#1b3a1b', unlockReq:0,  bossId:'slug_basic',   hardMode:false, exp:100,  questCount:3, groundColor:'#4a7c3f', skyColor:'#1a3a2a' },
  { id:2,  name:'Desert Ruins',    difficulty:'Easy',       coins:[27,45],    enemyHp:90,   enemyAtk:12,  enemies:10, color:'#f57f17', bgColor:'#3e1a00', unlockReq:1,  bossId:'metal_slug',   hardMode:false, exp:150,  questCount:3, groundColor:'#8d6e3f', skyColor:'#3e2a12' },
  { id:3,  name:'Sky Fortress',    difficulty:'Medium',     coins:[40,63],    enemyHp:130,  enemyAtk:16,  enemies:12, color:'#1565c0', bgColor:'#0a1a40', unlockReq:2,  bossId:'helicopter',   hardMode:false, exp:200,  questCount:4, groundColor:'#37474f', skyColor:'#0d1b3e' },
  { id:4,  name:'Ice Cavern',      difficulty:'Hard',       coins:[58,90],    enemyHp:140,  enemyAtk:18,  enemies:12, color:'#00838f', bgColor:'#001a20', unlockReq:3,  bossId:'ice_mech',     hardMode:true,  exp:280,  questCount:4, groundColor:'#b0bec5', skyColor:'#00262e' },
  { id:5,  name:'Volcano Core',    difficulty:'Hard',       coins:[76,117],   enemyHp:170,  enemyAtk:22,  enemies:14, color:'#bf360c', bgColor:'#2a0000', unlockReq:4,  bossId:'fire_dragon',  hardMode:true,  exp:360,  questCount:4, groundColor:'#6d1a00', skyColor:'#2a0a00' },
  { id:6,  name:'Underground Lab', difficulty:'Hard',       coins:[94,144],   enemyHp:200,  enemyAtk:26,  enemies:14, color:'#00695c', bgColor:'#001a10', unlockReq:5,  bossId:'scientist',    hardMode:true,  exp:450,  questCount:5, groundColor:'#1a3a30', skyColor:'#001a0e' },
  { id:7,  name:'Urban Warfare',   difficulty:'Expert',     coins:[117,180],  enemyHp:240,  enemyAtk:30,  enemies:16, color:'#546e7a', bgColor:'#0d0d1a', unlockReq:6,  bossId:'tank_boss',    hardMode:true,  exp:550,  questCount:5, groundColor:'#37474f', skyColor:'#111122' },
  { id:8,  name:'Space Station',   difficulty:'Expert',     coins:[148,225],  enemyHp:280,  enemyAtk:35,  enemies:16, color:'#4527a0', bgColor:'#02001a', unlockReq:7,  bossId:'alien_mech',   hardMode:true,  exp:660,  questCount:5, groundColor:'#212121', skyColor:'#050020' },
  { id:9,  name:'Cyber Realm',     difficulty:'Expert',     coins:[184,279],  enemyHp:330,  enemyAtk:40,  enemies:18, color:'#006064', bgColor:'#001018', unlockReq:8,  bossId:'cyber_core',   hardMode:true,  exp:780,  questCount:5, groundColor:'#00363a', skyColor:'#001418' },
  { id:10, name:'Death Citadel',   difficulty:'Expert',     coins:[225,360],  enemyHp:400,  enemyAtk:48,  enemies:20, color:'#4a148c', bgColor:'#1a001a', unlockReq:9,  bossId:'final_boss',   hardMode:true,  exp:920,  questCount:5, groundColor:'#2d0030', skyColor:'#1a001a' },
  { id:25, name:'TRUE FINAL BOSS', difficulty:'Legend', coins:[2475,4050], enemyHp:3500, enemyAtk:330, enemies:36, color:'#ffd700', bgColor:'#0a0a00', unlockReq:24, bossId:'god_of_war',   hardMode:true,  exp:8000, questCount:5, groundColor:'#2a2a00', skyColor:'#0a0a00', isFinalBoss:true },
];

// ---- GACHA POOLS ----------------------------------------------------
export const GACHA_POOLS = {
  weapon:    { name:'Weapon Gacha',   cost:{ single:1000, ten:9000  }, rates:{ common:50, rare:30, epic:15, legendary:5 } },
  equipment: { name:'Equipment Gacha',cost:{ single:800,  ten:7200  }, rates:{ common:55, rare:28, epic:13, legendary:4 } },
  mixed:     { name:'Lucky Draw',     cost:{ single:1200, ten:10800 }, rates:{ common:45, rare:30, epic:18, legendary:7 } },
};

// ---- RARITY COLORS (shorthand map) ---------------------------------
export const RARITY_COLORS: Record<string, string> = {
  common:    '#9e9e9e',
  rare:      '#42a5f5',
  epic:      '#ce93d8',
  legendary: '#ffd700',
  mythic:    '#ff4081',
  divine:    '#ffffff',
};

// ---- ENEMY STATS ----------------------------------------------------
export const ENEMY_STATS: Record<string, { hp: number; atk: number; speed: number; score: number }> = {
  normal:   { hp: 1.0, atk: 1.0, speed: 3.5, score: 10 },
  miniboss: { hp: 1.5, atk: 1.5, speed: 2.5, score: 50 },
  boss:     { hp: 2.0, atk: 2.0, speed: 1.8, score: 200 },
};

// ---- STAT INFO ------------------------------------------------------
export const STAT_INFO = {
  hp:    { label:'HP',      color:'#ef5350' },
  atk:   { label:'ATK',     color:'#ff9800' },
  def:   { label:'DEF',     color:'#42a5f5' },
  spd:   { label:'SPD',     color:'#4caf50' },
  crit:  { label:'CRIT%',   color:'#ffd700' },
  dodge: { label:'DODGE%',  color:'#80deea' },
};

// ---- HELPER: EXP TO NEXT LEVEL ------------------------------------
export function expToNextLevel(level: number): number {
  if (level <= 20)  return 100 + level * 50;
  if (level <= 50)  return 1200 + (level - 20) * 100;
  if (level <= 80)  return 4500 + (level - 50) * 200;
  return 11000 + (level - 80) * 500;
}

// ---- HELPER: UPGRADE COST -----------------------------------------
export function upgradeCost(_charId: string, _level: number): number {
  return 100;
}
