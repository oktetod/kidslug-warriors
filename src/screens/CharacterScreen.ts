// ============================================================
//  KIDSLUG WARRIORS v2 - CHARACTER SCREEN
//  View, unlock, upgrade, and equip characters
// ============================================================

import {
  AdvancedDynamicTexture, Container, Rectangle,
  TextBlock, Button, StackPanel, ScrollViewer, Grid,
} from '@babylonjs/gui';

import { SaveData }        from '../network/SaveSystem';
import { CHARACTERS, EQUIPMENT, RARITY_COLORS } from '../data/GameData';
import { calcCharStats, upgradeCost } from '../systems/CombatSystem';
import { FONT_PIXEL, FONT_MONO, makeText, makeBtn, makeProgressBar } from './ScreenManager';

export interface CharacterCallbacks {
  onBack: () => void;
  onSave: (ns: SaveData) => void;
}

function deepClone<T>(o: T): T { return JSON.parse(JSON.stringify(o)); }

export function buildCharacterScreen(
  gui:       AdvancedDynamicTexture,
  save:      SaveData,
  callbacks: CharacterCallbacks,
): Container {
  const root = new Container();
  root.width = '100%';
  root.height = '100%';
  const scroll = new ScrollViewer();
  scroll.width      = '100%';
  scroll.height     = '100%';
  scroll.background = '#060610';
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

  const hTitle = makeText('KARAKTER', 10, '#ffd700');
  hTitle.height = '32px';
  hdr.addControl(hTitle);

  const coinTxt = makeText(`KOIN: ${save.player.coins}`, 8, '#ffd700', FONT_MONO);
  coinTxt.height = '32px';
  hdr.addControl(coinTxt);

  // Character list
  for (const char of CHARACTERS) {
    const charSave = save.characters[char.id] ?? { owned:false, level:1, equip:{helmet:null,armor:null,boots:null,accessory:null}, activeSkin:char.id+'_default' };
    const isActive = save.activeCharId === char.id;
    const stats    = calcCharStats(char.id, save);
    const lvUpCost = upgradeCost(char.id, charSave.level ?? 1);

    const card = new Rectangle();
    card.width       = '100%';
    card.height      = '160px';
    card.background  = isActive ? `${char.color}22` : 'rgba(0,0,0,0.3)';
    card.thickness   = 2;
    card.color       = isActive ? char.color : (charSave.owned ? '#333' : '#1a1a1a');
    card.cornerRadius = 12;
    stack.addControl(card);

    const inner = new StackPanel();
    inner.isVertical  = true;
    inner.spacing     = 6;
    inner.paddingLeft = inner.paddingRight = '12px';
    inner.paddingTop  = '10px';
    card.addControl(inner);

    // Name + title row
    const nameRow = new StackPanel();
    nameRow.isVertical = false;
    nameRow.height     = '24px';
    nameRow.spacing    = 8;
    inner.addControl(nameRow);

    const nameT = makeText(char.name, 9, charSave.owned ? char.accentColor : '#444');
    nameT.height = '22px';
    nameRow.addControl(nameT);

    const titleT = makeText(char.title, 7, '#555', FONT_MONO);
    titleT.height = '22px';
    nameRow.addControl(titleT);

    if (!charSave.owned) {
      const lockT = makeText('[LOCKED]', 7, '#f44336');
      lockT.height = '22px';
      nameRow.addControl(lockT);
    }

    // Stats row
    const statsT = makeText(
      `HP:${stats.hp}  ATK:${stats.atk}  DEF:${stats.def}  SPD:${stats.spd}  CRIT:${stats.crit}%`,
      6, '#888', FONT_MONO,
    );
    statsT.height = '14px';
    inner.addControl(statsT);

    // Level bar
    const lv = charSave.level ?? 1;
    const lvRow = new StackPanel();
    lvRow.isVertical = false;
    lvRow.height     = '14px';
    lvRow.spacing    = 8;
    inner.addControl(lvRow);

    const lvTxt = makeText(`LV.${lv}/100`, 6, '#ffd700', FONT_MONO);
    lvTxt.height = '14px';
    lvRow.addControl(lvTxt);
    const lvBar = makeProgressBar(160, 6, lv / 100, char.color);
    lvBar.height = '10px';
    lvRow.addControl(lvBar);

    // Passive desc
    const passT = makeText(char.passiveDesc, 6, '#666', FONT_MONO);
    passT.height = '14px';
    inner.addControl(passT);

    // Buttons
    const btnRow = new StackPanel();
    btnRow.isVertical = false;
    btnRow.height     = '40px';
    btnRow.spacing    = 8;
    inner.addControl(btnRow);

    if (!charSave.owned) {
      const canBuy = save.player.coins >= char.unlockCost;
      const btnBuy = makeBtn(`BUKA  ${char.unlockCost}`, canBuy ? '#ffd70022' : '#111', '#ffd700', canBuy ? '#ffd700' : '#444', '140px', '34px');
      btnBuy.fontSize = 7;
      btnBuy.onPointerClickObservable.add(() => {
        if (save.player.coins < char.unlockCost) return;
        const ns = deepClone(save);
        ns.player.coins -= char.unlockCost;
        ns.characters[char.id].owned = true;
        callbacks.onSave(ns);
      });
      btnRow.addControl(btnBuy);
    } else {
      const btnSel = makeBtn(isActive ? 'AKTIF' : 'PILIH', isActive ? char.color+'33' : 'transparent', char.color, '#fff', '90px', '34px');
      btnSel.fontSize = 7;
      btnSel.onPointerClickObservable.add(() => {
        if (isActive) return;
        const ns = deepClone(save);
        ns.activeCharId = char.id;
        callbacks.onSave(ns);
      });
      btnRow.addControl(btnSel);

      const canUp = save.player.coins >= lvUpCost && lv < 100;
      const btnUp = makeBtn(`UPGRADE ${lvUpCost}`, canUp ? '#1976d222' : '#111', '#42a5f5', canUp ? '#42a5f5' : '#444', '140px', '34px');
      btnUp.fontSize = 7;
      btnUp.onPointerClickObservable.add(() => {
        if (!canUp) return;
        const ns = deepClone(save);
        ns.player.coins -= lvUpCost;
        ns.characters[char.id].level = (ns.characters[char.id].level ?? 1) + 1;
        callbacks.onSave(ns);
      });
      btnRow.addControl(btnUp);
    }
  }

  return root;
}
