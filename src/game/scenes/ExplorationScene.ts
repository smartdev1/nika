// Exploration scene: main gameplay
import Phaser from 'phaser';
import { DepthSorter } from '../world/DepthSorter';
import { InteractionSystem } from '../world/InteractionSystem';
import { DialogueSystem } from '../../systems/dialogue/DialogueSystem';
import { VirtualJoystick } from '../../controls/VirtualJoystick';
import { TouchButton } from '../../controls/TouchButton';
import { OrientationOverlay } from '../../ui/OrientationOverlay';
import { SaveService } from '../../save/SaveService';
import type { GameSave } from '../../save/SaveSchema';
import type { Combatant } from '../../types/index';
import { PuzzleSystem } from '../../systems/puzzle/PuzzleSystem';
import { EncounterSystem } from '../../systems/combat/EncounterSystem';

// Données de jeu importées via Vite (évite les 404 après build : plus de chemins
// src/data/* chargés par URL dans preload()). Voir T-024.
import clairiereMap from '../../data/worlds/clairiere.json';
import level1Map from '../../data/worlds/level1.json';
import kaelDialogue from '../../data/dialogues/kael.json';
import level1KaelDialogue from '../../data/dialogues/level1_kael.json';
import puzzle1Config from '../../data/puzzles/puzzle1.json';
import level1PuzzleConfig from '../../data/puzzles/level1_puzzle.json';
import testEnemyData from '../../data/enemies/testEnemy.json';

export default class ExplorationScene extends Phaser.Scene {
  private map!: Phaser.Tilemaps.Tilemap;
  private tileset!: Phaser.Tilemaps.Tileset;
  private groundLayer!: Phaser.Tilemaps.TilemapLayer;
  private obstacleLayer!: Phaser.Tilemaps.TilemapLayer;
  private obstacleSprites!: Phaser.GameObjects.Group;
  private interactionLayer!: Phaser.Tilemaps.ObjectLayer;
  private encounterLayer!: Phaser.Tilemaps.ObjectLayer;
  private player!: Phaser.Physics.Arcade.Sprite;
  private depthGroup!: Phaser.GameObjects.Group;
  private interactionSystem!: InteractionSystem;
  private actionButtonA!: TouchButton;
  private actionButtonB!: TouchButton;
  private heroineAnimationsInitialized: boolean = false;
  private isActionButtonVisible: boolean = false;
  private currentInteraction: any = null;
  private dialogueSystem!: DialogueSystem;
  private joystick!: VirtualJoystick;
  private orientationOverlay!: OrientationOverlay;
  private puzzleSystem!: PuzzleSystem;
  private encounterSystem!: EncounterSystem;
  private runeSprites: Map<string, Phaser.GameObjects.Sprite> = new Map();
  private blockerSprite?: Phaser.GameObjects.Sprite;

  // Dimensions UI pour le repositionnement au resize du canvas
  private readonly uiMargin = 20;
  private readonly buttonWidth = 80;
  private readonly buttonHeight = 80;
  private readonly buttonSpacing = 15;
  private readonly joystickRadius = 80;

  // Save service (singleton, no Phaser dependency)
  private saveService = SaveService.getInstance();
  private activatedObjectIds: string[] = [];
  private defeatedEncounters: string[] = [];
  private currentEncounterEnemyId: string | null = null;
  private saveLoaded = false; // true après restauration de la sauvegarde (évite les combats avant chargement)
  private needsSave = false;
  private lastSaveTime = 0;
  private readonly SAVE_INTERVAL_MS = 5000; // throttle: au plus une sauvegarde toutes les 5s
  private lastSavedPosition: Phaser.Math.Vector2 = new Phaser.Math.Vector2(0, 0);
  private readonly POSITION_SAVE_THRESHOLD = 100; // pixels

  constructor() {
    super('exploration-scene');
  }

  preload() {
    // Load a white pixel texture for sprites (placeholder fallback)
    this.load.image('white', 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGP6zwAAAgcBApocMXEAAAAASUVORK5CYII=');

    // --- Héroïne (pack testpack, cellules 32×32) ---
    this.load.spritesheet('heroine-walk', '/assets/images/heroine/heroine_walk.png', { frameWidth: 32, frameHeight: 32 });
    this.load.spritesheet('heroine-idle', '/assets/images/heroine/heroine_idle.png', { frameWidth: 32, frameHeight: 32 });
    this.load.spritesheet('heroine-attack', '/assets/images/heroine/heroine_attack.png', { frameWidth: 32, frameHeight: 32 });
    this.load.spritesheet('heroine-hit', '/assets/images/heroine/heroine_hit.png', { frameWidth: 32, frameHeight: 32 });
    this.load.spritesheet('heroine-dead', '/assets/images/heroine/heroine_dead.png', { frameWidth: 32, frameHeight: 32 });
    this.load.spritesheet('heroine-special', '/assets/images/heroine/heroine_special.png', { frameWidth: 32, frameHeight: 32 });

    // --- Décor (pack decors, cellules 32×32) ---
    this.load.image('night-bg', '/assets/images/environment/backgrounds/night_fracture_960x540.png');
    this.load.image('ground-tiles', '/assets/images/environment/ground/ground_tileset_32.png');
    this.load.image('obstacles-tiles', '/assets/images/environment/obstacles/obstacles_tileset_32.png');
    this.load.image('interactive-objects', '/assets/images/environment/interactive/interactive_objects_32.png');
    this.load.image('enemies-tiles', '/assets/images/environment/enemies/enemies_tileset_32.png');
    this.load.image('game-ui', '/assets/images/environment/ui/ui_tileset_32.png');
  }

  create() {
    console.log('[ExplorationScene] create() début');
    // Les données JSON sont importées statiquement (Vite) et ajoutées au cache
    // pour éviter les 404 après build (T-024).
    // Le tilemap est passe directement aux donnees (pas via le cache) car
    // this.cache.tilemap.add + this.make.tilemap({ key }) ne parse pas le
    // JSON brut Tiled en TilemapData, ce qui rend les layers introuvables.
    this.cache.json.add('kaelDialogue', kaelDialogue);
    this.cache.json.add('level1KaelDialogue', level1KaelDialogue);
    this.cache.json.add('puzzle1', puzzle1Config);
    this.cache.json.add('level1Puzzle', level1PuzzleConfig);
    this.cache.json.add('enemyTestEnemy', testEnemyData);

    // Le tilemap est ajouté au cache avec le format TILED_JSON (1) pour que
    // this.make.tilemap({ key }) puisse le parser correctement.
    // Note: cache.tilemap.add attend un objet { format, data }, pas le JSON brut.
    this.cache.tilemap.add('clairiere', {
        format: Phaser.Tilemaps.Formats.TILED_JSON,
        data: clairiereMap,
    });
    this.cache.tilemap.add('level1', {
        format: Phaser.Tilemaps.Formats.TILED_JSON,
        data: level1Map,
    });

    // Load the tilemap from the cache. Use level1 for the first playable level.
    this.map = this.make.tilemap({ key: 'level1' });

    // Get layers
    this.groundLayer = this.map.getLayer('ground');
    this.obstacleLayer = this.map.getLayer('obstacles');
    this.interactionLayer = this.map.getObjectLayer('interactives');

    // Encounter layer: combat triggers placed on the map
    this.encounterLayer = this.map.getObjectLayer('encounters');

    // Validate layers exist
    if (!this.groundLayer || !this.obstacleLayer || !this.interactionLayer || !this.encounterLayer) {
      console.error('[ExplorationScene] Layers not found. Check clairiere.json has: ground, obstacles, interactives, encounters');
      return; // Stop if required layers are missing
    }
    console.log('[ExplorationScene] Layers OK');

    // Fond de scène : image illustrative couvrant toute la carte
    const worldBg = this.add.image(0, 0, 'night-bg');
    worldBg.setOrigin(0, 0);
    worldBg.setDepth(-200);

    // --- Animations de l'héroïne (4 directions : down, left, right, up ; lignes 0-3) ---
    const dirs = ['down', 'left', 'right', 'up'];
    for (let row = 0; row < dirs.length; row++) {
      const dir = dirs[row];
      // Walk : 4 frames par direction
      this.anims.create({
        key: `heroine-walk-${dir}`,
        frames: this.anims.generateFrameNumbers('heroine-walk', { start: row * 4, end: row * 4 + 3 }),
        frameRate: 8, repeat: -1
      });
      // Idle : 4 frames par direction
      this.anims.create({
        key: `heroine-idle-${dir}`,
        frames: this.anims.generateFrameNumbers('heroine-idle', { start: row * 4, end: row * 4 + 3 }),
        frameRate: 4, repeat: -1
      });
      // Attack : 4 frames par direction
      this.anims.create({
        key: `heroine-attack-${dir}`,
        frames: this.anims.generateFrameNumbers('heroine-attack', { start: row * 4, end: row * 4 + 3 }),
        frameRate: 12, repeat: 0
      });
      // Hit : 3 frames par direction
      this.anims.create({
        key: `heroine-hit-${dir}`,
        frames: this.anims.generateFrameNumbers('heroine-hit', { start: row * 3, end: row * 3 + 2 }),
        frameRate: 10, repeat: 0
      });
      // Dead : 3 frames par direction
      this.anims.create({
        key: `heroine-dead-${dir}`,
        frames: this.anims.generateFrameNumbers('heroine-dead', { start: row * 3, end: row * 3 + 2 }),
        frameRate: 6, repeat: 0
      });
    }

    // Obstacles: one static GameObject per non-empty tile (original, stable).
    // T-030 (real TilemapLayer) is deferred: createLayer/setCollisionByExclusion
    // crashed at runtime ("Cannot read properties of undefined (reading '0')").
    this.obstacleSprites = this.physics.add.staticGroup();
    const obstacleData = this.obstacleLayer?.layer?.data;
    if (obstacleData) {
      for (let y = 0; y < obstacleData.length; y++) {
        const row = obstacleData[y];
        if (!row) continue;
        for (let x = 0; x < row.length; x++) {
          if (row[x] && row[x].index !== -1) {
            const obstacle = this.add.rectangle(x * 16 + 8, y * 16 + 8, 16, 16, 0x8d6e63);
            this.obstacleSprites.add(obstacle, true);
          }
        }
      }
    }

    // Spawn position from the 'spawn' object in the interactives layer (level1).
    const spawnObj = this.interactionLayer?.objects?.find((o: any) => o.name === 'spawn');
    const spawnX = spawnObj ? spawnObj.x + (spawnObj.width || 0) / 2 : 100;
    const spawnY = spawnObj ? spawnObj.y + (spawnObj.height || 0) / 2 : 100;

    // Create player as animated sprite (required by InteractionSystem)
    this.player = this.physics.add.sprite(spawnX, spawnY, 'heroine-walk', 0);
    this.player.setDepth(10);
    this.player.body.setCollideWorldBounds(true);
    // Animation idle par défaut (regard vers le bas)
    this.player.anims.play('heroine-idle-down');
    console.log('[ExplorationScene] Player (sprite animé) créé à (100, 100)');

    // Create depth group
    this.depthGroup = this.add.group();
    this.depthGroup.addMultiple(this.obstacleSprites.getChildren());
    this.depthGroup.add(this.player);

    // Collision
    this.physics.add.collider(this.player, this.obstacleSprites);

    // Controls
    // Keyboard inputs were removed in T-008: movement is now driven by the
    // virtual joystick (touch + mouse for desktop tests).

    // Camera
    this.cameras.main.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels);
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);

    // Systems
    this.interactionSystem = new InteractionSystem(this);
    this.interactionSystem.setPlayer(this.player);
    this.interactionSystem.loadFromObjectLayer(this.interactionLayer);
    this.dialogueSystem = new DialogueSystem(this);
    this.createActionButtons();

    // Virtual joystick at bottom-left for touch movement.
    // Radius 100px per T-008 acceptance criteria, fixed to the screen.
    this.joystick = new VirtualJoystick(
      this,
      this.uiMargin + this.joystickRadius,
      this.cameras.main.height - this.uiMargin - this.joystickRadius,
      this.joystickRadius,
      this.joystickRadius * 0.4,
      this.joystickRadius * 0.15
    );
    this.joystick.setDepth(1000); // reste au-dessus des éléments du monde (DepthSorter ne trie pas ce container)
    this.joystick.setScrollFactor(0); // fixé à l'écran, ne bouge pas avec la caméra du monde
    this.add.existing(this.joystick);
    this.joystick.startTracking();

    // Orientation overlay: covers the screen and pauses the game in portrait mode
    this.orientationOverlay = new OrientationOverlay(this);

    // Écoute le redimensionnement du canvas pour repositionner les éléments UI
    this.scale.on('resize', this.handleResize, this);
    this.resizeUI();

    // Create puzzle objects: runic stones and the blocker rock
    this.createPuzzleObjects();

    // Instantiate the puzzle system and connect it to the interaction system
    const puzzleConfig = this.cache.json.get('level1Puzzle') as {
      id: string;
      expectedSequence: string[];
      successEvent: string;
      blockerId?: string;
    };
    this.puzzleSystem = new PuzzleSystem(this, puzzleConfig);
    this.interactionSystem.setOnPuzzleActivation((id: string) => {
      this.puzzleSystem.notifyActivation(id);
    });

    // Encounter system: detect proximity to combat triggers on the map
    this.encounterSystem = new EncounterSystem(this, { triggerDistance: 32 });
    this.encounterSystem.setPlayer(this.player);
    if (this.encounterLayer) {
      this.encounterSystem.loadFromObjectLayer(this.encounterLayer);
    }
    // Un seul canal de déclenchement : la valeur de retour d'update()
    // (T-025). Le callback setOnEncounterTriggered n'est pas branché ici pour
    // éviter le double appel de startCombat().

    // Listen for puzzle success event
    this.events.on(puzzleConfig.successEvent, () => {
      this.onPuzzleSolved();
    });

    // Initialisation de la sauvegarde/chargement au démarrage
    this.lastSavedPosition = new Phaser.Math.Vector2(this.player.x, this.player.y);
    this.loadSave().catch((err) => console.error('[SaveService] Erreur lors du chargement:', err));
    console.log('[ExplorationScene] create() fin — monde chargé');

    // Sauvegarde périodique de secours toutes les 30 secondes
    this.time.addEvent({
      delay: 30000,
      callback: () => this.scheduleSave(),
      loop: true,
    });
  }

  private createActionButtons(): void {
    const baseY = this.cameras.main.height - this.uiMargin - this.buttonHeight / 2;

    // Bouton A — validation principale (interaction contextuelle avec un objet)
    this.actionButtonA = new TouchButton(this, {
      x: this.cameras.main.width - this.uiMargin - this.buttonWidth / 2,
      y: baseY,
      width: this.buttonWidth,
      height: this.buttonHeight,
      label: 'A',
      onPress: () => this.triggerInteraction(),
      depth: 1000,
      circular: true,
    });
    this.add.existing(this.actionButtonA);
    this.actionButtonA.setScrollFactor(0); // fixé à l'écran, ne bouge pas avec la caméra du monde
    this.actionButtonA.setButtonVisible(true); // toujours visible pour le test ; masqué par la logique d'interaction si nécessaire

    // Bouton B — actions secondaires (toujours disponible)
    this.actionButtonB = new TouchButton(this, {
      x:
        this.cameras.main.width -
        this.uiMargin -
        this.buttonWidth -
        this.buttonSpacing -
        this.buttonWidth / 2,
      y: baseY,
      width: this.buttonWidth,
      height: this.buttonHeight,
      label: 'B',
      onPress: () => this.triggerSecondaryAction(),
      depth: 1000,
      circular: true,
    });
    this.add.existing(this.actionButtonB);
    this.actionButtonB.setScrollFactor(0); // fixé à l'écran, ne bouge pas avec la caméra du monde
    this.actionButtonB.setButtonVisible(true);
  }

  /**
   * Repositionne tous les éléments UI (joystick, boutons, overlay) selon
   * la taille courante du canvas. Appelé à l'initialisation et à chaque resize.
   */
  private resizeUI(): void {
    const w = this.cameras.main.width;
    const h = this.cameras.main.height;

    // Joystick : ancré bas-gauche
    this.joystick.setPosition(this.uiMargin + this.joystickRadius, h - this.uiMargin - this.joystickRadius);

    // Boutons : ancrés bas-droite
    const baseY = h - this.uiMargin - this.buttonHeight / 2;
    this.actionButtonA.setPosition(w - this.uiMargin - this.buttonWidth / 2, baseY);
    this.actionButtonB.setPosition(
      w - this.uiMargin - this.buttonWidth - this.buttonSpacing - this.buttonWidth / 2,
      baseY
    );

    // Overlay d'orientation : redessine le fond et recentre le texte
    if (this.orientationOverlay) {
      this.orientationOverlay.resize(w, h);
    }
  }

  /**
   * Gère les événements de resize du canvas (fenêtre navigateur, rotation appareil).
   * Repositionne les éléments UI pour qu'ils restent aux mêmes ancres relatives.
   */
  private handleResize(): void {
    this.resizeUI();
  }

  /**
   * Action secondaire (bouton B).
   * À étendre selon les besoins du jeu (inventaire, sprint, menu, etc.).
   */
  private triggerSecondaryAction(): void {
    console.log('[ACTION SECONDAIRE] Bouton B pressé');
  }

  /**
   * Crée les sprites visuels pour les pierres runiques et le rocher bloquant
   * à partir des objets de la couche "interactives" du tilemap.
   */
  private createPuzzleObjects(): void {
    const interactives = this.interactionLayer.objects;

    for (const obj of interactives) {
      if (obj.name === 'blockerRock' || obj.name === 'blocker_rock') {
        // Rocher bloquant : rectangle gris, plus grand
        const blocker = this.add.rectangle(obj.x + obj.width / 2, obj.y + obj.height / 2, 32, 16, 0x5d4037);
        this.physics.add.existing(blocker);
        blocker.body.setImmovable(true);
        blocker.body.setCollideWorldBounds(true);
        this.depthGroup.add(blocker);
        this.blockerSprite = blocker;
        this.physics.add.collider(this.player, blocker);
      } else if (obj.name?.startsWith('stoneRune')) {
        // Pierre runique : rectangle jaune/or
        const rune = this.add.rectangle(obj.x + obj.width / 2, obj.y + obj.height / 2, 24, 24, 0xffd700);
        this.depthGroup.add(rune);
        this.runeSprites.set(obj.name, rune);

        // Si déjà activé dans une session précédente, afficher l'état activé (plus foncé)
        if (this.activatedObjectIds.includes(obj.name)) {
          rune.setTint(0x7a5c00);
        }
      }
    }
  }

  /**
   * Called when the puzzle sequence is completed correctly.
   * Removes the blocker rock and triggers a special dialogue.
   */
  private onPuzzleSolved(): void {
    console.log('[PuzzleSystem] Énigme résolue ! Le passage est débloqué.');

    // Remove the blocker rock from the world
    if (this.blockerSprite) {
      this.blockerSprite.destroy();
      this.blockerSprite = undefined;
    }

    // Launch a special dialogue to reward the player
    const successLines = [
      { speaker: 'Kaël', text: 'Vous avez activé les pierres dans le bon ordre. Le passage s\'ouvre devant vous.' },
      { speaker: 'Kaël', text: 'La Fracture révèle un peu de ses secrets. Avancez avec prudence.' },
    ];
    this.dialogueSystem.startLineDialogue(successLines);
  }

  /**
   * Charge la sauvegarde depuis IndexedDB et restaure l'état du jeu.
   * Appelée au démarrage de la scène.
   */
  private async loadSave(): Promise<void> {
    const save = await this.saveService.loadGame();

    if (save) {
      // Restaurer la position de l'héroïne
      this.player.x = save.heroinePos?.x ?? this.player.x;
      this.player.y = save.heroinePos?.y ?? this.player.y;
      this.lastSavedPosition.set(this.player.x, this.player.y);

      // Restaurer l'état des objets interactifs activés
      this.activatedObjectIds = save.activatedStones ?? [];

      // Restaurer les encounters vaincus et les marquer comme déjà déclenchés
      this.defeatedEncounters = save.defeatedEncounters ?? [];
      for (const enemyId of this.defeatedEncounters) {
        this.encounterSystem.markEncounterDefeated(enemyId);
      }

      // Restaurer l'état visuel des runes déjà activées
      for (const [name, rune] of this.runeSprites) {
        if (this.activatedObjectIds.includes(name)) {
          rune.setTint(0x7a5c00);
        }
      }

      // Inform the puzzle system of previously activated stones
      this.puzzleSystem.restoreActivated(this.activatedObjectIds);

      console.log('[SaveService] Sauvegarde chargée (position restaurée).');
      this.saveLoaded = true;
    } else {
      // Aucune sauvegarde : nouvelle partie avec l'état par défaut
      this.activatedObjectIds = [];
      this.defeatedEncounters = [];
      console.log('[SaveService] Aucune sauvegarde trouvée, nouvelle partie.');
      this.saveLoaded = true;
    }
  }

  /**
   * Marque qu'une sauvegarde est nécessaire. La sauvegarde effective
   * est différée par update() pour respecter le throttle de 5 secondes.
   */
  private scheduleSave(): void {
    this.needsSave = true;
  }

  /**
   * Effectue la sauvegarde réelle si le délai minimal est écoulé.
   * Non bloquant : appelle SaveService.saveGame via une promesse.
   */
  private async performSave(): Promise<void> {
    try {
      const payload: GameSave = {
        heroinePos: { x: this.player.x, y: this.player.y },
        activatedStones: [...this.activatedObjectIds],
        defeatedEncounters: [...this.defeatedEncounters],
        dialogueProgress: 0, // À brancher avec DialogueSystem quand il sera persistable
        updatedAt: Date.now(),
      };
      await this.saveService.saveGame(payload);
      this.lastSaveTime = Date.now();
      this.lastSavedPosition.set(this.player.x, this.player.y);
      this.needsSave = false;
      console.log('[SaveService] Sauvegarde automatique effectuée.');
    } catch (error) {
      // Erreur logguée discrètement, le jeu continue
      console.error('[SaveService] Échec de la sauvegarde automatique:', error);
    }
  }

  // Direction dernière connue de l'héroïne (pour l'animation idle quand on s'arrête)
  private lastHeroineDir: string = 'down';

  update(time: number, delta: number): void {
    // If the orientation overlay is shown (portrait mode), the scene is paused
    // and no game logic should run.
    if (this.orientationOverlay && this.orientationOverlay.isOverlayVisible()) {
      return;
    }

    // Handle player movement
    // Bloquer le mouvement pendant un dialogue actif (T-027)
    const dialogueActive = this.dialogueSystem?.isDialogueActive?.() ?? false;
    const speed = dialogueActive ? 0 : 100;

    // Reset velocity
    this.player.body.setVelocity(0);

    // Movement driven by the virtual joystick (touch / mouse).
    // The vector is normalized so diagonals are not faster than cardinal directions.
    const input = this.joystick.getInput();
    const magnitude = Math.sqrt(input.x * input.x + input.y * input.y);

    if (magnitude > 0) {
      this.player.body.setVelocity(
        (input.x / magnitude) * speed,
        (input.y / magnitude) * speed
      );

      // Détermine la direction dominante pour l'animation de marche
      const dir = Math.abs(input.x) > Math.abs(input.y)
        ? (input.x > 0 ? 'right' : 'left')
        : (input.y > 0 ? 'down' : 'up');
      this.lastHeroineDir = dir;
      const animKey = `heroine-walk-${dir}`;
      if (this.player.anims.currentAnim?.key !== animKey) {
        this.player.anims.play(animKey);
      }
    } else {
      this.player.body.setVelocity(0, 0);
      // Animation idle dans la dernière direction
      const animKey = `heroine-idle-${this.lastHeroineDir}`;
      if (this.player.anims.currentAnim?.key !== animKey) {
        this.player.anims.play(animKey);
      }
    }

    // Update depth sorting: set depth based on Y position
    DepthSorter.setDepthFromY(this.depthGroup);

    // Update interaction system
    this.currentInteraction = this.interactionSystem.update();

    // Update encounter system: triggers combat when heroine approaches an enemy.
    // Bloqué tant que la sauvegarde n'a pas été restaurée (évite un combat avant le marquage des encounters vaincus).
    if (this.saveLoaded) {
      const triggeredEnemyId = this.encounterSystem.update();
      if (triggeredEnemyId) {
        this.startCombat(triggeredEnemyId);
      }
    }

    // Bouton A toujours visible (action contextuelle). Quand le joueur appuie sans
    // objet à portée, triggerInteraction() ne fait rien (gestion interne).
    if (!this.isActionButtonVisible) {
      this.actionButtonA.setButtonVisible(true);
      this.isActionButtonVisible = true;
    }

    // Auto-save trigger: displacement beyond threshold
    const currentPos = new Phaser.Math.Vector2(this.player.x, this.player.y);
    if (currentPos.distance(this.lastSavedPosition) > this.POSITION_SAVE_THRESHOLD) {
      this.scheduleSave();
    }

    // Throttled auto-save: at most once every SAVE_INTERVAL_MS
    if (this.needsSave && Date.now() - this.lastSaveTime > this.SAVE_INTERVAL_MS) {
      this.performSave();
    }
  }

  private triggerInteraction(): void {
    if (this.currentInteraction) {
      const id = this.currentInteraction.name;
      const name = this.currentInteraction.name;

      // Puzzle objects: notify the puzzle system (runic stones)
      if (this.currentInteraction.puzzle) {
        this.puzzleSystem.notifyActivation(id);
        // Mark the rune as activated visually
        const rune = this.runeSprites.get(name);
        if (rune) {
          rune.setTint(0x7a5c00);
        }
        // Bouton A reste visible (toujours affiché par design)
        return;
      }

      // Start dialogue based on the interacted object
      if (name === 'ancientStone') {
        this.dialogueSystem.startDialogue('ancientStone');
        // When the ancient stone dialogue ends, launch Kaël's dialogue
        this.events.once('dialogue-end', () => {
          const lines = this.cache.json.get('kaelDialogue') as
            | { speaker: string; text: string; portrait?: string }[]
            | undefined;
          if (lines) {
            this.dialogueSystem.startLineDialogue(lines);
          }
        });
      } else if (name === 'npcKael') {
        const lines = this.cache.json.get('level1KaelDialogue') as
          | { speaker: string; text: string; portrait?: string }[]
          | undefined;
        if (lines) {
          this.dialogueSystem.startLineDialogue(lines);
        }
      }
      // Mark the interacted object as activated and persist
      if (!this.activatedObjectIds.includes(id)) {
        this.activatedObjectIds.push(id);
      }
      this.scheduleSave();

      // Bouton A reste visible (toujours affiché par design)
    }
  }

  /**
   * Appelé par CombatScene à la fin d'un combat.
   * Marque l'ennemi comme vaincu en cas de victoire et affiche un message.
   * @param result - 'victory' ou 'defeat'
   * @param enemyId - Identifiant de l'ennemi combattu
   */
  async onCombatResult(result: 'victory' | 'defeat', enemyId?: string): Promise<void> {
    if (result === 'victory' && enemyId) {
      if (!this.defeatedEncounters.includes(enemyId)) {
        this.defeatedEncounters.push(enemyId);
      }
      this.encounterSystem.markEncounterDefeated(enemyId);
      try {
        await this.saveService.saveGame({
          heroinePos: { x: this.player.x, y: this.player.y },
          activatedStones: this.activatedObjectIds,
          defeatedEncounters: this.defeatedEncounters,
          dialogueProgress: 0,
          updatedAt: Date.now(),
        });
        console.log(`[SaveService] Ennemi vaincu enregistré: ${enemyId}`);
      } catch (error) {
        console.error('[SaveService] Échec de la persistance de la victoire:', error);
      }
    } else if (result === 'defeat' && enemyId) {
      // T-026: réinitialiser l'encounter pour permettre un nouveau combat
      this.encounterSystem.resetEncounterByEnemyId(enemyId);
      // Recul du joueur pour éviter un re-déclenchement immédiat
      const pushback = 64; // pixels
      if (this.player) {
        // Pousser dans la direction opposée au dernier déplacement (vers le bas par défaut)
        this.player.x -= pushback;
        this.player.y -= pushback;
      }
      console.log(`[ExplorationScene] Défaite contre ${enemyId} — encounter réinitialisé, recul du joueur.`);
    }
  }

  /**
   * Lance un combat contre l'ennemi référencé par enemyId.
   * Met en pause l'exploration, prépare les participants et ouvre CombatScene.
   * @param enemyId - Identifiant de l'ennemi (référence src/data/enemies/*.json)
   */
  private startCombat(enemyId: string): void {
    // Mémorise l'ennemi courant pour le marquer vaincu à la fin du combat (T-021)
    this.currentEncounterEnemyId = enemyId;

    // Récupère les données de l'ennemi depuis le cache JSON préchargé
    const enemyData = this.cache.json.get(`enemy${enemyId}`) as {
      id: string;
      name: string;
      side: string;
      maxHp: number;
      attack: number;
      defense: number;
      speed: number;
    } | undefined;

    if (!enemyData) {
      console.error(`[ExplorationScene] Données ennemies introuvables pour l'ID: ${enemyId}`);
      throw new Error(`Données ennemies introuvables pour l'ID: ${enemyId}`);
    }

    const enemyCombatant: Combatant = {
      id: enemyData.id,
      name: enemyData.name,
      side: enemyData.side as 'player' | 'enemy',
      maxHp: enemyData.maxHp,
      hp: enemyData.maxHp,
      attack: enemyData.attack,
      defense: enemyData.defense,
      speed: enemyData.speed,
      isAlive: true,
    };

    // Héroïne du joueur (valeurs par défaut V0.1, placeholder jusqu'à un système de héros persistant).
    // Remplace l'import de TestHero (fixture de test) qui ne doit pas rester en production.
    const heroCombatant: Combatant = {
      id: 'heroine-1',
      name: 'Héroïne',
      side: 'player',
      maxHp: 50,
      hp: 50,
      attack: 8,
      defense: 3,
      speed: 6,
      isAlive: true,
    };

    // Met en pause l'exploration pendant le combat
    this.scene.pause('exploration-scene');

    // Lance la scène de combat avec les deux participants
    this.scene.launch('combat-scene', {
      participants: [heroCombatant, enemyCombatant],
    });
  }
}