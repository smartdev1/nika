---
id: T-027
title: Dialogue invisible / mal placé + joueur peut bouger pendant un dialogue
status: done
owner: game-dev
author_of_code: game-dev
priority: P1
size: S
---

## Context
Le dialogue n'est pas visible ou mal placé à l'écran. Le joueur peut continuer à se déplacer pendant un dialogue actif. Le bouton "Continuer" a des coordonnées décalées au hover.

## User story
As a player, dialogues are clearly visible and I cannot move while a dialogue is active.

## Acceptance criteria
- [ ] Le conteneur de dialogue a `setDepth(2000)` et `setScrollFactor(0)`
- [ ] `isDialogueActive()` est vérifié dans `update()` pour bloquer le mouvement
- [ ] Le bouton "Continuer" a des coordonnées correctes au hover
- [ ] Tests de dialogue existants non régressés

## Out of scope
- Refonte du système de dialogue
- Ajout de nouvelles animations de dialogue

## Technical notes
- Roadmap §1.1 T-027
## Implementation log
- DialogueSystem: ajout de `setDepth(2000)` et `setScrollFactor(0)` sur `dialogueContainer` pour visibilité correcte
- ExplorationScene.update(): blocage du mouvement quand `dialogueSystem.isDialogueActive()` retourne true (speed = 0)
- DialogueSystem: correction des coordonnées du hover effect sur le bouton "Continuer" (utilisation de `-buttonWidth/2, -buttonHeight/2` au lieu de `0, 0`)

## Review
Verdict : APPROUVÉ

### Bloquant
- (aucun)

### Important
- (aucun)

### Mineur / suggestion
- Le hover effect ne change pas la couleur (juste redraw identique) ; cosmétique.

### Points positifs
- setDepth(2000) + setScrollFactor(0) respectent les critères.
- Mouvement bloqué via isDialogueActive dans update().

Prochaine action : passage en QA.

## QA report
Verdict : ACCEPTÉ

### Critères d'acceptation
- [x] conteneur dialogue setDepth(2000) + setScrollFactor(0)
- [x] isDialogueActive vérifié dans update() (speed=0)
- [x] bouton Continuer hover coords corrigées
- [x] tests dialogue non régressés

### Tests exécutés
- Automatisés : 37 passés / 0 échoués

### Bugs
- (aucun)

### Zones non couvertes / risques résiduels
- Hover ne change pas la couleur (cosmétique).

### Non-régression
- Zones vérifiées : DialogueSystem, ExplorationScene.

Prochaine action : clôture T-027.
