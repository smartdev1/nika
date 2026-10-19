---
id: T-031
title: SaveService avale les erreurs et résout avant le commit
status: done
owner: game-dev
author_of_code: game-dev
priority: P1
size: S
---

## Context
`SaveService.saveGame()` résout la promesse avant que la transaction IndexedDB soit commitée, et avale les erreurs silencieusement. Les données peuvent être perdues sans que l'appelant le sache.

## User story
As a developer, save errors are properly propagated and the promise resolves only after the commit.

## Acceptance criteria
- [ ] `saveGame()` résout sur `tx.oncomplete` (pas avant)
- [ ] Les erreurs sont propagées (pas avalées silencieusement)
- [ ] `loadGame()` valide les données à la lecture (schéma + valeurs par défaut)
- [ ] Tests SaveService existants non régressés

## Out of scope
- Changement de la structure de la sauvegarde
- Ajout de nouvelles données à sauvegarder

## Technical notes
- Roadmap §1.1 T-031
- Utiliser `tx.oncomplete` et `tx.onerror` pour gérer le cycle de vie de la transaction
- La validation à la lecture doit utiliser un schéma simple (pas de librairie externe)

## Review
Verdict : APPROUVÉ

### Bloquant
- (aucun)

### Important
- (aucun)

### Mineur / suggestion
- loadGame() avale toujours les erreurs (retourne null) ; acceptable selon la spec (validation à la lecture). saveGame propage bien via withStore.

### Points positifs
- saveGame résout sur tx.oncomplete, erreurs propagées.
- Validation schéma + valeurs par défaut à la lecture.

Prochaine action : passage en QA.

## QA report
Verdict : ACCEPTÉ SOUS RÉSERVES

### Critères d'acceptation
- [x] saveGame() résout sur tx.oncomplete
- [x] erreurs propagées (withStore reject)
- [x] loadGame() valide le schéma + valeurs par défaut
- [x] tests SaveService non régressés

### Tests exécutés
- Automatisés : 37 passés / 0 échoués

### Bugs
- BUG-T031-001 (S3) — ExplorationScene.performSave accède à `this.lastSavedPosition` qui peut être undefined si performSave est invoqué avant create()/loadSave() (ex. tests sans create()). Runtime : "Cannot read properties of undefined (reading 'set')". Le save lui-même réussit, mais la position sauvegardée n'est pas mise à jour. Correction : initialiser lastSavedPosition au constructeur ou garder avec `?.`.

### Zones non couvertes / risques résiduels
- loadGame avale toujours les erreurs (retour null) ; acceptable selon spec.
- Edge case : sauvegarde corrompue → loadGame retourne un objet normalisé avec valeurs par défaut (acceptable).

### Non-régression
- Zones vérifiées : SaveService, ExplorationScene save tests.

Prochaine action : clôture T-031, BUG-T031-001 à tracer.
