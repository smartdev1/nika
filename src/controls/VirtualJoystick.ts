// Virtual joystick for touch movement
import Phaser from 'phaser';

export interface JoystickInput {
  x: number; // -1 to 1
  y: number; // -1 to 1
}

export class VirtualJoystick extends Phaser.GameObjects.Container {
  private base: Phaser.GameObjects.Graphics;
  private thumb: Phaser.GameObjects.Graphics;
  private pointer: Phaser.Input.Pointer | null = null;
  private radius: number;
  private thumbRadius: number;
  private deadZone: number;
  private inputX: number = 0;
  private inputY: number = 0;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    radius = 60,
    thumbRadius = 30,
    deadZone = 10
  ) {
    super(scene, x, y);

    this.radius = radius;
    this.thumbRadius = thumbRadius;
    this.deadZone = deadZone;

    // Create base (static outer circle)
    this.base = scene.add.graphics();
    this.base.fillStyle(0x000000, 0.3);
    this.base.fillCircle(0, 0, radius);
    this.base.lineStyle(2, 0xffffff, 0.5);
    this.base.strokeCircle(0, 0, radius);
    this.add(this.base);

    // Create thumb (movable inner circle)
    this.thumb = scene.add.graphics();
    this.thumb.fillStyle(0xffffff, 0.7);
    this.thumb.fillCircle(0, 0, thumbRadius);
    this.thumb.lineStyle(2, 0x000000, 0.5);
    this.thumb.strokeCircle(0, 0, thumbRadius);
    this.add(this.thumb);

    // Make the joystick area interactive for pointer events
    const hitArea = new Phaser.Geom.Circle(0, 0, radius * 2);
    this.setSize(radius * 2, radius * 2);
    // Note: We'll handle pointers manually since Container doesn't have direct pointer events
    // We'll rely on scene input events instead

    // Initialize thumb position at center
    this.resetThumb();

    // Fixed to screen: the joystick must stay at the same screen position
    // even when the game camera follows the player.
    this.setScrollFactor(0);
  }

  /**
   * Start listening for pointer events on the scene
   */
  startTracking(): void {
    const scene = this.scene;

    scene.input.on('pointerdown', this.handlePointerDown, this);
    scene.input.on('pointermove', this.handlePointerMove, this);
    scene.input.on('pointerup', this.handlePointerUp, this);
    scene.input.on('pointerout', this.handlePointerUp, this);
  }

  /**
   * Stop listening for pointer events
   */
  stopTracking(): void {
    const scene = this.scene;
    scene.input.off('pointerdown', this.handlePointerDown, this);
    scene.input.off('pointermove', this.handlePointerMove, this);
    scene.input.off('pointerup', this.handlePointerUp, this);
    scene.input.off('pointerout', this.handlePointerUp, this);
  }

  /**
   * Handle pointer down - check if it's within joystick bounds
   */
  private handlePointerDown = (pointer: Phaser.Input.Pointer): void => {
    // Check if pointer is within joystick bounds
    const distance = Phaser.Math.Distance.Between(
      pointer.x,
      pointer.y,
      this.x,
      this.y
    );

    if (distance <= this.radius * 1.5) { // Slightly larger area for easier touch
      this.pointer = pointer;
      this.updateThumbPosition(pointer);
    }
  };

  /**
   * Handle pointer move - update thumb position if we have an active pointer
   */
  private handlePointerMove = (pointer: Phaser.Input.Pointer): void => {
    if (this.pointer && pointer.id === this.pointer.id) {
      this.updateThumbPosition(pointer);
    }
  };

  /**
   * Handle pointer up/out - reset thumb to center
   */
  private handlePointerUp = (pointer: Phaser.Input.Pointer): void => {
    if (this.pointer && pointer.id === this.pointer.id) {
      this.pointer = null;
      this.resetThumb();
    }
  };

  /**
   * Update thumb position based on pointer location
   */
  private updateThumbPosition(pointer: Phaser.Input.Pointer): void {
    // Calculate pointer position relative to joystick center
    const dx = pointer.x - this.x;
    const dy = pointer.y - this.y;

    // Calculate distance from center
    const distance = Math.sqrt(dx * dx + dy * dy);

    // Limit distance to radius
    let constrainedDistance = Math.min(distance, this.radius);

    // Apply dead zone - if within dead zone, treat as no input
    if (constrainedDistance < this.deadZone) {
      constrainedDistance = 0;
      this.inputX = 0;
      this.inputY = 0;
    } else {
      // Normalize input values between -1 and 1
      this.inputX = (dx / this.radius) * (constrainedDistance / this.radius);
      this.inputY = (dy / this.radius) * (constrainedDistance / this.radius);
    }

    // Calculate angle for thumb position
    const angle = Math.atan2(dy, dx);

    // Set thumb position (constrained to radius)
    const thumbX = Math.cos(angle) * constrainedDistance;
    const thumbY = Math.sin(angle) * constrainedDistance;

    // Update thumb position
    this.thumb.setPosition(thumbX, thumbY);
  }

  /**
   * Reset thumb to center position
   */
  private resetThumb(): void {
    this.thumb.setPosition(0, 0);
    this.inputX = 0;
    this.inputY = 0;
    this.pointer = null;
  }

  /**
   * Get the current joystick input as a normalized vector
   */
  getInput(): JoystickInput {
    return { x: this.inputX, y: this.inputY };
  }

  /**
   * Check if joystick is being touched
   */
  isDown(): boolean {
    return this.pointer !== null;
  }

  /**
   * Destroy the joystick and clean up event listeners
   */
  destroy(fromScene?: boolean): void {
    this.stopTracking();
    super.destroy(fromScene);
  }
}