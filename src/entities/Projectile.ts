// =================================================================
//  KIDSLUG WARRIORS v2 - PROJECTILE ENTITY
//  Sphere mesh, moves in one axis, collides with enemies/player
// =================================================================
import {
  Scene, Mesh, MeshBuilder, StandardMaterial, Color3,
} from '@babylonjs/core';

export type ProjectileOwner = 'player' | 'enemy';

let _projCount = 0;

export class Projectile {
  readonly id:    string;
  readonly owner: ProjectileOwner;
  readonly dmg:   number;
  vx: number;

  x: number;
  y: number;

  private mesh: Mesh;
  dead = false;

  constructor(
    scene: Scene,
    x: number, y: number,
    vx: number,
    dmg: number,
    owner: ProjectileOwner,
    bulletColor = '#ffd700',
    bulletSize  = 0.08,
  ) {
    this.id    = 'proj_' + (_projCount++);
    this.owner = owner;
    this.dmg   = dmg;
    this.vx    = vx;
    this.x     = x;
    this.y     = y;

    this.mesh = MeshBuilder.CreateSphere(this.id, {
      diameter: bulletSize,
      segments: 4, // low-poly for performance
    }, scene);
    this.mesh.position.set(x, y, 0);
    this.mesh.isPickable = false;

    const mat = new StandardMaterial(this.id + '_mat', scene);
    const col = Color3.FromHexString(bulletColor.padEnd(7, '0'));
    mat.diffuseColor  = col;
    mat.emissiveColor = col.scale(0.8);
    mat.specularColor = Color3.White();
    mat.disableLighting = false;
    this.mesh.material = mat;

    // Enemy bullets: add a red tint
    if (owner === 'enemy') {
      mat.diffuseColor  = new Color3(1.0, 0.2, 0.2);
      mat.emissiveColor = new Color3(0.6, 0.05, 0.05);
    }
  }

  update(dt: number): void {
    this.x += this.vx * dt;
    this.mesh.position.x = this.x;
  }

  dispose(): void {
    this.mesh.dispose();
  }
}
