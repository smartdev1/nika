---
id: T-028
title: OrientationOverlay contradictoire (teste gameSize, hide() appelle scene.resume())
status: done
owner: game-dev
author_of_code: game-dev
priority: P1
size: S
---

## Context
`OrientationOverlay` teste `gameSize` (toujours 960×540 en mode FIT) au lieu de `window.innerWidth/innerHeight`, donc il ne détecte jamais le mode portrait. `hide()` appelle `scene.resume()` même si la scène n'a pas été mise en pause par l'overlay (ex: pendant un combat). Le listener `matchMedia` n'est pas retiré au `destroy`.

## User story
As a player, the orientation overlay appears correctly in portrait mode and doesn't interfere with combat.

## Acceptance criteria
- [ ] Détection via `window.innerWidth/innerHeight` (ratio < 1 = portrait)
- [ ] `hide()` ne reprend que la scène qu'on a soi-même mise en pause (flag `pausedByOverlay`)
- [ ] Le listener `matchMedia` est retiré au `destroy`
- [ ] Tests OrientationOverlay existants non régressés

## Out of scope
- Changement du design de l'overlay
- Support du mode portrait (le jeu reste paysage)

## Technical notes
- Roadmap §1.1 T-028
- L'overlay doit tracker quelle scène il a mise en pause pour ne la reprendre que si nécessaire

## Review
Verdict : APPROUVÉ

### Bloquant
- (aucun)

### Important
- (aucun)

### Mineur / suggestion
- createUI utilise gameSize pour les dimensions initiales ; compensé par computeIsPortrait() sur window. Acceptable.

### Points positifs
- pausedByOverlay flag correctement géré dans show()/hide().
- Listener matchMedia retiré au destroy().

Prochaine action : passage en QA.

## QA report
Verdict : ACCEPTÉ

### Critères d'acceptation
- [x] détection via window.innerWidth/innerHeight
- [x] hide() ne reprend que la scène mise en pause (pausedByOverlay)
- [x] listener matchMedia retiré au destroy
- [x] tests non régressés

### Tests exécutés
- Automatisés : 37 passés / 0 échoués

### Bugs
- (aucun)

### Zones non couvertes / risques résiduels
- createUI utilise gameSize pour dimensions initiales ; compensé par computeIsPortrait.

### Non-régression
- Zones vérifiées : OrientationOverlay.

Prochaine action : clôture T-028.
