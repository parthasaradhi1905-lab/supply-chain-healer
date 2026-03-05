import sqlite3Pkg from 'sqlite3';
const sqlite3 = sqlite3Pkg.verbose();

const db = new sqlite3.Database('./aegis.db');

db.serialize(() => {
    console.log('🔧 Migrating users table...');

    // 1. Create new table with correct constraint
    db.run(`CREATE TABLE IF NOT EXISTS users_new (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL,
        password_hash TEXT NOT NULL,
        role TEXT NOT NULL CHECK(role IN ('buyer', 'supplier', 'admin')),
        company_name TEXT,
        email TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(username, role)
    )`, (err) => {
        if (err) { console.error('Create failed:', err.message); return; }
        console.log('  ✓ Created users_new table');
    });

    // 2. Copy data
    db.run(`INSERT INTO users_new SELECT * FROM users`, (err) => {
        if (err) { console.error('Copy failed:', err.message); return; }
        console.log('  ✓ Copied user data');
    });

    // 3. Drop old table
    db.run(`DROP TABLE users`, (err) => {
        if (err) { console.error('Drop failed:', err.message); return; }
        console.log('  ✓ Dropped old users table');
    });

    // 4. Rename new table
    db.run(`ALTER TABLE users_new RENAME TO users`, (err) => {
        if (err) { console.error('Rename failed:', err.message); return; }
        console.log('  ✓ Renamed users_new → users');
    });

    // 5. Verify
    db.all('SELECT id, username, role, company_name FROM users', (err, rows) => {
        if (err) { console.error('Verify failed:', err.message); return; }
        console.log('\n✅ Migration complete! Users:');
        rows.forEach(u => console.log(`  ${u.id}. ${u.username} [${u.role}] - ${u.company_name}`));
        db.close();
    });
});
