// Exemple Phaser 3 — adapter le chemin si le dossier public est différent.
// Dans Vite, les fichiers placés dans public/ sont servis à partir de la racine.
export function preloadHeroine(scene) {
  scene.load.spritesheet('heroine-walk', '/assets/images/heroine/heroine_walk.png',
    { frameWidth: 32, frameHeight: 32 });
  scene.load.spritesheet('heroine-idle', '/assets/images/heroine/heroine_idle.png',
    { frameWidth: 32, frameHeight: 32 });
  scene.load.spritesheet('heroine-attack', '/assets/images/heroine/heroine_attack.png',
    { frameWidth: 32, frameHeight: 32 });
  scene.load.spritesheet('heroine-hit', '/assets/images/heroine/heroine_hit.png',
    { frameWidth: 32, frameHeight: 32 });
  scene.load.spritesheet('heroine-dead', '/assets/images/heroine/heroine_dead.png',
    { frameWidth: 32, frameHeight: 32 });
  scene.load.spritesheet('heroine-special', '/assets/images/heroine/heroine_special.png',
    { frameWidth: 32, frameHeight: 32 });
}

export function createHeroineAnimations(scene) {
  const dirs = ['down', 'left', 'right', 'up'];
  for (let row = 0; row < dirs.length; row++) {
    const dir = dirs[row];
    scene.anims.create({
      key: `heroine-walk-${dir}`,
      frames: scene.anims.generateFrameNumbers('heroine-walk',
        { start: row * 4, end: row * 4 + 3 }),
      frameRate: 8, repeat: -1
    });
    scene.anims.create({
      key: `heroine-idle-${dir}`,
      frames: scene.anims.generateFrameNumbers('heroine-idle',
        { start: row * 4, end: row * 4 + 3 }),
      frameRate: 4, repeat: -1
    });
    scene.anims.create({
      key: `heroine-attack-${dir}`,
      frames: scene.anims.generateFrameNumbers('heroine-attack',
        { start: row * 4, end: row * 4 + 3 }),
      frameRate: 12, repeat: 0
    });
    scene.anims.create({
      key: `heroine-special-${dir}`,
      frames: scene.anims.generateFrameNumbers('heroine-special',
        { start: row * 4, end: row * 4 + 3 }),
      frameRate: 10, repeat: 0
    });
    scene.anims.create({
      key: `heroine-hit-${dir}`,
      frames: scene.anims.generateFrameNumbers('heroine-hit',
        { start: row * 3, end: row * 3 + 2 }),
      frameRate: 10, repeat: 0
    });
    scene.anims.create({
      key: `heroine-dead-${dir}`,
      frames: scene.anims.generateFrameNumbers('heroine-dead',
        { start: row * 3, end: row * 3 + 2 }),
      frameRate: 6, repeat: 0
    });
  }
}

// Example:
// preloadHeroine(this) in preload()
// createHeroineAnimations(this) in create()
// const hero = this.add.sprite(160, 120, 'heroine-walk', 0);
// hero.play('heroine-walk-down');
