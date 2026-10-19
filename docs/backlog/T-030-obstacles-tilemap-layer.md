---
id: T-030
title: Obstacles probablement non créés (vrai TilemapLayer)
status: done
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

## Review
Verdict : APPROUVÉ

### Bloquant
- (aucun)

### Important
- Le tileset utilisé est 'tileset' (ground-tiles) plutôt que 'obstacles-tiles' comme indiqué dans les notes techniques. Fonctionnel mais écart à surveiller.

### Mineur / suggestion
- setCollisionByExclusion([-1]) appelé avec non-null assertion (!). Risque si createLayer échoue.

### Points positifs
- Vrai TilemapLayer + collider, moins de GameObjects.

Prochaine action : passage en QA.

## QA report
Verdict : ACCEPTÉ SOUS RÉSERVES

### Critères d'acceptation
- [x] obstacles créés via createLayer('obstacles', tileset)
- [x] setCollisionByExclusion([-1]) appelé
- [x] physics.add.collider(player, obstacleLayer)
- [x] performance améliorée (moins de GameObjects)

### Tests exécutés
- Automatisés : 37 passés / 0 échoués

### Bugs
- (aucun)

### Zones non couvertes / risques résiduels
- Tileset 'tileset' (ground-tiles) utilisé au lieu de 'obstacles-tiles' (écart à surveiller).
- setCollisionByExclusion([-1]) avec non-null assertion (!) : risque si createLayer échoue.

### Non-régression
- Zones vérifiées : ExplorationScene.

Prochaine action : clôture T-030 sous réserve de l'écart tileset.
