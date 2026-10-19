// Phaser 3 + Vite. Assets should be copied into public/assets/images/environment/...
export function preloadEnvironment(scene) {
  scene.load.image('ground-tiles', '/assets/images/environment/ground/ground_tileset_32.png');
  scene.load.image('obstacles-tiles', '/assets/images/environment/obstacles/obstacles_tileset_32.png');
  scene.load.image('interactive-objects', '/assets/images/environment/interactive/interactive_objects_32.png');
  scene.load.image('test-enemies', '/assets/images/environment/enemies/enemies_tileset_32.png');
  scene.load.image('game-ui', '/assets/images/environment/ui/ui_tileset_32.png');
  scene.load.image('night-fracture-bg', '/assets/images/environment/backgrounds/night_fracture_960x540.png');
}

// Pour les atlas PNG, chaque cellule fait 32x32.
// Si vous utilisez un Tilemap Phaser, préférez exporter les tuiles de sol en spritesheet
// ou créer un JSON de tilemap Tiled avec les index documentés dans manifest.json.
