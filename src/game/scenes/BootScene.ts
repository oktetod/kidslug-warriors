import Phaser from 'phaser';

export class BootScene extends Phaser.Scene {
  constructor() { super({ key: 'BootScene' }); }

  preload() {
    const W = this.scale.width;
    const H = this.scale.height;

    this.add.rectangle(W/2, H/2, W, H, 0x0a0a1e);
    this.add.text(W/2, H/2 - 80, 'KIDSLUG WARRIORS', {
      fontFamily: 'monospace', fontSize: '36px', color: '#ffcc00',
      stroke: '#aa0000', strokeThickness: 5,
    }).setOrigin(0.5);

    const border = this.add.graphics();
    border.lineStyle(3, 0xffcc00);
    border.strokeRect(W/2 - 205, H/2 + 20, 410, 30);
    const bar   = this.add.graphics();
    const label = this.add.text(W/2, H/2 - 10, 'Loading... 0%', {
      fontFamily: 'monospace', fontSize: '18px', color: '#ffffff',
    }).setOrigin(0.5);

    this.load.on('progress', (v: number) => {
      bar.clear();
      bar.fillStyle(0xffcc00);
      bar.fillRect(W/2 - 202, H/2 + 23, 404 * v, 24);
      label.setText(`Loading... ${Math.floor(v * 100)}%`);
    });

    // ── Map ──────────────────────────────────────────────────
    this.load.image('map1', '/assets/Metal_Slug/Map1.png');

    // ── Player static poses ──────────────────────────────────
    this.load.image('p_jump',        '/assets/Metal_Slug/Player/PlayerJump.png');
    this.load.image('p_crouch',      '/assets/Metal_Slug/Player/PlayerCrouch.png');
    this.load.image('p_death1',      '/assets/Metal_Slug/Player/PlayerDeath1.png');
    this.load.image('p_death2',      '/assets/Metal_Slug/Player/PlayerDeath2.png');
    this.load.image('p_land',        '/assets/Metal_Slug/Player/PlayerLand.png');

    // FIX #6: PlayerStanding has 11 frames (0-10), was only loading 0-9
    for (let i = 0; i <= 10; i++) this.load.image(`p_idle_${i}`, `/assets/Metal_Slug/PlayerStanding/${i}.png`);
    for (let i = 0; i <= 22; i++) this.load.image(`p_walk_${i}`, `/assets/Metal_Slug/PlayerWalking/${i}.png`);
    for (let i = 0; i <= 7;  i++) this.load.image(`p_shoot_${i}`,`/assets/Metal_Slug/PlayerShooting/${i}.png`);
    for (let i = 0; i <= 7;  i++) this.load.image(`p_knife_${i}`,`/assets/Metal_Slug/PlayerKnife/${i}.png`);
    for (let i = 0; i <= 7;  i++) this.load.image(`p_up_${i}`,   `/assets/Metal_Slug/PlayerUp/${i}.png`);
    for (let i = 0; i <= 11; i++) this.load.image(`p_cg_${i}`,   `/assets/Metal_Slug/PlayerCrouchGrenade/${i}.png`);
    for (let i = 0; i <= 6;  i++) this.load.image(`p_vic_${i}`,  `/assets/Metal_Slug/PlayerVictory/${i}.png`);

    // ── Projectiles ──────────────────────────────────────────
    this.load.image('b_player',  '/assets/Metal_Slug/RegAttack.png');
    this.load.image('b_grenade', '/assets/Metal_Slug/Grenade.png');
    this.load.image('b_up',      '/assets/Metal_Slug/BulletUp.png');
    for (let i = 0; i <= 10; i++) this.load.image(`bexp_${i}`, `/assets/Metal_Slug/ProjectileBulletExplosion/${i}.png`);
    for (let i = 0; i <= 19; i++) this.load.image(`gexp_${i}`, `/assets/Metal_Slug/ProjectileGrenadeExplosion/${i}.png`);

    // ── Enemies ──────────────────────────────────────────────
    this.load.image('e_scientist',       '/assets/Metal_Slug/EnemyScientist/Scientist.png');
    this.load.image('e_scientist_death', '/assets/Metal_Slug/EnemyScientist/ScientistDeath.png');
    this.load.image('e_sci_bullet',      '/assets/Metal_Slug/EnemyScientist/ScientistBullet.png');
    this.load.image('e_zombie',          '/assets/Metal_Slug/EnemyZombieMacro/Zombie.png');
    this.load.image('e_zombie_death',    '/assets/Metal_Slug/EnemyZombieMacro/ZombieDeath.png');
    this.load.image('e_tank',            '/assets/Metal_Slug/EnemyTank/EnemyTank.png');
    this.load.image('e_tank_death',      '/assets/Metal_Slug/EnemyTank/TankDeath.png');
    this.load.image('e_tank_bullet',     '/assets/Metal_Slug/EnemyTank/TankBullet.png');
    this.load.image('e_heli',            '/assets/Metal_Slug/EnemyHelicopter/EnemyHelicopter.png');
    this.load.image('e_heli_death',      '/assets/Metal_Slug/EnemyHelicopter/HelicopterDeath.png');
    this.load.image('e_heli_bullet',     '/assets/Metal_Slug/EnemyHelicopter/HelicopterBullet.png');
    this.load.image('e_airship',         '/assets/Metal_Slug/EnemyAirship/EnemyAirship.png');
    this.load.image('e_airship_atk',     '/assets/Metal_Slug/EnemyAirship/AirshipAttack.png');
    this.load.image('e_airship_death',   '/assets/Metal_Slug/EnemyAirship/AirshipDeath.png');
    this.load.image('e_mecha',           '/assets/Metal_Slug/EnemyMechaRobot/EnemyMechaRobot.png');
    this.load.image('e_mecha_atk',       '/assets/Metal_Slug/EnemyMechaRobot/MechaRobotAttack.png');
    this.load.image('e_mecha_death',     '/assets/Metal_Slug/EnemyMechaRobot/MechaRobotDeath.png');
    this.load.image('e_ufo',             '/assets/Metal_Slug/EnemyUFO/EnemyUFO.png');
    this.load.image('e_ufo_death',       '/assets/Metal_Slug/EnemyUFO/UFODeath.png');
    this.load.image('e_ufo_bullet',      '/assets/Metal_Slug/EnemyUFO/UFOBullet.png');

    // ── Audio ─────────────────────────────────────────────────
    this.load.audio('bgm1',        '/assets/BGM1.wav');
    this.load.audio('bgm2',        '/assets/BGM2.wav');
    this.load.audio('shoot',       '/assets/Sounds/Shoot.wav');
    this.load.audio('shoot1',      '/assets/Sounds/Shoot1.wav');
    this.load.audio('shoot2',      '/assets/Sounds/Shoot2.wav');
    this.load.audio('machinegun',  '/assets/Sounds/Machinegun.wav');
    this.load.audio('grenade1',    '/assets/Sounds/Grenade1.wav');
    this.load.audio('explosion',   '/assets/Sounds/Explosion.wav');
    this.load.audio('explosion1',  '/assets/Sounds/Explosion1.wav');
    this.load.audio('death',       '/assets/Sounds/Death.wav');
    this.load.audio('gettinghit',  '/assets/Sounds/Gettinghit.wav');
    this.load.audio('victory',     '/assets/Sounds/Victory.wav');
    this.load.audio('victory1',    '/assets/Sounds/Victory1.wav');
    this.load.audio('scientist',   '/assets/Sounds/Scientist.wav');
    this.load.audio('zombie',      '/assets/Sounds/Zombie.wav');
    this.load.audio('tank',        '/assets/Sounds/Tank.wav');
    this.load.audio('helicopter',  '/assets/Sounds/Helicopter.wav');
    this.load.audio('airship',     '/assets/Sounds/Airship.wav');
    this.load.audio('mecha',       '/assets/Sounds/Mecha.wav');
    this.load.audio('ufo',         '/assets/Sounds/UFO.wav');
    this.load.audio('mission1',    '/assets/Sounds/Mission1.wav');
    this.load.audio('finalwave',   '/assets/Sounds/Finalwave.wav');
    this.load.audio('boss',        '/assets/Sounds/Boss.wav');
    this.load.audio('reload',      '/assets/Sounds/Reload.wav');
    this.load.audio('grenade_sfx', '/assets/Sounds/grenade.wav');
  }

  create() {
    // Build animations in this shared registry so GameScene can use them
    this.anims.create({ key: 'anim_idle',  frames: Array.from({length:11}, (_,i) => ({key:`p_idle_${i}`})),  frameRate: 8,  repeat: -1 });
    this.anims.create({ key: 'anim_walk',  frames: Array.from({length:23}, (_,i) => ({key:`p_walk_${i}`})),  frameRate: 18, repeat: -1 });
    this.anims.create({ key: 'anim_shoot', frames: Array.from({length:8},  (_,i) => ({key:`p_shoot_${i}`})), frameRate: 16, repeat: 0  });
    this.anims.create({ key: 'anim_knife', frames: Array.from({length:8},  (_,i) => ({key:`p_knife_${i}`})), frameRate: 18, repeat: 0  });
    this.anims.create({ key: 'anim_up',    frames: Array.from({length:8},  (_,i) => ({key:`p_up_${i}`})),    frameRate: 12, repeat: -1 });
    this.anims.create({ key: 'anim_cg',    frames: Array.from({length:12}, (_,i) => ({key:`p_cg_${i}`})),   frameRate: 12, repeat: 0  });
    this.anims.create({ key: 'anim_vic',   frames: Array.from({length:7},  (_,i) => ({key:`p_vic_${i}`})),  frameRate: 8,  repeat: -1 });
    this.anims.create({ key: 'anim_bexp',  frames: Array.from({length:11}, (_,i) => ({key:`bexp_${i}`})),   frameRate: 20, repeat: 0  });
    this.anims.create({ key: 'anim_gexp',  frames: Array.from({length:20}, (_,i) => ({key:`gexp_${i}`})),   frameRate: 24, repeat: 0  });

    // FIX #1: Don't call this.scene.start('GameScene') here!
    // GameCanvas will start GameScene with proper stage/player data.
    // We emit 'bootReady' so GameCanvas knows assets are loaded.
    this.events.emit('bootReady');
  }
}
