import Phaser from 'phaser';
import { ENEMY_DEFS } from '../constants';
import type { EnemyType } from '../../types';

const TEX: Record<EnemyType, string> = {
  scientist: 'e_scientist', zombie: 'e_zombie', tank: 'e_tank',
  helicopter: 'e_heli', airship: 'e_airship', mechaRobot: 'e_mecha', ufo: 'e_ufo',
};
const TEX_DEATH: Record<EnemyType, string> = {
  scientist: 'e_scientist_death', zombie: 'e_zombie_death', tank: 'e_tank_death',
  helicopter: 'e_heli_death', airship: 'e_airship_death', mechaRobot: 'e_mecha_death', ufo: 'e_ufo_death',
};
const TEX_BULLET: Record<EnemyType, string> = {
  scientist: 'e_sci_bullet', zombie: '', tank: 'e_tank_bullet',
  helicopter: 'e_heli_bullet', airship: 'e_airship_atk', mechaRobot: 'e_mecha_atk', ufo: 'e_ufo_bullet',
};

export class Enemy extends Phaser.GameObjects.Sprite {
  declare scene: Phaser.Scene;
  declare body: Phaser.Physics.Arcade.Body;
  enemyType: EnemyType;

  maxHp: number; hp: number; speed: number;
  damage: number; coinValue: number; scoreValue: number;
  isFlying: boolean; isBoss: boolean;
  shootRange: number; shootRate: number;
  meleeRange: number; attackRate: number;
  // FIX #5: start shootTimer at a random positive delay so enemies don't fire instantly
  shootTimer = 0;
  attackTimer = 0;
  dead = false;

  hpBarBg?: Phaser.GameObjects.Graphics;
  hpBarFg?: Phaser.GameObjects.Graphics;

  onShoot?: (x: number, y: number, dx: number, speed: number, tex: string) => void;
  onDie?:   (e: Enemy) => void;

  constructor(scene: Phaser.Scene, x: number, y: number, type: EnemyType) {
    const def = ENEMY_DEFS[type];
    super(scene, x, y, TEX[type]);
    this.scene      = scene;
    this.enemyType  = type;
    this.maxHp      = def.hp;       this.hp         = def.hp;
    this.speed      = def.speed;    this.damage     = def.damage;
    this.coinValue  = def.coinValue; this.scoreValue = def.scoreValue;
    this.isFlying   = def.isFlying  ?? false;
    this.isBoss     = def.isBoss    ?? false;
    this.shootRange = def.shootRange ?? 0;
    this.shootRate  = def.shootRate  ?? 9999;
    this.meleeRange = def.meleeRange ?? 0;
    this.attackRate = def.attackRate ?? 9999;

    // FIX #5: random initial delay (half to full shootRate) so first shot isn't instant
    this.shootTimer  = this.shootRate * (0.5 + Math.random() * 0.5);
    this.attackTimer = this.attackRate * (0.5 + Math.random() * 0.5);

    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setScale(def.scale).setDepth(9);

    // FIX #11: set allowGravity BEFORE setGravityY to avoid ordering bug
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setCollideWorldBounds(true);
    if (this.isFlying) {
      body.setAllowGravity(false);
    } else {
      body.setAllowGravity(true);
      body.setGravityY(900);
    }
    body.setImmovable(this.isBoss);

    if (this.isBoss) {
      this.hpBarBg = scene.add.graphics().setDepth(55);
      this.hpBarFg = scene.add.graphics().setDepth(56);
    }
  }

  update(delta: number, playerX: number, playerY: number) {
    if (this.dead) return;

    const body = this.body as Phaser.Physics.Arcade.Body;
    const dist = Phaser.Math.Distance.Between(this.x, this.y, playerX, playerY);
    const dx   = playerX < this.x ? -1 : 1;
    this.setFlipX(dx < 0);

    if (!this.isFlying) {
      body.setVelocityX(dx * this.speed);
    } else {
      const targetY = this.isBoss ? playerY - 160 : playerY - 90;
      const yDir    = this.y > targetY ? -1 : 1;
      body.setVelocityX(dx * this.speed * 0.65);
      body.setVelocityY(yDir * this.speed * 0.4);
    }

    // Ranged attack
    if (this.shootRange > 0 && dist < this.shootRange) {
      this.shootTimer -= delta;
      if (this.shootTimer <= 0) {
        this.shootTimer = this.shootRate + Phaser.Math.Between(-400, 400);
        const btex = TEX_BULLET[this.enemyType];
        if (btex) {
          this.onShoot?.(this.x + dx * 22, this.y - 4, dx, 290, btex);
          try { this.scene.sound.play(ENEMY_DEFS[this.enemyType].sound, { volume: 0.28 }); } catch {}
        }
      }
    }

    // Boss HP bar (follows camera scroll)
    if (this.isBoss && this.hpBarBg && this.hpBarFg) {
      const cx  = this.scene.cameras.main.scrollX;
      const pct = Math.max(0, this.hp / this.maxHp);
      const bW  = 876;
      this.hpBarBg.clear();
      this.hpBarBg.fillStyle(0x000000, 0.7);
      this.hpBarBg.fillRect(cx + 202, 648, bW, 22);
      this.hpBarBg.lineStyle(2, 0xff4444);
      this.hpBarBg.strokeRect(cx + 200, 646, bW + 4, 26);
      this.hpBarFg.clear();
      const r = Math.floor(255 * (1 - pct));
      const g = Math.floor(200 * pct);
      this.hpBarFg.fillStyle(Phaser.Display.Color.GetColor(r, g, 20));
      this.hpBarFg.fillRect(cx + 202, 648, bW * pct, 22);
    }
  }

  takeDamage(amount: number): boolean {
    if (this.dead) return false;
    this.hp -= amount;
    this.setTint(0xff4444);
    this.scene.time.delayedCall(90, () => { if (!this.dead) this.clearTint(); });
    if (this.hp <= 0) { this.die(); return true; }
    return false;
  }

  die() {
    this.dead = true;
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setVelocity(0, 0);
    body.setAllowGravity(false);
    this.setTexture(TEX_DEATH[this.enemyType]);
    this.hpBarBg?.destroy();
    this.hpBarFg?.destroy();
    this.scene.time.delayedCall(550, () => { this.onDie?.(this); this.destroy(); });
  }
}
