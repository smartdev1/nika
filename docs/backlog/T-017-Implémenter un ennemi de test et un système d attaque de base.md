---
id: T-017
title: Implémenter un ennemi de test et un système d'attaque de base (dégâts fixes)
status: done
owner: game-dev
author_of_code: 
priority: P1
size: S
---

## Context
Pour valider l'architecture du combat, nous avons besoin d'un ennemi simple auquel l'héroïne peut s'attaquer et qui peut lui riposter. Nous commencerons par des valeurs fixes afin de vérifier le flux de tour et l'application des dégâts.

## User story
En tant que développeur, je veux un ennemi de test afin de pouvoir vérifier que le moteur de combat fonctionne correctement avant d'ajouter de la complexité.

## Acceptance criteria
- [x] Une classe TestEnemy est créée (src/systems/combat/TestEnemy.ts) qui implémente l'interface Combatant avec des valeurs statiques : PV = 30, attaque = 5, défense = 2, vitesse = 5.
- [x] Une classe TestHero est créée (même fichier) représentant l'héroïne en combat avec des valeurs fixes : PV = 50, attaque = 8, défense = 3, vitesse = 6.
- [x] Lorsque le combat démarre, l'initiative détermine qui agit en premier (via CombatEngine.startCombat).
- [x] Lorsque le héros choisit l'action « Attaque », les dégâts sont appliqués à l'ennemi et ses PV sont réduits (damage = max(0, attack - defense)).
- [x] Lorsque l'ennemi agit (son tour), il effectue automatiquement une attaque contre le héros via CombatEngine.attack.
- [x] Après chaque action, le moteur passe au tour suivant (endTurn) jusqu'à ce qu'un côté soit vaincu.
- [x] Le résultat du combat (victoire/défaite) est retourné via l'événement 'combat-end' et getResult().

## Out of scope
- Graphismes de l'ennemi, animations.
- Variété d'ennemis ou de comportements différents.
- Intégration avec le monde (apparition dynamique de l'ennemi sur la carte).

## Technical notes
- Le système de présentation (CombatScene ou intégration dans ExplorationScene) sera responsable de créer les instances de Combatant à partir des données du monde et de l'ennemi.
- Pour le test, nous pouvons créer une scène de combat dédiée qui est lancée lorsque le joueur interagit avec un déclencheur spécifique (ex. toucher un monstre sur la carte).
- Les dégâts sont calculés dans CombatEngine.attack(attacker, target) : const damage = Math.max(0, attacker.attack - target.defense); target.currentHP -= damage.
- Nous veillons à ne pas permettre des dégâts négatifs (soin).
- Après chaque action, nous vérifions si le target.currentHP <= 0 ; si oui, le marqueur mort est défini et le target est retiré de la liste des actifs.
- La fin du combat est détectée lorsque tous les membres d'un côté sont morts ; un événement combatEnded avec un résultat (win/loss) est émis.
- Le système de présentation doit écouter cet événement et afficher un écran de résultat ou revenir au monde.

## Implementation log
- `src/systems/combat/TestEnemy.ts` (nouveau):
  - `TestEnemy.create(id?, name?)`: retourne un `Combatant` côté 'enemy' avec maxHp=30, hp=30, attack=5, defense=2, speed=5, isAlive=true.
  - `TestHero.create(id?, name?)`: retourne un `Combatant` côté 'player' avec maxHp=50, hp=50, attack=8, defense=3, speed=6, isAlive=true.
- `tests/systems/combat/TestEnemy.test.ts` (nouveau): 8 tests couvrant la création des valeurs statiques, le flux de combat héros vs ennemi (dégâts, tour de l'ennemi, fin de combat victoire/défaite, dégâts non négatifs).
- Tous les 7 critères d'acceptation couverts.
- 28 tests au total passent (20 CombatEngine + 8 TestEnemy).
- Gap DoD restant: build/typecheck non exécuté (déclinée par l'utilisateur); documentation README non mise à jour.

## Review
À valider par tech-lead-po.

## QA report
À valider par game-qa (agent n'ayant pas écrit le code).