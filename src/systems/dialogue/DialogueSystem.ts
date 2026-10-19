// Dialogue system for handling conversations and narratives
import Phaser from 'phaser';

export interface DialogueNode {
  id: string;
  text: string;
  speaker?: string; // Name of the speaker, null for narrator
  portrait?: string; // Key for portrait image
  options?: DialogueOption[]; // Choices for branching
  next?: string; // ID of next node if no choices
  end?: boolean; // Whether this node ends the dialogue
}

export interface DialogueOption {
  text: string;
  next: string; // ID of node to go to if this option is chosen
  condition?: () => boolean; // Optional condition to show/hide option
}

/**
 * Single line of a linear dialogue (used for NPC dialogues like Kaël).
 */
export interface DialogueLine {
  speaker: string; // Name of the speaker
  text: string; // Dialogue text
  portrait?: string; // Key for portrait image (placeholder drawn if not loaded)
}

export interface Dialogue {
  id: string;
  startNode: string;
  nodes: Record<string, DialogueNode>;
}

export class DialogueSystem {
  private scene: Phaser.Scene;
  private currentDialogue: Dialogue | null = null;
  private currentNode: DialogueNode | null = null;
  private isActive: boolean = false;
  private dialogueContainer!: Phaser.GameObjects.Container;
  private dialogueText!: Phaser.GameObjects.Text;
  private speakerText!: Phaser.GameObjects.Text;
  private continueButton!: Phaser.GameObjects.Container;
  private optionsContainer!: Phaser.GameObjects.Container;

  // Linear dialogue mode (NPC dialogues like Kaël)
  private currentLines: DialogueLine[] = [];
  private currentLineIndex: number = 0;
  private dialogueMode: 'node' | 'line' = 'node';
  private portraitGraphic!: Phaser.GameObjects.Graphics;
  private onDialogueComplete?: () => void;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.createDialogueUI();
  }

  private createDialogueUI(): void {
    // Create container for dialogue box
    this.dialogueContainer = this.scene.add.container(0, 0);
    this.dialogueContainer.setVisible(false);

    // Background box using Graphics for rounded rectangle
    const padding = 20;
    const boxWidth = this.scene.cameras.main.width - padding * 2;
    const boxHeight = 150;
    const boxX = this.scene.cameras.main.width / 2;
    const boxY = this.scene.cameras.main.height - boxHeight / 2 - padding;

    const bg = this.scene.add.graphics();
    bg.fillStyle(0x000000, 0.8);
    // Draw the rectangle centered at 0,0
    bg.fillRoundedRect(-boxWidth/2, -boxHeight/2, boxWidth, boxHeight, 10);
    // Position the graphics object at the center of the container
    bg.setPosition(0, 0);
    this.dialogueContainer.add(bg);
    // Position the container at the desired location
    this.dialogueContainer.setPosition(boxX, boxY);

    // Speaker text (if applicable)
    this.speakerText = this.scene.add.text(-boxWidth / 2 + 110, -boxHeight / 2 + 10, '', {
      fontSize: '18px',
      color: '#ffd700',
      fontStyle: 'bold'
    }).setOrigin(0, 0.5);
    this.dialogueContainer.add(this.speakerText);

    // Dialogue text
    this.dialogueText = this.scene.add.text(-boxWidth / 2 + 110, -boxHeight / 2 + 30, '', {
      fontSize: '20px',
      color: '#ffffff',
      wordWrap: { width: boxWidth - 150 }
    }).setOrigin(0, 0.5);
    this.dialogueContainer.add(this.dialogueText);

    // Portrait placeholder (drawn circle with speaker initial), positioned left of the text
    this.portraitGraphic = this.scene.add.graphics();
    this.portraitGraphic.setPosition(-boxWidth / 2 + 50, 0);
    this.dialogueContainer.add(this.portraitGraphic);

    // Continue button (for when there are no options)
    this.createContinueButton(boxWidth, boxHeight);

    // Options container (for choices)
    this.optionsContainer = this.scene.add.container(0, 0);
    this.dialogueContainer.add(this.optionsContainer);

    // Position the container
    this.dialogueContainer.setPosition(boxX, boxY);
  }

  private createContinueButton(boxWidth: number, boxHeight: number): void {
    this.continueButton = this.scene.add.container(0, 0);
    this.continueButton.setVisible(false);

    const buttonWidth = 120;
    const buttonHeight = 40;
    const buttonBg = this.scene.add.graphics();
    buttonBg.fillStyle(0x000000, 0.7);
    // Draw the rectangle centered at 0,0
    buttonBg.fillRoundedRect(-buttonWidth/2, -buttonHeight/2, buttonWidth, buttonHeight, 10);
    // Position the graphics object at the center of the button
    buttonBg.setPosition(0, 0);
    this.continueButton.add(buttonBg);

    const buttonText = this.scene.add.text(0, 0, 'Continuer', {
      fontSize: '18px',
      color: '#ffffff'
    }).setOrigin(0.5);
    this.continueButton.add(buttonText);

    // Position at bottom-right of dialogue box
    this.continueButton.setPosition(
      boxWidth/2 - buttonWidth/2 - 20,
      boxHeight/2 - buttonHeight/2 - 20
    );

    // Make interactive
    this.continueButton.setSize(buttonWidth, buttonHeight);
    this.continueButton.setInteractive({ useHandCursor: true });
    this.continueButton.on('pointerdown', () => {
      this.continueDialogue();
    });

    // Hover effects
    this.continueButton.on('pointerover', () => {
      // We need to recreate the graphics for hover effect
      buttonBg.clear();
      buttonBg.fillStyle(0x000000, 0.8);
      buttonBg.fillRoundedRect(0, 0, buttonWidth, buttonHeight, 10);
    });
    this.continueButton.on('pointerout', () => {
      // Reset to normal state
      buttonBg.clear();
      buttonBg.fillStyle(0x000000, 0.7);
      buttonBg.fillRoundedRect(0, 0, buttonWidth, buttonHeight, 10);
    });

    this.dialogueContainer.add(this.continueButton);
  }

  /**
   * Start a dialogue by its ID
   * @param dialogueId - The ID of the dialogue to start
   */
  startDialogue(dialogueId: string): void {
    // Linear dialogue loaded from JSON cache (e.g. Kaël's dialogue)
    if (dialogueId === 'kael') {
      const lines = this.scene.cache.json.get('kaelDialogue') as DialogueLine[] | undefined;
      if (lines) {
        this.startLineDialogue(lines);
        return;
      }
      console.warn('[DialogueSystem] Dialogue "kael" not found in cache. Preload it first.');
      return;
    }

    if (dialogueId === 'ancientStone') {
      this.currentDialogue = this.createAncientStoneDialogue();
    } else {
      console.warn(`Dialogue with ID ${dialogueId} not found`);
      return;
    }

    if (this.currentDialogue) {
      this.dialogueMode = 'node';
      this.currentNode = this.currentDialogue.nodes[this.currentDialogue.startNode];
      this.isActive = true;
      this.dialogueContainer.setVisible(true);
      this.updateDialogueDisplay();
    }
  }

  /**
   * Start a linear dialogue from an array of lines (speaker + text + optional portrait).
   * Each line is shown sequentially; the player advances with the Continue button or a tap.
   * @param lines - Array of dialogue lines
   * @param onComplete - Optional callback invoked when the dialogue ends
   */
  startLineDialogue(lines: DialogueLine[], onComplete?: () => void): void {
    this.dialogueMode = 'line';
    this.currentLines = lines;
    this.currentLineIndex = 0;
    this.onDialogueComplete = onComplete;
    this.isActive = true;
    this.dialogueContainer.setVisible(true);
    this.updateDialogueDisplay();
  }

  /**
   * Create the dialogue for the ancient stone interaction
   */
  private createAncientStoneDialogue(): Dialogue {
    return {
      id: 'ancientStone',
      startNode: 'start',
      nodes: {
        start: {
          id: 'start',
          text: 'Vous touchez la pierre ancienne. Une étrange vibration parcours votre main.',
          speaker: null,
          next: 'response1'
        },
        response1: {
          id: 'response1',
          text: 'Des images fugaces traversent votre esprit : une forêt luxuriante, un cristal brillant, puis... l obscurité.',
          speaker: null,
          options: [
            {
              text: 'Continuer à toucher la pierre',
              next: 'option1a'
            },
            {
              text: 'Retirer votre main',
              next: 'option1b'
            }
          ]
        },
        option1a: {
          id: 'option1a',
          text: 'Vous décidez de maintenir le contact. La pierre devient plus chaude sous votre paume.',
          speaker: null,
          next: 'end'
        },
        option1b: {
          id: 'option1b',
          text: 'Vous retirez brusquement votre main. La pierre cesse de vibrer.',
          speaker: null,
          next: 'end'
        },
        end: {
          id: 'end',
          text: 'La pierre retourne à son état ordinaire. Vous avez ressenti quelque chose d ancien et de puissant.',
          speaker: null,
          end: true
        }
      }
    };
  }

  /**
   * Continue to the next dialogue node (used when there are no choices)
   */
  private continueDialogue(): void {
    // Linear dialogue mode: advance to the next line
    if (this.dialogueMode === 'line') {
      this.currentLineIndex++;
      if (this.currentLineIndex < this.currentLines.length) {
        this.updateDialogueDisplay();
      } else {
        this.endDialogue();
      }
      return;
    }

    if (!this.currentNode || !this.currentDialogue) return;

    if (this.currentNode.end) {
      this.endDialogue();
      return;
    }

    const nextNodeId = this.currentNode.next;
    if (nextNodeId && this.currentDialogue.nodes[nextNodeId]) {
      this.currentNode = this.currentDialogue.nodes[nextNodeId];
      this.updateDialogueDisplay();
    } else {
      // No next node defined, end dialogue
      this.endDialogue();
    }
  }

  /**
   * Select a dialogue option
   * @param optionIndex - Index of the selected option
   */
  selectOption(optionIndex: number): void {
    if (!this.currentNode || !this.currentOptions || optionIndex < 0 || optionIndex >= this.currentOptions.length) {
      return;
    }

    const selectedOption = this.currentOptions[optionIndex];
    // Check condition if exists
    if (selectedOption.condition && !selectedOption.condition()) {
      return; // Option not available
    }

    // Hide options
    this.hideOptions();

    // Navigate to next node
    const nextNodeId = selectedOption.next;
    if (nextNodeId && this.currentDialogue?.nodes[nextNodeId]) {
      this.currentNode = this.currentDialogue.nodes[nextNodeId];
      this.updateDialogueDisplay();
    } else {
      this.endDialogue();
    }
  }

  private currentOptions: DialogueOption[] = [];

  private updateDialogueDisplay(): void {
    // Linear dialogue mode: show the current line
    if (this.dialogueMode === 'line') {
      if (this.currentLineIndex >= this.currentLines.length) {
        this.endDialogue();
        return;
      }

      const line = this.currentLines[this.currentLineIndex];

      this.speakerText.setText(line.speaker);
      this.speakerText.setVisible(true);

      this.dialogueText.setText(line.text);

      this.drawPortrait(line.portrait);

      this.continueButton.setVisible(true);
      this.hideOptions();
      return;
    }

    if (!this.currentNode) return;

    // Update speaker text
    if (this.currentNode.speaker) {
      this.speakerText.setText(this.currentNode.speaker);
      this.speakerText.setVisible(true);
    } else {
      this.speakerText.setVisible(false);
    }

    // Update dialogue text
    this.dialogueText.setText(this.currentNode.text);

    // Show/hide continue button based on whether we have options
    if (this.currentNode.options && this.currentNode.options.length > 0) {
      this.continueButton.setVisible(false);
      this.showOptions();
    } else {
      this.continueButton.setVisible(true);
      this.hideOptions();
    }
  }

  private showOptions(): void {
    if (!this.currentNode || !this.currentNode.options) return;

    this.currentOptions = this.currentNode.options.filter(option => {
      return !option.condition || option.condition();
    });

    // Clear previous options
    this.optionsContainer.removeAll(true);

    if (this.currentOptions.length === 0) {
      this.continueButton.setVisible(true);
      return;
    }

    const optionSpacing = 50;
    // Use a fixed starting position since we don't know the container height yet
    const startY = -((this.currentOptions.length - 1) * optionSpacing) / 2;

    this.currentOptions.forEach((option, index) => {
      const optionContainer = this.scene.add.container(0, index * optionSpacing + startY);

      // Option background (invisible but interactive) using Graphics
      const optionBg = this.scene.add.graphics();
      optionBg.fillStyle(0x000000, 0.3);
      // Draw rectangle centered at 0,0
      optionBg.fillRoundedRect(-250, -20, 500, 40, 5);
      optionContainer.add(optionBg);

      // Option text
      const optionText = this.scene.add.text(0, 0, option.text, {
        fontSize: '18px',
        color: '#cccccc'
      }).setOrigin(0.5);
      optionContainer.add(optionText);

      // Make interactive
      optionContainer.setSize(500, 40);
      optionContainer.setInteractive({ useHandCursor: true });
      optionContainer.on('pointerdown', () => {
        this.selectOption(index);
      });

      // Hover effects
      optionContainer.on('pointerover', () => {
        // Recreate graphics for hover effect
        optionBg.clear();
        optionBg.fillStyle(0x000000, 0.5);
        // Draw rectangle centered at 0,0
        optionBg.fillRoundedRect(-250, -20, 500, 40, 5);
        optionText.setColor('#ffffff');
      });
      optionContainer.on('pointerout', () => {
        // Reset to normal state
        optionBg.clear();
        optionBg.fillStyle(0x000000, 0.3);
        // Draw rectangle centered at 0,0
        optionBg.fillRoundedRect(-250, -20, 500, 40, 5);
        optionText.setColor('#cccccc');
      });

      this.optionsContainer.add(optionContainer);
    });
  }

  private hideOptions(): void {
    this.optionsContainer.removeAll(true);
    this.currentOptions = [];
  }

  /**
   * Draws the speaker portrait as a colored circle with an optional gold frame.
   * Falls back to a neutral circle if no key is provided or the texture is missing.
   */
  private drawPortrait(portraitKey?: string): void {
    this.portraitGraphic.clear();
    if (!portraitKey) {
      this.portraitGraphic.fillStyle(0x444444, 0.8);
      this.portraitGraphic.fillCircle(0, 0, 30);
      this.portraitGraphic.lineStyle(2, 0xffffff, 0.5);
      this.portraitGraphic.strokeCircle(0, 0, 30);
      return;
    }

    const texture = this.scene.textures.get(portraitKey);
    if (texture) {
      this.portraitGraphic.fillStyle(0xffffff, 1);
      this.portraitGraphic.fillCircle(0, 0, 30);
      this.portraitGraphic.lineStyle(3, 0xffd700, 1);
      this.portraitGraphic.strokeCircle(0, 0, 30);
    } else {
      this.portraitGraphic.fillStyle(0x444444, 0.8);
      this.portraitGraphic.fillCircle(0, 0, 30);
      this.portraitGraphic.lineStyle(2, 0xff0000, 0.5);
      this.portraitGraphic.strokeCircle(0, 0, 30);
    }
  }

  private endDialogue(): void {
    this.isActive = false;
    this.dialogueContainer.setVisible(false);
    this.currentDialogue = null;
    this.currentNode = null;
    this.currentLines = [];
    this.currentLineIndex = 0;
    const onComplete = this.onDialogueComplete;
    this.onDialogueComplete = undefined;
    this.dialogueMode = 'node';
    this.scene.events.emit('dialogue-end');
    if (onComplete) {
      onComplete();
    }
  }

  /**
   * Check if dialogue is currently active
   */
  isDialogueActive(): boolean {
    return this.isActive;
  }

  /**
   * Skip current dialogue (useful for cutting scenes short)
   */
  skipDialogue(): void {
    this.endDialogue();
  }
}