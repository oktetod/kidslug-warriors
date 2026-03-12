// ============================================================
//  KIDSLUG WARRIORS v2 - HOME SCREEN
//  Main hub: shows stats, nav buttons, active character/weapon
// ============================================================

import {
  AdvancedDynamicTexture, Container, Rectangle,
  TextBlock, Button, StackPanel, ScrollViewer, Grid,
} from '@babylonjs/gui';
import { Scene } from '@babylonjs/core';

import { SaveData }      from '../network/SaveSystem';
import { CHARACTERS, WEAPONS } from '../data/GameData';
import { expToNextLevel } from '../systems/CombatSystem';
import {
  FONT_PIXEL, FONT_MONO, makeText, makeBtn, makeProgressBar,
} from './ScreenManager';

export interface HomeScreenCallbacks {
  onStage:     () => void;
  onGacha:     () => void;
  onShop:      () => void;
  onCharacter: () => void;
  onInventory: () => void;
  onQuest:     () => void;
  onCostume:   () => void;
  onGM:        () => void;
  onLogout:    () => void;
  onToggleMute: () => void;
}

export function buildHomeScreen(
  gui:       AdvancedDynamicTexture,
  save:      SaveData,
  callbacks: HomeScreenCallbacks,
  isMuted:   boolean,
  isAdmin:   boolean,
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
  stack.width   = '100%';
  stack.isVertical = true;
  stack.paddingLeft   = '12px';
  stack.paddingRight  = '12px';
  stack.paddingTop    = '12px';
  stack.paddingBottom = '60px';
  stack.spacing = 10;
  scroll.addControl(stack);

  const char   = CHARACTERS.find(c => c.id === save.activeCharId) ?? CHARACTERS[0];
  const weapon = WEAPONS.find(w => w.id === save.activeWeaponId)  ?? WEAPONS[0];
  const charLv = save.characters[char.id]?.level ?? 1;
  const plLv   = save.player.level ?? 1;
  const plExp  = save.player.exp   ?? 0;
  const needed = expToNextLevel(plLv);

  // ── Header row
  const header = new Grid();
  header.height = '42px';
  header.addColumnDefinition(1, false);
  header.addColumnDefinition(180, true);
  stack.addControl(header);

  const titleTxt = makeText('KID SLUG WARRIORS', 9, '#ffd700');
  titleTxt.horizontalAlignment = 0;
  header.addControl(titleTxt, 0, 0);

  const coinBox = new Rectangle();
  coinBox.background = 'rgba(255,215,0,0.12)';
  coinBox.thickness  = 1;
  // @ts-ignore
  coinBox.borderColor = 'rgba(255,215,0,0.3)';
  coinBox.cornerRadius = 8;
  coinBox.height = '28px';
  header.addControl(coinBox, 0, 1);

  const coinTxt = makeText(`KOIN: ${save.player.coins}`, 8, '#ffd700');
  coinBox.addControl(coinTxt);

  // ── Player EXP bar
  const expLabel = makeText(`LEVEL ${plLv} / 100    ${plExp} / ${needed} EXP`, 6, '#ce93d8');
  expLabel.height = '18px';
  expLabel.paddingTop = '4px';
  expLabel.horizontalAlignment = 0;
  stack.addControl(expLabel);

  const expBar = makeProgressBar(340, 7, plExp / needed, '#ce93d8');
  expBar.height = '10px';
  stack.addControl(expBar);

  // ── Active character card
  const charCard = new Rectangle();
  charCard.height     = '80px';
  charCard.background = `rgba(0,0,0,0.4)`;
  charCard.thickness  = 1;
  // @ts-ignore
  charCard.borderColor = char.color + '55';
  charCard.cornerRadius = 10;

  const charGrid = new Grid();
  charGrid.addColumnDefinition(64, true);
  charGrid.addColumnDefinition(1, false);
  charCard.addControl(charGrid);

  const charName = makeText(`${char.name} (${char.title})`, 8, char.accentColor);
  charName.horizontalAlignment = 0;
  charName.paddingLeft = '8px';
  charGrid.addControl(charName, 0, 1);

  const charStats = makeText(
    `Hero Lv.${charLv}    Stage: ${save.player.totalStagesCleared}    Kill: ${save.player.totalKills ?? 0}`,
    6, '#666', FONT_MONO,
  );
  charStats.top = '20px';
  charStats.horizontalAlignment = 0;
  charStats.paddingLeft = '8px';
  charGrid.addControl(charStats, 0, 1);

  charCard.onPointerClickObservable.add(() => callbacks.onCharacter());
  stack.addControl(charCard);

  // ── Active weapon row
  const wepCard = new Rectangle();
  wepCard.height     = '50px';
  wepCard.background = 'rgba(0,0,0,0.35)';
  wepCard.thickness  = 1;
  // @ts-ignore
  wepCard.borderColor = weapon.color + '33';
  wepCard.cornerRadius = 8;

  const wepTxt = makeText(
    `SENJATA: ${weapon.name}  [${weapon.rarity.toUpperCase()}]  ATK:${weapon.dmg} RATE:${weapon.rate}x`,
    6, weapon.color,
  );
  wepCard.addControl(wepTxt);
  stack.addControl(wepCard);

  // ── Nav grid
  const NAV = [
    { label: 'STAGE',     color: '#2e7d32', fn: callbacks.onStage      },
    { label: 'QUEST',     color: '#f57f17', fn: callbacks.onQuest      },
    { label: 'GACHA',     color: '#7b1fa2', fn: callbacks.onGacha      },
    { label: 'KARAKTER',  color: '#1565c0', fn: callbacks.onCharacter  },
    { label: 'INVENTORY', color: '#c17900', fn: callbacks.onInventory  },
    { label: 'KOSTUM',    color: '#9c27b0', fn: callbacks.onCostume    },
    { label: 'TOP UP',    color: '#e65100', fn: callbacks.onShop       },
  ];

  const navGrid = new Grid();
  navGrid.height = '260px';
  for (let i = 0; i < 2; i++) navGrid.addColumnDefinition(1, false);
  for (let i = 0; i < 4; i++) navGrid.addRowDefinition(60, true);

  NAV.forEach((n, i) => {
    const row = Math.floor(i / 2), col = i % 2;
    const btn = makeBtn(n.label, `${n.color}22`, `${n.color}44`, '#fff', '95%', '50px');
    btn.onPointerClickObservable.add(() => n.fn());
    navGrid.addControl(btn, row, col);
  });
  stack.addControl(navGrid);

  // ── Mute + logout row
  const muteBtn = makeBtn(
    isMuted ? 'SOUND: OFF' : 'SOUND: ON',
    'transparent', '#333', '#888', '48%', '34px',
  );
  muteBtn.onPointerClickObservable.add(() => callbacks.onToggleMute());

  const logoutBtn = makeBtn('KELUAR', 'transparent', '#333', '#555', '48%', '34px');
  logoutBtn.onPointerClickObservable.add(() => callbacks.onLogout());

  const bottomRow = new Grid();
  bottomRow.height = '40px';
  bottomRow.addColumnDefinition(1, false);
  bottomRow.addColumnDefinition(1, false);
  bottomRow.addControl(muteBtn,   0, 0);
  bottomRow.addControl(logoutBtn, 0, 1);
  stack.addControl(bottomRow);

  if (isAdmin) {
    const gmBtn = makeBtn('GM PANEL', 'rgba(244,67,54,0.2)', '#f4433644', '#f44336', '100%', '34px');
    gmBtn.onPointerClickObservable.add(() => callbacks.onGM());
    stack.addControl(gmBtn);
  }

  return root;
}
