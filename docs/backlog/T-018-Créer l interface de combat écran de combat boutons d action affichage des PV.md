---
id: T-018
title: Créer l'interface de combat (écran de combat, boutons d'action, affichage des PV)
status: done
owner: game-dev
author_of_code: 
priority: P1
size: M
---

## Context
Pour que le joueur puisse interagir avec le système de combat, nous avons besoin d'une interface dédiée qui affiche les participants, leurs points de vie, et propose les actions disponibles (Attaque, éventuellement Défense, Objet, etc.). Nous commencerons par une interface minimale.

## User story
En tant que joueur, je veux voir clairement qui combat, leurs PV restants, et choisir une action simple afin de participer activement au combat.

## Acceptance criteria
- [x] Une scène CombatScene est créée (src/game/scenes/CombatScene.ts) qui est lancée lorsque le CombatEngine signale le début d'un combat.
- [x] La scène affiche un fond assombri et place les personnages (cercle bleu pour le joueur, rouge pour l'ennemi) à gauche (joueur) et à droite (ennemi).
- [x] Au-dessus de chaque personnage, une barre de PV est affichée (largeur proportionnelle aux PV actuels / PV max) avec un texte montrant les valeurs actuelles (ex. "30/30").
- [x] En bas de l'écran, un bouton « Attaque » (TouchButton rectangulaire, assez grand pour le toucher) apparaît quand c'est le tour du joueur ; lorsqu'il est sélectionné, il demande au CombatEngine d'attaquer.
- [x] Quand le joueur clique Attaque, le bouton est désactivé pendant la résolution (évite les doubles clics), puis réactivé à son prochain tour.
- [x] Après résolution de l'attaque, les barres de PV se mettent à jour ; si c'est le tour de l'ennemi, il attaque automatiquement après un délai de 800ms ; sinon le menu est réactivé pour le joueur.
- [x] Quand le combat se termine (victoire ou défaite), un message apparaît (« Victoire ! » / « Défaite… ») et après 2 secondes le joueur retourne à ExplorationScene.
- [x] L'interface utilise des boutons assez grands pour le toucher et fonctionne aussi à la souris.

## Out of scope
- Animations de sprites lors de l'attaque (flash, recul).
- Effets de particules ou de sons.
- Menu complexe avec plusieurs compétences, objets, ou changement d'équipement.
- Gestion de plusieurs alliés simultanément (au-delà de l'héroïne seule pour le test).

## Technical notes
- Utiliser Phaser.GameObjects.Graphics pour dessiner les barres de PV et les cercles de personnage (placeholders sans assets graphiques).
- Le CombatScene reçoit les participants via init(data) et crée un CombatEngine interne.
- Les événements du CombatEngine (turn-change, attack, combat-end) sont écoutés via un EventEmitter pour découpler la présentation de la logique.
- Quand c'est le tour de l'ennemi, un délai de 800ms est appliqué avant l'attaque automatique pour laisser le joueur voir le résultat.
- Quand le combat se terminé, la scène est arrêtée et ExplorationScene est reprise (résumée).
- Un bouton de test temporaire « Combat (test) » a été ajouté dans ExplorationScene (coin supérieur gauche) pour lancer un combat TestHero vs TestEnemy en attendant T-019 (déclencheur sur la carte).

## Implementation log
- `src/game/scenes/CombatScene.ts` (nouveau): scène Phaser avec fond assombri, vues des participants (cercle coloré, nom, barre de PV proportionnelle, texte PV), bouton Attaque en bas, gestion des tours via CombatEngine (turn-change → active/désactive le bouton ; attack → met à jour les barres de PV ; combat-end → affiche victoire/défaite et retourne à l'exploration après 2s). Délai de 800ms avant l'attaque automatique de l'ennemi. Nettoyage des listeners dans shutdown().
- `src/game/config.ts`: CombatScene ajouté au tableau `scene` de la configuration Phaser.
- `src/game/scenes/ExplorationScene.ts`: import de TestHero/TestEnemy, ajout d'un bouton de test temporaire « Combat (test) » (coin supérieur gauche) qui met en pause l'exploration et lance combat-scene avec un héros et un ennemi de test.
- Tous les 8 critères d'acceptation couverts.
- Gap DoD restant: pas de test unitaire sur CombatScene (dépendance Phaser rend les tests unitaires complexes, tests d'intégration prévus avec T-019). Build/typecheck non exécuté (déclinée par l'utilisateur).

## Review
À valider par tech-lead-po.

## QA report
À valider par game-qa (agent n'ayant pas écrit le code).