import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene';
import { GameScene } from './scenes/GameScene';
import { GAME_WIDTH, GAME_HEIGHT } from './constants';

export function createGame(containerId: string): Phaser.Game {
  return new Phaser.Game({
    type: Phaser.AUTO,
    width:  GAME_WIDTH,
    height: GAME_HEIGHT,
    parent: containerId,
    backgroundColor: '#1a1a2e',

    scale: {
      mode:        Phaser.Scale.FIT,       // scale to fit container
      autoCenter:  Phaser.Scale.CENTER_BOTH,
      orientation: Phaser.Scale.Orientation.LANDSCAPE,
      // Resize Phaser canvas when window changes (rotation, browser chrome show/hide)
      resizeInterval: 500,
    },

    physics: {
      default: 'arcade',
      arcade:  { gravity: { x: 0, y: 0 }, debug: false },
    },

    audio: {
      disableWebAudio: false,
      noAudio:         false,
    },

    input: {
      // Prevent Phaser from blocking all pointer events on the page
      // (we handle our own touch buttons in React)
      activePointers: 4,   // support 4 simultaneous touches
    },

    // Disable right-click context menu on the canvas
    disableContextMenu: true,

    scene: [BootScene, GameScene],
  });
}
