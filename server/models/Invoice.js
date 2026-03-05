import { getDb } from '../db/init.js';

class Invoice {
    /**
     * Create a new invoice
     */
    static create(data) {
        return new Promise((resolve, reject) => {
            const db = getDb();
            const {
                invoice_number, order_id, supplier_id, buyer_id,
                subtotal, tax_rate, tax_amount, shipping_cost, total_amount,
                issue_date, due_date
            } = data;

            db.run(
                `INSERT INTO invoices (
                    invoice_number, order_id, supplier_id, buyer_id,
                    subtotal, tax_rate, tax_amount, shipping_cost, total_amount,
                    status, issue_date, due_date
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending_approval', ?, ?)`,
                [
                    invoice_number, order_id, supplier_id, buyer_id,
                    subtotal, tax_rate, tax_amount, shipping_cost, total_amount,
                    issue_date, due_date
                ],
                function (err) {
                    if (err) reject(err);
                    else resolve({ id: this.lastID, success: true });
                }
            );
        });
    }

    /**
     * Find invoice by ID with all details
     */
    static findById(id) {
        return new Promise((resolve, reject) => {
            const db = getDb();
            db.get(
                `SELECT 
                    invoices.*,
                    orders.product_name, orders.quantity, orders.unit_price,
                    users.company_name as buyer_company, users.email as buyer_email,
                    suppliers.name as supplier_name, suppliers.location as supplier_address, suppliers.contact_email as supplier_email
                 FROM invoices
                 JOIN orders ON invoices.order_id = orders.id
                 JOIN users ON invoices.buyer_id = users.id
                 JOIN suppliers ON invoices.supplier_id = suppliers.id
                 WHERE invoices.id = ?`,
                [id],
                (err, row) => {
                    if (err) reject(err);
                    else resolve(row);
                }
            );
        });
    }

    /**
     * Find invoice by Order ID
     */
    static findByOrderId(orderId) {
        return new Promise((resolve, reject) => {
            const db = getDb();
            db.get(
                `SELECT * FROM invoices WHERE order_id = ?`,
                [orderId],
                (err, row) => {
                    if (err) reject(err);
                    else resolve(row);
                }
            );
        });
    }

    /**
     * Get invoices for a specific role (buyer or supplier)
     */
    static findByRole(role, id) {
        return new Promise((resolve, reject) => {
            const db = getDb();
            const query = role === 'buyer'
                ? `SELECT 
                        invoices.*, 
                        suppliers.name as supplier_name,
                        orders.product_name
                   FROM invoices
                   JOIN suppliers ON invoices.supplier_id = suppliers.id
                   JOIN orders ON invoices.order_id = orders.id
                   WHERE invoices.buyer_id = ?
                   ORDER BY invoices.created_at DESC`
                : `SELECT 
                        invoices.*, 
                        users.company_name as buyer_company,
                        orders.product_name
                   FROM invoices
                   JOIN users ON invoices.buyer_id = users.id
                   JOIN orders ON invoices.order_id = orders.id
                   WHERE invoices.supplier_id = ?
                   ORDER BY invoices.created_at DESC`;

            db.all(query, [id], (err, rows) => {
                if (err) reject(err);
                else resolve(rows || []);
            });
        });
    }

    /**
     * Update invoice status
     */
    static updateStatus(id, status, rejectionReason = null) {
        return new Promise((resolve, reject) => {
            const db = getDb();
            const approvedAt = status === 'approved' ? new Date().toISOString() : null;

            db.run(
                `UPDATE invoices 
                 SET status = ?, rejection_reason = ?, approved_at = COALESCE(?, approved_at)
                 WHERE id = ?`,
                [status, rejectionReason, approvedAt, id],
                function (err) {
                    if (err) reject(err);
                    else resolve({ success: this.changes > 0 });
                }
            );
        });
    }
}

export default Invoice;
