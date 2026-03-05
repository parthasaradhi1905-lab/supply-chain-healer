import { getDb } from '../db/init.js';

const db = getDb();

const orderId = 3;

console.log(`--- Cleaning Invoices for Order ${orderId} ---`);

// Delete all invoices for order 3
db.run('DELETE FROM invoices WHERE order_id = ?', [orderId], function (err) {
    if (err) {
        console.error('Error deleting invoices:', err);
        return;
    }
    console.log(`Deleted ${this.changes} invoices for Order ${orderId}.`);

    // Check if order status is now confusing?
    // User might need to recreate invoice.
    // Order status should be 'pending_invoice'
    // I'll ensure order status is 'pending_invoice'

    db.run('UPDATE orders SET status = "pending_invoice" WHERE id = ?', [orderId], function (err) {
        if (err) {
            console.error('Error resetting order status:', err);
            return;
        }
        console.log(`Reset Order ${orderId} status to 'pending_invoice'.`);
    });
});
