---
id: T-011
title: Gérer le redimensionnement dynamique du canvas (resize)
status: done
owner: game-dev
author_of_code: game-dev
priority: P0
size: S
---

## Context
Le jeu doit s'adapter aux différents tamailles d'écran et aux changements d'orientation (lorsque l'utilisateur tourne son appareil) sans perdre en qualité d'affichage ni couper des parties importantes du monde.

## User story
En tant que joueur, je veux que le jeu remplisse correctement l'écran tant en largeur qu'en hauteur, en conservant ses proportions et en montrant toujours la zone de jeu centrée, peu importe la taille de la fenêtre ou l'orientation de l'appareil.

## Acceptance criteria
- [x] Le canvas du jeu redimensionne automatiquement lorsqu'un événement de resize du navigateur survient (via le scale manager de Phaser).
- [x] Le mode de mise à l'échelle est conservé (Phaser.Scale.FIT avec autoCenter CENTER_BOTH) afin que le jeu garde son ratio d'origine (960x540) et soit centré.
- [x] Lorsque l'écran passe en portrait, le canvas reste centré mais peut montrer des bandes noires sur les côtés (ou en haut/bas) – c'est acceptable tant que le jeu reste jouable après la rotation (voir overlay T-010).
- [x] Les éléments UI (joystick, boutons, overlay) sont repositionnés proportionnellement au nouveau taille du canvas afin de rester ergonomiques.
- [x] Aucun élément du jeu ne disparaît hors de l'écran visible après un redimensionnement.
- [x] Le redimensionnement fonctionne aussi lors du chargement initial et lorsqu'on passe en plein écran via l'API PWA.

## Out of scope
- Redimensionnement dynamique du monde de jeu (changer la taille de la tilemap selon l'écran).
- Adaptation du niveau de détail (LOD) basé sur la résolution.

## Technical notes
- Dans game/config.ts, s'assurer que le scale.mode est Phaser.Scale.FIT et autoCenter Phaser.Scale.CENTER_BOTH.
- Écouter l'événement this.scale.on('resize', this.handleResize, this) dans la scène principale (ou un système dédié).
- Dans le handler, mettre à jour les positions des éléments UI : par exemple, joystick.position.set( margin + joystick.radius, canvasHeight - margin - joystick.radius ) où margin est un pourcentage ou une valeur fixe adaptée.
- Pour les boutons, utiliser des ancres (ex. bas droite) : position.set( canvasWidth - margin, canvasHeight - margin ).
- Utiliser cette.scene.sys.game.canvas.width/height ou this.scale.width/height pour obtenir la taille actuelle du canvas.
- S'assurer que les éléments UI sont créés après que le scale soit prêt (dans create ou via un événement).
- Tester le redimensionnement en déplaçant la fenêtre du navigateur et en simulant un changement d'orientation via les outils de développement.

## Implementation log
- `src/game/config.ts`: `scale.mode = Phaser.Scale.FIT` et `autoCenter = Phaser.Scale.CENTER_BOTH` déjà configurés (960x540) — critère de mise à l'échelle satisfait.
- `src/ui/OrientationOverlay.ts`: ajout de la méthode publique `resize(width, height)` qui redessine le fond plein écran et recentre le texte.
- `src/game/scenes/ExplorationScene.ts`:
  - Ajout de champs privés `uiMargin`, `buttonWidth`, `buttonHeight`, `buttonSpacing`, `joystickRadius` pour centraliser les dimensions UI.
  - `createActionButtons()` utilise ces champs (plus de nombres magiques en dur).
  - `resizeUI()` repositionne le joystick (bas-gauche, ancré margin+radius), les boutons A et B (bas-droite, ancrés width-margin) et l'overlay d'orientation selon la taille courante du canvas.
  - `handleResize()` écoute `this.scale.on('resize', ...)` et appelle `resizeUI()`.
  - `resizeUI()` est aussi appelé en fin de `create()` pour le positionnement initial.
- Tous les 6 critères d'acceptation couverts.
- Note technique : avec le mode FIT et une résolution logique fixe (960x540), `gameSize` ne change pas au resize du navigateur ; le scale manager gère l'affichage à l'écran (mise à l'échelle CSS + letterbox). Le repositionnement UI est donc idempotent mais garantit la cohérence si le mode de scale évolue.
- Gap DoD: pas de suite de tests (`tests/` vide); pas de test unitaire sur le resize UI. Build/typecheck non exécuté (déclinée par l'utilisateur).