// ============================================================
//  KIDSLUG WARRIORS v2 - GACHA SCREEN
//  Pull weapons and equipment. Pity at 90.
// ============================================================

import {
  AdvancedDynamicTexture, Container, Rectangle,
  TextBlock, Button, StackPanel, ScrollViewer, Grid,
} from '@babylonjs/gui';

import { SaveData }                from '../network/SaveSystem';
import { WEAPONS, EQUIPMENT, GACHA_POOLS, RARITY_COLORS } from '../data/GameData';
import { FONT_PIXEL, FONT_MONO, makeText, makeBtn, makeProgressBar } from './ScreenManager';

export interface GachaCallbacks {
  onBack:   () => void;
  onSave:   (ns: SaveData) => void;
}

function deepClone<T>(o: T): T { return JSON.parse(JSON.stringify(o)); }

function rarityColor(r: string): string {
  return (RARITY_COLORS as Record<string,string>)[r] ?? '#9e9e9e';
}

function pullItem(poolKey: keyof typeof GACHA_POOLS, save: SaveData): typeof WEAPONS[0] | typeof EQUIPMENT[0] {
  const pool  = GACHA_POOLS[poolKey];
  const pity  = save.gacha[poolKey].pity;
  let rarity: string;

  if (pity >= 89) {
    rarity = 'legendary';
  } else {
    const boost = pity >= 75 ? (pity - 74) * 6 : 0;
    const rates: [string, number][] = [
      ['legendary', Math.min(100, pool.rates.legendary + boost)],
      ['epic',      pool.rates.epic],
      ['rare',      pool.rates.rare],
      ['common',    pool.rates.common],
    ];
    const roll = Math.random() * 100;
    let c = 0; rarity = 'common';
    for (const [r, p] of rates) { c += p; if (roll < c) { rarity = r; break; } }
  }

  const playerLevel = save.player.level;
  const source = poolKey === 'equipment' ? EQUIPMENT
               : poolKey === 'weapon'    ? WEAPONS
               : [...WEAPONS, ...EQUIPMENT];

  const eligible = source.filter((w: any) => w.rarity === rarity && (w.levelReq ?? 1) <= playerLevel);
  const pool2    = eligible.length > 0 ? eligible : source.filter((w: any) => (w.levelReq ?? 1) <= playerLevel);
  return pool2[Math.floor(Math.random() * pool2.length)] ?? source[0];
}

export function buildGachaScreen(
  gui:       AdvancedDynamicTexture,
  save:      SaveData,
  callbacks: GachaCallbacks,
): Container {
  const root = new Container();
  root.width = '100%';
  root.height = '100%';
  const scroll = new ScrollViewer();
  scroll.width      = '100%';
  scroll.height     = '100%';
  scroll.background = '#0d0020';
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

  const hTitle = makeText('GACHA', 10, '#ce93d8');
  hTitle.height = '32px';
  hdr.addControl(hTitle);

  const coinDisp = makeText(`KOIN: ${save.player.coins}`, 8, '#ffd700', FONT_MONO);
  coinDisp.height = '32px';
  hdr.addControl(coinDisp);

  // Pool selector tabs
  const poolNames: (keyof typeof GACHA_POOLS)[] = ['weapon', 'equipment', 'mixed'];
  const poolLabels: Record<string, string> = { weapon:'WEAPON', equipment:'EQUIP', mixed:'LUCKY' };
  let activePool: keyof typeof GACHA_POOLS = 'weapon';

  const tabRow = new StackPanel();
  tabRow.isVertical = false;
  tabRow.height     = '36px';
  tabRow.spacing    = 6;
  stack.addControl(tabRow);

  const tabBtns: Button[] = [];
  for (const pk of poolNames) {
    const tb = makeBtn(poolLabels[pk], pk === activePool ? '#7b1fa244' : 'transparent', '#7b1fa2', pk === activePool ? '#ce93d8' : '#666', '100px', '32px');
    tb.fontSize = 7;
    tabBtns.push(tb);
    tabRow.addControl(tb);
  }

  // Rate info
  const rateInfo = makeText('RATES: CMN 50%  RARE 30%  EPIC 15%  LEG 5%', 6, '#444', FONT_MONO);
  rateInfo.height = '14px';
  stack.addControl(rateInfo);

  // Pity bar
  const pityLabel = makeText(`PITY: ${save.gacha[activePool].pity} / 89`, 7, '#888', FONT_MONO);
  pityLabel.height = '14px';
  stack.addControl(pityLabel);
  const pityBar = makeProgressBar(280, 6, save.gacha[activePool].pity / 89, '#ce93d8');
  pityBar.height = '10px';
  stack.addControl(pityBar);

  // Pull buttons
  const pullRow = new StackPanel();
  pullRow.isVertical = false;
  pullRow.height     = '64px';
  pullRow.spacing    = 10;
  stack.addControl(pullRow);

  const pool = GACHA_POOLS[activePool];
  const btnPull1  = makeBtn(`1x  KOIN ${pool.cost.single}`, '#7b1fa2', '#ce93d8', '#fff', '140px', '56px');
  btnPull1.fontSize = 7;
  const btnPull10 = makeBtn(`10x  KOIN ${pool.cost.ten}`, '#880e4f', '#f48fb1', '#fff', '140px', '56px');
  btnPull10.fontSize = 7;
  pullRow.addControl(btnPull1);
  pullRow.addControl(btnPull10);

  // Results container
  const resultsPanel = new StackPanel();
  resultsPanel.isVertical = true;
  resultsPanel.spacing    = 6;
  resultsPanel.width      = '100%';
  stack.addControl(resultsPanel);

  function doRefreshResults(items: any[]) {
    resultsPanel.clearControls();
    const title = makeText('HASIL GACHA:', 8, '#ffd700');
    title.height = '18px';
    resultsPanel.addControl(title);

    for (const item of items) {
      const row = new Rectangle();
      row.height     = '44px';
      row.width      = '100%';
      row.background = 'rgba(0,0,0,0.35)';
      row.thickness  = 1;
      row.color      = rarityColor(item.rarity) + '66';
      row.cornerRadius = 6;
      resultsPanel.addControl(row);

      const rowStack = new StackPanel();
      rowStack.isVertical = false;
      rowStack.spacing    = 8;
      rowStack.paddingLeft = '8px';
      row.addControl(rowStack);

      const rarBox = new Rectangle();
      rarBox.width       = '60px';
      rarBox.height      = '28px';
      rarBox.background  = rarityColor(item.rarity) + '22';
      rarBox.thickness   = 1;
      rarBox.color       = rarityColor(item.rarity);
      rarBox.cornerRadius = 4;
      rowStack.addControl(rarBox);

      const rarTxt = makeText(String(item.rarity).toUpperCase().slice(0,3), 6, rarityColor(item.rarity));
      rarTxt.height = '28px';
      rarBox.addControl(rarTxt);

      const nameTxt = makeText(item.name, 8, '#eee');
      nameTxt.height = '28px';
      rowStack.addControl(nameTxt);
    }
  }

  function doPull(count: number) {
    const poolData = GACHA_POOLS[activePool];
    const cost = count === 1 ? poolData.cost.single : poolData.cost.ten;
    if (save.player.coins < cost) return;

    const ns = deepClone(save);
    ns.player.coins -= cost;
    const pulled: any[] = [];

    for (let i = 0; i < count; i++) {
      const item = pullItem(activePool, ns);
      pulled.push(item);
      if (item.rarity === 'legendary') ns.gacha[activePool].pity = 0;
      else ns.gacha[activePool].pity = (ns.gacha[activePool].pity ?? 0) + 1;
      if ((item as any).slot) ns.equipment[item.id] = (ns.equipment[item.id] ?? 0) + 1;
      else                    ns.weapons[item.id]   = (ns.weapons[item.id]   ?? 0) + 1;
    }
    ns.gacha[activePool].pulls += count;
    callbacks.onSave(ns);
    doRefreshResults(pulled);
  }

  btnPull1.onPointerClickObservable.add(() => doPull(1));
  btnPull10.onPointerClickObservable.add(() => doPull(10));

  return root;
}
