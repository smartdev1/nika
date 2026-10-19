---
id: T-013
title: Implémenter la sauvegarde automatique et le chargement au démarrage
status: done
owner: game-dev
author_of_code: game-dev
priority: P0
size: S
---

## Context
Nous voulons que la sauvegarde se fasse sans intervention du joueur, aux moments clés (après une interaction, après un déplacement significatif) ou périodiquement, et que le jeu charge la sauvegarde la plus récente au démarrage si elle existe.

## User story
En tant que joueur, je veux que le jeu mémorise automatiquement où j'en suis afin de ne pas perdre ma progression lorsque je ferme l'onglet ou l'application.

## Acceptance criteria
- [x] Au lancement du jeu (dans BootScene ou PreloadScene avant de démarre ExplorationScene), le SaveService.loadGame() est appelé.
- [x] Si une sauvegarde est retournée, les données sont utilisées pour restaurer l'état du jeu : position de l'héroïne, état des objets interactifs (ex. pierre ancienne marquée comme activée), éventuellement avancement du dialogue.
- [x] Si aucune sauvegarde n'existe, le jeu démarre avec un état par défaut (nouvelle partie).
- [x] Après chaque interaction réussie (ex. activation de la pierre ancienne) ou après un déplacement dépassant un seuil (ex. 100 pixels), le jeu appelle SaveService.saveGame() avec l'état actuel.
- [x] Une sauvegarde périodique toutes les 30 secondes est ajoutée comme mesure de secours.
- [x] Les opérations de sauvegarde ne bloquent pas le rendu ; elles sont effectuées en arrière-plan via des promesses.
- [x] En cas d'erreur de sauvegarde, un message discret est loggué dans la console mais le jeu continue.

## Out of scope
- Afficher un écran de sauvegarde/chargement avec des progrès.
- Gestion des conflits de sauvegarde (multiple onglets).
- Possibilité pour le joueur de charger une sauvegarde antérieure (undo).

## Technical notes
- Créer un objet plain GameSave qui sera rempli avant l'appel à saveGame : inclure { x: heroine.x, y: heroine.y }, un tableau des identifiants des objets interactifs activés (ex. ['stone_ancient']), et éventuellement un indice de dialogue.
- Dans InteractionSystem, lorsqu'une interaction est déclenchée et réussie, mettre à jour l'état de l'objet (marquer comme activé) puis appeler le SaveService.
- Pour éviter de sauvegarder trop souvent, on peut utiliser un délai (ex. sauvegarder au plus tard toutes les 5 secondes) en utilisant un timer qui se réarme après chaque sauvegarde.
- Au chargement, si les données existent, positionner l'héroïne aux coordonnées sauvegardées et appliquer les états aux objets interactifs (par exemple, changer leur texture ou désactiver leur capacité d'interaction).
- S'assurer que le SaveService est importé uniquement là où nécessaire pour éviter les dépendances circulaires.
- Utiliser try/catch autour des appels async/await ou .then/.catch.

## Implementation log
- `src/game/scenes/ExplorationScene.ts`:
  - Import de `SaveService` (singleton) et du type `GameSave`.
  - Nouveaux champs privés : `saveService`, `activatedObjectIds: string[]`, `needsSave`, `lastSaveTime`, `SAVE_INTERVAL_MS = 5000`, `lastSavedPosition`, `POSITION_SAVE_THRESHOLD = 100`.
  - `create()`: charge la sauvegarde au démarrage via `loadSave()` (asynchrone, non bloquant); initialise `lastSavedPosition`; ajoute un timer Phaser de sauvegarde périodique toutes les 30s.
  - `loadSave()`: appelle `saveService.loadGame()`; restaure `player.x/y`, `activatedObjectIds`; sinon état par défaut (nouvelle partie).
  - `scheduleSave()`: marque `needsSave = true` (déclenché après interaction ou déplacement > 100px).
  - `performSave()`: construit le `GameSave` (position, pierres activées, progression dialogue=0, timestamp) et appelle `saveService.saveGame()` via promesse; try/catch avec log discret en cas d'échec.
  - `triggerInteraction()`: marque l'objet interactif comme activé dans `activatedObjectIds` puis `scheduleSave()`.
  - `update()`: vérifie le seuil de déplacement (100px) et déclenche `scheduleSave()`; exécute `performSave()` si `needsSave` et que 5s se sont écoulées depuis la dernière sauvegarde (throttle).
- Déviation par rapport au critère 1 : le chargement se fait dans `ExplorationScene.create()` plutôt que dans une `BootScene`/`PreloadScene` (ces scènes n'existent pas encore; le menu lance directement l'exploration).
- Tous les 7 critères d'acceptation couverts.
- Gap DoD: pas de suite de tests (`tests/` vide); pas de test unitaire sur la sauvegarde. Build/typecheck non exécuté (déclinée par l'utilisateur).