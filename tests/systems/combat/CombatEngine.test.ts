import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CombatEngine } from '../../../src/systems/combat/CombatEngine';
import type { Combatant } from '../../../src/types/index';

function makeCombatant(overrides: Partial<Combatant> = {}): Combatant {
  return {
    id: overrides.id ?? 'c1',
    name: overrides.name ?? 'Combattant',
    side: overrides.side ?? 'player',
    maxHp: overrides.maxHp ?? 100,
    hp: overrides.hp ?? 100,
    attack: overrides.attack ?? 10,
    defense: overrides.defense ?? 5,
    speed: overrides.speed ?? 5,
    isAlive: overrides.isAlive ?? true,
  };
}

describe('CombatEngine', () => {
  let engine: CombatEngine;

  beforeEach(() => {
    engine = new CombatEngine();
  });

  describe('startCombat / initiative', () => {
    it('should set the first turn to the participant with the highest speed (large gap overrides random variability)', () => {
      const fast = makeCombatant({ id: 'fast', name: 'Rapide', speed: 20 });
      const slow = makeCombatant({ id: 'slow', name: 'Lent', speed: 1 });
      // Variability is 0–4, so speed 20 vs 1 guarantees fast goes first.
      engine.startCombat({ participants: [slow, fast] });
      expect(engine.getCurrentActor()?.id).toBe('fast');
    });

    it('should expose all participants via getParticipants', () => {
      const a = makeCombatant({ id: 'a', side: 'player' });
      const b = makeCombatant({ id: 'b', side: 'enemy' });
      engine.startCombat({ participants: [a, b] });
      expect(engine.getParticipants().map(p => p.id).sort()).toEqual(['a', 'b']);
    });

    it('should mark isActive true after startCombat', () => {
      engine.startCombat({ participants: [makeCombatant()] });
      expect(engine.getIsActive()).toBe(true);
    });

    it('should not start a second combat while one is active', () => {
      const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      engine.startCombat({ participants: [makeCombatant()] });
      engine.startCombat({ participants: [makeCombatant({ id: 'x2' })] });
      expect(spy).toHaveBeenCalledWith(
        expect.stringContaining('Combat already in progress')
      );
      spy.mockRestore();
    });
  });

  describe('turn progression', () => {
    it('should advance to the next participant on endTurn', () => {
      const a = makeCombatant({ id: 'a', speed: 20, side: 'player' });
      const b = makeCombatant({ id: 'b', speed: 1, side: 'enemy', hp: 999 });
      engine.startCombat({ participants: [a, b] });
      expect(engine.getCurrentActor()?.id).toBe('a');
      engine.endTurn();
      expect(engine.getCurrentActor()?.id).toBe('b');
    });

    it('should wrap around to the first living participant after the last turn', () => {
      const a = makeCombatant({ id: 'a', speed: 20, side: 'player', hp: 999 });
      const b = makeCombatant({ id: 'b', speed: 1, side: 'enemy', hp: 999 });
      engine.startCombat({ participants: [a, b] });
      engine.endTurn(); // a -> b
      engine.endTurn(); // b -> a
      expect(engine.getCurrentActor()?.id).toBe('a');
    });

    it('should skip defeated participants when advancing turns', () => {
      const a = makeCombatant({ id: 'a', speed: 20, side: 'player', hp: 999 });
      const b = makeCombatant({ id: 'b', speed: 1, side: 'enemy', hp: 1 });
      const c = makeCombatant({ id: 'c', speed: 5, side: 'enemy', hp: 999 });
      engine.startCombat({ participants: [a, b, c] });
      // a defeats b; endTurn skips b and goes to c (combat continues because c is alive)
      const result = engine.attack('a', 'b');
      expect(result!.targetDefeated).toBe(true);
      expect(engine.getCurrentActor()?.id).toBe('c');
    });

    it('should not allow a non-current actor to attack', () => {
      const a = makeCombatant({ id: 'a', speed: 20, side: 'player' });
      const b = makeCombatant({ id: 'b', speed: 1, side: 'enemy', hp: 999 });
      engine.startCombat({ participants: [a, b] });
      // It's a's turn; b should not be able to attack
      const result = engine.attack('b', 'a');
      expect(result).toBeNull();
    });
  });

  describe('attack / damage', () => {
    it('should deal damage equal to max(0, attack - defense)', () => {
      const attacker = makeCombatant({ id: 'atk', attack: 20, defense: 0, side: 'player', speed: 20 });
      const target = makeCombatant({ id: 'tgt', attack: 0, defense: 8, hp: 50, side: 'enemy', speed: 1 });
      engine.startCombat({ participants: [attacker, target] });
      const result = engine.attack('atk', 'tgt');
      expect(result).not.toBeNull();
      expect(result!.damage).toBe(12); // 20 - 8
      expect(result!.targetHp).toBe(38); // 50 - 12
    });

    it('should deal 0 damage when attack <= defense', () => {
      const attacker = makeCombatant({ id: 'atk', attack: 5, defense: 0, side: 'player', speed: 20 });
      const target = makeCombatant({ id: 'tgt', attack: 0, defense: 10, hp: 50, side: 'enemy', speed: 1 });
      engine.startCombat({ participants: [attacker, target] });
      const result = engine.attack('atk', 'tgt');
      expect(result!.damage).toBe(0);
      expect(result!.targetHp).toBe(50);
    });

    it('should mark target as defeated when hp reaches 0', () => {
      const attacker = makeCombatant({ id: 'atk', attack: 100, defense: 0, side: 'player', speed: 20 });
      const target = makeCombatant({ id: 'tgt', attack: 0, defense: 0, hp: 10, side: 'enemy', speed: 1 });
      engine.startCombat({ participants: [attacker, target] });
      const result = engine.attack('atk', 'tgt');
      expect(result!.targetDefeated).toBe(true);
      expect(result!.targetHp).toBe(0);
      expect(engine.getParticipants().find(p => p.id === 'tgt')?.isAlive).toBe(false);
    });

    it('should return null when attacking a dead target', () => {
      const attacker = makeCombatant({ id: 'atk', attack: 100, defense: 0, side: 'player', speed: 20 });
      const target = makeCombatant({ id: 'tgt', attack: 0, hp: 1, side: 'enemy', speed: 1 });
      engine.startCombat({ participants: [attacker, target] });
      engine.attack('atk', 'tgt'); // defeats target
      const result = engine.attack('atk', 'tgt');
      expect(result).toBeNull();
    });

    it('should emit an attack event with the result', () => {
      const attacker = makeCombatant({ id: 'atk', attack: 15, defense: 0, side: 'player', speed: 20 });
      const target = makeCombatant({ id: 'tgt', attack: 0, defense: 3, hp: 20, side: 'enemy', speed: 1 });
      const events: any[] = [];
      engine.on('attack', (result: any) => events.push(result));
      engine.startCombat({ participants: [attacker, target] });
      engine.attack('atk', 'tgt');
      expect(events).toHaveLength(1);
      expect(events[0].damage).toBe(12); // 15 - 3
      expect(events[0].targetId).toBe('tgt');
    });
  });

  describe('win/loss conditions', () => {
    it('should emit victory when all enemies are defeated', () => {
      const endEvents: ('victory' | 'defeat')[] = [];
      engine.on('combat-end', (result: 'victory' | 'defeat') => endEvents.push(result));
      const p = makeCombatant({ id: 'p1', side: 'player', speed: 20, hp: 999 });
      const e = makeCombatant({ id: 'e1', side: 'enemy', speed: 1, hp: 5 });
      engine.startCombat({ participants: [p, e] });
      engine.attack('p1', 'e1');
      expect(endEvents).toContain('victory');
      expect(engine.getResult()).toBe('victory');
      expect(engine.getIsActive()).toBe(false);
    });

    it('should emit defeat when all players are defeated', () => {
      const endEvents: ('victory' | 'defeat')[] = [];
      engine.on('combat-end', (result: 'victory' | 'defeat') => endEvents.push(result));
      const p = makeCombatant({ id: 'p1', side: 'player', speed: 1, hp: 5 });
      const e = makeCombatant({ id: 'e1', side: 'enemy', speed: 20, attack: 100, hp: 999 });
      engine.startCombat({ participants: [p, e] });
      engine.attack('e1', 'p1');
      expect(endEvents).toContain('defeat');
      expect(engine.getResult()).toBe('defeat');
      expect(engine.getIsActive()).toBe(false);
    });

    it('should not end combat when both sides still have living members', () => {
      const endEvents: ('victory' | 'defeat')[] = [];
      engine.on('combat-end', (result: 'victory' | 'defeat') => endEvents.push(result));
      const p = makeCombatant({ id: 'p1', side: 'player', speed: 20, hp: 999 });
      const e = makeCombatant({ id: 'e1', side: 'enemy', speed: 1, hp: 50 });
      engine.startCombat({ participants: [p, e] });
      engine.attack('p1', 'e1'); // 10 - 5 = 5 damage, e1 has 50 hp -> not fatal
      expect(endEvents).toHaveLength(0);
      expect(engine.getResult()).toBeNull();
      expect(engine.getIsActive()).toBe(true);
    });
  });

  describe('applyDamage / heal', () => {
    it('should apply direct damage to a target', () => {
      const target = makeCombatant({ id: 'tgt', hp: 30, side: 'enemy' });
      const actor = makeCombatant({ id: 'actor', speed: 20, side: 'player' });
      engine.startCombat({ participants: [actor, target] });
      const res = engine.applyDamage('tgt', 10);
      expect(res!.targetHp).toBe(20);
      expect(res!.targetDefeated).toBe(false);
    });

    it('should heal up to maxHp but not above', () => {
      const target = makeCombatant({ id: 'tgt', maxHp: 50, hp: 30, side: 'player' });
      const actor = makeCombatant({ id: 'actor', speed: 20, side: 'player' });
      engine.startCombat({ participants: [actor, target] });
      const res = engine.heal('tgt', 100);
      expect(res!.targetHp).toBe(50); // capped at maxHp
    });

    it('should return null for applyDamage on a dead target', () => {
      const target = makeCombatant({ id: 'tgt', hp: 1, side: 'enemy' });
      const actor = makeCombatant({ id: 'actor', speed: 20, side: 'player' });
      engine.startCombat({ participants: [actor, target] });
      engine.applyDamage('tgt', 1); // defeats
      const res = engine.applyDamage('tgt', 5);
      expect(res).toBeNull();
    });
  });

  describe('endCombat', () => {
    it('should reset the engine state', () => {
      engine.startCombat({
        participants: [makeCombatant({ id: 'a', side: 'player' }), makeCombatant({ id: 'b', side: 'enemy', hp: 999 })],
      });
      engine.endCombat();
      expect(engine.getIsActive()).toBe(false);
      expect(engine.getCurrentActor()).toBeNull();
      expect(engine.getResult()).toBeNull();
      expect(engine.getParticipants()).toEqual([]);
    });
  });
})
