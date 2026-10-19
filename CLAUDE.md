# CLAUDE.md — Les Échos de la Fracture (Jeu d'aventure narratif)

Ce fichier est la référence de contexte pour toute session de développement sur ce projet de jeu.
Il doit être lu avant toute génération de code. Toute fonctionnalité implémentée doit rester cohérente avec ce document.

---

## 0. Posture attendue : développeur senior de jeux

Sur ce projet, adopte systématiquement la posture d'un développeur de jeux senior, pas d'un exécutant qui code littéralement ce qui est demandé. Concrètement, cela veut dire :

- **Poser une question avant de coder** si une story est ambiguë ou sous-spécifiée, plutôt que de deviner et produire quelque chose d'à moitié pertinent. Une question ciblée vaut mieux que 200 lignes à refaire.
- **Refuser la sur-ingénierie** : ne pas ajouter d'abstraction, de pattern, de dépendance ou de couche non demandée "au cas où". Voir section 1 (non-objectifs) et section 3 (stack figée).
- **Anticiper les cas limites** sans qu'on ait à les lister : sauvegarde corrompue, ressources manquantes, toucher en dehors des limites de l'écran, données de jeu incohérentes — les gérer explicitement (exception claire, log, ou retour structuré), jamais laisser planter silencieusement.
- **Justifier les choix techniques non triviaux** dans un commentaire court ou le message de commit (ex. pourquoi telle taille de sprite, pourquoi tel algorithme de tri de profondeur), pas juste livrer le code.
- **Dire quand une approche est risquée ou fragile**, même si elle a été demandée telle quelle — en particulier sur les systèmes critiques (sauvegarde, combat, navigation).
- **Ne jamais valider son propre travail par un test trop permissif** juste pour faire passer la CI. Un test doit prouver que le comportement est correct, pas juste que le code s'exécute sans erreur.
- **Écrire du code qu'un autre dev peut reprendre sans lui**, pas du code optimisé pour aller vite ce sprint-ci : noms explicites, fonctions courtes et testables isolément, pas de "magie".
- **Signaler la dette technique** plutôt que la cacher : si un raccourci est pris pour tenir le sprint (ex. système de dialogue simple, algorithme de pathfinding basique), le noter explicitement en fin de tâche.

Cette posture prime sur la vitesse d'exécution. En cas de conflit entre "livrer vite" et "livrer correctement", suivre cette section.

---

## 1. Mission du projet (à ne jamais perdre de vue)

Construire un jeu d'aventure narratif en fausse 3D (2.5D) pour navigateurs mobiles, en mode paysage, jouable en tant que PWA, avec exploration, énigmes, combats au tour par tour et progression d'équipe.

Le jeu doit être développé avec Phaser 3 et TypeScript, suivant l'architecture décrite dans gameplay.md.

---

## 2. Non-objectifs explicites (ne pas implémenter sans validation du Product Owner)
- Pas de multijoueur en temps réel.
- Pas de système de personnalisation poussée des personnages (au-delà de l'équipement de base si prévu).
- Pas de monétisation intégrée (achats in-app, publicités) sans validation explicite.
- Pas de support pour les orientations portrait (le jeu est strictement paysage, avec écran de rotation si nécessaire).
- Pas de génération procédurale de mondes au départ (les mondes sont conçus à la main).

Si une tâche demandée semble sortir de ces limites, le code doit signaler l'écart plutôt que l'implémenter silencieusement.

---

## 3. Architecture cible (vue d'ensemble, ne pas tout construire dès le sprint 1)

Voir gameplay.md section 1 et 2 pour l'architecture générale et la structure du projet.

Le principe architectural le plus important sera de séparer les règles du jeu de leur représentation visuelle. Par exemple, une quête ne doit pas dépendre directement de la position d'un sprite à l'écran. Cela facilitera les modifications, les sauvegardes et l'ajout de nouveaux mondes.

---

## 4. Stack technique

| Composant | Choix | Statut |
|---|---|---|
| Langage | TypeScript | V0.1 |
| Moteur de jeu | Phaser 3 | V0.1 |
| Build tool | Vite | V0.1 |
| PWA | vite-plugin-pwa | V0.1 |
| Gestion des données locales | IndexedDB (via une couche d'abstraction) | V0.1 |
| Cartographie | Tiled (export JSON) | V0.1 |
| Audio | Format web standard (mp3, ogg) | V0.1 |
| Styles | CSS personnalisé | V0.1 |

**Ne pas introduire de dépendance hors de cette liste sans justification explicite dans le message de commit.**

---

## 5. Règles de code

- Style : basé sur les conventions de TypeScript/Phaser, formaté avec `prettier` (à configurer).
- Typage : type hints obligatoires sur toutes les fonctions publiques et les interfaces de jeu.
- Tests : chaque système critique (sauvegarde, combat, dialogue, navigation) doit avoir des tests unitaires dédiés dans `tests/`.
- Pas de logique métier dans les scènes Phaser — déléguer à des modules `systems/`, `data/`, `entities/`.
- Config via constantes dans `src/game/config.ts` ou variables d'environnement pour les secrets (aucuns pour l'instant, mais prévoir une structure).
- Séparation des préoccupations : rendu (Phaser), logique de jeu (systems), données (data), états de jeu (save).

### Principes de conception (adaptés au jeu)

- **S — Single Responsibility** : un module = une responsabilité. `systems/combat/` gère le combat, `systems/dialogue/` gère les dialogues, `save/` gère la persistance.
- **O — Open/Closed** : les systèmes doivent être extensibles (ex. ajouter un nouveau type de compétence) sans modification du cœur, autant que possible.
- **L — Liskov** : si des abstractions sont introduites (ex. `CompetenceBase`), les implémentations concrètes doivent être substituables.
- **I — Interface Segregation** : ne pas créer une interface unique "god object" pour le personnage — séparer déplacement, combat, compétences spéciales.
- **D — Dependency Inversion** : les systèmes de haut niveau (comme la scène de jeu) ne doivent pas dépendre directement des implémentations de bas niveau (comme un système de pathfinding spécifique) — passer par des interfaces.
- **KISS** : privilégier la solution la plus simple qui satisfait le critère d'acceptation de la story en cours.
- **DRY** : mutualiser sans excès — les fonctions utilitaires (calcul de distance, helpers de tableau) doivent être placées dans un endroit commun (`src/utils/` si nécessaire).
- **YAGNI** : ne pas coder la gestion de quêtes complexes, l'arbre de compétences avancé, ou un éditeur de niveaux intégré tant qu'un seul niveau existe.

---

## 6. Sécurité — pratiques appliquées au jeu

Bien que le jeu soit principalement hors ligne (PWA), certaines pratiques s'appliquent :

- **Validation des données** : toute donnée chargée depuis IndexedDB ou depuis un fichier JSON de niveau doit être validée pour éviter la corruption ou les attaques par injection (bien que le risque soit faible en local).
- **Gestion des ressources** : limiter la taille des images et audio chargés pour éviter un dépassement de mémoire sur mobile.
- **Aucun secret** : pour l'instant, aucune clé API ou token n'est nécessaire. Si à l'avenir le jeu devait appeler un serveur (classement, sauvegarde cloud), alors les secrets seraient gérés via des variables d'environnement et jamais dans le code.
- **Gestion des erreurs** : ne jamais retourner de stack trace ou de détail d'erreur interne dans l'interface du jeu — logger côté console de développement, retourner un message générique côté joueur.
- **Performance** : surveiller l'utilisation de la mémoire et le nombre de draw calls, surtout sur les appareils mobiles bas de gamme.

---

## 7. Méthode de travail : Kanban léger adapté au jeu

- Le backlog vit dans `docs/backlog/`, un fichier Markdown par tâche : `T-001-short-title.md`.
- Colonnes (champ `status` dans le frontmatter) : `todo` → `doing` → `review` → `qa` → `done` (ou `blocked`).
- Limite de travail en cours : **2 tâches `doing` maximum** au total.
- Une tâche = une branche = une petite PR (idéalement moins de 400 lignes modifiées).

### Format d'un fichier de tâche

```markdown
---
id: T-001
title: Short title
status: todo
owner: tech-lead-po | game-dev | game-qa
author_of_code: (rempli par l'implémenteur)
priority: P0 | P1 | P2
size: S | M | L
---

## Context
Why this task exists. Business value.

## User story
As a <who>, I want <what>, so that <why>.

## Acceptance criteria
- [ ] Given / When / Then ...

## Out of scope
What we deliberately do NOT do.

## Technical notes
Constraints, links to ADRs.

## Implementation log
(filled by the implementer)

## Review
(filled by tech-lead-po)

## QA report
(filled by the QA agent)
```

---

## 8. Git (toujours avec permission)

- Branches : `feat/T-001-short-title`, `fix/T-014-short-title`, `chore/...`.
- Commits : Conventional Commits en anglais (`feat:`, `fix:`, `refactor:`, `test:`, `docs:`, `chore:`).
- Jamais de commit direct sur la branche principale. Jamais de force push.
- Aucun commit ni push sans accord explicite de l'utilisateur.

---

## 9. Definition of Done (DoD) pour les fonctionnalités de jeu

Une tâche est `done` uniquement si :
1. Tous les critères d'acceptation sont satisfaits.
2. Le code a été relu par `tech-lead-po`.
3. Les tests pertinents existent et passent (exécution demandée à l'utilisateur).
4. La documentation est à jour (README, ADR, commentaires utiles).
5. `game-qa` a validé, avec un avis de recette **par un agent qui n'a pas écrit le code**.
6. L'utilisateur a validé la livraison.

---

## 10. Règle d'or de séparation des rôles

**Personne ne valide son propre travail.**
- Le code écrit par `game-dev` est testé par `game-qa` et relu par `tech-lead-po`.
- Le code écrit par `game-qa` est testé par `game-dev` et relu par `tech-lead-po`.
- Le champ `author_of_code` de la tâche fait foi.

---

## 11. Arbitrage

- `game-qa` a un **droit de blocage** sur une livraison qui ne remplit pas les critères.
- `tech-lead-po` peut contester le blocage avec des arguments.
- Le dernier mot appartient à l'utilisateur. Le désaccord est alors documenté dans la tâche.

---

## 12. Collaboration entre agents pour le développement de jeu

Le flux est piloté par la session principale (l'utilisateur ou Claude principal) :

1. `tech-lead-po` produit la tâche cadrée + un **brief de passation** pour l'agent suivant.
2. Session principale → `game-dev` (ou `game-qa` pour une tâche de test/dev QA).
3. Implémenteur remplit `Implementation log`, passe le statut à `review`, produit son brief.
4. Session principale → `tech-lead-po` (revue) → statut `qa`.
5. Session principale → l'agent qui n'a pas codé (recette).
6. `tech-lead-po` propose go/no-go → l'utilisateur décide.

Le brief de passation tient en 10 lignes maximum : tâche, état, fichiers touchés, décisions prises, risques, ce qui est attendu de l'agent suivant.

---

## 13. Format de réponse par défaut

- Concis. Pas de préambule, pas de récapitulatif de ce que l'utilisateur vient de dire.
- Rapports structurés : titres courts, listes, verdict en premier.
- Toujours terminer par **"Prochaine action"** : ce qui est attendu de l'utilisateur ou de l'agent suivant.

---

## 14. Niveau de finition

- Par défaut : **production robuste** (gestion d'erreurs, tests, documentation, performance de base).
- Si l'utilisateur écrit "MVP" ou "prototype" : réduire le périmètre, pas la sécurité ni la jouabilité de base. Documenter la dette assumée dans `docs/tech-debt.md`.

---

## 15. Structure attendue du projet pour ce jeu

Voir gameplay.md section 2 pour la structure détaillée. En résumé :

```
fracture-adventure/
├── public/
│   ├── icons/
│   └── assets/
│       ├── images/
│       └── audio/
├── src/
│   ├── main.ts
│   ├── game/
│   │   ├── config.ts
│   │   ├── scenes/
│   │   │   ├── BootScene.ts
│   │   │   ├── PreloadScene.ts
│   │   │   ├── MenuScene.ts
│   │   │   └── ExplorationScene.ts
│   │   ├── world/
│   │   │   ├── DepthSorter.ts
│   │   │   ├── CollisionSystem.ts
│   │   │   └── InteractionSystem.ts
│   │   └── entities/
│   │       ├── Heroine.ts
│   │       └── NPC.ts
│   ├── systems/
│   │   ├── dialogue/
│   │   ├── quests/
│   │   ├── combat/
│   │   ├── inventory/
│   │   └── party/
│   ├── controls/
│   │   ├── VirtualJoystick.ts
│   │   └── TouchButtons.ts
│   ├── data/
│   │   ├── characters/
│   │   ├── dialogues/
│   │   ├── quests/
│   │   └── worlds/
│   ├── save/
│   │   ├── SaveService.ts
│   │   └── SaveSchema.ts
│   ├── ui/
│   │   ├── OrientationOverlay.ts
│   │   └── game.css
│   └── types/
│       └── index.ts
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

---

## 16. Contexte du jeu à remplir

- **Client** : À préciser (studio interne, éditeur, indépendant)
- **Objectif** : Créer un jeu d'aventure narratif original mettant en avant l'exploration, la diversité des mondes et l'adaptation d'équipe.
- **Contraintes** : 
  - Développement en TypeScript/Phaser 3
  - Ciblage mobile (navigateurs, PWA)
  - Mode paysage obligatoire
  - Taille raisonnable pour téléchargement rapide
- **Stack retenue** : Voir section 4
- **Public cible** : Joueurs mobiles appréciant les aventures narratives (comme les jeux de type Zelda à l'ancienne, ou les jeux d'aventure point-and-click modernisés)
- **Délais** : À préciser (jalons de développement, version jouable, version complète)

*Ce contexte doit être rempli par le Product Owner ou le tech-lead en début de projet.*

---

**Prochaine action** : Veuillez revoir ce CLAUDE.md et indiquer si des ajustements sont nécessaires concernant l'adaptation des principes généraux au contexte du jeu, les rôles des agents, ou tout autre point. Ensuite, nous créerons la structure de dossiers détaillée et le répertoire .claude/agents/.