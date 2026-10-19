---
id: T-006
title: Implémenter le bouton Action tactile et son déclenchement
status: todo
owner: game-dev
author_of_code: 
priority: P0
size: S
---

## Context
Nous avons besoin d'un bouton à l'écran que le joueur peut toucher (ou cliquer) pour déclencher l'interaction avec l'objet actuellement en portée. Ce bouton doit être adapté aux écrans tactiles et visibles en mode paysage.

## User story
En tant que joueur, je veux pouvoir toucher le bouton Action lorsqu'il apparaît afin d'interagir avec l'objet proche (pierre ancienne) et voir le résultat de l'interaction.

## Acceptance criteria
- [ ] Un composant UI ActionButton est créé (src/ui/ActionButton.ts ou dans src/controls/TouchButtons.ts) qui affiche un bouton semi-transparent avec une icône ou un texte "Action".
- [ ] Le bouton est affiché/masqué en fonction du signal provenant de InteractionSystem (via un événement ou une propriété observable).
- [ ] Lorsque le bouton est pressé (pointerdown), il déclenche une callback qui notifie le jeu qu'une interaction doit être exécutée.
- [ ] Le bouton est placé de manière cohérente (ex. en bas à droite de l'écran) et ne gêne pas la vue du personnage.
- [ ] Le bouton réagit au toucher et au clic de souris pour faciliter les tests sur desktop.

## Out of scope
- Gestion de plusieurs boutons contextuels (ex. différents selon le type d'interaction).
- Animations avancées ou effets de particules au clic.

## Technical notes
- Utiliser Phaser.GameObjects.Container ou un simple Sprite/Text pour le bouton.
- Gérer l'input via this.input.on('pointerdown', callback, hitArea) ou utiliser un Phaser.GameObjects.Zone comme hit area.
- Faire remonter l'événement via un événement personnalisé (ex. this.events.emit('action-triggered', interactionObject)) ou un système de messagerie simple.
- S'assurer que le bouton est ajouté à la scène UI (ou à une scène dédiée au UI) qui reste au-dessus de la scène de jeu.