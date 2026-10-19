# Les Échos de la Fracture — Feuille de route d'amélioration

> Audit du dépôt + plan pour passer du prototype au jeu complet : plusieurs mondes, animations, combat étendu, audio, finition.
> Les points marqués *(à confirmer)* sont déduits de la lecture du code et doivent être vérifiés par `npm run test` et `npx tsc --noEmit`.
> Numérotation des tâches : continue après T-021 (format backlog de CLAUDE.md §7).

---

## 0. Vision et principes directeurs

**Boucle de jeu** (story.md) : explorer → rencontrer un obstacle → utiliser l'équipe → énigme ou combat → récompense + indice narratif.

**Règles de conception à tenir sur tous les niveaux**
1. **Un monde = une ambiance + une mécanique + un compagnon + un boss.** Chaque niveau enseigne une seule idée nouvelle.
2. **Le contenu est en données, pas en code** : cartes Tiled, JSON de dialogues, d'ennemis, d'énigmes, de quêtes.
3. **Règles séparées du rendu** : `systems/` sans dépendance Phaser, scènes = affichage uniquement.
4. **Rien n'est « done » tant que les tests n'ont pas été exécutés** (CLAUDE.md §9).
5. **Mobile d'abord** : paysage, deux pouces, 60 FPS sur appareil bas de gamme, < 50 Mo.

---

## 1. Phase 0 — Stabilisation (bloquant avant tout nouveau contenu)

### 1.1 Bugs critiques

| ID | Problème | Correction | Taille |
|---|---|---|---|
| T-022 | **Énigme impossible** : `puzzle1.json` attend `stone_rune_a`, le jeu envoie l'id Tiled numérique ; la carte nomme `stoneRuneA` ; `activatedObjectIds` mélange ids et noms ; `onPuzzleSolved` appelé 2 fois | Un seul identifiant stable = **nom de l'objet Tiled**. Aligner `puzzle1.json`, `triggerInteraction`, save et restauration. Supprimer le double appel (callback OU événement) | S |
| T-023 | **Barres de PV figées** : le moteur copie les participants (`{...p}`), la scène lit les originaux | La scène lit `engine.getParticipants()` ou met à jour via `result.targetHp` | S |
| T-024 | **JSON chargés par URL `src/data/...`** : 404 après `vite build` | `import x from '...json'` (ou déplacer dans `public/`) + `this.cache.json.add` | S |
| T-025 | **Double déclenchement du combat** (callback + valeur de retour d'`update()`) | Garder un seul canal | S |
| T-026 | **Défaite = ennemi inoffensif** (`alreadyTriggered` jamais réinitialisé) | Recul du joueur + `resetEncounter` après un délai ou en s'éloignant | S |
| T-027 | **Dialogue invisible / mal placé** ; le joueur peut bouger pendant un dialogue | `setDepth(2000)`, `setScrollFactor(0)`, garde `isDialogueActive()` dans `update()` ; corriger aussi les hover du bouton Continuer (coordonnées décalées) | S |
| T-028 | **OrientationOverlay contradictoire** : teste `gameSize` (toujours 960×540 en FIT), `hide()` appelle `scene.resume()` même pendant un combat | Détecter via `window.innerWidth/innerHeight` ; ne reprendre que la scène qu'on a soi-même mise en pause ; retirer le vrai listener `matchMedia` au `destroy` | S |
| T-029 | **`CombatScene.shutdown()` jamais appelé**, `removeAllListeners()` inexistant | `this.events.once('shutdown', …)` + ajouter `removeAllListeners()` à `CombatEngine` | S |
| T-030 | **Obstacles probablement non créés** *(à confirmer)* : `getLayer().layer?.data` ; un `GameObject` par tuile = coûteux | Vrai `TilemapLayer` : `createLayer` + `setCollisionByExclusion` + `physics.add.collider` | M |
| T-031 | **`SaveService` avale les erreurs** et résout avant le commit | Résoudre sur `tx.oncomplete`, **relancer** l'erreur, valider les données à la lecture | S |

### 1.2 Mobile / PWA

| ID | Action |
|---|---|
| T-032 | `input: { activePointers: 3 }` (joystick + bouton A simultanés) ; `render: { pixelArt: true, roundPixels: true }` |
| T-033 | Importer `game.css` dans `main.ts` ; `touch-action: none`, `user-select: none`, viewport `viewport-fit=cover, user-scalable=no` |
| T-034 | Enregistrer le service worker (`registerSW`) + UI de mise à jour (mode `prompt`) ; vraies icônes 192/512 (les fichiers actuels semblent vides) |
| T-035 | Versions : `vite-plugin-pwa` récent (^0.2.0 est obsolète), `phaser` fixé (3.80+), `vite` cohérent |
| T-036 | Tester hors ligne : cache des assets ≠ sauvegarde de progression (deux mécanismes distincts) |

### 1.3 Qualité et process

| ID | Action |
|---|---|
| T-037 | Scripts `test`, `typecheck`, `lint`, `format` dans `package.json` ; CI minimale (typecheck + tests + build) |
| T-038 | Corriger le typecheck : `speaker: null` vs `string`, `Phaser.GameObjects.SORT_ASCENDING`, `override shutdown`, `body` nullable, `any` |
| T-039 | **Nettoyer le backlog** : fusionner les doublons T-020/T-021, aligner les statuts réels, remplacer les owners `fullstack-*` par `game-dev` / `game-qa` / `tech-lead-po` |
| T-040 | Initiative du combat : calculer **une fois** par combattant (le `Math.random()` dans le comparateur de tri est incohérent) |
| T-041 | Validation des entrées : sauvegarde, JSON d'ennemis, cartes (schéma + valeurs par défaut + message générique côté joueur) |
| T-042 | Découper `ExplorationScene` (> 600 lignes) : `PlayerController`, `HudController`, `WorldLoader`, `PuzzleBinding`, `SaveCoordinator` |
| T-043 | Remplir `Heroine.ts`, `NPC.ts`, `BootScene`, `PreloadScene` (ou supprimer) ; centraliser les stats du héros dans `data/characters/` (supprimer `TestHero` de la prod) |
| T-044 | Remplacer le couplage `CombatScene → ExplorationScene` par un bus d'événements typé (dette V0.2 déjà notée) |
| T-045 | Renseigner `docs/tech-debt.md` (actuellement vide alors que de la dette est documentée dans les tâches) |

---

## 2. Architecture de contenu (data-driven)

```
src/data/
├── characters/    heroine.json, kael.json, nila.json, sana.json, miro.json, brik.json
├── enemies/       un fichier par ennemi + groupes (encounters)
├── skills/        compétences (id, coût, cible, effet)
├── items/         objets (soin, clés, quêtes, équipement)
├── dialogues/     un fichier par PNJ/scène, avec nœuds, choix, conditions, flags
├── quests/        étapes, conditions, récompenses
├── puzzles/       séquences, leviers, miroirs, courants…
├── worlds/        <monde>/<zone>.json (Tiled) + <monde>.meta.json (musique, palette, sorties)
└── i18n/          fr.json (prévoir en.json)
```

**Convention d'identifiants** : `snake_case` stable, jamais l'id numérique Tiled. Les propriétés Tiled portent la logique : `interact`, `puzzle`, `combat`, `enemyGroup`, `npcId`, `dialogueId`, `requires` (compétence/objet/flag), `spawnId`, `exitTo`.

**Flags de monde** (clé/valeur sauvegardés) : `puzzle1_solved`, `kael_met`, `boss_forest_defeated`… Les quêtes et dialogues lisent ces flags, pas la position d'un sprite.

---

## 3. Structure des niveaux

### 3.1 Progression globale

```
        ┌──────────────────────────────────────────┐
        │  HUB : La Clairière (monde 0, tutoriel)  │
        │  Kaël · portail de la Fracture           │
        └───────┬──────────┬──────────┬────────────┘
                │          │          │
         Monde 1        Monde 2     Monde 3      Monde 4
         Forêt          Cité        Station      Royaume
         gigantesque    engloutie   spatiale     de papier
         (Brik)         (Sana)      (Nila)       (Miro)
                │          │          │            │
                └──────────┴────┬─────┴────────────┘
                                │
                     Cœur de la Fracture (final)
```

- **Hub central sûr** (story.md) : parler, préparer l'équipe, rangement, sauvegarde.
- Chaque monde s'ouvre quand le portail du hub a reçu l'éclat correspondant (verrou narratif + visuel).
- Ordre conseillé : **Forêt → Cité → Station → Papier** (difficulté et mécaniques croissantes), mais 1-2 mondes jouables dans le désordre après le monde 1.
- Chaque monde = **3 à 4 zones reliées** (entrée, exploration, zone-énigme, zone-boss) + 1 secret.

### 3.2 Tableau des mondes

| Monde | Ambiance / palette | Compagnon recruté | Mécanique introduite | Ennemis (tileset existant) | Boss |
|---|---|---|---|---|---|
| **0. Clairière (hub / tutoriel)** | Nuit verte, lueur de la Fracture (`#17251d`) | **Kaël** (pisteur) | Déplacement, interaction, dialogue, 1ʳᵉ énigme, 1ᵉʳ combat | Enfant de la Fracture, chauve-souris | — (mini-gardien optionnel) |
| **1. Forêt gigantesque** | Vert profond, brume, rayons de lumière, racines énormes | **Brik** (gardien) | Pousser des blocs lourds, ouvrir des chemins, défense en combat | Gobelins, esprits, chauves-souris | Racine-mère |
| **2. Cité engloutie** | Bleu-cyan, bulles, ruines, lumière ondulante | **Sana** (plongeuse) | Courants (zones de poussée), plongée (zones sous-marines), puzzles de niveau d'eau | Esprits d'eau, squelettes corrodés | Gardien des abysses |
| **3. Station spatiale** | Gris-violet, néons, lumière froide, parois | **Nila** (mécanicienne) | Réparer/détourner machines, portes à circuit, ascenseurs | Drones, squelettes mécaniques | Cerveau de station |
| **4. Royaume de papier** | Beige/encre, plis, découpes, ombres nettes | **Miro** (illusionniste) | Doubles/illusions (leurres), ponts qui se déplient | Origamis, esprits d'encre | Le Grand Plieur |
| **5. Cœur de la Fracture** | Violet/noir, fragments de tous les mondes | Équipe complète | Synthèse des 5 mécaniques | Tous, remixés | Boss final |

> ⚠️ **Incohérence à trancher** : dans le code, Kaël est « gardien de cette clairière » ; dans story.md il est « pisteur ». Proposition : Kaël est le **pisteur-gardien** de la clairière (il lit les traces → révèle chemins cachés et dangers).

### 3.3 Verrous par capacité (logique de retour en arrière)

Chaque capacité de compagnon débloque des passages **dans les mondes déjà visités** (récompense l'exploration, cf. story.md « raccourcis ») :

| Capacité | Obstacle débloqué |
|---|---|
| Kaël — pistage | Traces cachées, pièges visibles, passages dissimulés |
| Brik — force | Rochers/blocs lourds (`blockerRock`), grilles |
| Sana — plongée | Passages sous l'eau, coffres immergés |
| Nila — réparation | Machines, ponts, portes, ascenseurs |
| Miro — illusion | Gardiens leurrables, passages gardés, énigmes de doubles |

---

## 4. Occupation scénique : gabarit de carte

### 4.1 Problème actuel

La carte `clairiere.json` fait **40×30 tuiles de 16 px = 640×480 px**, soit **plus petite que l'écran (960×540)**. Les objets (pierre, runes, ennemi) tiennent dans ~250 px : la scène est vide et la caméra ne sert à rien. Les sprites (32 px) sont deux fois plus grands que les tuiles (16 px).

### 4.2 Décisions

- **Tuiles 32×32** (aligné avec tous les assets `decors/` et `testpack/`).
- Taille de zone : **60×40 tuiles (1920×1280 px)** pour un hub/zone d'exploration, **40×30 (1280×960)** pour une zone de boss ou de puzzle. Cible : ~2 écrans de large, ~2 de haut.
- Une zone = **15 à 25 s de traversée** en ligne droite (vitesse 100 px/s → adapter à ~120-140 px/s).
- Un **repère visuel fort toutes les 8-10 s de marche** (monument, lumière, cours d'eau) pour guider sans texte.

### 4.3 Calques standards (identiques pour toutes les cartes)

| Calque | Type | Contenu |
|---|---|---|
| `background` | image / parallaxe | Ciel, fond lointain (`night_fracture_960x540` à `scrollFactor` 0.2-0.4) |
| `ground` | tuiles | Sol, chemins, eau, transitions (`ground_tileset_32`) |
| `ground_detail` | tuiles | Fleurs, mousse, fissures, flaques (sans collision) |
| `obstacles` | tuiles + collision | Arbres, rochers, murs (`obstacles_tileset_32`) |
| `above` | tuiles | Cimes, arches, passerelles : dessinés **au-dessus** du joueur |
| `collision` | objets | Rectangles invisibles pour les hitbox précises (pieds des arbres) |
| `interactives` | objets | Stèles, runes, coffres, leviers, portails, panneaux |
| `npcs` | objets | PNJ avec `npcId`, `dialogueId`, patrouille éventuelle |
| `encounters` | objets | Ennemis visibles (`enemyGroup`), rayon de détection, patrouille |
| `triggers` | objets | Zones (cinématique, entrée de zone, musique, sortie `exitTo` + `spawnId`) |
| `spawns` | points | `spawn_default`, `spawn_from_<zone>` |
| `ambient` | objets | Lucioles, brume, particules, lumières (décor vivant) |

### 4.4 Règles de densité (par zone de 60×40)

| Élément | Quantité cible | Règle d'emplacement |
|---|---|---|
| Obstacles « murs » naturels | bordure complète + 3 à 5 massifs | Canaliser le chemin, jamais de couloir > 6 tuiles sans variation |
| Décor non bloquant | 1 élément / ~6 tuiles de sol | Grouper par 2-3, jamais en grille régulière |
| Ennemis visibles | 4 à 7 | Jamais à moins de 8 tuiles du spawn ; groupés autour d'un point d'intérêt ; 1-2 patrouilles |
| PNJ | 1 à 3 | Près des carrefours et du hub ; un PNJ « indice » |
| Objets interactifs | 6 à 10 | 1 énigme complète, 2-3 coffres, 1-2 panneaux/lore, 1 point de sauvegarde (hub) |
| Secrets | 1 à 2 | Derrière un verrou de capacité d'un compagnon futur |
| Points de repère | 3 | Visibles de loin, 1 par tiers de la zone |
| Ambiance (particules/lumière) | 2 à 3 types | Cohérents avec la palette du monde |

**Règle des trois zones** : chaque carte se découpe en **sûre → tension → défi**.
- *Sûre* (autour du spawn) : aucun ennemi, un PNJ ou un indice.
- *Tension* (milieu) : ennemis isolés, décor plus sombre, premier choix de route.
- *Défi* (fond de carte) : groupe d'ennemis, énigme, récompense claire.

### 4.5 Plan détaillé : La Clairière (hub / niveau 0)

Carte 60×40, du sud-ouest vers le nord-est.

| Zone | Contenu | Rôle |
|---|---|---|
| **A. Point d'arrivée** (SW) | Spawn, chemin de terre, 2 arbres cadres, lucioles | Apprendre le joystick, rien d'hostile |
| **B. Pierre ancienne** (centre-SW) | `ancientStone`, 4 pierres décoratives en cercle, sol `rune_floor` | 1ʳᵉ interaction + dialogue narratif |
| **C. Camp de Kaël** (centre) | PNJ Kaël, feu de camp (lumière animée), coffre, panneau, **point de sauvegarde** | Hub social, tutoriel d'équipe |
| **D. Cercle des runes** (N) | 3 `stoneRune*` + `blockerRock`, indice gravé sur une stèle | 1ʳᵉ énigme (ordre A → B → C) |
| **E. Sentier de brume** (E) | Chemin sinueux, 1-2 chauves-souris, buissons | Zone de tension, 1ᵉʳ combat guidé |
| **F. Clairière des Enfants** (NE) | `testEnemy` renommé, 2 gobelins en patrouille | Combat « vrai » (équipe de 1) |
| **G. Portail de la Fracture** (NE, verrouillé) | Portail à 4 emplacements d'éclats | Annonce des mondes, progression |
| **H. Passage derrière le rocher** (N-NE) | Raccourci → coffre → éclat 0 | Récompense de l'énigme |
| **I. Secret** (SE) | Mur de lierre → plus tard ouvert par Kaël (pistage) | Retour en arrière |

**Chemin critique** : A → B → C → D → H → E → F → G. Les zones B-C-D forment un triangle (~15 s de marche entre chaque).

### 4.6 Plan type : un monde (zones)

| Zone | Durée | Contenu minimal |
|---|---|---|
| **1. Entrée** | 3-5 min | Arrivée du portail, mécanique du monde enseignée seule, 2 ennemis, 1 coffre |
| **2. Exploration** | 8-12 min | Carte ouverte, 1 PNJ de quête, 1 mini-énigme, 1 raccourci vers l'entrée |
| **3. Recrutement** | 5-8 min | Rencontre du compagnon (dialogue + 1ᵉʳ combat à deux), il rejoint l'équipe |
| **4. Zone-énigme** | 5-8 min | Énigme complète utilisant la mécanique du monde |
| **5. Boss** | 5-8 min | Arène fermée, 3 phases, récompense : **éclat** + objet |
| **6. Secret** | optionnel | Verrouillé par une capacité d'un autre compagnon |

Durée cible : **~30-40 min par monde**, soit 3 à 4 h de jeu pour les 4 mondes + final.

---

## 5. Animation et rendu

### 5.1 Utiliser réellement les assets existants

| ID | Action |
|---|---|
| T-050 | Charger et afficher le **tileset de sol** (`ground-tiles`) sur `ground` ; abandonner le fond de 1 tuile verte |
| T-051 | Obstacles : tileset réel (arbres, rochers, souches), hitbox aux **pieds** seulement |
| T-052 | Objets interactifs réels (stèles, runes, coffres, leviers, portail) à la place des rectangles jaunes/marron ; **runes animées** (halo, pulsation) et état activé lisible |
| T-053 | Ennemis sur la carte : sprites `enemies_tileset_32` + animations par tween (respiration, balancement, flash au repérage, bulle « ! ») |
| T-054 | Fond parallaxe (`night_fracture`) en `scrollFactor` 0.3 ; couche `above` pour que les cimes passent devant le joueur |
| T-055 | Aligner l'échelle (tuiles 32 px), recaler hitbox (corps 16×10 aux pieds), `DepthSorter` sur le **bas** du sprite (`y + height/2`) |

### 5.2 Animations du personnage

| ID | Action |
|---|---|
| T-056 | État machine `PlayerState` : `idle / walk / interact / hit / dead / special` ; jouer les anims `attack`, `hit`, `dead`, `special` (créées mais jamais jouées) ; ajouter l'anim `special` (absente de `create()`) |
| T-057 | Gérer 8 directions : flip ou diagonales ; ne pas relancer l'anim à chaque frame |
| T-058 | Poussière de pas, ombre portée ovale sous les personnages, léger *bobbing* |
| T-059 | Compagnons : suivi en file (trace de positions retardée), anims idle/walk, positions de repli à l'arrêt |

### 5.3 Combat visuel

| ID | Action |
|---|---|
| T-060 | Remplacer les cercles par **sprites** (héroïne, compagnons, ennemis) avec idle animé |
| T-061 | Séquence d'attaque : avance, frame d'attaque, recul ; **flash blanc** + secousse sur la cible ; anim `hit` puis `dead` (fondu) |
| T-062 | **Chiffres de dégâts flottants**, soins verts, « MISS » ; critiques plus gros et dorés |
| T-063 | Barres de PV **animées** (tween), segment « retard » rouge, couleur selon le seuil |
| T-064 | Screen shake léger, hit-stop (30-60 ms) sur coup critique, zoom caméra sur boss |
| T-065 | **Indicateur d'ordre des tours** (frise de portraits en haut) + curseur sur la cible |
| T-066 | Fond de combat dédié par monde (réutiliser les backgrounds), non un voile noir sur l'exploration |

### 5.4 Transitions et feedback

| ID | Action |
|---|---|
| T-067 | `cameras.main.fadeOut/fadeIn` entre scènes ; transition de combat (flash + zoom/spirale) |
| T-068 | Bulle « ! » + pause avant l'entrée en combat (le joueur comprend pourquoi) ; recul léger à la défaite |
| T-069 | Particules ambiantes par monde : lucioles/brume (forêt), bulles (cité), étincelles (station), confettis de papier (royaume) |
| T-070 | Lumières : halo du feu de camp, runes qui s'allument, éclairage nocturne (masque radial autour du joueur, optionnel) |
| T-071 | Écran de victoire : récompenses (XP, objets), résumé ; écran de défaite avec **Réessayer / Retour hub** |
| T-072 | Feedback tactile : léger vibrate API sur coup reçu (option désactivable) |

---

## 6. Gameplay et systèmes

### 6.1 Combat étendu

| ID | Fonction | Détail |
|---|---|---|
| T-080 | **Équipe multi-alliés / multi-ennemis** | Groupes d'ennemis (`enemyGroup`), jusqu'à 3 alliés + 4 ennemis ; ordre des tours général |
| T-081 | **Menu de combat complet** | Attaquer · Compétence · Objet · Défendre (story.md), puis **choix de cible** |
| T-082 | **Compétences** | `skills/*.json` : coût (PA/énergie), cible (1/tous/allié), effet (dégâts, soin, statut) ; extensible sans toucher au moteur (principe O de SOLID) |
| T-083 | **Défense** | Réduit les dégâts de 50 % jusqu'au prochain tour ; utile contre les attaques chargées de boss |
| T-084 | **Objets en combat** | Potion, antidote, objet de lancer ; consommation depuis l'inventaire |
| T-085 | **Formule de dégâts** | `max(1, atk - def)` + variance ±10 % + critique ; éviter les 0 dégâts permanents |
| T-086 | **États** | Poison, étourdissement, bouclier, saignement ; durée en tours |
| T-087 | **IA ennemie** | Ennemi choisit sa cible/skill (aléatoire pondéré, cible le plus faible, soigneur d'abord) ; boss à **phases** pilotées par les PV |
| T-088 | **Fuite** | Chance basée sur la vitesse ; désactivée contre les boss |
| T-089 | **Particularité du décor** (story.md) | Une action contextuelle par arène : activer un dispositif, faire tomber un obstacle, utiliser un courant |
| T-090 | **Équilibrage** | Tableau de référence (PV/ATQ/DEF/VIT par niveau et monde), simulation automatique dans les tests (N combats simulés → taux de victoire attendu) |
| T-091 | **Initiative** | Calcul unique par combattant, ordre recalculé à chaque round (pas à chaque comparaison) |

### 6.2 Équipe, progression, inventaire

| ID | Fonction |
|---|---|
| T-100 | **Party system** : recrutement par monde, sélection de 3 compagnons maximum, changer de personnage (bouton story.md) |
| T-101 | **Niveaux / XP** : courbe simple, gain à la victoire, montée de stats dans `characters/*.json` |
| T-102 | **Équipement de base** : arme, protection, charme (pas de personnalisation poussée — non-objectif) |
| T-103 | **Inventaire** : empilement, tri, utilisation hors combat, objets de quête, clés ; écran dédié |
| T-104 | **Récompenses** : coffres (`chest_id` sauvegardé), butin des ennemis, or (si monnaie), éclats de la Fracture |
| T-105 | **Capacités d'exploration par compagnon** (§3.3) : bouton B ouvre un menu contextuel ou lance la capacité du compagnon actif près d'un obstacle compatible |

### 6.3 Narration

| ID | Fonction |
|---|---|
| T-110 | **Vrais PNJ** : `NPC.ts`, sprite, idle, orientation vers le joueur, bulle d'interaction, patrouille |
| T-111 | **Dialogues à choix en JSON** (le dialogue `ancientStone` est encore en dur dans le code) : nœuds, conditions sur flags, effets (donner objet, lancer quête) |
| T-112 | **Portraits réels** (le pack `testpack/portraits` existe) + expressions ; effet machine à écrire avec tap pour tout afficher |
| T-113 | **Journal de quêtes** : objectifs, état, marqueur sur la carte (flèche en bord d'écran) |
| T-114 | **Cinématiques légères** : caméra qui se déplace, PNJ qui marche, dialogues scriptés (tout en JSON d'actions) |
| T-115 | **Choix qui comptent** (story.md) : flags de relation par compagnon, 2-3 fins selon relations et décisions du final |
| T-116 | **Lore** : panneaux, stèles, objets à collectionner, codex consultable |

### 6.4 Monde

| ID | Fonction |
|---|---|
| T-120 | **Chargeur de cartes générique** : `WorldLoader` lit une carte + métadonnées, gère calques, collisions, spawns |
| T-121 | **Transitions de zones** : `exitTo` + `spawnId`, fondu, mémoire de la position de retour |
| T-122 | **Points de sauvegarde** (hub, camps) + auto-save conservé ; restauration complète (flags, coffres, ennemis vaincus, position, équipe, inventaire, quêtes) |
| T-123 | **Réapparition des ennemis** : certains vaincus restent (boss), les ennemis communs reviennent au changement de zone (documenter la règle) |
| T-124 | **Mini-carte / carte du monde** (option), indication des zones visitées |
| T-125 | **Interactions variées** : leviers, plaques de pression, blocs poussables, portails, courants (zones à vitesse imposée), machines, ponts dépliables |
| T-126 | **Énigmes réutilisables** : types `sequence`, `lever_combo`, `push_block`, `mirror`, `water_level`, `circuit` ; générique JSON, pas une classe par énigme |

---

## 7. Interface et menus

| ID | Fonction |
|---|---|
| T-130 | **Menu principal** : Continuer / Nouvelle partie (confirmation d'écrasement) / Options / Crédits ; vraie illustration de titre |
| T-131 | **Menu pause** : Reprendre / Inventaire / Équipe / Quêtes / Options / Quitter au titre |
| T-132 | **HUD** : PV du leader, mini-indicateur d'objectif, bouton menu ; bouton A **contextuel** (n'apparaît/ne change d'icône que si une interaction est possible — c'est le comportement décrit dans story.md, aujourd'hui forcé visible) |
| T-133 | **Boutons B / Esquive / Changer de perso** conformes à story.md ; B est actuellement un stub |
| T-134 | **Options** : volume musique/SFX, taille/opacité des commandes, gaucher/droitier, vitesse du texte, langue, vibration |
| T-135 | **UI kit** : réutiliser `ui_tileset_32` (boutons, panneaux, cœur, orbe) à la place des Graphics ; composants `Panel`, `Button`, `Bar` |
| T-136 | **Accessibilité** : zones de toucher ≥ 48 px, contraste texte, police lisible (pixel font en pixelArt) |
| T-137 | **Écran de chargement** (barre de progression) pour la PWA ; `PreloadScene` réelle |
| T-138 | **i18n** : tout texte via clés (`fr.json`) ; abandon des chaînes en dur dans les scènes |

---

## 8. Audio

| ID | Fonction |
|---|---|
| T-140 | Gestionnaire audio (`AudioManager`) : musique par monde/zone/combat/boss, fondus croisés, volumes persistants |
| T-141 | Musique : menu, hub, 4 mondes, combat, boss, victoire, défaite, final (≈ 12 pistes) |
| T-142 | SFX : pas (selon sol), interaction, UI (clic, curseur), coups, soins, victoire, rune activée, coffre, portail |
| T-143 | Ambiances : vent/oiseaux, eau, bourdonnement de station, froissement de papier |
| T-144 | Format `.ogg` + `.mp3` de secours, compressés ; déblocage de l'audio au premier toucher (contrainte navigateur mobile) |

---

## 9. Art et assets

| ID | Fonction |
|---|---|
| T-150 | Décision d'art : conserver le pixel-art procédural comme *placeholder* ou commander/produire un art définitif (les packs actuels sont signalés « prototype » dans leurs README) |
| T-151 | **Tilesets par monde** : forêt, cité engloutie, station, papier, cœur ; chacun avec autotiles et transitions |
| T-152 | **Spritesheets** compagnons (5) : idle/walk/attack/hit/dead/special, 4 directions |
| T-153 | **Ennemis animés** (≥ 4 frames) par famille + 1 sprite de boss par monde |
| T-154 | **Portraits** (5 compagnons + héroïne + PNJ clés) |
| T-155 | **Effets** : sprites de coups, soins, magie, portail ; ou particules Phaser |
| T-156 | Atlas : regrouper en texture atlases (moins de draw calls), conversion WebP quand utile |
| T-157 | Budget : < 50 Mo au total, textures ≤ 2048² pour mobile bas de gamme |

---

## 10. Performance et robustesse

| ID | Action |
|---|---|
| T-160 | Un seul `TilemapLayer` par couche, culling caméra, pas de `GameObject` par tuile |
| T-161 | Pool d'objets pour particules et chiffres de dégâts |
| T-162 | Mesure : FPS, mémoire, draw calls sur un téléphone réel d'entrée de gamme ; seuil 60 FPS (30 acceptable en combat chargé) |
| T-163 | Gestion des ressources manquantes (texture, JSON) : message clair en dev, repli générique en prod |
| T-164 | Migration de sauvegarde : champ `version`, fonctions `migrate(vN → vN+1)`, sauvegarde corrompue → proposition de repartir |
| T-165 | Plusieurs emplacements de sauvegarde (3) + export/import JSON |
| T-166 | Journal d'erreurs côté dev, jamais de stack trace dans l'UI (CLAUDE.md §6) |

---

## 11. Tests et qualité

| Domaine | Tests à écrire |
|---|---|
| CombatEngine | Ordre des tours multi-camps, cibles, états, critiques, IA, fuite, boss à phases, simulation d'équilibrage |
| EncounterSystem | Réarmement après défaite, groupes, détection de rayon |
| PuzzleSystem | Ordre correct/incorrect, restauration depuis save, énigmes génériques par type |
| DialogueSystem | Nœuds, conditions, effets, fin ; avec **mock** de scène |
| SaveService | Round-trip, version, migration, corruption, quota |
| WorldLoader | Carte valide/invalide, calques manquants, spawns, sorties |
| Quêtes / Inventaire / Party | Logique pure (aucune dépendance Phaser) |
| **Parcours E2E** (Playwright, mobile paysage) | Nouvelle partie → énigme → combat → sauvegarde → recharge → ennemi toujours vaincu |
| Revue QA indépendante | Appliquer la règle CLAUDE.md §10 (qui écrit ≠ qui valide) |

---

## 12. Planning proposé (sprints)

| Sprint | Objectif | Livrables | Critère de sortie |
|---|---|---|---|
| **S0 — Stabilisation** | Tout fonctionne vraiment | T-022 → T-045 | Build prod OK, tests exécutés, énigme + combat + sauvegarde OK sur téléphone |
| **S1 — Rendu réel** | Le jeu a l'air d'un jeu | T-050 → T-059, T-067 → T-070, T-120 | Clairière jouable avec vrais sprites, hitbox, profondeur, fondus |
| **S2 — Clairière complète** | Niveau 0 terminé (§4.5) | Carte 60×40, Kaël PNJ, énigme, portail, point de sauvegarde, T-110 → T-113, T-130 → T-133 | 10 min de jeu fluides, aucun bug bloquant |
| **S3 — Combat riche** | Combat conforme à story.md | T-060 → T-066, T-080 → T-091, T-071 | Combat 3 vs 3 avec compétences, objets, défense, boss à phases |
| **S4 — Équipe et progression** | Compagnons et inventaire | T-100 → T-105, T-122, T-123 | Kaël + 1 compagnon jouables, capacités d'exploration |
| **S5 — Monde 1 (Forêt)** | 1ᵉʳ monde complet | 4 zones, Brik, boss Racine-mère, tileset forêt | ~35 min de jeu, retour hub fonctionnel |
| **S6 — Audio + options** | Ambiance et confort | T-134 → T-138, T-140 → T-144 | Audio complet du hub et du monde 1, options persistantes |
| **S7 — Monde 2 (Cité)** | Courants + plongée | Sana, zones sous-marines, énigmes d'eau, boss | Mécanique de courant fonctionnelle |
| **S8 — Monde 3 (Station)** | Machines | Nila, circuits, ascenseurs, boss | Énigmes de circuit génériques |
| **S9 — Monde 4 (Papier)** | Illusions | Miro, doubles/leurres, ponts dépliables, boss | Leurres utilisables en exploration et en combat |
| **S10 — Final + fins** | Conclusion | Cœur de la Fracture, boss final, 2-3 fins, T-115 | Jeu terminable de bout en bout |
| **S11 — Polish / release** | Qualité | Équilibrage, perf, accessibilité, PWA hors ligne, T-150 → T-166 | 60 FPS sur appareil cible, < 50 Mo, zéro bug S1/S2 |

> Respecter **2 tâches `doing` maximum** et **1 tâche = 1 branche = 1 PR < 400 lignes** (CLAUDE.md §7). Les jalons S2, S5 et S10 sont des points go/no-go avec l'utilisateur.

---

## 13. Checklist « niveau terminé »

Un monde ou une zone est terminé quand **tout** est coché :

- [ ] Carte Tiled conforme aux calques standards (§4.3) et à la densité (§4.4)
- [ ] Spawn, sorties et retours testés dans les deux sens
- [ ] Chemin critique jouable en < durée cible ; secrets verrouillés par une capacité
- [ ] Tous les ennemis ont sprite animé, stats, IA ; équilibrage simulé
- [ ] Au moins 1 énigme jouable, restaurée correctement après rechargement
- [ ] PNJ et dialogues en JSON, portraits affichés, aucun texte en dur
- [ ] Musique + ambiance + SFX du monde
- [ ] Sauvegarde/chargement : flags, coffres, ennemis, quêtes, position
- [ ] 60 FPS mesurés sur appareil de référence
- [ ] Tests unitaires et E2E exécutés et verts, recette `game-qa` indépendante, validation utilisateur

---

## 14. Dette technique à inscrire dans `docs/tech-debt.md`

| Dette | Priorité | Remboursement |
|---|---|---|
| Couplage `CombatScene → ExplorationScene` par cast | Haute | T-044 |
| `ExplorationScene` monolithique | Haute | T-042 |
| Pas de validation de schéma (save, JSON) | Haute | T-041 |
| Sprites procéduraux de prototype | Moyenne | T-150 → T-155 |
| Dialogue `ancientStone` en dur | Moyenne | T-111 |
| Sauvegarde non versionnée | Moyenne | T-164 |
| `SaveService` : erreurs avalées | Haute | T-031 |
| Tests de scènes Phaser limités (jsdom) | Basse | E2E (§11) |

---

## 15. Risques

| Risque | Impact | Parade |
|---|---|---|
| Portée trop ambitieuse (4 mondes + 5 compagnons) | Jeu jamais fini | Livrer **le hub + monde 1 jouables de bout en bout** avant de lancer les autres (S2, S5) |
| Production d'art | Goulot d'étranglement | Décider tôt (T-150), figer un style, réutiliser tilesets par recoloration |
| Performance mobile bas de gamme | Injouable | Mesurer dès S1, atlas, culling, pools |
| Complexité narrative croissante | Incohérences | Flags centralisés + dialogues en JSON + tests de quêtes |
| Équilibrage du combat | Frustration / ennui | Simulation automatique + tableau de référence (T-090) |
| Sauvegarde corrompue | Perte de progression | Versionnage, migration, 3 slots, export JSON |

---

**Prochaine action** : valider ce plan, puis lancer **S0** en commençant par T-022 → T-025 (énigme, PV, JSON en prod, double combat) sur la branche `fix/T-022-stabilisation-bugs-bloquants`.
