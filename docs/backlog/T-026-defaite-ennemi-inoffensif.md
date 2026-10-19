---
id: T-026
title: Défaite = ennemi inoffensif (alreadyTriggered jamais réinitialisé)
status: review
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
