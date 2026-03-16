import Phaser from 'phaser';
import type { WeaponDef } from '../../types';

export class Bullet extends Phaser.GameObjects.Sprite {
  declare body: Phaser.Physics.Arcade.Body;
  damage: number;
  isExplosive: boolean;
  splashRadius: number;
  isMelee: boolean;
  isEnemyBullet: boolean;
  lifespan = 2400;

  constructor(
    scene: Phaser.Scene, x: number, y: number,
    weapon: WeaponDef, dirX: number, dirY: number,
    isEnemyBullet = false,
    overrideTex?: string, overrideDmg?: number, overrideSpeed?: number,
  ) {
    const isGren  = weapon.isExplosive && !isEnemyBullet;
    const tex = overrideTex ?? (isGren ? 'b_grenade' : isEnemyBullet ? 'e_sci_bullet' : (dirY !== 0 ? 'b_up' : 'b_player'));

    super(scene, x, y, tex);
    this.damage      = overrideDmg  ?? weapon.damage;
    this.isExplosive = weapon.isExplosive ?? false;
    this.splashRadius = weapon.splashRadius ?? 0;
    this.isMelee     = (weapon.range ?? 0) > 0;
    this.isEnemyBullet = isEnemyBullet;

    scene.add.existing(this);
    scene.physics.add.existing(this);

    const speed  = overrideSpeed ?? (weapon.bulletSpeed || 500);
    const body   = this.body as Phaser.Physics.Arcade.Body;
    body.setAllowGravity(isGren);
    if (isGren) body.setGravityY(480);
    body.setVelocityX(dirX * speed);
    body.setVelocityY(dirY !== 0 ? dirY * speed : 0);

    this.setScale(isEnemyBullet ? 2.5 : (isGren ? 2.5 : 2));
    this.setDepth(8);
    this.setFlipX(dirX < 0);

    scene.time.delayedCall(this.lifespan, () => { if (this.active) this.explode(true); });
  }

  explode(silent = false) {
    if (!this.active) return;
    if (!silent) {
      if (this.isExplosive) {
        const exp = this.scene.add.sprite(this.x, this.y, 'gexp_0').setScale(3).setDepth(20);
        exp.play('anim_gexp');
        exp.once('animationcomplete', () => exp.destroy());
        try { this.scene.sound.play('explosion', {volume:0.65}); } catch {}
      } else {
        const exp = this.scene.add.sprite(this.x, this.y, 'bexp_0').setScale(2).setDepth(20);
        exp.play('anim_bexp');
        exp.once('animationcomplete', () => exp.destroy());
      }
    }
    this.destroy();
  }
}

export class BulletGroup extends Phaser.Physics.Arcade.Group {
  spawnBullet(scene: Phaser.Scene, x: number, y: number, weapon: WeaponDef, dirX: number, dirY: number) {
    if ((weapon.range ?? 0) > 0) return; // melee handled separately

    if (weapon.spreadCount && weapon.spreadCount > 1) {
      const n = weapon.spreadCount;
      const step = 12;
      const start = -(n - 1) * step / 2;
      for (let i = 0; i < n; i++) {
        const ang = Phaser.Math.DegToRad(start + i * step);
        const dx  = dirX * Math.cos(ang);
        const dy  = Math.sin(ang);
        const b   = new Bullet(scene, x, y, weapon, dx, dy);
        this.add(b, true);
      }
    } else {
      const b = new Bullet(scene, x, y, weapon, dirX, dirY);
      this.add(b, true);
    }
  }

  spawnEnemyBullet(scene: Phaser.Scene, x: number, y: number, dx: number, speed: number, tex: string) {
    const fakeW: WeaponDef = {
      id:'pistol', name:'', price:0, isDefault:false, damage:18,
      fireRate:1000, bulletSpeed:speed, description:'', emoji:'', sound:'',
    };
    const b = new Bullet(scene, x, y, fakeW, dx, 0, true, tex, 18, speed);
    this.add(b, true);
    return b;
  }
}
