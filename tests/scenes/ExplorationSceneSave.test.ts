import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { GameSave } from '../../src/save/SaveSchema';

// phaser3spectorjs est un module optionnel de débogage WebGL de Phaser,
// non requis pour les tests unitaires.
vi.mock('phaser3spectorjs', () => ({}));

import ExplorationScene from '../../src/game/scenes/ExplorationScene';

describe('ExplorationScene — persistance des ennemis vaincus (T-020 / T-021)', () => {
  let scene: ExplorationScene;
  const mockSaveGame = vi.fn();
  const mockLoadGame = vi.fn();
  const mockEncounterSystem = {
    markEncounterDefeated: vi.fn(),
  };

  beforeEach(() => {
    mockSaveGame.mockReset();
    mockLoadGame.mockReset();
    mockEncounterSystem.markEncounterDefeated.mockReset();
    scene = new ExplorationScene();

    // Initialisation manuelle des champs privés nécessaires (scène non créée via Phaser create()).
    // Le champ saveService est initialisé avec le vrai SaveService dans le constructeur ;
    // on l'écrase par un mock pour éviter toute dépendance à IndexedDB.
    (scene as any).player = { x: 100, y: 200 };
    (scene as any).saveService = { saveGame: mockSaveGame, loadGame: mockLoadGame };
    (scene as any).encounterSystem = mockEncounterSystem;
    (scene as any).activatedObjectIds = [];
    (scene as any).defeatedEncounters = [];
    (scene as any).saveLoaded = true;
  });

  it('onCombatResult ajoute l enemyId à defeatedEncounters et appelle saveGame avec le payload incluant defeatedEncounters', async () => {
    await scene.onCombatResult('victory', 'enemy-1');

    expect((scene as any).defeatedEncounters).toContain('enemy-1');
    expect(mockEncounterSystem.markEncounterDefeated).toHaveBeenCalledWith('enemy-1');
    expect(mockSaveGame).toHaveBeenCalledTimes(1);

    const payload = mockSaveGame.mock.calls[0][0] as GameSave;
    expect(payload.defeatedEncounters).toEqual(['enemy-1']);
    expect(payload.heroinePos).toEqual({ x: 100, y: 200 });
  });

  it('onCombatResult avec defeat ne modifie pas defeatedEncounters ni n appelle saveGame', async () => {
    (scene as any).defeatedEncounters = ['enemy-1'];

    await scene.onCombatResult('defeat', 'enemy-1');

    expect((scene as any).defeatedEncounters).toEqual(['enemy-1']);
    expect(mockSaveGame).not.toHaveBeenCalled();
  });

  it('performSave inclut defeatedEncounters dans le payload écrit dans IndexedDB', async () => {
    (scene as any).defeatedEncounters = ['enemy-1', 'enemy-2'];

    await (scene as any).performSave();

    expect(mockSaveGame).toHaveBeenCalledTimes(1);
    const payload = mockSaveGame.mock.calls[0][0] as GameSave;
    expect(payload.defeatedEncounters).toEqual(['enemy-1', 'enemy-2']);
  });

  it('une auto-save post-victoire ne supprime pas les encounters vaincus (non-régression BUG-T20-001)', async () => {
    (scene as any).defeatedEncounters = ['enemy-1'];

    // Simule une victoire qui persiste, puis une auto-save immédiate.
    await scene.onCombatResult('victory', 'enemy-1');
    await (scene as any).performSave();

    const payload = mockSaveGame.mock.calls[mockSaveGame.mock.calls.length - 1][0] as GameSave;
    expect(payload.defeatedEncounters).toContain('enemy-1');
  });
});
