import { getDb } from '../db/init.js';

const db = getDb();

const orderId = 3;

console.log(`--- Debugging Order ${orderId} ---`);

db.get('SELECT * FROM orders WHERE id = ?', [orderId], (err, order) => {
    if (err) {
        console.error('Error fetching order:', err);
        return;
    }
    if (!order) {
        console.error('Order not found');
        return;
    }
    console.log('Order Details:', order);

    db.all('SELECT * FROM invoices WHERE order_id = ?', [orderId], (err, invoices) => {
        if (err) {
            console.error('Error fetching invoices:', err);
            return;
        }
        console.log('Existing Invoices:', invoices);

        // Also check if user is trying to create a duplicate invoice
        if (invoices.length > 0) {
            console.log('WARNING: Invoice already exists for this order.');
        }

        // Check for missing fields that might cause issues
        if (!order.buyer_id || !order.primary_supplier_id) {
            console.log('WARNING: Missing buyer_id or primary_supplier_id in order.');
        }
    });
});
