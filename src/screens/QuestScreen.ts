// ============================================================
//  KIDSLUG WARRIORS v2 - QUEST SCREEN
//  Per-stage quests with coin and EXP rewards
// ============================================================

import {
  AdvancedDynamicTexture, Container, Rectangle,
  TextBlock, Button, StackPanel, ScrollViewer,
} from '@babylonjs/gui';

import { SaveData }    from '../network/SaveSystem';
import { STAGES }      from '../data/GameData';
import {
  generateStageQuests, getStageQuestStats,
  isQuestCompleted, isQuestClaimed,
  claimQuestReward, getQuestProgress,
} from '../systems/ProgressSystem';
import { expToNextLevel } from '../systems/CombatSystem';
import { FONT_PIXEL, FONT_MONO, makeText, makeBtn, makeProgressBar } from './ScreenManager';

export interface QuestCallbacks {
  onBack:      () => void;
  onSave:      (ns: SaveData) => void;
  onPlayStage: (stageId: number) => void;
}

function deepClone<T>(o: T): T { return JSON.parse(JSON.stringify(o)); }

export function buildQuestScreen(
  gui:       AdvancedDynamicTexture,
  save:      SaveData,
  callbacks: QuestCallbacks,
): Container {
  const root = new Container();
  root.width = '100%';
  root.height = '100%';
  const scroll = new ScrollViewer();
  scroll.width      = '100%';
  scroll.height     = '100%';
  scroll.background = '#050510';
  scroll.thickness  = 0;
  root.addControl(scroll);

  const stack = new StackPanel();
  stack.width      = '100%';
  stack.isVertical = true;
  stack.paddingLeft = stack.paddingRight = '12px';
  stack.paddingTop  = '12px';
  stack.paddingBottom = '40px';
  stack.spacing     = 10;
  scroll.addControl(stack);

  // Header
  const hdr = new StackPanel();
  hdr.isVertical = false;
  hdr.height     = '36px';
  hdr.spacing    = 10;
  stack.addControl(hdr);

  const btnBack = makeBtn('< BACK', 'transparent', '#444', '#aaa', '80px', '32px');
  btnBack.fontSize = 7;
  btnBack.onPointerClickObservable.add(() => callbacks.onBack());
  hdr.addControl(btnBack);

  const hTitle = makeText('QUEST', 10, '#ffd700');
  hTitle.height = '32px';
  hdr.addControl(hTitle);

  // Player EXP bar
  const playerLevel = save.player.level ?? 1;
  const playerExp   = save.player.exp ?? 0;
  const expNeeded   = expToNextLevel(playerLevel);
  const expBar      = makeProgressBar(280, 8, playerExp / expNeeded, '#ce93d8');
  expBar.height     = '12px';
  stack.addControl(expBar);

  const expTxt = makeText(`LV.${playerLevel}  EXP: ${playerExp}/${expNeeded}`, 6, '#ce93d8', FONT_MONO);
  expTxt.height = '14px';
  stack.addControl(expTxt);

  // Stages with quests
  const reachable = STAGES.filter(s => s.unlockReq <= save.player.totalStagesCleared);

  for (const stage of reachable) {
    const stats = getStageQuestStats(save, stage.id);
    const quests = generateStageQuests(stage.id);

    // Stage header
    const sHdr = new Rectangle();
    sHdr.width       = '100%';
    sHdr.height      = '50px';
    sHdr.background  = `${stage.color}18`;
    sHdr.thickness   = 1;
    sHdr.color       = stage.color + '44';
    sHdr.cornerRadius = 10;
    stack.addControl(sHdr);

    const sHdrStack = new StackPanel();
    sHdrStack.isVertical = false;
    sHdrStack.spacing    = 8;
    sHdrStack.paddingLeft = '10px';
    sHdr.addControl(sHdrStack);

    const sStageTxt = makeText(`S${stage.id}: ${stage.name}`, 8, stage.color);
    sStageTxt.height = '40px';
    sStageTxt.width  = '200px';
    sHdrStack.addControl(sStageTxt);

    const sQuestTxt = makeText(`${stats.claimed}/${stats.total} selesai`, 6, '#888', FONT_MONO);
    sQuestTxt.height = '40px';
    sHdrStack.addControl(sQuestTxt);

    const btnPlay = makeBtn('MAIN', stage.color+'44', stage.color, '#fff', '70px', '30px');
    btnPlay.fontSize = 7;
    btnPlay.onPointerClickObservable.add(() => callbacks.onPlayStage(stage.id));
    sHdrStack.addControl(btnPlay);

    // Quest items
    for (const quest of quests) {
      const prog    = getQuestProgress(save, quest.id);
      const done    = isQuestCompleted(save, quest.id, quest);
      const claimed = isQuestClaimed(save, quest.id);
      const pct     = Math.min(1, prog.progress / quest.target);

      const qCard = new Rectangle();
      qCard.width       = '100%';
      qCard.height      = '80px';
      qCard.background  = claimed ? 'rgba(76,175,80,0.08)' : done ? 'rgba(255,215,0,0.06)' : 'rgba(0,0,0,0.25)';
      qCard.thickness   = 1;
      qCard.color       = claimed ? '#4caf5033' : done ? '#ffd70033' : '#1a1a2a';
      qCard.cornerRadius = 8;
      stack.addControl(qCard);

      const qInner = new StackPanel();
      qInner.isVertical = true;
      qInner.spacing    = 3;
      qInner.paddingLeft = qInner.paddingRight = '10px';
      qInner.paddingTop  = '8px';
      qCard.addControl(qInner);

      const qNameRow = new StackPanel();
      qNameRow.isVertical = false;
      qNameRow.height     = '20px';
      qNameRow.spacing    = 6;
      qInner.addControl(qNameRow);

      const qNameTxt = makeText((claimed ? '[DONE] ' : done ? '[KLAIM!] ' : '') + quest.name, 7, claimed ? '#4caf50' : done ? '#ffd700' : '#aaa');
      qNameTxt.height = '20px';
      qNameRow.addControl(qNameTxt);

      const qDescTxt = makeText(quest.desc, 6, '#555', FONT_MONO);
      qDescTxt.height = '14px';
      qInner.addControl(qDescTxt);

      const qProgBar = makeProgressBar(240, 5, pct, done ? '#ffd700' : '#333');
      qProgBar.height = '8px';
      qInner.addControl(qProgBar);

      const qRewardRow = new StackPanel();
      qRewardRow.isVertical = false;
      qRewardRow.height     = '22px';
      qRewardRow.spacing    = 12;
      qInner.addControl(qRewardRow);

      const qCoins = makeText(`KOIN +${quest.reward.coins}`, 6, '#ffd700', FONT_MONO);
      qCoins.height = '20px';
      qRewardRow.addControl(qCoins);

      const qExp = makeText(`EXP +${quest.reward.exp}`, 6, '#ce93d8', FONT_MONO);
      qExp.height = '20px';
      qRewardRow.addControl(qExp);

      const qProg = makeText(`${prog.progress}/${quest.target}`, 6, '#555', FONT_MONO);
      qProg.height = '20px';
      qRewardRow.addControl(qProg);

      if (done && !claimed) {
        const btnClaim = makeBtn('KLAIM', '#ffd70022', '#ffd700', '#ffd700', '70px', '20px');
        btnClaim.fontSize = 6;
        btnClaim.onPointerClickObservable.add(() => {
          const ns = claimQuestReward(deepClone(save), quest.id, quest);
          callbacks.onSave(ns);
        });
        qRewardRow.addControl(btnClaim);
      }
    }
  }

  if (reachable.length === 0) {
    const noQ = makeText('Selesaikan Stage 1 untuk membuka Quest!', 8, '#444', FONT_MONO);
    noQ.height = '22px';
    stack.addControl(noQ);
  }

  return root;
}
