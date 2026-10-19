# Les Échos de la Fracture — Héroïne pack v1

Pack original de sprites pixel-art générés pour démarrer l'intégration Phaser + Vite.

## Fichiers
- `spritesheets/heroine_walk.png` : 128×128, 4 frames × 4 directions.
- `spritesheets/heroine_idle.png` : 128×128, 4 frames × 4 directions.
- `spritesheets/heroine_attack.png` : 128×128, 4 frames × 4 directions.
- `spritesheets/heroine_hit.png` : 96×128, 3 frames × 4 directions.
- `spritesheets/heroine_dead.png` : 96×128, 3 frames × 4 directions.
- `spritesheets/heroine_special.png` : 128×128, 4 frames × 4 directions.
- `spritesheets/heroine_walk_all_directions.png` : 128×128, grille 4×4.
- `portraits/heroine_portrait.png` : portrait pixelisé 256×256.

Tous les spritesheets sont en PNG RGBA, avec fond transparent et cellules de 32×32 pixels.
Ordre des lignes : bas (`down`), gauche (`left`), droite (`right`), haut (`up`).
Les colonnes correspondent aux frames de l'animation.

## Important
Ces sprites constituent une base originale exploitable, mais le dessin est volontairement simple. Vérifie en jeu l'alignement, la silhouette et les transitions avant une production finale. Les poses sont générées procéduralement; ce n'est pas une animation dessinée image par image par un artiste.

## Intégration Phaser
Voir `phaser/heroine-anims.js`.
