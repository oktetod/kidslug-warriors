// ============================================================
//  KIDSLUG WARRIORS v2 - COMBAT SYSTEM
//  Pure damage-formula helpers, no Babylon dependency
// ============================================================

import { StatBlock, WeaponData, CHARACTERS, EQUIPMENT } from '../data/GameData';
import type { SaveData } from '../network/SaveSystem';

// ------------------------------------------------------------
//  COMPUTE EFFECTIVE STATS FOR A CHARACTER (base + equipment)
// ------------------------------------------------------------
export function calcCharStats(charId: string, save: SaveData): StatBlock {
  const charDef  = CHARACTERS.find(c => c.id === charId);
  if (!charDef) return { hp:100, atk:20, def:10, spd:50, crit:10, dodge:8 };

  const charSave = save.characters[charId] ?? { owned:false, level:1, equip:{}, activeSkin:'' };
  const lv       = charSave.level ?? 1;
  const base     = charDef.baseStats;

  // Level bonus (1% per level)
  const lvMult = 1 + (lv - 1) * 0.01;
  const stats: StatBlock = {
    hp:    Math.round(base.hp    * lvMult),
    atk:   Math.round(base.atk   * lvMult),
    def:   Math.round(base.def   * lvMult),
    spd:   Math.round(base.spd   * lvMult),
    crit:  base.crit,
    dodge: base.dodge,
  };

  // Add equipment bonuses
  const equip = charSave.equip ?? {};
  for (const slot of ['helmet', 'armor', 'boots', 'accessory'] as const) {
    const eqId = equip[slot];
    if (!eqId) continue;
    const eqDef = EQUIPMENT.find(e => e.id === eqId);
    if (!eqDef) continue;
    for (const [k, v] of Object.entries(eqDef.stat)) {
      (stats as any)[k] = ((stats as any)[k] ?? 0) + (v as number);
    }
  }
  return stats;
}



export interface DamageResult {
  amount: number;
  isCrit: boolean;
  isDodged: boolean;
  label: string;
}

export interface CombatContext {
  attackerAtk: number;
  attackerCrit: number;
  defenderDef: number;
  defenderDodge: number;
  weaponDmg: number;
  weaponRarity?: string;
}

// Rarity damage multipliers
const RARITY_MULT: Record<string, number> = {
  common:    1.0,
  rare:      1.25,
  epic:      1.6,
  legendary: 2.2,
  mythic:    3.0,
  divine:    4.5,
};

// ------------------------------------------------------------
//  PLAYER ATTACKS ENEMY
// ------------------------------------------------------------
export function calcPlayerDamage(ctx: CombatContext): DamageResult {
  const rarityMult = RARITY_MULT[ctx.weaponRarity ?? 'common'] ?? 1.0;
  const baseDmg    = (ctx.attackerAtk * 0.6 + ctx.weaponDmg * 0.4) * rarityMult;

  // Crit roll
  const isCrit = Math.random() * 100 < ctx.attackerCrit;
  const critMult = isCrit ? 1.8 + (ctx.attackerCrit / 200) : 1.0;

  // Defence reduction  (never reduce more than 80 %)
  const defRed   = Math.min(0.8, ctx.defenderDef / 300);
  const finalDmg = Math.max(1, Math.round(baseDmg * critMult * (1 - defRed)));

  return {
    amount: finalDmg,
    isCrit,
    isDodged: false,
    label: isCrit ? `CRIT ${finalDmg}` : `${finalDmg}`,
  };
}

// ------------------------------------------------------------
//  ENEMY ATTACKS PLAYER
// ------------------------------------------------------------
export function calcEnemyDamage(
  enemyAtk: number,
  playerDef: number,
  playerDodge: number,
): DamageResult {
  // Dodge roll
  const isDodged = Math.random() * 100 < playerDodge;
  if (isDodged) {
    return { amount: 0, isCrit: false, isDodged: true, label: 'DODGE' };
  }

  const defRed   = Math.min(0.75, playerDef / 250);
  const finalDmg = Math.max(1, Math.round(enemyAtk * (1 - defRed)));

  return {
    amount: finalDmg,
    isCrit: false,
    isDodged: false,
    label: `-${finalDmg}`,
  };
}

// ------------------------------------------------------------
//  BOMB DAMAGE (instant-kill normal/mini, 60 % of boss HP)
// ------------------------------------------------------------
export function calcBombDamage(enemyHp: number, enemyType: 'normal' | 'miniboss' | 'boss'): number {
  if (enemyType === 'boss')     return Math.round(enemyHp * 0.60);
  if (enemyType === 'miniboss') return enemyHp;  // one-shot
  return enemyHp * 999;                          // guaranteed kill
}

// ------------------------------------------------------------
//  HEAL AMOUNT
// ------------------------------------------------------------
export function calcHealAmount(maxHp: number, itemTier: 'small' | 'large' | 'full'): number {
  if (itemTier === 'full')  return maxHp;
  if (itemTier === 'large') return Math.round(maxHp * 0.50);
  return Math.round(maxHp * 0.30);
}

// ------------------------------------------------------------
//  HARD-MODE ENEMY STAT SCALING
// ------------------------------------------------------------
export function getHardModeMultipliers(stageId: number): { hp: number; atk: number; label: string } {
  if (stageId <= 3)  return { hp: 1.0,  atk: 1.0,  label: 'NORMAL'   };
  if (stageId <= 6)  return { hp: 1.5,  atk: 1.3,  label: 'HARD'     };
  if (stageId <= 10) return { hp: 2.25, atk: 1.6,  label: 'EXPERT'   };
  if (stageId <= 15) return { hp: 3.5,  atk: 2.2,  label: 'MASTER'   };
  if (stageId <= 20) return { hp: 6.0,  atk: 3.2,  label: 'ELITE'    };
  return               { hp: 8.5,  atk: 4.7,  label: 'LEGENDARY' };
}

// ------------------------------------------------------------
//  EXP SCALING
// ------------------------------------------------------------
export function expToNextLevel(level: number): number {
  if (level <= 20)  return 100 + level * 50;
  if (level <= 50)  return 1200 + (level - 20) * 100;
  if (level <= 80)  return 4500 + (level - 50) * 200;
  return 11000 + (level - 80) * 500;
}

export function applyExpGain(
  currentLevel: number,
  currentExp: number,
  gainedExp: number,
): { level: number; exp: number; leveledUp: boolean } {
  let lv  = currentLevel;
  let exp = currentExp + gainedExp;
  let leveledUp = false;

  while (lv < 100 && exp >= expToNextLevel(lv)) {
    exp -= expToNextLevel(lv);
    lv++;
    leveledUp = true;
  }
  return { level: lv, exp, leveledUp };
}

// ------------------------------------------------------------
//  UPGRADE COST
// ------------------------------------------------------------
export function upgradeCost(_charId: string, _level: number): number {
  return 100; // fixed 100 coins per level
}
