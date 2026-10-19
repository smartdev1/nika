---
id: T-029
title: CombatScene.shutdown() jamais appelé, removeAllListeners() inexistant
status: review
owner: game-dev
author_of_code: game-dev
priority: P1
size: S
---

## Context
`CombatScene.shutdown()` est déclaré mais jamais appelé par Phaser (il faut `this.events.once('shutdown', ...)`). `CombatEngine.removeAllListeners()` n'existe pas → erreur runtime lors de l'arrêt du combat.

## User story
As a developer, combat scene cleanup works without runtime errors.

## Acceptance criteria
- [ ] `CombatScene` enregistre `this.events.once('shutdown', ...)` dans `create()`
- [ ] `CombatEngine` expose `removeAllListeners()` qui supprime tous les listeners
- [ ] Aucune erreur runtime lors de l'arrêt d'un combat
- [ ] Tests CombatEngine existants non régressés

## Out of scope
- Refonte du système d'événements
- Ajout de nouveaux événements

## Technical notes
- Roadmap §1.1 T-029
- `removeAllListeners()` doit supprimer les listeners de 'turn-change', 'attack', 'combat-end'
