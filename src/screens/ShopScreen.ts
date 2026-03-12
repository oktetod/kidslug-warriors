// ============================================================
//  KIDSLUG WARRIORS v2 - SHOP SCREEN
//  Top-up coins via Google Play Billing
// ============================================================

import {
  AdvancedDynamicTexture, Container, Rectangle,
  TextBlock, Button, StackPanel, ScrollViewer,
} from '@babylonjs/gui';

import { SaveData }  from '../network/SaveSystem';
import { FONT_PIXEL, FONT_MONO, makeText, makeBtn } from './ScreenManager';

export interface ShopCallbacks {
  onBack:    () => void;
  onSave:    (ns: SaveData) => void;
  onPurchase: (productId: string, onSuccess: (coins: number) => void, onError: (e: string) => void) => void;
}

function deepClone<T>(o: T): T { return JSON.parse(JSON.stringify(o)); }

const PACKAGES = [
  { id:'coins_1000',  coins:1000,  label:'Starter Pack',  price:'Rp 10.000',  color:'#78909c', popular:false },
  { id:'coins_5500',  coins:5500,  label:'Explorer Pack', price:'Rp 50.000',  color:'#42a5f5', popular:false },
  { id:'coins_12000', coins:12000, label:'Warrior Pack',  price:'Rp 100.000', color:'#ab47bc', popular:true  },
  { id:'coins_26000', coins:26000, label:'Hero Pack',     price:'Rp 200.000', color:'#ff7043', popular:false },
  { id:'coins_70000', coins:70000, label:'Legend Pack',   price:'Rp 500.000', color:'#ffd700', popular:false },
];

export function buildShopScreen(
  gui:       AdvancedDynamicTexture,
  save:      SaveData,
  callbacks: ShopCallbacks,
): Container {
  const root = new Container();
  root.widthInPixels  = gui.getSize().width;
  root.heightInPixels = gui.getSize().height;

  const scroll = new ScrollViewer();
  scroll.width      = '100%';
  scroll.height     = '100%';
  scroll.background = '#0a0800';
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

  const hTitle = makeText('TOP UP KOIN', 10, '#ffd700');
  hTitle.height = '32px';
  hdr.addControl(hTitle);

  // Current balance
  const balanceTxt = makeText(`Saldo: ${save.player.coins} koin`, 8, '#ffd700', FONT_MONO);
  balanceTxt.height = '18px';
  stack.addControl(balanceTxt);

  const rateTxt = makeText('1.000 koin = Rp 10.000 IDR', 7, '#555', FONT_MONO);
  rateTxt.height = '14px';
  stack.addControl(rateTxt);

  // Message area (dynamic)
  const msgBox = new Rectangle();
  msgBox.width       = '100%';
  msgBox.height      = '32px';
  msgBox.background  = 'transparent';
  msgBox.thickness   = 0;
  stack.addControl(msgBox);

  const msgTxt = makeText('', 7, '#4caf50', FONT_MONO);
  msgTxt.height = '28px';
  msgBox.addControl(msgTxt);

  // Packages
  for (const pkg of PACKAGES) {
    const card = new Rectangle();
    card.width       = '100%';
    card.height      = pkg.popular ? '72px' : '64px';
    card.background  = `${pkg.color}18`;
    card.thickness   = pkg.popular ? 2 : 1;
    card.color       = pkg.popular ? '#ffd70088' : pkg.color + '33';
    card.cornerRadius = 12;
    stack.addControl(card);

    const cardInner = new StackPanel();
    cardInner.isVertical = false;
    cardInner.spacing    = 12;
    cardInner.paddingLeft = '12px';
    card.addControl(cardInner);

    // Left: label and coins
    const leftStack = new StackPanel();
    leftStack.isVertical = true;
    leftStack.spacing    = 4;
    leftStack.width      = '160px';
    leftStack.height     = '50px';
    cardInner.addControl(leftStack);

    const labelTxt = makeText(pkg.label + (pkg.popular ? ' [TERPOPULER]' : ''), 7, pkg.popular ? '#ffd700' : pkg.color);
    labelTxt.height = '18px';
    leftStack.addControl(labelTxt);

    const coinsTxt = makeText(`${pkg.coins.toLocaleString()} koin`, 10, pkg.color);
    coinsTxt.height = '22px';
    leftStack.addControl(coinsTxt);

    // Right: price button
    const btnBuy = makeBtn(pkg.price, `${pkg.color}33`, pkg.color, '#fff', '110px', '40px');
    btnBuy.fontSize = 7;
    btnBuy.onPointerClickObservable.add(() => {
      msgTxt.text  = 'Memproses pembayaran...';
      msgTxt.color = '#ffd700';
      callbacks.onPurchase(
        pkg.id,
        (coins) => {
          const ns = deepClone(save);
          ns.player.coins += coins;
          callbacks.onSave(ns);
          msgTxt.text  = `+${coins} koin berhasil masuk!`;
          msgTxt.color = '#4caf50';
        },
        (err) => {
          if (err !== 'cancelled') {
            msgTxt.text  = `Gagal: ${err}`;
            msgTxt.color = '#f44336';
          } else {
            msgTxt.text = '';
          }
        },
      );
    });
    cardInner.addControl(btnBuy);
  }

  // Info box
  const infoBox = new Rectangle();
  infoBox.width       = '100%';
  infoBox.height      = '80px';
  infoBox.background  = 'rgba(0,0,0,0.4)';
  infoBox.thickness   = 1;
  infoBox.color       = '#1a1a2a';
  infoBox.cornerRadius = 10;
  stack.addControl(infoBox);

  const infoTxt = makeText(
    'Pembayaran aman via Google Play  |  Koin langsung masuk setelah bayar  |  Item digital tidak dapat direfund',
    6, '#444', FONT_MONO,
  );
  infoTxt.height     = '70px';
  infoTxt.textWrapping = true;
  infoTxt.paddingLeft = infoTxt.paddingRight = '12px';
  infoBox.addControl(infoTxt);

  return root;
}
