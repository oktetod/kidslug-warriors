// =================================================================
//  KIDSLUG WARRIORS v2 - ENGINE
//  Babylon.js engine wrapper with adaptive performance settings
// =================================================================
import {
  Engine as BabylonEngine,
  type Nullable,
} from '@babylonjs/core';

export class Engine {
  readonly babylon: BabylonEngine;
  readonly canvas:  HTMLCanvasElement;

  constructor(canvasId: string) {
    const canvas = document.getElementById(canvasId) as Nullable<HTMLCanvasElement>;
    if (!canvas) throw new Error(`Canvas not found: ${canvasId}`);
    this.canvas = canvas;

    // Create Babylon engine with mobile-optimised settings
    this.babylon = new BabylonEngine(canvas, true, {
      preserveDrawingBuffer: false,
      stencil:               true,
      disableWebGL2Support:  false,
      powerPreference:       'high-performance',
      failIfMajorPerformanceCaveat: false,
    });

    // Adaptive hardware scaling for low-end devices
    this.babylon.setHardwareScalingLevel(this.getHardwareScale());
    this.babylon.enableOfflineSupport = false;

    // Resize listener
    window.addEventListener('resize', () => this.babylon.resize());

    // Orientation lock attempt
    try {
      void (screen.orientation as unknown as { lock: (o: string) => Promise<void> })
        .lock('landscape').catch(() => { /* not supported */ });
    } catch { /* ignore */ }
  }

  private getHardwareScale(): number {
    // Lower-res devices get a scaling boost for performance
    const dpr = window.devicePixelRatio || 1;
    if (dpr >= 3) return 2;   // 4K density: render at half
    if (dpr >= 2) return 1.5; // Retina: render at 2/3
    return 1;
  }

  /** Run render loop with given tick function */
  runRenderLoop(fn: () => void): void {
    this.babylon.runRenderLoop(fn);
  }

  stopRenderLoop(): void {
    this.babylon.stopRenderLoop();
  }

  dispose(): void {
    this.babylon.dispose();
  }
}
