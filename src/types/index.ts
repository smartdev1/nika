// Shared TypeScript types
// Export interfaces and types used across modules

export interface Combatant {
  id: string;
  name: string;
  side: 'player' | 'enemy';
  maxHp: number;
  hp: number;
  attack: number;
  defense: number;
  speed: number;
  isAlive: boolean;
}

export type CombatResult = 'victory' | 'defeat' | null;