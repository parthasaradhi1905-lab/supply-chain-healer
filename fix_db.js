const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'server/database.sqlite');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database', err.message);
        process.exit(1);
    }
});

db.serialize(() => {
    db.all("SELECT * FROM invoices WHERE status = 'approved'", [], (err, invoices) => {
        if (err) {
            console.error(err);
            process.exit(1);
        }

        let fixed = 0;
        invoices.forEach(inv => {
            db.run("UPDATE orders SET status = 'active' WHERE id = ? AND status = 'pending_invoice'", [inv.order_id], function (updateErr) {
                if (updateErr) {
                    console.error('Update error on order', inv.order_id, updateErr);
                } else if (this.changes > 0) {
                    console.log('Fixed order ' + inv.order_id + ' to active.');
                    fixed++;
                }
            });
        });

        setTimeout(() => {
            console.log(`Finished fixing ${fixed} broken order states.`);
            db.close();
        }, 1000);
    });
});
