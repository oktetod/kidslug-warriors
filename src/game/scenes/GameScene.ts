import Phaser from 'phaser';
import { Player } from '../objects/Player';
import { Enemy } from '../objects/Enemy';
import { BulletGroup } from '../objects/Bullet';
// FIX #9: removed unused WEAPONS import
import { GROUND_Y, MAP_WIDTH, GAME_WIDTH, GAME_HEIGHT, STAGES, ENEMY_DEFS } from '../constants';
import type { WeaponDef, EnemyType, GameEventPayload } from '../../types';

export class GameScene extends Phaser.Scene {
  private player!: Player;
  private playerBullets!: BulletGroup;
  private enemyBullets!: BulletGroup;
  private enemies!: Phaser.GameObjects.Group;
  private ground!: Phaser.Physics.Arcade.StaticGroup;
  private bgMusic?: Phaser.Sound.BaseSound;
  private floatTexts: { text: Phaser.GameObjects.Text; vy: number; life: number }[] = [];

  private stageId           = 1;
  private _ownedWeapons: string[] = ['pistol', 'grenade'];
  private _startCoins       = 0;
  private spawnQueue: { type: EnemyType; at: number }[] = [];
  private spawnTimer        = 0;
  private totalKills        = 0;
  private stageComplete     = false;
  private stageClearPending = false;

  // Exposed to React (not private so GameCanvas can access)
  _mobileInterface?: Record<string, (k?: string) => void>;
  _hudHooked?: boolean;

  constructor() { super({ key: 'GameScene' }); }

  init(data: { stage?: number; ownedWeapons?: string[]; playerCoins?: number }) {
    this.stageId       = data.stage         ?? 1;
    this._ownedWeapons = data.ownedWeapons  ?? ['pistol', 'grenade'];
    this._startCoins   = data.playerCoins   ?? 0;
    this.spawnQueue    = [];
    this.spawnTimer    = 0;
    this.totalKills    = 0;
    this.stageComplete     = false;
    this.stageClearPending = false;
    this.floatTexts    = [];
    // FIX #1: reset hook flag so GameCanvas re-attaches listener after restart
    this._hudHooked    = false;
  }

  create() {
    const stage = STAGES.find(s => s.id === this.stageId) ?? STAGES[0];

    // World bounds
    this.physics.world.setBounds(0, 0, MAP_WIDTH, GAME_HEIGHT);
    this.cameras.main.setBounds(0, 0, MAP_WIDTH, GAME_HEIGHT);

    // Map background
    this.add.image(MAP_WIDTH / 2, GAME_HEIGHT / 2, 'map1')
      .setDisplaySize(MAP_WIDTH, GAME_HEIGHT).setDepth(0);

    // FIX #8: Ground rect center placed so its TOP EDGE = GROUND_Y
    // Player body (34px) lands with bottom at GROUND_Y → center at GROUND_Y - 17
    this.ground = this.physics.add.staticGroup();
    const groundH = 60;
    const groundY = GROUND_Y + groundH / 2; // top edge at GROUND_Y
    const gRect = this.add.rectangle(MAP_WIDTH / 2, groundY, MAP_WIDTH, groundH, 0x000000, 0).setDepth(0);
    this.physics.add.existing(gRect, true);
    this.ground.add(gRect as unknown as Phaser.GameObjects.GameObject);

    // Bullet & enemy groups
    this.playerBullets = new BulletGroup(this.physics.world, this);
    this.enemyBullets  = new BulletGroup(this.physics.world, this);
    this.enemies       = this.add.group();

    // Player — spawns just above the ground
    this.player = new Player(this, 120, GROUND_Y - 50, this._ownedWeapons);
    this.player.coins = this._startCoins;
    this.physics.add.collider(this.player, this.ground);

    this.player.onShoot = (weapon: WeaponDef, x: number, y: number, dx: number, dy: number) => {
      if ((weapon.range ?? 0) > 0) {
        this._meleeAttack(x, y, weapon.damage);
      } else {
        this.playerBullets.spawnBullet(this, x, y, weapon, dx, dy);
      }
    };
    this.player.onHudUpdate = () => this._emitHud();
    this.player.onDie       = () => this._handlePlayerDeath();

    this.cameras.main.startFollow(this.player, true, 0.08, 0.08);

    // Build spawn queue for this stage
    this._buildSpawnQueue(stage);

    // Background music
    try {
      this.bgMusic = this.sound.add(stage.bgm, { loop: true, volume: 0.38 });
      this.bgMusic.play();
      this.time.delayedCall(200, () => {
        try { this.sound.play('mission1', { volume: 0.75 }); } catch {}
      });
    } catch {}

    // Collisions
    this.physics.add.overlap(
      this.playerBullets, this.enemies,
      this._onBulletHitEnemy as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback,
      undefined, this,
    );
    this.physics.add.overlap(
      this.enemyBullets, this.player,
      this._onEnemyBulletHitPlayer as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback,
      undefined, this,
    );
    this.physics.add.overlap(
      this.player, this.enemies,
      this._onPlayerTouchEnemy as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback,
      undefined, this,
    );

    this._setupMobileInterface();
    this._emitHud();
  }

  private _buildSpawnQueue(stage: typeof STAGES[0]) {
    let t = 2200;
    for (const wave of stage.enemies) {
      for (let i = 0; i < wave.count; i++) {
        this.spawnQueue.push({ type: wave.type, at: t });
        t += wave.spawnInterval + Phaser.Math.Between(-600, 600);
      }
    }
    this.spawnQueue.sort((a, b) => a.at - b.at);
  }

  update(_time: number, delta: number) {
    if (!this.player?.isAlive) return;

    this.player.update(delta);

    // Timed spawning
    this.spawnTimer += delta;
    while (this.spawnQueue.length && this.spawnQueue[0].at <= this.spawnTimer) {
      this._spawnEnemy(this.spawnQueue.shift()!.type);
    }

    // Update all enemies
    for (const e of this.enemies.getChildren() as Enemy[]) {
      if (!e.dead) e.update(delta, this.player.x, this.player.y);
    }

    // Float damage/coin text
    for (let i = this.floatTexts.length - 1; i >= 0; i--) {
      const ft = this.floatTexts[i];
      ft.text.y -= ft.vy * (delta / 1000);
      ft.life   -= delta;
      ft.text.setAlpha(Math.max(0, ft.life / 750));
      if (ft.life <= 0) { ft.text.destroy(); this.floatTexts.splice(i, 1); }
    }

    // Stage-clear check: all spawns done AND all enemies removed from group
    if (!this.stageComplete && !this.stageClearPending &&
        this.spawnQueue.length === 0 &&
        this.enemies.countActive(true) === 0 &&
        this.spawnTimer > 2200) {
      this.stageClearPending = true;
      this.time.delayedCall(1400, () => this._stageClear());
    }
  }

  private _spawnEnemy(type: EnemyType) {
    const def    = ENEMY_DEFS[type];
    const camR   = this.cameras.main.scrollX + GAME_WIDTH;
    const spawnX = Math.min(MAP_WIDTH - 120, camR + 130);
    const spawnY = def.isFlying ? Phaser.Math.Between(110, 420) : GROUND_Y - 60;

    const enemy = new Enemy(this, spawnX, spawnY, type);

    enemy.onShoot = (x, y, dx, speed, tex) => {
      this.enemyBullets.spawnEnemyBullet(this, x, y, dx, speed, tex);
    };
    enemy.onDie = (e) => {
      this.enemies.remove(e, false, false);
      this.totalKills++;
      this.player.addScore(e.scoreValue);
      this.player.addCoins(e.coinValue);
      this._floatText(`+${e.coinValue}🪙`, e.x, e.y - 24, '#FFD700');
      this._floatText(`+${e.scoreValue}`, e.x, e.y - 55, '#00FF88');
      if (e.isBoss) {
        this._emitBossHp(0);
        try { this.sound.play('finalwave', { volume: 0.8 }); } catch {}
      }
      this._emitHud();
    };

    this.enemies.add(enemy);
    if (!def.isFlying) this.physics.add.collider(enemy, this.ground);
    if (enemy.isBoss)  this._emitBossHp(1);
  }

  private _onBulletHitEnemy(bulletObj: unknown, enemyObj: unknown) {
    const b = bulletObj as import('../objects/Bullet').Bullet;
    const e = enemyObj  as Enemy;
    if (!b.active || e.dead) return;

    if (b.isExplosive) {
      // Splash damage to all enemies within radius
      for (const en of this.enemies.getChildren() as Enemy[]) {
        if (!en.dead) {
          const d = Phaser.Math.Distance.Between(b.x, b.y, en.x, en.y);
          if (d < b.splashRadius) en.takeDamage(b.damage);
        }
      }
    } else {
      e.takeDamage(b.damage);
    }

    if (e.isBoss && !e.dead) this._emitBossHp(e.hp / e.maxHp);
    b.explode();
  }

  private _onEnemyBulletHitPlayer(playerObj: unknown, bulletObj: unknown) {
    const b = bulletObj as import('../objects/Bullet').Bullet;
    if (!b.active) return;
    b.explode(true);
    (playerObj as Player).takeDamage(1);
  }

  private _onPlayerTouchEnemy(playerObj: unknown, enemyObj: unknown) {
    const e = enemyObj as Enemy;
    if (e.dead) return;
    (playerObj as Player).takeDamage(1);
  }

  private _meleeAttack(x: number, y: number, dmg: number) {
    for (const e of this.enemies.getChildren() as Enemy[]) {
      if (!e.dead && Math.abs(e.x - x) < 100 && Math.abs(e.y - y) < 65) {
        e.takeDamage(dmg);
      }
    }
    const exp = this.add.sprite(x, y, 'bexp_0').setScale(2.5).setDepth(20);
    exp.play('anim_bexp');
    exp.once('animationcomplete', () => exp.destroy());
  }

  private _handlePlayerDeath() {
    this.bgMusic?.stop();
    this.cameras.main.shake(320, 0.022);
    this.time.delayedCall(2000, () => {
      this.events.emit('gameEvent', {
        type: 'gameover',
        value: JSON.stringify({
          score: this.player.score,
          coins: this.player.coins,
          kills: this.totalKills,
        }),
      } as GameEventPayload);
    });
  }

  private _stageClear() {
    if (this.stageComplete) return;
    this.stageComplete = true;
    this.bgMusic?.stop();
    try { this.sound.play('victory', { volume: 0.9 }); } catch {}
    this.player.anims.play('anim_vic', true);

    const stage = STAGES.find(s => s.id === this.stageId)!;
    this.player.addCoins(stage.coinReward);
    this._floatText(`MISSION COMPLETE! +${stage.coinReward}🪙`, this.player.x, this.player.y - 90, '#FFD700', 28);
    this._emitHud();

    this.time.delayedCall(3200, () => {
      this.events.emit('gameEvent', {
        type: 'stageclear',
        value: JSON.stringify({
          stage:       this.stageId,
          score:       this.player.score,
          coins:       this.player.coins,   // total coins (start + earned) for delta calc in GameCanvas
          kills:       this.totalKills,
          coinReward:  stage.coinReward,
        }),
      } as GameEventPayload);
    });
  }

  private _floatText(text: string, x: number, y: number, color = '#fff', size = 20) {
    const t = this.add.text(x, y, text, {
      fontFamily: 'monospace', fontSize: `${size}px`, color,
      stroke: '#000', strokeThickness: 3,
    }).setDepth(30).setOrigin(0.5);
    this.floatTexts.push({ text: t, vy: 62, life: 780 });
  }

  private _emitHud() {
    const p = this.player;
    this.events.emit('gameEvent', {
      type: 'score',
      value: JSON.stringify({
        score:     p.score,
        coins:     p.coins,
        health:    p.health,
        maxHealth: p.maxHealth,
        weapon:    p.equippedWeapon.name,
        stage:     this.stageId,
      }),
    } as GameEventPayload);
  }

  private _emitBossHp(pct: number) {
    this.events.emit('gameEvent', { type: 'bosshp', value: pct } as GameEventPayload);
  }

  // ── Mobile touch interface (accessed by React GameCanvas) ────
  private _setupMobileInterface() {
    this._mobileInterface = {
      left:  ()          => this._fakeKey('LEFT',  true),
      right: ()          => this._fakeKey('RIGHT', true),
      up:    ()          => this._fakeKey('SPACE', true),
      down:  ()          => this._fakeKey('DOWN',  true),
      shoot: ()          => this._fakeKey('J',     true),
      release: (k?: string) => {
        const map: Record<string, string> = {
          left: 'LEFT', right: 'RIGHT', up: 'SPACE', down: 'DOWN', shoot: 'J',
        };
        if (k && map[k]) this._fakeKey(map[k], false);
      },
      switchWeapon: () => this.player?.cycleWeapon(),
    };
  }

  private _fakeKey(keyName: string, down: boolean) {
    try {
      const kb = this.input.keyboard!;
      // FIX #12: Phaser.Input.Keyboard.KeyCodes uses uppercase keys.
      // 'J' exists in KeyCodes. This lookup is correct.
      const kc = (Phaser.Input.Keyboard.KeyCodes as Record<string, number>)[keyName];
      if (!kc) return;
      const key = kb.addKey(kc) as unknown as { isDown: boolean; isUp: boolean };
      key.isDown = down;
      key.isUp   = !down;
    } catch {}
  }

  shutdown() {
    this.bgMusic?.stop();
    this.bgMusic?.destroy();
    this.floatTexts.forEach(ft => { try { ft.text.destroy(); } catch {} });
    this.floatTexts = [];
  }
}
