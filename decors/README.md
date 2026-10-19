# Les Échos de la Fracture — environnement 32×32 (v1)

Contient les premiers assets originaux de prototype :
- sol : 24 tuiles en grille 6×4, cellule 32×32 ;
- obstacles : arbres, rochers, buissons, souches et débris ;
- objets interactifs : stèles, runes, cristaux, coffres, leviers, portails, rochers bloquants ;
- ennemis : sprites de test gobelin, squelette, chauve-souris et esprit ;
- UI : boutons A/B, panneaux, cœur, orbe, épée, bouclier, potion ;
- fond nocturne 960×540 ;
- exemple de préchargement Phaser.

## Intégration
Copier le dossier `ground`, `obstacles`, `interactive`, `enemies`, `ui`, `backgrounds` dans :
`public/assets/images/environment/`
Copier `phaser/preload-environment.js` dans le code source et appeler `preloadEnvironment(this)` dans `preload()`.

Les atlas de décor sont des PNG avec transparence. Les tuiles de sol sont des cellules 32×32 dans une image de 192×128. Pour une Tilemap Phaser complète, créer ensuite une map JSON Tiled ou convertir les tuiles en spritesheet avec index maîtrisés.

Note : pack prototype pixel-art procédural. Vérifier les transitions des sols, le découpage visuel et les collisions avant mise en production.
