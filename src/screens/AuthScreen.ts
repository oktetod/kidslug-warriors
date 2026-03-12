// ============================================================
//  KIDSLUG WARRIORS v2 - AUTH SCREEN
//  Login with Google or play as guest
// ============================================================

import {
  AdvancedDynamicTexture, Container, Rectangle,
  TextBlock, Button, StackPanel,
} from '@babylonjs/gui';

import { FONT_PIXEL, FONT_MONO, makeText, makeBtn } from './ScreenManager';

export interface AuthCallbacks {
  onGoogle: () => void;
  onGuest:  () => void;
}

export function buildAuthScreen(
  gui:       AdvancedDynamicTexture,
  callbacks: AuthCallbacks,
  errorMsg?: string,
): Container {
  const root = new Container();
  root.width = '100%';
  root.height = '100%';
  // Background
  const bg = new Rectangle();
  bg.width     = '100%';
  bg.height    = '100%';
  bg.background = 'linear-gradient(160deg,#080818,#120828,#081208)';
  bg.thickness  = 0;
  root.addControl(bg);

  const stack = new StackPanel();
  stack.width      = '320px';
  stack.isVertical = true;
  stack.spacing    = 16;
  stack.verticalAlignment   = 1; // center
  stack.horizontalAlignment = 1;
  root.addControl(stack);

  // Title
  const title = makeText('KID SLUG', 22, '#ffd700');
  title.height   = '36px';
  title.textWrapping = false;
  stack.addControl(title);

  const sub = makeText('WARRIORS', 11, '#42a5f5');
  sub.height = '20px';
  stack.addControl(sub);

  const tag = makeText('ACTION  GACHA  RPG', 8, '#444444', FONT_MONO);
  tag.height = '16px';
  stack.addControl(tag);

  // Spacer
  const sp1 = new Rectangle();
  sp1.height    = '20px';
  sp1.width     = '1px';
  sp1.thickness = 0;
  stack.addControl(sp1);

  // Stats row
  const statsRow = new StackPanel();
  statsRow.width       = '100%';
  statsRow.isVertical  = false;
  statsRow.height      = '50px';
  statsRow.spacing     = 12;
  stack.addControl(statsRow);

  for (const [num, lbl] of [['6','HEROES'],['25','STAGES'],['INF','GACHA']] as [string,string][]) {
    const box = new Rectangle();
    box.width       = '88px';
    box.height      = '48px';
    box.background  = 'rgba(255,255,255,0.04)';
    box.thickness   = 1;
    box.color       = '#222244';
    box.cornerRadius = 8;
    statsRow.addControl(box);

    const inner = new StackPanel();
    inner.isVertical = true;
    inner.spacing    = 2;
    box.addControl(inner);

    const n = makeText(num, 14, '#ffd700');
    n.height = '22px';
    inner.addControl(n);

    const l = makeText(lbl, 6, '#444444', FONT_MONO);
    l.height = '12px';
    inner.addControl(l);
  }

  // Spacer
  const sp2 = new Rectangle();
  sp2.height    = '8px';
  sp2.width     = '1px';
  sp2.thickness = 0;
  stack.addControl(sp2);

  // Google button
  const btnGoogle = makeBtn('LOGIN DENGAN GOOGLE', '#1565c066', '#42a5f5', '#ffffff', '300px', '50px');
  btnGoogle.fontSize = 8;
  btnGoogle.onPointerClickObservable.add(() => callbacks.onGoogle());
  stack.addControl(btnGoogle);

  // Guest button
  const btnGuest = makeBtn('MAIN SEBAGAI TAMU', '#1a1a2e', '#ff9800', '#ffffff', '300px', '50px');
  btnGuest.fontSize = 8;
  btnGuest.onPointerClickObservable.add(() => callbacks.onGuest());
  stack.addControl(btnGuest);

  // Error message
  if (errorMsg) {
    const err = makeText(errorMsg, 7, '#f44336', FONT_MONO);
    err.height = '28px';
    err.textWrapping = true;
    stack.addControl(err);
  }

  // Footer note
  const note = makeText('Data tamu tersimpan di perangkat ini', 6, '#222244', FONT_MONO);
  note.height = '14px';
  stack.addControl(note);

  return root;
}
