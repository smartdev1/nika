---
id: T-029
title: CombatScene.shutdown() jamais appelé, removeAllListeners() inexistant
status: done
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

## Review
Verdict : APPROUVÉ

### Bloquant
- (aucun)

### Important
- (aucun)

### Mineur / suggestion
- removeAllListeners() vide tout le dictionnaire listeners ; conforme à l'ADR.

### Points positifs
- CombatScene enregistre this.events.once('shutdown', ...) dans create().
- CombatEngine.removeAllListeners() délégué à l'Emitter interne.

Prochaine action : passage en QA.

## QA report
Verdict : ACCEPTÉ

### Critères d'acceptation
- [x] CombatScene enregistre this.events.once('shutdown', ...) dans create()
- [x] CombatEngine expose removeAllListeners() supprimant turn-change/attack/combat-end
- [x] aucune erreur runtime à l'arrêt
- [x] tests CombatEngine non régressés (20/20)

### Tests exécutés
- Automatisés : 37 passés / 0 échoués

### Bugs
- (aucun)

### Zones non couvertes / risques résiduels
- (aucun)

### Non-régression
- Zones vérifiées : CombatEngine, CombatScene.

Prochaine action : clôture T-029.
