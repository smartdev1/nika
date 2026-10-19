---
id: T-028
title: OrientationOverlay contradictoire (teste gameSize, hide() appelle scene.resume())
status: review
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
