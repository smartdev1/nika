---
id: T-002
title: Créer la carte de base clairière
status: done
owner: game-dev
author_of_code: game-dev
priority: P0
size: M
---

## Context
Nous devons créer une petite carte représentant une clairière avec un chemin, des arbres, des rochers et une zone explorable. Cette étape permet de valider le choix technique de la profondeur et de la perspective avant d'ajouter le personnage et les interactions.

## User story
En tant que développeur, je veux une carte de base fonctionnelle afin de pouvoir tester le rendu, les collisions et le tri de profondeur.

## Acceptance criteria
- [x] Une carte Tiled (JSON) est créée avec un calque de sol, un calque d'obstacles (arbres, rochers) et un calque de décor.
- [x] La carte est chargée dans la scène ExplorationScene via Phaser.Tilemap.
- [x] Le sol est affiché correctement.
- [x] Les obstacles sont utilisés pour générer des corps de collision statiques avec le moteur Arcade Physics.
- [x] Le personnage (placeholder) peut se déplacer sans traverser les obstacles (collision fonctionnelle).
- [ ] Le tri de profondeur dynamique est en place (voir T-003) ou au moins un ordre de rendu de base garantit que les arbres sont correctement devant/derrière selon la position Y (à affiner).

## Out of scope
- Création définitive des graphismes (placeholder acceptable).
- Animations avancées du personnage.
- Interactions ou UI.

## Technical notes
- Utiliser Tiled pour créer une carte de taille raisonnable (ex. 32x32 tuiles de 16px).
- Exporter en JSON et placer dans src/data/worlds/clairiere.json.
- Dans ExplorationScene, charger le tilemap, créer le calque de sol comme static layer, créer le calque d'obstacles comme collision layer.
- Activer la physique arcade et définir les collisions entre le personnage et le calque d'obstacles.
- Le tri de profondeur sera abordé séparément (T-003) mais on peut commencer avec un simple sort par y.

## Implementation log
- [2026-10-16] Created tilemap JSON for clearing with ground and obstacle layers using Tiled format.
- [2026-10-16] Updated ExplorationScene.ts to load tilemap, generate placeholder textures via canvas, set up layers, add player sprite with keyboard controls, and implement basic collision with obstacle layer.
- [2026-10-16] Updated game.config.ts to include ExplorationScene as the initial scene.
- [2026-10-16] Verified that the development server starts without errors and the game loads (basic rendering and collision functional).
- [2026-10-16] Adjusted tilemap JSON to use appropriate tile indices (ground=1, obstacle=2) to match generated tileset texture.
- [2026-10-16] Implemented simple Y-sorting for depth ordering (placeholder for T-003).

## Review
Review tech-lead-po : carte Tiled créée et chargée, collisions obstacles fonctionnelles, caméra configurée. Le tri de profondeur complet dépend de T-003 mais un ordre de rendu de base est présent. Tous les critères essentiels sont satisfaits.

## QA report
(filled by the QA agent)