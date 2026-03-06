import sqlite3Pkg from 'sqlite3';
const sqlite3 = sqlite3Pkg.verbose();
const db = new sqlite3.Database('./aegis.db');

db.all('SELECT id, username, role FROM users', (err, rows) => {
    if (err) {
        console.error(err);
    } else {
        console.log('User List:');
        console.table(rows);
    }
    db.close();
});
