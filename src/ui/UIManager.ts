// =================================================================
//  KIDSLUG WARRIORS v2 - UI MANAGER
//  All in-game HUD using BABYLON.GUI.Image for icons (real PNG files)
//  Icons loaded from /assets/icons/*.png - NO text/emoji substitutes
// =================================================================
import {
  AdvancedDynamicTexture, StackPanel, Rectangle,
  TextBlock, Control, Image as GuiImage,
} from '@babylonjs/gui';

export interface HUDState {
  hp:           number;
  maxHp:        number;
  coins:        number;
  kills:        number;
  totalEnemies: number;
  bossHp:       number;
  bossMxHp:     number;
  bossName:     string;
  bossActive:   boolean;
  stageId:      number;
  stageName:    string;
  weaponName:   string;
  playerLevel:  number;
}

const ICON = (name: string) => `/assets/icons/${name}.png`;
const FONT  = '"Press Start 2P",monospace';

function makeIcon(name: string, size: number): GuiImage {
  const img = new GuiImage('ico_' + name, ICON(name));
  img.width  = `${size}px`;
  img.height = `${size}px`;
  img.stretch = GuiImage.STRETCH_UNIFORM;
  return img;
}

function makeLabel(text: string, size: number, color: string): TextBlock {
  const t = new TextBlock();
  t.text       = text;
  t.fontSize   = `${size}px`;
  t.color      = color;
  t.fontFamily = FONT;
  return t;
}

function makeRow(
  horizontalAlign: number,
  verticalAlign:   number,
  left: string, top: string,
  w: string, h: string,
  bg = 'rgba(0,0,0,0.70)',
): StackPanel {
  const row        = new StackPanel();
  row.isVertical   = false;
  row.width        = w;
  row.height       = h;
  row.background   = bg;
  row.paddingLeft  = '4px';
  row.paddingRight = '4px';
  row.spacing      = 4;
  row.horizontalAlignment = horizontalAlign;
  row.verticalAlignment   = verticalAlign;
  row.left = left;
  row.top  = top;
  return row;
}

export class UIManager {
  private adt: AdvancedDynamicTexture;

  private hpBarOuter!: Rectangle;
  private hpBarFill!:  Rectangle;
  private hpLabel!:    TextBlock;

  private killLabel!:  TextBlock;
  private killFill!:   Rectangle;

  private bossPanel!:  Rectangle;
  private bossBarFill!:Rectangle;
  private bossLabel!:  TextBlock;

  private coinLabel!:  TextBlock;
  private weapLabel!:  TextBlock;
  private stageLabel!: TextBlock;

  private overlayPanel!: Rectangle;
  private overlayTitle!: TextBlock;
  private overlaySub!:   TextBlock;

  private floatPool: Array<{ tb: TextBlock; container: Rectangle; ttl: number; vy: number }> = [];

  constructor() {
    this.adt = AdvancedDynamicTexture.CreateFullscreenUI('HUD_MAIN');
    this.adt.isForeground = false;
    this.buildHUD();
  }

  private buildHUD(): void {

    // ================================================================
    //  HP ROW (top-left): [icon_hp] [bar + label]
    // ================================================================
    const hpRow = makeRow(
      Control.HORIZONTAL_ALIGNMENT_LEFT,
      Control.VERTICAL_ALIGNMENT_TOP,
      '8px', '8px', '210px', '26px',
    );
    this.adt.addControl(hpRow);

    const hpIcon = makeIcon('icon_hp', 20);
    hpRow.addControl(hpIcon);

    // HP bar container
    this.hpBarOuter = new Rectangle('hpOuter');
    this.hpBarOuter.width        = '170px';
    this.hpBarOuter.height       = '18px';
    this.hpBarOuter.background   = 'rgba(255,255,255,0.12)';
    this.hpBarOuter.thickness    = 1;
    this.hpBarOuter.color        = '#ffffff22';
    this.hpBarOuter.cornerRadius = 3;
    hpRow.addControl(this.hpBarOuter);

    this.hpBarFill = new Rectangle('hpFill');
    this.hpBarFill.width        = '100%';
    this.hpBarFill.height       = '100%';
    this.hpBarFill.background   = '#4caf50';
    this.hpBarFill.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
    this.hpBarFill.cornerRadius = 3;
    this.hpBarFill.thickness    = 0;
    this.hpBarOuter.addControl(this.hpBarFill);

    this.hpLabel = makeLabel('100/100', 6, '#ffffff');
    this.hpLabel.width  = '100%';
    this.hpLabel.height = '100%';
    this.hpBarOuter.addControl(this.hpLabel);

    // ================================================================
    //  KILLS ROW (top-left, below HP): [icon_stage] KILLS 0/0
    // ================================================================
    const killRow = makeRow(
      Control.HORIZONTAL_ALIGNMENT_LEFT,
      Control.VERTICAL_ALIGNMENT_TOP,
      '8px', '38px', '180px', '18px',
      'rgba(0,0,0,0.55)',
    );
    this.adt.addControl(killRow);

    const killIcon = makeIcon('icon_stage', 14);
    killRow.addControl(killIcon);

    this.killLabel = makeLabel('KILLS 0/0', 6, '#aaaaaa');
    this.killLabel.height = '18px';
    killRow.addControl(this.killLabel);

    // ================================================================
    //  COINS ROW (top-right): [icon_coin] 0
    // ================================================================
    const coinRow = makeRow(
      Control.HORIZONTAL_ALIGNMENT_RIGHT,
      Control.VERTICAL_ALIGNMENT_TOP,
      '-8px', '8px', '140px', '26px',
    );
    this.adt.addControl(coinRow);

    const coinIcon = makeIcon('icon_coin', 20);
    coinRow.addControl(coinIcon);

    this.coinLabel = makeLabel('0', 8, '#ffd700');
    this.coinLabel.height = '22px';
    coinRow.addControl(this.coinLabel);

    // ================================================================
    //  WEAPON ROW (top-right, below coins): [icon_pistol] PISTOL
    // ================================================================
    const wepRow = makeRow(
      Control.HORIZONTAL_ALIGNMENT_RIGHT,
      Control.VERTICAL_ALIGNMENT_TOP,
      '-8px', '38px', '140px', '18px',
      'rgba(0,0,0,0.50)',
    );
    this.adt.addControl(wepRow);

    const wepIcon = makeIcon('icon_pistol', 14);
    wepRow.addControl(wepIcon);

    this.weapLabel = makeLabel('PISTOL', 6, '#aaaaaa');
    this.weapLabel.height = '18px';
    wepRow.addControl(this.weapLabel);

    // ================================================================
    //  STAGE LABEL (bottom-left): [icon_star] S1: JUNGLE BASE
    // ================================================================
    const stageRow = makeRow(
      Control.HORIZONTAL_ALIGNMENT_LEFT,
      Control.VERTICAL_ALIGNMENT_BOTTOM,
      '8px', '-32px', '230px', '18px',
      'rgba(0,0,0,0.50)',
    );
    this.adt.addControl(stageRow);

    const stageIcon = makeIcon('icon_star', 14);
    stageRow.addControl(stageIcon);

    this.stageLabel = makeLabel('STAGE 1', 6, '#888888');
    this.stageLabel.height = '18px';
    stageRow.addControl(this.stageLabel);

    // ================================================================
    //  BOSS HP BAR (top-center)
    // ================================================================
    this.bossPanel = new Rectangle('bossPnl');
    this.bossPanel.width        = '260px';
    this.bossPanel.height       = '36px';
    this.bossPanel.background   = 'rgba(0,0,0,0.88)';
    this.bossPanel.cornerRadius = 5;
    this.bossPanel.thickness    = 2;
    this.bossPanel.color        = '#7b1fa2';
    this.bossPanel.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
    this.bossPanel.verticalAlignment   = Control.VERTICAL_ALIGNMENT_TOP;
    this.bossPanel.top        = '8px';
    this.bossPanel.isVisible  = false;
    this.adt.addControl(this.bossPanel);

    this.bossBarFill = new Rectangle('bossFill');
    this.bossBarFill.width      = '100%';
    this.bossBarFill.height     = '10px';
    this.bossBarFill.background = '#ce93d8';
    this.bossBarFill.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
    this.bossBarFill.verticalAlignment   = Control.VERTICAL_ALIGNMENT_BOTTOM;
    this.bossBarFill.cornerRadius = 3;
    this.bossBarFill.thickness   = 0;
    this.bossPanel.addControl(this.bossBarFill);

    this.bossLabel = makeLabel('BOSS', 7, '#ffd700');
    this.bossLabel.top    = '-8px';
    this.bossLabel.height = '18px';
    this.bossPanel.addControl(this.bossLabel);

    // ================================================================
    //  WIN / LOSE OVERLAY
    // ================================================================
    this.overlayPanel = new Rectangle('overlay');
    this.overlayPanel.width      = '100%';
    this.overlayPanel.height     = '100%';
    this.overlayPanel.background = 'rgba(0,0,0,0.88)';
    this.overlayPanel.isVisible  = false;
    this.overlayPanel.thickness  = 0;
    this.adt.addControl(this.overlayPanel);

    this.overlayTitle = makeLabel('', 24, '#ffd700');
    this.overlayTitle.height = '40px';
    this.overlayPanel.addControl(this.overlayTitle);

    this.overlaySub = makeLabel('', 10, '#ffffff');
    this.overlaySub.top    = '50px';
    this.overlaySub.height = '20px';
    this.overlayPanel.addControl(this.overlaySub);
  }

  // ================================================================
  //  UPDATE (called every frame)
  // ================================================================
  update(state: HUDState): void {
    // HP bar
    const hpPct   = Math.max(0, Math.min(1, state.hp / state.maxHp));
    const hpColor = hpPct > 0.5 ? '#4caf50' : hpPct > 0.25 ? '#ff9800' : '#f44336';
    this.hpBarFill.width      = `${hpPct * 100}%`;
    this.hpBarFill.background = hpColor;
    this.hpLabel.text         = `${Math.ceil(state.hp)}/${state.maxHp}`;

    // Kill counter
    this.killLabel.text = `KILLS ${state.kills}/${state.totalEnemies}`;

    // Coins
    this.coinLabel.text = `${state.coins}`;

    // Weapon
    this.weapLabel.text = state.weaponName.slice(0, 12).toUpperCase();

    // Stage
    this.stageLabel.text = `S${state.stageId} ${state.stageName.slice(0, 14).toUpperCase()}`;

    // Boss bar
    if (state.bossActive) {
      this.bossPanel.isVisible = true;
      const bPct = Math.max(0, Math.min(1, state.bossHp / Math.max(1, state.bossMxHp)));
      this.bossBarFill.width = `${bPct * 100}%`;
      this.bossLabel.text    = state.bossName.slice(0, 20).toUpperCase();
    } else {
      this.bossPanel.isVisible = false;
    }

    // Floating texts
    this.floatPool = this.floatPool.filter(f => {
      f.ttl -= 0.016;
      const curTop = parseFloat(f.container.top as string) || 0;
      f.container.top   = (curTop - f.vy) + 'px';
      f.container.alpha = Math.min(1, f.ttl / 0.4);
      if (f.ttl <= 0) {
        this.adt.removeControl(f.container);
        return false;
      }
      return true;
    });
  }

  addFloat(screenX: number, screenY: number, text: string, color: string): void {
    if (this.floatPool.length >= 30) return;
    const container = new Rectangle('ft_' + Math.random().toString(36).slice(2));
    container.width      = '100px';
    container.height     = '20px';
    container.color      = 'transparent';
    container.background = 'transparent';
    container.thickness  = 0;
    container.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
    container.verticalAlignment   = Control.VERTICAL_ALIGNMENT_TOP;
    container.left = screenX + 'px';
    container.top  = screenY + 'px';
    this.adt.addControl(container);

    const tb = makeLabel(text, 9, color);
    tb.width  = '100%';
    tb.height = '100%';
    container.addControl(tb);

    this.floatPool.push({ tb, container, ttl: 0.8, vy: 0.7 });
  }

  showWin(coins: number): void {
    this.overlayPanel.isVisible = true;
    this.overlayTitle.text  = 'STAGE CLEAR';
    this.overlayTitle.color = '#ffd700';
    this.overlaySub.text    = `+${coins} COINS EARNED`;
  }

  showLose(): void {
    this.overlayPanel.isVisible = true;
    this.overlayTitle.text  = 'GAME OVER';
    this.overlayTitle.color = '#f44336';
    this.overlaySub.text    = '';
  }

  hideOverlay(): void {
    this.overlayPanel.isVisible = false;
  }

  dispose(): void {
    this.adt.dispose();
  }
}
