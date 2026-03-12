// ============================================================
//  KIDSLUG WARRIORS v2 - COSTUME SCREEN
//  Premium body and weapon skins (real-money via Google Play)
// ============================================================

import {
  AdvancedDynamicTexture, Container, Rectangle,
  TextBlock, Button, StackPanel, ScrollViewer,
} from '@babylonjs/gui';

import { SaveData }  from '../network/SaveSystem';
import { FONT_PIXEL, FONT_MONO, makeText, makeBtn } from './ScreenManager';

export interface CostumeCallbacks {
  onBack:    () => void;
  onSave:    (ns: SaveData) => void;
  onPurchase: (productId: string, onSuccess: () => void, onError: (e: string) => void) => void;
}

function deepClone<T>(o: T): T { return JSON.parse(JSON.stringify(o)); }

const BODY_SKINS = [
  { id:'gothic_shroud',     name:'Gothic Shroud',       style:'Gothic',    price:'Rp 100.000', productId:'skin_body_gothic',     border:'#6a0080', bg:'#1a0020' },
  { id:'neon_phantom',      name:'Neon Phantom',         style:'Cyberpunk', price:'Rp 120.000', productId:'skin_body_neon',       border:'#00e5ff', bg:'#001a2e' },
  { id:'dragon_emperor',    name:'Dragon Emperor',       style:'Dragon',    price:'Rp 150.000', productId:'skin_body_dragon',     border:'#ff6d00', bg:'#7f0000' },
  { id:'celestial_radiance',name:'Celestial Radiance',  style:'Divine',    price:'Rp 175.000', productId:'skin_body_celestial',  border:'#ffd700', bg:'#fff3e0' },
  { id:'shadow_oni',        name:'Shadow Oni',           style:'Gothic',    price:'Rp 200.000', productId:'skin_body_oni',        border:'#ff1744', bg:'#1a0000' },
];

const WEAPON_SKINS = [
  { id:'gothic_reaper',  name:'Gothic Reaper',  style:'Gothic',  price:'Rp 100.000', productId:'skin_weapon_gothic',  border:'#6a0080', bg:'#100010' },
  { id:'crystal_pulse',  name:'Crystal Pulse',  style:'Crystal', price:'Rp 120.000', productId:'skin_weapon_crystal', border:'#00e5ff', bg:'#001020' },
  { id:'dragon_fang',    name:'Dragon Fang',    style:'Dragon',  price:'Rp 150.000', productId:'skin_weapon_dragon',  border:'#ff6d00', bg:'#200000' },
  { id:'holy_judgment',  name:'Holy Judgment',  style:'Divine',  price:'Rp 175.000', productId:'skin_weapon_holy',    border:'#ffd700', bg:'#101000' },
  { id:'void_rift',      name:'Void Rift',       style:'Gothic',  price:'Rp 200.000', productId:'skin_weapon_void',    border:'#7c4dff', bg:'#04000e' },
];

type TabId = 'body' | 'weapon';

export function buildCostumeScreen(
  gui:       AdvancedDynamicTexture,
  save:      SaveData,
  callbacks: CostumeCallbacks,
): Container {
  let activeTab: TabId = 'body';

  const root = new Container();
  root.widthInPixels  = gui.getSize().width;
  root.heightInPixels = gui.getSize().height;

  const scroll = new ScrollViewer();
  scroll.width      = '100%';
  scroll.height     = '100%';
  scroll.background = '#080010';
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

  const hTitle = makeText('KOSTUM PREMIUM', 9, '#ce93d8');
  hTitle.height = '32px';
  hdr.addControl(hTitle);

  // Info
  const infoTxt = makeText('Murni kosmetik visual. Tidak mengubah stats.', 6, '#555', FONT_MONO);
  infoTxt.height = '14px';
  stack.addControl(infoTxt);

  // Tab row
  const tabRow = new StackPanel();
  tabRow.isVertical = false;
  tabRow.height     = '36px';
  tabRow.spacing    = 6;
  stack.addControl(tabRow);

  const btnTabBody   = makeBtn('BODY SKIN',   '#ce93d833', '#ce93d8', '#ce93d8', '140px', '32px');
  const btnTabWeapon = makeBtn('WEAPON SKIN', 'transparent', '#888', '#888', '140px', '32px');
  btnTabBody.fontSize   = 7;
  btnTabWeapon.fontSize = 7;
  tabRow.addControl(btnTabBody);
  tabRow.addControl(btnTabWeapon);

  // Message area
  const msgTxt = makeText('', 7, '#4caf50', FONT_MONO);
  msgTxt.height = '16px';
  stack.addControl(msgTxt);

  // Skins list
  const skinsStack = new StackPanel();
  skinsStack.isVertical = true;
  skinsStack.spacing    = 8;
  skinsStack.width      = '100%';
  stack.addControl(skinsStack);

  const ownedBody:   string[] = (save as any).premiumSkins?.body   ?? [];
  const ownedWeapon: string[] = (save as any).premiumSkins?.weapon ?? [];
  const activeBody    = (save as any).activePremiumSkin?.body   ?? null;
  const activeWeapon  = (save as any).activePremiumSkin?.weapon ?? null;

  function renderSkins(tab: TabId) {
    skinsStack.clearControls();
    const items = tab === 'body' ? BODY_SKINS : WEAPON_SKINS;
    const ownedList = tab === 'body' ? ownedBody : ownedWeapon;
    const activeSkin = tab === 'body' ? activeBody : activeWeapon;

    for (const skin of items) {
      const isOwned  = ownedList.includes(skin.id);
      const isActive = activeSkin === skin.id;

      const card = new Rectangle();
      card.width       = '100%';
      card.height      = '80px';
      card.background  = skin.bg;
      card.thickness   = isActive ? 2 : 1;
      card.color       = isActive ? skin.border : skin.border + '44';
      card.cornerRadius = 12;
      skinsStack.addControl(card);

      const ci = new StackPanel();
      ci.isVertical = false;
      ci.spacing    = 10;
      ci.paddingLeft = '12px';
      card.addControl(ci);

      const info = new StackPanel();
      info.isVertical = true;
      info.spacing    = 4;
      info.width      = '180px';
      info.height     = '60px';
      ci.addControl(info);

      const styleT = makeText(`[${skin.style.toUpperCase()}]`, 5, skin.border);
      styleT.height = '12px';
      info.addControl(styleT);

      const nameT = makeText(skin.name, 8, isActive ? skin.border : '#ccc');
      nameT.height = '18px';
      info.addControl(nameT);

      const priceT = makeText(skin.price, 7, '#ffd700', FONT_MONO);
      priceT.height = '14px';
      info.addControl(priceT);

      if (!isOwned) {
        const btnBuy = makeBtn('BELI', skin.border + '33', skin.border, '#fff', '80px', '36px');
        btnBuy.fontSize = 7;
        btnBuy.onPointerClickObservable.add(() => {
          msgTxt.text  = 'Memproses...';
          msgTxt.color = '#ffd700';
          callbacks.onPurchase(
            skin.productId,
            () => {
              const ns = deepClone(save) as any;
              if (!ns.premiumSkins) ns.premiumSkins = { body:[], weapon:[] };
              if (tab === 'body') {
                if (!ns.premiumSkins.body.includes(skin.id)) ns.premiumSkins.body.push(skin.id);
                if (!ns.activePremiumSkin) ns.activePremiumSkin = {};
                ns.activePremiumSkin.body = skin.id;
              } else {
                if (!ns.premiumSkins.weapon.includes(skin.id)) ns.premiumSkins.weapon.push(skin.id);
                if (!ns.activePremiumSkin) ns.activePremiumSkin = {};
                ns.activePremiumSkin.weapon = skin.id;
              }
              callbacks.onSave(ns);
              msgTxt.text  = `${skin.name} berhasil dibeli!`;
              msgTxt.color = '#4caf50';
            },
            (err) => {
              msgTxt.text  = err === 'cancelled' ? '' : `Gagal: ${err}`;
              msgTxt.color = '#f44336';
            },
          );
        });
        ci.addControl(btnBuy);
      } else {
        const btnEquip = makeBtn(isActive ? 'AKTIF' : 'PAKAI', isActive ? skin.border+'33':'transparent', skin.border, isActive ? skin.border : '#888', '80px', '36px');
        btnEquip.fontSize = 7;
        btnEquip.onPointerClickObservable.add(() => {
          const ns = deepClone(save) as any;
          if (!ns.activePremiumSkin) ns.activePremiumSkin = {};
          if (tab === 'body')   ns.activePremiumSkin.body   = skin.id;
          else                  ns.activePremiumSkin.weapon = skin.id;
          callbacks.onSave(ns);
        });
        ci.addControl(btnEquip);
      }
    }
  }

  renderSkins('body');

  btnTabBody.onPointerClickObservable.add(() => {
    activeTab = 'body';
    btnTabBody.background   = '#ce93d833';
    btnTabBody.color        = '#ce93d8';
    btnTabWeapon.background = 'transparent';
    btnTabWeapon.color      = '#888';
    renderSkins('body');
  });
  btnTabWeapon.onPointerClickObservable.add(() => {
    activeTab = 'weapon';
    btnTabWeapon.background = '#ce93d833';
    btnTabWeapon.color      = '#ce93d8';
    btnTabBody.background   = 'transparent';
    btnTabBody.color        = '#888';
    renderSkins('weapon');
  });

  return root;
}
