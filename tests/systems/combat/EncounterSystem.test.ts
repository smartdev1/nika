import { describe, it, expect, beforeEach } from 'vitest';
import { EncounterSystem } from '../../../src/systems/combat/EncounterSystem';

function makeEncounter(id: number, enemyId: string, x: number, y: number): any {
  return {
    id,
    name: `enc-${id}`,
    x,
    y,
    width: 16,
    height: 16,
    properties: [
      { name: 'combat', value: true },
      { name: 'enemyId', value: enemyId },
    ],
    alreadyTriggered: false,
  };
}

function makeObjectLayer(objects: any[]): any {
  return { objects };
}

describe('EncounterSystem — déjà déclenché / vaincu (T-020)', () => {
  let system: EncounterSystem;
  let triggered: string[] = [];

  beforeEach(() => {
    triggered = [];
    system = new EncounterSystem({} as any, { triggerDistance: 32 });
    system.setOnEncounterTriggered((enemyId: string) => {
      triggered.push(enemyId);
    });
  });

  it('marque un encounter comme déjà déclenché après activation (pas de réapparition immédiate)', () => {
    system.loadFromObjectLayer(makeObjectLayer([makeEncounter(1, 'gobelin', 100, 100)]));
    system.setPlayer({ x: 110, y: 100 } as any);

    const result = system.update();
    expect(result).toBe('gobelin');
    expect(triggered).toContain('gobelin');

    // Deuxième update : déjà déclenché, pas de nouveau combat
    const result2 = system.update();
    expect(result2).toBeUndefined();
    expect(triggered).toHaveLength(1);
  });

  it('markEncounterDefeated marque tous les encounters de l enemyId comme déjà déclenchés', () => {
    system.loadFromObjectLayer(makeObjectLayer([
      makeEncounter(1, 'gobelin', 100, 100),
      makeEncounter(2, 'gobelin', 200, 200),
      makeEncounter(3, 'squelette', 300, 300),
    ]));
    system.markEncounterDefeated('gobelin');

    const encounters = system.getEncounters();
    expect(encounters[0].alreadyTriggered).toBe(true);
    expect(encounters[1].alreadyTriggered).toBe(true);
    expect(encounters[2].alreadyTriggered).toBe(false);
  });

  it('resetEncounter réactive un encounter spécifique', () => {
    system.loadFromObjectLayer(makeObjectLayer([makeEncounter(1, 'gobelin', 100, 100)]));
    system.markEncounterDefeated('gobelin');
    expect(system.getEncounters()[0].alreadyTriggered).toBe(true);

    system.resetEncounter(1);
    expect(system.getEncounters()[0].alreadyTriggered).toBe(false);
  });

  it('update ne déclenche pas un encounter déjà marqué vaincu par markEncounterDefeated', () => {
    system.loadFromObjectLayer(makeObjectLayer([makeEncounter(1, 'gobelin', 100, 100)]));
    system.markEncounterDefeated('gobelin');
    system.setPlayer({ x: 110, y: 100 } as any);

    const result = system.update();
    expect(result).toBeUndefined();
    expect(triggered).toHaveLength(0);
  });

  it('ne déclenche que les encounters avec la propriété combat=true', () => {
    system.loadFromObjectLayer(makeObjectLayer([
      { id: 1, name: 'deco', x: 100, y: 100, width: 16, height: 16, properties: [], alreadyTriggered: false },
      makeEncounter(2, 'gobelin', 200, 200),
    ]));
    system.setPlayer({ x: 210, y: 200 } as any);

    const result = system.update();
    expect(result).toBe('gobelin');
  });
});
