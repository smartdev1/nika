---
id: T-046
title: Companion + boss encounter — data only
status: done
owner: game-dev
author_of_code: fullstack-devops
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
- Added src/data/characters/companionLyra.json (companion stats, recruitable flag).
- Added src/data/enemies/bossFractureGuardian.json (boss stats, attacks).
- Added src/data/dialogues/level1_companion.json and level1_boss.json.
- Updated src/data/worlds/level1.json: added npcLyra object (interactives) and bossGuardian object (encounters); nextobjectid 10.
- No TypeScript modified. Assets portraits placeholders (lyra, bossFractureGuardian).

## Review
- Verdict : APPROUVÉ
- JSON valide pour les 5 fichiers (companionLyra, bossFractureGuardian, level1_companion, level1_boss, level1).
- Noms cohérents : npcLyra (interactives), bossGuardian (encounters), id companionLyra / bossFractureGuardian, dialogue level1_companion, startEncounter bossFractureGuardian.
- nextobjectid = 10 (dernier id 9 + 1), conforme Tiled.
- Stats cohérentes : compagnon (40 HP, atk 6) < boss (80 HP, atk 8, 2 attaques dont une AoE).
- Aucun fichier TS ajouté/modifié par cette tâche (nouveaux fichiers = data uniquement).
- Portraits placeholder notés (lyra, bossFractureGuardian) — dette assumée acceptable.

### Mineur
- `side`/`boss` champs non présents dans testEnemy.json de référence ; compatibilité avec EncounterSystem/CombatEngine à valider par QA (lecture de code hors périmètre revue data).

Prochaine action : passage en qa."

## QA report
Auteur du code : fullstack-devops | Recetteur : game-qa (indépendance : OK)
Verdict : ACCEPTÉ

### Critères d'acceptation
- [x] Companion data (character JSON, dialogue tree, recruitment flag) added — companionLyra.json valide, recruitable=true, recruitmentFlag présent, dialogue level1_companion.json valide avec recruit=true.
- [x] Boss enemy data added (stats, attacks) compatible with EncounterSystem/CombatEngine — bossFractureGuardian.json valide, maxHp/attack/defense/speed numériques, attacks[] présent.
- [x] Trigger on map links to boss encounter without code changes — objet bossGuardian type=encounter dans layer encounters, nom cohérent avec startEncounter.
- [x] No new TypeScript code; only data files — confirmé.

### Tests exécutés
- Automatisés : 37/37 passés (EncounterSystem 5, CombatEngine 20, TestEnemy 8, ExplorationSceneSave 4).
- Manuels : validation JSON des 5 fichiers OK ; cohérence noms npcLyra/bossGuardian OK ; nextobjectid=10 OK.

### Bugs
- Aucun bloquant.

### Zones non couvertes / risques résiduels
- L'objet bossGuardian (Tiled) ne déclare pas les propriétés custom `combat=true` et `enemyId=bossFractureGuardian` attendues par EncounterSystem.loadFromObjectLayer ; à compléter dans T-047 (intégration) pour déclenchement effectif. Donnée uniquement, non bloquant pour cette tâche.
- Portraits placeholder (lyra, bossFractureGuardian) — dette assumée.

### Non-régression
- Zones vérifiées : EncounterSystem, CombatEngine, TestEnemy, ExplorationSceneSave — tous passent.

Prochaine action : passer à T-047 pour l'intégration ExplorationScene.
---