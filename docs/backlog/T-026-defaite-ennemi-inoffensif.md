---
id: T-026
title: Défaite = ennemi inoffensif (alreadyTriggered jamais réinitialisé)
status: done
owner: game-dev
author_of_code: game-dev
priority: P1
size: S
---

## Context
`EncounterSystem` marque un encounter comme déclenché (`alreadyTriggered = true`) mais ne le réinitialise jamais après une défaite. Le joueur qui perd un combat et revient sur l'ennemi ne peut plus le combattre — l'ennemi devient inoffensif.

## User story
As a player, if I lose a battle, I can retry it by approaching the enemy again.

## Acceptance criteria
- [ ] `EncounterSystem` expose une méthode `resetEncounter(enemyId)` qui remet `alreadyTriggered = false`
- [ ] `ExplorationScene.onCombatResult` appelle `resetEncounter` en cas de défaite
- [ ] Recul du joueur après défaite (petit déplacement pour éviter un re-déclenchement immédiat)
- [ ] Tests EncounterSystem existants non régressés

## Out of scope
- Réarmement automatique après un délai
- Changement de la formule de combat

## Technical notes
- Roadmap §1.1 T-026
## Implementation log
- EncounterSystem: ajout de `resetEncounterByEnemyId(enemyId)` qui réinitialise `alreadyTriggered` pour tous les encounters avec cet enemyId
- ExplorationScene.onCombatResult: ajout du cas `defeat` qui appelle `resetEncounterByEnemyId` et recule le joueur de 64px (x et y) pour éviter un re-déclenchement immédiat
- Tests EncounterSystem: non régressés (5/5)

## Review
Verdict : APPROUVÉ

### Bloquant
- (aucun)

### Important
- (aucun)

### Mineur / suggestion
- Le recul est appliqué sur x et y simultanément (diagonale) plutôt que dans la direction du dernier déplacement ; acceptable pour MVP.

### Points positifs
- API cohérente avec markEncounterDefeated, symétrique.
- Tests existants non régressés.

Prochaine action : passage en QA.

## QA report
Verdict : ACCEPTÉ

### Critères d'acceptation
- [x] `EncounterSystem` expose `resetEncounter(enemyId)` (implémenté `resetEncounterByEnemyId`) — tests passants
- [x] `ExplorationScene.onCombatResult` appelle reset en cas de défaite — log confirmé
- [x] Recul du joueur après défaite (64px x/y)
- [x] Tests EncounterSystem non régressés (5/5)

### Tests exécutés
- Automatisés : 37 passés / 0 échoués (suite complète)

### Bugs
- (aucun)

### Zones non couvertes / risques résiduels
- Recul appliqué en diagonale (x et y) ; acceptable MVP.

### Non-régression
- Zones vérifiées : EncounterSystem, ExplorationScene save tests.

Prochaine action : clôture T-026.