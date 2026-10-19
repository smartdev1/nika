---
id: T-021
title: End-of-combat flow
status: review
owner: fullstack-devops
author_of_code: fullstack-devops
priority: P1
size: S
---

## Context
À la fin d'un combat, le résultat (victoire/défaite) doit être affiché, puis l'exploration doit reprendre avec l'état mis à jour (ennemi marqué vaincu en cas de victoire).

## User story
As a player, when a combat ends, I want to see the result and return to exploration with the world state updated accordingly.

## Acceptance criteria
- [ ] Given a combat ends in victory, when the delay elapses, then `ExplorationScene.onCombatResult('victory', enemyId)` is called and the exploration scene resumes.
- [ ] Given a combat ends in defeat, then `onCombatResult` is called with 'defeat' and no enemy is marked as defeated.
- [ ] CombatEngine listeners are cleaned up when the combat scene stops (no listener leak across combats).
- [ ] The attack button is disabled during combat end and re-enabled only on the player's next turn.

## Out of scope
- Appel réel au fallback ARCCloud (hors périmètre V0.1).
- Écran de game over en cas de défaite du héros.

## Technical notes
- `CombatScene.onCombatEnd` notifie l'exploration via `this.scene.get('exploration-scene')` puis `scene.stop('combat-scene')` + `scene.resume('exploration-scene')`.
- `shutdown()` appelle `combatEngine.removeAllListeners()` et `combatEngine.endCombat()`.
- Couplage fort via cast de type sur `onCombatResult` (à encadrer V0.2).

## Implementation log
- `CombatScene.ts` : `onCombatEnd` avec notification à l'exploration et reprise de scène ; `shutdown()` nettoyé.
- `ExplorationScene.ts` : `onCombatResult()` publique (async), `currentEncounterEnemyId` mémorisé dans `startCombat()`.
- Correction liée (via T-020) : `onCombatResult` `await`e `saveService.saveGame()` pour que le résultat de T-021 ne soit pas masqué par un échec de persistance silencieux.

## Review
Tech-lead-po : fonctionnellement conforme aux AC. Le couplage fort `CombatScene` → `ExplorationScene` (cast de type) est documenté et reporté en V0.2 (S3, non bloquant). Nouveaux tests dédiés ajoutés. En attente d'exécution des tests et de nouvelle recette QA.

## QA report

### Verdict
VALIDÉ — livraison autorisée. Les critères fonctionnels sont tous respectés. Le couplage fort CombatScene → ExplorationScene (BUG-T21-001, S3) subsiste comme risque documenté non bloquant, reporté en V0.2.

### Critères d'acceptation
- [x] AC1 — victoire : `ExplorationScene.onCombatResult('victory', enemyId)` appelé après le délai, puis l'exploration reprend — présent (`CombatScene.onCombatEnd`, `delayedCall` 2000ms, notification à l'exploration via `this.scene.get('exploration-scene')`, puis `scene.stop('combat-scene')` + `scene.resume('exploration-scene')`).
- [x] AC2 — défaite : `onCombatResult` appelé avec `'defeat'`, aucun ennemi marqué comme vaincu — respecté.
- [x] AC3 — listeners CombatEngine nettoyés à l'arrêt, pas de fuite entre deux combats — `shutdown()` appelle `combatEngine.removeAllListeners()` + `combatEngine.endCombat()`.
- [x] AC4 — bouton d'attaque désactivé pendant la fin de combat, réactivé au tour du joueur — respecté.

### Tests exécutés
- Automatisés : 37 passés / 0 échoués (suite existante + 9 tests dédiés T-020/T-021).
- Manuels : revue statique du code source par tech-lead-po et fullstack-qa.

### Bugs
- BUG-T21-001 (S3) — couplage fort CombatScene → ExplorationScene via cast de type sur `onCombatResult` (lignes 237-240). Documenté en revue, reporté en V0.2 ; pas de blocage fonctionnel en l'état.

### Zones non couvertes / risques résiduels
- CombatScene n'est pas instanciable aisément hors contexte Phaser/DOM : pas de test unitaire sur la scène elle-même.
- Le cast structurel sur `onCombatResult` n'est pas vérifié statiquement.

### Non-régression
- Suite existante (CombatEngine, TestEnemy) : 28 passés / 0 échoués. `shutdown()` présent, aucune fuite de listeners détectée par lecture de code.

Prochaine action : go/no-go de l'utilisateur, puis commit sur branche `fix/T-020-persistence-ennemis-vaincus` et push sur `git@github.com:smartdev1/nika.git`.