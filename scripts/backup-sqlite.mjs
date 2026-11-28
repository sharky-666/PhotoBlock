import fs from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';

const databasePath =
  process.env.DB_PATH || '/srv/photoblock/shared/photoblock.sqlite';
const backupDirectory =
  process.env.BACKUP_DIR || '/srv/photoblock/shared/backups';
const retentionDays = Number(process.env.BACKUP_RETENTION_DAYS || '14');

fs.mkdirSync(backupDirectory, { recursive: true });
const timestamp = new Date()
  .toISOString()
  .replace(/[:.]/g, '-')
  .replace('T', '_')
  .replace('Z', '');
const destination = path.join(
  backupDirectory,
  `photoblock_${timestamp}.sqlite`,
);

const database = new DatabaseSync(databasePath);
try {
  const escapedDestination = destination.replace(/'/g, "''");
  database.exec(`VACUUM INTO '${escapedDestination}'`);
} finally {
  database.close();
}

const cutoff = Date.now() - retentionDays * 24 * 60 * 60 * 1000;
for (const entry of fs.readdirSync(backupDirectory)) {
  const file = path.join(backupDirectory, entry);
  if (!entry.endsWith('.sqlite') || !fs.statSync(file).isFile()) continue;
  if (fs.statSync(file).mtimeMs < cutoff) {
    fs.unlinkSync(file);
  }
}

console.log(`Backup created: ${destination}`);
