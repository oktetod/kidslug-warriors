// =================================================================
//  KIDSLUG WARRIORS v2 - ENEMY ENTITY
//  Procedural mesh, AI movement, billboard health bar
// =================================================================
import {
  Scene, Mesh, MeshBuilder, StandardMaterial,
  Color3, Vector3, DynamicTexture,
} from '@babylonjs/core';

export type EnemyType = 'normal' | 'miniboss' | 'boss';

export interface EnemyConfig {
  hp:      number;
  atk:     number;
  spd:     number;
  color:   string;
  accentColor: string;
  type:    EnemyType;
  name:    string;
}

const SIZE_MAP: Record<EnemyType, { w: number; h: number }> = {
  normal:   { w:0.38, h:0.80 },
  miniboss: { w:0.55, h:1.10 },
  boss:     { w:0.90, h:1.60 },
};

let _enemyCount = 0;

export class Enemy {
  readonly id:     string;
  readonly config: EnemyConfig;
  readonly type:   EnemyType;

  hp:      number;
  maxHp:   number;
  dead     = false;
  hitFlash = 0;

  // Physics
  vx = 0;

  // AI
  shootTimer: number;
  private walkFrame = 0;
  private walkTimer = 0;

  // Meshes
  private root:    Mesh;
  private body:    Mesh;
  private head:    Mesh;
  private leftLeg: Mesh;
  private rightLeg:Mesh;
  private hpBar:   Mesh;
  private hpFill:  Mesh;
  private hpTex:   DynamicTexture | null = null;

  readonly scene: Scene;

  constructor(scene: Scene, x: number, config: EnemyConfig) {
    this.scene  = scene;
    this.config = config;
    this.type   = config.type;
    this.id     = 'enemy_' + (_enemyCount++);
    this.hp     = config.hp;
    this.maxHp  = config.hp;
    this.shootTimer = config.type === 'boss' ? 2.0 : config.type === 'miniboss' ? 2.5 : 3.5 + Math.random() * 2;

    const sz = SIZE_MAP[config.type];

    // Root
    this.root = new Mesh(this.id + '_root', scene);
    this.root.position.set(x, 0.28, 0);

    // Body
    this.body = MeshBuilder.CreateBox(this.id + '_body', { width:sz.w, height:sz.h*0.6, depth:0.20 }, scene);
    this.body.parent = this.root;
    this.body.position.y = sz.h * 0.35;
    this.applyColor(this.body, config.color);

    // Head
    this.head = MeshBuilder.CreateBox(this.id + '_head', { width:sz.w*0.72, height:sz.h*0.28, depth:0.20 }, scene);
    this.head.parent = this.root;
    this.head.position.y = sz.h * 0.82;
    this.applyColor(this.head, config.accentColor);

    // Legs
    this.leftLeg = MeshBuilder.CreateBox(this.id + '_ll', { width:sz.w*0.38, height:sz.h*0.30, depth:0.18 }, scene);
    this.leftLeg.parent = this.root;
    this.leftLeg.position.set(-sz.w*0.18, sz.h*0.10, 0);
    this.applyColor(this.leftLeg, config.color);

    this.rightLeg = MeshBuilder.CreateBox(this.id + '_rl', { width:sz.w*0.38, height:sz.h*0.30, depth:0.18 }, scene);
    this.rightLeg.parent = this.root;
    this.rightLeg.position.set( sz.w*0.18, sz.h*0.10, 0);
    this.applyColor(this.rightLeg, config.color);

    // HP bar (billboard texture)
    const barW = sz.w * 2.2;
    this.hpBar = MeshBuilder.CreatePlane(this.id + '_hpbg', { width:barW, height:0.10 }, scene);
    this.hpBar.parent = this.root;
    this.hpBar.position.y = sz.h + 0.20;
    this.hpBar.billboardMode = Mesh.BILLBOARDMODE_ALL;
    const bgMat = new StandardMaterial(this.id + '_hpbg_mat', scene);
    bgMat.diffuseColor  = new Color3(0.15, 0.04, 0.04);
    bgMat.emissiveColor = new Color3(0.05, 0.02, 0.02);
    bgMat.disableLighting = true;
    this.hpBar.material = bgMat;

    this.hpFill = MeshBuilder.CreatePlane(this.id + '_hpfill', { width:barW, height:0.09 }, scene);
    this.hpFill.parent = this.root;
    this.hpFill.position.y = sz.h + 0.20;
    this.hpFill.position.z = -0.01;
    this.hpFill.billboardMode = Mesh.BILLBOARDMODE_ALL;
    const fillMat = new StandardMaterial(this.id + '_hpfill_mat', scene);
    const col = config.type === 'boss'
      ? new Color3(1.0, 0.84, 0.0)
      : config.type === 'miniboss'
        ? new Color3(1.0, 0.55, 0.0)
        : new Color3(0.9, 0.2, 0.2);
    fillMat.diffuseColor  = col;
    fillMat.emissiveColor = col.scale(0.4);
    fillMat.disableLighting = true;
    this.hpFill.material = fillMat;
  }

  private applyColor(mesh: Mesh, hex: string): void {
    const mat = new StandardMaterial(`mat_${mesh.name}`, this.scene);
    mat.diffuseColor  = Color3.FromHexString(hex.padEnd(7, '0'));
    mat.specularColor = Color3.Black();
    mat.emissiveColor = mat.diffuseColor.scale(0.15);
    mesh.material = mat;
  }

  get x(): number  { return this.root.position.x; }
  get y(): number  { return this.root.position.y; }

  get muzzlePosition(): Vector3 {
    return new Vector3(this.root.position.x, this.root.position.y + 0.60, 0);
  }

  get boundingHalfWidth():  number { return SIZE_MAP[this.type].w * 0.85; }
  get boundingHalfHeight(): number { return SIZE_MAP[this.type].h * 0.80; }

  update(dt: number, targetX: number, groundY = 0.28): void {
    if (this.dead) return;

    // Move toward player
    const dir = targetX < this.root.position.x ? -1 : 1;
    this.vx = dir * this.config.spd;
    this.root.position.x += this.vx * dt;
    this.root.position.y  = groundY; // always on ground (no jump AI for now)

    // Face player
    this.root.scaling.x = dir * -1;

    // Walk animation
    this.walkTimer += dt;
    if (this.walkTimer > 0.15) {
      this.walkFrame = (this.walkFrame + 1) % 2;
      this.walkTimer = 0;
    }
    const bob = this.walkFrame === 0 ? 0.04 : -0.04;
    this.leftLeg.position.y  = SIZE_MAP[this.type].h * 0.10 + bob;
    this.rightLeg.position.y = SIZE_MAP[this.type].h * 0.10 - bob;

    // HP bar update
    const pct = this.hp / this.maxHp;
    const barW = SIZE_MAP[this.type].w * 2.2;
    this.hpFill.scaling.x = pct;
    this.hpFill.position.x = (pct - 1) * barW * 0.5;

    // Hit flash (tint red)
    if (this.hitFlash > 0) {
      this.hitFlash -= dt;
      const mat = this.body.material as StandardMaterial;
      mat.emissiveColor = new Color3(0.8, 0.1, 0.1);
    } else {
      const mat = this.body.material as StandardMaterial;
      mat.emissiveColor = Color3.FromHexString(this.config.color).scale(0.15);
    }

    // Shoot cooldown
    if (this.shootTimer > 0) this.shootTimer -= dt;
  }

  canShoot(distToPlayer: number): boolean {
    return this.shootTimer <= 0 && Math.abs(distToPlayer) < 15;
  }

  onShoot(): void {
    this.shootTimer = this.type === 'boss' ? 1.8 + Math.random() * 0.8
      : this.type === 'miniboss'           ? 2.2 + Math.random() * 1.0
                                           : 3.0 + Math.random() * 2.0;
  }

  takeDamage(amount: number, isCrit = false): number {
    const dmg = isCrit ? Math.round(amount * 1.8) : amount;
    this.hp = Math.max(0, this.hp - dmg);
    this.hitFlash = 0.15;
    if (this.hp <= 0) this.dead = true;
    return dmg;
  }

  dispose(): void {
    this.root.getChildMeshes().forEach((m: any) => m.dispose());
    this.root.dispose();
    this.hpTex?.dispose();
  }
}
