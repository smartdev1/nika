---
id: T-023
title: Barres de PV figées dans le combat
status: review
owner: game-dev
author_of_code: game-dev
priority: P1
size: S
---

## Context
`CombatEngine.startCombat()` copie les participants (`{...p}`), mais `CombatScene` conserve des références aux objets originaux passés en `init()`. Quand le moteur modifie les PV sur ses copies, `CombatScene` lit toujours les valeurs d'origine → barres de PV qui ne bougent pas.

## User story
As a player, the HP bars reflect the current combatant HP during battle.

## Acceptance criteria
- [ ] `CombatScene.updateParticipantViews()` lit les données depuis `combatEngine.getParticipants()`
- [ ] Les PV affichés se mettent à jour après chaque attaque
- [ ] Tests CombatEngine existants non régressés

## Out of scope
- Changer la formule de dégâts
- Animations de barre PV (T-063)

## Technical notes
- Roadmap §1.1 T-023 : "La scène lit engine.getParticipants()"

## Implementation log
- CombatScene.updateParticipantViews(): lit depuis combatEngine.getParticipants() (copies vivantes du moteur) au lieu des références figées de participantViews[].combatant
- HP bar et couleur du sprite mis à jour après chaque attaque via onAttackResolved → updateParticipantViews()
- Tests CombatEngine non régressés (20 tests passent)

## Review
(filled by tech-lead-po)

## QA report
(filled by the QA agent)