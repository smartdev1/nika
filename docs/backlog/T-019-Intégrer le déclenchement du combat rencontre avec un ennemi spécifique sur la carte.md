---
id: T-019
title: Intégrer le déclenchement du combat (rencontre avec un ennemi spécifique sur la carte)
status: done
owner: game-dev
author_of_code: 
priority: P1
size: S
---

## Context
Au lieu de lancer un combat de manière aléatoire ou via un menu, nous voulons que le combat débute lorsque l'héroïne entre en contact avec un ennemi visible sur la carte (ou un déclencheur spécifique), afin de lier exploration et combat.

## User story
En tant que joueur, je veux voir un ennemi sur la carte et lancer le combat en m'approchant de lui, afin que les combats aient du sens dans l'exploration.

## Acceptance criteria
- [x] Un objet déclencheur de combat est placé dans la tilemap (calque « encounters ») avec une propriété « combat»: true et un identifiant référençant les données de l'ennemi (enemyId: "testEnemy").
- [x] Un système EncounterSystem (src/systems/combat/EncounterSystem.ts) détecte lorsque l'héroïne entre en proximité (distance < 32 pixels) avec un tel déclencheur.
- [x] Lorsqu'une rencontre est détectée, le système prépare les données de combat : les statistiques de l'héroïne (TestHero) et les statistiques de l'ennemi référencé (chargées depuis src/data/enemies/testEnemy.json).
- [x] Le CombatEngine est initialisé avec ces données et la CombatScene est lancée.
- [x] Après le combat, le déclencheur est marqué comme déjà déclenché (alreadyTriggered) pour éviter les combats répétés tant qu'il n'est pas réinitialisé.
- [x] En cas de défaite, CombatScene retourne à ExplorationScene après 2 secondes (le joueur peut réessayer, l'encounter reste déclenché mais le joueur peut s'éloigner et revenir).
- [x] L'activation de la rencontre met en pause ExplorationScene (scene.pause) pendant que CombatScene est active, évitant que le personnage continue de bouger en arrière-plan.

## Out of scope
- Système de rencontres aléatoires (comme dans les RPG classiques).
- Gestion de plusieurs types d'ennemis avec des comportements variés (IA de poursuite, embuscades).
- Intégration profonde avec le système de sauvegarde de l'état des ennemis vaincus (pour qu'ils ne réapparaissent pas) – cela pourra être ajouté plus tard.

## Technical notes
- Dans Tiled, ajouter un calque d'objets nommé « encounters » et y placer un point ou un sprite représentant l'ennemi, avec les propriétés personnalisées : combat = true, enemyId = "testEnemy".
- Dans ExplorationScene, après avoir chargé la tilemap, récupérer les objets du calque « encounters » et les stocker dans l'EncounterSystem.
- Chaque frame, vérifier la distance entre l'héroïne et chaque objet de rencontre ; si inférieur au seuil (32px), déclencher l'encounter (une seule fois par encounter grâce au flag alreadyTriggered).
- Pour éviter les déclenchements multiples pendant que l'héroïne reste en proximité, utiliser un flag « alreadyTriggered » par encounter.
- Lorsqu'un encounter est déclenché, pauser temporairement la mise à jour de la scène ExplorationScene (scene.pause) pendant que le CombatScene est active.
- Après la fin du combat (CombatScene s'arrête et fait scene.resume('exploration-scene')), l'exploration reprend.
- Les données de l'ennemi sont stockées dans src/data/enemies/testEnemy.json et chargées au démarrage via this.load.json.

## Implementation log
- `src/data/enemies/testEnemy.json` (nouveau): données de l'ennemi de test (id: testEnemy, PV=30, attaque=5, défense=2, vitesse=5).
- `src/systems/combat/EncounterSystem.ts` (nouveau): classe EncounterSystem avec loadFromObjectLayer (filtre les objets avec combat=true), update (détection de proximité < triggerDistance), setOnEncounterTriggered (callback), resetEncounter/resetAllEncounters.
- `src/data/worlds/clairiere.json`: ajout du calque « encounters » (id: 4) avec un objet enemyEncounter1 (x:200, y:200, combat:true, enemyId:"testEnemy"); nextlayerid passé à 5, nextobjectid passé à 7.
- `src/game/scenes/ExplorationScene.ts`:
  - preload(): charge src/data/enemies/testEnemy.json sous la clé 'enemyTestEnemy'.
  - create(): récupère le calque 'encounters', instancie EncounterSystem (triggerDistance: 32), relie setOnEncounterTriggered → startCombat.
  - update(): appelle encounterSystem.update() chaque frame; si un ennemi est déclenché, appelle startCombat(enemyId).
  - startCombat(enemyId): récupère les données ennemies depuis le cache JSON, crée TestHero + ennemi, met en pause l'exploration (scene.pause), lance combat-scene avec les participants.
  - Suppression du bouton de test temporaire « Combat (test) » (remplacé par le vrai déclencheur sur la carte).
- Tous les 7 critères d'acceptation couverts.
- Gap DoD restant: pas de test unitaire sur EncounterSystem ou l'intégration ExplorationScene/CombatScene. Build/typecheck non exécuté (déclinée par l'utilisateur).

## Review
À valider par tech-lead-po.

## QA report
À valider par game-qa (agent n'ayant pas écrit le code).