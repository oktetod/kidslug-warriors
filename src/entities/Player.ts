// =================================================================
//  KIDSLUG WARRIORS v2 - PLAYER ENTITY
//  Procedural 3D mesh (box-based pixel art style)
//  Controlled via keyboard OR virtual joystick
// =================================================================
import {
  Scene, Mesh, MeshBuilder, StandardMaterial,
  Color3, Vector3, PhysicsImpostor,
} from '@babylonjs/core';
import type { WeaponData } from '@data/GameData.js';
import type { StatBlock }  from '@data/GameData.js';

export interface PlayerInput {
  left:   boolean;
  right:  boolean;
  jump:   boolean;
  shoot:  boolean;
  bomb:   boolean;
  heal:   boolean;
}

export class Player {
  // Mesh parts
  private root:    Mesh;
  private body:    Mesh;
  private head:    Mesh;
  private helmet:  Mesh;
  private leftLeg: Mesh;
  private rightLeg:Mesh;
  private gun:     Mesh;

  // Physics / movement
  vx = 0;
  vy = 0;
  onGround = true;
  facing   = 1; // 1 = right, -1 = left
  invincible = 0;

  // Stats
  hp:    number;
  maxHp: number;
  stats: StatBlock;
  weapon: WeaponData;

  // Shoot cooldown
  shootTimer = 0;

  // Walk animation
  private walkFrame = 0;
  private walkTimer = 0;

  readonly scene: Scene;

  constructor(scene: Scene, stats: StatBlock, weapon: WeaponData, charColors: {
    bodyColor: string; headColor: string; helmetColor: string; pantsColor: string;
  }) {
    this.scene  = scene;
    this.stats  = stats;
    this.weapon = weapon;
    this.hp     = stats.hp;
    this.maxHp  = stats.hp;

    // ---- Build procedural mesh ----
    this.root = new Mesh('player_root', scene);

    // Body (torso)
    this.body = MeshBuilder.CreateBox('player_body', { width:0.42, height:0.55, depth:0.22 }, scene);
    this.body.parent = this.root;
    this.body.position.y = 0.55;
    this.applyColor(this.body, charColors.bodyColor);

    // Head
    this.head = MeshBuilder.CreateBox('player_head', { width:0.30, height:0.30, depth:0.22 }, scene);
    this.head.parent = this.root;
    this.head.position.y = 1.05;
    this.applyColor(this.head, charColors.headColor);

    // Helmet
    this.helmet = MeshBuilder.CreateBox('player_helmet', { width:0.36, height:0.14, depth:0.24 }, scene);
    this.helmet.parent = this.root;
    this.helmet.position.y = 1.27;
    this.applyColor(this.helmet, charColors.helmetColor);

    // Left leg
    this.leftLeg = MeshBuilder.CreateBox('player_llegs', { width:0.17, height:0.28, depth:0.20 }, scene);
    this.leftLeg.parent = this.root;
    this.leftLeg.position.set(-0.11, 0.14, 0);
    this.applyColor(this.leftLeg, charColors.pantsColor);

    // Right leg
    this.rightLeg = MeshBuilder.CreateBox('player_rleg', { width:0.17, height:0.28, depth:0.20 }, scene);
    this.rightLeg.parent = this.root;
    this.rightLeg.position.set(0.11, 0.14, 0);
    this.applyColor(this.rightLeg, charColors.pantsColor);

    // Gun (represented as a flat box on the right side)
    this.gun = MeshBuilder.CreateBox('player_gun', { width:0.35, height:0.10, depth:0.08 }, scene);
    this.gun.parent = this.root;
    this.gun.position.set(0.38, 0.60, 0);
    this.applyColor(this.gun, '#888888');

    // Place at spawn
    this.root.position.set(0, 0.28, 0);
  }

  private applyColor(mesh: Mesh, hex: string): void {
    const mat = new StandardMaterial(`mat_${mesh.name}`, this.scene);
    mat.diffuseColor  = Color3.FromHexString(hex.padEnd(7, '0'));
    mat.specularColor = Color3.Black();
    mat.emissiveColor = mat.diffuseColor.scale(0.12);
    mesh.material = mat;
  }

  // ---- Position helpers -------------------------------------------
  get x(): number  { return this.root.position.x; }
  set x(v: number) { this.root.position.x = v; }
  get y(): number  { return this.root.position.y; }
  set y(v: number) { this.root.position.y = v; }

  get muzzlePosition(): Vector3 {
    return new Vector3(
      this.root.position.x + 0.55 * this.facing,
      this.root.position.y + 0.60,
      0,
    );
  }

  // ---- Update (called every frame) --------------------------------
  update(dt: number, input: PlayerInput, groundY = 0.28): void {
    const spd = (this.stats.spd || 50) / 50 * 4.2;

    // Horizontal movement
    if (input.left)  { this.vx = -spd; this.facing = -1; }
    if (input.right) { this.vx =  spd; this.facing =  1; }
    if (!input.left && !input.right) this.vx *= 0.5;

    // Jump
    if (input.jump && this.onGround) {
      this.vy = 12;
      this.onGround = false;
    }

    // Gravity
    const GRAV = 28;
    this.vy -= GRAV * dt;
    this.root.position.x += this.vx * dt;
    this.root.position.y += this.vy * dt;

    // Ground collision
    if (this.root.position.y <= groundY) {
      this.root.position.y = groundY;
      this.vy = 0;
      this.onGround = true;
    }

    // Clamp x (world bounds handled by camera scroll)
    this.root.position.x = Math.max(-1, this.root.position.x);

    // Facing
    this.root.scaling.x = this.facing;

    // Gun facing
    this.gun.position.x = 0.38 * this.facing;

    // Walk animation (leg bob)
    if (this.onGround && (input.left || input.right)) {
      this.walkTimer += dt;
      if (this.walkTimer > 0.12) {
        this.walkFrame  = (this.walkFrame + 1) % 2;
        this.walkTimer  = 0;
      }
      const bob = this.walkFrame === 0 ? 0.06 : -0.06;
      this.leftLeg.position.y  = 0.14 + bob;
      this.rightLeg.position.y = 0.14 - bob;
    } else {
      this.leftLeg.position.y  = 0.14;
      this.rightLeg.position.y = 0.14;
    }

    // Shoot cooldown
    if (this.shootTimer > 0) this.shootTimer -= dt;

    // Invincibility frames
    if (this.invincible > 0) {
      this.invincible -= dt;
      // Blink effect
      this.root.isVisible = Math.floor(this.invincible / 0.08) % 2 === 0;
    } else {
      this.root.isVisible = true;
    }
  }

  canShoot(): boolean {
    const interval = Math.max(0.08, 1 / (this.weapon.rate || 1));
    return this.shootTimer <= 0;
  }

  onShoot(): void {
    const interval = Math.max(0.08, 1 / (this.weapon.rate || 1));
    this.shootTimer = interval;
  }

  takeDamage(amount: number): void {
    if (this.invincible > 0) return;
    const reduction = (this.stats.def || 10) / 200;
    const final     = Math.max(1, Math.round(amount * (1 - reduction)));
    this.hp = Math.max(0, this.hp - final);
    this.invincible = 1.2;
  }

  heal(amount: number): void {
    this.hp = Math.min(this.maxHp, this.hp + amount);
  }

  get isDead(): boolean { return this.hp <= 0; }

  dispose(): void {
    this.root.getChildMeshes().forEach((m: any) => m.dispose());
    this.root.dispose();
  }
}
