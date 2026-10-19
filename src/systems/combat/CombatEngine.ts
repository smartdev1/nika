// Combat engine: turn-based combat logic independent of Phaser (no direct Phaser dependency).
// Manages participants, initiative ordering, turn progression, basic attack action,
// and win/loss conditions.
import type { Combatant, CombatResult } from '../../types/index';

const INITIATIVE_VARIABILITY = 5; // random range added to speed for initiative

// Minimal event emitter to decouple the engine from presentation systems.
class Emitter {
  private listeners: Record<string, Array<(...args: any[]) => void>> = {};

  on(event: string, callback: (...args: any[]) => void): void {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
  }

  off(event: string, callback: (...args: any[]) => void): void {
    if (!this.listeners[event]) return;
    this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
  }

  emit(event: string, ...args: any[]): void {
    const cbs = this.listeners[event];
    if (!cbs) return;
    for (const cb of cbs) {
      cb(...args);
    }
  }
}

export interface CombatStartOptions {
  participants: Combatant[];
  onTurnChange?: (actor: Combatant) => void;
  onCombatEnd?: (result: CombatResult) => void;
}

export interface AttackResult {
  attackerId: string;
  targetId: string;
  damage: number;
  targetDefeated: boolean;
  targetHp: number;
}

export class CombatEngine {
  private emitter = new Emitter();
  private participants: Combatant[] = [];
  private initiativeOrder: Combatant[] = [];
  private currentTurnIndex = 0;
  private isActive = false;
  private result: CombatResult = null;
  private onTurnChange?: (actor: Combatant) => void;
  private onCombatEnd?: (result: CombatResult) => void;

  /** Subscribe to combat events: 'turn-change', 'attack', 'combat-end'. */
  on(event: string, callback: (...args: any[]) => void): void {
    this.emitter.on(event, callback);
  }

  /** Unsubscribe from a combat event. */
  off(event: string, callback: (...args: any[]) => void): void {
    this.emitter.off(event, callback);
  }

  /** Whether a combat session is currently active. */
  getIsActive(): boolean {
    return this.isActive;
  }

  /** The combatant whose turn it is, or null if no combat is active. */
  getCurrentActor(): Combatant | null {
    if (!this.isActive || this.initiativeOrder.length === 0) {
      return null;
    }
    return this.initiativeOrder[this.currentTurnIndex] ?? null;
  }

  /** All participants (readonly copy). */
  getParticipants(): Combatant[] {
    return [...this.participants];
  }

  /** The final result of the combat, or null if ongoing. */
  getResult(): CombatResult {
    return this.result;
  }

  /**
   * Initialize a combat session.
   * Calculates initiative (speed + random 0..4), sorts participants descending,
   * and sets the first turn.
   */
  startCombat(options: CombatStartOptions): void {
    if (this.isActive) {
      console.warn('[CombatEngine] Combat already in progress; call endCombat() first.');
      return;
    }

    this.onTurnChange = options.onTurnChange;
    this.onCombatEnd = options.onCombatEnd;

    this.participants = options.participants.map(p => ({
      ...p,
      isAlive: p.hp > 0,
    }));
    this.result = null;
    this.isActive = true;

    // Compute initiative: speed + random variability
    this.initiativeOrder = [...this.participants]
      .filter(p => p.isAlive)
      .sort((a, b) => {
        const initiativeA = a.speed + Math.floor(Math.random() * INITIATIVE_VARIABILITY);
        const initiativeB = b.speed + Math.floor(Math.random() * INITIATIVE_VARIABILITY);
        return initiativeB - initiativeA; // descending: highest initiative first
      });

    this.currentTurnIndex = 0;
    const firstActor = this.getCurrentActor();
    if (firstActor) {
      this.emitter.emit('turn-change', firstActor);
      this.onTurnChange?.(firstActor);
    }
  }

  /**
   * End the current turn and advance to the next living participant.
   * Checks win/loss conditions after advancing.
   */
  endTurn(): void {
    if (!this.isActive) return;

    this.currentTurnIndex++;

    // Skip defeated participants
    while (
      this.currentTurnIndex < this.initiativeOrder.length &&
      !this.initiativeOrder[this.currentTurnIndex]!.isAlive
    ) {
      this.currentTurnIndex++;
    }

    if (this.currentTurnIndex >= this.initiativeOrder.length) {
      // All participants have had a turn; wrap around to the first living one
      this.currentTurnIndex = 0;
      while (
        this.currentTurnIndex < this.initiativeOrder.length &&
        !this.initiativeOrder[this.currentTurnIndex]!.isAlive
      ) {
        this.currentTurnIndex++;
      }
    }

    const nextActor = this.getCurrentActor();
    if (nextActor) {
      this.emitter.emit('turn-change', nextActor);
      this.onTurnChange?.(nextActor);
    }

    this.checkEndConditions();
  }

  /**
   * Perform a basic attack from one participant to another.
   * Damage = max(0, attacker.attack - target.defense).
   * Returns null if either participant is invalid, dead, or not in combat.
   */
  attack(attackerId: string, targetId: string): AttackResult | null {
    if (!this.isActive) return null;

    const attacker = this.participants.find(p => p.id === attackerId);
    const target = this.participants.find(p => p.id === targetId);

    if (!attacker || !target) return null;
    if (!attacker.isAlive || !target.isAlive) return null;

    // The current actor should be the attacker (enforced by presentation layer).
    const current = this.getCurrentActor();
    if (!current || current.id !== attackerId) {
      console.warn('[CombatEngine] Ce n\'est pas le tour de cet attaquant.');
      return null;
    }

    const damage = Math.max(0, attacker.attack - target.defense);
    target.hp = Math.max(0, target.hp - damage);
    const targetDefeated = target.hp <= 0;
    if (targetDefeated) {
      target.isAlive = false;
    }

    const result: AttackResult = {
      attackerId,
      targetId,
      damage,
      targetDefeated,
      targetHp: target.hp,
    };
    this.emitter.emit('attack', result);

    this.checkEndConditions();

    // If combat is not over, advance to next turn
    if (!this.isActive) {
      // Combat ended; result already set
      return result;
    }

    this.endTurn();
    return result;
  }

  /** Directly apply damage to a participant (e.g. for environmental damage). */
  applyDamage(targetId: string, damage: number): { targetDefeated: boolean; targetHp: number } | null {
    if (!this.isActive) return null;
    const target = this.participants.find(p => p.id === targetId);
    if (!target || !target.isAlive) return null;

    target.hp = Math.max(0, target.hp - damage);
    const targetDefeated = target.hp <= 0;
    if (targetDefeated) {
      target.isAlive = false;
    }
    this.emitter.emit('attack', {
      attackerId: 'environment',
      targetId,
      damage,
      targetDefeated,
      targetHp: target.hp,
    });
    this.checkEndConditions();
    return { targetDefeated, targetHp: target.hp };
  }

  /** Heal a participant (capped at maxHp). */
  heal(targetId: string, amount: number): { targetHp: number } | null {
    if (!this.isActive) return null;
    const target = this.participants.find(p => p.id === targetId);
    if (!target || !target.isAlive) return null;

    target.hp = Math.min(target.maxHp, target.hp + amount);
    return { targetHp: target.hp };
  }

  private checkEndConditions(): void {
    const playerAlive = this.participants.some(p => p.side === 'player' && p.isAlive);
    const enemyAlive = this.participants.some(p => p.side === 'enemy' && p.isAlive);

    if (!playerAlive) {
      this.result = 'defeat';
      this.isActive = false;
      this.emitter.emit('combat-end', 'defeat');
      this.onCombatEnd?.('defeat');
    } else if (!enemyAlive) {
      this.result = 'victory';
      this.isActive = false;
      this.emitter.emit('combat-end', 'victory');
      this.onCombatEnd?.('victory');
    }
  }

  /** Manually end the combat session without a result. */
  endCombat(): void {
    if (!this.isActive) return;
    this.isActive = false;
    this.result = null;
    this.onTurnChange = undefined;
    this.onCombatEnd = undefined;
    this.participants = [];
    this.initiativeOrder = [];
    this.currentTurnIndex = 0;
  }
}
