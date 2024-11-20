/**
 * @fileoverview Database configuration and initialization using Dexie.js for IndexedDB.
 * @author zpl
 * @created 2024-11-20
 */

import { PlaygroundMessage } from '@/stores/playground'
import Dexie, { Table } from 'dexie'

/**
 * PlaygroundDB class extends Dexie to provide IndexedDB functionality.
 * Manages message storage for the playground feature.
 * 
 * @class
 * @extends {Dexie}
 * @property {Table<PlaygroundMessage>} messages - Table for storing playground messages
 */
export class PlaygroundDB extends Dexie {
  messages!: Table<PlaygroundMessage>

  /**
   * Initializes the PlaygroundDB database.
   * Creates database schema with version 1.
   * 
   * @constructor
   * @description Sets up the database with a 'messages' table containing:
   *   - id (auto-incrementing primary key)
   *   - role (indexed)
   *   - timestamp (indexed)
   */
  constructor() {
    super('PlaygroundDB')
    
    this.version(1).stores({
      messages: '++id, role, timestamp'
    })
  }
}

/**
 * Singleton instance of PlaygroundDB.
 * Use this instance for all database operations.
 * 
 * @constant
 * @type {PlaygroundDB}
 */
export const db = new PlaygroundDB()