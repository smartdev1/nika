---
id: T-031
title: SaveService avale les erreurs et résout avant le commit
status: review
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
