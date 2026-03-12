// =================================================================
//  KIDSLUG WARRIORS v2 - GAME SCENE
//  Babylon.js Scene with orthographic camera (2.5D side-scroller)
//  Integrates all entities, systems, and UI
// =================================================================
import {
  Scene as BabylonScene, Color3, Color4,
  HemisphericLight, DirectionalLight,
  MeshBuilder, StandardMaterial, Vector3,
  FreeCamera, Matrix, Texture, CubeTexture,
} from '@babylonjs/core';
import type { Engine }        from '@core/Engine.js';
import { Player }             from '@entities/Player.js';
import { Enemy, type EnemyConfig, type EnemyType } from '@entities/Enemy.js';
import { Projectile }         from '@entities/Projectile.js';
import { UIManager }          from '@ui/UIManager.js';
import { VirtualJoystick }    from '@ui/VirtualJoystick.js';
import { SFX, playBGM, stopBGM, AudioManager } from '@audio/AudioManager.js';
import { type StageData, type WeaponData, WEAPONS, expToNextLevel } from '@data/GameData.js';
import { type SaveData, deepClone, writeSave }       from '@network/SaveSystem.js';
import { CHARACTERS, EQUIPMENT }                     from '@data/GameData.js';

// Ground settings
const GROUND_Y     = 0.28;
const WORLD_RIGHT  = 60;  // max X scroll
const BULLET_SPD   = 20;
const ENEMY_BULLET_SPD = 9;
const SPAWN_INTERVAL   = 3.5; // seconds between spawns

export interface GameCallbacks {
  onComplete: (coins: number, kills: number, bossKilled: boolean, noDamage: boolean) => void;
  onDie:      () => void;
  getSave:    () => SaveData;
  onSave:     (s: SaveData) => void;
}

export class GameScene {
  private scene:    BabylonScene;
  private camera!:  FreeCamera;
  private player!:  Player;
  private ui!:      UIManager;
  private joystick!:VirtualJoystick;

  private enemies:    Enemy[]      = [];
  private projectiles:Projectile[] = [];

  // Keys (keyboard support)
  private keys: Record<string, boolean> = {};

  // State
  private coins         = 0;
  private spawnTimer    = 0;
  private enemiesKilled = 0;
  private totalEnemies  = 0;
  private bossSpawned   = false;
  private bossDefeated  = false;
  private miniBossSpawned = false;
  private won           = false;
  private tookDamage    = false;
  private gameOver      = false;

  private stage!:       StageData;
  private weapon!:      WeaponData;
  private callbacks!:   GameCallbacks;
  private save!:        SaveData;

  // Scroll
  private scrollX = 0;

  constructor(private eng: Engine) {
    this.scene = new BabylonScene(eng.babylon);
    this.scene.clearColor = new Color4(0.02, 0.02, 0.05, 1);

    // Give AudioManager the active scene so BABYLON.Sound can load
    AudioManager.getInstance().setScene(this.scene);

    // Register game data globals for SaveSystem's calcCharStats
    (window as unknown as Record<string, unknown>)['__ksw_chars'] = CHARACTERS;
    (window as unknown as Record<string, unknown>)['__ksw_equip'] = EQUIPMENT;
  }

  // ---- Load + start -----------------------------------------------
  async start(stage: StageData, save: SaveData, callbacks: GameCallbacks): Promise<void> {
    this.stage     = stage;
    this.save      = deepClone(save);
    this.callbacks = callbacks;
    this.totalEnemies = stage.enemies;
    this.spawnTimer   = 0.5;

    this.weapon = WEAPONS.find(w => w.id === save.activeWeaponId) ?? WEAPONS[0];

    playBGM(stage.id);
    this.buildScene(stage);
    this.buildPlayer(save);
    this.buildInputListeners();

    this.scene.registerBeforeRender(() => {
      const dt = this.eng.babylon.getDeltaTime() / 1000;
      this.tick(dt);
    });

    this.eng.runRenderLoop(() => this.scene.render());
  }

  // ---- Scene construction -----------------------------------------
  private buildScene(stage: StageData): void {
    // Orthographic camera (2.5D)
    this.camera = new FreeCamera('cam', new Vector3(0, 2, -12), this.scene);
    this.camera.setTarget(new Vector3(0, 1.5, 0));
    this.scene.activeCameras = [this.camera];

    const aspect = this.eng.canvas.width / this.eng.canvas.height;
    const orthoH = 6;
    this.camera.mode        = FreeCamera.ORTHOGRAPHIC_CAMERA;
    this.camera.orthoTop    =  orthoH;
    this.camera.orthoBottom = -orthoH * 0.15;
    this.camera.orthoLeft   = -orthoH * aspect;
    this.camera.orthoRight  =  orthoH * aspect;

    // Lighting
    const hemi = new HemisphericLight('hemi', new Vector3(0, 1, 0), this.scene);
    hemi.intensity    = 0.65;
    hemi.diffuse      = Color3.FromHexString(stage.skyColor.padEnd(7, '0')).scale(1.4);
    hemi.groundColor  = new Color3(0.1, 0.1, 0.1);

    const dir = new DirectionalLight('dir', new Vector3(-1, -2, -1), this.scene);
    dir.intensity = 0.8;

    // Sky background (large plane behind everything)
    const sky = MeshBuilder.CreatePlane('sky', { width:200, height:40 }, this.scene);
    sky.position.set(0, 14, 6);
    const skyMat = new StandardMaterial('skyMat', this.scene);
    skyMat.emissiveColor = Color3.FromHexString(stage.skyColor.padEnd(7, '0'));
    skyMat.backFaceCulling = false;
    sky.material = skyMat;

    // Ground plane
    const ground = MeshBuilder.CreateBox('ground', { width:300, height:0.28, depth:2 }, this.scene);
    ground.position.set(0, 0, 0);
    const gMat = new StandardMaterial('gMat', this.scene);
    gMat.diffuseColor = Color3.FromHexString(stage.groundColor.padEnd(7, '0'));
    gMat.specularColor = Color3.Black();
    ground.material = gMat;

    // Ground line detail
    for (let i = 0; i < 60; i++) {
      const tile = MeshBuilder.CreateBox(`gt${i}`, { width:1.8, height:0.04, depth:1.9 }, this.scene);
      tile.position.set(i * 2 - 30, 0.145, 0);
      const tMat = new StandardMaterial(`gtm${i}`, this.scene);
      tMat.emissiveColor = i%2===0
        ? Color3.FromHexString(stage.groundColor.padEnd(7, '0')).scale(1.15)
        : Color3.FromHexString(stage.groundColor.padEnd(7, '0')).scale(0.85);
      tile.material = tMat;
    }

    // Build UI and joystick
    this.ui       = new UIManager();
    this.joystick = new VirtualJoystick();
  }

  // ---- Player construction ----------------------------------------
  private buildPlayer(save: SaveData): void {
    const char     = CHARACTERS.find(c => c.id === save.activeCharId) ?? CHARACTERS[0];
    const stats    = this.getCharStats(save);
    this.player = new Player(this.scene, stats as unknown as any, this.weapon, {
      bodyColor:   char.bodyColor,
      headColor:   char.headColor,
      helmetColor: char.helmetColor,
      pantsColor:  char.pantsColor,
    });
    this.player.x = 0;
    this.player.y = GROUND_Y;
  }

  private getCharStats(save: SaveData): Record<string, number> {
    const char = CHARACTERS.find(c => c.id === save.activeCharId) ?? CHARACTERS[0];
    const charSave = save.characters[save.activeCharId] ?? { level:1, equip:{} };
    const level    = charSave.level || 1;
    const mult     = 1 + (level - 1) * 0.08;
    const stats: Record<string, number> = {};
    for (const k in char.baseStats) stats[k] = Math.round(((char.baseStats as unknown) as Record<string, number>)[k] * mult);
    return stats;
  }

  // ---- Input --------------------------------------------------
  private buildInputListeners(): void {
    window.addEventListener('keydown', e => {
      this.keys[e.code] = true;
      if (['Space','ArrowLeft','ArrowRight','ArrowUp'].includes(e.code)) e.preventDefault();
    });
    window.addEventListener('keyup', e => { this.keys[e.code] = false; });
  }

  // ---- Main tick (called every frame) --------------------------
  private tick(dt: number): void {
    if (this.won || this.gameOver) return;

    // Merge keyboard + joystick
    const joyInput = this.joystick.buildInput();
    const input = {
      left:   joyInput.left  || !!this.keys['ArrowLeft']  || !!this.keys['KeyA'],
      right:  joyInput.right || !!this.keys['ArrowRight'] || !!this.keys['KeyD'],
      jump:   joyInput.jump  || !!this.keys['ArrowUp']    || !!this.keys['Space'],
      shoot:  joyInput.shoot || !!this.keys['KeyZ']       || !!this.keys['ShiftLeft'],
      bomb:   this.joystick.popBomb() || !!this.keys['KeyB'],
      heal:   this.joystick.popHeal() || !!this.keys['KeyH'],
    };

    // Player update
    this.player.update(dt, input, GROUND_Y);

    // Camera scroll
    const targetCamX = this.player.x;
    this.camera.position.x += (targetCamX - this.camera.position.x) * 6 * dt;
    this.scrollX = this.camera.position.x;

    // ---- Shoot ------------------------------------------------
    if (input.shoot && this.player.canShoot()) {
      this.player.onShoot();
      const bulletSpeed = BULLET_SPD * this.player.facing;
      const mp = this.player.muzzlePosition;
      const p = new Projectile(this.scene, mp.x, mp.y, bulletSpeed, this.getATK(), 'player', this.weapon.bulletColor, this.weapon.bulletSize);
      this.projectiles.push(p);
      SFX.shoot_pistol();
    }

    // ---- Bomb -------------------------------------------------
    if (input.bomb && (this.save.items.bomb ?? 0) > 0) {
      this.save.items.bomb = (this.save.items.bomb ?? 0) - 1;
      this.enemies.forEach(e => {
        if (!e.dead) {
          e.takeDamage(9999, false);
          this.onEnemyDied(e);
        }
      });
      SFX.explosion_big();
    }

    // ---- Heal -------------------------------------------------
    if (input.heal && (this.save.items.medkit ?? 0) > 0) {
      this.save.items.medkit = (this.save.items.medkit ?? 0) - 1;
      const h = Math.round(this.player.maxHp * 0.35);
      this.player.heal(h);
      SFX.purchase_ok();
    }

    // ---- Update joystick item counts -------------------------
    this.joystick.updateCounts(this.save.items.bomb ?? 0, this.save.items.medkit ?? 0);

    // ---- Enemy spawn -----------------------------------------
    this.spawnTimer -= dt;
    const aliveCount  = this.enemies.filter(e => !e.dead).length;
    const remaining   = this.totalEnemies - this.enemiesKilled - aliveCount;

    if (!this.miniBossSpawned && this.enemiesKilled >= Math.floor(this.totalEnemies * 0.4)) {
      this.spawnEnemy('miniboss');
      this.miniBossSpawned = true;
    }
    if (this.spawnTimer <= 0 && remaining > 0 && !this.bossSpawned) {
      if (this.enemiesKilled >= this.totalEnemies - 1) {
        this.spawnEnemy('boss');
        this.bossSpawned = true;
      } else {
        this.spawnEnemy('normal');
      }
      this.spawnTimer = SPAWN_INTERVAL + Math.random() * 2;
    }

    // ---- Enemy update + shooting --------------------------------
    const boss = this.enemies.find(e => e.type === 'boss' && !e.dead);
    const bossHp = boss ? boss.hp : 0;
    const bossMx = boss ? boss.maxHp : 0;

    this.enemies.forEach(e => {
      if (e.dead) return;
      e.update(dt, this.player.x, GROUND_Y);

      // Enemy melee (close range)
      const dx = Math.abs(e.x - this.player.x);
      const dy = Math.abs(e.y - this.player.y);
      if (dx < e.boundingHalfWidth + 0.3 && dy < e.boundingHalfHeight && this.player.invincible <= 0) {
        this.player.takeDamage(e.config.atk * 0.5);
        this.tookDamage = true;
        SFX.hit_player();
      }

      // Enemy shoot
      if (e.canShoot(e.x - this.player.x)) {
        e.onShoot();
        const dir = this.player.x < e.x ? -1 : 1;
        const mp  = e.muzzlePosition;
        const ep = new Projectile(this.scene, mp.x, mp.y, ENEMY_BULLET_SPD * dir, e.config.atk, 'enemy');
        this.projectiles.push(ep);
      }
    });

    // ---- Projectile update + collision --------------------------
    this.projectiles = this.projectiles.filter(proj => {
      proj.update(dt);

      // Out of range
      if (Math.abs(proj.x - this.scrollX) > 20) { proj.dispose(); return false; }

      if (proj.owner === 'player') {
        // Hit enemies
        const hit = this.enemies.find(e =>
          !e.dead &&
          Math.abs(e.x - proj.x) < e.boundingHalfWidth * 1.2 &&
          proj.y > (e.y - e.boundingHalfHeight) &&
          proj.y < e.y + 0.1
        );
        if (hit) {
          const crit = Math.random() * 100 < (this.player.stats.crit ?? 10);
          const dmg  = hit.takeDamage(proj.dmg, crit);
          SFX.hit_enemy();
          // Floating damage text
          const sx = (hit.x - this.scrollX) * 60 + window.innerWidth / 2;
          const sy = window.innerHeight * 0.35;
          this.ui.addFloat(sx, sy, crit ? `CRIT ${dmg}` : `${dmg}`, crit ? '#ffd700' : '#ff6b6b');
          if (hit.dead) this.onEnemyDied(hit);
          proj.dispose(); return false;
        }
      } else {
        // Hit player
        const pdx = Math.abs(proj.x - this.player.x);
        if (pdx < 0.22 && proj.y > (this.player.y - 0.8) && proj.y < this.player.y + 0.1 && this.player.invincible <= 0) {
          const dodge = Math.random() * 100 < (this.player.stats.dodge ?? 8);
          if (!dodge) {
            this.player.takeDamage(proj.dmg);
            this.tookDamage = true;
            SFX.hit_player();
            const sx = window.innerWidth / 2;
            const sy = window.innerHeight * 0.45;
            this.ui.addFloat(sx, sy, `-${Math.round(proj.dmg)}`, '#ff4444');
          } else {
            const sx = window.innerWidth / 2;
            const sy = window.innerHeight * 0.45;
            this.ui.addFloat(sx, sy, 'DODGE', '#80deea');
          }
          proj.dispose(); return false;
        }
      }
      return true;
    });

    // ---- Dead enemies cleanup -----------------------------------
    this.enemies = this.enemies.filter(e => {
      if (e.dead) { e.dispose(); return false; }
      return true;
    });

    // ---- Win / Lose check --------------------------------------
    if (this.player.isDead && !this.gameOver) {
      this.gameOver = true;
      SFX.game_over();
      this.ui.showLose();
      // Save last position and HP before exiting
      const dieNs = this.callbacks.getSave();
      dieNs.player.currentHp   = 0;
      dieNs.player.lastStageId = this.stage.id;
      this.callbacks.onSave(dieNs);
      setTimeout(() => {
        this.cleanup();
        this.callbacks.onDie();
      }, 2500);
    }

    if (this.enemiesKilled >= this.totalEnemies && !this.won) {
      this.won = true;
      SFX.mission_clear();
      this.ui.showWin(this.coins);
      // Save last position and full HP restore on clear
      const winNs = this.callbacks.getSave();
      winNs.player.lastStageId = this.stage.id;
      this.callbacks.onSave(winNs);
      setTimeout(() => {
        this.cleanup();
        this.callbacks.onComplete(this.coins, this.enemiesKilled, this.bossDefeated, !this.tookDamage);
      }, 2500);
    }

    // ---- HUD update --------------------------------------------
    this.ui.update({
      hp:           this.player.hp,
      maxHp:        this.player.maxHp,
      coins:        this.coins,
      kills:        this.enemiesKilled,
      totalEnemies: this.totalEnemies,
      bossHp,
      bossMxHp:     bossMx,
      bossName:     boss ? 'BOSS' : '',
      bossActive:   !!boss,
      stageId:      this.stage.id,
      stageName:    this.stage.name,
      weaponName:   this.weapon.name,
      playerLevel:  this.save.player.level,
    });
  }

  private onEnemyDied(e: Enemy): void {
    this.enemiesKilled++;
    const coinDrop = e.type === 'boss' ? 25 : e.type === 'miniboss' ? 10 : 2;
    this.coins += coinDrop;
    SFX.coin_pickup();
    if (e.type === 'boss') { this.bossDefeated = true; SFX.explosion_big(); }
    else SFX.explosion();
  }

  private spawnEnemy(type: EnemyType): void {
    const spawnX = this.scrollX + 12 + Math.random() * 3;
    const eHp = type === 'boss' ? this.stage.enemyHp * 4
      : type === 'miniboss'     ? this.stage.enemyHp * 2
      : this.stage.enemyHp * (1 + this.enemiesKilled * 0.03);

    const colors: Record<EnemyType, { color: string; accentColor: string }> = {
      normal:   { color: '#388e3c', accentColor: '#69f0ae' },
      miniboss: { color: '#e65100', accentColor: '#ffd740' },
      boss:     { color: '#7b1fa2', accentColor: '#ffd700' },
    };

    const config: EnemyConfig = {
      hp:    Math.round(eHp),
      atk:   Math.round(type === 'boss' ? this.stage.enemyAtk * 3.5 : type === 'miniboss' ? this.stage.enemyAtk * 2 : this.stage.enemyAtk),
      spd:   type === 'boss' ? 1.2 : type === 'miniboss' ? 1.8 : 2.5 + Math.random(),
      type,
      name:  type === 'boss' ? 'BOSS' : type === 'miniboss' ? 'MINI BOSS' : 'ENEMY',
      ...colors[type],
    };
    const e = new Enemy(this.scene, spawnX, config);
    this.enemies.push(e);
    if (type === 'boss') (SFX as any).boss_appear?.();
  }

  private getATK(): number {
    const stats = this.getCharStats(this.save);
    return (stats.atk ?? 30) + (this.weapon.dmg ?? 12);
  }

  private cleanup(): void {
    stopBGM();
    this.player.dispose();
    this.enemies.forEach(e => e.dispose());
    this.projectiles.forEach(p => p.dispose());
    this.ui.dispose();
    this.joystick.dispose();
    this.eng.stopRenderLoop();
    window.removeEventListener('keydown', () => {});
    window.removeEventListener('keyup',   () => {});
  }

  dispose(): void {
    this.cleanup();
    this.scene.dispose();
  }
}
