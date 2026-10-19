// Depth sorting system for 2.5D effect
import Phaser from 'phaser';

export class DepthSorter {
  /**
   * Sorts the children of a group by their Y position in ascending order.
   * This ensures that objects with lower Y (higher on screen) are rendered first,
   * and objects with higher Y (lower on screen) are rendered later, creating
   * a proper depth perception where closer objects appear behind farther ones.
   * @param group - The Phaser Group containing sortable children
   */
  static sortByY(group: Phaser.GameObjects.Group): void {
    group.sort('y', Phaser.GameObjects.SORT_ASCENDING);
  }

  /**
   * Updates the depth of all children in a group based on their Y position.
   * This is an alternative to sorting the group; we explicitly set the depth
   * of each child to match its Y position (possibly with an offset).
   * @param group - The Phaser Group whose children depth should be updated
   * @param offset - Optional offset to add to the Y position when setting depth
   */
  static setDepthFromY(group: Phaser.GameObjects.Group, offset: number = 0): void {
    group.getChildren().forEach(child => {
      // Ensure the child has a y position (it should if it's a GameObject)
      if ((child as Phaser.GameObject).y !== undefined) {
        (child as Phaser.GameObject).setDepth((child as Phaser.GameObject).y + offset);
      }
    });
  }
}