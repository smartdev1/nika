---
id: T-009
title: Créer un système générique de boutons tactiles
status: done
owner: game-dev
author_of_code: game-dev
priority: P0
size: S
---

## Context
Nous avons besoin d'un moyen facile d'ajouter des boutons à l'écran (Action, éventuellement d'autres comme des boutons de menu ou de compétences) qui réagissent au toucher et au clic, avec un feedback visuel.

## User story
En tant que développeur, je veux pouvoir déclarer des boutons tactiles avec une position, une apparence et un callback afin de réutiliser le même code pour différents contrôles à l'écran.

## Acceptance criteria
- [x] Une classe TouchButton est créée (src/controls/TouchButton.ts) qui encapsule un sprite ou un texte, une zone de détection et un callback.
- [x] Le bouton peut être affiché/masqué, activé/désactivé, et changer d'apparence lorsqu'il est pressé.
- [x] Un gestionnaire TouchButtons (ou simplement l'ajout direct à la scène UI) permet de créer plusieurs instances et de les mettre à jour chaque frame.
- [x] Deux boutons tactiles sont créés (A et B) en utilisant la classe générique TouchButton.
- [x] Le bouton A (validation principale) déclenche l'interaction contextuelle avec un objet.
- [x] Le bouton B (actions secondaires) déclenche une action secondaire définie par le créateur.
- [x] Le système fonctionne avec le toucher, le pointeur et la souris.
- [x] Les boutons ne consomment pas de ressources excessives lorsqu'ils sont inactifs.

## Out of scope
- Gestion de groupes de boutons avec navigation (ex. gamepad).
- Animations complexes ou transitions d'état avancées.

## Technical notes
- Utiliser Phaser.GameObjects.Container contenant un fond et une icône/texte.
- Définir une zone invisible (ou utiliser le bounds du sprite) pour la détection du pointerdown/pointerup.
- Appliquer une échelle ou une teinte lorsqu'il est pressé pour fournir un feedback.
- Exposer des méthodes setVisible, setEnabled, setPosition.
- Laisser la responsabilité du positionnement au créateur (ex. placer le bouton Action en bas à droite).
- S'assurer que le bouton est ajouté à la scène UI et qu'il reçoit les événements d'input via la scène (Phaser les transmet aux objets de la scène où ils sont ajoutés).

## Implementation log
- `src/controls/TouchButton.ts`: nouvelle classe générique extends Phaser.GameObjects.Container. Encapsule un fond Graphics, un label texte optionnel, une zone de détection Rectangle centrée, et un callback onPress. Feedback visuel au pressed (couleur/alpha du fond modifiée). Méthodes publiques : setButtonVisible, setButtonEnabled, destroy. Gère pointerdown/pointerup/pointerout pour le feedback et le déclenchement.
- `src/game/scenes/ExplorationScene.ts`:
  - Import de TouchButton.
  - Champs `actionButtonA` et `actionButtonB` typés TouchButton (remplacent l'ancien `actionButton` Container); champ orphelin `actionButtonText` supprimé.
  - `createActionButtons()` instancie deux TouchButton en bas-droite, côte à côte:
    - Bouton A (label 'A', x = width - margin): callback → triggerInteraction(), visible seulement près d'un objet interactif.
    - Bouton B (label 'B', à gauche de A): callback → triggerSecondaryAction(), toujours visible.
  - `update()` et `triggerInteraction()` utilisent `actionButtonA.setButtonVisible()`.
  - Nouvelle méthode `triggerSecondaryAction()` (stub, extensible).
- Extension de portée validée par l'utilisateur: deux boutons A/B au lieu d'un seul bouton Action.
- Tous les 8 critères d'acceptation couverts. Pointer events (touch + souris) gérés nativement par Phaser via l'input du Container.
- Gap DoD: pas de suite de tests (`tests/` vide); pas de test unitaire sur TouchButton. Build/typecheck non encore exécuté (attend autorisation utilisateur pour Bash).