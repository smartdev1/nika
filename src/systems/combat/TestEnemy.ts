// TestEnemy: ennemi de test implémentant l'interface Combatant avec des valeurs statiques.
// Utilisé pour valider le moteur de combat avant d'ajouter de la complexité.
import type { Combatant } from '../../types/index';

export class TestEnemy {
  /** Crée un combattant ennemi avec des valeurs fixes : PV=30, attaque=5, défense=2, vitesse=5. */
  static create(id: string = 'test-enemy-1', name: string = 'Enfant de la Fracture'): Combatant {
    return {
      id,
      name,
      side: 'enemy',
      maxHp: 30,
      hp: 30,
      attack: 5,
      defense: 2,
      speed: 5,
      isAlive: true,
    };
  }
}

export class TestHero {
  /** Crée un combattant héroïne avec des valeurs fixes : PV=50, attaque=8, défense=3, vitesse=6. */
  static create(id: string = 'heroine-1', name: string = 'Héroïne'): Combatant {
    return {
      id,
      name,
      side: 'player',
      maxHp: 50,
      hp: 50,
      attack: 8,
      defense: 3,
      speed: 6,
      isAlive: true,
    };
  }
}
