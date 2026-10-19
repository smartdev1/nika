// Generic tactile button for touch / mouse / pointer input.
// Encapsulates a background, an optional label, a hit area, and a callback.
import Phaser from 'phaser';

export interface TouchButtonConfig {
  x: number;
  y: number;
  width: number;
  height: number;
  label?: string;
  onPress: () => void;
  bgColor?: number;
  bgAlpha?: number;
  pressedBgColor?: number;
  pressedBgAlpha?: number;
  cornerRadius?: number;
  depth?: number;
  circular?: boolean;
}

export class TouchButton extends Phaser.GameObjects.Container {
  private bg: Phaser.GameObjects.Graphics;
  private label?: Phaser.GameObjects.Text;
  private onPress: () => void;
  private enabled: boolean = true;
  private config: Required<Omit<TouchButtonConfig, 'label' | 'onPress'>> & {
    label?: string;
    onPress: () => void;
  };

  constructor(scene: Phaser.Scene, config: TouchButtonConfig) {
    super(scene, config.x, config.y);

    this.config = {
      width: config.width,
      height: config.height,
      label: config.label,
      onPress: config.onPress,
      bgColor: config.bgColor ?? 0x000000,
      bgAlpha: config.bgAlpha ?? 0.7,
      pressedBgColor: config.pressedBgColor ?? 0x000000,
      pressedBgAlpha: config.pressedBgAlpha ?? 0.85,
      cornerRadius: config.cornerRadius ?? 8,
      depth: config.depth ?? 0,
      circular: config.circular ?? false,
    };

    this.setDepth(this.config.depth);

    // Background drawn centered at (0, 0) of the container.
    this.bg = scene.add.graphics();
    this.add(this.bg);
    this.drawBg(false);

    // Optional label centered on the button.
    if (config.label) {
      this.label = scene.add.text(0, 0, config.label, {
        fontSize: '18px',
        color: '#ffffff',
      }).setOrigin(0.5);
      this.add(this.label);
    }

    // Hit area matching the button bounds (rectangle or circle).
    if (this.config.circular) {
      const radius = Math.min(this.config.width, this.config.height) / 2;
      this.setSize(radius * 2, radius * 2);
      this.setInteractive({ useHandCursor: true, hitArea: new Phaser.Geom.Circle(0, 0, radius), hitAreaCallback: Phaser.Geom.Circle.Contains });
    } else {
      this.setSize(config.width, config.height);
      this.setInteractive({ useHandCursor: true, hitArea: new Phaser.Geom.Rectangle(-config.width / 2, -config.height / 2, config.width, config.height), hitAreaCallback: Phaser.Geom.Rectangle.Contains });
    }

    // Pointer events for press / release feedback.
    this.on('pointerdown', this.handlePress, this);
    this.on('pointerup', this.handleRelease, this);
    this.on('pointerout', this.handleRelease, this);
  }

  private drawBg(pressed: boolean): void {
    this.bg.clear();
    this.bg.fillStyle(this.config.pressedBgColor ?? this.config.bgColor, pressed ? this.config.pressedBgAlpha : this.config.bgAlpha);
    if (this.config.circular) {
      const radius = Math.min(this.config.width, this.config.height) / 2;
      this.bg.fillCircle(0, 0, radius);
    } else {
      this.bg.fillRoundedRect(
        -this.config.width / 2,
        -this.config.height / 2,
        this.config.width,
        this.config.height,
        this.config.cornerRadius
      );
    }
  }

  private handlePress(): void {
    if (!this.enabled) return;
    this.drawBg(true);
    this.config.onPress();
  }

  private handleRelease(): void {
    if (!this.enabled) return;
    this.drawBg(false);
  }

  /** Show or hide the button. */
  setButtonVisible(visible: boolean): void {
    this.setVisible(visible);
    // Disable input when hidden so it cannot be triggered accidentally.
    if (this.input) {
      this.input.enabled = visible && this.enabled;
    }
  }

  /** Enable or disable the button (visual + input). */
  setButtonEnabled(enabled: boolean): void {
    this.enabled = enabled;
    if (this.input) {
      this.input.enabled = enabled && this.visible;
    }
    this.drawBg(false);
    if (this.label) {
      this.label.setAlpha(enabled ? 1 : 0.5);
    }
  }

  /** Destroy the button and clean up listeners. */
  destroy(fromScene?: boolean): void {
    this.off('pointerdown', this.handlePress, this);
    this.off('pointerup', this.handleRelease, this);
    this.off('pointerout', this.handleRelease, this);
    super.destroy(fromScene);
  }
}
