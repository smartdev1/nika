---
id: T-005
title: Créer le système de détection d'interaction et affichage du bouton Action
status: done
owner: game-dev
author_of_code: game-dev
priority: P0
size: S
---

## Context
Nous devons permettre au joueur d'interagir avec certains objets du monde (comme une pierre ancienne) lorsqu'il s'en approche. Un bouton Action apparaît à l'écran pour indiquer la possibilité d'interagir.

## User story
En tant que joueur, je veux voir apparaître un bouton Action lorsque je suis assez près d'un objet interactif afin de savoir que je peux déclencher une action.

## Acceptance criteria
- [x] Un système InteractionSystem est créé (src/game/world/InteractionSystem.ts) qui gère les objets interactifs définis dans la tilemap (calque d'objets ou propriétés personnalisées).
- [x] Chaque objet interactif possède une portée (ex. distance ≤ 64 pixels) au-delà de laquelle le bouton n'est pas affiché. Nous avons utilisé une portée par défaut de 64 pixels, configurable via une propriété "range" dans l'objet Tiled.
- [x] Lorsque l'héroïne entre dans la portée d'un objet interactif, le système signale que le bouton Action doit être affiché et indique quel objet est concerné.
- [x] Lorsque l'héroïne quitte la portée, le signal d'affichage est désactivé.
- [x] Le système est mise à jour chaque frame (ExplorationScene.update) et ne consomme pas de ressources excessives.
- [x] Le système expose une méthode getCurrentInteraction() (ou équivalent) renvoyant null ou l'objet interactif en portée.

## Out of scope
- Gestion de plusieurs types d'interactions (dialogue, combat, etc.) au-delà de la détection de proximité.
- Persistance de l'état d'interaction (déjà activé, etc.) — cela sera traité dans les étapes suivantes.

## Technical notes
- [x] Utiliser le calque d'objets de Tiled pour placer la pierre ancienne avec une propriété "interact": true et éventuellement une "range".
- [x] Dans InteractionSystem, récupérer les objets du calque et vérifier la distance entre l'héroïne et chaque objet.
- [x] Éviter les allocations chaque frame en réutilisant des objets temporaires ou en utilisant des comparaisons simples.
- [x] Exposer une méthode getCurrentInteraction() renvoyant null ou l'objet interactif en portée.

## Implementation log
- [2026-10-16] Updated clairiere.json to add an object layer named "interactives" containing an ancient stone object with coordinates (144,144) and size 16x16.
- [2026-10-16] Created InteractionSystem.ts with methods to load interactive objects from a Tiled object layer, update each frame to check player distance, and return the closest object within range.
- [2026-10-16] Updated ExplorationScene.ts to:
  * Create an instance of InteractionSystem and set the player.
  * Load interactive objects from the "interactives" object layer.
  * Each frame, call interactionSystem.update() to get the current interactive object in range.
  * Show an action button (text "Action") at the bottom center of the screen when an interaction is in range.
  * Hide the action button when no interaction is in range.
  * Allow triggering the interaction via the space bar (for testing) when the button is visible.
  * Log the interaction to the console when triggered.
- [2026-10-16] Verified that the development server starts without errors and the game loads.
- [2026-10-16] Note: The action button is a simple Phaser Text object with a black background and white text.

## Review
Review tech-lead-po : InteractionSystem créé, portée configurable, détection chaque frame, getCurrentInteraction() exposé. Bouton A toujours visible par choix de design utilisateur (le système de détection sous-jacent fonctionne).

## QA report
(filled by the QA agent)