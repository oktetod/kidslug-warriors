// ============================================================
//  KIDSLUG WARRIORS v2 - INVENTORY SCREEN
//  Manage weapons, equipment, and items
// ============================================================

import {
  AdvancedDynamicTexture, Container, Rectangle,
  TextBlock, Button, StackPanel, ScrollViewer,
} from '@babylonjs/gui';

import { SaveData }     from '../network/SaveSystem';
import { WEAPONS, EQUIPMENT, ITEMS, RARITY_COLORS } from '../data/GameData';
import { FONT_PIXEL, FONT_MONO, makeText, makeBtn } from './ScreenManager';

export interface InventoryCallbacks {
  onBack: () => void;
  onSave: (ns: SaveData) => void;
}

function deepClone<T>(o: T): T { return JSON.parse(JSON.stringify(o)); }

function rarityColor(r: string): string {
  return (RARITY_COLORS as Record<string,string>)[r] ?? '#9e9e9e';
}

type TabId = 'weapon' | 'equip' | 'item';

export function buildInventoryScreen(
  gui:       AdvancedDynamicTexture,
  save:      SaveData,
  callbacks: InventoryCallbacks,
): Container {
  const root = new Container();
  root.widthInPixels  = gui.getSize().width;
  root.heightInPixels = gui.getSize().height;

  const scroll = new ScrollViewer();
  scroll.width      = '100%';
  scroll.height     = '100%';
  scroll.background = '#060610';
  scroll.thickness  = 0;
  root.addControl(scroll);

  const outerStack = new StackPanel();
  outerStack.width      = '100%';
  outerStack.isVertical = true;
  outerStack.paddingLeft = outerStack.paddingRight = '12px';
  outerStack.paddingTop  = '12px';
  outerStack.paddingBottom = '40px';
  outerStack.spacing     = 10;
  scroll.addControl(outerStack);

  // Header
  const hdr = new StackPanel();
  hdr.isVertical = false;
  hdr.height     = '36px';
  hdr.spacing    = 10;
  outerStack.addControl(hdr);

  const btnBack = makeBtn('< BACK', 'transparent', '#444', '#aaa', '80px', '32px');
  btnBack.fontSize = 7;
  btnBack.onPointerClickObservable.add(() => callbacks.onBack());
  hdr.addControl(btnBack);

  const hTitle = makeText('INVENTORY', 10, '#ffd700');
  hTitle.height = '32px';
  hdr.addControl(hTitle);

  const playerLvTxt = makeText(`LV.${save.player.level}`, 7, '#42a5f5', FONT_MONO);
  playerLvTxt.height = '32px';
  hdr.addControl(playerLvTxt);

  // Tab row
  const tabRow = new StackPanel();
  tabRow.isVertical = false;
  tabRow.height     = '36px';
  tabRow.spacing    = 6;
  outerStack.addControl(tabRow);

  const tabs: TabId[] = ['weapon', 'equip', 'item'];
  const tabLabels: Record<TabId, string> = { weapon:'SENJATA', equip:'EQUIP', item:'ITEM' };

  for (const tid of tabs) {
    const tb = makeBtn(tabLabels[tid], 'transparent', '#ffd700', '#888', '100px', '32px');
    tb.fontSize = 7;
    tabRow.addControl(tb);
  }

  const playerLevel = save.player.level;

  // Weapon items
  const weaponStack = new StackPanel();
  weaponStack.isVertical = true;
  weaponStack.spacing    = 6;
  weaponStack.width      = '100%';
  outerStack.addControl(weaponStack);

  const ownedWeapons = WEAPONS.filter(w => save.weapons[w.id]);
  if (ownedWeapons.length === 0) {
    const noW = makeText('Belum punya senjata. Gacha dulu!', 7, '#333', FONT_MONO);
    noW.height = '18px';
    weaponStack.addControl(noW);
  }

  for (const w of ownedWeapons) {
    const locked  = playerLevel < (w.levelReq ?? 1);
    const isActive = save.activeWeaponId === w.id;
    const rc       = rarityColor(w.rarity);

    const row = new Rectangle();
    row.width       = '100%';
    row.height      = '56px';
    row.background  = locked ? 'rgba(20,0,0,0.5)' : isActive ? w.color + '22' : 'rgba(0,0,0,0.3)';
    row.thickness   = 2;
    row.color       = locked ? '#f4433633' : isActive ? w.color : '#1a1a2a';
    row.cornerRadius = 10;
    weaponStack.addControl(row);

    const rowInner = new StackPanel();
    rowInner.isVertical = false;
    rowInner.spacing    = 10;
    rowInner.paddingLeft = '10px';
    row.addControl(rowInner);

    const nameTxt = makeText(w.name, 8, locked ? '#444' : w.color);
    nameTxt.height = '40px';
    nameTxt.width  = '160px';
    rowInner.addControl(nameTxt);

    const statTxt = makeText(`ATK:${w.dmg} RATE:${w.rate}x LV${w.levelReq ?? 1}+`, 6, '#555', FONT_MONO);
    statTxt.height = '40px';
    rowInner.addControl(statTxt);

    if (!locked) {
      const btnEquip = makeBtn(isActive ? 'AKTIF' : 'PAKAI', isActive ? rc+'33':'transparent', rc, isActive?rc:'#888', '70px', '30px');
      btnEquip.fontSize = 6;
      btnEquip.onPointerClickObservable.add(() => {
        if (locked) return;
        const ns = deepClone(save);
        ns.activeWeaponId = w.id;
        callbacks.onSave(ns);
      });
      rowInner.addControl(btnEquip);
    } else {
      const lockTxt = makeText(`LV${w.levelReq ?? 1}+`, 6, '#f44336', FONT_MONO);
      lockTxt.height = '30px';
      lockTxt.width  = '60px';
      rowInner.addControl(lockTxt);
    }
  }

  // Equipment items
  const ownedEquips = EQUIPMENT.filter(e => save.equipment[e.id]);
  if (ownedEquips.length === 0) {
    const noE = makeText('Belum punya equipment. Gacha dulu!', 7, '#333', FONT_MONO);
    noE.height = '18px';
    weaponStack.addControl(noE);
  }

  for (const eq of ownedEquips) {
    const locked = playerLevel < (eq.levelReq ?? 1);
    const charSave = save.characters[save.activeCharId];
    const equipped = charSave?.equip?.[eq.slot] === eq.id;
    const rc       = rarityColor(eq.rarity);

    const row = new Rectangle();
    row.width       = '100%';
    row.height      = '56px';
    row.background  = locked ? 'rgba(20,0,0,0.5)' : equipped ? rc+'22' : 'rgba(0,0,0,0.3)';
    row.thickness   = 2;
    row.color       = locked ? '#f4433633' : equipped ? rc : '#1a1a2a';
    row.cornerRadius = 10;
    weaponStack.addControl(row);

    const rowInner = new StackPanel();
    rowInner.isVertical = false;
    rowInner.spacing    = 10;
    rowInner.paddingLeft = '10px';
    row.addControl(rowInner);

    const nameTxt = makeText(`[${eq.slot.toUpperCase().slice(0,4)}] ${eq.name}`, 7, locked ? '#444' : rc);
    nameTxt.height = '40px';
    nameTxt.width  = '160px';
    rowInner.addControl(nameTxt);

    const statParts = Object.entries(eq.stat).map(([k,v]) => `${k.toUpperCase()}${(v as number)>0?'+':''}${v}`).join(' ');
    const statTxt = makeText(statParts, 6, '#555', FONT_MONO);
    statTxt.height = '40px';
    rowInner.addControl(statTxt);

    if (!locked) {
      const btnEquip = makeBtn(equipped ? 'TERPASANG' : 'PASANG', equipped ? rc+'33':'transparent', rc, equipped?rc:'#888', '90px', '30px');
      btnEquip.fontSize = 6;
      btnEquip.onPointerClickObservable.add(() => {
        if (locked) return;
        const ns = deepClone(save);
        if (!ns.characters[ns.activeCharId].equip) ns.characters[ns.activeCharId].equip = { helmet:null, armor:null, boots:null, accessory:null };
        ns.characters[ns.activeCharId].equip[eq.slot] = eq.id;
        callbacks.onSave(ns);
      });
      rowInner.addControl(btnEquip);
    }
  }

  // Items section
  const itemSepTxt = makeText('--- ITEM ---', 7, '#444', FONT_MONO);
  itemSepTxt.height = '16px';
  weaponStack.addControl(itemSepTxt);

  const itemGrid = new StackPanel();
  itemGrid.isVertical = false;
  itemGrid.spacing    = 8;
  itemGrid.height     = '90px';
  itemGrid.width      = '100%';
  weaponStack.addControl(itemGrid);

  const ownedItems = ITEMS.filter(it => save.items[it.id] > 0);
  if (ownedItems.length === 0) {
    const noIt = makeText('Belum punya item.', 7, '#333', FONT_MONO);
    noIt.height = '18px';
    weaponStack.addControl(noIt);
  }

  for (const it of ownedItems.slice(0, 4)) {
    const box = new Rectangle();
    box.width       = '80px';
    box.height      = '80px';
    box.background  = 'rgba(0,0,0,0.35)';
    box.thickness   = 1;
    box.color       = it.color + '44';
    box.cornerRadius = 10;
    itemGrid.addControl(box);

    const iStack = new StackPanel();
    iStack.isVertical = true;
    iStack.spacing    = 2;
    box.addControl(iStack);

    const iName = makeText(it.name, 5, it.color);
    iName.height = '20px';
    iStack.addControl(iName);

    const iDesc = makeText(it.desc.slice(0,20), 5, '#555', FONT_MONO);
    iDesc.height = '14px';
    iStack.addControl(iDesc);

    const iCount = makeText(`x${save.items[it.id]}`, 9, '#ffd700');
    iCount.height = '18px';
    iStack.addControl(iCount);
  }

  return root;
}
