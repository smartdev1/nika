// Save service for persisting game state to IndexedDB.
// No Phaser dependency: can be used from any context (scene, system, test).
import type { GameSave } from './SaveSchema';

const DB_NAME = 'LesEchosDeLaFracture';
const DB_VERSION = 1;
const STORE_NAME = 'save';
const SAVE_KEY = 'playerSave';

/**
 * Ouvre (ou crée) la base IndexedDB et retourne une promesse résolue avec l'instance IDBDatabase.
 * En cas d'erreur, la promesse est rejetée.
 */
function openDB(): Promise<IDBDatabase> {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
    request.onblocked = () => {
      console.warn(
        '[SaveService] IndexedDB opening is blocked, close other tabs using this database.'
      );
    };
  });
}

/**
 * Exécute une transaction sur le magasin 'save' et retourne le résultat de la requête.
 * @param mode - 'readonly' ou 'readwrite'
 * @param fn - fonction recevant l'object store et retournant une IDBRequest
 */
async function withStore<T>(
  mode: IDBTransactionMode,
  fn: (store: IDBObjectStore) => IDBRequest<T>
): Promise<T> {
  const db = await openDB();
  return new Promise<T>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, mode);
    const store = tx.objectStore(STORE_NAME);
    const req = fn(store);

    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
    tx.oncomplete = () => db.close();
    tx.onerror = () => reject(tx.error);
  });
}

/**
 * Service de sauvegarde local via IndexedDB.
 * Expose une instance unique (singleton) exportée par défaut.
 */
export class SaveService {
  private static instance: SaveService;

  private constructor() {
    // Singleton : instanciation contrôlée via getInstance()
  }

  /**
   * Retourne l'instance unique du service.
   */
  static getInstance(): SaveService {
    if (!SaveService.instance) {
      SaveService.instance = new SaveService();
    }
    return SaveService.instance;
  }

  /**
   * Sauvegarde l'état du jeu dans IndexedDB.
   * Remplace la donnée existante sous la clé 'playerSave'.
   * @param data - Objet de sauvegarde à persister (doit sérialiser en JSON)
   */
  async saveGame(data: GameSave): Promise<void> {
    try {
      const payload = {
        ...data,
        updatedAt: Date.now(),
      };
      await withStore('readwrite', (store) => store.put(payload, SAVE_KEY));
      console.log('[SaveService] Partie sauvegardée avec succès.');
    } catch (error) {
      // Les erreurs IndexedDB sont logguées mais ne bloquent pas le jeu.
      console.error('[SaveService] Échec de la sauvegarde:', error);
    }
  }

  /**
   * Charge l'état de sauvegarde depuis IndexedDB.
   * Retourne l'objet GameSave, ou null si aucune sauvegarde n'existe.
   * En cas d'erreur technique, retourne null et loggue l'erreur.
   */
  async loadGame(): Promise<GameSave | null> {
    try {
      const result = await withStore<GameSave | undefined>(
        'readonly',
        (store) => store.get(SAVE_KEY)
      );

      if (result === undefined) {
        return null;
      }
      return result as GameSave;
    } catch (error) {
      console.error('[SaveService] Échec du chargement:', error);
      return null;
    }
  }
}

export default SaveService.getInstance();
