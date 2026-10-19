---
id: T-025
title: Double déclenchement du combat
status: review
owner: game-dev
author_of_code: game-dev
priority: P1
size: S
---

## Context
`EncounterSystem.update()` déclenche le combat par deux canaux : (1) le callback `onEncounterTriggered` appelé dans `update()`, et (2) la valeur de retour d'`update()` lue dans `ExplorationScene.update()`. Les deux appellent `startCombat()`.

## User story
As a player, approaching an enemy triggers exactly one combat, not two.

## Acceptance criteria
- [ ] Un seul canal de déclenchement conservé (valeur de retour d'`update()`)
- [ ] `ExplorationScene.create()` n'appelle plus `setOnEncounterTriggered`
- [ ] Tests EncounterSystem existants non régressés (ils utilisent le callback, conservé pour la testabilité)

## Out of scope
- Suppression du callback d'EncounterSystem (gardé pour les tests)
- Réarmement des encounters après défaite (T-026)

## Technical notes
- Roadmap §1.1 T-025 : "Garder un seul canal"

## Implementation log
- Suppression de this.encounterSystem.setOnEncounterTriggered(...) dans ExplorationScene.create()
- Un seul canal de déclenchement conservé: la valeur de retour d'EncounterSystem.update() lue dans ExplorationScene.update()
- Le callback onEncounterTriggered est conservé dans EncounterSystem pour la testabilité (tests existants non régressés: 5 tests passent)

## Review
(filled by tech-lead-po)

## QA report
(filled by the QA agent)