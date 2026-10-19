# Conventions de développement

Ce document regroupe les conventions de nommage, d'architecture et de code suivies dans ce projet.

## Conventions de nommage

### Fichiers et dossiers
- Utiliser le kebab-case pour les fichiers et dossiers (ex. `nom-du-fichier.ts`, `dossier-de-code/`)
- Les dossiers principaux sont en lowercase (ex. `src/`, `docs/`, `public/`)

### Variables et fonctions (TypeScript)
- Utiliser le camelCase pour les variables et fonctions (ex. `nomVariable`, `calculerValeur()`)
- Les constantes en UPPER_SNAKE_CASE (ex. `TAUX_DE_REUSSITE`, `CONFIGURATION_DEFAUT`)
- Les interfaces en PascalCase avec un préfixe I optionnel (ex. `ICharacter`, `GameConfig`)
- Les classes en PascalCase (ex. `PlayerCharacter`, `CombatSystem`)

### Événements et messages
- Utiliser le camelCase pour les noms d'événements (ex. `onCharacterMove`, `handleCombatEnd`)

## Conventions d'architecture

### Séparation des préoccupations
- **Rendu** : Tout ce qui relève de Phaser (scenes, sprites, animations) reste dans `src/game/`
- **Logique de jeu** : Les systèmes de jeu (combat, dialogue, inventaire, etc.) sont dans `src/systems/`
- **Données** : Les données statiques (personnages, dialogues, quêtes, mondes) sont dans `src/data/`
- **Sauvegarde** : La persistance et la gestion des états de jeu sont dans `src/save/`
- **Contrôles** : Les systèmes d'entrée (joystick virtuel, boutons tactiles) sont dans `src/controls/`
- **Utilitaires** : Les fonctions transversales sont dans `src/utils/` (à créer si nécessaire)
- **Types** : Les interfaces et types partagés sont dans `src/types/`
- **UI/UX** : Les éléments d'interface et les styles sont dans `src/ui/`

### Communication entre systèmes
- Les systèmes ne doivent pas accéder directement aux scènes Phaser
- Utiliser des événements ou un bus d'événements pour la communication inter-systèmes
- Les données de jeu doivent passer par des interfaces bien définies

## Conventions de code

### TypeScript
- Activer le mode strict dans tsconfig.json
- Utiliser des interfaces/types pour définir clairement les formes des données
- Éviter le type `any` autant que possible
- Documenter les fonctions publiques avec JSDoc

### Commentaires
- Les commentaires doivent expliquer le pourquoi, pas le quoi
- Justifier les choix techniques non triviaux dans les commentaires ou les messages de commit
- Utiliser TODO: pour les améliorations futures et FIXME: pour les problèmes connus

### Git et commits
- Utiliser les Conventional Commits :
  - feat: pour une nouvelle fonctionnalité
  - fix: pour une correction de bug
  - refactor: pour une refactorisation sans changement de comportement
  - test: pour l'ajout ou la modification de tests
  - docs: pour les changements de documentation
  - chore: pour les tâches de maintenance
- Les messages de commit doivent être en anglais
- Jamais de commit direct sur la branche principale
- Créer des branches descriptives : feat/T-001-nom-de-la-fonctionnalité, fix/T-012-description-du-bug

## Qualité du code

### Tests
- Chaque système critique doit avoir des tests unitaires
- Nommer les fichiers de test avec le suffixe `.test.ts`
- Les tests doivent être lisibles et maintenir un bon équilibre entre couvrage et lisibilité

### Performance
- Surveiller l'utilisation de la mémoire, particulièrement sur mobile
- Limiter le nombre de draw calls dans les scènes Phaser
- Optimiser les boucles de jeux et les calculs fréquents

## Sécurité

### Données
- Valider toutes les données chargées depuis IndexedDB ou les fichiers JSON
- Ne jamais faire confiance aux données externes sans validation

### Ressources
- Optimiser les images et audio pour réduire la taille de téléchargement
- Utiliser des formats adaptés au web (WebP pour les images quand possible, OGG/MP3 pour l'audio)

### Erreurs
- Ne jamais exposer les détails d'erreur interne à l'utilisateur
- Logger les erreurs en développement, afficher des messages génériques en production