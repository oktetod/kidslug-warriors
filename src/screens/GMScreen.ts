// ============================================================
//  KIDSLUG WARRIORS v2 - GM SCREEN
//  Game Master admin tools (local + Firebase)
// ============================================================

import {
  AdvancedDynamicTexture, Container, Rectangle,
  TextBlock, Button, StackPanel, ScrollViewer, InputText,
} from '@babylonjs/gui';

import { SaveData }          from '../network/SaveSystem';
import { CHARACTERS, WEAPONS, ITEMS, STAGES } from '../data/GameData';
import { FONT_PIXEL, FONT_MONO, makeText, makeBtn } from './ScreenManager';

export interface GMCallbacks {
  onBack:           () => void;
  onSave:           (ns: SaveData) => void;
  onGetAllPlayers?: () => Promise<any[]>;
  onBanPlayer?:     (uid: string) => Promise<boolean>;
  currentUid?:      string;
}

function deepClone<T>(o: T): T { return JSON.parse(JSON.stringify(o)); }

export function buildGMScreen(
  gui:       AdvancedDynamicTexture,
  save:      SaveData,
  callbacks: GMCallbacks,
): Container {
  const root = new Container();
  root.width = '100%';
  root.height = '100%';
  const scroll = new ScrollViewer();
  scroll.width      = '100%';
  scroll.height     = '100%';
  scroll.background = '#030308';
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

  const hTitle = makeText('GM PANEL', 10, '#f44336');
  hTitle.height = '32px';
  hdr.addControl(hTitle);

  // Status row
  const statusTxt = makeText(`GM: ${save.gm?.isGM ? 'AKTIF' : 'LOCAL'} | LV.${save.player.level} | KOIN: ${save.player.coins}`, 6, '#666', FONT_MONO);
  statusTxt.height = '14px';
  stack.addControl(statusTxt);

  // Message area
  const msgTxt = makeText('', 7, '#4caf50', FONT_MONO);
  msgTxt.height = '16px';
  stack.addControl(msgTxt);

  function flash(msg: string, color = '#4caf50') {
    msgTxt.text  = msg;
    msgTxt.color = color;
    setTimeout(() => { msgTxt.text = ''; }, 2500);
  }

  function addSection(title: string) {
    const sep = makeText(`-- ${title} --`, 6, '#333', FONT_MONO);
    sep.height = '14px';
    stack.addControl(sep);
  }

  // ── LOCAL TOOLS ──────────────────────────────────────────

  addSection('KOIN');

  const coinRow = new StackPanel();
  coinRow.isVertical = false;
  coinRow.height     = '40px';
  coinRow.spacing    = 8;
  stack.addControl(coinRow);

  for (const amount of [1000, 5000, 50000]) {
    const btn = makeBtn(`+${amount}`, '#ffd70022', '#ffd700', '#ffd700', '90px', '36px');
    btn.fontSize = 7;
    btn.onPointerClickObservable.add(() => {
      const ns = deepClone(save);
      ns.player.coins += amount;
      callbacks.onSave(ns);
      flash(`+${amount} koin!`);
    });
    coinRow.addControl(btn);
  }

  addSection('LEVEL');

  const lvRow = new StackPanel();
  lvRow.isVertical = false;
  lvRow.height     = '40px';
  lvRow.spacing    = 8;
  stack.addControl(lvRow);

  for (const lv of [10, 50, 100]) {
    const btn = makeBtn(`LV.${lv}`, '#ce93d822', '#ce93d8', '#ce93d8', '90px', '36px');
    btn.fontSize = 7;
    btn.onPointerClickObservable.add(() => {
      const ns = deepClone(save);
      ns.player.level = lv;
      ns.player.exp   = 0;
      callbacks.onSave(ns);
      flash(`Player diset ke LV.${lv}`);
    });
    lvRow.addControl(btn);
  }

  addSection('UNLOCK STAGES');

  const stageRow = new StackPanel();
  stageRow.isVertical = false;
  stageRow.height     = '40px';
  stageRow.spacing    = 8;
  stack.addControl(stageRow);

  for (const upTo of [5, 10, 25]) {
    const btn = makeBtn(`S1-${upTo}`, '#42a5f522', '#42a5f5', '#42a5f5', '90px', '36px');
    btn.fontSize = 7;
    btn.onPointerClickObservable.add(() => {
      const ns = deepClone(save);
      ns.player.totalStagesCleared = upTo;
      for (let i = 1; i <= upTo; i++) {
        if (!ns.stages[i]) ns.stages[i] = { cleared:false, clears:0, bestCoins:0 };
        ns.stages[i].cleared = true;
        ns.stages[i].clears  = Math.max(ns.stages[i].clears ?? 0, 1);
      }
      callbacks.onSave(ns);
      flash(`Stage 1-${upTo} di-unlock!`);
    });
    stageRow.addControl(btn);
  }

  addSection('QUICK TOOLS');

  const toolRow = new StackPanel();
  toolRow.isVertical = false;
  toolRow.height     = '40px';
  toolRow.spacing    = 8;
  stack.addControl(toolRow);

  const btnAllWeapons = makeBtn('SEMUA SENJATA', '#1976d222', '#42a5f5', '#42a5f5', '140px', '36px');
  btnAllWeapons.fontSize = 6;
  btnAllWeapons.onPointerClickObservable.add(() => {
    const ns = deepClone(save);
    WEAPONS.forEach(w => { ns.weapons[w.id] = (ns.weapons[w.id] ?? 0) + 1; });
    callbacks.onSave(ns);
    flash('Semua senjata diberikan!');
  });
  toolRow.addControl(btnAllWeapons);

  const btnAllItems = makeBtn('ITEM x99', '#2e7d3222', '#4caf50', '#4caf50', '100px', '36px');
  btnAllItems.fontSize = 6;
  btnAllItems.onPointerClickObservable.add(() => {
    const ns = deepClone(save);
    ITEMS.forEach(it => { ns.items[it.id] = 99; });
    callbacks.onSave(ns);
    flash('Semua item x99!');
  });
  toolRow.addControl(btnAllItems);

  addSection('UNLOCK KARAKTER');

  const charRow = new StackPanel();
  charRow.isVertical = false;
  charRow.height     = '40px';
  charRow.spacing    = 8;
  stack.addControl(charRow);

  const btnAllChars = makeBtn('SEMUA LV.50', '#7b1fa222', '#ce93d8', '#ce93d8', '130px', '36px');
  btnAllChars.fontSize = 6;
  btnAllChars.onPointerClickObservable.add(() => {
    const ns = deepClone(save);
    CHARACTERS.forEach(c => {
      ns.characters[c.id].owned = true;
      ns.characters[c.id].level = 50;
    });
    callbacks.onSave(ns);
    flash('Semua karakter unlocked & LV.50!');
  });
  charRow.addControl(btnAllChars);

  const btnResetQuests = makeBtn('RESET QUEST', '#ff980022', '#ff9800', '#ff9800', '120px', '36px');
  btnResetQuests.fontSize = 6;
  btnResetQuests.onPointerClickObservable.add(() => {
    const ns = deepClone(save);
    ns.quests = {};
    callbacks.onSave(ns);
    flash('Semua quest direset!');
  });
  charRow.addControl(btnResetQuests);

  addSection('DANGER ZONE');

  const dangerRow = new StackPanel();
  dangerRow.isVertical = false;
  dangerRow.height     = '40px';
  dangerRow.spacing    = 8;
  stack.addControl(dangerRow);

  const btnReset = makeBtn('RESET DATA', '#f4433622', '#f44336', '#f44336', '130px', '36px');
  btnReset.fontSize = 6;
  btnReset.onPointerClickObservable.add(() => {
    const ns = deepClone(save);
    ns.player.coins = 9999;
    ns.player.level = 1;
    ns.player.exp   = 0;
    ns.stages  = {};
    ns.quests  = {};
    callbacks.onSave(ns);
    flash('Data direset!', '#f44336');
  });
  dangerRow.addControl(btnReset);

  // Version footer
  const vTxt = makeText('GM PANEL v2.0 | KID SLUG WARRIORS', 5, '#1a1a2a', FONT_MONO);
  vTxt.height = '12px';
  stack.addControl(vTxt);

  return root;
}
