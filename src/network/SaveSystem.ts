// =================================================================
//  KIDSLUG WARRIORS v2 - SAVE SYSTEM
//  localStorage (guest) + Firebase (authenticated, auto-save 30s)
// =================================================================

export interface SaveData {
  version:    number;
  lastSaved:  number;
  player: {
    name:               string;
    isGuest:            boolean;
    uid:                string | null;
    level:              number;
    exp:                number;
    coins:              number;
    currentHp:          number;   // HP saat ini - disimpan untuk resume
    lastStageId:        number;   // Stage terakhir dimainkan
    totalCoinsEarned:   number;
    totalEnemiesKilled: number;
    totalStagesCleared: number;
    totalKills:         number;
    highestStage:       number;
  };
  characters: Record<string, {
    owned:      boolean;
    level:      number;
    equip:      { helmet: string | null; armor: string | null; boots: string | null; accessory: string | null };
    activeSkin: string;
  }>;
  activeCharId:   string;
  activeWeaponId: string;
  weapons:    Record<string, number>;
  equipment:  Record<string, number>;
  items:      Record<string, number>;
  stages:     Record<number, { cleared: boolean; clears: number; bestCoins: number }>;
  quests:     Record<string, { progress: number; completed: boolean; claimed: boolean }>;
  gacha: {
    weapon:    { pulls: number; pity: number };
    equipment: { pulls: number; pity: number };
    mixed:     { pulls: number; pity: number };
  };
  gm: { isGM: boolean; banned: boolean };
}

const SAVE_KEY = 'ksw_save_v2';

export const DEFAULT_SAVE: SaveData = {
  version:   2,
  lastSaved: Date.now(),
  player: {
    name:               'PEJUANG',
    isGuest:            true,
    uid:                null,
    level:              1,
    exp:                0,
    coins:              2000,
    currentHp:          100,
    lastStageId:        1,
    totalCoinsEarned:   0,
    totalEnemiesKilled: 0,
    totalStagesCleared: 0,
    totalKills:         0,
    highestStage:       0,
  },
  characters: {
    marco: { owned:true,  level:1, equip:{helmet:null,armor:null,boots:null,accessory:null}, activeSkin:'marco_default' },
    tarma: { owned:true,  level:1, equip:{helmet:null,armor:null,boots:null,accessory:null}, activeSkin:'tarma_default' },
    eri:   { owned:false, level:1, equip:{helmet:null,armor:null,boots:null,accessory:null}, activeSkin:'eri_default'   },
    fio:   { owned:false, level:1, equip:{helmet:null,armor:null,boots:null,accessory:null}, activeSkin:'fio_default'   },
    nadia: { owned:false, level:1, equip:{helmet:null,armor:null,boots:null,accessory:null}, activeSkin:'nadia_default' },
    rumi:  { owned:false, level:1, equip:{helmet:null,armor:null,boots:null,accessory:null}, activeSkin:'rumi_default'  },
  },
  activeCharId:   'marco',
  activeWeaponId: 'pistol',
  weapons:    { pistol: 1 },
  equipment:  {},
  items:      { medkit: 3, bomb: 1 },
  stages:     { 1: { cleared: false, clears: 0, bestCoins: 0 } },
  quests:     {},
  gacha: {
    weapon:    { pulls:0, pity:0 },
    equipment: { pulls:0, pity:0 },
    mixed:     { pulls:0, pity:0 },
  },
  gm: { isGM: false, banned: false },
};

// ---- Deep helpers --------------------------------------------------
export function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

function deepMerge(target: Record<string, unknown>, source: Record<string, unknown>): Record<string, unknown> {
  for (const key in source) {
    const sv = source[key];
    const tv = target[key];
    if (sv && typeof sv === 'object' && !Array.isArray(sv)) {
      if (!tv || typeof tv !== 'object') target[key] = {};
      deepMerge(target[key] as Record<string, unknown>, sv as Record<string, unknown>);
    } else {
      target[key] = sv;
    }
  }
  return target;
}

// ---- Local storage -------------------------------------------------
export function loadSave(): SaveData {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return deepClone(DEFAULT_SAVE);
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const merged = deepMerge(deepClone(DEFAULT_SAVE) as unknown as Record<string, unknown>, parsed);
    const save = merged as unknown as SaveData;
    save.gm.isGM = false; // never trust stored GM status
    return save;
  } catch {
    return deepClone(DEFAULT_SAVE);
  }
}

export function writeSave(data: SaveData): void {
  try {
    data.lastSaved = Date.now();
    localStorage.setItem(SAVE_KEY, JSON.stringify(data));
  } catch {
    // storage full or private mode
  }
}

export function wipeSave(): void {
  localStorage.removeItem(SAVE_KEY);
}

// ---- Stat calculation ---------------------------------------------
export function calcCharStats(charId: string, save: SaveData): Record<string, number> {
  // Import lazily to avoid circular deps
  const CHARACTERS = (window as unknown as { __ksw_chars: Array<{ id: string; baseStats: Record<string, number> }> }).__ksw_chars;
  const EQUIPMENT  = (window as unknown as { __ksw_equip: Array<{ id: string; stat: Record<string, number> }> }).__ksw_equip;

  const char = CHARACTERS?.find(c => c.id === charId);
  const base = char?.baseStats ?? { hp:100, atk:30, def:20, spd:50, crit:10, dodge:8 };
  const charSave = save.characters[charId] ?? { level:1, equip:{} };
  const level = charSave.level || 1;
  const mult  = 1 + (level - 1) * 0.08;

  const stats: Record<string, number> = {};
  for (const k in base) stats[k] = Math.round((base as Record<string, number>)[k] * mult);

  const equip = charSave.equip as Record<string, string | null>;
  for (const slot in equip) {
    const eid = equip[slot];
    if (!eid || !EQUIPMENT) continue;
    const eq = EQUIPMENT.find(e => e.id === eid);
    if (!eq) continue;
    for (const k in eq.stat) {
      if (stats[k] !== undefined) stats[k] += (eq.stat as Record<string, number>)[k];
    }
  }
  return stats;
}
