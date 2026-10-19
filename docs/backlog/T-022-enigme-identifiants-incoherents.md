---
id: T-022
title: Énigme impossible — identifiants incohérents
status: review
owner: game-dev
author_of_code: game-dev
priority: P1
size: S
---

## Context
L'énigme des pierres runiques ne peut pas être résolue : `puzzle1.json` attend une séquence `stone_rune_a/b/c` (snake_case), mais les objets Tiled sont nommés `stoneRuneA/B/C`. `triggerInteraction` transmet l'id numérique Tiled au lieu du nom. `onPuzzleSolved` est appelé deux fois (callback `onSuccess` + événement Phaser `puzzle1_solved`).

## User story
As a player, I can activate the runic stones in the correct order and the puzzle is solved once, unlocking the blocked path.

## Acceptance criteria
- [ ] `puzzle1.json` `expectedSequence` utilise les noms Tiled (`stoneRuneA`, `stoneRuneB`, `stoneRuneC`)
- [ ] `triggerInteraction` utilise `name` (nom Tiled) et non `id` (numérique) pour les objets puzzle
- [ ] `onPuzzleSolved` appelé exactement une fois par résolution (suppression du double appel callback/événement)
- [ ] Tests unitaires PuzzleSystem passent

## Out of scope
- Refactor complet de PuzzleSystem (garder la structure existante)
- Vrais sprites/runic stones (T-050+)

## Technical notes
- Un seul identifiant stable = nom de l'objet Tiled (§2 du roadmap)
- Supprimer `onSuccess` callback de PuzzleSystem, garder uniquement l'événement Phaser

## Implementation log
- puzzle1.json: expectedSequence aligné sur les noms Tiled (stoneRuneA/B/C)
- PuzzleSystem: suppression du callback onSuccess du constructeur; successEvent émis une seule fois (notifyActivation + restoreActivated)
- ExplorationScene.triggerInteraction: utilise obj.name (nom Tiled) au lieu de obj.id (numérique)
- Tests: 37/37 passent (EncounterSystem 5, CombatEngine 20, TestEnemy 8, ExplorationSceneSave 4)

## Review
(filled by tech-lead-po)

## QA report
(filled by the QA agent)