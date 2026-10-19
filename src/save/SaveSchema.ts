// Save data schema
// Defines the structure of a saved game state persisted in IndexedDB.

export interface HeroinePosition {
  x: number;
  y: number;
}

export interface GameSave {
  heroinePos: HeroinePosition;
  activatedStones: string[]; // IDs des objets interactifs déjà activés (pierres, etc.)
  defeatedEncounters: string[]; // IDs d'ennemis/encounters vaincus (persistance des combats gagnés)
  dialogueProgress: number;  // Progression globale des dialogues (ex. dernier node atteint)
  updatedAt: number;         // Timestamp de la dernière sauvegarde (ms)
}

export const EMPTY_SAVE: GameSave = {
  heroinePos: { x: 100, y: 100 },
  activatedStones: [],
  defeatedEncounters: [],
  dialogueProgress: 0,
  updatedAt: 0,
};
