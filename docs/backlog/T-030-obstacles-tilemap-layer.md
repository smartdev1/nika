---
id: T-030
title: Obstacles probablement non créés (vrai TilemapLayer)
status: review
owner: game-dev
author_of_code: game-dev
priority: P1
size: M
---

## Context
`ExplorationScene` crée un `GameObject` par tuile d'obstacle (coûteux, et `getLayer().layer?.data` peut ne pas fonctionner). Il faut utiliser un vrai `TilemapLayer` avec `createLayer` + `setCollisionByExclusion` + `physics.add.collider`.

## User story
As a player, obstacles block movement correctly and efficiently.

## Acceptance criteria
- [ ] Les obstacles sont créés via `this.map.createLayer('obstacles', tileset)` au lieu de créer des GameObject par tuile
- [ ] `setCollisionByExclusion([-1])` est appelé sur la layer d'obstacles
- [ ] `physics.add.collider(this.player, this.obstacleLayer)` est utilisé
- [ ] Les tests de collision passent (si existants) ou un test basique est ajouté
- [ ] Performance améliorée (moins de GameObjects)

## Out of scope
- Ajout de nouveaux types d'obstacles
- Modification de la carte Tiled

## Technical notes
- Roadmap §1.1 T-030
- Le tileset 'obstacles-tiles' doit être ajouté au tilemap via `this.map.addTilesetImage('obstacles', 'obstacles-tiles')`
- Le layer 'obstacles' dans clairiere.json doit avoir les bonnes propriétés
