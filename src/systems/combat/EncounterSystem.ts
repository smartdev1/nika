// Encounter system: detects when the heroine comes close to a combat trigger
// on the map and notifies the caller so a battle can start.
import Phaser from 'phaser';

export interface EncounterObject {
  id: number;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  enemyId: string;
  alreadyTriggered: boolean;
}

export interface EncounterConfig {
  triggerDistance: number; // pixels, distance from hero center to encounter center
}

const DEFAULT_CONFIG: EncounterConfig = {
  triggerDistance: 32,
};

export class EncounterSystem {
  private scene: Phaser.Scene;
  private encounters: EncounterObject[] = [];
  private player: Phaser.Physics.Arcade.Sprite | null = null;
  private config: EncounterConfig;
  private onEncounterTriggered: ((enemyId: string, encounterId: number) => void) | null = null;

  constructor(scene: Phaser.Scene, config: Partial<EncounterConfig> = {}) {
    this.scene = scene;
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /** Sets the player sprite used for distance calculations. */
  setPlayer(player: Phaser.Physics.Arcade.Sprite): void {
    this.player = player;
  }

  /** Registers a callback invoked when an encounter is triggered. */
  setOnEncounterTriggered(callback: (enemyId: string, encounterId: number) => void): void {
    this.onEncounterTriggered = callback;
  }

  /**
   * Loads encounter objects from a Tiled object layer.
   * Objects must have custom properties: combat=true and enemyId=<string>.
   */
  loadFromObjectLayer(objectLayer: Phaser.Tilemaps.ObjectLayer): void {
    this.encounters = objectLayer.objects
      .filter(obj => {
        const combatProp = obj.properties?.find((p: any) => p.name === 'combat');
        return combatProp?.value === true;
      })
      .map(obj => {
        const getProp = (name: string): any => {
          const p = obj.properties?.find((prop: any) => prop.name === name);
          return p ? p.value : undefined;
        };
        return {
          id: obj.id,
          name: obj.name ?? `encounter-${obj.id}`,
          x: obj.x,
          y: obj.y,
          width: obj.width,
          height: obj.height,
          enemyId: getProp('enemyId') ?? 'testEnemy',
          alreadyTriggered: false,
        };
      });
  }

  /**
   * Call each frame. If the player is within triggerDistance of an untriggered
   * encounter, notifies the caller once.
   * @returns The enemyId of the triggered encounter, or undefined.
   */
  update(): string | undefined {
    if (!this.player) return undefined;

    for (const encounter of this.encounters) {
      if (encounter.alreadyTriggered) continue;

      const dx = this.player.x - (encounter.x + encounter.width / 2);
      const dy = this.player.y - (encounter.y + encounter.height / 2);
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance <= this.config.triggerDistance) {
        encounter.alreadyTriggered = true;
        this.onEncounterTriggered?.(encounter.enemyId, encounter.id);
        return encounter.enemyId;
      }
    }

    return undefined;
  }

  /** Returns all encounter objects (for inspection/debug). */
  getEncounters(): EncounterObject[] {
    return [...this.encounters];
  }

  /** Resets a specific encounter so it can be triggered again. */
  resetEncounter(encounterId: number): void {
    const e = this.encounters.find(enc => enc.id === encounterId);
    if (e) {
      e.alreadyTriggered = false;
    }
  }

  /** Resets all encounters. */
  resetAllEncounters(): void {
    for (const e of this.encounters) {
      e.alreadyTriggered = false;
    }
  }

  /** Marks all encounters with the given enemyId as already triggered (defeated). */
  markEncounterDefeated(enemyId: string): void {
    for (const e of this.encounters) {
      if (e.enemyId === enemyId) {
        e.alreadyTriggered = true;
      }
    }
  }

  /** Resets all encounters with the given enemyId so they can be triggered again. */
  resetEncounterByEnemyId(enemyId: string): void {
    for (const e of this.encounters) {
      if (e.enemyId === enemyId) {
        e.alreadyTriggered = false;
      }
    }
  }
}
