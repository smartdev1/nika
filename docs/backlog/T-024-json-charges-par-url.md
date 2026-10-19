---
id: T-024
title: JSON de jeu chargés par URL (404 après build)
status: review
owner: game-dev
author_of_code: game-dev
priority: P1
size: S
---

## Context
`ExplorationScene.preload()` charge `clairiere.json`, `kael.json`, `puzzle1.json`, `testEnemy.json` via des chemins `src/data/...`. Après `vite build`, ces fichiers ne sont pas copiés dans `dist/` et les requêtes renvoient 404.

## User story
As a player, the game loads correctly in production build (no missing data files).

## Acceptance criteria
- [ ] Les fichiers JSON sont importés via Vite (`import ... from '...json'`) et ajoutés au cache Phaser
- [ ] `this.load.tilemapTiledJSON` / `this.load.json` avec chemins `src/data/` supprimés de `preload()`
- [ ] Build Vite réussit sans erreur de fichier manquant
- [ ] Les données sont accessibles via `this.cache.json.get()` comme avant

## Out of scope
- Déplacer les JSON dans `public/` (approche import préférée)
- Chargement asynchrone des cartes

## Technical notes
- Roadmap §1.1 T-024 : `import x from '...json'` + `this.cache.json.add`

## Implementation log
- Imports JSON statiques Vite (clairiereMap, kaelDialogue, puzzle1Config, testEnemyData) avec resolveJsonModule activé dans tsconfig.json
- this.cache.tilemap.add / this.cache.json.add dans create() pour rendre les données accessibles via this.cache.json.get()
- Suppression des appels this.load.tilemapTiledJSON / this.load.json avec chemins src/data/ de preload()
- Tests unitaires inchangés (les tests de scène ne chargent pas ces JSON via l'URL)

## Review
(filled by tech-lead-po)

## QA report
(filled by the QA agent)