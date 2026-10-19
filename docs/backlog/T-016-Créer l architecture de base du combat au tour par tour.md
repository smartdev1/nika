---
id: T-016
title: Créer l'architecture de base du combat au tour par tour (gestion des tours, équipes, actions simples)
status: done
owner: game-dev
author_of_code: game-dev
priority: P1
size: M
---

## Context
Après validation du déplacement, des interactions et de la sauvegarde, nous devons mettre en place le système de combat au tour par tour qui permettra à l'héroïne et à ses alliés d'affronter des ennemis de manière stratégique.

## User story
En tant que joueur, je veux participer à des combats au tour par tour clairs et prévisibles afin de planifier mes actions et de progresser dans l'histoire.

## Acceptance criteria
- [x] Un module CombatEngine est créé (src/systems/combat/CombatEngine.ts) qui gère le état du combat : liste des participants (héroïne, alliés, ennemis), points d'initiative, tour courant.
- [x] Chaque participant possède des attributs de base : PV max, PV actuel, attaque, défense, vitesse (pour déterminer l'initiative).
- [x] Au démarrage du combat, l'initiative est calculée (vitesse + dé aléatoire) et les participants sont triés pour déterminer l'ordre des tours.
- [x] Le moteur expose une fonction startCombat(participants: Combatant[]) qui initialise l'état et passe au premier tour.
- [x] À chaque tour, le système indique quel personnage doit agir (via un événement 'turn-change' et getCurrentActor()).
- [x] Une action de base « Attaque » est disponible : lorsqu'elle est sélectionnée, elle inflige des dégâts calculés comme max(0, attaquant.attaque - cible.défense) à la cible.
- [x] Lorsqu'un participant meurt (PV <= 0), il est retiré de la liste des actifs et ne peut plus agir.
- [x] Le combat se termine lorsque tous les membres d'un côté sont morts ; un événement de victoire ou de défaite est émis.
- [x] Le moteur est indépendant de la représentation visuelle : il ne dépend pas de Phaser directement, mais peut être utilisé par un système de présentation.

## Out of scope
- Animations de combat, effets spéciaux, compétences multiples.
- Gestion de l'inventaire, équipement, objets consommables pendant le combat.
- Interface utilisateur détaillée (écrans de combat, menus).
- Gestion des états de statut (empoisonnement, défense augmentée, etc.).

## Technical notes
- Définir une interface Combatant dans src/types/index.ts avec les propriétés nécessaires.
- Utiliser une simple classe pour représenter un ennemi ou un héros pendant le combat (peut répliquer les données du personnage du monde).
- Le CombatEngine ne modifie pas directement les objets du monde ; il travaille sur des copies ou des références que le système de présentation synchronise avant/après le combat.
- Pour déterminer l'initiative : initiative = vitesse + Math.floor(Math.random() * variability) ; variability fixé à 5.
- Le moteur avance au tour suivant lorsqu'une action est complétée ; le système de présentation gère l'input et appelle engine.endTurn().
- Les événements sont émis via un EventEmitter interne pour découpler.
- Les tests unitaires devraient vérifier l'ordre des tours, le calcul des dégâts et les conditions de fin.

## Implementation log
- `src/types/index.ts`: ajout de l'interface `Combatant` (id, name, side, maxHp, hp, attack, defense, speed, isAlive) et du type `CombatResult` ('victory' | 'defeat' | null).
- `src/systems/combat/CombatEngine.ts` (nouveau): classe CombatEngine sans dépendance Phaser.
  - Gère les participants, l'initiative (speed + Math.floor(Math.random() * 5), tri décroissant), le tour courant, et l'état actif/inactif.
  - `startCombat(options)`: initialise l'état, calcule l'initiative, passe au premier tour, émet 'turn-change'.
  - `getCurrentActor()`: retourne le combattant dont c'est le tour, ou null.
  - `endTurn()`: avance au prochain participant vivant (contourne les vaincus), vérifie les conditions de fin.
  - `attack(attackerId, targetId)`: dégâts = max(0, attaque - défense), applique à la cible, marque vaincu si PV <= 0, émet 'attack', avance au tour suivant. Vérifie que l'attaquant est bien le current actor.
  - `applyDamage(targetId, damage)`: dégâts directs (ex. environnement).
  - `heal(targetId, amount)`: soin plafonné à maxHp.
  - `checkEndConditions()`: si tous les joueurs morts → 'defeat'; si tous les ennemis morts → 'victory'; émet 'combat-end'.
  - `endCombat()`: termine la session manuellement.
  - EventEmitter interne pour découpler de la présentation (écouteurs: 'turn-change', 'attack', 'combat-end').
- Tous les 7 critères d'acceptation couverts.
- `tests/systems/combat/CombatEngine.test.ts` (nouveau): suite vitest couvrant l'initiative (écart de vitesse garanti), la progression des tours (endTurn, contournement des vaincus, wraparound), le calcul des dégâts (max(0, atk-def), dégâts 0, mise à mort), les conditions de fin (victoire/défaite, combat continu), applyDamage/heal, endCombat. Nécessite `vitest` comme dépendance de dev pour s'exécuter.
- Gap DoD restant: build/typecheck non exécuté (déclinée par l'utilisateur).

## Review
À valider par tech-lead-po.

## QA report
À valider par game-qa (agent n'ayant pas écrit le code).