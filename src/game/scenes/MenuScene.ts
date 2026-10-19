// Menu scene: title screen with a Play button to start the game.
import Phaser from 'phaser';
import { TouchButton } from '../../controls/TouchButton';

export default class MenuScene extends Phaser.Scene {
  constructor() {
    super('menu-scene');
  }

  create() {
    const { width, height } = this.cameras.main;

    // Background illustré procédural (thème espace / fracture)
    this.createIllustratedBackground(width, height);

    // Title
    this.add.text(width / 2, height / 3, 'LES ÉCHOS DE LA FRACTURE', {
      fontSize: '32px',
      color: '#ffd700',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    // Subtitle
    this.add.text(width / 2, height / 3 + 50, 'Aventure narratif 2.5D', {
      fontSize: '18px',
      color: '#ffffff',
    }).setOrigin(0.5);

    // Play button centered on screen
    const playButton = new TouchButton(this, {
      x: width / 2,
      y: height / 2,
      width: 200,
      height: 60,
      label: 'Jouer',
      onPress: () => {
        console.log('[MenuScene] Bouton Jouer cliqué → démarrage exploration-scene');
        this.scene.start('exploration-scene');
      },
      depth: 100,
      circular: false,
    });
    this.add.existing(playButton);
  }

  /**
   * Dessine un fond illustré couvrant tout l'écran :
   * dégradé sombre (espace) avec des étoiles aléatoires et une lueur centrale.
   */
  private createIllustratedBackground(width: number, height: number): void {
    const bg = this.add.graphics();
    bg.setDepth(-100); // toujours derrière tout le reste

    // Dégradé de fond : vert très sombre en haut, encore plus sombre en bas
    bg.fillStyle(0x0a1a12, 1);
    bg.fillRect(0, 0, width, height);

    // Bande légèrement plus claire vers le haut (ciel/horizon)
    bg.fillStyle(0x17251d, 1);
    bg.fillRect(0, 0, width, height * 0.4);

    // Lueur centrale (la "fracture")
    bg.fillStyle(0x2d4a3e, 0.6);
    bg.fillCircle(width / 2, height / 3, Math.min(width, height) * 0.25);

    // Étoiles aléatoires
    bg.fillStyle(0xffffff, 1);
    const starCount = Math.floor((width * height) / 4000); // densité adaptée à l'écran
    for (let i = 0; i < starCount; i++) {
      const x = Math.random() * width;
      const y = Math.random() * height;
      const size = Math.random() > 0.8 ? 2 : 1;
      bg.fillRect(x, y, size, size);
    }

    // Quelques étoiles plus grosses (planètes lointaines)
    bg.fillStyle(0xaaaaaa, 0.7);
    for (let i = 0; i < 6; i++) {
      const x = Math.random() * width;
      const y = Math.random() * height * 0.6;
      bg.fillCircle(x, y, 3);
    }
  }
}
