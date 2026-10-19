// Puzzle system: monitors the activation order of puzzle objects (e.g. runic stones)
// and compares it against an expected sequence. On success, emits a game event.
import Phaser from 'phaser';

export interface PuzzleConfig {
  id: string;
  expectedSequence: string[];
  successEvent: string;
  blockerId?: string;
}

export class PuzzleSystem {
  private scene: Phaser.Scene;
  private config: PuzzleConfig;
  private currentSequence: string[] = [];
  private solved: boolean = false;
  private activatedStones: Set<string> = new Set();

  constructor(scene: Phaser.Scene, config: PuzzleConfig) {
    this.scene = scene;
    this.config = config;
  }

  /**
   * Restore previously activated stones from a save (so they are not re-activated).
   * @param activatedIds - IDs of stones already activated in a previous session
   */
  restoreActivated(activatedIds: string[]): void {
    for (const id of activatedIds) {
      this.activatedStones.add(id);
    }
    // If all expected stones were already activated, consider the puzzle solved.
    const allExpected = this.config.expectedSequence.every((id) =>
      this.activatedStones.has(id)
    );
    if (allExpected && !this.solved) {
      this.solved = true;
      this.scene.events.emit(this.config.successEvent);
    }
  }

  /**
   * Notify the system that a puzzle object has been activated.
   * @param id - ID of the activated object
   * @returns true if the puzzle is now solved, false otherwise
   */
  notifyActivation(id: string): boolean {
    if (this.solved) {
      return false;
    }

    // If this stone was already activated in a previous session, ignore.
    if (this.activatedStones.has(id)) {
      return false;
    }

    // Check if this id matches the next expected index.
    const expectedIndex = this.currentSequence.length;
    const expectedId = this.config.expectedSequence[expectedIndex];

    if (id === expectedId) {
      // Correct next step.
      this.currentSequence.push(id);
      this.activatedStones.add(id);

      if (this.currentSequence.length === this.config.expectedSequence.length) {
        // Full sequence completed.
        this.solved = true;
        this.scene.events.emit(this.config.successEvent);
        return true;
      }

      return false;
    }

    // Wrong order: reset the current sequence.
    this.currentSequence = [];
    console.log(`[PuzzleSystem] Mauvais ordre. Séquence réinitialisée.`);
    return false;
  }

  /**
   * Check if the puzzle is solved.
   */
  isSolved(): boolean {
    return this.solved;
  }

  /**
   * Get the current (incomplete) sequence for debugging/display.
   */
  getCurrentSequence(): string[] {
    return [...this.currentSequence];
  }

  /**
   * Get the blocker object ID (e.g. a rock blocking a path).
   */
  getBlockerId(): string | undefined {
    return this.config.blockerId;
  }
}
