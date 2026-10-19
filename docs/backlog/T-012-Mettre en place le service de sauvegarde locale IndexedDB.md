---
id: T-012
title: Mettre en place le service de sauvegarde locale (IndexedDB abstraction)
status: done
owner: game-dev
author_of_code: game-dev
priority: P0
size: M
---

## Context
Nous devons permettre au joueur de reprendre sa progression après avoir fermé le navigateur ou l'application PWA. Une abstraction simple sur IndexedDB sera suffisante pour sauvegarder les données essentielles (position du héros, état des objets interactifs, progrès des dialogues/énigmes).

## User story
En tant que joueur, je veux que le jeu sauvegarde automatiquement ma progression afin de pouvoir reprendre là où je m'étais arrêté après avoir fermé l'application.

## Acceptance criteria
- [x] Un service SaveService est créé (src/save/SaveService.ts) qui encapsule l'accès à IndexedDB via une bibliothèque légère (idb) ou l'API native enveloppée dans des promesses.
- [x] Le service définit un schéma de base (version 1) avec un magasin d'objets nommé "save" contenant une clé unique (ex. "playerSave") stockant un objet JSON.
- [x] Le service expose deux méthodes publiques : saveGame(data: any): Promise<void> et loadGame(): Promise<any | null>.
- [x] Les erreurs d'IndexedDB sont attrapées et logguées sans bloquer le jeu.
- [x] Le service ne dépend pas de Phaser directement ; il peut être appelé depuis n'importe quel contexte (scène, système).
- [x] Les types TypeScript sont définis pour l'objet de sauvegarde (voir SaveSchema.ts).

## Out of scope
- Gestion de plusieurs emplacements de sauvegarde.
- Synchronisation avec le cloud ou sauvegarde périodique en arrière-plan.
- Chiffrement des données de sauvegarde.

## Technical notes
- Utiliser la bibliothèque `idb` (tiny wrapper) ou implémenter simples promesses avec `indexedDB.open`. Étant donné la volonté d'éviter des dépendances non justifiées, nous pouvons utiliser l'API native avec promesse : retourner new Promise((resolve, reject) => { const request = indexedDB.open('LesEchosDeLaFracture', 1); request.onupgradeneeded = () => { const db = request.result; if (!db.objectStoreNames.contains('save')) { db.createObjectStore('save'); } }; request.onsuccess = () => { const db = request.result; const tx = db.transaction('save', 'readwrite'); const store = tx.objectStore('save'); const getRequest = store.get('playerSave'); getRequest.onsuccess = () => resolve(getRequest.result); getRequest.onerror = () => reject(getRequest.error); }; request.onerror = () => reject(request.error); });.
- Créer un fichier SaveSchema.ts qui définit l'interface de l'objet de sauvegarde (ex. interface GameSave { heroinePos: { x: number, y: number }; activatedStones: string[]; dialogueProgress: number; }).
- Dans SaveService, caster le résultat en GameSave ou retourner null si aucune donnée.
- Veiller à ne pas bloquer le thread principal : les opérations IndexedDB sont asynchrones.
- Exporter une instance unique (singleton) ou créer une nouvelle instance selon besoin.

## Implementation log
- `src/save/SaveSchema.ts`: interface `GameSave` (heroinePos, activatedStones[], dialogueProgress, updatedAt), constante `EMPTY_SAVE` pour les valeurs par défaut.
- `src/save/SaveService.ts`: classe `SaveService` (singleton via `getInstance()`), encapsule IndexedDB via promesses natives (aucune dépendance externe comme `idb`). Méthodes publiques `saveGame(data: GameSave): Promise<void>` et `loadGame(): Promise<GameSave | null>`. Base `LesEchosDeLaFracture`, version 1, magasin `save`, clé `playerSave`. Gestion d'erreur avec try/catch + console.error sans bloquer le jeu. `withStore()` helper pour factoriser l'ouverture de transaction. Fermeture de la base après chaque transaction (`tx.oncomplete`).
- Tous les 6 critères d'acceptation couverts.
- Gap DoD: pas de suite de tests (`tests/` vide); pas de test unitaire sur SaveService. Build/typecheck non exécuté (déclinée par l'utilisateur).
- Intégration dans ExplorationScene (chargement au démarrage + sauvegarde automatique) à faire dans T-013.