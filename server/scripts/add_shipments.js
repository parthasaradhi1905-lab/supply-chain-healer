import sqlite3 from 'sqlite3';

const db = new sqlite3.Database('./aegis.db');

const newShipments = [
    [2, 2, 'Shenzhen → Seattle', 'air', 'in_transit', 'Anchorage, Alaska', '2026-02-05', '2026-02-12 08:00:00', '[]'],
    [1, 5, 'Detroit → Chicago → New York', 'road', 'in_transit', 'Toledo, Ohio', '2026-02-03', '2026-02-08 16:00:00', '[]'],
    [2, 9, 'Berlin → Warsaw → Moscow', 'rail', 'delayed', 'Warsaw, Poland', '2026-01-28', '2026-02-18 12:00:00', '[]'],
    [1, 7, 'Dubai → Mumbai → Chennai', 'air', 'delivered', 'Chennai, India', '2026-01-10', '2026-01-12 09:00:00', '[]'],
    [2, 11, 'Mexico City → Houston → Dallas', 'road', 'in_transit', 'San Antonio, Texas', '2026-02-06', '2026-02-09 18:00:00', '[]']
];

db.serialize(() => {
    newShipments.forEach(s => {
        db.get('SELECT id FROM shipments WHERE route = ?', [s[2]], (err, row) => {
            if (!row) {
                db.run(
                    'INSERT INTO shipments (order_id, supplier_id, route, transport_mode, status, current_location, departure_date, eta, tracking_updates) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
                    s,
                    function (err) {
                        if (err) console.error('Error:', err.message);
                        else console.log('Added:', s[2], '(' + s[3] + ')');
                    }
                );
            } else {
                console.log('Exists:', s[2]);
            }
        });
    });

    // Show all shipments after inserts
    setTimeout(() => {
        db.all('SELECT id, route, transport_mode, status FROM shipments', (err, rows) => {
            console.log('\nAll shipments:');
            rows.forEach(s => console.log(' ', s.id + '.', s.route, '[' + s.transport_mode + ']', '-', s.status));
            db.close();
        });
    }, 1000);
});
