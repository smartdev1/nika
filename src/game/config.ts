// Game configuration
import Phaser from 'phaser';
import MenuScene from './scenes/MenuScene';
import ExplorationScene from './scenes/ExplorationScene';
import CombatScene from './scenes/CombatScene';

export const gameConfig: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'game',
  backgroundColor: '#17251d',
  width: 960,
  height: 540,

  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },

  physics: {
    default: 'arcade',
    arcade: {
      debug: false
    },
  },

  scene: [MenuScene, ExplorationScene, CombatScene]
};