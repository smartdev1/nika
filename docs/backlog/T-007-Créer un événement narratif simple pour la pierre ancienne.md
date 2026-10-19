---
id: T-007
title: Créer un événement narratif simple pour la pierre ancienne
status: done
owner: game-dev
author_of_code: game-dev
priority: P0
size: M
---

## Context
Après avoir implémenté le système de détection d'interaction et le bouton Action, nous devons maintenant créer un événement narratif qui se déclenche lorsque le joueur interagit avec la pierre ancienne. Cela donnera du sens à l'interaction et commencera à construire l'histoire du jeu.

## User story
En tant que joueur, je veux déclencher un événement narratif lorsque j'interagis avec la pierre ancienne afin de découvrir l'histoire du monde et de sentir que mes actions ont un impact sur le récit.

## Acceptance criteria
- [x] Un système de dialogue est créé (src/systems/dialogue/DialogueSystem.ts) qui gère l'affichage de textes narratifs avec options de choix
- [x] Le système de dialogue supporte l'affichage de texte, le nom du locuteur, et les choix de réponse
- [x] Lorsque l'interaction avec la pierre ancienne est déclenchée, un dialogue narratif spécifique est affiché
- [x] Le dialogue présente au moins un choix qui influence la suite de la conversation (même si toutes les voies mènent à la même conclusion pour ce premier événement)
- [x] Le dialogue se termine correctement et retourne le joueur à l'exploration normale
- [x] Le système est intégré à ExplorationScene.ts de manière propre
- [ ] Le dialogue utilise des fichiers de données externes plutôt que du code en dur (pour les futures extensions)

## Out of scope
- Système de dialogue complexe avec portraits, expressions faciales, ou animations
- Persistance des choix de dialogue (cela viendra avec le système de sauvegarde)
- Intégration avec un système de quête plus large

## Technical notes
- [x] Utiliser le calque d'objets de Tiled pour placer la pierre ancienne avec une propriété "interact": true
- [x] Dans DialogueSystem, gérer l'affichage du texte, les choix de réponse, et la navigation entre les nœuds
- [x] Intégrer le déclenchement du dialogue dans ExplorationScene.triggerInteraction() basé sur le nom de l'objet interactif
- [x] Éviter les allocations excessives pendant l'affichage du dialogue
- [x] Préparer l'architecture pour charger les dialogues depuis des fichiers JSON (à implémenter dans une future tâche)

## Implementation log
- [2026-10-16] Created DialogueSystem.ts with support for text display, speaker names, and choice-based navigation
- [2026-10-16] Created ancient stone dialogue with branching choices that lead to different narrative paths
- [2026-10-16] Updated ExplorationScene.ts to initialize DialogueSystem and start the ancient stone dialogue when interacted with
- [2026-10-16] Verified that the dialogue system works correctly with the interaction system
- [2026-10-16] Added proper show/hide logic for dialogue UI elements
- [2026-10-16] Confirmed clean integration of dialogue system with interaction and action button systems
- [ ] Next step: Extract dialogue data to external JSON files for easier localization and modification

## Review
Review tech-lead-po : DialogueSystem créé, déclenché sur pierre ancienne, choix présents, retour à l'exploration fonctionnel. Le chargement depuis JSON externe pour ancientStone est partiel (kaelDialogue en JSON, ancientStone en dur) — critère non bloquant, à améliorer plus tard.

## QA report
(filled by the QA agent)