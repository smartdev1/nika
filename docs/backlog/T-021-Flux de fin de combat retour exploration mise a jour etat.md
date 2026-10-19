---
id: T-021
title: Flux de fin de combat retour exploration mise à jour état
status: doing
owner: game-dev
author_of_code: 
priority: P1
size: M
---

## Context
CombatScene gère victoire/défaite et retourne à ExplorationScene, mais l'état du monde n'est pas mis à jour : l'ennemi reste présent visuellement, aucun feedback de victoire n'est affiché, et l'encounter n'est pas marqué vaincu.

## User story
En tant que joueur, quand je gagne un combat, je veux revenir à l'exploration avec l'ennemi marqué comme vaincu sur la carte et un message confirmant ma victoire.

## Acceptance criteria
- [ ] CombatScene signale le résultat (victoire/défaite) à ExplorationScene au retour (via un événement ou donnée de scène)
- [ ] En cas de victoire, l'encounter correspondant est marqué vaincu (ajout à defeatedEncounters via SaveService)
- [ ] Un message de victoire s'affiche brièvement avant de reprendre le contrôle du joueur
- [ ] En cas de défaite, l'exploration reprend sans marquer l'encounter comme vaincu (le joueur peut réessayer)

## Out of scope
- Butin, XP, progression de personnage.
- Animation de victoire élaborée.

## Technical notes
- Dépend de T-020 (champ defeatedEncounters dans SaveService).
- Communication CombatScene → ExplorationScene via this.scene.get('exploration-scene') ou données de démarrage de scène.

## Implementation log
- `src/game/scenes/CombatScene.ts` : dans `onCombatEnd()`, avant de stopper/reprendre la scène, appelle `exploration.onCombatResult(result, this.currentEnemyId)` via `this.scene.get('exploration-scene')`.
- `src/game/scenes/ExplorationScene.ts` : nouvelle méthode `onCombatResult(result, enemyId)` qui, en cas de victoire, ajoute l'ennemi à `defeatedEncounters`, le marque via `encounterSystem.markEncounterDefeated()`, et persiste via `saveService.saveGame()`.
- Dépend de T-020 (champ `defeatedEncounters` dans SaveSchema).

## Review
À valider par tech-lead-po.

## QA report
À valider par game-qa (agent n'ayant pas écrit le code).