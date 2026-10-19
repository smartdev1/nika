---
id: T-020
title: Persistance des ennemis vaincus sur la carte
status: doing
owner: game-dev
author_of_code: 
priority: P1
size: M
---

## Context
Aujourd'hui, EncounterSystem marque un encounter comme alreadyTriggered en mémoire, mais cet état est perdu au rechargement de page. Un ennemi vaincu réapparaît si le joueur recharge, ce qui casse la cohérence du monde.

## User story
En tant que joueur, je veux qu'un ennemi vaincu ne réapparaisse pas sur la carte après un rechargement, afin que mes combats aient une conséquence durable.

## Acceptance criteria
- [ ] SaveService stocke la liste des IDs d'encounters vaincus dans la sauvegarde (champ defeatedEncounters)
- [ ] ExplorationScene charge cette liste au démarrage et marque les encounters correspondants comme déjà déclenchés
- [ ] Après un combat gagné, l'encounter est ajouté aux vaincus et sauvegardé
- [ ] Le flag alreadyTriggered empêche le re-déclenchement même si le joueur reste en proximité

## Out of scope
- Réapparition des ennemis après un certain temps ou événement narratif.
- Suppression visuelle de l'ennemi de la carte (le déclencheur reste présent mais ne déclenche plus).

## Technical notes
- Liaison avec T-021 (fin de combat) pour ajouter l'ID d'encounter vaincu à la sauvegarde.
- Le champ defeatedEncounters est un tableau de strings (enemyId ou encounter id).

## Implementation log
- `src/save/SaveSchema.ts` : ajout du champ `defeatedEncounters: string[]` dans `GameSave` et `EMPTY_SAVE`.
- `src/systems/combat/EncounterSystem.ts` : ajout de `markEncounterDefeated(enemyId: string)` qui marque tous les encounters avec cet enemyId comme `alreadyTriggered = true`.
- `src/game/scenes/ExplorationScene.ts` :
  - Ajout des champs `defeatedEncounters: string[]` et `currentEncounterEnemyId: string | null`.
  - Dans `loadSave()` : restauration de `defeatedEncounters` depuis la sauvegarde et marquage des encounters correspondants via `encounterSystem.markEncounterDefeated()`.
  - Dans `startCombat(enemyId)` : mémorisation de `currentEncounterEnemyId`.
  - Nouvelle méthode `onCombatResult(result, enemyId)` : ajoute l'ennemi aux vaincus, marque via `markEncounterDefeated`, sauvegarde via `saveService.saveGame()`.

## Review
À valider par tech-lead-po.

## QA report
À valider par game-qa (agent n'ayant pas écrit le code).