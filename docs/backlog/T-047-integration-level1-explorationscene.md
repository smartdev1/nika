---
id: T-047
title: Intégrer la carte level1 dans ExplorationScene
status: todo
owner: game-dev
author_of_code: (rempli par l'implémenteur)
priority: P1
size: S
---

## Context
Brancher les données du premier niveau jouable (T-045 : level1.json, dialogues, puzzle) dans ExplorationScene via le chargement par clé existant, le spawn, les interactions et le puzzle. Livre la jouabilité end-to-end du premier niveau sans nouvelle mécanique.

## User story
As a player, I can launch the game and explore level1 end-to-end (walk, interact, solve puzzle, trigger dialogues) so that the core loop of the first level is demonstrable.

## Acceptance criteria
- [ ] Given level1.json présent dans src/data/worlds/, when ExplorationScene loads with key "level1", then the tilemap, collision layer and interaction objects are rendered and the player spawns at the spawn point.
- [ ] Given the player reaches stoneRuneA/B/C, when the Action button is pressed, then the puzzle sequence progresses and blocker_rock resolves on completion.
- [ ] Given the player reaches npcKael, when interaction triggers, then the level1_kael dialogue lines are displayed.
- [ ] Given the player reaches chest1, when interaction triggers, then the chest interaction fires without crash.
- [ ] No regression on other levels/maps currently loaded by ExplorationScene.

## Out of scope
- Modification des données level1 (déjà validées en T-045).
- Polish mobile (T-032..T-036).
- Nouvelles mécaniques de jeu.
- Assets binaires (placeholders documentés suffisent).

## Technical notes
- Références : T-045 (données level1), T-022 (convention noms Tiled), T-024 (import statique des JSON, ne pas charger par URL).
- Utiliser l'import statique de level1.json conformément à T-024.
- Conserver les noms d'objets (stoneRuneA/B/C, blocker_rock, npcKael, chest1, spawn) tels que validés en T-045.
- Aucune abstraction nouvelle : réutiliser les loaders/interactions existants.

## Implementation log
(filled by the implementer)

## Review
(filled by tech-lead-po)

## QA report
(filled by the QA agent)
