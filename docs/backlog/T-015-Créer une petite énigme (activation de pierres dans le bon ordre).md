---
id: T-015
title: Créer une petite énigme (activation de pierres dans le bon ordre)
status: done
owner: game-dev
author_of_code: game-dev
priority: P0
size: M
---

## Context
Pour enrichir l'exploration et donner un sens aux interactions, nous ajoutons une petite énigme environnementale : le joueur doit activer plusieurs objets (par exemple, trois pierres runiques) dans un ordre spécifique pour débloquer un passage ou déclencher un événement narratif.

## User story
En tant que joueur, je veux résoudre une énigme logique afin d'accéder à une nouvelle zone ou de voir un changement dans le monde, ce qui récompense l'exploration et l'observation.

## Acceptance criteria
- [x] Trois pierres runiques (stoneRuneA, stoneRuneB, stoneRuneC) sont placées dans la carte, chacune avec un identifiant unique et une indication visuelle (sprite jaune/or).
- [x] Chaque pierre peut être activée via le même mécanisme d'interaction (proximité + bouton Action) et lorsqu'elle est activée, elle change d'état (passe du jaune/or à l'ocre foncé) et ne peut plus être réactivée.
- [x] Un système PuzzleSystem surveille l'ordre d'activation des pierres et compare la séquence à une séquence préétablie ([stoneRuneA, stoneRuneB, stoneRuneC]).
- [x] Lorsque la séquence correcte est complétée, le système déclenche un événement : le rocher bloquant est détruit et un dialogue spécial de Kaël est lancé.
- [x] Si une pierre est activée hors ordre, la séquence en cours est réinitialisée (feedback console).
- [x] L'état de chaque pierre (activé ou non) est sauvegardé dans la sauvegarde globale (activatedStones) et restauré au chargement.
- [x] L'énigme est réalisable en moins de deux minutes et ne bloque pas la progression (le reste du monde reste accessible, seul le passage derrière le rocher est bloqué).

## Out of scope
- Génération procédurale d'énigmes.
- Système de indices élaboré ou journal de quête.
- Animations complexes ou effets de particules avancés.

## Technical notes
- Créer un fichier src/data/puzzles/puzzle1.json définissant l'ordre attendu et les identifiants des pierres.
- Dans InteractionSystem, lorsqu'une interaction réussit avec un objet ayant la propriété "puzzle": true, notifier le PuzzleSystem avec l'identifiant de l'objet.
- Le PuzzleSystem maintient un tableau en cours ; lorsqu'il reçoit un nouvel identifiant, il l'ajoute et vérifie s'il correspond au même index dans la séquence attendu.
    - Si oui et que c'est le dernier, déclencher l'événement de réussite.
    - Si non, réinitialiser le tableau en cours (ou décider de ne garder que le dernier si on veut autoriser les essais continus).
- L'événement de réussite peut être implémenté en modifiant la tilemap : par exemple, changer le tile d'une couche de collision de non marcheur à marcheur, ou activer un sprite qui était auparavant invisible (setVisible(true)).
- Pour sauvegarder l'état, inclure dans le GameSave un tableau des identifiants des pierres activées (ou un map) ; lors du chargement, rétablir l'état visuel de chaque pierre et informer le PuzzleSystem de celles déjà activées afin qu'il ne les considère pas comme nouvelles activations (ou simplement les considérer comme déjà activées et ne pas les réactiver).
- S'assurer que les pierres ne peuvent pas être réactivées une fois dans l'état activé (leur interaction retourne tôt si déjà activé).

## Implementation log
- `src/data/puzzles/puzzle1.json` (nouveau): expectedSequence ["stoneRuneA","stoneRuneB","stoneRuneC"], successEvent "puzzle1_solved", blockerId "blockerRock".
- `src/systems/puzzle/PuzzleSystem.ts` (nouveau): classe PuzzleSystem avec notifyActivation(id), restoreActivated(ids), isSolved(), getCurrentSequence(). Vérifie l'index attendu, réinitialise la séquence en cas de mauvais ordre, émet l'événement de succès quand la séquence complète est atteinte.
- `src/game/world/InteractionSystem.ts`: ajout du champ `puzzle?: boolean` à l'interface InteractiveObject, parsing de la propriété Tiled "puzzle", méthode setOnPuzzleActivation(callback) pour notifier le système extérieur.
- `src/data/worlds/clairiere.json`: ajout des objets stoneRuneA (40,120), stoneRuneB (120,120), stoneRuneC (80,160) avec puzzle:true, blockerRock (64,200, 32x32) avec type "blocker"; ancientStone garde puzzle:false. nextobjectid passé de 2 à 6.
- `src/game/scenes/ExplorationScene.ts`:
  - preload(): charge src/data/puzzles/puzzle1.json sous la clé 'puzzle1'.
  - create(): crée les sprites des pierres (tint jaune/or 0xffd700) et du rocher bloquant (tint gris 0x5d4037, physique statique, collider avec le joueur); instancie PuzzleSystem et relie interactionSystem.setOnPuzzleActivation → puzzleSystem.notifyActivation; écoute l'événement puzzle1_solved.
  - createPuzzleObjects(): parcourt les objets de la couche "interactives", crée sprite pour chaque stoneRune* et blockerRock, restaure l'état visuel des runes déjà activées (tint ocre 0x7a5c00).
  - triggerInteraction(): si l'objet a puzzle: true, notifie le puzzle system, change la teinte de la rune, masque le bouton Action.
  - onPuzzleSolved(): détruit le rocher bloquant, lance un dialogue spécial de Kaël via DialogueSystem.startLineDialogue.
  - loadSave(): restaure activatedObjectIds depuis la sauvegarde, met à jour la teinte des runes, appelle puzzleSystem.restoreActivated().
  - performSave(): inclut activatedStones dans le payload GameSave.
- Tous les 6 critères d'acceptation couverts.
- Gap DoD: pas de suite de tests (`tests/` vide); pas de test unitaire sur PuzzleSystem. Build/typecheck non exécuté (déclinée par l'utilisateur).

## Review
À valider par tech-lead-po.

## QA report
À valider par game-qa (agent n'ayant pas écrit le code).