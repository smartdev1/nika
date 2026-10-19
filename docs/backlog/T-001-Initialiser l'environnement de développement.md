---
id: T-001
title: Initialiser l'environnement de développement
status: todo
owner: game-dev
author_of_code: 
priority: P0
size: S
---

## Context
Mettre en place l'environnement de développement de base pour commencer à travailler sur le jeu « Les Échos de la Fracture ». Cela inclut l'installation des dépendances, la configuration du projet Vite/Phaser/TypeScript et la vérification que tout fonctionne correctement avant de commencer l'implémentation des fonctionnalités.

## User story
En tant que développeur, je veux avoir un environnement de développement fonctionnel afin de pouvoir commencer à implémenter les fonctionnalités du jeu sans perdre de temps à configurer des outils.

## Acceptance criteria
- [ ] Le projet peut être cloné/dézippé et installé avec `npm install`
- [ ] Le serveur de développement démarre avec `npm run dev` sans erreurs
- [ ] Un canevas vide de Phaser apparaît dans le navigateur à l'adresse locale
- [ ] La configuration TypeScript est correcte (pas d'erreurs de type dans l'éditeur)
- [ ] Le plugin PWA est correctement installé et configuré
- [ ] Les fichiers de base (index.html, main.ts, game.config.ts) sont présents et fonctionnels

## Out of scope
- L'implémentation de quelconques fonctionnalités de jeu (départ, héroïne, interactions, etc.)
- La création de ressources graphiques ou audio
- La mise en place de systèmes de jeu complexes (combat, dialogue, sauvegarde)
- L'optimisation pour la production ou le déploiement

## Technical notes
- Utiliser le template `vanilla-ts` de Vite comme point de départ
- Installer phaser et vite-plugin-pwa comme dépendances
- Configurer vite.config.ts pour le plugin PWA selon les spécifications de gameplay.md
- S'assurer que tsconfig.json est en mode strict
- Vérifier que le dossier public/ contient les sous-dossiers icons/ et assets/ avec images/ et audio/

## Implementation log
(filled by the implementer)

## Review
(filled by tech-lead-po)

## QA report
(filled by the QA agent)