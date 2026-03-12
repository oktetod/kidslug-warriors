// =================================================================
//  KIDSLUG WARRIORS v2 - VIRTUAL JOYSTICK + ACTION BUTTONS
//  Built entirely with Babylon.js GUI for proper mobile handling
// =================================================================
import {
  AdvancedDynamicTexture, Ellipse, Control, Rectangle,
  Image as GuiImage,
} from '@babylonjs/gui';
import type { PlayerInput } from '@entities/Player.js';

export class VirtualJoystick {
  private adt:        AdvancedDynamicTexture;
  private baseCircle: Ellipse;
  private thumb:      Ellipse;

  private joyCenterX = 0;
  private joyCenterY = 0;
  private joyActive  = false;
  private joyId      = -1;
  private maxRadius  = 50; // px in GUI space

  // Normalized joystick output
  dx = 0;
  dy = 0;

  // Button states
  private btnShoot    = false;
  private btnJump     = false;
  private btnBombTap  = false;
  private btnHealTap  = false;
  private bombCount   = 0;
  private healCount   = 0;

  // Exposed button state getters
  get isShootHeld():  boolean { return this.btnShoot; }
  get isJumpHeld():   boolean { return this.btnJump;  }
  popBomb(): boolean {
    if (this.btnBombTap) { this.btnBombTap = false; return true; }
    return false;
  }
  popHeal(): boolean {
    if (this.btnHealTap) { this.btnHealTap = false; return true; }
    return false;
  }

  updateCounts(bombs: number, heals: number): void {
    this.bombCount = bombs;
    this.healCount = heals;
    this.bombLabel.text = `BOMB x${bombs}`;
    this.healLabel.text = `HEAL x${heals}`;
  }

  private bombLabel!: { text: string };
  private healLabel!: { text: string };

  constructor() {
    this.adt = AdvancedDynamicTexture.CreateFullscreenUI('HUD_CONTROLS');
    this.adt.isForeground = true;

    // ---- Joystick base ----
    this.baseCircle = new Ellipse('joyBase');
    this.baseCircle.width  = '130px';
    this.baseCircle.height = '130px';
    this.baseCircle.color  = 'rgba(255,255,255,0.2)';
    this.baseCircle.thickness = 2;
    this.baseCircle.background = 'rgba(255,255,255,0.06)';
    this.baseCircle.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
    this.baseCircle.verticalAlignment   = Control.VERTICAL_ALIGNMENT_BOTTOM;
    this.baseCircle.left   = '40px';
    this.baseCircle.top    = '-40px';
    this.adt.addControl(this.baseCircle);

    // ---- Joystick thumb ----
    this.thumb = new Ellipse('joyThumb');
    this.thumb.width  = '60px';
    this.thumb.height = '60px';
    this.thumb.color  = 'rgba(255,255,255,0.6)';
    this.thumb.thickness = 2.5;
    this.thumb.background = 'rgba(255,255,255,0.22)';
    this.thumb.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
    this.thumb.verticalAlignment   = Control.VERTICAL_ALIGNMENT_BOTTOM;
    this.thumb.left = '75px';
    this.thumb.top  = '-75px';
    this.adt.addControl(this.thumb);

    // ---- Action buttons ----
    this.makeButton('FIRE',  '#F44336', '72px',  '72px',  'right', 'bottom', '14px',  '-18px',  () => { this.btnShoot = true;  }, () => { this.btnShoot = false; });
    this.makeButton('JUMP',  '#2196F3', '56px',  '56px',  'right', 'bottom', '100px', '-80px',  () => { this.btnJump  = true;  }, () => { this.btnJump  = false; });
    this.makeButton('BOMB',  '#FF9800', '54px',  '54px',  'right', 'bottom', '175px', '-18px',  () => { this.btnBombTap = true; }, null);
    this.makeButton('HEAL',  '#4CAF50', '54px',  '54px',  'right', 'bottom', '175px', '-82px',  () => { this.btnHealTap = true; }, null);

    // Dummy label refs (updated via updateCounts)
    this.bombLabel = { text: 'BOMB x0' };
    this.healLabel = { text: 'HEAL x0' };

    // Touch events on the whole screen for joystick drag
    const canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
    canvas.addEventListener('pointerdown', this.onDown.bind(this), { passive: false });
    canvas.addEventListener('pointermove', this.onMove.bind(this), { passive: false });
    canvas.addEventListener('pointerup',   this.onUp.bind(this),   { passive: false });
    canvas.addEventListener('pointercancel', this.onUp.bind(this), { passive: false });
  }

  private makeButton(
    label:    string,
    color:    string,
    width:    string, height: string,
    hAlign:   string, vAlign:  string,
    right:    string, bottom:  string,
    onDown:   () => void,
    onUp:     (() => void) | null,
  ): void {
    const btn = new Ellipse('btn_' + label);
    btn.width  = width;
    btn.height = height;
    btn.color  = color;
    btn.thickness = 2;
    btn.background = color + '55';

    btn.horizontalAlignment = hAlign === 'right'
      ? Control.HORIZONTAL_ALIGNMENT_RIGHT
      : Control.HORIZONTAL_ALIGNMENT_LEFT;
    btn.verticalAlignment = vAlign === 'bottom'
      ? Control.VERTICAL_ALIGNMENT_BOTTOM
      : Control.VERTICAL_ALIGNMENT_TOP;
    btn.left  = hAlign === 'right' ? (parseInt(right)*-1)  + 'px' : right;
    btn.top   = vAlign === 'bottom' ? (parseInt(bottom)*-1) + 'px' : bottom;

    // Babylon GUI button events
    btn.onPointerDownObservable.add(() => onDown());
    if (onUp) btn.onPointerUpObservable.add(() => onUp());
    btn.onPointerOutObservable.add(() => { if (onUp) onUp(); });

    this.adt.addControl(btn);
  }

  // ---- Touch handlers for joystick --------------------------------
  private onDown(e: PointerEvent): void {
    // Only claim left-side touches for joystick
    const screenW = window.innerWidth;
    if (e.clientX > screenW * 0.45) return; // right side = buttons
    if (this.joyActive) return;
    this.joyActive  = true;
    this.joyId      = e.pointerId;
    this.joyCenterX = e.clientX;
    this.joyCenterY = e.clientY;
    e.preventDefault();
  }

  private onMove(e: PointerEvent): void {
    if (!this.joyActive || e.pointerId !== this.joyId) return;
    e.preventDefault();
    const rawDx = e.clientX - this.joyCenterX;
    const rawDy = e.clientY - this.joyCenterY;
    const dist  = Math.sqrt(rawDx*rawDx + rawDy*rawDy);
    const clamped = Math.min(dist, this.maxRadius);
    const angle   = Math.atan2(rawDy, rawDx);
    const tx = Math.cos(angle) * clamped;
    const ty = Math.sin(angle) * clamped;

    this.dx = tx / this.maxRadius;
    this.dy = ty / this.maxRadius;

    // Move thumb visual
    this.thumb.left = (75 + tx) + 'px';
    this.thumb.top  = (-75 - ty) + 'px';
  }

  private onUp(e: PointerEvent): void {
    if (e.pointerId !== this.joyId) return;
    this.joyActive = false;
    this.joyId     = -1;
    this.dx = 0;
    this.dy = 0;
    this.thumb.left = '75px';
    this.thumb.top  = '-75px';
  }

  // ---- Build PlayerInput from joystick + button state -------------
  buildInput(): PlayerInput {
    return {
      left:   this.dx < -0.28,
      right:  this.dx >  0.28,
      jump:   this.btnJump,
      shoot:  this.btnShoot,
      bomb:   false, // handled via pop
      heal:   false, // handled via pop
    };
  }

  dispose(): void {
    this.adt.dispose();
  }
}
