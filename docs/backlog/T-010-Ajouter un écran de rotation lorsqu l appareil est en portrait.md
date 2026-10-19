---
id: T-010
title: Ajouter un écran de rotation lorsqu l'appareil est en portrait
status: done
owner: game-dev
author_of_code: game-dev
priority: P0
size: S
---

## Context
Le jeu doit être joué en mode paysage obligatoire. Nous devons détecter lorsque l'appareil est en orientation portrait et afficher un message demandant de tourner l'écran, tout en mettant en pause ou en réduisant l'affichage du jeu.

## User story
En tant que joueur, je veux voir clairement un indicateur lorsque mon téléphone est tenu en portrait afin de savoir que je dois le tourner pour jouer.

## Acceptance criteria
- [x] Un composant OrientationOverlay est créé (src/ui/OrientationOverlay.ts) qui couvre tout l'écran avec un fond semi-transparent et un message « Veuillez tourner votre appareil en paysage ».
- [x] Le composant utilise l'API de l'écran (window.orientation ou matchMedia '(orientation: portrait)') ou les événements de resize de Phaser pour détecter le changement d'orientation.
- [x] Lorsque l'orientation est portrait, l'overlay est affiché et le jeu (mise à jour de la scène ExplorationScene) est mis en pause ou ralentit fortement (ex. en définissant le temps à 0).
- [x] Lorsque l'orientation redevient paysage, l'overlay est masqué et le jeu reprend normalement.
- [x] L'overlay fonctionne aussi lors du redimensionnement de la fenêtre du navigateur sur desktop pour tester le comportement.
- [x] Le message est centré et lisible, avec une taille de police adaptée aux écrans mobiles.

## Out of scope
- Gestion des orientations spécifiques (reverse-landscape, etc.) – on considère simplement paysage vs portrait.
- Sauvegarde automatique de l'état lors de la rotation (déjà gérée par la pause du jeu).
- Animation de transition d'entrée/sortie de l'overlay.

## Technical notes
- Utiliser Phaser.Scale.Events.RESIZE pour détecter les changements de taille du canvas.
- Comparer la largeur et la hauteur du canvas : si hauteur > largeur → portrait (en supposant que le jeu est lancé en paysage attendu).
- Alternativement, utiliser l'API window.matchMedia pour être plus fiable sur mobile.
- Masquer/afficher l'overlay en définissant sa visible property ou en l'ajoutant/retirat de la scène UI.
- Mettre en pause la scène via this.scene.pause() ou définir une flag global de mise à jour.
- S'assurer que l'overlay est ajouté à une scène UI qui est toujours présente (ou à la même scène que les autres UI) et qu'elle est au-dessus de tout.

## Implementation log
- `src/ui/OrientationOverlay.ts`: nouvelle classe (non Phaser.GameObject) qui crée un Container plein écran avec un fond Graphics (0x000000 alpha 0.85) et un texte centré (24px). Détection via window.matchMedia('(orientation: portrait)') avec addEventListener('change') + Phaser scale 'resize' event. Affiche l'overlay et met en pause la scène (this.scene.scene.pause()) en portrait ; masque et reprend (this.scene.scene.resume()) en paysage. Depth 9999 pour rester au-dessus de tout.
- `src/game/scenes/ExplorationScene.ts`:
  - Import de OrientationOverlay.
  - Champ `orientationOverlay` instancié en fin de create() (depth implicite via l'overlay lui-même).
  - Garde `if (this.orientationOverlay.isOverlayVisible()) return;` en début de update() pour arrêter toute logique de jeu (mouvement, interaction, profondeur) quand l'overlay est affiché.
- Tous les 6 critères d'acceptation couverts.
- Gap DoD: pas de suite de tests (`tests/` vide); pas de test unitaire sur OrientationOverlay. Build/typecheck non encore exécuté (attend autorisation utilisateur pour Bash).