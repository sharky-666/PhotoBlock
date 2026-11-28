import fs from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';

const databasePath = process.argv[2];
const sqlPath = process.argv[3];

if (!databasePath || !sqlPath) {
  throw new Error('Usage: node init-sqlite.mjs <database-path> <sql-path>');
}
if (fs.existsSync(databasePath)) {
  throw new Error(`Database already exists: ${databasePath}`);
}

fs.mkdirSync(path.dirname(databasePath), { recursive: true });
const database = new DatabaseSync(databasePath);
try {
  database.exec(fs.readFileSync(sqlPath, 'utf8'));
  database.exec('PRAGMA journal_mode = WAL');
  database.exec('PRAGMA foreign_keys = ON');
} catch (error) {
  database.close();
  fs.rmSync(databasePath, { force: true });
  throw error;
}

console.log(`Imported SQL into ${databasePath}`);
database.close();
