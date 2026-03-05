import sqlite3 from 'sqlite3';
import { fileURLToPath } from 'url';
import { dirname as pathDirname, join } from 'path';
import { readFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = pathDirname(__filename);

const DB_PATH = process.env.DATABASE_PATH || './aegis.db';

// Initialize database with schema
export function initDatabase() {
  console.log('🔧 Initializing Aegis Nexus Database...');

  const db = new sqlite3.Database(DB_PATH);

  // Enable foreign keys
  db.run('PRAGMA foreign_keys = ON');

  // Read and execute schema
  const schemaPath = join(__dirname, 'schema.sql');
  const schema = readFileSync(schemaPath, 'utf-8');

  db.exec(schema, (err) => {
    if (err) {
      console.error('❌ Database schema creation failed:', err);
      process.exit(1);
    }
    console.log('✅ Database schema created successfully!');
    console.log(`📍 Location: ${DB_PATH}`);
    db.close();
  });

  return db;
}

// Singleton database connection
let dbInstance = null;

// Get database connection
export function getDb() {
  if (dbInstance) return dbInstance;

  dbInstance = new sqlite3.Database(DB_PATH, (err) => {
    if (err) {
      console.error('❌ Could not connect to database', err);
    }
  });

  dbInstance.serialize(() => {
    dbInstance.run('PRAGMA foreign_keys = ON');
    dbInstance.run('PRAGMA journal_mode = WAL'); // Enable Write-Ahead Logging for concurrency
  });

  return dbInstance;
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  initDatabase();
}
