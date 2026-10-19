// Orientation overlay displayed when the device is in portrait mode.
// The game must be played in landscape; this overlay covers the screen
// with a message asking the player to rotate their device.
import Phaser from 'phaser';

export class OrientationOverlay {
  private scene: Phaser.Scene;
  private container!: Phaser.GameObjects.Container;
  private bg!: Phaser.GameObjects.Graphics;
  private text!: Phaser.GameObjects.Text;
  private isVisible: boolean = false;
  private mediaQuery: MediaQueryList | null = null;
  private mediaQueryHandler: ((e: MediaQueryListEvent) => void) | null = null;
  private pausedByOverlay: boolean = false;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.createUI();
    this.hide();
    this.setupListeners();
    // Check initial orientation (covers devices that start in portrait)
    this.checkOrientation();
  }

  private createUI(): void {
    const { width, height } = this.scene.scale.gameSize;

    // Full-screen container, always on top
    this.container = this.scene.add.container(0, 0);
    this.container.setDepth(9999);

    // Semi-transparent background covering the whole canvas
    this.bg = this.scene.add.graphics();
    this.bg.fillStyle(0x000000, 0.85);
    this.bg.fillRect(0, 0, width, height);
    this.container.add(this.bg);

    // Centered message
    this.text = this.scene.add.text(
      width / 2,
      height / 2,
      'Veuillez tourner votre appareil en paysage',
      {
        fontSize: '24px',
        color: '#ffffff',
        align: 'center',
      }
    ).setOrigin(0.5);
    this.container.add(this.text);
  }

  private setupListeners(): void {
    // Phaser canvas resize (desktop window resize, device rotation)
    this.scene.scale.on('resize', this.handleResize, this);

    // Window orientation change via matchMedia (more reliable on mobile)
    if (typeof window !== 'undefined' && window.matchMedia) {
      this.mediaQuery = window.matchMedia('(orientation: portrait)');
      this.mediaQueryHandler = (e: MediaQueryListEvent) => this.handleOrientationChange(e.matches);
      this.mediaQuery.addEventListener('change', this.mediaQueryHandler);
    }
  }

  private handleResize(): void {
    const { width, height } = this.scene.scale.gameSize;

    // Resize background to match the new canvas size
    this.bg.clear();
    this.bg.fillStyle(0x000000, 0.85);
    this.bg.fillRect(0, 0, width, height);

    // Recenter the message
    this.text.setPosition(width / 2, height / 2);

    // Re-evaluate orientation based on window aspect ratio (not gameSize)
    const isPortrait = this.computeIsPortrait();
    this.handleOrientationChange(isPortrait);
  }

  private computeIsPortrait(): boolean {
    if (typeof window !== 'undefined' && window.innerWidth && window.innerHeight) {
      return window.innerWidth < window.innerHeight;
    }
    const { width, height } = this.scene.scale.gameSize;
    return height > width;
  }

  private handleOrientationChange(isPortrait: boolean): void {
    if (isPortrait && !this.isVisible) {
      this.show();
    } else if (!isPortrait && this.isVisible) {
      this.hide();
    }
  }

  private checkOrientation(): void {
    // Prefer window dimensions (gameSize is always 960x540 in FIT mode)
    this.handleOrientationChange(this.computeIsPortrait());
  }

  /**
   * Repositionne et redessine l'overlay quand le canvas change de taille.
   * @param width - Nouvelle largeur logique du canvas
   * @param height - Nouvelle hauteur logique du canvas
   */
  resize(width: number, height: number): void {
    this.bg.clear();
    this.bg.fillStyle(0x000000, 0.85);
    this.bg.fillRect(0, 0, width, height);
    this.text.setPosition(width / 2, height / 2);
  }

  private show(): void {
    this.isVisible = true;
    this.container.setVisible(true);
    // Pause the game scene: no movement, no interaction updates while overlay is shown
    this.scene.scene.pause();
    this.pausedByOverlay = true;
  }

  private hide(): void {
    this.isVisible = false;
    this.container.setVisible(false);
    // Only resume if the overlay itself paused the scene (avoid resuming a combat scene)
    if (this.pausedByOverlay) {
      this.scene.scene.resume();
      this.pausedByOverlay = false;
    }
  }

  /** Check if the overlay is currently shown. */
  isOverlayVisible(): boolean {
    return this.isVisible;
  }

  destroy(): void {
    this.scene.scale.off('resize', this.handleResize, this);
    if (this.mediaQuery && this.mediaQueryHandler) {
      this.mediaQuery.removeEventListener('change', this.mediaQueryHandler);
      this.mediaQuery = null;
      this.mediaQueryHandler = null;
    }
    this.container.destroy();
  }
}
