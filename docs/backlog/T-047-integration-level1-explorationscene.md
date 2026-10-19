---
id: T-047
title: Intégrer la carte level1 dans ExplorationScene
status: done
owner: game-dev
author_of_code: fullstack-devops
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
- Imported level1.json, level1_kael.json, level1_puzzle.json statically (T-024).
- Registered level1 tilemap with TILED_JSON format and switched make.tilemap to 'level1'.
- Spawn player from 'spawn' object in interactives layer.
- Registered level1KaelDialogue and level1Puzzle caches; puzzle config switched to level1Puzzle.
- createPuzzleObjects now also matches 'blocker_rock'.
- npcKael interaction triggers level1_kael dialogue.
- Retrocompat: clairiere still imported/registered; existing tests unaffected.

## Review
Verdict : APPROUVÉ

### Bloquant
- (aucun)

### Important
- (aucun)

### Mineur / suggestion
- Le message de log d'erreur mentionne encore `clairiere.json` ("Layers not found. Check clairiere.json...") alors que la carte active est `level1`. Faible impact, mais à corriger pour la clarté des diagnostics.
- `puzzleConfig.successEvent` est lu depuis le cache `level1Puzzle` et utilisé pour l'écoute d'événement ; cohérent. OK.

### Points positifs (max 2)
- Rétrocompatibilité préservée : `clairiere.json` toujours importé et enregistré dans le cache tilemap (`clairiere`).
- Aucune nouvelle abstraction : réutilisation des loaders/interactions existants, conforme à T-024 (imports statiques).

Critères d'acceptation : 5/5 satisfaits (tilemap level1 + spawn + runes/blocker_rock + npcKael dialogue + chest1 non crashant via InteractionSystem existant). Tests 37/37 verts, pas de régression.

Prochaine action : passer le statut à `qa` et lancer la recette par game-qa (agent n'ayant pas écrit le code).

## QA report
### Avis de recette — T-047
Auteur du code : fullstack-devops   |   Recetteur : fullstack-qa   (indépendance : OK)
Verdict : ACCEPTÉ

### Critères d'acceptation
- [x] critère 1 — tilemap level1 chargé via cache TILED_JSON, layers ground/obstacles/interactives/encounters validés, spawn lu depuis 'spawn' (fallback 100,100 si absent) — `create()`.
- [x] critère 2 — stoneRuneA/B/C notifiés au PuzzleSystem via InteractionSystem; blocker_rock/blockerRock créés dans createPuzzleObjects; events.on(successEvent) → onPuzzleSolved — `triggerInteraction`/`createPuzzleObjects`.
- [x] critère 3 — npcKael déclenche level1KaelDialogue depuis le cache — `triggerInteraction` branche `npcKael`.
- [x] critère 4 — chest1 traité par le flux générique (marquage activé + scheduleSave), sans branche spécifique, pas de crash — `triggerInteraction`.
- [x] critère 5 — non-régression : clairiere.json toujours importé et enregistré dans le cache tilemap (`clairiere`).

### Tests exécutés
- Automatisés : 37 passés / 0 échoués (4 fichiers : CombatEngine 20, TestEnemy 8, EncounterSystem 5, ExplorationSceneSave 4).
- Manuels (revue statique) : imports statiques conformes T-024; validation de layers; fallback spawn; dialogue guardé par `if (lines)`.

### Bugs
- (aucun bloquant)
- Note mineure (S4) : message d'erreur des layers mentionne encore `clairiere.json` alors que la carte active est `level1` (déjà signalé en revue).
- Risque résiduel : `puzzleConfig` non gardé contre `undefined` (events.on(undefined) planterait si le cache `level1Puzzle` était absent). Non exercé dans le dataset actuel; à durcir si les données évoluent.

### Zones non couvertes / risques résiduels
- Pas de test dédié à l'intégration level1 (pas de test unitaire de la scène complète); dépendance aux tests existants d'ExplorationSceneSave.
- Edge cases vérifiés par lecture : spawn manquant → fallback; couche manquante → return avec erreur; dialogue introuvable → no-op; puzzle config invalide → non gardé (risque).

### Non-régression
- Zones vérifiées : imports/enregistrement clairiere; tests 37/37 verts; aucune modification des systèmes combat/encounter/dialogue.

Prochaine action : aucune action requise; livraison proposée au Product Owner.
