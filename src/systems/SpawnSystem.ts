// ============================================================
//  KIDSLUG WARRIORS v2 - SPAWN SYSTEM
//  Manages enemy waves, timing, boss triggers
// ============================================================

import { Scene, Vector3 } from '@babylonjs/core';
import { Enemy }           from '../entities/Enemy';
import { StageData, ENEMY_STATS } from '../data/GameData';

export type EnemyTypeId = keyof typeof ENEMY_STATS;

export interface SpawnConfig {
  stageData:     StageData;
  totalEnemies:  number;
  scene:         Scene;
  scrollX:       number;
  canvasWidth:   number;
  groundY:       number;
}

export interface SpawnState {
  spawned:          number;
  killed:           number;
  miniBossSpawned:  boolean;
  bossSpawned:      boolean;
  timer:            number;
  spawnInterval:    number;  // frames between spawns
}

export function createSpawnState(totalEnemies: number): SpawnState {
  return {
    spawned:         0,
    killed:          0,
    miniBossSpawned: false,
    bossSpawned:     false,
    timer:           60,
    spawnInterval:   Math.max(45, 120 - totalEnemies * 4),
  };
}

// Called every game tick – returns an Enemy type to spawn or null
export function tickSpawn(
  state:  SpawnState,
  config: SpawnConfig,
  dt:     number,
): 'normal' | 'miniboss' | 'boss' | null {
  const { totalEnemies } = config;
  const remaining = totalEnemies - state.spawned;

  if (remaining <= 0) return null;

  // Mini-boss trigger: 40 % of enemies killed, not yet spawned
  if (
    !state.miniBossSpawned &&
    !state.bossSpawned &&
    state.killed >= Math.floor(totalEnemies * 0.4)
  ) {
    state.miniBossSpawned = true;
    state.spawned++;
    return 'miniboss';
  }

  // Boss trigger: last enemy slot
  if (!state.bossSpawned && state.spawned >= totalEnemies - 1) {
    state.bossSpawned = true;
    state.spawned++;
    return 'boss';
  }

  // Normal spawn timer
  state.timer -= dt;
  if (state.timer <= 0) {
    state.timer = state.spawnInterval;
    state.spawned++;
    return 'normal';
  }

  return null;
}

// ---------------------------------------------------------------
//  Build enemy base HP/ATK from stage data + enemy-type modifiers
// ---------------------------------------------------------------
export interface EnemyScaling {
  hp:    number;
  atk:   number;
  speed: number;
  score: number;
}

export function scaleEnemy(
  stageData:  StageData,
  enemyTypeId: string,
  spawnIndex:  number,
  enemyKind:   'normal' | 'miniboss' | 'boss',
): EnemyScaling {
  const eStats = ENEMY_STATS[enemyTypeId as EnemyTypeId] ?? ENEMY_STATS.jungle_soldier;
  const sc = 1 + spawnIndex * 0.03;  // gradual ramp

  const base = {
    normal:   { hpMult: 1.0 * sc,  atkMult: 1.0 },
    miniboss: { hpMult: 2.0,       atkMult: 2.0 },
    boss:     { hpMult: 4.0,       atkMult: 3.5 },
  }[enemyKind];

  return {
    hp:    Math.round(stageData.enemyHp  * eStats.hp  * base.hpMult),
    atk:   Math.round(stageData.enemyAtk * eStats.atk * base.atkMult),
    speed: eStats.speed,
    score: eStats.score,
  };
}

// ---------------------------------------------------------------
//  Spawn X position (always off-screen right)
// ---------------------------------------------------------------
export function spawnX(scrollX: number, canvasWidth: number): number {
  return scrollX + canvasWidth + 80 + Math.random() * 80;
}
