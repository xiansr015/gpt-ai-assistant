import fs from 'fs';
import path from 'path';
import config from '../config/index.js';

// Jest 29 and eslint-plugin-import cannot resolve `node:sqlite` as a static import
const { DatabaseSync } = process.getBuiltinModule('node:sqlite');

export const TABLE_SOURCES = 'sources';
export const TABLE_HISTORIES = 'histories';
export const TABLE_PROMPTS = 'prompts';

const TABLES = [TABLE_SOURCES, TABLE_HISTORIES, TABLE_PROMPTS];

class Storage {
  /**
   * @type {DatabaseSync}
   */
  db;

  initialize() {
    if (this.db) return;
    const file = config.APP_DB_PATH;
    if (file !== ':memory:') fs.mkdirSync(path.dirname(file), { recursive: true });
    this.db = new DatabaseSync(file);
    this.db.exec('PRAGMA journal_mode = WAL');
    this.db.exec('PRAGMA busy_timeout = 5000');
    TABLES.forEach((table) => {
      this.db.exec(`CREATE TABLE IF NOT EXISTS ${table} (id TEXT PRIMARY KEY, data TEXT NOT NULL)`);
    });
  }

  /**
   * @param {string} table
   * @param {string} id
   * @returns {Object|undefined}
   */
  getItem(table, id) {
    this.initialize();
    const row = this.db.prepare(`SELECT data FROM ${table} WHERE id = ?`).get(id);
    return row ? JSON.parse(row.data) : undefined;
  }

  /**
   * @param {string} table
   * @param {string} id
   * @param {Object} value
   */
  setItem(table, id, value) {
    this.initialize();
    this.db.prepare(`INSERT INTO ${table} (id, data) VALUES (?, ?) ON CONFLICT (id) DO UPDATE SET data = excluded.data`).run(id, JSON.stringify(value));
  }

  /**
   * @param {string} table
   * @param {string} id
   */
  removeItem(table, id) {
    this.initialize();
    this.db.prepare(`DELETE FROM ${table} WHERE id = ?`).run(id);
  }

  /**
   * @param {string} table
   * @returns {Array<string>}
   */
  keys(table) {
    this.initialize();
    return this.db.prepare(`SELECT id FROM ${table}`).all().map(({ id }) => id);
  }

  /**
   * @param {string} table
   * @param {string} field
   * @param {string} value
   * @returns {number}
   */
  count(table, field, value) {
    this.initialize();
    const { total } = this.db.prepare(`SELECT COUNT(*) AS total FROM ${table} WHERE json_extract(data, ?) = ?`).get(`$.${field}`, value);
    return total;
  }

  close() {
    if (!this.db) return;
    this.db.close();
    this.db = null;
  }
}

const storage = new Storage();

export default storage;
