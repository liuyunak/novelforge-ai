import initSqlJs, { Database as SqlJsDatabase } from 'sql.js';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';
import { initSchema } from './schema.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const require = createRequire(import.meta.url);

export interface Statement {
  run(...params: any[]): { changes: number; lastInsertRowid: number };
  get(...params: any[]): any;
  all(...params: any[]): any[];
}

export interface Database {
  exec(sql: string): void;
  prepare(sql: string): Statement;
  pragma(sql: string): void;
  close(): void;
  export(): Uint8Array;
}

let db: Database | null = null;
let dbFilePath: string = '';
let saveTimer: ReturnType<typeof setTimeout> | null = null;

function wrapDatabase(sqlDb: SqlJsDatabase): Database {
  return {
    exec(sql: string) {
      sqlDb.run(sql);
      scheduleSave();
    },
    prepare(sql: string): Statement {
      return {
        run(...params: any[]) {
          const stmt = sqlDb.prepare(sql);
          stmt.run(params);
          stmt.free();
          scheduleSave();
          return {
            changes: sqlDb.getRowsModified(),
            lastInsertRowid: Number(sqlDb.exec('SELECT last_insert_rowid() as id')[0].values[0][0]),
          };
        },
        get(...params: any[]) {
          const stmt = sqlDb.prepare(sql);
          stmt.bind(params);
          let result: any = undefined;
          if (stmt.step()) {
            result = stmt.getAsObject();
          }
          stmt.free();
          return result;
        },
        all(...params: any[]) {
          const stmt = sqlDb.prepare(sql);
          stmt.bind(params);
          const results: any[] = [];
          while (stmt.step()) {
            results.push(stmt.getAsObject());
          }
          stmt.free();
          return results;
        },
      };
    },
    pragma(sql: string) {
      sqlDb.run(`PRAGMA ${sql}`);
    },
    close() {
      sqlDb.close();
    },
    export() {
      return sqlDb.export();
    },
  };
}

function scheduleSave() {
  if (saveTimer) {
    clearTimeout(saveTimer);
  }
  saveTimer = setTimeout(() => {
    saveToDisk();
  }, 500);
}

function saveToDisk() {
  if (!db || !dbFilePath) return;
  try {
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(dbFilePath, buffer);
  } catch (error) {
    console.error('Failed to save database:', error);
  }
}

export function getDb(): Database {
  if (!db) {
    throw new Error('Database not initialized');
  }
  return db;
}

export async function initDb() {
  const dataDir = path.resolve(__dirname, '../../data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  dbFilePath = path.join(dataDir, 'novelforge.db');

  const SQL = await initSqlJs({
    locateFile: (file: string) => {
      return path.join(path.dirname(require.resolve('sql.js')), file);
    },
  });

  let sqlDb: SqlJsDatabase;
  if (fs.existsSync(dbFilePath)) {
    const fileBuffer = fs.readFileSync(dbFilePath);
    sqlDb = new SQL.Database(fileBuffer);
  } else {
    sqlDb = new SQL.Database();
  }

  db = wrapDatabase(sqlDb);
  db.pragma('foreign_keys = ON');

  initSchema(db);

  saveToDisk();

  console.log(`Database initialized at ${dbFilePath}`);
  return db;
}
