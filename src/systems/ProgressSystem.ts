// ============================================================
//  KIDSLUG WARRIORS v2 - PROGRESS SYSTEM
//  EXP gain, level-ups, quest tracking, achievement checks
// ============================================================

import { SaveData }              from '../network/SaveSystem';
import { applyExpGain }          from './CombatSystem';

// ---------------------------------------------------------------
//  QUEST TYPES
// ---------------------------------------------------------------
export type QuestType =
  | 'complete_times'
  | 'kill_enemies'
  | 'collect_coins'
  | 'kill_boss'
  | 'complete_nodamage';

export interface QuestDef {
  id:      string;
  stageId: number;
  type:    QuestType;
  target:  number;
  name:    string;
  desc:    string;
  reward:  { coins: number; exp: number };
}

// ---------------------------------------------------------------
//  GENERATE QUESTS FOR A STAGE
// ---------------------------------------------------------------
export function generateStageQuests(stageId: number): QuestDef[] {
  const s         = stageId;
  const expBase   = s * 80;
  const coinBase  = s * 40;
  const quests: QuestDef[] = [];

  quests.push({
    id: `s${s}_q1`, stageId: s,
    type: 'complete_times', target: 1,
    name: 'Penjelajah Baru',
    desc: `Selesaikan Stage ${s} satu kali`,
    reward: { coins: coinBase * 2, exp: expBase * 2 },
  });

  quests.push({
    id: `s${s}_q2`, stageId: s,
    type: 'complete_times', target: s <= 5 ? 3 : s <= 10 ? 4 : 5,
    name: 'Veteran Stage',
    desc: `Selesaikan Stage ${s} sebanyak ${s <= 5 ? 3 : s <= 10 ? 4 : 5} kali`,
    reward: { coins: coinBase * 4, exp: expBase * 4 },
  });

  const killTarget = s <= 5 ? 30 : s <= 10 ? 50 : s <= 15 ? 80 : s <= 20 ? 100 : 120;
  quests.push({
    id: `s${s}_q3`, stageId: s,
    type: 'kill_enemies', target: killTarget,
    name: 'Pembantai Massal',
    desc: `Kalahkan ${killTarget} musuh di Stage ${s}`,
    reward: { coins: coinBase * 3, exp: expBase * 3 },
  });

  if (s >= 2) {
    const bossKills = s <= 5 ? 2 : s <= 10 ? 3 : s <= 15 ? 4 : 5;
    quests.push({
      id: `s${s}_q4`, stageId: s,
      type: 'kill_boss', target: bossKills,
      name: 'Pemburu Boss',
      desc: `Kalahkan Boss Stage ${s} sebanyak ${bossKills} kali`,
      reward: { coins: coinBase * 5, exp: expBase * 5 },
    });
  }

  if (s >= 3) {
    quests.push({
      id: `s${s}_q5`, stageId: s,
      type: 'complete_nodamage', target: 1,
      name: 'Tak Tersentuh',
      desc: `Selesaikan Stage ${s} tanpa terkena damage`,
      reward: { coins: coinBase * 6, exp: expBase * 6 },
    });
  }

  return quests;
}

// ---------------------------------------------------------------
//  QUEST HELPER FUNCTIONS
// ---------------------------------------------------------------
export function isQuestCompleted(save: SaveData, questId: string, quest: QuestDef): boolean {
  const prog = save.quests[questId];
  return (prog?.progress ?? 0) >= quest.target;
}

export function isQuestClaimed(save: SaveData, questId: string): boolean {
  return save.quests[questId]?.claimed === true;
}

export function getQuestProgress(save: SaveData, questId: string): { progress: number } {
  return { progress: save.quests[questId]?.progress ?? 0 };
}

// ---------------------------------------------------------------
//  RUN RESULT - update save after a stage run
// ---------------------------------------------------------------
export interface RunResult {
  stageId:    number;
  kills:      number;
  coinsEarned: number;
  bossKilled: boolean;
  noDamage:   boolean;
}

export function applyRunResult(save: SaveData, result: RunResult): SaveData {
  const ns: SaveData = JSON.parse(JSON.stringify(save));
  const { stageId, kills, coinsEarned, bossKilled, noDamage } = result;

  // Player stats
  ns.player.coins            += coinsEarned;
  ns.player.totalCoinsEarned += coinsEarned;
  ns.player.totalKills       = (ns.player.totalKills ?? 0) + kills;
  ns.player.totalStagesCleared = Math.max(ns.player.totalStagesCleared, stageId);
  ns.player.highestStage       = Math.max(ns.player.highestStage ?? 0, stageId);

  // Stage record
  if (!ns.stages[stageId]) ns.stages[stageId] = { cleared: false, bestCoins: 0, clears: 0 };
  ns.stages[stageId].cleared    = true;
  ns.stages[stageId].clears     = (ns.stages[stageId].clears ?? 0) + 1;
  ns.stages[stageId].bestCoins  = Math.max(ns.stages[stageId].bestCoins ?? 0, coinsEarned);

  // EXP from stage
  const stageExp = stageId * 100;
  const { level, exp, leveledUp } = applyExpGain(
    ns.player.level, ns.player.exp, stageExp
  );
  ns.player.level = level;
  ns.player.exp   = exp;

  // Update quests
  const quests = generateStageQuests(stageId);
  for (const q of quests) {
    const cur = ns.quests[q.id] ?? { progress: 0, completed: false, claimed: false };
    if (cur.claimed) continue;
    let newProg = cur.progress;
    switch (q.type) {
      case 'complete_times':    newProg += 1;              break;
      case 'kill_enemies':      newProg += kills;          break;
      case 'collect_coins':     newProg += coinsEarned;    break;
      case 'kill_boss':         if (bossKilled) newProg += 1; break;
      case 'complete_nodamage': if (noDamage)   newProg += 1; break;
    }
    ns.quests[q.id] = {
      progress:  newProg,
      completed: newProg >= q.target,
      claimed:   cur.claimed,
    };
  }

  return ns;
}

// ---------------------------------------------------------------
//  CLAIM QUEST REWARD
// ---------------------------------------------------------------
export function claimQuestReward(save: SaveData, questId: string, quest: QuestDef): SaveData {
  const prog = save.quests[questId];
  if (!prog || !prog.completed || prog.claimed) return save;

  const ns: SaveData = JSON.parse(JSON.stringify(save));
  ns.quests[questId] = { ...prog, claimed: true };
  ns.player.coins   += quest.reward.coins;

  const { level, exp } = applyExpGain(
    ns.player.level, ns.player.exp, quest.reward.exp
  );
  ns.player.level = level;
  ns.player.exp   = exp;

  return ns;
}

// ---------------------------------------------------------------
//  STAGE QUEST STATS (for progress bar in stage select)
// ---------------------------------------------------------------
export function getStageQuestStats(
  save: SaveData, stageId: number
): { total: number; completed: number; claimed: number } {
  const quests = generateStageQuests(stageId);
  let completed = 0, claimed = 0;
  for (const q of quests) {
    const p = save.quests[q.id];
    if (p?.progress >= q.target) completed++;
    if (p?.claimed) claimed++;
  }
  return { total: quests.length, completed, claimed };
}
