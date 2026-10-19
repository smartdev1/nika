# Contexte du projet

Ce document décrit le contexte général du projet « Les Échos de la Fracture ». Il doit être rempli par le Product Owner ou le tech-lead en début de projet.

## Client
À préciser (studio interne, éditeur, indépendant, commande spécifique, etc.)

## Objectif
Créer un jeu d'aventure narratif original mettant en avant l'exploration, la diversité des mondes et l'adaptation d'équipe à travers différentes époques et univers liés par une mystérieuse fracture.

## Contraintes techniques
- Développement en TypeScript avec Phaser 3
- Ciblage mobile (navigateurs mobiles, installation en tant que PWA)
- Mode paysage obligatoire (avec gestion de l'rotation de l'écran)
- Taille raisonnable pour téléchargement rapide (< 50 Mo idéalement)
- Fonctionnalité hors ligne grâce au mécanisme PWA
- Aucune dépendance extérieure non justifiée dans les messages de commit

## Stack technique retenue
- Langage : TypeScript
- Moteur de jeu : Phaser 3
- Outil de build : Vite
- PWA : vite-plugin-pwa
- Gestion des données locales : IndexedDB (via abstraction)
- Cartographie : Tiled (export JSON des niveaux)
- Audio : Formats web standards (mp3, ogg)
- Styles : CSS personnalisé

## Public cible
À préciser (ex. joueurs mobiles casual à moyen, fans de jeux d'aventure narratif comme les Zelda 2D ou les jeux point-and-click modernes, tranche d'âge souhaitée, etc.)

## Délais et jalons
À préciser (ex. :
- Version jouable minimale (clairière + héroïne + interactions de base) : [date]
- Première version complète avec un monde explorable : [date]
- Version bêta fermée : [date]
- Version complète prête pour publication : [date]
)

## Risques identifiés
À préciser et à mettre à jour régulièrement (ex. :
- Performance sur appareils bas de gamme
- Gestion de la complexité narrative avec augmentation du contenu
- Équilibrage du combat au tour par tour
- Intégration harmonieuse des différents mondes et leurs règles spécifiques
)

## Dépendances externes
- Aucune pour l'instant (tout le code sera développé spécifiquement pour ce projet)
- À revoir si des services externes deviennent nécessaires (classement, sauvegarde cloud, analytics, etc.)