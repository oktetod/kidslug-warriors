// ============================================================
//  KIDSLUG WARRIORS v2 - SCREEN MANAGER
//  Controls which fullscreen UI is shown (menu, shop, gacha...)
// ============================================================

import {
  AdvancedDynamicTexture, Container, Rectangle,
  TextBlock, Button, Image, StackPanel, ScrollViewer,
  Ellipse, Grid,
} from '@babylonjs/gui';
import { Scene, Color3 } from '@babylonjs/core';

export type ScreenId =
  | 'auth'
  | 'home'
  | 'stage'
  | 'game'
  | 'character'
  | 'inventory'
  | 'gacha'
  | 'shop'
  | 'quest'
  | 'costume'
  | 'gm';

type ScreenFactory = () => Container;

export class ScreenManager {
  public gui:      AdvancedDynamicTexture;
  private current: Container | null = null;
  private screens: Map<ScreenId, ScreenFactory> = new Map();

  constructor(scene: Scene) {
    this.gui = AdvancedDynamicTexture.CreateFullscreenUI('screens', true, scene);
  }

  register(id: ScreenId, factory: ScreenFactory): void {
    this.screens.set(id, factory);
  }

  show(id: ScreenId): void {
    if (this.current) {
      this.gui.removeControl(this.current);
      this.current.dispose();
    }
    const factory = this.screens.get(id);
    if (!factory) { console.warn(`[ScreenManager] Screen "${id}" not registered`); return; }
    this.current = factory();
    this.gui.addControl(this.current);
  }

  hide(): void {
    if (this.current) {
      this.gui.removeControl(this.current);
      this.current.dispose();
      this.current = null;
    }
  }

  dispose(): void {
    this.hide();
    this.gui.dispose();
  }
}

// ============================================================
//  SHARED UI HELPERS (pure GUI factory functions, no emojis)
// ============================================================

export const FONT_PIXEL = '"Press Start 2P", monospace';
export const FONT_MONO  = 'monospace';

export function makePanel(
  w: string | number,
  h: string | number,
  bg = '#050510',
): Rectangle {
  const r = new Rectangle();
  r.width    = typeof w === 'number' ? `${w}px` : w;
  r.height   = typeof h === 'number' ? `${h}px` : h;
  r.background = bg;
  r.thickness  = 0;
  r.verticalAlignment   = 0; // top
  r.horizontalAlignment = 0; // left
  return r;
}

export function makeText(
  text:     string,
  fontSize: number,
  color:    string,
  font = FONT_PIXEL,
): TextBlock {
  const t = new TextBlock();
  t.text          = text;
  t.fontSize      = fontSize;
  t.color         = color;
  t.fontFamily    = font;
  t.textWrapping  = true;
  t.resizeToFit   = false;
  return t;
}

export function makeBtn(
  label:   string,
  bg:      string,
  border:  string,
  color:   string,
  w: string | number,
  h: string | number,
): Button {
  const btn = Button.CreateSimpleButton('btn_' + label, label);
  btn.width       = typeof w === 'number' ? `${w}px` : w;
  btn.height      = typeof h === 'number' ? `${h}px` : h;
  btn.background  = bg;
  btn.color       = color;
  btn.fontFamily  = FONT_PIXEL;
  btn.fontSize    = 10;
  btn.cornerRadius = 8;
  btn.thickness   = 1;
  // @ts-ignore
  btn.borderColor = border;
  return btn;
}

export function makeProgressBar(
  w: number, h: number,
  pct: number,
  fill: string,
  bg = '#0f0f1a',
): Rectangle {
  const outer = new Rectangle();
  outer.width  = `${w}px`;
  outer.height = `${h}px`;
  outer.background = bg;
  outer.thickness  = 0;
  outer.cornerRadius = 3;

  const inner = new Rectangle();
  inner.width  = `${Math.max(0, Math.min(1, pct)) * w}px`;
  inner.height = `${h}px`;
  inner.background = fill;
  inner.thickness  = 0;
  inner.cornerRadius = 3;
  inner.horizontalAlignment = 0;

  outer.addControl(inner);
  return outer;
}
