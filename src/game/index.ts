import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene';
import { GameScene } from './scenes/GameScene';
import { GAME_WIDTH, GAME_HEIGHT } from './constants';

export function createGame(containerId: string): Phaser.Game {
  return new Phaser.Game({
    type:            Phaser.AUTO,
    width:           GAME_WIDTH,
    height:          GAME_HEIGHT,
    parent:          containerId,
    backgroundColor: '#1a1a2e',

    scale: {
      mode:       Phaser.Scale.FIT,         // shrink/expand to fit container
      autoCenter: Phaser.Scale.CENTER_BOTH, // keep centred
      // 'orientation' is not a valid ScaleConfig key in Phaser 3.60 —
      // landscape is enforced via screen.orientation.lock() in orientation.ts
    },

    physics: {
      default: 'arcade',
      arcade:  { gravity: { x: 0, y: 0 }, debug: false },
    },

    audio: {
      disableWebAudio: false,
    },

    input: {
      activePointers: 4, // support 4-finger multitouch
    },

    disableContextMenu: true,

    scene: [BootScene, GameScene],
  });
}
