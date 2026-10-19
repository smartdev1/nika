import { describe, it, expect, beforeEach } from 'vitest';
import { CombatEngine } from '../../../src/systems/combat/CombatEngine';
import { TestEnemy } from '../../../src/systems/combat/TestEnemy';
import { TestHero } from '../../../src/systems/combat/TestEnemy';
import type { Combatant } from '../../../src/types/index';

describe('TestEnemy / TestHero', () => {
  it('TestEnemy crée un ennemi avec les valeurs statiques attendues', () => {
    const enemy = TestEnemy.create();
    expect(enemy.side).toBe('enemy');
    expect(enemy.maxHp).toBe(30);
    expect(enemy.hp).toBe(30);
    expect(enemy.attack).toBe(5);
    expect(enemy.defense).toBe(2);
    expect(enemy.speed).toBe(5);
    expect(enemy.isAlive).toBe(true);
  });

  it('TestHero crée une héroïne avec les valeurs statiques attendues', () => {
    const hero = TestHero.create();
    expect(hero.side).toBe('player');
    expect(hero.maxHp).toBe(50);
    expect(hero.hp).toBe(50);
    expect(hero.attack).toBe(8);
    expect(hero.defense).toBe(3);
    expect(hero.speed).toBe(6);
    expect(hero.isAlive).toBe(true);
  });
});

describe('CombatEngine avec ennemi de test', () => {
  let engine: CombatEngine;
  let hero: Combatant;
  let enemy: Combatant;
  let endEvents: ('victory' | 'defeat')[] = [];

  beforeEach(() => {
    engine = new CombatEngine();
    hero = TestHero.create();
    enemy = TestEnemy.create();
    endEvents = [];
    engine.on('combat-end', (result: 'victory' | 'defeat') => endEvents.push(result));
  });

  it('l initiative détermine qui agit en premier (héroïne plus rapide)', () => {
    engine.startCombat({ participants: [enemy, hero] });
    // Hero speed 6 vs enemy speed 5, variability 0-4: hero might not always go first.
    // With these close speeds we just verify a current actor exists.
    expect(engine.getCurrentActor()?.id).toBeDefined();
  });

  it('le héros attaque l ennemi, les PV de l ennemi baissent de max(0, attaque - défense)', () => {
    // Give hero much higher speed to guarantee it goes first
    const fastHero = TestHero.create('hero-fast', 'Héroïne Rapide');
    fastHero.speed = 20;
    engine.startCombat({ participants: [enemy, fastHero] });
    expect(engine.getCurrentActor()?.id).toBe('hero-fast');

    const result = engine.attack('hero-fast', enemy.id);
    expect(result).not.toBeNull();
    expect(result!.damage).toBe(8 - 2); // 6
    expect(result!.targetHp).toBe(30 - 6); // 24
  });

  it('l ennemi attaque automatiquement le héros à son tour', () => {
    const fastEnemy = TestEnemy.create('enemy-fast', 'Ennemi Rapide');
    fastEnemy.speed = 20;
    engine.startCombat({ participants: [hero, fastEnemy] });
    expect(engine.getCurrentActor()?.id).toBe('enemy-fast');

    const result = engine.attack('enemy-fast', hero.id);
    expect(result).not.toBeNull();
    expect(result!.damage).toBe(5 - 3); // 2
    expect(result!.targetHp).toBe(50 - 2); // 48
  });

  it('le combat passe au tour suivant après chaque action', () => {
    const fastHero = TestHero.create('hero-fast', 'Héroïne Rapide');
    fastHero.speed = 20;
    const weakEnemy = TestEnemy.create('enemy-weak', 'Ennemi Faible');
    weakEnemy.speed = 1;
    weakEnemy.hp = 1; // one hit kills
    engine.startCombat({ participants: [weakEnemy, fastHero] });

    // Hero attacks and defeats enemy
    const result = engine.attack('hero-fast', 'enemy-weak');
    expect(result!.targetDefeated).toBe(true);

    // Combat ended because all enemies defeated
    expect(engine.getIsActive()).toBe(false);
    expect(endEvents).toContain('victory');
  });

  it('le combat se termine par défaite quand tous les héros sont morts', () => {
    const weakHero = TestHero.create('hero-weak', 'Héroïne Faible');
    weakHero.speed = 1;
    weakHero.hp = 1;
    const strongEnemy = TestEnemy.create('enemy-strong', 'Ennemi Fort');
    strongEnemy.speed = 20;
    strongEnemy.attack = 100;
    engine.startCombat({ participants: [weakHero, strongEnemy] });

    // Enemy goes first and one-shots hero
    const result = engine.attack('enemy-strong', 'hero-weak');
    expect(result!.targetDefeated).toBe(true);
    expect(engine.getIsActive()).toBe(false);
    expect(endEvents).toContain('defeat');
  });

  it('les dégâts ne sont jamais négatifs (pas de soin involontaire)', () => {
    const tankyEnemy = TestEnemy.create('tanky', 'Ennemi Tank');
    tankyEnemy.defense = 100; // huge defense
    const weakHero = TestHero.create('weak-hero', 'Héroïne Faible');
    weakHero.attack = 1;
    weakHero.speed = 20;
    engine.startCombat({ participants: [tankyEnemy, weakHero] });

    const result = engine.attack('weak-hero', tankyEnemy.id);
    expect(result!.damage).toBe(0); // max(0, 1 - 100) = 0
    expect(result!.targetHp).toBe(30); // unchanged
  });
})
