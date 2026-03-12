// ============================================================
//  KIDSLUG WARRIORS v2 - STAGE SELECT SCREEN
// ============================================================

import {
  AdvancedDynamicTexture, Container, Rectangle,
  TextBlock, Button, StackPanel, ScrollViewer, Grid,
} from '@babylonjs/gui';

import { SaveData }   from '../network/SaveSystem';
import { STAGES }     from '../data/GameData';
import { getHardModeMultipliers } from '../systems/CombatSystem';
import { getStageQuestStats }     from '../systems/ProgressSystem';
import { makeText, makeBtn, makeProgressBar, FONT_MONO } from './ScreenManager';

export function buildStageScreen(
  gui:    AdvancedDynamicTexture,
  save:   SaveData,
  onPlay: (stageId: number) => void,
  onBack: () => void,
): Container {
  const root = new Container();
  root.widthInPixels  = gui.getSize().width;
  root.heightInPixels = gui.getSize().height;

  const scroll = new ScrollViewer();
  scroll.width  = '100%';
  scroll.height = '100%';
  scroll.background = '#050510';
  scroll.thickness  = 0;
  root.addControl(scroll);

  const stack = new StackPanel();
  stack.width    = '100%';
  stack.isVertical = true;
  stack.paddingLeft   = '12px';
  stack.paddingRight  = '12px';
  stack.paddingTop    = '12px';
  stack.paddingBottom = '60px';
  stack.spacing = 8;
  scroll.addControl(stack);

  // Header
  const hdr = new Grid();
  hdr.height = '36px';
  hdr.addColumnDefinition(60,  true);
  hdr.addColumnDefinition(1,   false);

  const backBtn = makeBtn('KEMBALI', 'transparent', '#333', '#aaa', '54px', '28px');
  backBtn.onPointerClickObservable.add(() => onBack());
  hdr.addControl(backBtn, 0, 0);

  const title = makeText('PILIH STAGE', 9, '#ffd700');
  title.horizontalAlignment = 0;
  title.paddingLeft = '8px';
  hdr.addControl(title, 0, 1);
  stack.addControl(hdr);

  // Stage cards
  for (const stage of STAGES) {
    const locked  = stage.unlockReq > save.player.totalStagesCleared;
    const cleared = save.stages[stage.id]?.cleared ?? false;
    const clears  = save.stages[stage.id]?.clears  ?? 0;
    const mults   = getHardModeMultipliers(stage.id);
    const qStats  = getStageQuestStats(save, stage.id);

    const card = new Rectangle();
    card.height     = '80px';
    card.background = locked ? '#0a0a14' : `rgba(0,0,0,0.4)`;
    card.thickness  = 1;
    // @ts-ignore
    card.borderColor = locked ? '#1a1a1a' : cleared ? '#ffd70044' : stage.color + '44';
    card.cornerRadius = 12;
    card.alpha = locked ? 0.45 : 1;

    const g = new Grid();
    g.addColumnDefinition(50, true);
    g.addColumnDefinition(1, false);
    g.addColumnDefinition(80, true);
    card.addControl(g);

    // Stage ID / Name
    const nameRow = new StackPanel();
    nameRow.isVertical = true;
    nameRow.horizontalAlignment = 0;
    nameRow.paddingLeft = '8px';
    nameRow.paddingTop  = '6px';
    g.addControl(nameRow, 0, 1);

    const nameTxt = makeText(`S${stage.id}: ${stage.name}`, 7, cleared ? '#ffd700' : '#eee');
    nameTxt.height = '18px';
    nameRow.addControl(nameTxt);

    const diffTxt = makeText(
      `${stage.difficulty}  Koin:${stage.coins[0]}-${stage.coins[1]}  ${mults.label ?? ''}`,
      5, locked ? '#333' : '#555', FONT_MONO,
    );
    diffTxt.height = '14px';
    nameRow.addControl(diffTxt);

    if (!locked) {
      const pb = makeProgressBar(180, 5, qStats.claimed / qStats.total, stage.color);
      pb.height = '8px';
      nameRow.addControl(pb);
    }

    // Play button (right column)
    if (!locked) {
      const playBtn = makeBtn('MAIN', stage.color, stage.color, '#fff', '70px', '32px');
      playBtn.onPointerClickObservable.add(() => onPlay(stage.id));
      g.addControl(playBtn, 0, 2);
    } else {
      const lockTxt = makeText(`KUNCI\nStage ${stage.unlockReq}`, 5, '#333');
      g.addControl(lockTxt, 0, 2);
    }

    if (cleared) {
      const clearTxt = makeText(`x${clears}`, 7, '#ffd700');
      clearTxt.horizontalAlignment = 2;
      clearTxt.verticalAlignment   = 0;
      clearTxt.paddingRight = '8px';
      clearTxt.paddingTop   = '4px';
      card.addControl(clearTxt);
    }

    stack.addControl(card);
  }

  return root;
}
