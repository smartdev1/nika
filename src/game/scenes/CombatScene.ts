// Combat scene: turn-based combat UI overlay.
// Displays participants, HP bars, action menu, and drives CombatEngine.
// No business logic here — delegates attack/turn handling to CombatEngine.
import Phaser from 'phaser';
import { CombatEngine } from '../../systems/combat/CombatEngine';
import { TouchButton } from '../../controls/TouchButton';
import type { Combatant } from '../../types/index';

const PARTICIPANT_SIZE = 60; // placeholder sprite diameter
const HP_BAR_WIDTH = 120;
const HP_BAR_HEIGHT = 14;
const ENEMY_ATTACK_DELAY_MS = 800; // delay so the player can see results before enemy acts

interface ParticipantView {
  combatant: Combatant;
  container: Phaser.GameObjects.Container;
  sprite: Phaser.GameObjects.Graphics;
  hpBarBg: Phaser.GameObjects.Graphics;
  hpBarFill: Phaser.GameObjects.Graphics;
  hpText: Phaser.GameObjects.Text;
  nameText: Phaser.GameObjects.Text;
}

export default class CombatScene extends Phaser.Scene {
  private combatEngine!: CombatEngine;
  private participants: Combatant[] = [];
  private participantViews: Map<string, ParticipantView> = new Map();
  private heroId?: string;
  private currentEnemyId?: string;

  private actionButton!: TouchButton;
  private statusText!: Phaser.GameObjects.Text;
  private isProcessing = false;

  constructor() {
    super('combat-scene');
  }

  init(data: { participants: Combatant[] }): void {
    this.participants = data.participants ?? [];
    this.heroId = this.participants.find(p => p.side === 'player')?.id;
    this.currentEnemyId = this.participants.find(p => p.side === 'enemy')?.id;

    this.combatEngine = new CombatEngine();
    this.combatEngine.on('turn-change', (actor: import('../../types/index').Combatant) => this.onTurnChange(actor));
    this.combatEngine.on('attack', (result: { attackerId: string; targetId: string; damage: number; targetDefeated: boolean; targetHp: number }) => this.onAttackResolved(result));
    this.combatEngine.on('combat-end', (result: 'victory' | 'defeat') => this.onCombatEnd(result));
  }

  create(): void {
    this.events.once('shutdown', () => this.shutdown());

    const { width, height } = this.scale;

    // Dimmed background: reuse a dark tint so the world underneath is still vaguely visible.
    this.add.rectangle(0, 0, width, height, 0x000000, 0.55).setOrigin(0).setDepth(0);

    // Title
    this.add.text(width / 2, 60, 'COMBAT', {
      fontSize: '32px',
      color: '#ffffff',
      fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(10);

    // Status text (center, shows whose turn / action result)
    this.statusText = this.add.text(width / 2, 130, '', {
      fontSize: '18px',
      color: '#ffd700',
    }).setOrigin(0.5).setDepth(10);

    // Create participant views: player on the left, enemy on the right
    const centerY = height / 2 - 40;
    const playerX = width * 0.3;
    const enemyX = width * 0.7;

    for (const combatant of this.participants) {
      const isPlayer = combatant.side === 'player';
      const x = isPlayer ? playerX : enemyX;
      const color = isPlayer ? 0x4a90e2 : 0xe24a4a;
      this.createParticipantView(combatant, x, centerY, color);
    }

    // Action menu at the bottom
    const btnY = height - 110;
    this.actionButton = new TouchButton(this, {
      x: width / 2,
      y: btnY,
      width: 220,
      height: 60,
      label: 'Attaque',
      onPress: () => this.onPlayerAttack(),
      depth: 100,
      circular: false,
      bgColor: 0x2e7d32,
      pressedBgColor: 0x1b5e20,
    });
    this.add.existing(this.actionButton);
    this.actionButton.setButtonVisible(false);
    this.actionButton.setButtonEnabled(false);

    // Start combat (events are wired via this.combatEngine.on() in init())
    this.combatEngine.startCombat({
      participants: this.participants,
    });
  }

  private createParticipantView(combatant: Combatant, x: number, y: number, color: number): void {
    const container = this.add.container(x, y).setDepth(10);

    // Placeholder sprite: colored circle drawn with Graphics (so we can change its color later).
    const sprite = this.add.graphics();
    sprite.fillStyle(color, 1);
    sprite.fillCircle(0, 0, PARTICIPANT_SIZE / 2);
    container.add(sprite);

    // Name label above the sprite
    const nameText = this.add.text(0, -PARTICIPANT_SIZE / 2 - 24, combatant.name, {
      fontSize: '16px',
      color: '#ffffff',
    }).setOrigin(0.5);
    container.add(nameText);

    // HP bar background (red)
    const hpBarBg = this.add.graphics();
    hpBarBg.fillStyle(0x330000, 1);
    hpBarBg.fillRect(-HP_BAR_WIDTH / 2, -PARTICIPANT_SIZE / 2 - 52, HP_BAR_WIDTH, HP_BAR_HEIGHT);
    container.add(hpBarBg);

    // HP bar fill (green)
    const hpBarFill = this.add.graphics();
    hpBarFill.fillStyle(0x4caf50, 1);
    const hpRatio = combatant.hp / combatant.maxHp;
    hpBarFill.fillRect(-HP_BAR_WIDTH / 2, -PARTICIPANT_SIZE / 2 - 52, HP_BAR_WIDTH * hpRatio, HP_BAR_HEIGHT);
    container.add(hpBarFill);

    // HP text
    const hpText = this.add.text(0, -PARTICIPANT_SIZE / 2 - 36, `${combatant.hp}/${combatant.maxHp}`, {
      fontSize: '14px',
      color: '#ffffff',
    }).setOrigin(0.5);
    container.add(hpText);

    this.participantViews.set(combatant.id, {
      combatant,
      container,
      hpBarBg,
      hpBarFill,
      hpText,
      nameText,
      sprite,
    });
  }

  private updateParticipantViews(): void {
    // Lire les données à jour depuis le moteur : CombatEngine stocke des copies
    // des participants et les modifie (PV, isAlive). Les références stockées dans
    // participantViews pointent vers les objets originaux (figés) passés en init().
    const engineParticipants = this.combatEngine.getParticipants();
    for (const [id, view] of this.participantViews) {
      const c = engineParticipants.find((p) => p.id === id);
      if (!c) {
        continue;
      }
      const hpRatio = c.hp / c.maxHp;
      view.hpBarFill.clear();
      view.hpBarFill.fillStyle(0x4caf50, 1);
      view.hpBarFill.fillRect(-HP_BAR_WIDTH / 2, -PARTICIPANT_SIZE / 2 - 52, HP_BAR_WIDTH * hpRatio, HP_BAR_HEIGHT);
      view.hpText.setText(`${c.hp}/${c.maxHp}`);

      // Change circle color when dead (gray) or alive (side color)
      view.sprite.clear();
      view.sprite.fillStyle(c.isAlive ? (c.side === 'player' ? 0x4a90e2 : 0xe24a4a) : 0x555555, 1);
      view.sprite.fillCircle(0, 0, PARTICIPANT_SIZE / 2);

      if (!c.isAlive) {
        view.nameText.setAlpha(0.5);
      }
    }
  }

  private onTurnChange(actor: Combatant): void {
    // Reset processing flag at the start of each turn so the next actor can act.
    this.isProcessing = false;

    this.statusText.setText(`Tour de ${actor.name}`);

    if (actor.id === this.heroId) {
      // Player's turn: enable the attack button
      this.actionButton.setButtonVisible(true);
      this.actionButton.setButtonEnabled(true);
    } else {
      // Enemy's turn: hide button, schedule automatic attack
      this.actionButton.setButtonVisible(false);
      this.actionButton.setButtonEnabled(false);
      this.isProcessing = true;
      this.time.delayedCall(ENEMY_ATTACK_DELAY_MS, () => {
        this.isProcessing = false;
        if (this.combatEngine.getIsActive() && this.combatEngine.getCurrentActor()?.id === actor.id) {
          this.combatEngine.attack(actor.id, this.heroId ?? '');
        }
      });
    }
  }

  private onPlayerAttack(): void {
    if (!this.heroId || !this.currentEnemyId) return;
    if (this.isProcessing) return;

    this.isProcessing = true;
    this.actionButton.setButtonEnabled(false);
    this.statusText.setText(`${this.participantViews.get(this.heroId)?.combatant.name} attaque !`);

    const result = this.combatEngine.attack(this.heroId, this.currentEnemyId);
    if (result) {
      this.onAttackResolved(result);
    }
  }

  private onAttackResolved(result: { attackerId: string; targetId: string; damage: number; targetDefeated: boolean; targetHp: number }): void {
    this.updateParticipantViews();

    const attacker = this.participantViews.get(result.attackerId)?.combatant.name ?? '?';
    const target = this.participantViews.get(result.targetId)?.combatant.name ?? '?';

    if (result.targetDefeated) {
      this.statusText.setText(`${target} est vaincu !`);
    } else {
      this.statusText.setText(`${attacker} inflige ${result.damage} dégâts à ${target} (${result.targetHp} PV restants).`);
    }

    // isProcessing stays true until the next turn-change event re-enables UI.
    // CombatEngine.attack() already calls endTurn() if combat is still active.
  }

  private onCombatEnd(result: 'victory' | 'defeat'): void {
    this.isProcessing = true;
    this.actionButton.setButtonVisible(false);
    this.actionButton.setButtonEnabled(false);

    this.statusText.setText(result === 'victory' ? 'Victoire !' : 'Défaite…');
    this.statusText.setColor(result === 'victory' ? '#4caf50' : '#ff5252');

    // Return to exploration after a short delay
    this.time.delayedCall(2000, () => {
      // Signale le résultat à ExplorationScene avant de reprendre l'exploration (T-021)
      const exploration = this.scene.get('exploration-scene') as {
        onCombatResult?: (result: 'victory' | 'defeat', enemyId?: string) => void;
      };
      exploration.onCombatResult?.(result, this.currentEnemyId);

      this.scene.stop('combat-scene');
      // ExplorationScene is already running in the background; just resume it.
      this.scene.resume('exploration-scene');
    });
  }

  override shutdown(): void {
    // Clean up CombatEngine listeners and references
    this.combatEngine.removeAllListeners();
    this.combatEngine.endCombat();
    this.participantViews.clear();
  }

  override destroy(): void {
    super.destroy();
  }
}
