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

    let result: T | undefined;
    req.onsuccess = () => {
      result = req.result;
    };
    req.onerror = () => reject(req.error ?? new Error('IndexedDB request failed'));

    tx.oncomplete = () => {
      db.close();
      resolve(result as T);
    };
    tx.onerror = () => {
      db.close();
      reject(tx.error ?? new Error('IndexedDB transaction failed'));
    };
    tx.onabort = () => {
      db.close();
      reject(tx.error ?? new Error('IndexedDB transaction aborted'));
    };
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
    const payload = {
      ...data,
      updatedAt: Date.now(),
    };
    await withStore('readwrite', (store) => store.put(payload, SAVE_KEY));
    console.log('[SaveService] Partie sauvegardée avec succès.');
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
      // Validation simple du schéma + valeurs par défaut (T-031)
      const save: GameSave = {
        heroinePos: result.heroinePos ?? { x: 0, y: 0 },
        activatedStones: Array.isArray(result.activatedStones) ? result.activatedStones : [],
        defeatedEncounters: Array.isArray(result.defeatedEncounters) ? result.defeatedEncounters : [],
        dialogueProgress: typeof result.dialogueProgress === 'number' ? result.dialogueProgress : 0,
        updatedAt: typeof result.updatedAt === 'number' ? result.updatedAt : Date.now(),
      };
      return save;
    } catch (error) {
      console.error('[SaveService] Échec du chargement:', error);
      return null;
    }
  }
}

export default SaveService.getInstance();
