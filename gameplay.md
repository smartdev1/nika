# 1. Architecture générale

Application web / PWA

Navigateur mobile · écran paysage · installation à l'accueil

Phaser 3 + TypeScript

Scènes, caméra, sprites, collisions, animations et commandes

Monde

Carte, profondeur, zones, interactions

Narration

Dialogues, quêtes, choix, événements

Gameplay

Combat, équipe, compétences, objets

Persistance

Sauvegardes, options et progression

Données locales et ressources

Cartes, images, dialogues, audio et sauvegardes IndexedDB

Le principe architectural le plus important sera de séparer les règles du jeu de leur représentation visuelle. Par exemple, une quête ne doit pas dépendre directement de la position d'un sprite à l'écran. Cela facilitera les modifications, les sauvegardes et l'ajout de nouveaux mondes.

## 2. Structure initiale du projet

Je partirais sur une architecture modulaire, mais pas sur une architecture excessivement complexe. Pas de microservices, pas de backend, pas de framework d'interface supplémentaire au départ.

Voici la structure que je recommande :

text
```
fracture-adventure/
├── public/
│   ├── icons/
│   │   ├── pwa-192.png
│   │   └── pwa-512.png
│   └── assets/
│       ├── images/
│       └── audio/
│
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
│   │
│   ├── systems/
│   │   ├── dialogue/
│   │   ├── quests/
│   │   ├── combat/
│   │   ├── inventory/
│   │   └── party/
│   │
│   ├── controls/
│   │   ├── VirtualJoystick.ts
│   │   └── TouchButtons.ts
│   │
│   ├── data/
│   │   ├── characters/
│   │   ├── dialogues/
│   │   ├── quests/
│   │   └── worlds/
│   │
│   ├── save/
│   │   ├── SaveService.ts
│   │   └── SaveSchema.ts
│   │
│   ├── ui/
│   │   ├── OrientationOverlay.ts
│   │   └── game.css
│   │
│   └── types/
│       └── index.ts
│
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

Cette structure sépare le rendu du jeu, les règles, les données et les commandes. Les scènes Phaser sont adaptées à la séparation du menu, du chargement et des niveaux.

Phaser Help

Nous n'avons pas besoin de remplir tous ces dossiers immédiatement : certains systèmes seront ajoutés seulement lorsqu'ils deviendront nécessaires.

## 3. Le point technique le plus important : la profondeur

Pour obtenir une vue oblique convaincante, je recommande de dessiner les décors en perspective et de calculer la profondeur des personnages en fonction de leur position verticale dans le monde.

Par exemple, la carte pourrait contenir :

- un sol peint ou composé de tuiles ;
- des zones de collision invisibles pour les arbres et les rochers ;
- des points d'interaction pour les portes et les objets ;
- des éléments de décor placés devant ou derrière le personnage.

Le moteur doit pouvoir afficher un arbre devant l'héroïne lorsque celle-ci passe derrière son tronc, puis la replacer devant lorsqu'elle ressort.

### Principe de rendu

Décor arrière

Cimes, ciel, arbres éloignés

Sol et collisions

Chemins, zones praticables et obstacles

Tri de profondeur dynamique

Héroïne, PNJ, troncs et objets mobiles

Interface au premier plan

Joystick, action, dialogues et menus

Nous pourrons utiliser [Tiled](<https://www.mapeditor.org/?utm_source=chatgpt.com>) pour construire les cartes et exporter leurs données en JSON. Tiled prend en charge plusieurs orientations de carte et les calques d'objets, pratiques pour décrire les interactions et les zones de collision.

Tiled 1.12.2 documentation

+1

Ma recommandation : même si la perspective est oblique, ne cherchons pas à simuler une vraie géométrie 3D. Une carte 2D avec un tri de profondeur maîtrisé sera plus facile à produire et à optimiser sur téléphone.

## 4. Initialiser le projet

Pour démarrer, nous utiliserons Node.js et npm. Je recommande une version de Node.js compatible avec les versions actuelles de Vite et de `vite-plugin-pwa` ; la documentation du plugin indique notamment Node 20.19 ou plus récent pour sa version 2.

GitHub

Dans un terminal :

bash
```
npm create vite@latest fracture-adventure -- --template vanilla-ts
cd fracture-adventure

npm install
npm install phaser
npm install -D vite-plugin-pwa

npm run dev
```

Nous avons maintenant un projet TypeScript fonctionnel, prêt à recevoir le moteur de jeu.

### Configuration de la PWA

Dans `vite.config.ts`, nous configurerons le plugin PWA pour générer le manifeste et le service worker :

ts
```
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    VitePWA({
      registerType: 'prompt',
      includeAssets: ['icons/pwa-192.png'],
      manifest: {
        name: 'Les Échos de la Fracture',
        short_name: 'La Fracture',
        description: 'Une aventure entre plusieurs mondes.',
        theme_color: '#17251d',
        background_color: '#101a15',
        display: 'standalone',
        orientation: 'landscape',
        start_url: '/',
        icons: [
          {
            src: '/icons/pwa-192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/icons/pwa-512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ]
});
```

Il faudra créer les deux icônes indiquées avant de tester l'installation. Le plugin gère la génération du service worker et la mise en cache des ressources selon sa configuration.

Vite PWA

Le mode `prompt` permet de prévoir une demande de mise à jour lorsqu'une nouvelle version du jeu est disponible. Nous pourrons ensuite ajouter un écran d'installation adapté à notre interface.

Attention : le manifeste déclarant le paysage ne suffit pas à imposer l'orientation sur tous les téléphones. Nous conserverons donc un écran de rotation dans le jeu.

## 5. Première scène jouable

Je commencerais avec une scène unique, `ExplorationScene`, plutôt que de créer immédiatement tous les systèmes prévus.

Dans `src/game/config.ts` :

ts
```
import Phaser from 'phaser';
import { ExplorationScene } from './scenes/ExplorationScene';

export const gameConfig: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'game',
  backgroundColor: '#17251d',
  width: 960,
  height: 540,

  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },

  physics: {
    default: 'arcade',
    arcade: {
      debug: false
    }
  },

  scene: [ExplorationScene]
};
```

Puis dans `src/main.ts` :

ts
```
import Phaser from 'phaser';
import { gameConfig } from './game/config';
import './ui/game.css';

new Phaser.Game(gameConfig);
```

Le mode `FIT` permet d'adapter le canvas à l'espace disponible en conservant ses proportions. Nous pourrons affiner ce comportement en fonction des écrans mobiles.

Phaser Help

Dans `index.html`, il faudra également prévoir un conteneur :

HTMLActiver le retour à la ligneCopier le codePrévisualiser

```
<div id="game"></div>
```

Et dans `src/ui/game.css` :

css
```
html,
body,
#game {
  width: 100%;
  height: 100%;
  margin: 0;
  overflow: hidden;
}

body {
  background: #101a15;
  touch-action: none;
}

canvas {
  display: block;
}
```

Ce code constitue uniquement le socle du rendu. Il ne crée pas encore la forêt ni les commandes tactiles.

## 6. La première version que nous allons réellement construire

Create Pixel 2D Tile Map with Diverse Textures | AI Art Generator | Easy-Peasy.AI

Étape 1 — La clairière

Créer une petite carte avec un chemin, des arbres, des rochers et une zone explorable. La priorité est de valider la perspective et la profondeur.

Dream Hollow su Steam

Étape 2 — L'héroïne

Ajouter son sprite, ses animations de déplacement, les collisions et une caméra qui la suit.

《16对战平台》官网- 专业的Dota对战平台

Étape 3 — La première interaction

Placer une pierre ancienne. Lorsque l'héroïne s'approche, le bouton Action apparaît et déclenche un événement narratif.

Oceanhorn, a "Zelda-inspired" iOS game

Étape 4 — Le téléphone

Ajouter le joystick virtuel, les boutons tactiles, l'écran de rotation et les contrôles de redimensionnement.

Nous ajouterons ensuite une première sauvegarde locale, puis le dialogue avec Kaël et une petite énigme. Le combat au tour par tour viendra après validation du déplacement et des interactions.

## 7. Comment valider le prototype

Je retiendrais quatre critères avant de développer davantage :

- L'héroïne se déplace correctement dans les huit directions, sans traverser les obstacles.
- Les arbres passent visuellement devant ou derrière elle au bon moment.
- Les commandes restent confortables sur un véritable écran tactile en paysage.
- Le jeu peut être installé comme PWA et retrouve correctement sa progression après fermeture et réouverture.

Le mode hors connexion devra être testé séparément : la mise en cache du jeu et la sauvegarde de la progression sont deux mécanismes différents.

La prochaine étape concrète est donc de réaliser la clairière jouable. C'est le meilleur moyen de vérifier notre choix technique avant d'investir dans les graphismes définitifs, les cinq compagnons et les différents mondes. Une fois cette base validée, nous pourrons développer le reste sur une architecture stable, sans construire prématurément des systèmes dont nous ne connaissons pas encore les besoins exacts.