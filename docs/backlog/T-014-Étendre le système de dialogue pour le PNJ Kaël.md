---
id: T-014
title: Étendre le système de dialogue pour le PNJ Kaël
status: done
owner: game-dev
author_of_code: game-dev
priority: P0
size: M
---

## Context
Nous avons déjà une boîte de dialogue simple qui affiche du texte temporaire. Pour rendre l'histoire plus vivante, nous voulons introduire un personnage non-joueur (PNJ) nommé Kaël qui peut parler au joueur, afficher son nom et éventuellement un portrait, et permettre un échange de plusieurs lignes.

## User story
En tant que joueur, je veux discuter avec Kaël afin d'en apprendre plus sur le monde et recevoir des indices pour la petite énigme.

## Acceptance criteria
- [x] Le composant DialogueSystem est étendu pour accepter un objet de ligne de dialogue contenant au moins : texte, speaker (string) et éventuellement portrait (clé ou URL).
- [x] Lorsque le dialogue avec Kaël est déclenché (après avoir activé la pierre ancienne), une série de lignes définies dans src/data/dialogues/kael.json est affichée séquentiellement.
- [x] Chaque ligne apparaît dans la boîte de dialogue, le nom du speaker est affiché au-dessus du texte, et un portrait placeholder (cercle coloré) est montré pour chaque ligne.
- [x] Le joueur peut passer à la ligne suivante en appuyant sur le bouton « Continuer » de la boîte de dialogue.
- [x] Après la dernière ligne, la boîte de dialogue se referme et le jeu reprend normalement.
- [x] Le dialogue ne bloque pas les autres systèmes (le joueur ne peut pas se déplacer pendant l'affichage car update() retourne tôt quand le dialogue est actif).
- [x] Les données du dialogue sont séparées du code (JSON dans src/data/dialogues/kael.json).

## Out of scope
- Système de choix à branches complexe.
- Voix off ou animations faciales.
- Gestion de l'état de conversation persistante (au-delà de la sauvegarde générale).

## Technical notes
- Créer un fichier src/data/dialogues/kael.json contenant un tableau d'objets : { speaker: "Kaël", text: "Première ligne…", portrait: "portrait_kael.png" }.
- Modifier DialogueBox.showText pour accepter également un objet de ligne et gérer l'affichage du speaker et du portrait (en utilisant un Image ou un Sprite provenant de l'assets).
- Introduire un état de dialogue actif dans ExplorationScene (ou un système DialogueSystem) qui garde l'index de la ligne actuelle et attend l'input du joueur pour avancer.
- Lorsque l'input est détecté (pointerdown sur la scène ou sur un bouton Continuer), afficher la ligne suivante ou fermer la boîte si fin.
- S'assurer que les ressources (images de portrait) sont préchargées dans PreloadScene.
- Utiliser un timer optionnel pour empêcher le avance trop rapide si besoin, mais laisser le joueur contrôler le rythme.

## Implementation log
- `src/data/dialogues/kael.json` (nouveau): tableau de 4 lignes avec speaker "Kaël", text et portrait "kael".
- `src/systems/dialogue/DialogueSystem.ts`:
  - Nouvelle interface `DialogueLine` (speaker, text, portrait?).
  - Nouveau mode linéaire (`dialogueMode = 'line'`) avec `currentLines: DialogueLine[]`, `currentLineIndex`, `onDialogueComplete`.
  - `startLineDialogue(lines, onComplete?)`: démarre un dialogue linéaire depuis un tableau de lignes.
  - `startDialogue('kael')`: charge les lignes depuis `this.scene.cache.json.get('kaelDialogue')` et démarre le mode linéaire.
  - `continueDialogue()`: en mode linéaire, avance à la ligne suivante ou termine le dialogue.
  - `updateDialogueDisplay()`: en mode linéaire, affiche speaker, texte et portrait (cercle dessiné via Graphics).
  - `drawPortrait(portraitKey?)`: dessine un cercle avec frame or si texture trouvée, cercle gris si pas de clé, cercle rouge si texture manquante.
  - `endDialogue()`: appelle `onDialogueComplete` si défini, émet l'événement 'dialogue-end', réinitialise l'état.
- `src/game/scenes/ExplorationScene.ts`:
  - `preload()`: charge `src/data/dialogues/kael.json` sous la clé 'kaelDialogue'.
  - `triggerInteraction()`: pour 'ancientStone', démarre le dialogue ancient stone, puis à sa fin (via l'événement 'dialogue-end' en one-time), démarre le dialogue Kaël depuis le JSON.
- Déviation: le portrait n'est pas une image chargée (pas de fichier portrait_kael.png), un cercle de remplacement est dessiné à la place — acceptable pour le MVP.
- Gap DoD: pas de suite de tests (`tests/` vide); pas de test unitaire sur DialogueSystem. Build/typecheck non exécuté (déclinée par l'utilisateur).