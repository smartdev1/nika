---
id: T-020
title: Persistance des ennemis vaincus
status: review
owner: fullstack-devops
author_of_code: fullstack-devops
priority: P1
size: S
---

## Context
Lorsqu'un combat est remporté contre un ennemi sur la carte, l'ennemi ne doit pas réapparaître au rechargement de la partie. L'état "vaincu" doit être persistant dans la sauvegarde IndexedDB.

## User story
As a player, I want defeated enemies to stay defeated after saving and reloading, so that my progression in the world is preserved.

## Acceptance criteria
- [ ] Given a victory against an enemy, when the combat ends, then the enemyId is added to `defeatedEncounters` and saved to IndexedDB.
- [ ] Given a saved game with defeated encounters, when the exploration scene loads, then those encounters are marked as already triggered and do not spawn combat again.
- [ ] A defeat does not mark the enemy as defeated.

## Out of scope
- Persistence des combats contre plusieurs occurrences d'un même ennemi (comportement documenté en dette technique).
- Sauvegarde manuelle déclenchée par le joueur.

## Technical notes
- `EncounterSystem.markEncounterDefeated(enemyId)` passe `alreadyTriggered = true` sur tous les encounters partageant le même `enemyId`.
- `ExplorationScene.onCombatResult(result, enemyId)` est appelée par `CombatScene` à la fin du combat (T-021).
- `saveService.saveGame` est appelé sans `await` dans `onCombatResult` (dette mineure : échec de persistance silencieux).

## Implementation log
- `SaveSchema.ts` : ajout de `defeatedEncounters: string[]` à `GameSave` et `EMPTY_SAVE`.
- `EncounterSystem.ts` : ajout de `markEncounterDefeated(enemyId)`.
- `ExplorationScene.ts` : chargement/restauration dans `loadSave()`, méthode `onCombatResult()`, stockage de `currentEncounterEnemyId` dans `startCombat()`.
- Correction BUG-T20-001 (S2) : `performSave()` écrit désormais `defeatedEncounters` dans le payload `GameSave` (une auto-save ne peut plus écraser la persistance d'une victoire).
- Correction BUG-T20-002 (S3) : `onCombatResult` `await`e `saveService.saveGame()` et logue l'échec si IndexedDB est indisponible.
- Correction BUG-T20-003 (S3) : ajout d'un flag `saveLoaded` ; `update()` ne déclenche plus de combat avant la restauration de la sauvegarde (évite la race condition avec `loadSave()`).
- Correction BUG-T20-004 (S3) : suppression de l'import `TestHero`/`TestEnemy` (fixtures de test) du code de production ; création inline du héros et erreur explicite si les données ennemies sont absentes du cache.

## Review
Tech-lead-po : corrections appliquées. Les 4 bugs relevés par la QA sont adressés. Nouveaux tests dédiés ajoutés (`EncounterSystem.test.ts`, `ExplorationSceneSave.test.ts`). En attente d'exécution des tests et de nouvelle recette QA.

## QA report

### Verdict
VALIDÉ — livraison autorisée. Tous les bugs bloquants sont corrigés. Le couplage fort CombatScene → ExplorationScene (BUG-T21-001, S3) subsiste comme risque documenté non bloquant, reporté en V0.2.

### Critères d'acceptation
- [x] AC1 — victoire : enemyId ajoute à `defeatedEncounters` et persiste dans IndexedDB — `performSave()` inclut désormais `defeatedEncounters` dans le payload `GameSave` ; `onCombatResult` `await`e `saveService.saveGame()` avec try/catch (BUG-T20-001 et BUG-T20-002 résolus).
- [x] AC2 — rechargement : encounters vaincus marqués `alreadyTriggered`, pas de réapparition — `loadSave()` restaure `defeatedEncounters` et appelle `markEncounterDefeated` ; le flag `saveLoaded` bloque les combats avant restauration (BUG-T20-003 résolu).
- [x] AC3 — défaite ne marque pas l'ennemi — respecté : `onCombatResult` n'agit que sur `result === 'victory'`.

### Tests exécutés
- Automatisés : 37 passés / 0 échoués (28 existants + 9 dédiés : 5 EncounterSystem + 4 ExplorationSceneSave).
- Manuels : revue statique du code source par tech-lead-po et fullstack-qa.

### Bugs (tous corrigés)
- BUG-T20-001 (S2) — `performSave()` inclut désormais `defeatedEncounters` dans le payload `GameSave`.
- BUG-T20-002 (S3) — `saveService.saveGame()` `await`é dans `onCombatResult` et `performSave` avec try/catch.
- BUG-T20-003 (S3) — flag `saveLoaded` ; `update()` bloque les combats avant restauration.
- BUG-T20-004 (S3) — suppression de l'import `TestHero`/`TestEnemy` du code de production.

### Zones non couvertes / risques résiduels
- Comportement d'IndexedDB en mode navigation privée / quota dépassé non testé (erreurs silencieuses côté SaveService).
- Couplage fort CombatScene → ExplorationScene (cast de type) reporté en V0.2 (S3, non bloquant).

### Non-régression
- Suite existante (CombatEngine, TestEnemy) : 28 passés / 0 échoués. Aucun impact sur le moteur de combat.

Prochaine action : go/no-go de l'utilisateur, puis commit sur branche `fix/T-020-persistence-ennemis-vaincus` et push sur `git@github.com:smartdev1/nika.git`.