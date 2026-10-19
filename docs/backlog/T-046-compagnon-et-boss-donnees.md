---
id: T-046
title: Companion + boss encounter — data only
status: todo
owner: game-dev
author_of_code: (rempli par l'implémenteur)
priority: P1
size: M
---

## Context
Sprint 1 content focus: introduce one companion (NPC + dialogue + recruitment) and one boss encounter as data only, reusing combat/dialogue systems. Depends on T-045 map.

## User story
As a player, I meet a companion, recruit them, and face a boss fight in the first level, so that team and combat are exercised.

## Acceptance criteria
- [ ] Companion data (character JSON, dialogue tree, recruitment flag) added
- [ ] Boss enemy data added (stats, attacks) compatible with EncounterSystem/CombatEngine
- [ ] Trigger on map (T-045) links to boss encounter without code changes
- [ ] No new TypeScript code; only data files

## Out of scope
- New abilities/combat mechanics
- Balance tuning (post-sprint)
- Mobile/PWA and QA tasks (T-032..T-044)

## Technical notes
- Reuse existing CombatEngine schema; no schema change.

## Implementation log
(filled by the implementer)

## Review
(filled by tech-lead-po)

## QA report
(filled by the QA agent)
---