import Phaser from 'phaser';
import { JUMP_VEL, GRAVITY, PLAYER_SCALE, PLAYER_SPEED } from '../constants';
import type { WeaponDef } from '../../types';
import { WEAPONS } from '../constants';

export class Player extends Phaser.GameObjects.Sprite {
  declare scene: Phaser.Scene;
  declare body: Phaser.Physics.Arcade.Body;

  maxHealth = 3;
  health    = 3;
  score     = 0;
  coins     = 0;

  isAlive        = true;
  isCrouching    = false;
  isAimingUp     = false;
  facingRight    = true;
  isInvincible   = false;
  invincibleTimer = 0;
  shootCooldown  = 0;

  // FIX #7: track shoot animation so _updateSprite won't override it
  private shootAnimTimer = 0;

  equippedWeapon: WeaponDef;
  ownedWeapons: string[];
  weaponIndex  = 0;

  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private keys!: Record<string, Phaser.Input.Keyboard.Key>;
  private currentAnim = '';

  onShoot?:     (weapon: WeaponDef, x: number, y: number, dx: number, dy: number) => void;
  onDie?:       () => void;
  onHudUpdate?: () => void;

  constructor(scene: Phaser.Scene, x: number, y: number, ownedWeapons: string[]) {
    super(scene, x, y, 'p_idle_0');
    this.scene        = scene;
    this.ownedWeapons = ownedWeapons.length ? ownedWeapons : ['pistol', 'grenade'];
    this.equippedWeapon = WEAPONS[this.ownedWeapons[0]] || WEAPONS['pistol'];

    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setScale(PLAYER_SCALE).setDepth(10);

    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setGravityY(GRAVITY);
    body.setCollideWorldBounds(true);
    body.setSize(18, 34);
    body.setOffset(7, 2);

    this.cursors = scene.input.keyboard!.createCursorKeys();
    this.keys = {
      a: scene.input.keyboard!.addKey('A'),
      d: scene.input.keyboard!.addKey('D'),
      s: scene.input.keyboard!.addKey('S'),
      w: scene.input.keyboard!.addKey('W'),
      j: scene.input.keyboard!.addKey('J'),
      e: scene.input.keyboard!.addKey('E'),
      q: scene.input.keyboard!.addKey('Q'),
    };
  }

  update(delta: number) {
    if (!this.isAlive) return;

    const body     = this.body as Phaser.Physics.Arcade.Body;
    const onGround = body.blocked.down;
    const left  = this.cursors.left.isDown  || this.keys.a.isDown;
    const right = this.cursors.right.isDown || this.keys.d.isDown;
    const down  = this.cursors.down.isDown  || this.keys.s.isDown;
    const up    = this.cursors.up.isDown    || this.keys.w.isDown;
    const jump  = this.cursors.space.isDown;
    const shoot = this.keys.j.isDown;
    const sw    = Phaser.Input.Keyboard.JustDown(this.keys.e) || Phaser.Input.Keyboard.JustDown(this.keys.q);

    // Invincibility blink
    if (this.isInvincible) {
      this.invincibleTimer -= delta;
      this.setAlpha(Math.sin(this.invincibleTimer / 50) > 0 ? 1 : 0.4);
      if (this.invincibleTimer <= 0) { this.isInvincible = false; this.setAlpha(1); }
    }

    if (this.shootCooldown > 0)  this.shootCooldown -= delta;
    // FIX #7: count down the shoot-anim lock timer
    if (this.shootAnimTimer > 0) this.shootAnimTimer -= delta;

    if (sw) this.cycleWeapon();

    this.isCrouching = onGround && down;
    this.isAimingUp  = up && !jump && onGround;

    if (this.isCrouching) {
      body.setVelocityX(0);
    } else {
      if (left)       { body.setVelocityX(-PLAYER_SPEED); this.facingRight = false; }
      else if (right) { body.setVelocityX(PLAYER_SPEED);  this.facingRight = true;  }
      else              body.setVelocityX(0);
    }

    if ((jump || up) && onGround && !this.isCrouching) body.setVelocityY(JUMP_VEL);

    if (shoot && this.shootCooldown <= 0) this.fireWeapon();

    this._updateSprite(onGround, left || right);
    this.setFlipX(!this.facingRight);
  }

  private _playAnim(key: string) {
    if (this.currentAnim === key && this.anims.isPlaying) return;
    this.currentAnim = key;
    this.anims.play(key, true);
  }

  private _updateSprite(onGround: boolean, moving: boolean) {
    const body = this.body as Phaser.Physics.Arcade.Body;

    // FIX #7: don't override shooting animation while it's still playing
    if (this.shootAnimTimer > 0) return;

    if (this.isCrouching) {
      this.anims.stop(); this.setTexture('p_crouch');
      this.currentAnim = '';
    } else if (!onGround) {
      this.anims.stop();
      this.setTexture(body.velocity.y < 0 ? 'p_jump' : 'p_land');
      this.currentAnim = '';
    } else if (this.isAimingUp) {
      this._playAnim('anim_up');
    } else if (moving) {
      this._playAnim('anim_walk');
    } else {
      this._playAnim('anim_idle');
    }
  }

  private fireWeapon() {
    this.shootCooldown = this.equippedWeapon.fireRate;

    const body = this.body as Phaser.Physics.Arcade.Body;
    const bx   = this.x + (this.facingRight ? 22 : -22);
    const by   = this.isCrouching ? body.y + 22 : this.isAimingUp ? this.y - 24 : this.y - 2;
    const dx   = this.facingRight ? 1 : -1;
    const dy   = this.isAimingUp  ? -1 : 0;

    try { this.scene.sound.play(this.equippedWeapon.sound, { volume: 0.7 }); } catch {}
    this.onShoot?.(this.equippedWeapon, bx, by, dx, dy);

    // FIX #7: play shoot anim and lock _updateSprite for its duration
    if (this.equippedWeapon.id === 'knife') {
      this.anims.play('anim_knife', true);
      this.currentAnim   = 'anim_knife';
      this.shootAnimTimer = 8 / 18 * 1000; // 8 frames @ 18fps
    } else if (this.equippedWeapon.id === 'grenade' && this.isCrouching) {
      this.anims.play('anim_cg', true);
      this.currentAnim   = 'anim_cg';
      this.shootAnimTimer = 12 / 12 * 1000; // 12 frames @ 12fps
    } else {
      this.anims.play('anim_shoot', true);
      this.currentAnim   = 'anim_shoot';
      this.shootAnimTimer = 8 / 16 * 1000; // 8 frames @ 16fps
    }
  }

  cycleWeapon() {
    this.weaponIndex    = (this.weaponIndex + 1) % this.ownedWeapons.length;
    this.equippedWeapon = WEAPONS[this.ownedWeapons[this.weaponIndex]] || WEAPONS['pistol'];
    try { this.scene.sound.play('reload', { volume: 0.5 }); } catch {}
    this.onHudUpdate?.();
  }

  selectWeapon(id: string) {
    const idx = this.ownedWeapons.indexOf(id);
    if (idx !== -1) {
      this.weaponIndex    = idx;
      this.equippedWeapon = WEAPONS[id];
      this.onHudUpdate?.();
    }
  }

  takeDamage(amount = 1) {
    if (this.isInvincible || !this.isAlive) return;
    this.health -= amount;
    try { this.scene.sound.play('gettinghit', { volume: 0.6 }); } catch {}
    this.isInvincible   = true;
    this.invincibleTimer = 1600;
    this.onHudUpdate?.();
    if (this.health <= 0) this.die();
  }

  die() {
    this.isAlive = false;
    this.anims.stop();
    this.setTexture('p_death1');
    try { this.scene.sound.play('death', { volume: 0.8 }); } catch {}
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setVelocityX(0);
    this.scene.time.delayedCall(600,  () => { this.setTexture('p_death2'); });
    this.scene.time.delayedCall(1600, () => this.onDie?.());
  }

  addCoins(n: number) { this.coins += n; this.onHudUpdate?.(); }
  addScore(n: number) { this.score += n; this.onHudUpdate?.(); }
}
