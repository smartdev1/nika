---
id: T-008
title: Implémenter le joystick virtuel pour le déplacement (8 directions)
status: done
owner: game-dev
author_of_code: game-dev
priority: P0
size: M
---

## Context
Nous devons remplacer les contrôles clavier initialement utilisés pour tester par un joystick virtuel adapté aux écrans tactiles, permettant à l'héroïne de se déplacer dans les 8 directions (haut, bas, gauche, droite et diagonales).

## User story
En tant que joueur sur mobile, je veux déplacer l'héroïne en faisant glisser mon pouce sur un joystick à l'écran afin de jouer confortablement en mode paysage.

## Acceptance criteria
- [x] Un composant VirtualJoystick est créé (src/controls/VirtualJoystick.ts) qui affiche un fond statique et une poignée mobile.
- [x] Le joystick répond au glisser-du doigt (pointerdown, pointermove, pointerup) et retourne un vecteur de direction normalisé (dx, dy) où chaque composante est entre -1 et 1.
- [x] Le joystick fournit 8 directions distinctes lorsque le vecteur est dans les quartiers appropriés (ou on peut simplement utiliser l'angle).
- [x] Le joystick revient à sa position centrale lorsque le doigt est levé.
- [x] Le joystick est dimensionné de manière appropriée pour les écrans mobiles (ex. 100px de rayon) et placé de façon fixe (ex. bas gauche de l'écran).
- [x] Le joystick fonctionne aussi avec la souris pour les tests sur desktop.
- [x] Le déplacement de l'héroïne utilise désormais le vecteur du joystick au lieu des entrées clavier.
- [x] La vitesse de déplacement reste constante et les diagonales ne sont pas plus rapides (normalisation).

## Out of scope
- Support multi-touch avancé (plusieurs joysticks).
- Effets de particules ou de décharge au relâchement.
- Personnalisation du nombre de directions (fixe à 8).

## Technical notes
- Utiliser deux cercles : un arrière-plan fixe et une poignée qui se déplace dans la limite du rayon du arrière-plan.
- Calculer l'angle et la distance du pointer par rapport au centre, limiter la distance au rayon.
- Convertir en vecteur (dx = Math.cos(angle) * distance / radius, dy = Math.sin(angle) * distance / radius) ; si distance < deadzone, retourner (0,0).
- Exposer le vecteur via une propriété ou un événement (ex. this.on('update', callback)).
- Intégrer dans ExplorationScene : lire le vecteur chaque frame et appliquer vitesse = vecteur * speed.
- S'assurer que le joystick est ajouté à la scène UI (ou à une scène dédiée) qui reste au-dessus.

## Implementation log
- `src/controls/VirtualJoystick.ts`: `setScrollFactor(0)` added in constructor so the joystick stays fixed at bottom-left while the camera follows the player.
- `src/game/scenes/ExplorationScene.ts`:
  - Removed `this.cursors` keyboard input field and `createCursorKeys()` call.
  - `this.joystick` instantiated at bottom-left (x=120, y=height-120), radius 100px, thumb 40px, dead zone 15px; `startTracking()` called.
  - `update()` now reads `this.joystick.getInput()` and applies `velocity = normalized(vector) * speed`; keyboard checks and the old ad-hoc diagonal normalization removed.
  - Diagonal speed kept constant via explicit vector normalization.
- All 8 acceptance criteria implemented. Pointer events (pointerdown/move/up/out) cover touch and mouse.
- Gap for DoD: no test suite exists yet in the repo (`tests/` empty); no unit test for joystick input vector or scene movement. Build/test execution pending user permission (no Bash run yet).
- Review tech-lead-po: bloquant relevé — `this.joystick` n'était pas ajouté à la scène (invisible) et n'avait pas de depth élevé. Corrigé : `this.add.existing(this.joystick)` + `this.joystick.setDepth(1000)` dans `ExplorationScene.create()`.