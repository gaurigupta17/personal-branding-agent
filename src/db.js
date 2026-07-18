/* ==========================================================================
   INDEXEDDB DATABASE SERVICE — personal-branding-agent
   ========================================================================== */

import { DB_CONFIG, CLIENT_TEMPLATE } from './constants.js';

class DatabaseService {
  constructor() {
    this.db = null;
  }

  // Initialize DB Connection
  init() {
    return new Promise((resolve, reject) => {
      if (this.db) {
        resolve(this.db);
        return;
      }

      const request = indexedDB.open(DB_CONFIG.NAME, DB_CONFIG.VERSION);

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains(DB_CONFIG.STORES.CLIENTS)) {
          db.createObjectStore(DB_CONFIG.STORES.CLIENTS, { keyPath: 'id' });
        }
      };

      request.onsuccess = (event) => {
        this.db = event.target.result;
        resolve(this.db);
      };

      request.onerror = (event) => {
        console.error('IndexedDB opening error:', event.target.error);
        reject(event.target.error);
      };
    });
  }

  // Helper to get read/write transaction and store
  _getStore(mode = 'readonly') {
    const transaction = this.db.transaction(DB_CONFIG.STORES.CLIENTS, mode);
    const store = transaction.objectStore(DB_CONFIG.STORES.CLIENTS);
    return { store, transaction };
  }

  // Get all clients
  getClients() {
    return new Promise(async (resolve, reject) => {
      try {
        await this.init();
        const { store } = this._getStore();
        const request = store.getAll();

        request.onsuccess = () => {
          // Sort by lastUpdated desc
          const clients = request.result || [];
          clients.sort((a, b) => b.lastUpdated - a.lastUpdated);
          resolve(clients);
        };

        request.onerror = (event) => reject(event.target.error);
      } catch (err) {
        reject(err);
      }
    });
  }

  // Get single client by ID
  getClient(id) {
    return new Promise(async (resolve, reject) => {
      try {
        await this.init();
        const { store } = this._getStore();
        const request = store.get(id);

        request.onsuccess = () => resolve(request.result || null);
        request.onerror = (event) => reject(event.target.error);
      } catch (err) {
        reject(err);
      }
    });
  }

  // Save or update client (recalculates progress % and updates timestamps)
  saveClient(clientData) {
    return new Promise(async (resolve, reject) => {
      try {
        await this.init();
        const { store, transaction } = this._getStore('readwrite');
        
        // Setup default templates if saving new
        const client = {
          ...JSON.parse(JSON.stringify(CLIENT_TEMPLATE)),
          ...clientData,
          lastUpdated: Date.now()
        };

        if (!client.createdAt) {
          client.createdAt = Date.now();
        }

        // Calculate progress completion
        client.profileCompletion = this.calculateCompletion(client);

        const request = store.put(client);

        request.onsuccess = () => resolve(client);
        request.onerror = (event) => reject(event.target.error);
      } catch (err) {
        reject(err);
      }
    });
  }

  // Delete client by ID
  deleteClient(id) {
    return new Promise(async (resolve, reject) => {
      try {
        await this.init();
        const { store } = this._getStore('readwrite');
        const request = store.delete(id);

        request.onsuccess = () => resolve(true);
        request.onerror = (event) => reject(event.target.error);
      } catch (err) {
        reject(err);
      }
    });
  }

  // Duplicate client
  duplicateClient(id) {
    return new Promise(async (resolve, reject) => {
      try {
        const original = await this.getClient(id);
        if (!original) {
          reject(new Error('Client not found'));
          return;
        }

        // Deep copy, assign new ID and title
        const clone = JSON.parse(JSON.stringify(original));
        clone.id = 'client_' + Math.random().toString(36).substr(2, 9);
        clone.name = `${original.name} (Copy)`;
        clone.createdAt = Date.now();
        clone.lastUpdated = Date.now();

        await this.saveClient(clone);
        resolve(clone);
      } catch (err) {
        reject(err);
      }
    });
  }

  // Profile Completion Percentage Calculator
  calculateCompletion(client) {
    let score = 0;
    let totalPossible = 0;

    // 1. Required fields: Name, Designation, Company, Industry (Worth 10% each = 40% total)
    const requiredFields = ['name', 'designation', 'company', 'industry'];
    requiredFields.forEach(f => {
      totalPossible += 10;
      if (client[f] && client[f].trim() !== '') {
        score += 10;
      }
    });

    // 2. Optional basicInfo fields (45 fields total - worth 1% each = 45% total)
    const basicKeys = Object.keys(client.basicInfo || {});
    basicKeys.forEach(f => {
      totalPossible += 1;
      if (client.basicInfo[f] && String(client.basicInfo[f]).trim() !== '') {
        score += 1;
      }
    });

    // 3. Knowledge Base fields: Additional Info, Files (Worth 15% total)
    totalPossible += 10; // Additional Info
    if (client.knowledge && client.knowledge.additionalInfo && client.knowledge.additionalInfo.trim() !== '') {
      score += 10;
    }

    totalPossible += 5; // Files uploaded
    if (client.knowledge && client.knowledge.files && client.knowledge.files.length > 0) {
      score += 5;
    }

    const percentage = Math.round((score / totalPossible) * 100);
    return Math.min(100, Math.max(0, percentage));
  }
}

export const db = new DatabaseService();
export default db;
