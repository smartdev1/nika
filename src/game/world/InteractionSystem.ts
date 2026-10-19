// Interaction system for handling object and NPC interactions
import Phaser from 'phaser';

export interface InteractiveObject {
  id: number;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  type: string;
  range?: number; // interaction range in pixels, default 64
  puzzle?: boolean; // if true, interacting with this object notifies the puzzle system
}

export class InteractionSystem {
  private scene: Phaser.Scene;
  private interactiveObjects: InteractiveObject[];
  private player: Phaser.Physics.Arcade.Sprite | null = null;
  private defaultRange: number = 64; // pixels
  private onPuzzleActivation: ((id: string) => void) | null = null;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.interactiveObjects = [];
  }

  /**
   * Sets the player sprite to track for distance calculations.
   * @param player - The player sprite
   */
  setPlayer(player: Phaser.Physics.Arcade.Sprite): void {
    this.player = player;
  }

  /**
   * Registers a callback invoked when an interactive object with `puzzle: true` is activated.
   * @param callback - Called with the string id of the activated puzzle object
   */
  setOnPuzzleActivation(callback: (id: string) => void): void {
    this.onPuzzleActivation = callback;
  }

  /**
   * Loads interactive objects from a Tiled object layer.
   * @param objectLayer - The Tiled object layer containing interactive objects
   */
  loadFromObjectLayer(objectLayer: Phaser.Tilemaps.ObjectLayer): void {
    this.interactiveObjects = objectLayer.objects.map(obj => {
      const props = obj.properties || [];
      const getProp = (name: string): any => {
        const p = props.find((prop: any) => prop.name === name);
        return p ? p.value : undefined;
      };
      return {
        id: obj.id,
        name: obj.name ?? '',
        x: obj.x,
        y: obj.y,
        width: obj.width,
        height: obj.height,
        type: obj.type ?? '',
        puzzle: getProp('puzzle') === true,
        range: getProp('range') as number | undefined,
      };
    });
  }

  /**
   * Updates the interaction system. Should be called each frame.
   * @returns The closest interactive object within range, or null if none.
   */
  update(): InteractiveObject | null {
    if (!this.player) {
      return null;
    }

    let closestObject: InteractiveObject | null = null;
    let closestDistance: number = Infinity;

    for (const obj of this.interactiveObjects) {
      const dx = this.player.x - (obj.x + obj.width / 2);
      const dy = this.player.y - (obj.y + obj.height / 2);
      const distance = Math.sqrt(dx * dx + dy * dy);
      const range = obj.range ?? this.defaultRange;

      if (distance <= range && distance < closestDistance) {
        closestDistance = distance;
        closestObject = obj;
      }
    }

    return closestObject;
  }

  /**
   * Checks if a specific interactive object is within range.
   * @param objectId - The ID of the interactive object to check
   * @returns True if the object is within range, false otherwise
   */
  isObjectInRange(objectId: number): boolean {
    if (!this.player) {
      return false;
    }

    const obj = this.interactiveObjects.find(o => o.id === objectId);
    if (!obj) {
      return false;
    }

    const dx = this.player.x - (obj.x + obj.width / 2);
    const dy = this.player.y - (obj.y + obj.height / 2);
    const distance = Math.sqrt(dx * dx + dy * dy);
    const range = obj.range ?? this.defaultRange;

    return distance <= range;
  }

  /**
   * Gets all interactive objects within range.
   * @returns Array of interactive objects within range
   */
  getObjectsInRange(): InteractiveObject[] {
    if (!this.player) {
      return [];
    }

    return this.interactiveObjects.filter(obj => {
      const dx = this.player.x - (obj.x + obj.width / 2);
      const dy = this.player.y - (obj.y + obj.height / 2);
      const distance = Math.sqrt(dx * dx + dy * dy);
      const range = obj.range ?? this.defaultRange;
      return distance <= range;
    });
  }
}